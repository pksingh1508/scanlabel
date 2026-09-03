import { DEFAULT_ANALYSIS_MODEL } from '@/lib/analysis/openrouter';
import { ANALYZE_MAX_BODY_BYTES, validateAnalyzeRequest } from '@/lib/analysis/request';
import { analyzeScan } from '@/lib/analysis/service';

/**
 * Stateless analysis endpoint. No authentication, no database, no persistence.
 *
 * POST /api/analyze
 *   validate request → check server config → OpenRouter structured analysis
 *   (one controlled retry) → runtime-validate model output → deterministic
 *   fixes → return normalized JSON.
 *
 * Success responses are the `ProductAnalysis` object directly; errors are
 * `{ error: { code, message } }` with non-technical, UI-safe messages.
 */

type LogFields = {
  requestId: string;
  elapsedMs: number;
  status: number;
  source?: string;
  imageCount?: number;
  barcodePresent?: boolean;
  errorCode?: string;
};

/**
 * Sanitized request logging only. Never log image base64, label text,
 * API keys, or full provider payloads.
 */
function log(fields: LogFields): void {
  console.log(JSON.stringify({ scope: 'analyze', ...fields }));
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  logFields: Omit<LogFields, 'status' | 'errorCode'>,
): Response {
  log({ ...logFields, status, errorCode: code });
  return Response.json({ error: { code, message } }, { status });
}

export async function POST(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  const started = Date.now();
  const base = { requestId, elapsedMs: 0 };

  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return errorResponse(400, 'invalid_content_type', 'That request format is not supported.', {
        ...base,
        elapsedMs: Date.now() - started,
      });
    }

    const contentLengthHeader = request.headers.get('content-length');
    if (contentLengthHeader !== null) {
      const declared = Number(contentLengthHeader);
      if (Number.isFinite(declared) && declared > ANALYZE_MAX_BODY_BYTES) {
        return errorResponse(413, 'request_too_large', 'That scan is too large to analyze.', {
          ...base,
          elapsedMs: Date.now() - started,
        });
      }
    }

    let text: string;
    try {
      text = await request.text();
    } catch {
      return errorResponse(400, 'unreadable_body', 'That scan could not be read. Try scanning again.', {
        ...base,
        elapsedMs: Date.now() - started,
      });
    }
    if (text.length > ANALYZE_MAX_BODY_BYTES) {
      return errorResponse(413, 'request_too_large', 'That scan is too large to analyze.', {
        ...base,
        elapsedMs: Date.now() - started,
      });
    }

    let body: unknown;
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      return errorResponse(400, 'malformed_json', 'That scan request was not understood. Try scanning again.', {
        ...base,
        elapsedMs: Date.now() - started,
      });
    }

    const validated = validateAnalyzeRequest(body);
    if (!validated.ok) {
      return errorResponse(validated.error.status, validated.error.code, validated.error.message, {
        ...base,
        elapsedMs: Date.now() - started,
        imageCount: Array.isArray((body as { images?: unknown }).images)
          ? ((body as { images: unknown[] }).images.length ?? 0)
          : 0,
      });
    }

    // Server-only key and model. Missing key is a controlled 503, never a
    // stack trace. The model slug stays overrideable via server-only env so
    // the app never couples to one forever-fixed model.
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return errorResponse(503, 'server_unavailable', 'Analysis is temporarily unavailable. Try again later.', {
        ...base,
        elapsedMs: Date.now() - started,
        imageCount: validated.request.images.length,
        barcodePresent: Boolean(validated.request.barcode),
      });
    }
    const timeoutRaw = Number(process.env.ANALYSIS_TIMEOUT_MS ?? 30000);
    const timeoutMs = Number.isFinite(timeoutRaw) && timeoutRaw > 0 ? Math.min(timeoutRaw, 120000) : 30000;

    const result = await analyzeScan(validated.request, {
      apiKey,
      model: process.env.OPENROUTER_ANALYSIS_MODEL ?? DEFAULT_ANALYSIS_MODEL,
      ...(process.env.OPENROUTER_SITE_URL ? { siteUrl: process.env.OPENROUTER_SITE_URL } : {}),
      appName: process.env.OPENROUTER_APP_NAME ?? 'ScanLabel',
      timeoutMs,
    });
    if (!result.ok) {
      if (result.error.code === 'rate_limited') {
        return errorResponse(429, 'rate_limited', 'Too many analyses right now. Wait a moment and try again.', {
          ...base,
          elapsedMs: Date.now() - started,
          imageCount: validated.request.images.length,
          barcodePresent: Boolean(validated.request.barcode),
        });
      }
      if (result.error.code === 'provider_unauthorized') {
        return errorResponse(
          503,
          'server_unavailable',
          'Analysis is temporarily unavailable. Try again later.',
          {
            ...base,
            elapsedMs: Date.now() - started,
            imageCount: validated.request.images.length,
            barcodePresent: Boolean(validated.request.barcode),
          },
        );
      }
      if (result.error.code === 'invalid_result') {
        return errorResponse(500, 'invalid_result', 'Analysis failed validation. Try again later.', {
          ...base,
          elapsedMs: Date.now() - started,
          imageCount: validated.request.images.length,
          barcodePresent: Boolean(validated.request.barcode),
        });
      }
      return errorResponse(503, 'provider_unavailable', 'Analysis is temporarily unavailable. Try again later.', {
        ...base,
        elapsedMs: Date.now() - started,
        imageCount: validated.request.images.length,
        barcodePresent: Boolean(validated.request.barcode),
      });
    }

    log({
      ...base,
      elapsedMs: Date.now() - started,
      status: 200,
      source: result.analysis.source,
      imageCount: validated.request.images.length,
      barcodePresent: Boolean(validated.request.barcode),
    });
    return Response.json(result.analysis, { status: 200 });
  } catch {
    return errorResponse(500, 'internal_error', 'Something went wrong. Try again later.', {
      ...base,
      elapsedMs: Date.now() - started,
    });
  }
}

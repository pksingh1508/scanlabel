/**
 * SERVER-ONLY gateway client for OpenRouter chat completions.
 *
 * WARNING: never import this module (or service.ts, which uses it) from
 * client-side code. Only `src/app/api/analyze+api.ts` may import it — the
 * Expo secret-stripping guarantee covers `+api.ts` files and their imports.
 * Verified by grep in Step 9/12 checks: no `openrouter` import outside
 * `src/app/api/` and `src/lib/analysis/service.ts`.
 */

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Verified 2026-09-03 against OpenRouter model metadata: vision input plus
 * structured-output support at $0.10/$0.40 per MTok. Re-check periodically —
 * override anytime via server-only `OPENROUTER_ANALYSIS_MODEL`.
 */
export const DEFAULT_ANALYSIS_MODEL = 'google/gemini-2.5-flash-lite';

export type OpenRouterCallOptions = {
  apiKey: string;
  model: string;
  siteUrl?: string;
  appName?: string;
  timeoutMs?: number;
  /** Tests only. Production always uses OPENROUTER_BASE_URL. */
  endpoint?: string;
};

export type OpenRouterCallResult =
  | { ok: true; content: unknown }
  | {
      ok: false;
      error: { kind: 'unauthorized' | 'rate_limited' | 'transient' | 'bad_request' | 'invalid_json' };
    };

export type ChatMessageInput = {
  role: 'system' | 'user';
  content: unknown;
};

function isTimeoutError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const name = (error as { name?: unknown }).name;
    return name === 'AbortError' || name === 'TimeoutError';
  }
  return false;
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith('```')) return trimmed;
  return trimmed
    .replace(/^```[a-zA-Z]*\n?/, '')
    .replace(/\n?```\s*$/, '')
    .trim();
}

/**
 * Single non-streaming structured-output call. No retries here — the caller
 * (service.ts) owns the one-retry policy so attempts stay countable.
 */
export async function requestStructuredAnalysis(
  messages: ChatMessageInput[],
  responseFormat: unknown,
  options: OpenRouterCallOptions,
): Promise<OpenRouterCallResult> {
  const endpoint = options.endpoint ?? `${OPENROUTER_BASE_URL}/chat/completions`;
  const timeoutMs = options.timeoutMs ?? 30000;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${options.apiKey}`,
    'Content-Type': 'application/json',
  };
  if (options.siteUrl) headers['HTTP-Referer'] = options.siteUrl;
  if (options.appName) headers['X-Title'] = options.appName;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: options.model,
        messages,
        response_format: responseFormat,
        provider: { require_parameters: true },
        stream: false,
      }),
    });

    if (response.status === 401 || response.status === 403) {
      return { ok: false, error: { kind: 'unauthorized' } };
    }
    if (response.status === 402 || response.status === 429) {
      return { ok: false, error: { kind: 'rate_limited' } };
    }
    if (response.status < 200 || response.status >= 300) {
      if (response.status >= 500 && response.status <= 599) {
        return { ok: false, error: { kind: 'transient' } };
      }
      return { ok: false, error: { kind: 'bad_request' } };
    }

    let body: unknown;
    try {
      body = (await response.json()) as unknown;
    } catch {
      return { ok: false, error: { kind: 'invalid_json' } };
    }
    const content =
      typeof body === 'object' && body !== null
        ? (body as { choices?: { message?: { content?: unknown } }[] }).choices?.[0]?.message?.content
        : undefined;
    if (typeof content !== 'string' || content.trim().length === 0) {
      return { ok: false, error: { kind: 'invalid_json' } };
    }
    try {
      return { ok: true, content: JSON.parse(stripCodeFences(content)) as unknown };
    } catch {
      return { ok: false, error: { kind: 'invalid_json' } };
    }
  } catch (error) {
    if (isTimeoutError(error)) return { ok: false, error: { kind: 'transient' } };
    return { ok: false, error: { kind: 'transient' } };
  } finally {
    clearTimeout(timeout);
  }
}

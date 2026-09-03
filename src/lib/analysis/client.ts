import type { ProductAnalysis } from '@/types/analysis';

import { parseProductAnalysis } from './schema';

/**
 * Minimal typed caller for the stateless `/api/analyze` route.
 * No UI wiring here — Step 10 connects the scan pipeline to this client.
 * Responses are always runtime-validated; nothing from the network is trusted.
 */

export const ANALYSIS_ENDPOINT = '/api/analyze';
export const ANALYSIS_CLIENT_TIMEOUT_MS = 30000;

export type AnalysisClientBody = {
  barcode?: string;
  openFoodFacts?: Record<string, unknown>;
  images?: { mimeType: 'image/jpeg' | 'image/png'; base64: string }[];
};

export type AnalysisClientError = {
  code: 'network' | 'timeout' | 'rejected' | 'unavailable' | 'invalid_response';
  message: string;
};

export type RequestAnalysisResult =
  | { ok: true; analysis: ProductAnalysis }
  | { ok: false; error: AnalysisClientError };

export type RequestAnalysisOptions = {
  timeoutMs?: number;
  /** Absolute URL in tests; relative endpoint on device. */
  endpoint?: string;
};

function safeServerMessage(value: unknown): string | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const message = (value as { error?: { message?: unknown } }).error?.message;
    if (typeof message === 'string' && message.trim().length > 0) {
      // Server messages are non-technical by construction; cap just in case.
      return message.trim().slice(0, 300);
    }
  }
  return null;
}

/**
 * POST a scan to the analysis route and return a validated result.
 * Never throws; every failure maps to a safe, non-technical message.
 */
export async function requestAnalysis(
  body: AnalysisClientBody,
  options?: RequestAnalysisOptions,
): Promise<RequestAnalysisResult> {
  const timeoutMs = options?.timeoutMs ?? ANALYSIS_CLIENT_TIMEOUT_MS;
  const endpoint = options?.endpoint ?? ANALYSIS_ENDPOINT;

  let payload: string;
  try {
    payload = JSON.stringify(body);
  } catch {
    return {
      ok: false,
      error: { code: 'invalid_response', message: 'That scan could not be sent. Try scanning again.' },
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      signal: controller.signal,
    });

    let parsed: unknown = null;
    try {
      parsed = (await response.json()) as unknown;
    } catch {
      parsed = null;
    }

    if (!response.ok) {
      if (response.status === 503 || response.status === 500) {
        return {
          ok: false,
          error: {
            code: 'unavailable',
            message: safeServerMessage(parsed) ?? 'Analysis is temporarily unavailable. Try again later.',
          },
        };
      }
      return {
        ok: false,
        error: {
          code: 'rejected',
          message: safeServerMessage(parsed) ?? 'That scan was rejected. Try scanning again.',
        },
      };
    }

    const validated = parseProductAnalysis(parsed);
    if (!validated.ok) {
      return {
        ok: false,
        error: {
          code: 'invalid_response',
          message: 'The analysis result was unreadable. Try scanning again.',
        },
      };
    }
    return { ok: true, analysis: validated.data };
  } catch (error) {
    const name = typeof error === 'object' && error !== null ? (error as { name?: unknown }).name : null;
    if (name === 'AbortError' || name === 'TimeoutError') {
      return {
        ok: false,
        error: { code: 'timeout', message: 'Analysis took too long. Check your connection and try again.' },
      };
    }
    return {
      ok: false,
      error: {
        code: 'network',
        message: "You're offline. Connect to the internet to analyze this label.",
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

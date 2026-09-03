import { Platform } from 'react-native';

import { normalizeBarcode } from '@/lib/barcode/normalizeBarcode';
import { normalizeOffProduct } from '@/lib/open-food-facts/normalize';
import type {
  NormalizedOffProduct,
  OffLookupError,
  OffLookupResult,
  OffRawProduct,
  OffV2SuccessResponse,
  OffV3SuccessResponse,
} from '@/lib/open-food-facts/types';

const OFF_V3_BASE = 'https://world.openfoodfacts.org/api/v3/product';
const OFF_V2_BASE = 'https://world.openfoodfacts.org/api/v2/product';

// Identifying contact string required by Open Food Facts. No secrets here.
const OFF_USER_AGENT = 'ScanLabel/1.0 (https://github.com/scanlabel; contact: support@scanlabel.app)';

const OFF_FIELDS = [
  'code',
  'product_name',
  'brands',
  'quantity',
  'serving_size',
  'ingredients_text',
  'ingredients',
  'allergens',
  'allergens_tags',
  'traces_tags',
  'additives_tags',
  'nutriments',
  'nutrient_levels',
  'nutrition_grades',
  'nutriscore_grade',
  'nova_group',
  'nova_groups_tags',
  'categories_tags',
  'labels_tags',
  'image_front_url',
  'product_type',
].join(',');

export const OFF_REQUEST_TIMEOUT_MS = 10000;

function buildHeaders(): Record<string, string> {
  // React Native (iOS/Android) allows User-Agent; browsers forbid it.
  if (Platform.OS === 'web') {
    return { Accept: 'application/json' };
  }
  return { Accept: 'application/json', 'User-Agent': OFF_USER_AGENT };
}

function isTimeoutError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const name = (error as { name?: unknown }).name;
    return name === 'AbortError' || name === 'TimeoutError';
  }
  return false;
}

function toUserMessage(kind: OffLookupError['kind']): string {
  switch (kind) {
    case 'not_found':
      return "This barcode isn't in our food data yet. Scan the label instead.";
    case 'invalid_barcode':
      return 'That barcode does not look like a food barcode. Try again or scan the label.';
    case 'timeout':
      return 'The food database took too long to respond. Try again or scan the label.';
    case 'rate_limited':
      return 'Too many food lookups right now. Wait a moment and try again.';
    case 'network_error':
      return "You're offline. Connect to the internet to look up this barcode, or scan the label.";
    case 'server_error':
      return 'The food database is unavailable right now. Try again or scan the label.';
    case 'invalid_response':
      return 'We found the product, but its data was unreadable. Scan the nutrition panel instead.';
  }
}

function errorResult(kind: OffLookupError['kind']): OffLookupResult {
  return { kind: 'error', error: { kind, userMessage: toUserMessage(kind) } };
}

function extractV3Product(body: OffV3SuccessResponse | null): OffRawProduct | null {
  if (!body || typeof body !== 'object') return null;
  const status = typeof body.status === 'string' ? body.status.toLowerCase() : '';
  if (status !== 'success' && status !== 'success_with_errors') return null;
  const product = body.product;
  if (!product || typeof product !== 'object') return null;
  return product;
}

function extractV2Product(body: OffV2SuccessResponse | null): OffRawProduct | null {
  if (!body || typeof body !== 'object') return null;
  if (body.status !== 1) return null;
  const product = body.product;
  if (!product || typeof product !== 'object') return null;
  return product;
}

async function fetchJson(url: string, timeoutMs: number): Promise<{ httpStatus: number; body: unknown }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { headers: buildHeaders(), signal: controller.signal });
    let body: unknown = null;
    try {
      body = (await response.json()) as unknown;
    } catch {
      body = null;
    }
    return { httpStatus: response.status, body };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchV3(code: string, timeoutMs: number): Promise<OffRawProduct | 'not_found' | OffLookupError['kind']> {
  const url = `${OFF_V3_BASE}/${encodeURIComponent(code)}?product_type=all&fields=${encodeURIComponent(OFF_FIELDS)}`;
  let result: { httpStatus: number; body: unknown };
  try {
    result = await fetchJson(url, timeoutMs);
  } catch (error) {
    if (isTimeoutError(error)) return 'timeout';
    return 'network_error';
  }

  if (result.httpStatus === 404) return 'not_found';
  if (result.httpStatus === 429) return 'rate_limited';
  if (result.httpStatus >= 500 && result.httpStatus <= 599) return 'server_error';
  if (result.httpStatus < 200 || result.httpStatus >= 300) return 'server_error';

  const product = extractV3Product(result.body as OffV3SuccessResponse | null);
  if (!product) {
    // v3 returns 200 only with a product; anything else is incomplete data.
    // Treat explicit empty product as not_found, otherwise invalid_response.
    const body = result.body as { product?: unknown; status?: unknown } | null;
    if (body && typeof body === 'object' && !('product' in body && body.product)) {
      return 'not_found';
    }
    return 'invalid_response';
  }
  return product;
}

async function fetchV2(code: string, timeoutMs: number): Promise<OffRawProduct | 'not_found' | OffLookupError['kind']> {
  const url = `${OFF_V2_BASE}/${encodeURIComponent(code)}?fields=${encodeURIComponent(OFF_FIELDS)}`;
  let result: { httpStatus: number; body: unknown };
  try {
    result = await fetchJson(url, timeoutMs);
  } catch (error) {
    if (isTimeoutError(error)) return 'timeout';
    return 'network_error';
  }

  if (result.httpStatus === 429) return 'rate_limited';
  if (result.httpStatus >= 500 && result.httpStatus <= 599) return 'server_error';
  if (result.httpStatus < 200 || result.httpStatus >= 300) return 'server_error';

  const body = result.body as OffV2SuccessResponse | null;
  if (body && typeof body === 'object' && body.status === 0) return 'not_found';
  const product = extractV2Product(body);
  if (!product) return 'invalid_response';
  return product;
}

function toNormalized(raw: OffRawProduct, barcode: string, source: 'v3' | 'v2'): NormalizedOffProduct | null {
  try {
    return normalizeOffProduct(raw, barcode, source);
  } catch {
    return null;
  }
}

export type FetchOffProductOptions = {
  timeoutMs?: number;
};

/**
 * Fetch a product from Open Food Facts by barcode.
 * Tries v3 first, falls back to v2 for transport/server failures and misses.
 * Tries the UPC-A leading-zero variant only when the primary code misses.
 * Never throws; all failures are returned as safe UI messages.
 */
export async function fetchOffProduct(
  rawBarcode: string,
  options?: FetchOffProductOptions,
): Promise<OffLookupResult> {
  const timeoutMs = options?.timeoutMs ?? OFF_REQUEST_TIMEOUT_MS;
  const normalized = normalizeBarcode(rawBarcode);

  if (!normalized.valid) {
    return errorResult('invalid_barcode');
  }

  const codesToTry = [normalized.lookupCode, ...normalized.fallbackCodes];
  let lastError: OffLookupError['kind'] = 'not_found';

  for (const code of codesToTry) {
    const v3 = await fetchV3(code, timeoutMs);
    if (typeof v3 === 'object') {
      const product = toNormalized(v3, code, 'v3');
      if (!product) return errorResult('invalid_response');
      return { kind: 'success', product };
    }
    if (v3 !== 'not_found') {
      // Transport/server failure on v3: give stable v2 one chance for the same code.
      const v2 = await fetchV2(code, timeoutMs);
      if (typeof v2 === 'object') {
        const product = toNormalized(v2, code, 'v2');
        if (!product) return errorResult('invalid_response');
        return { kind: 'success', product };
      }
      if (v2 === 'not_found') {
        lastError = 'not_found';
        continue;
      }
      lastError = v2;
      // Server errors are unlikely to heal on the fallback code; stop early
      // except for not_found which may simply be a variant mismatch.
      if (v2 === 'timeout' || v2 === 'rate_limited' || v2 === 'network_error') {
        return errorResult(v2);
      }
      continue;
    }

    // v3 miss: try v2 for the same code before moving to the fallback variant.
    const v2 = await fetchV2(code, timeoutMs);
    if (typeof v2 === 'object') {
      const product = toNormalized(v2, code, 'v2');
      if (!product) return errorResult('invalid_response');
      return { kind: 'success', product };
    }
    lastError = v2 === 'not_found' ? 'not_found' : v2;
    if (v2 !== 'not_found') {
      // Preserve rate-limit/timeout/network signals instead of hiding them
      // behind a later not_found from the fallback variant.
      if (v2 === 'timeout' || v2 === 'rate_limited' || v2 === 'network_error') {
        return errorResult(v2);
      }
    }
  }

  return errorResult(lastError);
}

/** Exposed for tests and debugging; not part of the UI contract. */
export const __testing = { OFF_FIELDS, OFF_USER_AGENT, buildHeaders };

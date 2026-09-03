export type BarcodeFormat = 'ean13' | 'ean8' | 'upc_a' | 'upc_e' | 'unknown';

export type NormalizedBarcode = {
  /** Raw scanner input, as received from the camera callback. */
  raw: string;
  /** Trimmed input with spaces and hyphens removed. */
  cleaned: string;
  /** True when the value looks like a supported retail barcode. */
  valid: boolean;
  /** Best-effort format guess, using the scanner hint when provided. */
  format: BarcodeFormat;
  /** Primary code to send to Open Food Facts. Never silently altered beyond cleanup. */
  lookupCode: string;
  /** Fallback codes to try only if the primary lookup misses (e.g. UPC-A with leading zero). */
  fallbackCodes: string[];
  /** Machine-readable reason when valid is false. */
  reason: string | null;
};

const DIGITS_ONLY = /^[0-9]+$/;

export function cleanBarcodeInput(raw: string): string {
  return raw.trim().replace(/[\s-]+/g, '');
}

function inferFormat(cleaned: string, hint: string | null): BarcodeFormat {
  const normalizedHint = hint?.trim().toLowerCase();
  if (normalizedHint === 'ean13' || normalizedHint === 'ean_13' || normalizedHint === 'ean-13') {
    return cleaned.length === 13 ? 'ean13' : 'unknown';
  }
  if (normalizedHint === 'ean8' || normalizedHint === 'ean_8' || normalizedHint === 'ean-8') {
    return cleaned.length === 8 ? 'ean8' : 'unknown';
  }
  if (normalizedHint === 'upc_a' || normalizedHint === 'upc-a' || normalizedHint === 'upca') {
    return cleaned.length === 12 ? 'upc_a' : 'unknown';
  }
  if (normalizedHint === 'upc_e' || normalizedHint === 'upc-e' || normalizedHint === 'upce') {
    return cleaned.length >= 6 && cleaned.length <= 8 ? 'upc_e' : 'unknown';
  }

  if (cleaned.length === 13) return 'ean13';
  if (cleaned.length === 12) return 'upc_a';
  if (cleaned.length === 8) return 'ean8';
  if (cleaned.length === 6 || cleaned.length === 7) return 'upc_e';
  return 'unknown';
}

/**
 * Normalize a raw barcode string without inventing a different product code.
 * Cleanup is limited to trimming and removing spaces/hyphens.
 */
export function normalizeBarcode(raw: string, typeHint?: string | null): NormalizedBarcode {
  const cleaned = cleanBarcodeInput(raw ?? '');
  const hint = typeHint ?? null;

  if (!cleaned) {
    return {
      raw,
      cleaned,
      valid: false,
      format: 'unknown',
      lookupCode: '',
      fallbackCodes: [],
      reason: 'empty',
    };
  }

  if (!DIGITS_ONLY.test(cleaned)) {
    return {
      raw,
      cleaned,
      valid: false,
      format: 'unknown',
      lookupCode: cleaned,
      fallbackCodes: [],
      reason: 'non_numeric',
    };
  }

  const format = inferFormat(cleaned, hint);

  if (format === 'unknown') {
    return {
      raw,
      cleaned,
      valid: false,
      format,
      lookupCode: cleaned,
      fallbackCodes: [],
      reason: 'unsupported_length',
    };
  }

  // UPC-A (12 digits) is the same product as EAN-13 with one leading zero.
  // Keep the scanned value primary; only offer the variant as a fallback.
  const fallbackCodes: string[] =
    format === 'upc_a' ? [`0${cleaned}`] : format === 'ean13' && cleaned.startsWith('0') ? [cleaned.slice(1)] : [];

  return {
    raw,
    cleaned,
    valid: true,
    format,
    lookupCode: cleaned,
    fallbackCodes,
    reason: null,
  };
}

/**
 * Treat UPC-A and its EAN-13 leading-zero form as the same product so one
 * physical barcode cannot trigger two lookups when reported in both forms.
 */
export function isSameBarcode(a: string, b: string): boolean {
  const first = cleanBarcodeInput(a ?? '');
  const second = cleanBarcodeInput(b ?? '');

  if (!first || !second || first === second) {
    return first === second && first !== '';
  }

  if (first.length === 12 && second.length === 13 && second === `0${first}`) {
    return true;
  }

  if (second.length === 12 && first.length === 13 && first === `0${second}`) {
    return true;
  }

  return false;
}

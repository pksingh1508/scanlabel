/**
 * Request validation for the stateless analysis endpoint.
 * Pure module (no native or server imports) so the same limits can be
 * unit-tested outside the bundler and reused by the Step 10 pipeline.
 */

export const ANALYZE_MAX_IMAGES = 2;
/** Raw-body ceiling before JSON parsing is even attempted. */
export const ANALYZE_MAX_BODY_BYTES = 15_000_000;
/** ~5.25MB of decoded image data per photo. */
export const ANALYZE_MAX_IMAGE_BASE64_CHARS = 7_000_000;
/** Normalized Open Food Facts payloads are a few KB; anything near this is abuse. */
export const ANALYZE_MAX_OFF_JSON_CHARS = 100_000;
export const ANALYZE_MAX_BARCODE_CHARS = 32;

const BASE64_CHARS = /^[A-Za-z0-9+/=\s]+$/;
const BARCODE_CHARS = /^[0-9]+$/;

export type AnalyzeImageMimeType = 'image/jpeg' | 'image/png';

export type AnalyzeRequestImage = {
  mimeType: AnalyzeImageMimeType;
  base64: string;
};

export type ValidatedAnalyzeRequest = {
  barcode?: string;
  openFoodFacts?: Record<string, unknown>;
  images: AnalyzeRequestImage[];
};

export type AnalyzeRequestError = {
  status: 400 | 413;
  code:
    | 'invalid_request'
    | 'no_data'
    | 'invalid_barcode'
    | 'malformed_product_data'
    | 'product_data_too_large'
    | 'too_many_images'
    | 'unsupported_image_type'
    | 'invalid_image'
    | 'image_too_large';
  message: string;
};

export type ValidateAnalyzeRequestResult =
  | { ok: true; request: ValidatedAnalyzeRequest }
  | { ok: false; error: AnalyzeRequestError };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validate an unknown request body. Never throws; every rejection carries a
 * non-technical message that is safe to show in the UI.
 */
export function validateAnalyzeRequest(body: unknown): ValidateAnalyzeRequestResult {
  if (!isPlainObject(body)) {
    return {
      ok: false,
      error: {
        status: 400,
        code: 'invalid_request',
        message: 'That scan request was not understood. Try scanning again.',
      },
    };
  }

  let barcode: string | undefined;
  if (body.barcode !== undefined) {
    if (typeof body.barcode !== 'string') {
      return {
        ok: false,
        error: {
          status: 400,
          code: 'invalid_barcode',
          message: 'That barcode does not look valid. Try scanning again.',
        },
      };
    }
    const cleaned = body.barcode.trim();
    if (cleaned.length === 0 || cleaned.length > ANALYZE_MAX_BARCODE_CHARS || !BARCODE_CHARS.test(cleaned)) {
      return {
        ok: false,
        error: {
          status: 400,
          code: 'invalid_barcode',
          message: 'That barcode does not look valid. Try scanning again.',
        },
      };
    }
    barcode = cleaned;
  }

  let openFoodFacts: Record<string, unknown> | undefined;
  if (body.openFoodFacts !== undefined) {
    if (!isPlainObject(body.openFoodFacts)) {
      return {
        ok: false,
        error: {
          status: 400,
          code: 'malformed_product_data',
          message: 'The product data was unreadable. Try scanning the label instead.',
        },
      };
    }
    if (Object.keys(body.openFoodFacts).length > 0) {
      let serialized: string;
      try {
        serialized = JSON.stringify(body.openFoodFacts);
      } catch {
        return {
          ok: false,
          error: {
            status: 400,
            code: 'malformed_product_data',
            message: 'The product data was unreadable. Try scanning the label instead.',
          },
        };
      }
      if (serialized.length > ANALYZE_MAX_OFF_JSON_CHARS) {
        return {
          ok: false,
          error: {
            status: 413,
            code: 'product_data_too_large',
            message: 'That product data is too large. Try scanning the label instead.',
          },
        };
      }
      openFoodFacts = body.openFoodFacts;
    }
  }

  const images: AnalyzeRequestImage[] = [];
  if (body.images !== undefined) {
    if (!Array.isArray(body.images)) {
      return {
        ok: false,
        error: {
          status: 400,
          code: 'invalid_image',
          message: 'Those label photos could not be read. Try capturing them again.',
        },
      };
    }
    if (body.images.length > ANALYZE_MAX_IMAGES) {
      return {
        ok: false,
        error: {
          status: 400,
          code: 'too_many_images',
          message: 'Two label photos is the maximum. Remove one and try again.',
        },
      };
    }
    for (const item of body.images) {
      if (!isPlainObject(item) || (item.mimeType !== 'image/jpeg' && item.mimeType !== 'image/png')) {
        return {
          ok: false,
          error: {
            status: 400,
            code: 'unsupported_image_type',
            message: 'Only JPEG or PNG label photos are supported.',
          },
        };
      }
      if (typeof item.base64 !== 'string' || item.base64.trim().length === 0) {
        return {
          ok: false,
          error: {
            status: 400,
            code: 'invalid_image',
            message: 'One of those label photos is empty. Try capturing it again.',
          },
        };
      }
      const base64 = item.base64.trim();
      if (base64.length > ANALYZE_MAX_IMAGE_BASE64_CHARS) {
        return {
          ok: false,
          error: {
            status: 413,
            code: 'image_too_large',
            message: 'One of those photos is too large. Retake it closer to the label.',
          },
        };
      }
      if (!BASE64_CHARS.test(base64)) {
        return {
          ok: false,
          error: {
            status: 400,
            code: 'invalid_image',
            message: 'One of those label photos is corrupted. Try capturing it again.',
          },
        };
      }
      images.push({ mimeType: item.mimeType, base64 });
    }
  }

  if (!barcode && !openFoodFacts && images.length === 0) {
    return {
      ok: false,
      error: {
        status: 400,
        code: 'no_data',
        message: 'We need a barcode, product data, or a label photo to analyze. Try scanning again.',
      },
    };
  }

  return { ok: true, request: { ...(barcode ? { barcode } : {}), ...(openFoodFacts ? { openFoodFacts } : {}), images } };
}

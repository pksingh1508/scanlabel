export const LABEL_IMAGE_MAX_LONG_EDGE = 1800;
export const LABEL_IMAGE_QUALITY = 0.78;
export const LABEL_IMAGE_MIME_TYPE = 'image/jpeg' as const;

/** Per-image safety cap; JPEG 1800px @0.78 is typically well under 1MB. */
export const MAX_PREPARED_IMAGE_BYTES = 5_000_000;
/** Two-image total cap to stay within server request limits. */
export const MAX_TOTAL_PREPARED_BYTES = 10_000_000;

export const MAX_LABEL_IMAGES = 2;

export function isSupportedImageUri(uri: string): boolean {
  if (!uri) return false;
  const value = uri.trim();
  if (!value) return false;
  if (value.startsWith('data:')) {
    return (
      value.startsWith('data:image/jpeg') ||
      value.startsWith('data:image/jpg') ||
      value.startsWith('data:image/png')
    );
  }
  return (
    value.startsWith('file://') ||
    value.startsWith('content://') ||
    value.startsWith('ph://') ||
    value.startsWith('blob:') ||
    value.startsWith('http://') ||
    value.startsWith('https://')
  );
}

/**
 * Compute the downscale target preserving aspect ratio.
 * Returns null when the image is already at or below the limit so tiny
 * ingredient text is never upscaled or needlessly re-encoded smaller.
 */
export function computeDownscaleTarget(
  width: number,
  height: number,
  maxLongEdge: number = LABEL_IMAGE_MAX_LONG_EDGE,
): { width: number; height: number } | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }
  const longEdge = Math.max(width, height);
  if (longEdge <= maxLongEdge) return null;
  const scale = maxLongEdge / longEdge;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * Validate a batch before any upload: max count + total size cap.
 * Pure helper so Step 8/10 can reuse the same limits.
 */
export function validatePreparedBatch(
  images: { sizeBytes?: number }[],
): { ok: true } | { ok: false; message: string } {
  if (images.length > MAX_LABEL_IMAGES) {
    return { ok: false, message: 'Two photos is the maximum. Remove one to continue.' };
  }
  const total = images.reduce((sum, image) => sum + (image.sizeBytes ?? 0), 0);
  const allKnown = images.every((image) => typeof image.sizeBytes === 'number');
  if (allKnown && total > MAX_TOTAL_PREPARED_BYTES) {
    return { ok: false, message: 'Those photos are too large together. Retake them closer to the label.' };
  }
  return { ok: true };
}

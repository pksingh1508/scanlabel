import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import {
  LABEL_IMAGE_MAX_LONG_EDGE,
  LABEL_IMAGE_MIME_TYPE,
  LABEL_IMAGE_QUALITY,
  MAX_PREPARED_IMAGE_BYTES,
  computeDownscaleTarget,
  isSupportedImageUri,
} from '@/lib/image/imagePolicy';

export type PreparedLabelImage = {
  uri: string;
  width: number;
  height: number;
  mimeType: typeof LABEL_IMAGE_MIME_TYPE;
  sizeBytes?: number;
};

export type PrepareImageErrorKind = 'empty_uri' | 'unsupported_type' | 'too_large' | 'prepare_failed';

export type PrepareImageError = {
  kind: PrepareImageErrorKind;
  message: string;
};

export type PrepareImageResult =
  | { ok: true; image: PreparedLabelImage }
  | { ok: false; error: PrepareImageError };

async function readBlobSizeBytes(uri: string): Promise<number | undefined> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return typeof blob.size === 'number' && Number.isFinite(blob.size) ? blob.size : undefined;
  } catch {
    return undefined;
  }
}

function toSafeError(kind: PrepareImageErrorKind): PrepareImageError {
  switch (kind) {
    case 'empty_uri':
      return { kind, message: 'That photo looks empty. Retake it with the label in frame.' };
    case 'unsupported_type':
      return { kind, message: 'That photo format is not supported. Retake it with the camera.' };
    case 'too_large':
      return { kind, message: 'That photo is too large to analyze. Retake it closer to the label.' };
    case 'prepare_failed':
      return { kind, message: "We couldn't prepare that photo. Retake it with better light." };
  }
}

/**
 * Prepare one captured label photo for upload:
 * inspect dimensions → resize only when larger than target → JPEG compress.
 * Never upscales; never logs image content.
 */
export async function prepareLabelImage(
  sourceUri: string,
  options?: { maxLongEdge?: number; quality?: number; sourceWidth?: number; sourceHeight?: number },
): Promise<PrepareImageResult> {
  const uri = (sourceUri ?? '').trim();
  if (!uri) {
    return { ok: false, error: toSafeError('empty_uri') };
  }
  if (!isSupportedImageUri(uri)) {
    return { ok: false, error: toSafeError('unsupported_type') };
  }

  const maxLongEdge = options?.maxLongEdge ?? LABEL_IMAGE_MAX_LONG_EDGE;
  const quality = options?.quality ?? LABEL_IMAGE_QUALITY;

  try {
    let target: { width: number; height: number } | null = null;
    if (typeof options?.sourceWidth === 'number' && typeof options?.sourceHeight === 'number') {
      // Caller (camera capture) already knows dimensions: single native pass.
      target = computeDownscaleTarget(options.sourceWidth, options.sourceHeight, maxLongEdge);
    } else {
      // Dimensions unknown: one lightweight render to inspect them.
      const probed = await ImageManipulator.manipulate(uri).renderAsync();
      target = computeDownscaleTarget(probed.width, probed.height, maxLongEdge);
    }

    const context = ImageManipulator.manipulate(uri);
    if (target != null) {
      context.resize(target);
    }
    const rendered = await context.renderAsync();

    const saved = await rendered.saveAsync({
      base64: false,
      compress: quality,
      format: SaveFormat.JPEG,
    });

    if (!saved?.uri) {
      return { ok: false, error: toSafeError('prepare_failed') };
    }

    const sizeBytes = await readBlobSizeBytes(saved.uri);
    if (typeof sizeBytes === 'number' && sizeBytes > MAX_PREPARED_IMAGE_BYTES) {
      return { ok: false, error: toSafeError('too_large') };
    }

    return {
      ok: true,
      image: {
        uri: saved.uri,
        width: saved.width,
        height: saved.height,
        mimeType: LABEL_IMAGE_MIME_TYPE,
        ...(typeof sizeBytes === 'number' ? { sizeBytes } : {}),
      },
    };
  } catch {
    return { ok: false, error: toSafeError('prepare_failed') };
  }
}

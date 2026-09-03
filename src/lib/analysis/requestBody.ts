import { ANALYZE_MAX_IMAGE_BASE64_CHARS } from './request';
import type { AnalysisClientBody } from './client';

export type AnalyzeBodySource = {
  barcode?: string;
  offProduct?: Record<string, unknown>;
  images: { uri: string; mimeType?: 'image/jpeg' | 'image/png' }[];
};

export type FileReader = (uri: string) => Promise<{ ok: true; base64: string } | { ok: false; error: string }>;

export type BuildAnalyzeBodyResult =
  | { ok: true; body: AnalysisClientBody }
  | { ok: false; message: string };

/**
 * Assemble the `/api/analyze` JSON body from the current scan session.
 * Pure apart from the injected file reader, so every path is unit-testable.
 * Reads prepared files sequentially (max 2) and enforces the per-image
 * base64 cap before anything touches the network.
 */
export async function buildAnalyzeBody(
  source: AnalyzeBodySource,
  readFile: FileReader,
): Promise<BuildAnalyzeBodyResult> {
  const images: NonNullable<AnalysisClientBody['images']> = [];
  for (const image of source.images) {
    if (!image.uri) continue;
    const read = await readFile(image.uri);
    if (!read.ok) {
      return { ok: false, message: read.error };
    }
    if (read.base64.length > ANALYZE_MAX_IMAGE_BASE64_CHARS) {
      return { ok: false, message: 'One of those photos is too large. Retake it closer to the label.' };
    }
    images.push({ mimeType: image.mimeType ?? 'image/jpeg', base64: read.base64 });
  }

  const barcode = source.barcode?.trim() ? source.barcode.trim() : undefined;
  const offProduct =
    source.offProduct && Object.keys(source.offProduct).length > 0 ? source.offProduct : undefined;

  if (!barcode && !offProduct && images.length === 0) {
    return { ok: false, message: 'There is nothing to analyze yet. Scan a barcode or capture a label first.' };
  }

  return {
    ok: true,
    body: {
      ...(barcode ? { barcode } : {}),
      ...(offProduct ? { openFoodFacts: offProduct } : {}),
      ...(images.length > 0 ? { images } : {}),
    },
  };
}

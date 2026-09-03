import { File } from 'expo-file-system';

export type ReadBase64Result = { ok: true; base64: string } | { ok: false; error: string };

/**
 * Read a local prepared-image file as base64 for the analysis request.
 * Never logs content; failures map to safe retake messages.
 */
export async function readFileAsBase64(uri: string): Promise<ReadBase64Result> {
  const trimmed = (uri ?? '').trim();
  if (!trimmed) {
    return { ok: false, error: 'That photo looks empty. Try capturing it again.' };
  }
  try {
    const base64 = await new File(trimmed).base64();
    if (!base64) {
      return { ok: false, error: 'That photo could not be read. Try capturing it again.' };
    }
    return { ok: true, base64 };
  } catch {
    return { ok: false, error: 'That photo could not be read. Try capturing it again.' };
  }
}

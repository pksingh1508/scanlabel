import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { NormalizedOffProduct } from '@/lib/open-food-facts/types';

export const MAX_SCAN_IMAGES = 2;

export type ScanImageKind = 'ingredients' | 'nutrition';

export type ScanImageMimeType = 'image/jpeg' | 'image/png';

export type ScanImage = {
  uri: string;
  kind: ScanImageKind;
  width?: number;
  height?: number;
  /** Prepared upload payload type. Always JPEG after Step 6 preparation. */
  mimeType?: ScanImageMimeType;
  /** Prepared file size in bytes when measurable. */
  sizeBytes?: number;
};

/**
 * Temporary in-memory session for the current scan only.
 * No persistence, no history. Cleared on cancel, reset, or starting a new scan.
 */
export type ScanSession = {
  barcode?: string;
  offProduct?: NormalizedOffProduct;
  images: ScanImage[];
};

type ScanContextValue = {
  session: ScanSession;
  setBarcodeData: (barcode: string | undefined, offProduct: NormalizedOffProduct | undefined) => void;
  addImage: (image: ScanImage) => boolean;
  removeImage: (index: number) => void;
  clearImages: () => void;
  clearSession: () => void;
};

const ScanContext = createContext<ScanContextValue | null>(null);

const EMPTY_SESSION: ScanSession = { images: [] };

export function ScanProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ScanSession>(EMPTY_SESSION);

  const setBarcodeData = useCallback(
    (barcode: string | undefined, offProduct: NormalizedOffProduct | undefined) => {
      setSession((prev) => ({ ...prev, barcode, offProduct }));
    },
    [],
  );

  const addImage = useCallback(
    (image: ScanImage) => {
      if (!image.uri || session.images.length >= MAX_SCAN_IMAGES) return false;
      setSession((prev) => {
        if (prev.images.length >= MAX_SCAN_IMAGES || !image.uri) return prev;
        return { ...prev, images: [...prev.images, image] };
      });
      return true;
    },
    [session.images.length],
  );

  const removeImage = useCallback((index: number) => {
    setSession((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }, []);

  const clearImages = useCallback(() => {
    setSession((prev) => ({ ...prev, images: [] }));
  }, []);

  const clearSession = useCallback(() => {
    setSession(EMPTY_SESSION);
  }, []);

  const value = useMemo(
    () => ({ session, setBarcodeData, addImage, removeImage, clearImages, clearSession }),
    [session, setBarcodeData, addImage, removeImage, clearImages, clearSession],
  );

  return <ScanContext.Provider value={value}>{children}</ScanContext.Provider>;
}

export function useScan(): ScanContextValue {
  const ctx = useContext(ScanContext);
  if (!ctx) {
    throw new Error('useScan must be used inside <ScanProvider>');
  }
  return ctx;
}

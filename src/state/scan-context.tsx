import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';

import type { AnalysisClientError } from '@/lib/analysis/client';
import type { NormalizedOffProduct } from '@/lib/open-food-facts/types';
import type { ProductAnalysis } from '@/types/analysis';

import {
  INITIAL_FLOW,
  scanFlowReducer,
  type ScanFlowAction,
  type ScanFlowState,
} from './scan-flow';

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
 * Temporary in-memory state for the current scan only.
 * No persistence, no history. `resetScan` clears everything (barcode, OFF
 * product, images, analysis, error) for "Scan another".
 */
export type ScanSession = {
  barcode?: string;
  offProduct?: NormalizedOffProduct;
  images: ScanImage[];
};

type ScanContextValue = {
  session: ScanSession;
  flow: ScanFlowState;
  analysis: ProductAnalysis | null;
  analysisError: AnalysisClientError | null;
  setBarcodeData: (barcode: string | undefined, offProduct: NormalizedOffProduct | undefined) => void;
  addImage: (image: ScanImage) => boolean;
  removeImage: (index: number) => void;
  clearImages: () => void;
  /** Clears session images only (capture cancel); barcode context survives. */
  clearSession: () => void;
  /** Coarse pipeline phase transitions (see scan-flow.ts). */
  updateFlow: (action: ScanFlowAction) => void;
  setAnalysisResult: (analysis: ProductAnalysis) => void;
  setAnalysisFailure: (error: AnalysisClientError) => void;
  clearAnalysisError: () => void;
  /** Full reset for "Scan another": data, analysis, error, and flow. */
  resetScan: () => void;
};

const ScanContext = createContext<ScanContextValue | null>(null);

const EMPTY_SESSION: ScanSession = { images: [] };

export function ScanProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ScanSession>(EMPTY_SESSION);
  const [flow, dispatchFlow] = useReducer(scanFlowReducer, INITIAL_FLOW);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<AnalysisClientError | null>(null);

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

  const updateFlow = useCallback((action: ScanFlowAction) => {
    dispatchFlow(action);
  }, []);

  const setAnalysisResult = useCallback((next: ProductAnalysis) => {
    setAnalysisError(null);
    setAnalysis(next);
    dispatchFlow({ type: 'ANALYZE_SUCCESS' });
  }, []);

  const setAnalysisFailure = useCallback((error: AnalysisClientError) => {
    setAnalysis(null);
    setAnalysisError(error);
    dispatchFlow({ type: 'ANALYZE_FAILURE' });
  }, []);

  const clearAnalysisError = useCallback(() => {
    setAnalysisError(null);
  }, []);

  const resetScan = useCallback(() => {
    setSession(EMPTY_SESSION);
    setAnalysis(null);
    setAnalysisError(null);
    dispatchFlow({ type: 'RESET' });
  }, []);

  const value = useMemo(
    () => ({
      session,
      flow,
      analysis,
      analysisError,
      setBarcodeData,
      addImage,
      removeImage,
      clearImages,
      clearSession,
      updateFlow,
      setAnalysisResult,
      setAnalysisFailure,
      clearAnalysisError,
      resetScan,
    }),
    [
      session,
      flow,
      analysis,
      analysisError,
      setBarcodeData,
      addImage,
      removeImage,
      clearImages,
      clearSession,
      updateFlow,
      setAnalysisResult,
      setAnalysisFailure,
      clearAnalysisError,
      resetScan,
    ],
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

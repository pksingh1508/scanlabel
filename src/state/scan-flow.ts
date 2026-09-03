/**
 * Explicit scan-pipeline state machine. Pure module (no React, no native
 * imports) so every transition is unit-testable. Coarse user-visible phase;
 * screens keep small local UI states (lookup card details, camera preview)
 * for display detail, while this flow is the single source of truth for
 * "where in the pipeline is this scan".
 */

export type ScanFlowState =
  | 'idle'
  | 'scanning'
  | 'barcode_lookup'
  | 'needs_label'
  | 'capturing_label'
  | 'preparing_images'
  | 'analyzing'
  | 'result'
  | 'error';

export type LookupOutcome = 'complete' | 'needs_label' | 'not_found' | 'not_food' | 'error';

export type ScanFlowAction =
  | { type: 'FOCUS_SCANNER' }
  | { type: 'LOCK_BARCODE' }
  | { type: 'RESOLVE_LOOKUP'; outcome: LookupOutcome }
  | { type: 'ENTER_CAPTURE' }
  | { type: 'PREPARE_START' }
  | { type: 'PREPARE_DONE' }
  | { type: 'ANALYZE_START' }
  | { type: 'ANALYZE_SUCCESS' }
  | { type: 'ANALYZE_FAILURE' }
  | { type: 'RESET' };

export const INITIAL_FLOW: ScanFlowState = 'idle';

export function scanFlowReducer(_state: ScanFlowState, action: ScanFlowAction): ScanFlowState {
  switch (action.type) {
    case 'FOCUS_SCANNER':
      return 'scanning';
    case 'LOCK_BARCODE':
      return 'barcode_lookup';
    case 'RESOLVE_LOOKUP':
      // 'complete' keeps the barcode path active while the result card
      // awaits the explicit Analyze tap; photos-required outcomes move on.
      if (action.outcome === 'complete') return 'barcode_lookup';
      if (action.outcome === 'needs_label' || action.outcome === 'not_found') return 'needs_label';
      return 'error';
    case 'ENTER_CAPTURE':
      return 'capturing_label';
    case 'PREPARE_START':
      return 'preparing_images';
    case 'PREPARE_DONE':
      return 'capturing_label';
    case 'ANALYZE_START':
      return 'analyzing';
    case 'ANALYZE_SUCCESS':
      return 'result';
    case 'ANALYZE_FAILURE':
      return 'error';
    case 'RESET':
      return 'idle';
  }
}

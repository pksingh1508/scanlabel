import type { ProductAnalysis } from '@/types/analysis';

import { insufficientDataAnalysis } from './normalize';
import type { ValidatedAnalyzeRequest } from './request';

function safeText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, 200);
  return trimmed ? trimmed : null;
}

/**
 * Deterministic stand-in for the Step 9 AI analysis service.
 * Echoes only safe product-identity fields from the request and returns an
 * honest `insufficient_data` verdict — it must never be mistaken for a real
 * assessment. Always passes the Step 7 runtime contract.
 */
export function mockAnalysis(input: ValidatedAnalyzeRequest): ProductAnalysis {
  const off = input.openFoodFacts;
  const hasImages = input.images.length > 0;

  const source: ProductAnalysis['source'] =
    hasImages && off ? 'combined' : hasImages ? 'label_image' : 'open_food_facts';

  const base = insufficientDataAnalysis({
    source,
    missingFields: hasImages ? ['label analysis (mock mode)'] : ['label photos', 'label analysis (mock mode)'],
    warnings: ['Mock analysis service — real AI analysis arrives in Step 9.'],
  });

  return {
    ...base,
    product: {
      name: safeText(off?.productName),
      brand: safeText(off?.brand),
      barcode: input.barcode ?? safeText(off?.barcode),
      servingSize: safeText(off?.servingSize),
    },
    verdict: {
      ...base.verdict,
      shortReason:
        'Mock analysis only: the pipeline works, but no AI assessment has run yet. Real results arrive in Step 9.',
    },
  };
}

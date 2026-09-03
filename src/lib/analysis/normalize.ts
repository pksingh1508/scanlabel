import type { ProductAnalysis } from '@/types/analysis';

import { parseProductAnalysis } from './schema';

/**
 * Standard disclaimer attached deterministically in code — never left to
 * model wording. Meaning required by the product contract: general
 * information only, not medical/dietary advice, verify the physical package
 * (especially for allergies or medical dietary restrictions).
 */
export const STANDARD_DISCLAIMER =
  'General food-label information only. This is not medical or dietary advice. Always check the physical package, especially for allergies or medical dietary restrictions.';

/** Overlay for insufficient-data results when the label cannot be read. */
export const INSUFFICIENT_DATA_REASON =
  'We could not read enough of the label to assess this product. Try again with better light.';

/**
 * Return a copy of a validated analysis with the standard disclaimer
 * enforced. The server calls this after parsing so every result carries
 * identical wording regardless of model output.
 */
export function withStandardDisclaimer(analysis: ProductAnalysis): ProductAnalysis {
  if (analysis.disclaimer === STANDARD_DISCLAIMER) return analysis;
  return { ...analysis, disclaimer: STANDARD_DISCLAIMER };
}

export type NormalizeAnalysisResult =
  | { ok: true; data: ProductAnalysis }
  | { ok: false; issues: string[] };

/**
 * Parse an unknown payload against the single result contract and enforce
 * the standard disclaimer. Shared by the server endpoint (Step 8/9) and any
 * future client-side validation. Rejects — never repairs — malformed data.
 */
export function normalizeProductAnalysis(input: unknown): NormalizeAnalysisResult {
  const parsed = parseProductAnalysis(input);
  if (!parsed.ok) return parsed;
  return { ok: true, data: withStandardDisclaimer(parsed.data) };
}

/**
 * Build a minimal `insufficient_data` result for unreadable labels or
 * out-of-scope items. All unknowns stay `null`/empty; nothing is invented.
 * Pass a scope warning (e.g. non-food item) to surface it in data quality.
 */
export function insufficientDataAnalysis(
  options?: { source?: ProductAnalysis['source']; warnings?: string[]; missingFields?: string[] },
): ProductAnalysis {
  return {
    schemaVersion: 1,
    source: options?.source ?? 'label_image',
    product: { name: null, brand: null, barcode: null, servingSize: null },
    verdict: {
      value: 'insufficient_data',
      title: 'Not enough label information',
      shortReason: INSUFFICIENT_DATA_REASON,
      confidence: 'low',
    },
    calories: { perServingKcal: null, per100gKcal: null },
    nutrition: {
      protein: { value: null, unit: null },
      carbohydrates: { value: null, unit: null },
      sugars: { value: null, unit: null },
      fat: { value: null, unit: null },
      saturatedFat: { value: null, unit: null },
      fiber: { value: null, unit: null },
      sodium: { value: null, unit: null },
      salt: { value: null, unit: null },
    },
    ingredients: { rawText: null, items: [] },
    allergens: { declared: [], traces: [], statement: null },
    labelSignals: {
      nutriScore: null,
      novaGroup: null,
      nutrientLevels: { fat: null, saturatedFat: null, sugar: null, salt: null },
      additives: [],
    },
    positives: [],
    concerns: [],
    dataQuality: {
      confidence: 'low',
      missingFields: options?.missingFields ?? ['nutrition facts', 'ingredients'],
      warnings: options?.warnings ?? [],
    },
    disclaimer: STANDARD_DISCLAIMER,
  };
}

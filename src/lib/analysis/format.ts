/**
 * Pure display-formatting for the result screen. Centralizes every
 * null/NaN/unit decision so the UI can never render "undefined", "NaN", or
 * a bare unit string. No React, no native imports — fully unit-testable.
 */

export const NOT_LISTED = 'Not listed';

export type BadgeTone = 'neutral' | 'positive' | 'concern' | 'allergen';

export type VerdictValue = 'good_general_choice' | 'okay_in_moderation' | 'best_limited' | 'insufficient_data';

function isDisplayableNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Calories headline: number stays numeric for styling, missing becomes '—'. */
export function formatKcal(value: number | null | undefined): number | '—' {
  return isDisplayableNumber(value) ? value : '—';
}

/**
 * Nutrient cell text. Missing value → 'Not listed'. A present value with a
 * missing/blank unit renders the bare number (never "12 undefined").
 */
export function formatNutrient(value: number | null | undefined, unit: string | null | undefined): string {
  if (!isDisplayableNumber(value)) return NOT_LISTED;
  const trimmedUnit = typeof unit === 'string' ? unit.trim() : '';
  return trimmedUnit ? `${value} ${trimmedUnit}` : `${value}`;
}

/** "Brand · Serving" header line; empty when neither is known. */
export function formatServingLine(brand: string | null | undefined, servingSize: string | null | undefined): string {
  return [brand, servingSize].filter((part): part is string => typeof part === 'string' && part.trim().length > 0).join(' · ');
}

/** Verdict → badge tone. Text labels always accompany color. */
export function verdictTone(value: VerdictValue): BadgeTone {
  if (value === 'good_general_choice') return 'positive';
  if (value === 'best_limited') return 'concern';
  if (value === 'insufficient_data') return 'neutral';
  return 'neutral';
}

/** Whether data quality deserves a visible caution banner. */
export function needsQualityBanner(verdict: VerdictValue, confidence: 'high' | 'medium' | 'low'): boolean {
  return verdict === 'insufficient_data' || confidence !== 'high';
}

export function formatSourceLabel(source: 'label_image' | 'open_food_facts' | 'combined'): string {
  if (source === 'combined') return 'Label photo + Open Food Facts';
  if (source === 'label_image') return 'Label photo';
  return 'Open Food Facts';
}

export function formatConfidence(confidence: 'high' | 'medium' | 'low'): string {
  if (confidence === 'high') return 'High';
  if (confidence === 'medium') return 'Medium';
  return 'Low';
}

/** Short plain-language context for unfamiliar label scores. */
export function nutriScoreContext(score: string): string {
  return `Nutri-Score ${score}: a front-of-pack scale from A (higher nutritional quality) to E (lower). It summarizes the label, it does not diagnose health.`;
}

export function novaGroupContext(group: number): string {
  if (group === 1) return 'NOVA group 1: unprocessed or minimally processed foods.';
  if (group === 2) return 'NOVA group 2: processed culinary ingredients such as oils or salt.';
  if (group === 3) return 'NOVA group 3: processed foods made with added salt, sugar, or fat.';
  return 'NOVA group 4: ultra-processed products made mostly from industrial ingredients.';
}

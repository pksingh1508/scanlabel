import type { ValidatedAnalyzeRequest } from './request';

/**
 * Prompt construction for the OpenRouter structured analysis call.
 * Pure module: no network, no secrets, no native imports.
 */

const MAX_OFF_TEXT_CHARS = 4000;

export const ANALYSIS_SYSTEM_PROMPT = [
  'You analyze packaged human food and beverage labels for a general-information grocery app.',
  'Rules:',
  '1. Read only the provided label images and product data. The photographed physical label outranks database data when they conflict.',
  '2. Never invent missing values. Unknown calories, serving sizes, ingredient percentages, allergens, or certifications stay null or empty.',
  '3. Keep per-serving and per-100g (or per-100ml) values separate; never mix bases or convert unless the serving weight is explicitly known.',
  '4. Keep sodium and salt distinct; never relabel one as the other.',
  '5. Separate explicitly declared allergens ("contains") from possible traces ("may contain"). Never infer an allergen declaration from an ambiguous ingredient.',
  '6. Explain each parsed ingredient in one short factual sentence. Describe approved additives by function (e.g. emulsifier, preservative) without calling them toxic or claiming disease effects.',
  '7. Give a general food-choice assessment only: good_general_choice, okay_in_moderation, best_limited, or insufficient_data. This is not medical or dietary advice; never diagnose, treat, or promise safety for any condition or allergy.',
  '8. If the photos are unreadable, or the item is not a packaged human food or beverage, return verdict insufficient_data with a scope warning and empty facts.',
  '9. Preserve label units exactly as printed.',
  '10. Respond with the required structured output only — no prose, no markdown fences.',
].join('\n');

type OffSummary = {
  barcode?: string | null;
  productName?: string | null;
  brand?: string | null;
  servingSize?: string | null;
  ingredientsText?: string | null;
  allergensText?: string | null;
  nutriments?: Record<string, number> | null;
};

function safeLine(value: unknown, max = 200): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed ? trimmed : null;
}

function summarizeOffProduct(off: Record<string, unknown>): OffSummary {
  const nutriments: Record<string, number> = {};
  const raw = off.nutriments;
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    for (const [key, value] of Object.entries(raw)) {
      if (typeof value === 'number' && Number.isFinite(value)) nutriments[key] = value;
    }
  }
  const ingredientsText = safeLine(off.ingredientsText, 2000);
  return {
    barcode: safeLine(off.barcode),
    productName: safeLine(off.productName),
    brand: safeLine(off.brand),
    servingSize: safeLine(off.servingSize),
    ingredientsText,
    allergensText: safeLine(off.allergens, 500),
    nutriments: Object.keys(nutriments).length > 0 ? nutriments : null,
  };
}

/**
 * Build the user text part: barcode, sanitized OFF summary, and which photo
 * shows what. Images themselves travel as separate content parts.
 */
export function buildAnalysisUserText(input: ValidatedAnalyzeRequest): string {
  const lines: string[] = [];
  if (input.barcode) lines.push(`Barcode: ${input.barcode}`);
  if (input.openFoodFacts) {
    const summary = summarizeOffProduct(input.openFoodFacts);
    let json = JSON.stringify(summary);
    if (json.length > MAX_OFF_TEXT_CHARS) {
      const trimmed: OffSummary = {
        ...summary,
        ingredientsText: summary.ingredientsText?.slice(0, 1000) ?? null,
      };
      json = JSON.stringify(trimmed).slice(0, MAX_OFF_TEXT_CHARS);
    }
    lines.push(`Open Food Facts data (community-maintained, may be outdated; label photos win): ${json}`);
  }
  const labels = ['ingredients / allergen panel', 'nutrition facts panel'];
  input.images.forEach((_, index) => {
    lines.push(`Photo ${index + 1} shows the ${labels[index] ?? 'label'}.`);
  });
  if (input.images.length === 0) {
    lines.push('No label photos were provided; assess from the product data above, or return insufficient_data.');
  }
  return lines.join('\n');
}

export type AnalysisImagePart = {
  mimeType: 'image/jpeg' | 'image/png';
  base64: string;
};

export function buildImageDataUrl(image: AnalysisImagePart): string {
  return `data:${image.mimeType};base64,${image.base64}`;
}

export type ChatContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export type ChatMessage = { role: 'system' | 'user'; content: string | ChatContentPart[] };

/**
 * Text prompt first, then images — the order OpenRouter recommends.
 */
export function buildAnalysisMessages(input: ValidatedAnalyzeRequest): ChatMessage[] {
  const content: ChatContentPart[] = [{ type: 'text', text: buildAnalysisUserText(input) }];
  for (const image of input.images) {
    content.push({ type: 'image_url', image_url: { url: buildImageDataUrl(image) } });
  }
  return [
    { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
    { role: 'user', content },
  ];
}

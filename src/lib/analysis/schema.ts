import { z } from 'zod';

import type { ProductAnalysis } from '@/types/analysis';

/**
 * Single runtime-validated result contract shared by the server endpoint
 * (Step 8/9) and the result UI. The Zod schema is the enforcement point:
 * unknown keys are stripped, wrong types fail. The `z.ZodType` annotation
 * guarantees at compile time that the schema accepts exactly the
 * `ProductAnalysis` shape — if the two drift, `tsc` fails.
 *
 * Key rules enforced here:
 * - missing numeric data must be `null`, never a numeric string
 *   (no coercion: `z.number()` rejects `"12"` instead of converting it)
 * - units are preserved as strings alongside values
 * - declared allergens and traces are separate arrays
 * - `insufficient_data` is a first-class valid verdict
 */

const ConfidenceSchema = z.enum(['high', 'medium', 'low']);

const NutritionValueSchema = z.object({
  value: z.number().nullable(),
  unit: z.string().nullable(),
});

const IngredientItemSchema = z.object({
  name: z.string(),
  normalizedName: z.string().nullable(),
  explanation: z.string(),
  category: z.enum([
    'common_food',
    'sugar',
    'fat_or_oil',
    'protein',
    'fiber',
    'salt',
    'additive',
    'sweetener',
    'preservative',
    'color',
    'flavor',
    'allergen',
    'other',
  ]),
  concernLevel: z.enum(['none', 'low', 'moderate', 'unknown']),
  evidence: z.string().nullable(),
});

const NutrientLevelSchema = z.object({
  fat: z.string().nullable(),
  saturatedFat: z.string().nullable(),
  sugar: z.string().nullable(),
  salt: z.string().nullable(),
});

export const ProductAnalysisSchema: z.ZodType<ProductAnalysis> = z.object({
  schemaVersion: z.literal(1),
  source: z.enum(['label_image', 'open_food_facts', 'combined']),
  product: z.object({
    name: z.string().nullable(),
    brand: z.string().nullable(),
    barcode: z.string().nullable(),
    servingSize: z.string().nullable(),
  }),
  verdict: z.object({
    value: z.enum(['good_general_choice', 'okay_in_moderation', 'best_limited', 'insufficient_data']),
    title: z.string(),
    shortReason: z.string(),
    confidence: ConfidenceSchema,
  }),
  calories: z.object({
    perServingKcal: z.number().nullable(),
    per100gKcal: z.number().nullable(),
  }),
  nutrition: z.object({
    protein: NutritionValueSchema,
    carbohydrates: NutritionValueSchema,
    sugars: NutritionValueSchema,
    fat: NutritionValueSchema,
    saturatedFat: NutritionValueSchema,
    fiber: NutritionValueSchema,
    sodium: NutritionValueSchema,
    salt: NutritionValueSchema,
  }),
  ingredients: z.object({
    rawText: z.string().nullable(),
    items: z.array(IngredientItemSchema),
  }),
  allergens: z.object({
    declared: z.array(z.string()),
    traces: z.array(z.string()),
    statement: z.string().nullable(),
  }),
  labelSignals: z.object({
    nutriScore: z.string().nullable(),
    novaGroup: z.number().nullable(),
    nutrientLevels: NutrientLevelSchema,
    additives: z.array(z.string()),
  }),
  positives: z.array(z.string()),
  concerns: z.array(z.string()),
  dataQuality: z.object({
    confidence: ConfidenceSchema,
    missingFields: z.array(z.string()),
    warnings: z.array(z.string()),
  }),
  disclaimer: z.string(),
});

export type ParseProductAnalysisResult =
  | { ok: true; data: ProductAnalysis }
  | { ok: false; issues: string[] };

/**
 * Validate an unknown payload (AI output, fixture, debug object) against the
 * single result contract. Never throws and never coerces: numeric strings,
 * missing keys, and invalid enums all fail with readable issue paths.
 */
export function parseProductAnalysis(input: unknown): ParseProductAnalysisResult {
  const result = ProductAnalysisSchema.safeParse(input);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return {
    ok: false,
    issues: result.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
      return `${path}: ${issue.message}`;
    }),
  };
}

/** Type-guard form for call sites that only need a boolean. */
export function isProductAnalysis(input: unknown): input is ProductAnalysis {
  return ProductAnalysisSchema.safeParse(input).success;
}

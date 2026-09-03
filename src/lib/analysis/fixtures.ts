import type { ProductAnalysis } from '@/types/analysis';

import { STANDARD_DISCLAIMER } from './normalize';

/**
 * Local fixture set so the result UI stays independent of network access.
 * Every fixture must satisfy the `ProductAnalysis` type AND pass the
 * runtime `parseProductAnalysis` check (verified, not assumed).
 */

/** 1. Generally favorable food: plain wholegrain rolled oats. */
export const FAVORABLE_OATS_FIXTURE = {
  schemaVersion: 1,
  source: 'open_food_facts',
  product: {
    name: 'Wholegrain Rolled Oats',
    brand: 'Meadow Mill',
    barcode: '5012345678900',
    servingSize: '40 g dry',
  },
  verdict: {
    value: 'good_general_choice',
    title: 'Good general choice',
    shortReason: 'A single-ingredient whole grain with fiber and no added sugar or salt.',
    confidence: 'high',
  },
  calories: { perServingKcal: 148, per100gKcal: 370 },
  nutrition: {
    protein: { value: 5.2, unit: 'g' },
    carbohydrates: { value: 24, unit: 'g' },
    sugars: { value: 0.4, unit: 'g' },
    fat: { value: 2.8, unit: 'g' },
    saturatedFat: { value: 0.5, unit: 'g' },
    fiber: { value: 4, unit: 'g' },
    sodium: { value: 2, unit: 'mg' },
    salt: { value: null, unit: null },
  },
  ingredients: {
    rawText: '100% wholegrain rolled oats.',
    items: [
      {
        name: 'Wholegrain rolled oats',
        normalizedName: 'Rolled oats',
        explanation: 'A whole grain that contributes carbohydrate and fiber.',
        category: 'fiber',
        concernLevel: 'none',
        evidence: 'Only ingredient listed on the package.',
      },
    ],
  },
  allergens: {
    declared: ['Oats (gluten)'],
    traces: ['Wheat', 'Barley'],
    statement: 'Contains oats. May contain wheat and barley.',
  },
  labelSignals: {
    nutriScore: 'A',
    novaGroup: 1,
    nutrientLevels: { fat: 'low', saturatedFat: 'low', sugar: 'low', salt: 'low' },
    additives: [],
  },
  positives: ['4 g fiber per serving', 'No added sugar', 'Single-ingredient food'],
  concerns: [],
  dataQuality: { confidence: 'high', missingFields: ['Salt value'], warnings: [] },
  disclaimer: STANDARD_DISCLAIMER,
} satisfies ProductAnalysis;

/** 2. High-sugar snack: chocolate-coated caramel bar. */
export const HIGH_SUGAR_SNACK_FIXTURE = {
  schemaVersion: 1,
  source: 'label_image',
  product: {
    name: 'Caramel Chocolate Bar',
    brand: 'Sweetline',
    barcode: '8901234567891',
    servingSize: '1 bar (50 g)',
  },
  verdict: {
    value: 'best_limited',
    title: 'Best limited',
    shortReason: 'One bar carries 28 g of sugar and 6 g of saturated fat with little fiber or protein.',
    confidence: 'high',
  },
  calories: { perServingKcal: 250, per100gKcal: 500 },
  nutrition: {
    protein: { value: 2, unit: 'g' },
    carbohydrates: { value: 34, unit: 'g' },
    sugars: { value: 28, unit: 'g' },
    fat: { value: 12, unit: 'g' },
    saturatedFat: { value: 6, unit: 'g' },
    fiber: { value: 1, unit: 'g' },
    sodium: { value: 90, unit: 'mg' },
    salt: { value: null, unit: null },
  },
  ingredients: {
    rawText: 'Glucose syrup, sugar, milk chocolate (sugar, cocoa butter, milk powder), palm oil, skimmed milk powder, salt, soy lecithin, vanilla flavor.',
    items: [
      {
        name: 'Glucose syrup',
        normalizedName: 'Glucose syrup',
        explanation: 'A concentrated syrup used mainly to sweeten and bind.',
        category: 'sugar',
        concernLevel: 'moderate',
        evidence: 'Listed first; nutrition panel reports 28 g sugars per bar.',
      },
      {
        name: 'Milk chocolate',
        normalizedName: 'Milk chocolate',
        explanation: 'Chocolate made with sugar, cocoa butter, and milk powder.',
        category: 'sugar',
        concernLevel: 'moderate',
        evidence: 'Sub-ingredients name sugar and milk powder.',
      },
      {
        name: 'Palm oil',
        normalizedName: 'Palm oil',
        explanation: 'A vegetable oil used for texture.',
        category: 'fat_or_oil',
        concernLevel: 'low',
        evidence: 'Listed on the photographed package.',
      },
      {
        name: 'Soy lecithin',
        normalizedName: 'Soy lecithin',
        explanation: 'An emulsifier that helps fat and other ingredients stay mixed.',
        category: 'additive',
        concernLevel: 'none',
        evidence: 'Listed on the photographed package.',
      },
    ],
  },
  allergens: {
    declared: ['Milk', 'Soy'],
    traces: ['Peanuts', 'Tree nuts'],
    statement: 'Contains milk and soy. May contain peanuts and tree nuts.',
  },
  labelSignals: {
    nutriScore: 'E',
    novaGroup: 4,
    nutrientLevels: { fat: 'high', saturatedFat: 'high', sugar: 'high', salt: 'low' },
    additives: ['Soy lecithin'],
  },
  positives: [],
  concerns: ['28 g sugar per bar', '6 g saturated fat per bar', 'Low fiber and protein'],
  dataQuality: { confidence: 'high', missingFields: ['Salt value'], warnings: [] },
  disclaimer: STANDARD_DISCLAIMER,
} satisfies ProductAnalysis;

/** 3. Incomplete label: blurred import snack with unreadable panels. */
export const INCOMPLETE_LABEL_FIXTURE = {
  schemaVersion: 1,
  source: 'label_image',
  product: { name: null, brand: null, barcode: null, servingSize: null },
  verdict: {
    value: 'insufficient_data',
    title: 'Not enough label information',
    shortReason:
      'The photo was too blurry to read calories, serving size, or ingredients. Try again with better light.',
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
    missingFields: ['product name', 'calories', 'serving size', 'ingredients', 'allergens'],
    warnings: ['Label text was unreadable in the provided photo.'],
  },
  disclaimer: STANDARD_DISCLAIMER,
} satisfies ProductAnalysis;

/** 4. Allergen-containing product: smooth peanut butter. */
export const ALLERGEN_PRODUCT_FIXTURE = {
  schemaVersion: 1,
  source: 'combined',
  product: {
    name: 'Smooth Peanut Butter',
    brand: 'Harvest Jar',
    barcode: '8901234567892',
    servingSize: '2 tbsp (32 g)',
  },
  verdict: {
    value: 'okay_in_moderation',
    title: 'Okay in moderation',
    shortReason: 'Good protein for a spread, but portions are energy-dense and it contains peanut.',
    confidence: 'high',
  },
  calories: { perServingKcal: 190, per100gKcal: 594 },
  nutrition: {
    protein: { value: 7, unit: 'g' },
    carbohydrates: { value: 7, unit: 'g' },
    sugars: { value: 3, unit: 'g' },
    fat: { value: 16, unit: 'g' },
    saturatedFat: { value: 3, unit: 'g' },
    fiber: { value: 2, unit: 'g' },
    sodium: { value: 140, unit: 'mg' },
    salt: { value: null, unit: null },
  },
  ingredients: {
    rawText: 'Roasted peanuts (90%), cane sugar, palm oil, sea salt.',
    items: [
      {
        name: 'Roasted peanuts (90%)',
        normalizedName: 'Peanuts',
        explanation: 'A legume that contributes protein, fat, and texture.',
        category: 'allergen',
        concernLevel: 'none',
        evidence: 'Labelled as 90% of the product and named in the allergen statement.',
      },
      {
        name: 'Cane sugar',
        normalizedName: 'Cane sugar',
        explanation: 'Sugar added for sweetness.',
        category: 'sugar',
        concernLevel: 'low',
        evidence: 'Nutrition panel reports 3 g sugars per serving.',
      },
      {
        name: 'Palm oil',
        normalizedName: 'Palm oil',
        explanation: 'A vegetable oil used to keep the spread smooth.',
        category: 'fat_or_oil',
        concernLevel: 'low',
        evidence: 'Listed on the photographed package.',
      },
      {
        name: 'Sea salt',
        normalizedName: 'Salt',
        explanation: 'Salt added for flavor.',
        category: 'salt',
        concernLevel: 'low',
        evidence: 'Nutrition panel reports 140 mg sodium per serving.',
      },
    ],
  },
  allergens: {
    declared: ['Peanuts'],
    traces: ['Milk', 'Soy'],
    statement: 'Contains peanuts. May contain milk and soy.',
  },
  labelSignals: {
    nutriScore: 'C',
    novaGroup: 3,
    nutrientLevels: { fat: 'high', saturatedFat: 'moderate', sugar: 'low', salt: 'moderate' },
    additives: [],
  },
  positives: ['7 g protein per serving', 'No emulsifiers listed'],
  concerns: ['Contains peanut allergen', '190 kcal in 2 tbsp — portions matter'],
  dataQuality: { confidence: 'high', missingFields: ['Salt value'], warnings: [] },
  disclaimer: STANDARD_DISCLAIMER,
} satisfies ProductAnalysis;

/** 5. Two-photo product: instant noodles needing ingredients + nutrition shots. */
export const TWO_PHOTO_PRODUCT_FIXTURE = {
  schemaVersion: 1,
  source: 'combined',
  product: {
    name: 'Spicy Sesame Instant Noodles',
    brand: 'Quick Wok',
    barcode: '8901234567893',
    servingSize: '1 pack (85 g)',
  },
  verdict: {
    value: 'best_limited',
    title: 'Best limited',
    shortReason: 'Very high sodium per pack with refined noodles and several flavor additives.',
    confidence: 'medium',
  },
  calories: { perServingKcal: 380, per100gKcal: 447 },
  nutrition: {
    protein: { value: 8, unit: 'g' },
    carbohydrates: { value: 58, unit: 'g' },
    sugars: { value: 4, unit: 'g' },
    fat: { value: 13, unit: 'g' },
    saturatedFat: { value: 6, unit: 'g' },
    fiber: { value: 2, unit: 'g' },
    sodium: { value: 1480, unit: 'mg' },
    salt: { value: null, unit: null },
  },
  ingredients: {
    rawText:
      'Wheat flour, palm oil, sesame oil, salt, sugar, soy sauce powder (soybeans, wheat), yeast extract, chili powder, disodium guanylate, caramel color.',
    items: [
      {
        name: 'Wheat flour',
        normalizedName: 'Wheat flour',
        explanation: 'Refined flour used to make the noodles.',
        category: 'common_food',
        concernLevel: 'none',
        evidence: 'Listed first across both photographed panels.',
      },
      {
        name: 'Soy sauce powder',
        normalizedName: 'Soy sauce powder',
        explanation: 'Dried soy sauce used for savory flavor; contains soy and wheat.',
        category: 'allergen',
        concernLevel: 'none',
        evidence: 'Sub-ingredients name soybeans and wheat.',
      },
      {
        name: 'Disodium guanylate',
        normalizedName: 'Disodium guanylate',
        explanation: 'A flavor enhancer used with other savory seasonings.',
        category: 'flavor',
        concernLevel: 'unknown',
        evidence: 'Listed on the ingredients photo; exact amount not shown.',
      },
      {
        name: 'Caramel color',
        normalizedName: 'Caramel color',
        explanation: 'A coloring used to darken the seasoning.',
        category: 'color',
        concernLevel: 'unknown',
        evidence: 'Listed on the ingredients photo; exact type not specified.',
      },
    ],
  },
  allergens: {
    declared: ['Wheat', 'Soy', 'Sesame'],
    traces: [],
    statement: 'Contains wheat, soy, and sesame.',
  },
  labelSignals: {
    nutriScore: 'D',
    novaGroup: 4,
    nutrientLevels: { fat: 'moderate', saturatedFat: 'high', sugar: 'low', salt: 'high' },
    additives: ['Disodium guanylate', 'Caramel color'],
  },
  positives: ['8 g protein per pack'],
  concerns: ['1480 mg sodium per pack', '6 g saturated fat per pack', 'Refined noodles with added flavorings'],
  dataQuality: {
    confidence: 'medium',
    missingFields: ['Salt value'],
    warnings: ['Seasoning sachet values merged from the second photo.'],
  },
  disclaimer: STANDARD_DISCLAIMER,
} satisfies ProductAnalysis;

export const ANALYSIS_FIXTURES = [
  FAVORABLE_OATS_FIXTURE,
  HIGH_SUGAR_SNACK_FIXTURE,
  INCOMPLETE_LABEL_FIXTURE,
  ALLERGEN_PRODUCT_FIXTURE,
  TWO_PHOTO_PRODUCT_FIXTURE,
] as const;

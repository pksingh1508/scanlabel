import type {
  NormalizedOffProduct,
  OffRawProduct,
  ProductCompleteness,
} from '@/lib/open-food-facts/types';

function cleanString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function cleanStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function cleanFirstBrand(brands: unknown): string | null {
  const full = cleanString(brands);
  if (!full) return null;
  const first = full.split(',')[0]?.trim();
  return first ? first : full;
}

function cleanIngredientLabel(id: string): string {
  const withoutPrefix = id.includes(':') ? (id.split(':').pop() ?? id) : id;
  return withoutPrefix.replace(/[-_]+/g, ' ').trim();
}

function extractIngredientNames(raw: OffRawProduct): string[] {
  if (!Array.isArray(raw.ingredients)) return [];
  const names: string[] = [];
  for (const ingredient of raw.ingredients) {
    if (!ingredient || typeof ingredient !== 'object') continue;
    const text = cleanString(ingredient.text);
    if (text) {
      names.push(text);
      continue;
    }
    if (typeof ingredient.id === 'string' && ingredient.id.trim()) {
      const label = cleanIngredientLabel(ingredient.id.trim());
      if (label) names.push(label);
    }
  }
  return names.slice(0, 100);
}

function extractNumericNutriments(raw: OffRawProduct): Record<string, number> {
  const source = raw.nutriments;
  if (!source || typeof source !== 'object') return {};
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      result[key] = value;
    }
  }
  return result;
}

function parseNovaGroup(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 4) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value.trim(), 10);
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 4) return parsed;
  }
  return null;
}

function parseNutritionGrade(raw: OffRawProduct): string | null {
  const direct =
    cleanString((raw as { nutrition_grades?: unknown }).nutrition_grades) ??
    cleanString((raw as { nutriscore_grade?: unknown }).nutriscore_grade);
  if (!direct) return null;
  const grade = direct.trim().toLowerCase();
  return grade ? grade : null;
}

/**
 * Convert a raw Open Food Facts product into the app's normalized shape.
 * Never throws for missing fields; unknown values become null/empty.
 */
export function normalizeOffProduct(
  raw: OffRawProduct,
  barcode: string,
  source: 'v3' | 'v2',
): NormalizedOffProduct {
  const levels = raw.nutrient_levels ?? {};
  return {
    barcode,
    productName: cleanString(raw.product_name),
    brand: cleanFirstBrand(raw.brands),
    quantity: cleanString(raw.quantity),
    servingSize: cleanString(raw.serving_size),
    ingredientsText: cleanString(raw.ingredients_text),
    ingredients: extractIngredientNames(raw),
    allergens: cleanString(raw.allergens),
    allergensTags: cleanStringList(raw.allergens_tags),
    tracesTags: cleanStringList(raw.traces_tags),
    additivesTags: cleanStringList(raw.additives_tags),
    nutriments: extractNumericNutriments(raw),
    nutrientLevels: {
      fat: cleanString(levels.fat)?.toLowerCase() ?? null,
      saturatedFat: cleanString(levels['saturated-fat'])?.toLowerCase() ?? null,
      sugar: cleanString(levels.sugars)?.toLowerCase() ?? null,
      salt: cleanString(levels.salt)?.toLowerCase() ?? null,
    },
    nutritionGrade: parseNutritionGrade(raw),
    novaGroup: parseNovaGroup(raw.nova_group),
    categoriesTags: cleanStringList(raw.categories_tags),
    labelsTags: cleanStringList(raw.labels_tags),
    imageFrontUrl: cleanString(raw.image_front_url),
    productType: cleanString(raw.product_type)?.toLowerCase() ?? null,
    source,
  };
}

const NON_FOOD_TAG_MARKERS = [
  'pet-food',
  'petfood',
  'pet_foods',
  ':pet-',
  'cosmetic',
  'beauty',
  'hygiene',
  'medicine',
  'pharma',
  'household',
  'detergent',
  'cleaning',
  'non-food',
  'tobacco',
  'e-cigarette',
];

function isNonFoodProduct(product: NormalizedOffProduct): string | null {
  if (product.productType && product.productType !== 'food' && product.productType !== 'all') {
    // v3 can return beauty/petfood/product types when product_type=all.
    if (['beauty', 'petfood', 'pet-food', 'non-food'].includes(product.productType)) {
      return `Open Food Facts lists this barcode as ${product.productType}, not packaged food.`;
    }
  }

  const tags = product.categoriesTags.map((tag) => tag.toLowerCase());
  const hit = tags.find((tag) => NON_FOOD_TAG_MARKERS.some((marker) => tag.includes(marker)));
  if (hit) {
    return `Open Food Facts categorizes this barcode under ${hit}, which is outside the food-label scope.`;
  }

  return null;
}

function hasMeaningfulNutrition(nutriments: Record<string, number>): boolean {
  const get = (...keys: string[]) => keys.some((key) => typeof nutriments[key] === 'number');

  const hasEnergy = get('energy_100g', 'energy', 'energy-kcal_100g', 'energy-kcal', 'energy-kj_100g', 'energy-kj');
  const macroKeys = [
    'proteins_100g',
    'proteins',
    'carbohydrates_100g',
    'carbohydrates',
    'sugars_100g',
    'sugars',
    'fat_100g',
    'fat',
    'saturated-fat_100g',
    'saturated-fat',
    'fiber_100g',
    'fiber',
    'salt_100g',
    'salt',
    'sodium_100g',
    'sodium',
  ];
  const macroCount = macroKeys.filter((key) => typeof nutriments[key] === 'number').length;

  return (hasEnergy && macroCount >= 2) || macroCount >= 3;
}

/**
 * Decide whether an OFF product is ready for analysis or needs label photos.
 * "Complete" requires identity + ingredients + meaningful nutrition.
 */
export function evaluateProductCompleteness(
  product: NormalizedOffProduct | null | undefined,
): ProductCompleteness {
  if (!product) {
    return { status: 'not_found' };
  }

  const nonFoodReason = isNonFoodProduct(product);
  if (nonFoodReason) {
    return { status: 'not_food', reason: nonFoodReason };
  }

  const missing: string[] = [];

  const hasIdentity = Boolean(product.productName || product.brand);
  if (!hasIdentity) missing.push('product name');

  const hasIngredients = Boolean(product.ingredientsText || product.ingredients.length > 0);
  if (!hasIngredients) missing.push('ingredients');

  const hasNutrition = hasMeaningfulNutrition(product.nutriments);
  if (!hasNutrition) missing.push('nutrition');

  if (missing.length === 0) {
    return {
      status: 'complete',
      reasons: ['Product identity, ingredients, and nutrition are available from Open Food Facts.'],
    };
  }

  return { status: 'needs_label', missing };
}

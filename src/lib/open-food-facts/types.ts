/**
 * Minimal Open Food Facts shapes used by the barcode fast path.
 * Only the fields requested by the client are modelled; everything else
 * is ignored so upstream additions cannot break the app.
 */

export type OffIngredient = {
  id?: string;
  text?: string;
  percent?: number;
};

export type OffNutrientLevels = {
  fat?: string;
  salt?: string;
  'saturated-fat'?: string;
  sugars?: string;
};

export type OffRawProduct = {
  code?: string;
  product_name?: string;
  brands?: string;
  quantity?: string;
  serving_size?: string;
  ingredients_text?: string;
  ingredients?: OffIngredient[];
  allergens?: string;
  allergens_tags?: string[];
  traces_tags?: string[];
  additives_tags?: string[];
  nutriments?: Record<string, unknown>;
  nutrient_levels?: OffNutrientLevels;
  nutrition_grades?: string;
  nutriscore_grade?: string;
  nova_group?: number | string;
  nova_groups_tags?: string[];
  categories_tags?: string[];
  labels_tags?: string[];
  image_front_url?: string;
  product_type?: string;
};

export type OffV3SuccessResponse = {
  status?: string;
  code?: string;
  product?: OffRawProduct;
};

export type OffV2SuccessResponse = {
  status?: number;
  status_verbose?: string;
  code?: string;
  product?: OffRawProduct;
};

/**
 * Normalized product used inside the app. This is the only OFF shape the
 * UI and (later) the analysis endpoint are allowed to consume.
 */
export type NormalizedOffProduct = {
  barcode: string;
  productName: string | null;
  brand: string | null;
  quantity: string | null;
  servingSize: string | null;
  ingredientsText: string | null;
  ingredients: string[];
  allergens: string | null;
  allergensTags: string[];
  tracesTags: string[];
  additivesTags: string[];
  nutriments: Record<string, number>;
  nutrientLevels: {
    fat: string | null;
    saturatedFat: string | null;
    sugar: string | null;
    salt: string | null;
  };
  nutritionGrade: string | null;
  novaGroup: number | null;
  categoriesTags: string[];
  labelsTags: string[];
  imageFrontUrl: string | null;
  productType: string | null;
  source: 'v3' | 'v2';
};

export type ProductCompleteness =
  | { status: 'complete'; reasons: string[] }
  | { status: 'needs_label'; missing: string[] }
  | { status: 'not_food'; reason: string }
  | { status: 'not_found' };

export type OffLookupErrorKind =
  | 'not_found'
  | 'invalid_barcode'
  | 'timeout'
  | 'rate_limited'
  | 'network_error'
  | 'server_error'
  | 'invalid_response';

export type OffLookupError = {
  kind: OffLookupErrorKind;
  /** Safe, non-technical message suitable for the UI. */
  userMessage: string;
};

export type OffLookupResult =
  | { kind: 'success'; product: NormalizedOffProduct }
  | { kind: 'error'; error: OffLookupError };

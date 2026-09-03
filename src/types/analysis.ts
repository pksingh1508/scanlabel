export type AnalysisSource = 'label_image' | 'open_food_facts' | 'combined';

export type Verdict =
  | 'good_general_choice'
  | 'okay_in_moderation'
  | 'best_limited'
  | 'insufficient_data';

export type Confidence = 'high' | 'medium' | 'low';

export type NutritionValue = {
  value: number | null;
  unit: string | null;
};

export type IngredientItem = {
  name: string;
  normalizedName: string | null;
  explanation: string;
  category:
    | 'common_food'
    | 'sugar'
    | 'fat_or_oil'
    | 'protein'
    | 'fiber'
    | 'salt'
    | 'additive'
    | 'sweetener'
    | 'preservative'
    | 'color'
    | 'flavor'
    | 'allergen'
    | 'other';
  concernLevel: 'none' | 'low' | 'moderate' | 'unknown';
  evidence: string | null;
};

export type ProductAnalysis = {
  schemaVersion: 1;
  source: AnalysisSource;
  product: {
    name: string | null;
    brand: string | null;
    barcode: string | null;
    servingSize: string | null;
  };
  verdict: {
    value: Verdict;
    title: string;
    shortReason: string;
    confidence: Confidence;
  };
  calories: {
    perServingKcal: number | null;
    per100gKcal: number | null;
  };
  nutrition: {
    protein: NutritionValue;
    carbohydrates: NutritionValue;
    sugars: NutritionValue;
    fat: NutritionValue;
    saturatedFat: NutritionValue;
    fiber: NutritionValue;
    sodium: NutritionValue;
    salt: NutritionValue;
  };
  ingredients: {
    rawText: string | null;
    items: IngredientItem[];
  };
  allergens: {
    declared: string[];
    traces: string[];
    statement: string | null;
  };
  labelSignals: {
    nutriScore: string | null;
    novaGroup: number | null;
    nutrientLevels: {
      fat: string | null;
      saturatedFat: string | null;
      sugar: string | null;
      salt: string | null;
    };
    additives: string[];
  };
  positives: string[];
  concerns: string[];
  dataQuality: {
    confidence: Confidence;
    missingFields: string[];
    warnings: string[];
  };
  disclaimer: string;
};

# AGENT.md — Label Scanner Product Contract

## 1. Purpose of This File

This file is the permanent product and engineering contract for the project.

Every coding agent working in this repository must read this file before making changes.

If a task, idea, dependency, or implementation conflicts with this file, preserve the product constraints in this file unless the human owner explicitly changes them.

Do not silently expand scope.

---

# 2. Product Summary

Build a simple mobile app that lets a user scan a packaged food label and immediately understand:

- what the product is,
- its calorie and nutrition information,
- all ingredients that can be read from the label,
- what important ingredients mean in plain language,
- allergens explicitly declared on the label,
- notable nutrition concerns such as high sugar, sodium, or saturated fat,
- notable positive nutrition characteristics such as protein or fiber,
- additives or processing indicators when they can be identified,
- and a simple general food-choice assessment.

The app exists for one job:

> Scan a food product → understand the label → decide how often it makes sense to eat.

The app is intentionally NOT a calorie diary, health tracker, meal planner, social app, or user-account product.

---

# 3. Hard Product Constraints

These constraints are mandatory.

## 3.1 No authentication

Do not add:

- Clerk
- Firebase Auth
- Supabase Auth
- Auth0
- login
- signup
- OTP
- social login
- account creation
- user profiles

The user should be able to open the app and scan immediately.

## 3.2 No application database

Do not add:

- Convex
- Supabase database
- Firebase Firestore
- PostgreSQL
- SQLite for application data
- MongoDB
- Realm
- scan-history storage
- cloud persistence

The MVP must not keep a user's scan history.

Temporary in-memory state for the current scan is allowed.

Temporary camera files in the device/app cache are allowed and must be discarded when no longer needed.

OS-managed permission state is allowed.

## 3.3 No personalized medical advice

The app does not know the user's:

- age,
- health conditions,
- allergies,
- medications,
- pregnancy status,
- dietary goals,
- weight-loss plan,
- clinician recommendations,
- or medical history.

Therefore the app must never present a result as a personalized medical judgment.

Do not say:

- "You should eat this."
- "You should never eat this."
- "This is safe for your diabetes."
- "This is safe for your allergy."
- "This will cause cancer."
- "This product is healthy for you."

Prefer language such as:

- "Good general choice"
- "Okay in moderation"
- "Best limited"
- "Insufficient label data"
- "High in sugar"
- "Contains a declared milk allergen"
- "Based on the photographed label..."
- "For general informational use, not medical advice."

## 3.4 No hidden AI/API secret in the mobile bundle

Never place a paid API key in:

- EXPO_PUBLIC_* variables,
- React Native source,
- app.json extras exposed to the client,
- bundled JavaScript,
- or any client-accessible config.

Paid AI requests must go through a server-side endpoint.

## 3.5 Do not overbuild

Do not add these unless explicitly requested later:

- onboarding carousel,
- login,
- user settings account,
- favorites,
- history,
- streaks,
- social sharing,
- push notifications,
- subscriptions,
- payments,
- meal logging,
- recipe generation,
- wearable integrations,
- barcode contribution workflow,
- admin dashboard,
- CMS.

---

# 4. Target Product Scope

The MVP is for packaged human food and beverages with a readable label.

Examples:

- biscuits
- cereal
- chips
- protein bars
- milk
- juice
- soft drinks
- sauces
- noodles
- frozen food
- canned food
- packaged snacks
- supplements only if their label is clearly interpretable as food/supplement information

The app should not pretend to calculate calories for objects that do not have usable nutrition information.

If the scan appears to be:

- cosmetics,
- household products,
- medicine,
- pet food,
- non-food products,
- or an unreadable object,

the app should say that the item is outside the food-label analysis scope or that more label information is required.

---

# 5. Core User Experience

The ideal experience should take only a few taps.

## Main flow

1. User opens the app.
2. Camera screen is immediately available.
3. App continuously looks for common food barcodes.
4. User can:
   - scan a barcode, or
   - tap "Scan label" and photograph the label directly.
5. If a barcode is found:
   - query Open Food Facts,
   - use useful product data immediately if sufficiently complete,
   - otherwise ask the user to photograph the ingredient list and/or nutrition panel.
6. If the user photographs a label:
   - capture a readable image,
   - allow retake,
   - optionally capture a second image if ingredients and nutrition facts are on different sides,
   - compress images before upload.
7. Show an analyzing state.
8. Produce one structured result.
9. User reads the result.
10. User taps "Scan another" and all scan state is cleared.

There is no save button and no history screen.

---

# 6. Recommended Technical Architecture

## 6.1 Mobile

Use:

- React Native
- Expo
- TypeScript
- Expo Router
- expo-camera
- expo-image-manipulator
- react-native-safe-area-context
- built-in fetch
- lightweight local state only

Prefer Expo SDK packages whenever possible.

Do not add a state-management library unless state becomes genuinely difficult to manage.

For the MVP, React state/context is enough.

## 6.2 Barcode scanning

Use `expo-camera` barcode support.

Support at minimum:

- EAN-13
- EAN-8
- UPC-A
- UPC-E

Debounce barcode callbacks so one barcode does not trigger repeated requests.

Do not perform product search-as-you-type.

## 6.3 Public food-data source

Use Open Food Facts as an optional acceleration/enrichment source.

Recommended request:

`GET https://world.openfoodfacts.org/api/v3/product/{barcode}?product_type=all&fields=...`

or use the stable v2 endpoint if a required v3 field is problematic.

Request only required fields.

Useful fields include:

- code
- product_name
- brands
- quantity
- serving_size
- ingredients_text
- ingredients
- allergens
- allergens_tags
- traces_tags
- additives_tags
- nutriments
- nutrient_levels
- nutrition_grades
- nova_group
- nova_groups_tags
- categories_tags
- labels_tags
- image_front_url

Open Food Facts is community-maintained data. It may be missing, incomplete, old, or incorrect.

The photographed physical label is the higher-priority source whenever the user provides one.

Never silently present Open Food Facts data as if it was read from the current package.

Show source metadata internally in the result model.

Use a proper identifying User-Agent as requested by Open Food Facts.

Respect their API rate limits.

Do not upload user images to Open Food Facts in the MVP.

## 6.4 AI analysis endpoint

Use one stateless server endpoint in the same Expo Router project when practical:

`src/app/api/analyze+api.ts`

Purpose:

- protect the OpenRouter API key,
- accept label image(s) and/or normalized Open Food Facts data,
- extract the relevant label facts,
- explain ingredients,
- return strict structured JSON,
- perform no persistence.

The endpoint must not write requests, images, or results to an application database.

Do not intentionally log full base64 images.

Use server-only environment variable:

`OPENROUTER_API_KEY`

Keep the OpenRouter model slug in a separate server-only environment variable:

`OPENROUTER_ANALYSIS_MODEL`

Never expose it through `EXPO_PUBLIC_*`.

All paid AI inference must be sent through OpenRouter's server-side gateway. Do not call an underlying model provider directly and do not configure provider-specific API keys or endpoints in the mobile app or server analysis service.

Use either built-in server-side `fetch` or the official OpenRouter SDK. The gateway endpoint is:

`POST https://openrouter.ai/api/v1/chat/completions`

## 6.5 AI model strategy

Primary goal: accuracy on label extraction and low cost.

Use a current model available through OpenRouter that supports:

- image input,
- text input,
- structured output / JSON schema.

Verify these capabilities against the current OpenRouter model metadata before selecting the model. When requesting structured output, use `response_format.type = "json_schema"`, strict mode, and OpenRouter provider routing with `require_parameters: true` so the request is not routed to an endpoint that lacks required parameters.

For cost-sensitive production traffic, prefer the current cost-efficient vision-capable model unless evaluation shows unacceptable extraction quality.

A stronger model may be used as a fallback for difficult labels.

Do not hard-code assumptions about a model forever. Keep the OpenRouter model slug in server-side environment/config so it can be changed without redesigning the app.

The application must remain provider-agnostic behind the OpenRouter gateway. It may change the selected model or underlying provider without changing the mobile client or normalized result schema.

## 6.6 Why server-side AI is required

A mobile app cannot safely contain the OpenRouter API key.

The server route may be completely stateless and still satisfy the product requirement of:

- no authentication,
- no database.

The API route is infrastructure, not a user-account backend.

---

# 7. Source-of-Truth Rules

Use this priority order:

## Priority 1 — User-photographed current package label

When readable, this is the best source for:

- nutrition facts,
- ingredients,
- allergen statements,
- serving size,
- product claims.

## Priority 2 — Open Food Facts barcode result

Use it when:

- barcode is confidently detected,
- the product is found,
- the relevant fields are present.

If a photographed label conflicts with Open Food Facts, prefer the photographed label and flag the discrepancy internally.

## Priority 3 — AI interpretation

AI may:

- extract text/facts from the visible label,
- normalize nutrient names,
- explain an ingredient,
- classify general concerns,
- summarize.

AI must NOT invent:

- missing calories,
- missing serving size,
- missing ingredient percentages,
- undeclared allergens,
- product certifications,
- medical effects,
- exact quantities not visible in the source.

Unknown must remain unknown.

---

# 8. Scan Strategy

The scan experience should support two complementary paths.

## Path A — Barcode fast path

Best when Open Food Facts has complete data.

Flow:

`camera → barcode → Open Food Facts → validate completeness → analyze → result`

If sufficient ingredients and nutrition data are available, the app does not need the user to photograph the label.

If data is incomplete:

`barcode → incomplete → request label photo(s) → analyze → result`

## Path B — Direct label path

Works even when the barcode is unavailable or product is missing.

Flow:

`camera → photo ingredients/nutrition → optional second photo → analyze → result`

The UI should teach the user to:

- keep the label flat,
- fill the frame,
- avoid glare,
- focus the camera,
- capture the nutrition panel and ingredients clearly.

---

# 9. Image Handling Rules

Before upload:

- resize large camera images,
- preserve enough text resolution,
- use JPEG unless transparency is necessary,
- use moderate compression,
- remove unnecessary EXIF metadata when practical,
- reject obviously empty image state.

A sensible starting target:

- longest edge around 1600–2000 px,
- JPEG quality around 0.7–0.8.

Do not aggressively downscale tiny ingredient text.

Maximum images per analysis in MVP:

- 2 images

Preferred captures:

1. ingredients / allergen panel
2. nutrition facts panel

If one photo clearly contains both, one image is enough.

Delete or abandon temporary local image references after:

- result completion,
- cancellation,
- "Scan another",
- or fatal error.

---

# 10. Required Result Data Model

The AI/server result must be validated against a strict schema.

Use a model similar to:

```ts
type AnalysisSource = "label_image" | "open_food_facts" | "combined";

type Verdict =
  | "good_general_choice"
  | "okay_in_moderation"
  | "best_limited"
  | "insufficient_data";

type Confidence = "high" | "medium" | "low";

type NutritionValue = {
  value: number | null;
  unit: string | null;
};

type IngredientItem = {
  name: string;
  normalizedName: string | null;
  explanation: string;
  category:
    | "common_food"
    | "sugar"
    | "fat_or_oil"
    | "protein"
    | "fiber"
    | "salt"
    | "additive"
    | "sweetener"
    | "preservative"
    | "color"
    | "flavor"
    | "allergen"
    | "other";
  concernLevel: "none" | "low" | "moderate" | "unknown";
  evidence: string | null;
};

type ProductAnalysis = {
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
```

The exact implementation may evolve, but all result screens should consume one normalized schema rather than raw provider responses.

---

# 11. General Food-Choice Assessment Rules

The result is educational, not medical.

The verdict should be explainable.

## `good_general_choice`

Use only when available evidence is broadly favorable for the type of product and there are no major label concerns.

## `okay_in_moderation`

Use for many ordinary packaged foods where there are mixed positives/negatives or where portion size matters.

## `best_limited`

Use when the available label data clearly indicates one or more notable concerns such as very high sugar, sodium, saturated fat, energy density, or similar signals.

Do not use fear-based language.

Do not equate "contains additives" with "dangerous."

## `insufficient_data`

Use when:

- label is unreadable,
- nutrition data is missing,
- ingredients are missing,
- conflicting data cannot be resolved,
- the item is outside scope.

If data is insufficient, do not manufacture a verdict.

---

# 12. Nutrition Rules

## 12.1 Preserve the label's basis

Nutrition values may be:

- per serving,
- per 100 g,
- per 100 ml.

Do not mix them.

Always preserve units and basis.

If conversion is required, only calculate it when serving weight/volume is explicitly known.

## 12.2 Calories

Never infer calories purely from a product name.

Use:

- explicit kcal on the label,
- or reliable Open Food Facts nutriment data.

If only kJ is available, conversion to kcal is allowed using a deterministic calculation.

## 12.3 Sodium and salt

Keep sodium and salt distinct.

Do not label sodium as salt without a correct deterministic conversion.

## 12.4 Missing values

Use `null`, not zero.

Zero means the label explicitly reports zero.

---

# 13. Ingredient Analysis Rules

For every ingredient that can be confidently parsed:

- retain the original wording,
- normalize the common name when possible,
- give a short plain-language explanation,
- avoid sensational claims,
- distinguish evidence from inference.

Examples of useful explanations:

- emulsifier: helps oil/water ingredients stay mixed,
- preservative: helps slow spoilage,
- sweetener: provides sweetness with or without sugar,
- stabilizer: helps maintain texture.

Do not call an approved additive "toxic" simply because it has an E-number.

Do not claim an ingredient causes disease unless the source label itself contains an applicable warning.

---

# 14. Allergen Rules

Allergen output must be conservative.

Use only:

- explicit "contains" statements,
- explicit "may contain" / traces statements,
- clearly marked allergen information in trusted structured product data.

Do not infer an allergy declaration simply because an ingredient is related to a common allergen when the wording is ambiguous.

UI must visually distinguish:

- `Contains`
- `May contain / traces`

Always state that users with severe allergies should verify the physical package and manufacturer information.

---

# 15. AI Prompting Contract

The server-side AI instructions must require:

1. Read only the provided image/data.
2. Never fabricate missing nutrition facts.
3. Return the required JSON schema.
4. Treat the physical label as the primary source when present.
5. Identify uncertainty.
6. Separate declared allergens from possible traces.
7. Keep ingredient explanations short and factual.
8. Give a general food-choice assessment, not medical advice.
9. Do not diagnose or treat disease.
10. If the photo is unreadable, return `insufficient_data`.
11. If the image is not a food label, return `insufficient_data` with a scope warning.
12. Preserve units exactly before any deterministic normalization.

Prefer structured outputs / JSON schema rather than parsing free-form prose.

---

# 16. Open Food Facts Integration Rules

Open Food Facts should improve speed, not become a single point of failure.

## Request behavior

- normalize barcode,
- fetch only needed fields,
- use an identifying User-Agent,
- implement timeout,
- handle 404/not-found normally,
- handle malformed/incomplete product data,
- respect rate limits,
- do not repeatedly re-fetch the same barcode during one scan.

## Completeness gate

A barcode result is "analysis-ready" only if it contains enough useful information.

Suggested minimum:

- at least product identity, AND
- ingredients OR meaningful ingredient-analysis fields, AND
- meaningful nutrition values.

If the data is not sufficient, request a label photo.

## Licensing

Open Food Facts database reuse has license/attribution obligations.

Before release, add the required attribution in an About / Data Sources area if the app displays/reuses their data.

Do not reuse product images without checking and honoring the applicable image license/attribution requirements.

---

# 17. Network and Error UX

Never dump technical errors to the user.

Required states:

- camera permission denied
- no camera
- barcode lookup
- barcode product not found
- requesting label photo
- image preparing
- analysis in progress
- network offline
- analysis timeout
- API rate limited
- unreadable label
- insufficient information
- successful result

Useful messages:

- "We couldn't read enough of the label. Try again with better light."
- "This barcode isn't in our food database yet. Scan the label instead."
- "You're offline. Connect to the internet to analyze this label."
- "We found the product, but the nutrition information is incomplete. Scan the nutrition panel."

Always offer a next action.

---

# 18. Privacy Principles

The app is deliberately privacy-minimal.

MVP policy:

- no account,
- no database,
- no scan history,
- no background collection,
- no contact/location access,
- no microphone permission,
- no advertising SDK by default,
- no unnecessary device identifiers.

Camera access is used only for scanning labels/barcodes.

Images sent for AI analysis must be treated as transient request data.

Do not intentionally store them.

Do not log full image payloads.

If analytics is added later, it must never contain:

- label images,
- full OCR/ingredient text,
- health information,
- raw API responses with sensitive user content.

---

# 19. Security and Abuse Controls

Even without user authentication, the AI endpoint costs money and can be abused.

For MVP:

- enforce request body size limits,
- accept only expected image MIME types,
- cap images per request,
- validate JSON,
- cap output size,
- enforce server timeout,
- use OpenRouter API-key spend limits, privacy controls, and provider-routing controls,
- use hosting-provider rate limiting/WAF where available,
- return generic server errors,
- do not expose provider errors or secrets.

OpenRouter forwards requests to an underlying model provider, whose retention policy may differ. Before production, disable optional prompt/completion logging, deny providers that may collect data where supported, and verify the selected route's current retention/training policy. Prefer Zero Data Retention routing when it is compatible with the chosen model and reliability requirements.

Do not rely on a secret hard-coded in the mobile application. Attackers can extract it.

Before large-scale public launch, evaluate app/device attestation or another abuse-control mechanism that does not require user accounts.

---

# 20. Performance Targets

Aim for:

- camera ready quickly after permission,
- barcode recognition perceived as instant,
- Open Food Facts lookup usually under a few seconds,
- compressed images rather than original multi-megabyte camera photos,
- clear loading state for AI analysis,
- result rendering without unnecessary animation delays.

Do not block the JS thread with image-heavy synchronous work.

---

# 21. UI Direction

The app should feel:

- clean,
- fast,
- trustworthy,
- modern,
- food-focused,
- easy to understand in a grocery store.

Avoid a clinical hospital aesthetic.

Avoid fear-based red warning overload.

Use semantic hierarchy:

1. verdict
2. calories/macros
3. key concerns/positives
4. allergens
5. ingredients
6. details/data quality
7. disclaimer

Suggested result sections:

- Product
- Overall assessment
- Calories & macros
- What stands out
- Allergens
- Ingredients explained
- Label details
- Data quality
- Disclaimer
- Scan another

---

# 22. Accessibility

At minimum:

- readable font sizes,
- sufficient contrast,
- buttons with accessible labels,
- do not communicate verdict by color alone,
- support dynamic text where practical,
- meaningful loading labels,
- camera controls with screen-reader labels.

---

# 23. Suggested Project Structure

```text
src/
  app/
    _layout.tsx
    index.tsx
    capture.tsx
    analyzing.tsx
    result.tsx
    about.tsx

    api/
      analyze+api.ts

  components/
    scanner/
      CameraScanner.tsx
      ScanGuide.tsx
      BarcodeStatus.tsx

    result/
      VerdictCard.tsx
      NutritionCard.tsx
      MacroRow.tsx
      AllergenCard.tsx
      IngredientList.tsx
      IngredientRow.tsx
      SignalsCard.tsx
      DataQualityCard.tsx

    ui/
      Button.tsx
      Card.tsx
      Badge.tsx
      LoadingState.tsx
      ErrorState.tsx

  lib/
    open-food-facts/
      client.ts
      normalize.ts
      types.ts

    analysis/
      schema.ts
      normalize.ts
      prompts.ts
      client.ts

    image/
      prepareImage.ts

    barcode/
      normalizeBarcode.ts

  state/
    scan-context.tsx

  types/
    analysis.ts

  constants/
    config.ts
```

This structure is a guideline. Keep modules small and boundaries clear.

---

# 24. Testing Requirements

Do not consider the MVP complete without testing these cases:

1. Barcode found with complete Open Food Facts data.
2. Barcode found but missing ingredients.
3. Barcode found but missing nutrition.
4. Barcode not found.
5. Direct label scan with one clear photo.
6. Direct label scan requiring two photos.
7. Blurry label.
8. Glare/partial label.
9. Nutrition panel with per-serving values.
10. Nutrition panel with per-100g values.
11. Product with explicit allergen declaration.
12. Product with "may contain" traces.
13. Product with multiple additives.
14. Zero-sugar beverage.
15. High-sugar snack.
16. Very salty product.
17. Image that is not food.
18. No internet.
19. Server timeout.
20. AI returns malformed/unexpected data.
21. User denies camera permission.
22. Repeated barcode callback does not make duplicate requests.

For AI testing, keep a small local set of test label images that the repository owner is legally allowed to use.

Do not commit secrets.

---

# 25. Definition of MVP Done

The MVP is done only when:

- app opens without account creation,
- camera permission works,
- user can scan a common barcode,
- Open Food Facts lookup works,
- user can capture label photos when required,
- image is compressed before AI upload,
- API key stays server-side,
- AI endpoint returns strict validated JSON,
- calories and major nutrients display correctly,
- ingredients are explained,
- allergens are clearly separated,
- verdict is explainable and non-medical,
- insufficient data is handled safely,
- "Scan another" resets all transient state,
- no application database exists,
- no scan history exists,
- production error states are usable,
- privacy/data-source/disclaimer text exists,
- real-device Android and iOS testing has been performed.

---

# 26. Development Rules for Coding Agents

Every agent must follow these rules:

1. Read `AGENT.md`.
2. Read `implementation.md`.
3. Determine the current implementation step.
4. Work only on the current step unless a dependency must be fixed.
5. Do not begin the next step until the current step's gate passes.
6. Do not add unrelated features.
7. Prefer current official documentation over assumptions.
8. Use `npx expo install` for Expo-managed dependency compatibility.
9. Keep TypeScript strict.
10. Validate external API responses.
11. Never trust AI output without schema validation.
12. Never expose server secrets to the client.
13. Never introduce authentication or a database unless explicitly requested.
14. Do not silently change the product verdict semantics.
15. Update `implementation.md` checkboxes/status when a step is actually completed and verified.
16. If blocked, document the blocker under the current step instead of skipping ahead.
17. Maintain a working app after every completed step.
18. Avoid premature abstraction.
19. Prefer simple code that can be audited.
20. Do not mark a step complete merely because code compiles; satisfy its verification gate.

---

# 27. Research Basis / Official References

These references informed the architecture. Re-check official docs when implementing because APIs and SDK versions change.

## Expo Camera
https://docs.expo.dev/versions/latest/sdk/camera/

## Expo API Routes
https://docs.expo.dev/router/web/api-routes/

## EAS Hosting
https://docs.expo.dev/eas/hosting/introduction/

## Open Food Facts API
https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/

## Open Food Facts barcode scanning
https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/tutorials/scanning-barcodes/

## Open Food Facts product endpoint
https://openfoodfacts.github.io/documentation/docs/Product-Opener/v3/products/get-api-v3-product-code/

## Open Food Facts product attributes
https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/explain-product-attributes/

## Open Food Facts licensing
https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/tutorials/license-be-on-the-legal-side/

## OpenRouter quickstart / authentication
https://openrouter.ai/docs/quickstart

## OpenRouter image inputs
https://openrouter.ai/docs/guides/overview/multimodal/image-understanding

## OpenRouter structured outputs
https://openrouter.ai/docs/guides/features/structured-outputs

## OpenRouter provider routing and parameter enforcement
https://openrouter.ai/docs/guides/routing/provider-selection

## OpenRouter data collection and provider retention
https://openrouter.ai/docs/guides/privacy/data-collection
https://openrouter.ai/docs/guides/privacy/provider-logging

---

# 28. Final Product Principle

When deciding between two implementations, choose the one that better supports:

> Fast scan, trustworthy label facts, simple explanation, minimal data collection.

The app should remain intentionally small.

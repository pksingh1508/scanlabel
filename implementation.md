# implementation.md — Sequential Implementation Plan

## How to Use This File

This is the required build order.

Steps are synchronized and sequential.

**Do not start Step N+1 until Step N is fully implemented, tested, and its gate is passed.**

After finishing a step:

1. run its verification,
2. fix failures,
3. mark its checklist complete,
4. record any important decision,
5. only then move to the next step.

If a later step reveals a defect in an earlier foundation, return to the earlier step, fix it, re-run the gate, and then continue.

---

# Current Status

- [x] Step 0 — Lock product contract
- [x] Step 1 — Create Expo project foundation
- [ ] Step 2 — Build static UI shell
- [ ] Step 3 — Implement camera permission and scanner
- [ ] Step 4 — Implement barcode fast path
- [ ] Step 5 — Implement label photo capture
- [ ] Step 6 — Implement image preparation
- [ ] Step 7 — Define normalized analysis schema
- [ ] Step 8 — Build stateless server analysis endpoint
- [ ] Step 9 — Integrate OpenRouter structured label analysis
- [ ] Step 10 — Connect scan pipeline end-to-end
- [ ] Step 11 — Build production result UI
- [ ] Step 12 — Add reliability, privacy, and abuse protection
- [ ] Step 13 — Test with real food labels
- [ ] Step 14 — Prepare production builds and release requirements

---

# Step 0 — Lock Product Contract

## Goal

Make sure the repository has one unambiguous definition of the app before code is written.

## Tasks

- [x] Add `AGENTS.md` to repository root.
- [x] Add this `implementation.md` to repository root.
- [x] Confirm MVP constraints:
  - [x] no authentication
  - [x] no application database
  - [x] no scan history
  - [x] no user profile
  - [x] no payment
  - [x] no medical diagnosis
  - [x] server route allowed only for secure stateless analysis
- [x] Choose a temporary app name/package slug.
- [x] Decide initial supported UI language: English.
- [x] Decide supported target platforms:
  - [x] Android
  - [x] iOS

## Recorded Decisions

- Canonical product contract: `AGENTS.md`.
- Temporary app name: `ScanLabel`.
- Expo/package slug: `scanlabel`.
- Initial UI language: English (`en`).
- Target platforms: Android and iOS.
- AI access: stateless server route through OpenRouter only; no AI provider secret in the mobile bundle.
- Product boundaries remain fixed: no authentication, application database, scan history, user profile, payment, or personalized medical diagnosis.

## Step Status

Completed on 2026-09-03. Both product files exist, the temporary product identity and initial platforms are resolved, and no architecture question remains that blocks project foundation work.

## Gate

Step 0 passes when both product files exist and there are no unresolved architecture questions preventing project initialization.

**Do not start Step 1 until Step 0 passes.**

---

# Step 1 — Create Expo Project Foundation

## Goal

Create the smallest production-ready Expo/TypeScript foundation.

## Recommended setup

Use the current stable Expo SDK at implementation time.

Prefer:

```bash
npx create-expo-app@latest
```

Use TypeScript and Expo Router.

Use the package manager already preferred by the repository owner. If none exists, pnpm is acceptable.

## Dependencies

Install only what is needed initially:

```bash
npx expo install expo-camera
npx expo install expo-image-manipulator
npx expo install react-native-safe-area-context
```

Do not install a direct model-provider SDK. At Step 8/9, use server-side `fetch` or install the official OpenRouter SDK only if it materially simplifies the implementation.

## Configuration

Set:

- application name
- slug
- Android package
- iOS bundle identifier
- camera permission copy

Camera permission copy should explain the real purpose, for example:

> Allow this app to use your camera to scan food labels and barcodes.

Do not request microphone permission unless technically unavoidable. Configure camera so audio recording is not required for this product.

## Baseline structure

Create:

```text
src/app/
src/components/
src/lib/
src/state/
src/types/
src/constants/
```

## Engineering configuration

- [x] TypeScript strict mode
- [x] ESLint works
- [x] formatter intentionally deferred; optional formatting is not required for the foundation
- [x] `.env` ignored
- [x] `.env.example` created without secrets
- [x] no API key in source
- [x] project boots without warnings caused by our code

## Verification

Run:

```bash
npx expo-doctor
```

Then launch the project.

Verify:

- [x] app renders on Android device/emulator
- [x] app renders on iOS device/simulator where available
- [x] no auth/database package exists
- [x] no secret exists in the client bundle

## Recorded Decisions

- Expo SDK: `57.0.0` (`expo` package `~57.0.19`).
- Package manager: pnpm `10.33.0`.
- Android package: `com.pawankumar.scanlabel`.
- iOS bundle identifier: `com.pawankumar.scanlabel`.
- Camera permission copy: “Allow ScanLabel to use your camera to scan food labels and barcodes.”
- Microphone access is disabled in the `expo-camera` config plugin for both iOS and Android.
- No formatter was added; ESLint and TypeScript are the foundation quality gates.

## Step Status

Completed on 2026-09-03. The minimal app rendered successfully on a Pixel 9 Android emulator and an iPhone 17 Pro iOS simulator. Lint, strict TypeScript, Expo Doctor, app-config validation, and production exports for Android, iOS, and web all passed. The repository contains no authentication/database package or client secret.

## Gate

Step 1 passes only when the blank app reliably starts and project tooling is healthy.

**Do not start Step 2 until Step 1 passes.**

---

# Step 2 — Build Static UI Shell

## Goal

Build the navigation and screens with fake data before integrating hardware or APIs.

This prevents camera/API complexity from becoming mixed with layout work.

## Routes

Create:

```text
src/app/_layout.tsx
src/app/index.tsx
src/app/capture.tsx
src/app/analyzing.tsx
src/app/result.tsx
src/app/about.tsx
```

Exact route names may be simplified if the agent has a cleaner Expo Router structure, but preserve the same user flow.

## Home / scanner shell

Display:

- app name/logo placeholder
- "Scan a food label"
- camera placeholder
- scan guide rectangle
- primary scan instruction
- "Scan label" capture button
- short privacy note

Do not add onboarding.

## Analyzing screen

Display a non-technical progress UI with stages such as:

- Reading label
- Checking nutrition
- Explaining ingredients

These labels are UX only; do not falsely claim exact backend stages.

## Result screen

Build against hard-coded fixture data matching the future `ProductAnalysis` schema.

Sections:

1. Product name / brand
2. Overall assessment
3. Calories
4. Macro/nutrition card
5. Key positives
6. Key concerns
7. Allergens
8. Ingredients explained
9. Label signals
10. Data quality
11. Disclaimer
12. Scan another

## About screen

Include placeholders for:

- What the app does
- Privacy
- General-information disclaimer
- Data sources
- Open Food Facts attribution area

## UI principles

- no fear-based design
- no verdict conveyed only with color
- large scan action
- grocery-store readable
- minimal scrolling before important information
- ingredient details may be collapsible

## Verification

- [ ] all routes open
- [ ] back navigation behaves correctly
- [ ] fake result renders from one normalized fixture object
- [ ] long ingredient list is scrollable
- [ ] long product name does not break layout
- [ ] dynamic text does not overlap critical controls
- [ ] "Scan another" returns to initial scanner state

## Gate

Step 2 passes when the complete app can be demoed using only fake data.

**Do not start Step 3 until Step 2 passes.**

---

# Step 3 — Implement Camera Permission and Scanner

## Goal

Replace the static scanner with the real device camera.

## Tasks

- [ ] request camera permission
- [ ] handle `granted`
- [ ] handle `denied`
- [ ] handle permission not yet determined
- [ ] render `CameraView`
- [ ] use back camera
- [ ] implement torch toggle if useful
- [ ] display scan guide overlay
- [ ] pause/deactivate camera when screen loses focus
- [ ] avoid microphone permission
- [ ] add accessible labels to camera controls

## Barcode types

Configure common food formats:

- EAN-13
- EAN-8
- UPC-A
- UPC-E

Optionally support additional common retail barcode types if Expo provides them without complexity.

## Debouncing

Implement a scan lock:

```text
idle
→ barcode_detected
→ lookup_in_progress
→ result/incomplete/not_found
→ unlock only when user returns/retries
```

Do not allow 20 camera frames to cause 20 network calls.

## Permission-denied UX

Explain how to enable camera access.

Provide a retry/open-settings action if appropriate.

## Verification

On a real device:

- [ ] camera opens
- [ ] permission prompt appears correctly
- [ ] denial state is usable
- [ ] barcode callback fires
- [ ] repeated frames do not trigger duplicate actions
- [ ] leaving the screen stops unnecessary camera work

## Gate

Step 3 passes when scanning hardware behavior is stable.

**Do not start Step 4 until Step 3 passes.**

---

# Step 4 — Implement Barcode Fast Path

## Goal

Use a barcode to fetch packaged-food information without requiring a label photo when possible.

## Create modules

```text
src/lib/barcode/normalizeBarcode.ts
src/lib/open-food-facts/client.ts
src/lib/open-food-facts/types.ts
src/lib/open-food-facts/normalize.ts
```

## Barcode normalization

Handle:

- string cleanup
- numeric validation where appropriate
- leading-zero UPC/EAN normalization carefully
- duplicate callback protection

Do not arbitrarily modify valid barcodes.

## Open Food Facts request

Use the product-by-code endpoint.

Prefer v3 if stable for required fields; fall back to v2 when needed.

Request only required fields.

Set an identifying User-Agent as required by Open Food Facts.

Example conceptual fields:

```text
code
product_name
brands
quantity
serving_size
ingredients_text
ingredients
allergens
allergens_tags
traces_tags
additives_tags
nutriments
nutrient_levels
nutrition_grades
nova_group
categories_tags
labels_tags
```

## Timeouts

Implement an abort timeout.

Do not leave the scanner stuck indefinitely.

## Product completeness function

Create one function:

```ts
evaluateProductCompleteness(product)
```

Return something like:

```ts
type ProductCompleteness =
  | { status: "complete"; reasons: string[] }
  | { status: "needs_label"; missing: string[] }
  | { status: "not_food"; reason: string }
  | { status: "not_found" };
```

"Complete" should generally require useful product identity + usable nutrition + useful ingredient information.

## Do not analyze yet

At this step, do not implement the AI.

Normalize Open Food Facts data into an intermediate object and show it in a debug/temporary UI or log sanitized fields during development.

## Error states

Handle:

- not found
- timeout
- non-200
- malformed JSON
- rate limiting
- product outside food scope
- incomplete data

User-facing not-found behavior:

> This barcode isn't in our food data yet. Scan the label instead.

## Verification

Test at least:

- [ ] known barcode returns product
- [ ] unknown barcode routes to label flow
- [ ] incomplete product routes to label flow
- [ ] duplicate scan makes one request
- [ ] timeout recovers
- [ ] OFF response does not leak raw errors to UI

## Gate

Step 4 passes when barcode lookup reliably chooses either "data ready" or "scan label."

**Do not start Step 5 until Step 4 passes.**

---

# Step 5 — Implement Label Photo Capture

## Goal

Allow analysis of products that are missing from the barcode database or whose data is incomplete.

## Capture flow

The user should be able to capture:

### Image 1
Ingredients / allergen panel

### Image 2
Nutrition facts panel

The second image is optional.

Provide instructions like:

- Fill the frame with the label.
- Keep text in focus.
- Avoid glare.
- Make sure calories and serving size are visible.
- Capture ingredients separately if needed.

## UX sequence

```text
scanner
→ tap Scan label
→ capture
→ preview
→ Retake / Use photo
→ ask if nutrition or ingredients need another photo
→ optional second capture
→ continue
```

Do not create a complex document-scanner editor in MVP.

## State

Temporary scan state may contain:

```ts
type ScanSession = {
  barcode?: string;
  offProduct?: NormalizedOffProduct;
  images: PreparedImageDraft[];
};
```

This state lives only for the active scan.

## Verification

- [ ] capture works on Android
- [ ] capture works on iOS device
- [ ] preview orientation is correct
- [ ] retake works
- [ ] one-photo flow works
- [ ] two-photo flow works
- [ ] cancel clears abandoned temporary state

## Gate

Step 5 passes when clear photos can be acquired reliably.

**Do not start Step 6 until Step 5 passes.**

---

# Step 6 — Implement Image Preparation

## Goal

Reduce upload cost/latency without making small label text unreadable.

## Use

`expo-image-manipulator`

## Preparation pipeline

For each selected photo:

1. inspect dimensions,
2. correct orientation if required,
3. resize only when larger than target,
4. compress as JPEG,
5. return a local prepared URI,
6. record width/height/size if available.

Suggested starting parameters:

- max long edge: ~1800 px
- quality: ~0.78
- JPEG

These are starting values, not sacred constants. Tune based on real label tests.

## Guardrails

- max 2 images
- reject unsupported MIME/type
- reject empty URI
- apply reasonable size limit
- do not convert tiny source images to even smaller images

## Privacy

Do not upload until the user confirms the captured photo.

Do not retain images after the scan is reset.

## Verification

For test photos:

- [ ] prepared image is materially smaller than original
- [ ] ingredients remain readable when zoomed
- [ ] nutrition values remain readable
- [ ] orientation remains correct
- [ ] two images stay within server request limits

## Gate

Step 6 passes when image payloads are optimized without harming OCR/vision quality.

**Do not start Step 7 until Step 6 passes.**

---

# Step 7 — Define Normalized Analysis Schema

## Goal

Create a single typed contract shared by server and result UI.

Do this before calling the AI.

## Files

```text
src/types/analysis.ts
src/lib/analysis/schema.ts
src/lib/analysis/normalize.ts
```

Use a runtime validator.

Acceptable choices:

- Zod
- another small JSON-schema-compatible validator

Prefer Zod if no conflicting reason exists.

## Required top-level areas

```text
schemaVersion
source
product
verdict
calories
nutrition
ingredients
allergens
labelSignals
positives
concerns
dataQuality
disclaimer
```

Follow the schema described in `AGENTS.md`.

## Key rules

- missing numeric data = `null`
- no silent string-to-number corruption
- preserve units
- distinguish per serving vs per 100g in the underlying normalized data
- declared allergens separate from traces
- `insufficient_data` must be valid
- verdict confidence required
- source required

## Create fixtures

Create fixture JSON/TS objects:

1. generally favorable food
2. high-sugar snack
3. incomplete label
4. allergen-containing product
5. two-photo product

Use these fixtures to keep UI independent of network.

## Verification

- [ ] valid fixture parses
- [ ] missing required keys fail
- [ ] invalid verdict fails
- [ ] number where string required fails
- [ ] unexpected AI payload can be rejected
- [ ] result screen uses normalized model only

## Gate

Step 7 passes when there is exactly one validated result contract.

**Do not start Step 8 until Step 7 passes.**

---

# Step 8 — Build Stateless Server Analysis Endpoint

## Goal

Create a secure server route without authentication or a database.

## Recommended route

Using Expo Router API Routes:

```text
src/app/api/analyze+api.ts
```

Configure server output for Expo Router as required by current Expo docs.

Use EAS Hosting or another supported provider.

## Environment

Server only:

```text
OPENROUTER_API_KEY=
OPENROUTER_ANALYSIS_MODEL=
```

Optional:

```text
OPENROUTER_SITE_URL=
OPENROUTER_APP_NAME=
ANALYSIS_MAX_IMAGES=2
ANALYSIS_TIMEOUT_MS=30000
```

Do not prefix secrets with `EXPO_PUBLIC_`.

Keep `https://openrouter.ai/api/v1` as a server-side constant. Do not accept an arbitrary gateway base URL from the mobile request.

## Request contract

Example conceptual request:

```ts
type AnalyzeRequest = {
  barcode?: string;
  openFoodFacts?: NormalizedOffProduct;
  images?: Array<{
    mimeType: "image/jpeg" | "image/png";
    base64: string;
  }>;
};
```

At least one useful source must be present.

For better transport efficiency, multipart uploads may be used instead of JSON base64 if implementation remains simple and supported.

## Validate before AI call

Reject:

- no data
- > 2 images
- oversized request
- unsupported image type
- malformed Open Food Facts object
- huge text fields

## Endpoint behavior

```text
validate request
→ normalize source data
→ invoke analysis service
→ runtime-validate model output
→ return normalized JSON
```

No persistence.

## Logging

Allowed:

- request ID
- elapsed time
- status
- source type
- image count
- sanitized error category

Do not log:

- image base64
- full label text
- API key
- full OpenRouter request payload
- full OpenRouter response in production

## Verification

Using curl/Postman/test client:

- [ ] missing request rejected with 400
- [ ] too many images rejected
- [ ] oversized request rejected
- [ ] no key returns controlled server failure
- [ ] route secret not present in client JS bundle
- [ ] route returns mock normalized analysis

Use a mock analysis service first.

## Gate

Step 8 passes when the mobile app can securely call a stateless mock analysis route.

**Do not start Step 9 until Step 8 passes.**

---

# Step 9 — Integrate OpenRouter Structured Label Analysis

## Goal

Replace mock analysis with real multimodal structured analysis.

## API

Send requests only from the stateless server route to OpenRouter:

```text
POST https://openrouter.ai/api/v1/chat/completions
Authorization: Bearer $OPENROUTER_API_KEY
```

Use built-in server-side `fetch` or the official OpenRouter SDK. Do not call an underlying model provider directly. Optional `HTTP-Referer` and `X-OpenRouter-Title` headers may be populated from server-only app metadata for OpenRouter attribution.

Send:

- sanitized Open Food Facts data as text/JSON when available
- one or two label images when available
- strict developer instructions
- strict output schema

## Model selection

Set through:

```text
OPENROUTER_ANALYSIS_MODEL
```

Choose a current cost-efficient OpenRouter model whose metadata confirms both image input and structured-output support. Model slugs are OpenRouter identifiers, such as `provider/model`; do not assume a specific provider in application code.

Do not couple application code to one forever-fixed model.

## Prompt structure

### Developer/system requirements

Require the model to:

- analyze packaged human food only,
- extract only visible/provided facts,
- prefer photographed label over database data,
- never invent missing values,
- distinguish per-serving and per-100g data,
- distinguish sodium and salt,
- distinguish declared allergens from traces,
- explain ingredients briefly,
- avoid fearmongering about additives,
- return a general non-medical verdict,
- return insufficient_data when evidence is weak,
- produce only the required structured output.

### User/source content

Provide:

- barcode if available
- normalized OFF product if available
- image(s)

## Structured output

Use strict JSON schema / structured output support.

For OpenRouter Chat Completions, send `response_format.type = "json_schema"` with `strict: true`. Set `provider.require_parameters = true` so OpenRouter only selects endpoints that support the requested parameters.

Do not ask the model for free-form markdown and then regex parse it.

## Post-processing

After the AI response:

1. parse structured data,
2. validate against local schema,
3. perform deterministic calculations if needed,
4. do not overwrite missing values with guesses,
5. attach standard disclaimer text.

## Deterministic calculations

Prefer code, not AI, for:

- kJ → kcal conversion
- serving conversions when exact serving size is known
- sodium ↔ salt conversion if intentionally shown
- formatting/rounding

## Retry policy

One controlled retry is allowed for:

- schema failure
- transient provider error

Do not infinite retry.

For unreadable images, ask the user to retake rather than repeatedly charging AI.

## Verification dataset

Run at least 10 known label examples.

Compare model output manually against visible labels:

- calories
- serving size
- sugar
- protein
- sodium/salt
- ingredients
- allergen statement

Track extraction errors.

## Gate

Step 9 passes only when the AI consistently returns validated, evidence-grounded results on the test set.

**Do not start Step 10 until Step 9 passes.**

---

# Step 10 — Connect Scan Pipeline End-to-End

## Goal

Make the real product flow function from camera to result.

## Final state machine

Implement explicit state rather than scattered booleans.

Suggested states:

```ts
type ScanFlowState =
  | "idle"
  | "scanning"
  | "barcode_lookup"
  | "needs_label"
  | "capturing_label"
  | "preparing_images"
  | "analyzing"
  | "result"
  | "error";
```

## Barcode complete path

```text
scan barcode
→ lookup OFF
→ complete
→ /api/analyze using OFF data
→ validate
→ result
```

## Barcode incomplete path

```text
scan barcode
→ lookup OFF
→ incomplete
→ capture label
→ prepare image
→ /api/analyze using OFF + image
→ validate
→ result
```

## Barcode not-found path

```text
scan barcode
→ not found
→ capture label
→ prepare
→ /api/analyze using barcode + image
→ result
```

## Direct label path

```text
tap Scan label
→ capture
→ prepare
→ /api/analyze using image
→ result
```

## Reset

"Scan another" must:

- clear barcode
- clear OFF product
- clear image URIs
- clear analysis
- clear error
- unlock barcode scanner
- return camera to scanning state

## Verification

Test every path without manually modifying state.

- [ ] complete barcode
- [ ] incomplete barcode
- [ ] unknown barcode
- [ ] direct label
- [ ] retake
- [ ] server error
- [ ] reset
- [ ] scan another different product

## Gate

Step 10 passes when the app behaves like one coherent product, not separate demos.

**Do not start Step 11 until Step 10 passes.**

---

# Step 11 — Build Production Result UI

## Goal

Turn normalized data into a clear consumer-facing explanation.

## Header

Show:

- product name
- brand if known
- source indicator only if useful
- verdict title
- verdict reason
- confidence if data is limited

## Calories card

Show:

- kcal per serving when known
- kcal per 100g/100ml when known
- serving size when known

Never display zero for missing.

## Nutrition

Prioritize:

- protein
- carbohydrates
- sugars
- fat
- saturated fat
- fiber
- sodium/salt

Do not overload the top card with every micronutrient.

## Positives and concerns

Use concise evidence-based bullets.

Examples:

**What looks good**
- 12 g protein per serving
- low sugar according to available data

**What to watch**
- high sodium
- high saturated fat

## Allergens

Create a visually distinct section.

Separate:

- Contains
- May contain / traces

Include a physical-label verification warning for severe allergies.

## Ingredients explained

Each row:

- ingredient name
- category badge if useful
- one-sentence explanation
- concern level only when evidence supports it

Avoid turning the ingredient list into a red/green morality list.

## Label signals

When available:

- Nutri-Score
- NOVA group
- nutrient-level signals
- additive identifiers

Explain briefly.

Do not show unfamiliar scores without context.

## Data quality

If confidence is medium/low, state why:

- nutrition panel partially cut off
- ingredients unclear
- database data missing
- serving size unavailable

## Disclaimer

Required:

> General food-label information only. This is not medical or dietary advice. Always check the physical package, especially for allergies or medical dietary restrictions.

Exact wording may be refined, but the meaning must remain.

## Verification

- [ ] missing field layouts remain clean
- [ ] long ingredients work
- [ ] low-confidence warning is visible
- [ ] allergens cannot be confused with traces
- [ ] verdict reason is visible
- [ ] app never shows "undefined", NaN, or empty unit strings

## Gate

Step 11 passes when a non-technical user can understand a product within seconds.

**Do not start Step 12 until Step 11 passes.**

---

# Step 12 — Reliability, Privacy, and Abuse Protection

## Goal

Make the MVP safe enough for public testing.

## Client reliability

- [ ] network timeout
- [ ] retry button
- [ ] offline detection/message
- [ ] camera permission recovery
- [ ] API error recovery
- [ ] prevent double submission
- [ ] disable analyze button while in flight
- [ ] abort request when appropriate

## Server validation

- [ ] content-type validation
- [ ] maximum image count
- [ ] maximum body size
- [ ] timeout
- [ ] schema validation
- [ ] controlled provider errors
- [ ] output-size control
- [ ] no stack traces to client

## Cost controls

Configure through OpenRouter and hosting dashboards where available:

- OpenRouter API-key spend limit
- OpenRouter usage/budget monitoring
- provider data-collection policy and, where compatible, Zero Data Retention routing
- rate limit
- hosting WAF/rate limit

An embedded "app secret" is not a security boundary.

Before high-scale public release, evaluate device/app attestation.

## Privacy

Confirm there is:

- no database
- no scan history
- no image persistence
- no unnecessary logs
- no microphone permission
- no contacts
- no location
- no tracking SDK

## About / privacy copy

State clearly:

- camera purpose
- images are used to analyze the current label
- no account
- no scan history
- Open Food Facts may provide product data
- AI service processes analysis requests
- app provides general information, not medical advice

Use exact production privacy claims only after verifying provider data handling and deployed logging behavior.

## Open Food Facts attribution

Add appropriate attribution/license notice based on current Open Food Facts reuse requirements.

## Verification

Perform a privacy-oriented code review:

- search repository for `OPENROUTER_API_KEY`
- search repository for direct model-provider URLs or keys
- search for `EXPO_PUBLIC`
- search for logging of base64
- inspect production request logs
- inspect app permissions
- inspect network calls

## Gate

Step 12 passes when obvious cost/security/privacy failures are closed.

**Do not start Step 13 until Step 12 passes.**

---

# Step 13 — Real-Label Test Matrix

## Goal

Evaluate the product on real packaging, not only developer fixtures.

## Minimum product categories

Test:

1. chips
2. biscuits/cookies
3. breakfast cereal
4. milk/dairy drink
5. juice
6. soft drink
7. instant noodles
8. protein bar
9. sauce/ketchup
10. frozen/ready meal
11. packaged bread
12. chocolate
13. zero-sugar beverage
14. product with allergen warning
15. imported product with dense label

## For each product record manually

Create a local development QA sheet or markdown fixture, not a user database.

Fields:

```text
product
barcode detected?
OFF found?
OFF complete?
label photos required?
calories correct?
serving correct?
protein correct?
sugar correct?
sodium/salt correct?
ingredients captured?
allergens captured?
verdict reasonable?
AI uncertainty handled?
total time acceptable?
issues
```

## Accuracy priority

Critical extraction fields:

1. allergen statement
2. calories
3. serving basis
4. sugar
5. sodium/salt
6. protein
7. ingredients

If critical facts are wrong, do not compensate with nicer UI.

Fix extraction/prompt/image flow first.

## Adversarial scans

Also test:

- glare
- curve on bottle
- tiny type
- partial crop
- dark package
- multilingual label
- nutrition table without clear kcal
- package with marketing claims near nutrition facts
- multiple serving columns

## Gate

Step 13 passes when the app is acceptably accurate on the agreed real-world test set and known weaknesses are documented.

**Do not start Step 14 until Step 13 passes.**

---

# Step 14 — Production Builds and Release Requirements

## Goal

Prepare Android and iOS production versions.

## Expo/EAS

Configure:

- eas.json
- development build
- preview build
- production build

Use real devices for final camera testing.

## Server deployment

Deploy API route/server.

Verify:

- production origin is correct
- HTTPS
- environment variables are server-side
- mobile production build reaches production server
- no development endpoint remains
- budget/rate limits are configured

## Android

Verify:

- package name
- camera permission
- privacy disclosure
- screenshots
- app icon
- adaptive icon
- feature graphic if needed
- data safety answers match actual behavior

## iOS

Verify:

- bundle identifier
- camera usage description
- privacy details
- screenshots
- app icon
- age rating/content answers
- physical-device camera behavior

## Store-description safety

Do not market as:

- diagnosis
- medical device
- allergy guarantee
- disease prevention
- guaranteed healthy/unhealthy detector

Prefer:

> Scan packaged-food labels to understand ingredients, calories, nutrition facts, and general nutrition considerations.

## Final production smoke test

On store-like production builds:

- [ ] fresh install
- [ ] first camera permission
- [ ] barcode scan
- [ ] direct label scan
- [ ] two-photo scan
- [ ] result
- [ ] scan another
- [ ] offline behavior
- [ ] API timeout behavior
- [ ] privacy/about screen
- [ ] no auth
- [ ] no database/history

## Gate

Step 14 passes when both platform builds and the production analysis endpoint work together reliably.

---

# Post-MVP Backlog — DO NOT IMPLEMENT DURING MVP

These are possible future enhancements, not current requirements.

- scan history stored locally
- favorites
- dietary preference toggles
- vegan/vegetarian filtering
- user allergy preference
- compare two products
- healthier alternative suggestions
- multilingual UI
- offline OCR
- on-device ML model
- continuous live-label recognition
- product image recognition
- shareable result card
- home-screen widget
- optional anonymous analytics
- premium plan
- shopping list

Do not start any backlog item until the owner explicitly expands scope.

---

# Implementation Notes

## Why Open Food Facts + direct label vision?

Open Food Facts makes common barcode scans faster and can provide:

- ingredients
- nutrition
- allergens
- Nutri-Score
- NOVA
- nutrient-level signals

But it is community data and not complete for every product.

Direct label image analysis is the fallback that makes the product useful for products absent from the database.

## Why not only OCR?

A separate on-device OCR dependency can reduce AI image cost, but it introduces additional native integration and OCR-normalization complexity.

For the MVP, sending one/two compressed label images through a secure server-side multimodal model is simpler and keeps the mobile codebase smaller.

If AI image cost becomes significant later, on-device OCR can be evaluated as an optimization without changing the normalized result schema.

## Why use OpenRouter only from the server?

Because client-side API keys can be extracted from mobile applications.

The stateless server route is mandatory for the paid OpenRouter secret. All model inference goes through the OpenRouter gateway; the client never calls OpenRouter or an underlying provider directly.

## Why no "Eat / Don't eat" binary?

A binary decision without knowing a user's allergies, medical conditions, goals, serving context, or total diet is misleading.

The product should give a strong but general assessment with evidence:

- Good general choice
- Okay in moderation
- Best limited
- Insufficient data

That still answers the user's practical question while staying trustworthy.

---

# Official References to Re-check During Implementation

Expo Camera  
https://docs.expo.dev/versions/latest/sdk/camera/

Expo API Routes  
https://docs.expo.dev/router/web/api-routes/

EAS Hosting  
https://docs.expo.dev/eas/hosting/introduction/

Open Food Facts API  
https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/

Open Food Facts barcode guide  
https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/tutorials/scanning-barcodes/

Open Food Facts v3 product endpoint  
https://openfoodfacts.github.io/documentation/docs/Product-Opener/v3/products/get-api-v3-product-code/

Open Food Facts product attributes  
https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/explain-product-attributes/

Open Food Facts licensing  
https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/tutorials/license-be-on-the-legal-side/

OpenRouter quickstart and authentication

https://openrouter.ai/docs/quickstart

OpenRouter image inputs

https://openrouter.ai/docs/guides/overview/multimodal/image-understanding

OpenRouter structured outputs

https://openrouter.ai/docs/guides/features/structured-outputs

OpenRouter provider routing

https://openrouter.ai/docs/guides/routing/provider-selection

OpenRouter data collection and provider logging

https://openrouter.ai/docs/guides/privacy/data-collection

https://openrouter.ai/docs/guides/privacy/provider-logging

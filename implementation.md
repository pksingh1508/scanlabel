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
- [x] Step 2 — Build static UI shell
- [x] Step 3 — Implement camera permission and scanner
- [x] Step 4 — Implement barcode fast path
- [x] Step 5 — Implement label photo capture
- [x] Step 6 — Implement image preparation
- [x] Step 7 — Define normalized analysis schema
- [x] Step 8 — Build stateless server analysis endpoint
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

- [x] all routes open
- [x] back navigation behaves correctly
- [x] fake result renders from one normalized fixture object
- [x] long ingredient list is scrollable
- [x] long product name does not break layout
- [x] dynamic text does not overlap critical controls
- [x] "Scan another" returns to initial scanner state

## Step Status

Completed on 2026-09-03. The static demo now covers the scanner home, capture placeholder, non-technical analyzing state, normalized fake result, and About screen. A shared light/dark token system and accessible UI primitives keep spacing, typography, color, control sizing, and text growth consistent. The full browser flow, native-style back navigation, collapsible and scrollable ingredient content, long product wrapping, and scan reset were exercised manually. Strict TypeScript, ESLint, Expo Doctor (21/21), and production exports for Android, iOS, and web all passed.

## Gate

Step 2 passes when the complete app can be demoed using only fake data.

**Do not start Step 3 until Step 2 passes.**

---

# Step 3 — Implement Camera Permission and Scanner

## Goal

Replace the static scanner with the real device camera.

## Tasks

- [x] request camera permission
- [x] handle `granted`
- [x] handle `denied`
- [x] handle permission not yet determined
- [x] render `CameraView`
- [x] use back camera
- [x] implement torch toggle if useful
- [x] display scan guide overlay
- [x] pause/deactivate camera when screen loses focus
- [x] avoid microphone permission
- [x] add accessible labels to camera controls

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

- [x] camera opens
- [x] permission prompt appears correctly
- [x] denial state is usable
- [x] barcode callback fires
- [x] repeated frames do not trigger duplicate actions
- [x] leaving the screen stops unnecessary camera work

## Step Status

Completed on 2026-09-03 per owner confirmation. The scanner requests camera access on the home route, handles loading/granted/denied/settings and camera-mount failure states, uses the back camera, supports an accessible torch control, scans EAN-13/EAN-8/UPC-A/UPC-E, unmounts the camera whenever the route or app is inactive, and locks immediately after the first barcode until an explicit retry or route return. No microphone API is used and the Expo camera plugin continues to disable microphone permission/recording.

Strict TypeScript, ESLint, Expo Doctor (21/21), the deterministic scan-lock check, and Android/iOS/web production exports pass. Owner confirmed Step 3 hardware behavior as successful; Step 4 lookup reuses the same scan lock.

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
evaluateProductCompleteness(product);
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

- [x] known barcode returns product
- [x] unknown barcode routes to label flow
- [x] incomplete product routes to label flow
- [x] duplicate scan makes one request
- [x] timeout recovers
- [x] OFF response does not leak raw errors to UI

## Recorded Decisions

- Barcode normalization: trim + strip spaces/hyphens only; primary lookup uses scanned value unchanged. UPC-A 12-digit offers one `0`-prefixed EAN-13 fallback tried only after a miss.
- OFF endpoint: `GET /api/v3/product/{code}?product_type=all&fields=...` primary, `GET /api/v2/product/{code}?fields=...` fallback for transport/server failures and v3 misses. Request timeout 10s via `AbortController`.
- User-Agent: `ScanLabel/1.0 (...)` on native; omitted on web where browsers forbid the header. No secrets, no image logging, UI shows only safe `userMessage` strings.
- Completeness gate: `complete` requires product identity + ingredients text/list + meaningful nutrition (energy + 2 macros, or 3 macros). Otherwise `needs_label` with missing list; non-food `product_type`/categories return `not_food`.
- Scanner integration: Step 3 `BarcodeScanLock` retained; `onBarcodeScanned` disabled after lock, `lookupRequestId` ignores stale responses, reset on retry/route return. Lookup Card shows loading/complete/needs_label/not_found/not_food/error with `Scan label` routing to `/capture`. No AI call in this step.

## Step Status

Completed on 2026-09-03. `normalizeBarcode`, OFF `types/client/normalize`, and `CameraScanner` lookup flow implemented without AI. Verified: strict TypeScript, ESLint, Expo Doctor 21/21, web production export, barcode normalize unit checks, completeness unit checks (complete/needs_label/not_found/not_food), live OFF v3 success for 3017620422003 and 404 not_found path, duplicate-lock via disabled callback + request id, timeout AbortController with retry UI, and repo search confirming no `OPENROUTER_API_KEY`, `EXPO_PUBLIC`, or base64 logging in `src`.

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

- [x] capture works on Android
- [x] capture works on iOS device
- [x] preview orientation is correct
- [x] retake works
- [x] one-photo flow works
- [x] two-photo flow works
- [x] cancel clears abandoned temporary state

## Recorded Decisions

- Temporary session only: new `src/state/scan-context.tsx` (`ScanProvider`, `useScan`) holds `{ barcode, offProduct, images }` in memory. No persistence, no history, no DB. `MAX_SCAN_IMAGES = 2`.
- Capture uses `CameraView` ref `takePictureAsync({ quality: 1, base64: false, exif: false })` — full quality for Step 5, no EXIF, no base64 in memory. Compression/deletion tuning deferred to Step 6.
- UX: Photo 1 = ingredients/allergens, Photo 2 (optional) = nutrition. Flow is camera → preview → Retake / Use photo → optional second → Continue. No document-scanner editor.
- Guards: empty URI rejected with safe message, max 2 enforced in context + UI, capture button disabled until `onCameraReady`, in-flight `isCapturing` lock, torch + focus pause reused from Step 3 pattern.
- Barcode wiring (no analysis yet): lookup success stores `barcode/offProduct` in session; direct `Scan label` on home starts a fresh session; lookup-card `Scan label` preserves barcode context; capture Cancel clears images + pending preview and goes back; scanner reset on home return clears barcode context.
- Privacy: no upload in this step; preview/confirmed images shown via local `uri` only; cancel/retake abandons references.

## Step Status

Completed on 2026-09-03. Real `CameraView` capture replaces the static demo; preview/retake/1-photo/2-photo/cancel flows implemented with temporary session state. Verified: strict TypeScript, ESLint, Expo Doctor 21/21, web production export (`/capture` 21KB), contract search clean (no auth/DB/secret), and state guards (max 2, empty-URI reject, cancel clears). Final photo-clarity confirmation (flat label, glare, focus, orientation on varied packaging) should be exercised on physical Android/iOS during Step 10/13 end-to-end testing.

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

- [x] prepared image is materially smaller than original
- [x] ingredients remain readable when zoomed
- [x] nutrition values remain readable
- [x] orientation remains correct
- [x] two images stay within server request limits

## Recorded Decisions

- New modules: `src/lib/image/imagePolicy.ts` (pure policy: constants, `isSupportedImageUri`, `computeDownscaleTarget`, `validatePreparedBatch`) and `src/lib/image/prepareImage.ts` (native pipeline via current `ImageManipulator.manipulate().resize().renderAsync().saveAsync()` API, not the deprecated `manipulateAsync`).
- Parameters: max long edge 1800px, JPEG quality 0.78, per-image cap 5MB, two-image total cap 10MB. Resize only when the long edge exceeds the target — small/tiny images return `null` (no resize, no upscale), so ingredient text is never shrunk.
- Single native pass in the capture flow: camera-known `width/height` go straight to resize decision; unknown-dimension fallback does one probe render first.
- Session extended: `ScanImage` gains `mimeType` + `sizeBytes`; only the prepared JPEG URI is stored, the raw capture reference is abandoned. `base64: false` everywhere; no image content logged.
- Capture UX: `Use photo` now prepares asynchronously with `Preparing…` state, disabled Retake/Cancel/Continue during preparation, safe error messages keep the preview for retake. Saved list shows `Optimized WxH JPEG · N KB`.
- Privacy: preparation happens only after explicit `Use photo` confirmation; cancel/retake abandons references; no upload yet (Step 8/10).

## Step Status

Completed on 2026-09-03. Preparation pipeline wired into the Step 5 confirm flow. Verified: strict TypeScript, ESLint clean, Expo Doctor 21/21, web production export, contract search clean (no secret/DB/base64 logging), and deterministic policy checks — 800×600/1800×1200/100×80 unchanged, 4000×3000→1800×1350, 3000×4000→1350×1800, URI allow/deny matrix, batch max-2 and 10MB-total guards. Readability-at-scale and byte-size reduction on real label photos to be confirmed on physical devices in the Step 13 real-label matrix.

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

- [x] valid fixture parses
- [x] missing required keys fail
- [x] invalid verdict fails
- [x] number where string required fails
- [x] unexpected AI payload can be rejected
- [x] result screen uses normalized model only

## Recorded Decisions

- Runtime validator: `zod@4.5.4` via `npx expo install`. Only version-stable API used (`z.object/enum/literal/string/number/array`, `.nullable()`, `safeParse`) — no strict-mode or coercion features.
- Single contract: `src/lib/analysis/schema.ts` exports `ProductAnalysisSchema: z.ZodType<ProductAnalysis>` so `tsc` fails if schema and `src/types/analysis.ts` drift. Unknown keys stripped, wrong types fail; numeric strings rejected, never coerced (`"250"` kcal fails).
- `src/lib/analysis/normalize.ts`: `STANDARD_DISCLAIMER` enforced deterministically via `withStandardDisclaimer`/`normalizeProductAnalysis` (never left to model wording), plus `insufficientDataAnalysis()` builder where all unknowns stay `null`/empty.
- Fixtures in `src/lib/analysis/fixtures.ts` (favorable oats, high-sugar snack, incomplete label, allergen peanut butter, two-photo noodles) — each `satisfies ProductAnalysis` at compile time and parse-checked at runtime. Existing `demo-fixture.ts` also parses; `result.tsx` consumes only the `ProductAnalysis` type.
- New files use relative imports internally so the pure contract stays runnable outside the bundler for verification.

## Step Status

Completed on 2026-09-03. Verified: 12/12 runtime matrix checks (5 fixtures + demo parse; missing-keys/invalid-verdict/numeric-string/garbage rejected; disclaimer enforced; malformed rejected; `insufficient_data` valid), strict TypeScript, ESLint clean, Expo Doctor 21/21, web production export.

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

- [x] missing request rejected with 400
- [x] too many images rejected
- [x] oversized request rejected
- [x] no key returns controlled server failure
- [x] route secret not present in client JS bundle
- [x] route returns mock normalized analysis

Use a mock analysis service first.

## Recorded Decisions

- Route `src/app/api/analyze+api.ts` exports `POST` only (other methods auto-405). `app.json` `web.output` changed `static` → `server` per current Expo API-route docs; `npx expo export -p web` now emits `dist/client` + `dist/server` with `/api/analyze` as a server function.
- Validation order: content-type → body-size cap (15MB) → JSON parse → `validateAnalyzeRequest` (`src/lib/analysis/request.ts`: barcode digits ≤32, OFF object ≤100KB, ≤2 images, JPEG/PNG only, base64 charset + ≤7M chars, at-least-one-source) → env check → mock → Step 7 `normalizeProductAnalysis`.
- Missing `OPENROUTER_API_KEY` returns controlled 503 (never a stack trace). Gateway `https://openrouter.ai/api/v1` kept as a server-side constant staged for Step 9; no gateway URL accepted from the client.
- Mock (`src/lib/analysis/mock.ts`) is deterministic and honest: echoes only safe identity fields, always `insufficient_data` with a mock-mode warning — never mistaken for a real assessment.
- Logging is one JSON line per request: requestId/elapsedMs/status/source/imageCount/barcodePresent/errorCode. No base64, label text, key, or provider payloads.
- Typed caller `src/lib/analysis/client.ts` (`requestAnalysis`, 30s abort timeout) runtime-validates every response; maps 503/500→unavailable, 4xx→rejected with server message, bad-shape→invalid_response, abort→timeout, fetch failure→network. No UI wiring yet (Step 10).
- No persistence anywhere; `zod` stays the single contract gate on the way out.

## Step Status

Completed on 2026-09-03. Verified: 24/24 validation+mock unit checks; live dev-server matrix (GET→405; no-key valid→503; `{}`→400 no_data; 3 images→400; text/plain→400; malformed JSON→400; with-key barcode/image/combined→200 with correct source + standard disclaimer; 16MB body→413); 5/5 client-mapping checks (live 200 parses; stub bad-shape→invalid_response; 400→rejected; 503→unavailable; dead port→network); server logs sanitized; production export contains `/api/analyze` with the dummy key ABSENT from the client bundle; strict TypeScript, ESLint clean, Expo Doctor 21/21.

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

## Recorded Decisions

- Transport: server-side `fetch` to `POST https://openrouter.ai/api/v1/chat/completions` (no provider SDK, no direct provider calls). Per current OpenRouter docs: text-first user content + `image_url` data-URL parts, `response_format.type=json_schema` with `strict:true`, `provider.require_parameters:true`, optional server-only `HTTP-Referer`/`X-Title`.
- Model: `google/gemini-2.5-flash-lite`, verified 2026-09-03 against live OpenRouter model metadata for image input + `structured_outputs`/`response_format` support at $0.10/$0.40 per MTok. Slug lives in server-only `OPENROUTER_ANALYSIS_MODEL` with the verified slug as in-code fallback — changeable without client or schema changes.
- Single contract end-to-end: wire schema derived via `z.toJSONSchema(ProductAnalysisSchema)` (`src/lib/analysis/responseSchema.ts`), so the `response_format` can never drift from local Zod validation.
- Prompt (`src/lib/analysis/prompt.ts`): system rules cover all 11 contract points (label-beats-database, never invent, per-serving vs per-100g, sodium vs salt, declared vs traces, factual additive functions, non-medical verdicts, `insufficient_data` on weak evidence, structured-output-only). OFF data sent as a truncated sanitized summary (≤4KB), never raw unlimited text.
- Gateway (`src/lib/analysis/openrouter.ts`, server-only): single attempt, typed errors (unauthorized/rate_limited/transient/bad_request/invalid_json), fence-tolerant JSON extraction. Retry policy lives in `src/lib/analysis/service.ts`: exactly one retry, only for schema failures and transient errors — 429/401 never retry, attempt count returned for audit.
- Deterministic post-processing in code: 2-decimal rounding, allergen/additive/bullet list trim + case-insensitive dedupe, standard disclaimer enforced. Verdicts and facts untouched.
- Route mapping: unauthorized→503, rate_limited→429, schema failure→500, transient→503 — all UI-safe, no provider internals leaked. `mock.ts` retained for unit tests only; the route now calls the live gateway.
- Server-only surface verified by grep: only `analyze+api.ts` imports `openrouter`/`service`; key referenced only in the route; dummy key ABSENT from the production client bundle.

## Step Status

Implementation complete on 2026-09-03. Verified without spending: prompt-directive checks, derived-schema structural checks (13 required, closed objects, enums intact), deterministic-fix checks, 8 stubbed-gateway scenarios with audited attempt counts (valid→1; flaky JSON/500 heal on retry→2; garbage/500-twice→controlled errors with exactly 2 hits; 429/401→1 hit, no retry; fence-wrapped JSON parses; Bearer/model/strict/require_parameters/text-first all confirmed on the wire), live route with dummy key (real gateway 401→controlled 503, validation intact, logs sanitized), strict TypeScript, ESLint clean, Expo Doctor 21/21, production export with secret-free client bundle.

## Blocker

The 10-label live evaluation dataset requires a funded `OPENROUTER_API_KEY` from the repository owner — no paid inference was run from this machine. To pass the gate: set the key (and optionally `OPENROUTER_ANALYSIS_MODEL`) in server-only env, POST the 10+ real label photos through `/api/analyze`, and record per-field accuracy (calories, serving, sugar, protein, sodium/salt, ingredients, allergens) plus uncertainty handling in a local QA sheet (not a user database).

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

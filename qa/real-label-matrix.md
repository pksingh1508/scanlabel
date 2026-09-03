# Real-Label Test Matrix (Step 13)

Local development QA sheet. Not a user database — no scan history is stored
in the app. Keep label photos out of git; delete them after each session.

## How to run

1. On a physical Android + iOS device, with a funded `OPENROUTER_API_KEY` in
   server-only env, scan each product below end-to-end (no manual state edits).
2. Verify every extracted fact against the physical package, not against
   Open Food Facts (community data may be old or wrong).
3. Fill one row per product. Mark `?` anything you could not check.
4. Adversarial scans go in the second table.
5. Accuracy priority: allergen statement, calories, serving basis, sugar,
   sodium/salt, protein, ingredients. If critical facts are wrong, fix
   extraction/prompt/image flow first — never compensate with nicer UI.

## OFF readiness pre-check (2026-09-03, automated, no device)

Method: live Open Food Facts v3 lookup per category, run through the app's
own `normalizeOffProduct` + `evaluateProductCompleteness` (Step 4 gate).
Result: **14/15 complete, 1 needs_label** (instant noodles: no ingredients in
OFF → must take the label-photo path). No crashes, no `not_food`
misclassifications. Note: OFF search throttled us (HTTP 503) — query politely
with delays and an identifying User-Agent.

| # | Product (matrix category) | Sample barcode | OFF found? | OFF complete? | Expected path |
|---|---|---|---|---|---|
| 1 | Chips — AUTHENTIQUE | 7300400481595 | yes | complete | barcode → analyze |
| 2 | Biscuits — Prince | 7622210449283 | yes | complete | barcode → analyze |
| 3 | Breakfast cereal — Cruesli mélange de noix | 3168930010265 | yes | complete | barcode → analyze |
| 4 | Milk — Lait de la ferme Jaouda | 6111266962187 | yes | complete | barcode → analyze |
| 5 | Juice — Press Up orange Jaouda | 6111266962910 | yes | complete | barcode → analyze |
| 6 | Soft drink — Coca-Cola Original | 5449000054227 | yes | complete | barcode → analyze |
| 7 | Instant noodles — Nouilles Bœuf | 5285000396437 | yes | **needs_label (no ingredients)** | barcode → label photo |
| 8 | Protein bar — Cocoa Hazelnut | 5060088700112 | yes | complete | barcode → analyze |
| 9 | Sauce — Ketchup Star | 6111184004730 | yes | complete | barcode → analyze |
| 10 | Frozen meal — Gambas/tagliatelles | 3166352967211 | yes | complete | barcode → analyze |
| 11 | Bread — Pain de mie bio | 3760049790214 | yes | complete | barcode → analyze |
| 12 | Chocolate — Lindt 90% | 3046920029759 | yes | complete | barcode → analyze |
| 13 | Zero-sugar — Coke Zero | 5449000214799 | yes | complete | barcode → analyze |
| 14 | Allergen warning — Peanut butter | 3760020507350 | yes | complete | barcode → analyze |
| 15 | Dense import label — Hot & Sour noodles | 9300681018181 | yes | complete | barcode → analyze |

## Device matrix (fill on hardware)

| # | Barcode detected? | OFF found? | OFF complete? | Label photos required? | Calories correct? | Serving correct? | Protein correct? | Sugar correct? | Sodium/salt correct? | Ingredients captured? | Allergens captured? | Verdict reasonable? | AI uncertainty handled? | Time acceptable? | Issues |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | | | | | | | | |
| 2 | | | | | | | | | | | | | | | |
| 3 | | | | | | | | | | | | | | | |
| 4 | | | | | | | | | | | | | | | |
| 5 | | | | | | | | | | | | | | | |
| 6 | | | | | | | | | | | | | | | |
| 7 | | | | | | | | | | | | | | | |
| 8 | | | | | | | | | | | | | | | |
| 9 | | | | | | | | | | | | | | | |
| 10 | | | | | | | | | | | | | | | |
| 11 | | | | | | | | | | | | | | | |
| 12 | | | | | | | | | | | | | | | |
| 13 | | | | | | | | | | | | | | | |
| 14 | | | | | | | | | | | | | | | |
| 15 | | | | | | | | | | | | | | | |

## Adversarial scans (fill on hardware)

Expected behavior for all rows: readable → validated result; unreadable →
`insufficient_data` + retake prompt (never invented facts).

| Condition | Product used | Result (pass/retake-loop/invented?) | Notes |
|---|---|---|---|
| Glare | | | |
| Curve on bottle | | | |
| Tiny type | | | |
| Partial crop | | | |
| Dark package | | | |
| Multilingual label | | | |
| Nutrition table without clear kcal | | | |
| Marketing claims near nutrition facts | | | |
| Multiple serving columns | | | |

## Known weaknesses

- (Fill as found. Example shape: "product X: sodium read per 100 g as per-serving — serving-basis bug?")

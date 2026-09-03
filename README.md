# ScanLabel

A privacy-minimal Expo app for scanning packaged-food labels and explaining their nutrition, ingredients, allergens, and general food-choice signals.

## Local Development

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start Expo:

   ```bash
   pnpm start
   ```

3. Open the app on Android or iOS using the Expo terminal controls, or run:

   ```bash
   pnpm android
   pnpm ios
   ```

## Checks

```bash
pnpm lint
pnpm typecheck
npx expo-doctor
```

See [AGENTS.md](./AGENTS.md) for the product contract and [implementation.md](./implementation.md) for the required sequential build plan.

Local `.env` files are ignored. Copy `.env.example` only when a later server-analysis step requires it, and never expose `OPENROUTER_API_KEY` through an `EXPO_PUBLIC_*` variable.

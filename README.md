# WTM — What’s the Move?

WTM learns what you actually enjoy doing. Log a Move, rank it against similar experiences, watch your Tasteprint take shape, and find the overlap with your crew.

## Run it

```bash
npm install
npm run web       # browser preview
npm start         # Expo development server for iOS / Android
```

The app is designed for Expo SDK 57 and TypeScript. The included demo data is local and works offline. The first screen offers “Continue as Shawn” for the fast demo path.

## The demo loop

Open Home → Log → choose Pickup basketball → pick ARC and your people → Log Move → Rank it. The binary comparison flow inserts the Move into the Active ranking and recalculates the Tasteprint. From Crews, open The Boys → Find our next move → choose Tonight, medium energy, and `$`. The local response preview demonstrates the proposal and plan confirmation without sending messages.

## Project shape

- `src/app` contains Expo Router routes.
- `src/components` contains the shared design system and organic Tasteprint visualization.
- `src/data`, `src/repositories`, `src/services`, and `src/stores` keep the UI behind deterministic local data and domain interfaces.
- `src/features/log` and `src/features/onboarding` contain the core loop; `src/features/social` contains crews, recommendations, profiles, taste, lists, proposals, settings, and notifications.
- `supabase/schema.sql` is a future backend schema with UUIDs, indexes, foreign keys, and row-level security scaffolding.

## Environment and reset

Copy `.env.example` if you want to document a local environment. Supabase keys are intentionally optional; the shipped app uses local repositories when they are absent. Use Settings → Developer → Reset demo to restore the seeded state, or Replay onboarding to run the first-use flow again.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run export:web
```


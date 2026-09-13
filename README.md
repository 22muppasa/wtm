# WTM — What’s the Move?

WTM learns what you actually enjoy doing. Snap a Move, rate the memory, watch your Tasteprint take shape, and find the overlap with your people. Public Moves become a visual profile of your niche interests, while travel mode carries the same taste into a new city.

## Run it

```bash
npm install
npm run web       # browser preview
npm start         # Expo development server for iOS / Android
```

The app is designed for Expo SDK 57 and TypeScript. The included demo data is local and works offline. The onboarding screen offers “Preview Shawn’s WTM” for the fast demo path.

## The demo loop

Open Home → Snap to capture a photo with the rear camera → finish the Move details. The captured memory joins the Home photo queue, where six quick ratings teach WTM your taste before you tag friends and decide whether it belongs on your public profile.

Use the Home location chip to switch into travel mode and get the same taste-matched discovery sections for a new city. From Crews, open The Boys → Find our next move to turn shared taste into a Partiful-style plan. Profiles include followers, a public visual Move grid, and past ratings.

## Project shape

- `src/app` contains Expo Router routes.
- `src/components` contains the shared design system and organic Tasteprint visualization.
- `src/data`, `src/repositories`, `src/services`, and `src/stores` keep the UI behind deterministic local data and domain interfaces.
- `src/features/log` and `src/features/onboarding` contain the capture, rating, and first-use loops; `src/features/social` contains crews, recommendations, profiles, taste, lists, proposals, settings, and notifications.
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

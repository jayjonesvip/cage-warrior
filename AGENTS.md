# AGENTS.md

## Project overview

This repository contains Cage Grind, a mobile-first browser game built with plain HTML, CSS, and JavaScript. There is no build step or app server required for local development; the game is served by opening `index.html` in a modern browser.

## Key files

- `index.html` — app shell and page metadata
- `styles.css` — layout, responsive styling, and game presentation
- `strings.js` — content strings and copy pools
- `game-logic.js` — testable state logic and progression rules
- `game.js` — browser-side interactions and UI wiring
- `analytics.js` — non-fatal analytics tracking wrapper
- `cage-social.js` — shared social feed integration
- `supabase-client.js` — authenticated Supabase client wrapper
- `tests/*.test.js` — project validation tests
- `assets/` — branded PNG assets and icons

## Working rules

- Keep the project as a static front-end. Do not introduce a build pipeline unless explicitly required.
- Preserve cache-busting version conventions using `app-version.json` and asset URLs ending in `?v=...`.
- Prefer small, targeted changes to the logic and UI. The game uses deterministic state and many tests validate the rules.
- Respect the existing naming conventions and existing save-state migration logic when touching progression or persistence.
- If changing assets or HTML metadata, also check the related tests and manifest configuration.

## Validation

Run the project test suite with:

```bash
npm test
```

This repo uses Node's built-in test runner for validation. Keep changes compatible with the current tests before finishing work.

## Repository context

- Game behavior is intentionally described in `README.md` and enforced by tests.
- Core progression logic is centralized in `game-logic.js` rather than scattered across UI code.
- Social and Supabase features are isolated behind the public client wrappers and should remain non-fatal when network issues occur.

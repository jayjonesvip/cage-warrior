# Copilot instructions

This repo is a static browser game called Cage Grind.

## Project notes

- Keep it as a plain HTML/CSS/JS app with no build step unless required.
- Entry points: `index.html`, `styles.css`, `strings.js`, `game-logic.js`, `game.js`.
- Validate with `npm test` after changes.
- Preserve existing save migration and state-logic invariants.
- Respect asset manifest and cache-busting patterns from `app-version.json`.
- Prefer minimal, test-safe edits over broad refactors.

## Typical workflow

1. Read the relevant logic and any related test before changing behavior.
2. Make the smallest fix that matches the intended game rule.
3. Run `npm test` and confirm the targeted behavior still passes.

## Important constraints

- Do not add framework dependencies or a bundler by default.
- Do not break local-save compatibility or public-facing metadata.
- Do not remove or rename game assets without updating manifest and tests.

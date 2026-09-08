# CSS component conventions

Keep the existing stylesheet order: `styles.css`, `shared.css`, `landing.css`, then `github-steel.css`.

- `styles.css` owns game component layout, responsive behavior, and fallback tokens.
- `shared.css` contains components shared with the public landing page.
- `github-steel.css` owns the active theme and shared action presentation.
- `landing.css` owns the public landing layout.

## Actions

Extend the existing shared action selector group in `github-steel.css` when adding a standard action. It owns size, padding, radius, focus, hover, active, and disabled behavior. Standard actions are at least 44px tall with an 8px radius. The existing compact Feed variant remains 32px; modal labels use 13px.

Use `.modal-run` for primary actions, `.modal-cancel` for secondary actions, and `.retire-confirm` for destructive confirmations. `.level-up-continue` uses the same shared action presentation. Use the primary, secondary, and danger tokens for materials. Keep `.modal-actions.single-action` as the sole one-column modal footer rule.

The reward claim button is an intentional large green variant (48px tall, 12px radius, 16px label). Its base appearance has one rule; hover and disabled states are separate. Disabled must override the green reward treatment.

## Dialogs and colors

Fighter bio, loadout, and app-update dialogs share the `.gig-modal:is(...)` surface rule. Standard dialogs consume `--dialog-border` and `--dialog-surface`. Fighter bios override these tokens for fighter accents. CEO, reporter, sponsor, and celebration treatments remain explicit variants.

Use `--attribute-power`, `--attribute-speed`, `--attribute-chin`, and `--attribute-cardio` for attribute colors. Use `--status-positive`, `--status-negative`, and `--status-neutral` for rank movement. Keep those meanings separate even where their current color values coincide.

## Scope of this consolidation

The promo poster, winner stage, fight skins, sponsor art, reward composition, and large rank number retain their existing layouts. The broad four-size typography system remains in place; replacing it is a separate migration, not another override to append.

For future changes, edit the owning component rule instead of appending a duplicate selector. Check enabled, disabled, focus, and narrow-screen behavior against the full stylesheet cascade.

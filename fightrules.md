# Cage Grind Fight Rules

The live numeric configuration is stored in `fight-rules.json`. Property names are descriptive so the file can be reviewed or edited without tracing the full browser UI.

## Booking a fight

- A fighter needs more than 0 Energy.
- A fight spends up to 25 Energy; if less than 25 remains, it spends the available amount.
- Medical clearance requires at least 20 Health.
- The daily fight limit is 10 and resets at local midnight.

## Fight plans

Before the walkout, the player chooses slow or fast pace, conservative or aggressive offense, and whether to stick to style or adapt. The plan is evaluated against both fighters' attributes and archetypes. Focus affects how reliably the fighter executes adaptation.

## Persistent damage and passive recovery

Opponent offense can remove persistent Health during a live fight. Energy and Health then recover automatically from saved timestamps:

- Energy: +1 every 5 seconds
- Health: +1 every 60 seconds
- Offline recovery: capped at 8 hours

Selected equipped Fight Gear may reduce the Energy interval to 4 seconds. Only the strongest equipped recovery perk applies.

## Fight rewards

A legitimate win grants permanent Attribute Points based on opponent level, fight XP, Followers, an Aura change, eligible Victory Pack progress, and rivalry or championship progress when applicable. Aura starts at 0, ranges from 0–100, and increases follower momentum without changing combat odds.

Accepted Feed callouts use a fixed Aura stake: a win grants +5 Aura at any opponent level and a loss or forfeit costs 10 Aura. These callout wins do not trigger lower-level follower backlash, though ordinary XP and Attribute Point rules still apply.

An ordinary lower-level win costs `ceil((fighter level × opponent level) × 0.25)` Aura in addition to the existing five-percent follower backlash. The matchup preview calculates and discloses this Aura consequence before the fight.

An ordinary higher-level win earns `ceil((fighter level × opponent level) × 0.25)` Aura. A same-level ratings upset retains the fixed +5 Aura reward. Title bouts and accepted callouts use their fixed rewards instead of stacking the scaled amount.

Losses and forfeitures do not grant Attribute Points. A forfeit grants no XP or Victory Pack progress.

## Repeat XP

- Lower-level opponent: 0 XP
- First same-level win that day: full XP
- First same-day runback after that win: 50% XP
- Later same-day fights against that opponent: 0 XP

## Victory Packs

Wins against the player's level or higher can advance the four-step Victory Pack meter. A first career win guarantees a pack. Drops always select an undiscovered, level-eligible collectible, and rarity selection remains deterministic so reloading cannot reroll a saved outcome.

## Championships

Championship challenges and defenses are resolved by the shared server-authoritative flow. The active world champion leads the rankings. When a champion retires, the highest-ranked eligible active fighter inherits the title.

# Cage Grind Fight Rules

The live numeric configuration is stored in `fight-rules.json`. Property names are descriptive so the file can be reviewed or edited without tracing the full browser UI.

## Booking a fight

- A fighter needs more than 0 Energy.
- A fight spends up to 25 Energy; if less than 25 remains, it spends the available amount.
- Medical clearance requires at least 20 Health.
- Entering below full Health can cause one fight injury after confirmed opponent damage.
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

A legitimate win grants one permanent Attribute Point, fight XP, Followers, a Hype change, eligible Victory Pack progress, and rivalry or championship progress when applicable.

Losses and forfeitures do not grant Attribute Points. A forfeit grants no XP or Victory Pack progress.

## Repeat XP

- Lower-level opponent: 0 XP
- First same-level win that day: full XP
- First same-day runback after that win: 50% XP
- Later same-day fights against that opponent: 0 XP

## Victory Packs

Wins against the player's level or higher can advance the four-step Victory Pack meter. A first career win guarantees a pack. Duplicate handling and rarity selection remain deterministic so reloading cannot reroll a saved outcome.

## Championships

Championship challenges and defenses are resolved by the shared server-authoritative flow. The active world champion leads the rankings. When a champion retires, the highest-ranked eligible active fighter inherits the title.

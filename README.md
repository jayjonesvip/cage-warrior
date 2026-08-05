# Cage Warrior

A mobile-first, single-player fight-career game. Open `index.html` directly in
a modern browser; no build step or server is required.

## Current release

Release 1 introduced tactical round choices, faster fight controls, daily
contracts, win streaks, upset bonuses, offline recovery, and interrupted-fight
refunds.

Release 2 adds:

- A persistent, locally generated league
- Current-level fights and past-level rematches
- Opponent tendencies, scouting, rivalries, retirement, and replacements
- Meaningful favorable and risky tactical matchups
- Permanent fighter identities and belt milestones
- Four-slot fight-gear loadouts with item rarity
- A deterministic, one-attempt daily challenge for each player level
- Last-known-good save recovery and automatic migration of existing saves

Progress is stored in the browser with `localStorage`. Existing fighter,
rivalry, retirement, loadout, milestone, and daily-challenge progress migrates
automatically. The highest authored championship is the World Title at level
15, while generated progression can continue beyond level 15.

## Development

Run the repository checks with:

```sh
npm test
```

The game remains self-contained in `index.html`. PNG files under `assets/` are
source copies of the visual artwork.

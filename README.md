# Cage Grind

Cage Grind is a mobile-first MMA career game built with static HTML, CSS, and vanilla JavaScript. Open `index.html` in a modern browser; there is no build step or application server.

## Core loop

The career is intentionally centered on one repeatable loop:

1. Choose an opponent and fight.
2. Win to earn permanent Attribute Points: zero below your level, one at your level, and two above it.
3. Assign points to Power, Speed, Chin, or Cardio—or save them.
4. Energy and Health recover automatically.
5. Fight again, build a following, attract sponsors, collect gear, and climb toward the championship.

Training, sparring, manual resting, recovery-room treatments, side jobs, gambling, and the money economy are not part of the current game.

## Navigation

The simplified four-item navigation is Home, Fight, Gear, and Feed. The four primary pages are:

- **Home** — identity, record, world rank, sponsor progress, available Attribute Points, Daily Drop, and career guide.
- **Fight** — a world-ranked fighter ladder with exact win rewards, rematches, and championship activity.
- **Gear** — Victory Packs, collectibles, and the equipped Fight Gear loadout.
- **Feed** — CageReporter coverage, mentions, rivals, sponsors, and player interactions.

The compact Energy, Health, Power, Speed, Chin, and Cardio dashboard remains sticky while the larger identity row scrolls away.

## Fighter creation and progression

A new career permanently locks the fighter avatar, twenty-point starting attribute allocation, archetype, hometown, and unique Cage Feed handle.

Level and XP still come from fights. Attributes always display as whole numbers.

Every legitimate victory awards exactly `+1 ATTRIBUTE POINT`. Losses and forfeitures never award one. Unspent points are persisted immediately and can be assigned from the victory result or Home. Assignment is permanent, saved immediately, and guarded against repeated clicks.

The first post-fight result includes a compact guide explaining Attribute Points, passive recovery, and how to take the next fight. It is permanently hidden after that first result is closed; established careers do not see it.

## Passive recovery

Recovery is timestamp-based, so it continues accurately after reloads, device sleep, or time in the background.

### Energy

- Maximum: 100
- Base recovery: `+1 Energy` every 5 seconds
- Offline recovery cap: 8 hours
- HUD status: `CHARGING · FULL IN MM:SS`
- A cyan `+1` pop appears when displayed Energy increases.
- If multiple points accumulate while backgrounded, the HUD reports the total once.

The four-cell battery remains a visual aid, but Energy is continuous from 0–100 and is never rounded to 25-point segments.

Selected equipped Fight Gear can improve the Energy tick from 5 seconds to 4 seconds. Only the best equipped recovery perk applies, and the interval never drops below 4 seconds.

### Health

- Recovers `+1 Health` every 60 seconds
- Never exceeds maximum Health
- HUD status: `RECOVERING · FULL IN HH:MM:SS`
- Uses the same timestamp and offline-cap safeguards as Energy

Fight damage, minimum medical clearance, and fighting-hurt injury risk remain active.

## Fight rewards

Fight results focus on career progress instead of currency:

- One Attribute Point for a victory
- XP
- Followers
- Hype changes
- Victory Pack progress or a gear reveal
- Rivalry and championship outcomes

Same-day opponent XP rules remain: full XP for the first same-level win, half XP for one runback, then zero XP. Lower-level opponents award no XP.

## Gear and Victory Packs

Eligible wins against opponents at the fighter's level or higher advance the four-step Victory Pack meter. Upsets, rivalries, and finishes can accelerate progress. A first career win guarantees a Victory Pack.

Collectibles are permanent. Fight Gear can be equipped for combat attributes and, on selected items, faster Energy charging. Duplicate quantities are recorded but perks do not stack by quantity.

The Daily Drop grants a guaranteed collectible. It does not grant currency or manually refill resources.

## Follower-based sponsors

Sponsors are a sequential status track. Reaching the next follower milestone automatically advances the fighter, records the previous sponsor in career history, and shows a sponsor announcement. Sponsorships do not expire and do not pay bonuses.

| Order | Sponsor | Followers required |
|---:|---|---:|
| 1 | Bob's Auto Shop | 0 |
| 2 | Gary's Bar & Grill | 500 |
| 3 | Surge Core | 2,500 |
| 4 | Ironhide Athletics | 10,000 |
| 5 | Apex Wireless | 30,000 |
| 6 | Northline Auto | 80,000 |
| 7 | Titan Global | 200,000 |

The current sponsor is shown on the fighter profile with progress toward the next milestone. Titan Global displays `TOP-TIER SPONSOR`.

Existing careers are never moved backward during sponsor migration: their follower-qualified sponsor and furthest recorded sponsor are both considered.

## Sharing wins

Victories include a **Share Win** action. Share text uses the actual opponent, finish, round, updated record, win streak, championship result, and `https://cagegrind.com` when available.

The game uses the Web Share API where supported, then falls back to the Clipboard API. If both are unavailable, it opens a selectable text field. Sharing is non-fatal and never interferes with saving or claiming the fight result.

## Championships, rankings, and real fighters

The shared Supabase-backed championship remains server-authoritative and non-fatal when offline. The Fight page uses the same ranking order as the Home rankings modal: the active champion is first, followed by fighters ordered by level and win percentage. Each full-width row shows rank, portrait, name, record, level, win percentage, exact win XP, and the Attribute Points available for that matchup. Tap any available row to open the existing Tale of the Tape.

Two generated on-level Cage Circuit fighters always appear above the real rankings. They are clearly labeled unranked with rank `N/A`, provide reliable full-XP progression matchups, and never count as championship defenses. Ranked opponents below the player's level correctly award `0 XP`; the ladder labels those rows `LOWER LEVEL`, and it labels opponents whose same-day XP has already been exhausted as `XP USED TODAY`.

Ranked opponents are not level-locked. Wins below the player's level award zero XP and zero Attribute Points, on-level wins award one Attribute Point, and wins above the player's level award two. Existing same-day XP reduction rules still apply and the displayed preview reflects them.

The champion appears at rank number one and every fighter gets one title attempt per local day. A reigning champion sees the same ladder and may select any proven ranked fighter for a title defense; the selected title row locks after that daily attempt.

On-level opponent attributes follow the expected one-Attribute-Point-per-win career curve. Generated and ranked matchup ratings grow steadily through the early levels, then compound only slightly from Level 7 onward. Existing generated opponents are recalculated when a career loads so older saves do not retain the retired Training-era difficulty curve.

Retiring as champion passes the belt to the highest-ranked eligible active fighter through the existing database flow.

## Save migration

Current saves use state version 25. Migration preserves identity, avatar, hometown, archetype, level, XP, record, attributes, followers, Hype, gear, equipped gear, opponents, rivalry, championship, and Feed history.

Migration adds zero unspent Attribute Points to existing careers, adds passive-recovery timestamps, assigns the appropriate follower-based sponsor without moving backward, removes obsolete economy/activity fields, and clears interrupted legacy activities. A valid career is not reset merely because old fields are present.

## Editable fight rules

`fight-rules.json` contains descriptive, validated fight and resource constants. `js/fight-rules.js` validates the file and falls back safely when a value is missing or unsafe. `js/game-logic.js` contains deterministic progression and migration helpers used by the browser and tests.

## Project structure

- `index.html` — application shell, screens, and dialogs
- `css/styles.css` — primary responsive game presentation
- `css/github-steel.css` — clean steel-blue theme refinements
- `js/definitions.js` — fighters, gear, sponsors, and other data catalogs
- `js/game-logic.js` — deterministic state, recovery, progression, and fight rules
- `js/game.js` — browser interaction and rendering
- `js/cage-social.js` — shared Feed and championship integration
- `js/analytics.js` — non-fatal analytics wrapper
- `tests/*.test.js` — Node built-in test-runner validation

## Development and validation

Run the complete test suite:

```bash
npm test
```

When changing cached files, update `app-version.json`, package metadata, the service-worker cache version, and `?v=` asset query strings together.

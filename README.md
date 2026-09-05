# Cage Grind

Cage Grind is a mobile-first MMA career game built with static HTML, CSS, and vanilla JavaScript. Open `index.html` in a modern browser; there is no build step or application server.

## Core loop

The career is intentionally centered on one repeatable loop:

1. Choose an opponent and fight.
2. Win to earn permanent Attribute Points: zero below your level, one at your level, and two above it.
3. Assign points to Power, Speed, Chin, or Cardio—or save them.
4. Energy and Health recover automatically.
5. Fight again, build a following, attract sponsors, collect gear, and climb toward the championship.

Traditional training, manual resting, recovery-room treatments, side jobs, gambling, and the money economy are not part of the current game. Open Gym sparring is a reward-free scouting tool and does not alter career resources or results.

## Navigation

The five-item navigation is Home, Fight, Gym, Gear, and Feed. The five primary pages are:

- **Home** — the fighter profile and portrait first, followed by identity, record, world rank, XP progress, Victory Pack progress, sponsor progress, and the rotating career ticker.
- **Fight** — available Attribute Points, a world-ranked fighter ladder with exact win rewards, rematches, and championship activity.
- **Gym** — a one-round scout spar against a same-level, next-level, or champion-caliber test. The player sets Pace, Offense, and Tactics, then receives a persistent grade with attribute and plan advice. Reigning champions instead choose between a same-level test and the top contender. Sessions cost nothing and never affect official career state.
- **Gear** — Daily and installation Drops, Victory Packs, and collectible cards that equip Fight Gear or career perks directly.
- **Feed** — follower/following totals, CageReporter coverage, mentions, rivals, sponsors, and player interactions. Following includes known social accounts and ranked fighters.

The compact Energy, Health, Power, Speed, Chin, and Cardio dashboard remains sticky while the larger identity row scrolls away.

## Fighter creation and progression

Eligible victories can earn gold personal-best stamps for fastest finish, biggest upset, and a new best streak. Finish and upset records start with results observed after this update; existing best streaks are preserved. Lower-level wins and forfeits cannot earn stamps. Open Gym recognizes improved grades on comparable tests and calls out a changed plan choice. Sponsors have five brand-specific reactions each, rotating in the player's saved local Cage Feed after notable finishes, upsets, or five-win streak milestones, at most once per sponsor per local day and at least three fights apart. These reactions do not publish to the global feed.

A new career permanently locks the fighter avatar, twenty-point starting attribute allocation, archetype, hometown, and unique Cage Feed handle.

Level and XP still come from fights. The balanced XP curve keeps Levels 1–5 approachable, then adds a quadratic late-career requirement so higher levels take progressively more victories. Level 15 requires 1,280 XP instead of 680. Attributes always display as whole numbers.

Eligible victories award whole Attribute Points based on opponent level: zero below the fighter's level, one at the same level, and two above it. Losses and forfeitures never award points. Unspent points are persisted immediately and assigned from the glowing **Improve Your Fighter** panel at the top of the Fight page. On mobile, its four attributes use a readable two-by-two layout; desktop retains one row. Assignment is permanent, saved immediately, and guarded against repeated clicks.

The first post-fight result includes a compact guide explaining Attribute Points, passive recovery, and how to take the next fight. It is permanently hidden after that first result is closed; established careers do not see it. The expandable scorecard retains both fighter names, portraits or silhouette fallbacks, ratings, round scoring, fight plan, and totals.

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

Equipping the Dill Pickle collectible improves the Health tick from 60 seconds to 55 seconds.

### Health

- Recovers `+1 Health` every 60 seconds
- Never exceeds maximum Health
- HUD status: `RECOVERING · FULL IN HH:MM:SS`
- Uses the same timestamp and offline-cap safeguards as Energy

Fight damage and minimum medical clearance remain active. Persistent Health damage is increased by 25% and rounded up after each fight. Wins cost at least 5 Health. Losses enforce minimum damage of 10 Health by decision, 15 by submission, and 20 by knockout or technical knockout; damage already taken during the fight counts toward those totals.

Significant strikes can temporarily rock either fighter. A rocked fighter loses initiative and accuracy for up to two exchanges, becomes more vulnerable to knockdowns, stoppages, and submissions, and may recover early according to Chin and Cardio. Rocked moments and every knockout, technical knockout, or submission receive dedicated live-fight toasts for either outcome.

## Fight rewards

Fight results focus on career progress instead of currency:

- Zero, one, or two Attribute Points based on opponent level
- XP
- Followers
- Aura changes and cosmetic status titles
- Victory Pack progress or a gear reveal
- Rivalry and championship outcomes

Same-day opponent XP rules remain: full XP for the first same-level win, half XP for one runback, then zero XP. Lower-level opponents award no XP or Attribute Points. Winning against one also costs five percent of current followers, rounded up, and the matchup preview and result screen both disclose that fan backlash.

Aura replaces the former Hype meter without replacing Followers. It starts at 0, runs from 0–100, and multiplies follower momentum without changing fight odds. Home presents popularity tiers `OBSCURE` (0–39), `MAINSTREAM` (40–59), `ELITE` (60–79), `ICONIC` (80–98), and `LEGEND` (99–100). Positive Aura growth slows as status rises: Obscure receives 100% of a base gain, Mainstream 80%, Elite 60%, Iconic 40%, and Legend 25%, with a minimum gain of one Aura. This scaling applies to positive fight, callout, social, and CEO awards; Aura penalties remain at full strength.

Before tier scaling, ordinary on-level wins grant +2 Aura, same-level ratings upsets +5, title wins +10, title defenses +6, ordinary losses −7, and forfeits −10. Higher-level wins earn `ceil((fighter level × opponent level) × 0.25)` Aura. Lower-level wins lose 3 Aura for a one-level gap plus 2 for each additional level, capped at a maximum loss of 10. A lower-level opponent always triggers that bounded penalty even during a title win or defense. Accepted Feed callouts are the exception and use a fixed base stake instead: +5 Aura for a win at any level and −10 for a loss or forfeit; callout wins are exempt from lower-level follower backlash while retaining normal XP and Attribute Point rules.

Aura also drives passive follower growth at `1 + floor(Aura / 10)` followers for every completed hour. The saved accrual snapshot preserves the Aura rate active during an elapsed hour, retains partial-hour progress, and safely caps offline awards at 48 hours. Standard positive fight follower rewards use the current Aura and equipped follower perks, then apply a 0.75 payout multiplier. Completed losses grant 15% of the opponent's base followers before the same 0.75 reduction. Social-post and passive follower rewards are not reduced; forfeits still grant zero followers, and lower-level victory backlash remains five percent.

## Gear and Victory Packs

Eligible wins against opponents at the fighter's level or higher advance the four-step Victory Pack meter. Upsets, rivalries, and finishes can accelerate progress. A first career win guarantees a Victory Pack.

XP and Victory Pack progress are shown as full-width Home progression rows above sponsorship, keeping the fighter portrait focused on identity, record, and the current sponsor.

Collectibles are permanent, and every drop reveals an undiscovered, level-eligible item until the 32-item collection is complete. Each Gear category shows collection progress as owned collectibles out of the total available. Every owned card equips inline, with two active slots in each category. Fight Gear controls combat attributes and, on selected items, faster Energy charging. Bling, Lifestyle, and Property & Rides provide Aura and recovery bonuses.

The Gear page keeps the Daily Drop, its next-drop countdown, and the installation Drop together above the collection. When a Daily Drop is ready, the Gear navigation item receives a gold action indicator. The Daily Drop grants a guaranteed collectible; it does not grant currency or manually refill resources.

Home also offers each registered fighter a shareable invite. An invite is attached when a new fighter creates their permanent identity and qualifies after that fighter completes their first bout. The inviter then receives one server-validated, guaranteed nonduplicate collectible, which auto-equips when its category has an open slot.

## Follower-based sponsors

Sponsors are a sequential status track. Reaching the next follower milestone automatically advances the fighter, records the sponsor in career history, and shows a sponsor announcement. Sponsorships do not pay bonuses.

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

Sponsor status follows the current audience. If a fighter falls below the active milestone, the deal ends and the fighter drops to the highest sponsor tier their current follower total still qualifies for. The dropped sponsor announces the split in the Cage Feed. Previously earned sponsors remain in career history, and crossing their milestone again restores the partnership with a return Feed post and sponsor announcement.

## Sharing wins

Victories include a **Share Win** action. Share text uses the actual opponent, finish, round, updated record, win streak, championship result, and `https://cagegrind.com` when available.

The game uses the Web Share API where supported, then falls back to the Clipboard API. If both are unavailable, it opens a selectable text field. Sharing is non-fatal and never interferes with saving or claiming the fight result.

## Championships, rankings, and real fighters

The shared Supabase-backed championship remains server-authoritative and non-fatal when offline. The Fight page uses the same ranking order as the Home rankings modal: the active champion is first, followed by a hybrid World Rank score weighted 30% résumé, 45% quality of defeated opposition, 20% recent form, and 5% permanent base attributes. Résumé win rate uses a neutral 2-2 prior so one-fight undefeated records do not outrank proven careers. Equipped gear and non-combat perks never inflate World Rank. Each full-width row shows rank, portrait, name, record, level, win percentage, exact win XP, and the Attribute Points available for that matchup. Tap any available row to open the existing Tale of the Tape.

Opponent quality is captured from World Rank when the matchup is booked: champion 95, top five 90, top ten 80, top 25 65, top 50 50, top 100 40, and other ranked fighters 30. Level adjusts this by at most −10/+5; unranked Circuit quality starts at 20 and cannot exceed 25. A title defense uses the challenger's rank, with no extra title bonus. The last 30 bouts retain major wins: quality blends the best five wins (70%, empty slots count as zero) with average win quality (30%). Recent form uses only the last ten bouts, rewards stronger wins, and softens losses to stronger opponents. Résumé volume credit comes from wins, not total fights. Historical entries keep their recorded quality because previous opponent ranks cannot be reconstructed.

Apply `supabase/migrations/20260905120000_opposition_based_rankings.sql` before deploying this ranking update. It expands accepted profile history to 30 bouts and updates the database scoring function to match the browser. This migration does not rewrite historical records or change championship ownership.

Each fighter receives 12 bouts per local day. Five consecutive same-day wins against opponents at the fighter's level or higher award one three-fight bonus, raising that day's maximum to 15; losses, forfeits, and lower-level wins reset the qualifying streak, while an earned bonus remains available until local midnight.

Two generated on-level Cage Circuit fighters always appear above the real rankings. They are clearly labeled `UNRANKED PRO BOUT` with rank `N/A`, show their country flag, provide reliable full-XP progression matchups, and never count as championship defenses. Circuit wins and losses count toward the fighter's professional record, win streak, and best streak, while ranked opponents remain the route through the world ladder. Beating either Circuit fighter removes that opponent and immediately generates a fresh on-level replacement. A Circuit fighter who wins becomes the single available `CAGE CIRCUIT REMATCH`; losing to a different Circuit fighter replaces the older rematch, so one slot always remains fresh. Circuit opponents can distribute their ratings differently, but their four-attribute total is capped at one point above the player's total. After two consecutive Circuit losses, fresh opponents are instead capped one point below the player until a Circuit win resets the loss streak. Ranked opponents below the player's level correctly award `0 XP`; the ladder labels those rows `LOWER LEVEL`, and it labels opponents whose same-day XP has already been exhausted as `XP USED TODAY`.

VasoJoseMX is the only scripted starter fight. After the opening showcase, players choose their next opponent from the Cage Circuit or world rankings. Previously pending DiegoRamosBR contracts are cleared when a saved career loads.

Ranked opponents are not level-locked. Rewards use ranks captured at fight start. Wins over higher-ranked opponents earn two Attribute Points (maximum two total) and at least same-level XP, even if the opponent is lower level. Otherwise, on-level wins earn one Attribute Point and higher-level wins earn two; lower-level wins earn none and trigger the five-percent follower penalty. Higher-ranked wins avoid lower-level follower and Aura penalties and qualify for Daily Heat and Victory Pack progress. Rank-only bonuses stop after two wins against the same opponent that day; existing level-based rules continue unchanged. Circuit opponents have no rank bonus. Existing same-day XP reduction rules still apply and the displayed preview reflects every consequence.

The champion appears at rank number one and every fighter gets one title attempt per local day. A reigning champion sees the same ladder and may select any proven ranked fighter for the day's title defense. After that defense is complete, the remaining ranked fighters stay available as normal non-title fights instead of inheriting the defense lock.

On-level opponent attributes follow the expected one-Attribute-Point-per-win career curve. Generated and ranked matchup ratings grow steadily through the early levels, then compound only slightly from Level 7 onward. Existing generated opponents are recalculated when a career loads so older saves do not retain the retired Training-era difficulty curve.

Retiring as champion passes the belt to the highest-ranked eligible active fighter through the existing database flow.

## Save migration

Current saves use state version 31. Migration preserves identity, avatar, hometown, archetype, level, XP progress percentage, record, attributes, followers, Aura, gear, equipped gear, active perks, opponents, rivalry, championship, and Feed history. Legacy Hype converts directly to Aura; new careers begin at 0 Aura. Existing careers begin with no Circuit loss streak.

Migration proportionally rescales existing XP into the balanced curve, adds zero unspent Attribute Points to existing careers, adds passive-recovery timestamps and a safe Aura snapshot for follower accrual, assigns the sponsor supported by the current follower total while retaining sponsor history, removes obsolete economy/activity fields, and clears interrupted legacy activities. A valid career is not reset merely because old fields are present.

Completed careers save locally first and then sync an authenticated, private Supabase backup. When the local save is missing or invalid, startup restores that backup before rendering the landing screen. Older fighters without a full backup can recover their permanent public identity, record, level, portrait, hometown, archetype, and ranked attribute total from their owned profile; subsequent progress then uses the full private backup.

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

Country flag artwork is derived from [OpenMoji](https://openmoji.org), the open-source emoji and icon project, and is used under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

## Development and validation

Run the complete test suite:

```bash
npm test
```

When changing cached files, update `app-version.json`, package metadata, the service-worker cache version, and `?v=` asset query strings together.

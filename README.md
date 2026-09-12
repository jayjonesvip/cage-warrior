# Cage Grind

Cage Grind is a mobile-first MMA career game built with static HTML, CSS, and vanilla JavaScript. Open `index.html` in a modern browser; there is no build step or application server.

## Core loop

Daily Heat continues after the five-win bonus: ten consecutive qualifying wins in one local day award a flat +5 Aura (capped at 100) and one randomized CEO acknowledgement. The Aura reward flag survives same-day reloads and resets at local midnight. Public announcements use the authenticated, per-fighter/day idempotent RPC in `20260906120000_daily_heat_ceo.sql`; failed posts remain in the private career's pending queue for retry. As with the existing career backup model, eligibility data is client-simulated, not a server-authoritative fight audit.

Locker-room music is opt-in through the fight-plan music toggle, with volume and preference saved locally. A synthesized 92 BPM theme gains layers at effective Aura thresholds 40, 60, 80, and 99. Enabled music builds into a three-second walkout on plan confirmation and fades before live action. It stops on fight cleanup and pauses while the page is hidden; unavailable Web Audio never prevents a fight. The soundtrack has no effect on combat or rewards.

The career is intentionally centered on one repeatable loop:

1. Choose an opponent and fight.
2. Win to earn permanent Attribute Points: zero below your tier, one within your tier, and two above it (Circuit rewards remain level-based).
3. Assign points to Power, Speed, Chin, or Cardio—or save them.
4. Energy and Health recover automatically.
5. Fight again, build a following, attract sponsors, collect gear, and climb toward the championship.

Traditional training, manual resting, recovery-room treatments, side jobs, gambling, and the money economy are not part of the current game. Open Gym sparring is a reward-free scouting tool and does not alter career resources or results.

Open Gym's Scout a Fighter picker lists the shared roster, ordered by descending level, win percentage, wins, and head-to-head, excluding your own fighter. Selecting a fighter copies the same opponent attributes and style used by ranked bouts into a sparring clone; the copy stays fixed while you plan and spar. Returning to the gym refreshes the selected matchup. This is not an official bout and never changes either fighter's record. The timed one-round spar and latest coaching report remain available, with the last report saved until another session completes. If ranked fighters are unavailable, sparring stays disabled instead of substituting a generated opponent.

## Navigation

The five-item navigation is Home, Fight, Gym, Gear, and Feed. The five primary pages are:

- **Home** — the fighter profile and portrait first, followed by identity, record, total attributes, XP progress, Victory Pack progress, sponsor progress, and a dismissible CEO modal summarizing the past 24 hours in broad terms with a pro tip. It waits until other popups are closed. Dismissal hides the note for 24 hours across reloads; its next appearance fetches a fresh roundup.
- **Fight** — available Attribute Points, a fighter roster grouped into five named tiers with exact win rewards, rematches, and championship activity.
- **Gym** — a one-round scout spar against a same-level, next-level, or champion-caliber test. The player sets Pace, Offense, and Tactics, then receives a persistent grade with attribute and plan advice. Reigning champions instead choose between a same-level test and the top contender. Sessions cost nothing and never affect official career state.
- **Gear** — Daily and installation Drops, Victory Packs, and collectible cards that equip Fight Gear or career perks directly.
- **Feed** — follower/following totals, CageReporter coverage, mentions, rivals, sponsors, and player interactions. Following includes known social accounts and ranked fighters.

The compact Energy, Health, Power, Speed, Chin, and Cardio dashboard remains sticky while the larger identity row scrolls away.

## Fighter creation and progression

Eligible victories can earn gold personal-best stamps for fastest finish, biggest upset, and a new best streak. Finish and upset records start with results observed after this update; existing best streaks are preserved. Lower-level wins and forfeits cannot earn stamps. Open Gym recognizes improved grades on comparable tests and calls out a changed plan choice. Sponsors have five brand-specific reactions each, rotating in the player's saved local Cage Feed after notable finishes, upsets, or five-win streak milestones, at most once per sponsor per local day and at least three fights apart. These reactions do not publish to the global feed.

A new career permanently locks the fighter avatar, twenty-point starting attribute allocation, archetype, hometown, and unique Cage Feed handle.

Fighter creation offers 70 portraits, including avatars 66–70. Each uses the same twenty-point starting attribute budget. Apply `supabase/migrations/20260908170000_expand_fighter_avatars_to_70.sql` before publishing this avatar update so the new portraits can be claimed and synced.

Level and XP still come from fights. The balanced XP curve keeps Levels 1–5 approachable, then adds a quadratic late-career requirement so higher levels take progressively more victories. Level 15 requires 1,280 XP instead of 680. Attributes always display as whole numbers.

Roster victories award whole Attribute Points based on opponent tier: zero below the fighter's tier, one in the same tier, and two above it. Circuit victories retain level-based points. The tier boundaries and both fighter levels are captured when the fight is booked and used for its displayed and awarded points. Losses and forfeitures never award points. Unspent points are persisted immediately and assigned from the glowing **Improve Your Fighter** panel at the top of the Fight page. On mobile, its four attributes use a readable two-by-two layout; desktop retains one row. Assignment is permanent, saved immediately, and guarded against repeated clicks.

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

- Zero, one, or two Attribute Points based on roster tier (Circuit uses level)
- XP
- Followers
- Aura changes and cosmetic status titles
- Victory Pack progress or a gear reveal
- Rivalry and championship outcomes

The same opponent cannot be fought again for 24 hours after a win, loss, or forfeit. This rolling cooldown uses saved fight history, follows immutable opponent IDs (with a name fallback for older entries), survives reloads, and does not reset at midnight. The roster and profile show the remaining time, and booking is blocked before Energy is spent. Fresh opponents remain available. Existing same-day XP scaling stays as a legacy safeguard. Lower-level opponents award no XP. Roster opponents in your tier can still award an Attribute Point. Lower-level wins outside your roster tier cost five percent of current followers, rounded up; same-tier wins receive the normal follower payout. The matchup preview and result screen disclose backlash only when it applies.

Aura replaces the former Hype meter without replacing Followers. It starts at 0, runs from 0–100, and multiplies follower momentum without changing fight odds. Home presents popularity tiers `OBSCURE` (0–39), `MAINSTREAM` (40–59), `ELITE` (60–79), `ICONIC` (80–98), and `LEGEND` (99–100). Positive Aura growth slows as status rises: Obscure receives 100% of a base gain, Mainstream 80%, Elite 60%, Iconic 40%, and Legend 25%, with a minimum gain of one Aura. This scaling applies to positive fight, callout, social, and CEO awards; Aura penalties remain at full strength.

Before tier scaling, ordinary on-level wins grant +2 Aura, same-level ratings upsets +5, title wins +10, title defenses +6, ordinary losses −7, and forfeits −10. Higher-level wins earn `ceil((fighter level × opponent level) × 0.25)` Aura. Lower-level wins lose 3 Aura for a one-level gap plus 2 for each additional level, capped at a maximum loss of 10. Roster wins within the same booked tier are exempt from lower-level and exhausted-matchup Aura penalties. They receive the usual positive win, upset, higher-level, or title Aura reward, and no follower backlash. Loss and forfeit Aura penalties still apply. Outside that exemption, lower-level opponents trigger the bounded penalty even during a title win or defense. Accepted Feed callouts are the exception and use a fixed base stake instead: +5 Aura for a win at any level and −10 for a loss or forfeit; callout wins are exempt from lower-level follower backlash while retaining normal XP and Attribute Point rules.

Aura also drives passive follower growth at `1 + floor(Aura / 10)` followers for every completed hour. The saved accrual snapshot preserves the Aura rate active during an elapsed hour, retains partial-hour progress, and safely caps offline awards at 48 hours. Standard positive fight follower rewards use the current Aura and equipped follower perks, then apply a 0.75 payout multiplier. Completed losses grant 15% of the opponent's base followers before the same 0.75 reduction. Social-post and passive follower rewards are not reduced; forfeits still grant zero followers, and lower-level victory backlash outside your roster tier remains five percent.

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

## Championships and the fighter roster

The shared Supabase-backed championship remains server-authoritative and non-fatal when offline. There are no World Rank numbers or performance scores in the fighter list. A synced, visible undisputed champion has a separate section at the top; Circuit matchups retain their own section. Everyone else is grouped into five named tiers, highest tier first: Elite, Contenders, Challengers, Prospects, and New Blood. The entire player tier is highlighted green and labeled YOUR TIER. Levels remain visible and fighters sort highest level first within each tier. Equal levels sort by exact win percentage (wins divided by wins + losses + draws), then total wins, then head-to-head wins minus losses against the other fighters still tied. Three-way ties use that mini-table rather than pairwise comparisons, so circular results stay deterministic. Unplayed or unresolved ties use immutable fighter ID. Total effective Power, Speed, Chin, and Cardio (including Fight Gear) remain visible but do not affect order. Unsynced fighters remain hidden until usable attributes arrive. Open Gym and the Feed picker use the same order.

The highest active roster fighter (including seeded fighters and the champion) sets the tier ranges. The profile query loads highest levels first so pagination cannot omit that ceiling. For ceiling H, each tier's upper boundary is floor(tier number × H / 5); extra levels are distributed across bands and the highest fighter reaches Elite. A level-15 ceiling gives 1–3 New Blood, 4–6 Prospects, 7–9 Challengers, 10–12 Contenders, and 13–15 Elite. A level-16 ceiling gives 1–3, 4–6, 7–9, 10–12, and 13–16. Before five levels exist, one-level bands reserve space for all five tiers. Retired/inactive fighters and generated Circuit opponents do not set the ceiling. While offline, the available cached roster supplies it. No database migration is needed for tier grouping. XP, Daily Heat, and Victory Packs retain their existing level rules. Aura and follower backlash exempt wins within the same tier, using the tier context captured when the fight was booked.

Each full-width row shows portrait, name, record, level, total attributes, win percentage, and exact win rewards. Tap a row to open the existing opponent profile and book a fight. The list loads more tier groups as you scroll and keeps your own fighter visible. Home shows total attributes in place of World Rank; rank movement popups are retired.

Apply `supabase/migrations/20260908180000_level_grouped_fighter_roster.sql`, then `supabase/migrations/20260908190000_fighter_record_tiebreakers.sql`, before publishing this update. The latter aligns automatic championship challenger selection and vacant-title succession with level and record tie-breakers, preserving eligibility rules and the reigning champion. It backfills identifiable historical human bouts, records immutable opponent IDs on new results, and supplies shared head-to-head totals for human and seeded fighters. If those totals cannot load, the client keeps its last shared results and falls back to stable identity for unresolved ties. Existing ranking history and scoring functions remain for save/database compatibility; they do not order the active fighter list or grant rank-based rewards. Verify the migration with `scripts/verify-fighter-order-sql.cjs` using an external `PGLITE_MODULE_PATH` installation.

Two generated on-level Cage Circuit fighters always appear above the tier groups. They are clearly labeled `UNRANKED PRO BOUT` with rank `N/A`, show their country flag, provide reliable full-XP progression matchups, and never count as championship defenses. Circuit wins and losses count toward the fighter's professional record, win streak, and best streak, alongside shared roster bouts. Beating either Circuit fighter removes that opponent and immediately generates a fresh on-level replacement. A Circuit fighter who wins becomes the single available `CAGE CIRCUIT REMATCH`; losing to a different Circuit fighter replaces the older rematch, so one slot always remains fresh. Circuit opponents can distribute their ratings differently, but their four-attribute total is capped at one point above the player's total. After two consecutive Circuit losses, fresh opponents are instead capped one point below the player until a Circuit win resets the loss streak. Ranked opponents below the player's level correctly award `0 XP`; the ladder labels those rows `LOWER LEVEL`, and it labels opponents whose same-day XP has already been exhausted as `XP USED TODAY`.

The shared seeded roster also includes 15 additional CPU fighters across Levels 2–16, using portraits 51–65 and a mix of eight strikers and seven grapplers. Apply `supabase/migrations/20260908160000_add_fifteen_seeded_fighters.sql` after the avatar-65 migration to expand the original 28-fighter roster to 43. It inserts new identities without resetting existing records or changing the two generated Circuit slots. Re-running preserves played results and inactive fighters. Reserved player-name collisions abort the migration. Verify it locally with `scripts/verify-seeded-roster-sql.cjs`, using the same external `PGLITE_MODULE_PATH` as the ranking verifier.

VasoJoseMX is the only scripted starter fight. After the opening showcase, players choose their next opponent from the Cage Circuit or tier-grouped roster. Previously pending DiegoRamosBR contracts are cleared when a saved career loads.

Roster opponents are not level-locked. Attribute Point rewards depend on opponent tier: higher-tier wins award two, same-tier wins one, and lower-tier wins none. Circuit opponents retain their level-based point rules. Lower-level wins earn no XP and do not qualify for Daily Heat or Victory Pack progress. Follower and Aura backlash applies only outside the same-tier exemption. The 24-hour rematch lock applies to all opponents, including championship and Circuit rematches; existing XP and drop limits remain in place. Old rank metadata cannot override these rules.

The champion appears in a separate section at the top and every fighter gets one title attempt per local day. A reigning champion sees the same ladder and may select any proven ranked fighter for the day's title defense. After that defense is complete, the remaining ranked fighters stay available as normal non-title fights instead of inheriting the defense lock.

On-level opponent attributes follow the expected one-Attribute-Point-per-win career curve. Generated and ranked matchup ratings grow steadily through the early levels, then compound only slightly from Level 7 onward. Existing generated opponents are recalculated when a career loads so older saves do not retain the retired Training-era difficulty curve.

Retiring as champion passes the belt to the eligible active fighter with the highest level followed by win percentage, wins, and head-to-head through the existing database flow.

## Save migration

Current saves use state version 31. Migration preserves identity, avatar, hometown, archetype, level, XP progress percentage, record, attributes, followers, Aura, gear, equipped gear, active perks, opponents, rivalry, championship, and Feed history. Legacy Hype converts directly to Aura; new careers begin at 0 Aura. Existing careers begin with no Circuit loss streak.

Migration proportionally rescales existing XP into the balanced curve, adds zero unspent Attribute Points to existing careers, adds passive-recovery timestamps and a safe Aura snapshot for follower accrual, assigns the sponsor supported by the current follower total while retaining sponsor history, removes obsolete economy/activity fields, and clears interrupted legacy activities. A valid career is not reset merely because old fields are present.

Completed careers save locally first and then sync an authenticated, private Supabase backup. When the local save is missing or invalid, startup restores that backup before rendering the landing screen. Older fighters without a full backup can recover their permanent public identity, record, level, portrait, hometown, archetype, and ranked attribute total from their owned profile; subsequent progress then uses the full private backup.

## Editable fight rules

`fight-rules.json` contains descriptive, validated fight and resource constants. `js/fight-rules.js` validates the file and falls back safely when a value is missing or unsafe. `js/game-logic.js` contains deterministic progression and migration helpers used by the browser and tests.

Strike stoppages can follow a landed cross, hook, or kick once the defender is below 70% condition, without requiring a previous rocked event. The chance increases with accumulated damage, strike damage above six, and knockdowns, capped at 35% for this additional path. Existing rocked and critically low-condition finishes remain. Submission base chance is 5%, with a 3.5-point signature bonus and 0.08-point increase per condition point lost; skill edges and submission limits still apply. These settings live in `fightFinishes` and match the offline defaults.

Run `npm run test:fight-distribution` for a reproducible 110,000-fight balance report in `output/fight-distribution/`. The script uses the actual three-round simulator and current rules, with a 40,000-fight baseline equally weighting matched fighters at 5, 12, 25, and 50 points per attribute; styles and all eight plans are sampled uniformly. It also tests individual styles, plans, an attribute gap, and reduced starting condition. For the validated tuning seed, run `node scripts/fight-outcome-distribution.cjs 10000 output/fight-distribution-tuned 20260909`: the baseline is 47.70% decisions, 32.81% KO/TKOs and 19.49% submissions. These controlled results are not live player outcome statistics.


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

Tale of the Tape shows KO/TKO and submission percentages among wins with a known recorded finish method. Shared fighters use their own career results; seeded fighters use recorded wins against players. Circuit opponents use their recorded wins against you. Missing history displays a dash, and the recorded-win sample size is shown. Estimated American odds compare squared effective attribute totals adjusted for starting condition, bounded to a 5–95% chance; they are a matchup estimate, not a calibrated simulation prediction. Apply `supabase/migrations/20260908200000_tale_of_tape_stats.sql` to enable shared finish statistics and backfill matching saved fight history.

### First-win progression

When the first career win earns an Attribute Point, Claim Rewards stays disabled until the player spends one point on a permanent upgrade directly on the rewards card. Other rewards are dimmed while that first choice is pending. The card confirms the chosen upgrade, restores the rewards to full brightness, and then enables Claim Rewards. Later wins allow saving points as usual. It guarantees a short, dismissible message from Mom as the final follow-up, after collectible packs, level-ups, and other announcements are closed. At 1–0, the Fight screen highlights a fresh on-level Circuit opponent whose total attributes are closest to the player's base build. This recommendation survives reloads through the existing career state, respects matchup availability and the 24-hour rematch lock, and disappears after the next completed fight. The full roster remains available; the recommended bout uses the normal simulation.

The opening showcase walkout lasts 1.5 seconds with one entrance beat. Later walkouts last 3 seconds. Entrance music stops before combat starts.

### Landing and career setup

The landing card introduces a fighter portrait, the current shared champion and defense count, and the latest dated Cage Feed post from the last 24 hours. Older, future-dated, or invalid entries are excluded. Empty and unavailable feeds have explicit fallback copy. Champion and feed reads run independently of Start, refresh once per minute while the landing is visible, and stop refreshing after entry. The displayed feed excerpt is shared post text, not a claim about players currently online.

New careers open on a ready-made 20-point build with a randomly preselected hometown and appearance. The hometown dropdown sits above one portrait-and-attributes card, with Shuffle Avatar under the portrait and a full-width Shuffle Attributes control beneath the numeric legend. Both shuffles update the saved draft independently, and the chart always shows its 20 starting points. Hometown, appearance, and attributes remain editable until Next. The builder has two steps: accept the fighter, then reserve a name. Incomplete saved careers resume their unfinished step automatically without rerolling their build. Existing accepted builds remain permanent.

Name reservation failures show an inline Retry Name Check action and preserve the exact submitted name with the saved build. Requests have a 15-second confirmation deadline; eligible failures retry on the browser's online event, while taken manual names ask for a different name. Successful claims confirm that the handle is on the roster immediately; optional profile stats and cosmetic updates run through normal career sync. These changes use the existing identity, feed, and championship endpoints and require no database migration.

Championship results use the confirmed settlement and the player’s booked role, so a stale champion flag cannot turn a lost defense into a win message. Result notices distinguish wins, losses, and unchanged title outcomes. The title-loss notice waits for other overlays, and View Championship returns to and focuses the champion section of the Fight roster.

The pre-fight profile retains its original portrait-and-chart layout, four-column numeric stats, fight-skin row, and full agent read. A shorter portrait and smaller chart save space, and rewards and clearance appear as one wrapping sentence.

The name step keeps the standard card header with a Locks in on Next tag. A labeled shuffle control and hint use the existing random-name generator; Manual entry is secondary, and Next reserves the permanent name with the existing validation and retry handling.

A dethroned champion has one immediate rematch against the fighter who took the current reign. This earned rematch bypasses the UTC daily title-attempt wait and the ordinary 24-hour opponent lock; normal fight limits, health, energy, and active-career checks still apply. Booking consumes the right even if that rematch is abandoned or expires. A subsequent belt transfer or a different opponent does not reuse the old right. Apply `supabase/migrations/20260911130000_immediate_title_loss_rematch.sql` before deploying this client change. The migration keeps ordinary title attempts unique per challenger/day and records special rematches with a unique title-loss history ID. No new public table is created.

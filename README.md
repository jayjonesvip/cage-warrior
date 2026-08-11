# Cage Grind

The in-round Sim+ trigger and choice rules are documented in [FIGHT-DECISION-MATRIX.md](FIGHT-DECISION-MATRIX.md).

[![pages-build-deployment](https://github.com/jayjonesvip/cage-warrior/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/jayjonesvip/cage-warrior/actions/workflows/pages/pages-build-deployment)

[Play Cage Grind](https://cagegrind.com/)

Cage Grind is a mobile-first, single-player combat-career game. Open
`index.html` directly in a modern browser; no build step or server is required.
The page loads its presentation from `styles.css`, scalable copy pools from
`strings.js`, testable gameplay rules from `game-logic.js`, and browser
interactions from `game.js`.

### Landing page

- Every browser visit opens on a branded, responsive Cage Grind front door
  before revealing the game interface.
- A completed local career receives a personalized **Welcome Back** message,
  current level, record, Followers, and a **Keep Grinding** action. A partially
  completed fighter receives **Continue Your Build** instead of being mistaken
  for a new or finished career.
- New players see a concise career pitch covering tactical rounds, training,
  hustles, drops, sponsors, and the title climb before choosing **Start Your
  Career**. Choosing an entry action never resets or replaces the recovered
  local save.
- On phones, the personalized headline and entry action appear before the
  octagon artwork and longer feature pitch. The landing shell uses the safe
  viewport and device inset so the full action remains above the browser fold.

### Responsive desktop interface

- Phone and installed-mobile layouts remain unchanged below 1100px.
- At desktop widths, navigation becomes a persistent left rail, the fighter
  HUD becomes a single horizontal command bar, and the playable area expands
  to a 1440px maximum workspace.
- Home uses a split career dashboard, Training and Hustle use two-column
  workspaces, opponents and gear render four across, and Cage Feed receives a
  wider reading column.
- Fight Night keeps the same simulation and decisions, while the live timeline
  and between-round corner decision can appear side by side.
- Buttons use one shared three-color language at every screen size: blue for
  primary actions, slate for secondary choices, and amber for rare rewards,
  title opportunities, and other limited moments.

## Current game

Build a fighter from unknown rookie to champion through tactical fights,
training, side jobs, publicity, sponsors, equipment drops, and a persistent
generated league.

### Fighting and progression

- New careers complete four permanent Home-screen choices in order. First,
  choose a "Fighting Out Of" hometown: Phoenix, Los Angeles, Chicago, New York,
  Miami, Houston, Cleveland, Seattle, New Orleans, or Hawaii. Next, choose one of
  40 fighter avatar cards. New Orleans belongs to the Deep South title region;
  Hawaii belongs to the Pacific Islands.
  Finally, choose one of seven permanent MMA archetypes: Pressure Fighter,
  Counter-Striker, Brawler, Trickster / Unorthodox, Control Grappler,
  Submission Hunter, or Wrestle-Boxer. The last step suggests a fighter identity
  from shared color and weather/dangerous-animal pools, followed by the hometown
  abbreviation. **New Name** rerolls it, while **Ready** checks the global roster,
  permanently reserves the unique identity, and starts the career.
- Every avatar has a unique base allocation across Power, Speed, Chin, and
  Cardio. Each value is a whole number from 2 through 8 and the four values
  always total exactly 20. The game validates that allocation before locking
  the fighter in.
- Each selector disappears as soon as its choice is locked. Career systems,
  the HUD, and navigation remain hidden until hometown, fighter, archetype, and
  permanent fighter name are complete. The Career Identity card keeps the hometown and archetype
  beside Followers, career earnings, and the next milestone; the selected
  avatar remains visible in the Home hero without a duplicate identity row.
  The fighter name is also the Cage Feed username and cannot be edited after
  **Ready**. New names use CapitalCase without a numeric suffix, such as
  `WhiteDrizzlePHX`, `GoldenTornadoNYC`, or `BlueViperCLE`. Every hometown uses
  the same 76 opening words (colors, former wildcard modifiers, and 24
  nationality/origin terms), plus 23 weather/force, 35 animal, and 28 combat
  terms. Exact repeated words are excluded, producing 6,534 combinations per
  city and 65,340 across all ten
  hometowns. City endings are PHX, LAX, CHI,
  NYC, MIA, HOU, CLE, SEA, NOLA, and HNL.
- Home includes a deliberately red **Retire Fighter** action. Its confirmation
  warns that the local career, record, Cash, gear, and progress will be lost.
  CageReporter publishes the retirement, the name remains permanently reserved,
  and the game returns to the first fighter-creation step. If the public
  retirement cannot be recorded, the local career is kept safe.
- Home presents Hit the Gym, Take a Fight, Hustle, and Gear as illustrated
  choice cards. The cards explain each career path while distinct bottom
  buttons perform the actual navigation, so every action remains visually
  obvious. Enabled primary actions use consistent blue fills and bold white
  labels; secondary controls use slate, special opportunities use amber, and
  disabled or locked controls remain visibly subdued.
- Fighter selection places each transparent portrait over a blue arena-light
  gradient, with a brighter keyboard-focus and hover treatment around the card.
- The Home hero shows a Cage Status tied to the real title ladder: Prospect,
  Contender, Title Challenger, or the fighter's current championship.
- An active endorsement appears in the Home hero directly beneath Cage Status,
  showing the sponsor brand and the number of contracted fights remaining.
- Endorsements form a sequential sponsor ladder at 2,500, 10,000, 30,000,
  80,000, and 200,000 Followers. Only the next brand may offer a contract, so
  crossing several milestones at once never produces competing offers. Older
  saves repair incomplete sponsor history before rendering or accepting deals.
- A rotating promoter ticker leads the unlocked Home screen and teaches the
  active rules—fight costs, medical clearance, purses, rematches, tactics,
  drops, coaching, and titles—in the voice of a suspiciously well-informed
  fight agent.
- The persistent top HUD keeps all four fighter attributes in one compact row
  directly beneath energy and health across every unlocked game screen.
- Energy and Health meter lines turn red whenever the resource falls below 25%
  so a dangerous condition is visible at a glance.
- XP sits beneath level and rank in the top-left identity block, while Hype
  sits beneath Cash and Followers on the right. The redundant Home resource
  card is removed.
- Followers are the fighter's lasting social audience, while Hype represents
  short-term attention. Successful fighter-to-fighter Cage Feed posts add a
  small, deterministic burst of both while keeping the shared community feed
  at the center of the interaction.
- Every generated opponent uses the same seven-archetype system. Their card,
  tale of the tape, attributes, scouting report, and in-fight behavior all
  reflect that archetype.
- Round 1 starts with a one-time opening choice. **Aggressive** immediately
  imposes your permanent signature style and gains initiative. **Feel Them
  Out** uses that same signature discipline more cautiously, conceding some
  early initiative in exchange for a deeper corner read. Either choice reveals
  the opponent's basic tendency after Round 1.
- Before the fight, players choose their corner. **Hire the Coach** enables the
  full Sim+ opening, contextual round decisions, and corner adjustments; those
  calls can change damage, control, scorecards, and the outcome, and the coach
  receives 10% of fight winnings only after a win. **Quick Sim** keeps the full
  purse and automatically runs an accelerated fight using the fighter's stats
  and signature style without decision prompts. The Tale of the Tape toggle
  remembers the last selected mode for the next fight.
- Between rounds, the corner gives an unofficial **Protect the Lead**, **Too
  Close to Call**, or **You're Behind** read, followed by natural matchup
  advice. The grounded tactical choices are **Fight Your Way** with the
  signature style or an action-specific counter such as **Protect Your Neck**
  or **Circle Off the Fence**. Deep reads still identify strong, workable, or
  risky adjustments. When the signature style already supplies the answer,
  the duplicate choice collapses into one **Fight Your Way** action. The
  coach's-corner surface snaps directly to the live fight card edges.
- Submission Hunters can finish a fight by tap after a successful takedown.
  Speed, cardio, opponent condition, and signature-plan proficiency affect the
  submission chance.
- When condition falls to 25% or lower between rounds, the corner presents a
  one-time crisis choice. Throwing in the towel gives the opponent a TKO win;
  throwing a last-chance haymaker can swing or finish the fight, but missing it
  results in an immediate knockout loss. A haymaker costs 5 additional energy
  beyond the energy reserved for any rounds still to come. Its landing chance
  starts at 15%, then responds to attributes, condition, damage, and the
  Brawler archetype, with a 68% maximum.
- Fight energy scales with the player's current career level: Levels 1–2 cost
  6 energy per started round, Levels 3–4 cost 7, Levels 5–6 cost 8, Levels
  7–8 cost 9, and Level 9 onward costs 10. Three-round clearance therefore
  ranges from 18 to 30 energy. Only rounds that actually begin are charged.
- Fighters can complete up to 10 fights per local calendar day. The Fight page
  shows the remaining bouts and a live countdown to the local-midnight reset;
  energy and medical clearance remain the primary pacing limits.
- If the player's corner has them behind on the unofficial scorecards with ten
  seconds left in Round 3, the action pauses for one last decision: stay
  disciplined or spend 5 additional energy on a haymaker. Landing can score a
  dramatic knockdown, steal the decision, or produce a last-second knockout;
  missing leaves the fighter open to an immediate counter knockout.
- Watch fights normally or use 2× speed. There is no result skip: every
  surviving round requires its corner decision.
- Fight results lead with a large **YOU WIN** or red **YOU LOST** outcome, then
  show the finish method, round, and clock beneath it before the full scorecard.
- Build win streaks and earn upset and rivalry bonuses. Streaks of two or more
  become notable Cage Feed headlines after every additional win.
- Progress through a hometown title, its regional title, the U.S. Title, and
  the World Title. Reaching a championship threshold only unlocks its reigning
  champion; the belt is awarded only after that fighter is defeated.
- Generated progression continues beyond level 15.
- Level-ups trigger a dedicated promotion celebration showing the new level
  and rank, cumulative max-energy and max-health gains, partial recovery,
  career bonus, and any newly unlocked title challenge. Ordinary levels restore
  up to 30 energy and 25 health; title-challenge levels 5, 9, 12, and 15 fully
  restore both resources. Celebration effects share one bounded canvas loop,
  respect reduced-motion preferences, and stop when their result dialog closes
  so repeated rewards cannot accumulate background animation work.

### Cage Feed

- A fighter has no social account and earns no Followers until Cage Feed is
  opened for the first time. That first visit creates the account, publishes a
  "Hello, fight fans" introduction, and grants the first Followers.
  Existing saved careers that already have Followers are treated as connected
  accounts and keep their audience.
- Cage Feed uses Supabase for a shared global timeline while the career itself
  remains in `localStorage`. A connection is required only when **Ready**
  reserves a new globally unique identity and when a retirement is published;
  an established career and its local gameplay remain available offline.
- Fighter name and Cage Feed username are one case-preserved value. The database
  claims it atomically, silently tries another generated combination on a
  collision, and never releases claimed or retired names for reuse. Legacy
  lowercase identities remain valid and permanently reserved.
- Cage Feed has its own bottom-navigation icon. New timeline entries add a
  numbered red unread badge, and opening the Feed marks the visible posts read.
- The top-bar audience line shows both Followers and Following. Following is the
  live count of real fighter profiles in the shared Cage Feed roster.
- The timeline owns the Feed explanation and scrolls inside its own card.
  Generic composer controls are removed; interaction begins by tapping a real
  fighter's avatar and opening their public profile. Feed and fighter-profile
  copy uses a larger mobile text scale for easier reading.
- Fights, win streaks, losses, appearances, autograph signings, and sponsor
  deals generate contextual `CageReporter` coverage. The global feed emphasizes
  real fighters' canned posts instead of filling the timeline with fake fans.
- A fighter profile offers exactly three randomized, personalized message
  drafts presented as text-style composers with explicit **Send** buttons. The
  roughly 50-message pool covers callouts, props, welcomes, respect, and putting
  another fighter on notice. A confirmed post awards 5–12 Followers and 1–3
  Hype. Supabase enforces five direct fighter interactions per UTC day;
  `CageReporter` career coverage does not use that allowance. These social posts
  do not fabricate an accepted online fight.

### Career opponents

- Opponents are generated locally with persistent, country-aware identities such
  as `MarioLopezMX` or `RandyJonesUSA`, plus attributes, archetypes,
  professional records, and head-to-head history. First and last names come
  from the same country group, so an unrelated suffix is never attached.
- The **Cage Network** can add up to two recently active, exact-level real
  fighter profiles beside the three locally generated contenders. These are
  clearly labeled AI-controlled snapshots that use the fighter's public
  identity, portrait, archetype, and record. Their combat ratings are derived
  deterministically from level, avatar allocation, and archetype. Roster cards
  preserve CapitalCase identity display even for legacy all-caps profiles,
  without rewriting the fighter's stored Cage Feed handle.
- Cage Network snapshots persist in the local career and remain playable
  offline. Fighting one never changes the real fighter's public record, never
  creates a misleading shared CageReporter result, and can never award a title.
- Pre-fight roster and Tale of the Tape cards conceal the opponent's
  tendency and scouting report until the first round has been completed.
- The current level always replenishes to three fresh contenders, so the fight
  path cannot run dry before a level-up. Fresh current-level fights pay a full
  purse; past-level fights and rival rematches pay half purse.
- Any available opponent who has beaten the player carries a bright horizontal
  **Rematch** banner across the lower part of their fighter image and remains
  immediately available.
- Regular opponents never retire. Every defeated fighter persists in the
  **Past Rivals** collection. A free **Taunt for Rematch** guarantees that rival
  accepts one more fight; the bout uses the player's current level-based round
  cost, pays half purse, and retains full fight XP. Winning closes the offer
  until another taunt, while losing keeps the rematch immediately available.
- The Career Opponents roster shows available current and past opponents, past
  rivals, former champions, and a locked preview of the next level. The
  current-level group starts open; all other groups start
  collapsed behind tappable headers with fighter counts. Fighters are presented as fixed-ratio
  collectible-style cards, two across on mobile, with proportional artwork
  selected deterministically from 24 standalone transparent fighter
  silhouettes. Bright accent spotlights and subtle rim lighting keep the black
  silhouettes readable against every roster status and Tale of the Tape card.
  The front stays focused on identity and booking; tapping the card body flips
  it to a fixed-height details side with attributes, rating, availability,
  purse context, rivalry status, and head-to-head history. See Matchup remains
  a separate action and does not trigger the flip.
- An available opponent's **See Matchup** button opens a reversible Tale of the
  Tape preview without displaying the purse on the roster action. The preview
  spends no energy and explains the current level-based clearance, round cost,
  and optional 5-energy haymaker reserve directly beneath the purse. It then
  offers **Go Back** or **Fight!**; the first round's energy is charged only
  after Fight is confirmed and the cage-opening choice begins.
- Title champions are persistent named fighters with professional records and
  attributes. A failed title challenge leaves the champion available for
  another attempt; a win archives the defeated former champion.
- Daily Contracts and the seeded Daily Challenge are currently removed. The
  guaranteed Daily Drop remains available and may be expanded later.

### Collectible drops

- Equipment is earned from fight wins and the guaranteed Daily Drop; it is
  never purchased.
- The home-screen Daily Drop awards Cash, energy, and one deterministic,
  level-eligible collectible every day. It does not reset fight-drop pity.
- Collectible card artwork is emphasized within the fixed two-column card
  layout, while the Daily Drop uses the same high-contrast label treatment as
  other primary actions.
- A win has a 25% base drop chance. Upsets, rivalries, and KO/TKO finishes
  improve the chance, up to 75%.
- The fourth win without a drop guarantees one. Winning a title guarantees a
  drop of at least Rare quality.
- Minimum level controls when an item enters the permanent pool. Earlier items
  remain eligible at higher levels.
- Duplicate copies increase the collectible quantity but never stack the
  item's perk.
- Drop reveals validate their reward data before rendering. If a stale item or
  a device-specific celebration effect fails, the awarded collectible remains
  saved and the result dialog recovers instead of blocking the career.
- Owned items appear as fixed 2:3 collectible cards, two across on mobile,
  with full-card Common, Rare, Epic, and Legendary treatments.
- Fight Gear uses a four-slot active loadout. Attempting to equip a fifth item
  opens a focused Loadout Full dialog explaining that an equipped item must be
  removed first. Bling, Lifestyle, Property, and Rides provide passive career
  bonuses.
- The collectible pool also includes early-career and status drops such as a
  used car, small-batch bourbon, a small gym dog, Cuban cigars, fresh tennis
  shoes, and a full-length fur coat. Small Gym Dog is a separate Common card
  from the existing Rare Gym Dog. Each supports an optional same-name PNG
  override in `assets/` through its stable item ID.

### Economy and training

- **Cash** is the spendable balance shown in the header.
- **Career Earnings** is a permanent prestige total. Professional fight pay,
  career bonuses, sponsors, and appearances increase both values.
- Side jobs, underground winnings, and daily cash increase Cash without
  inflating Career Earnings.
- Underground Buzz keeps Backroom Spar and adds Backroom Blackjack as a
  separate once-per-local-day game. The player chooses a whole-dollar wager up
  to 25% of available Cash, then plays a persisted hand with Hit or Stand.
  Dealer stands on all 17s, natural blackjack pays 3:2, and pushes return the
  wager. There are no splits, doubles, or insurance.
- Basic training costs energy and daily sessions, not Cash.
- Coach Vega is an optional training upgrade that adds skill gain, XP, and a
  better perfect-session chance. His fee is `$35 + ($20 × fighter level)` per
  session; two-session sparring pays twice the fee.
- The Training page also has a Recovery Room with one paid treatment per local
  day. An Ice Bath restores 25 energy. A Sauna restores 15 energy and 12 health.
  A Sports Massage restores 5 energy and 25 health.
  Treatment costs `$40 + ($15 × fighter level)`, never exceeds the resource
  maximums, and does not consume a training session.
- Live countdowns on the Training and Hustle pages show the time remaining
  until their daily limits reset at the player's next local midnight.

### Persistence

Progress is stored locally in the browser with `localStorage`. Save migration
preserves existing fighters, hometown identity, avatar and base allocation,
generated rosters, rivalries, collections, loadouts, championships, Cash, and
Career Earnings. An in-progress blackjack hand is also persisted so a refresh
cannot consume the wager without allowing the player to finish. Legacy Technician, Grappler, and Endurance identities map to
Counter-Striker, Control Grappler, and Pressure Fighter. Old opponent
tendencies migrate without losing records or rivalries, and previously retired
regular fighters return to the permanent Past Rivals system. Legacy District and
National belt progress migrates into the new title ladder. The game also keeps
a last-known-good backup and refunds energy from an interrupted fight when the
save is restored. If a blank rookie save is ever written over a progressed
career, startup prefers the progressed last-known-good backup automatically.
Invalid JSON and empty save values cannot replace that backup. Save migration
also clamps resources to their valid ranges, discards malformed roster entries,
and repairs interrupted-fight booking data before play resumes. Daily rewards
and activity limits reset on the player's local calendar date.
Version 18 save migration merges legacy fighter names and Cage Feed handles into
one locked identity without discarding career progress. Version 19 preserves the
CapitalCase format for new identities while retaining existing lowercase names.
Only Cage Grind's
primary, backup, and legacy career keys are removed on retirement; the browser's
Supabase session and unrelated site storage are left intact.

### Replaceable icons

Interface, fight, training, hustle, publicity, sponsor, title, and collectible
icons support individual PNG overrides. Add a correctly named file under
`assets/icons/`; the PNG replaces the built-in symbol automatically, while a
missing file safely leaves the original fallback visible. The complete
filename inventory and usage map lives in
[`assets/icons/README.md`](assets/icons/README.md).

## Development

Run the repository checks with:

```sh
npm test
```

The game uses `index.html`, `styles.css`, `game-logic.js`, `strings.js`,
`analytics.js`, and `game.js` without a build step. `game-logic.js` contains the small shared rule
helpers used by both the browser and behavioral tests. `strings.js` groups
opponent names, fight commentary, Cage Feed
copy, generated social usernames, and promoter ticker lines so new variations
can be added without editing simulation logic.
The generated transparent header wordmark lives at
`assets/cage-grind-logo.png`, and the landing hero uses the transparent
`assets/cage-grind-octagon-transparent.png` artwork. The six bottom-navigation icons live under
`assets/icons/nav-*.png` and automatically use the same asset-override system.
The 40 runtime fighter portraits use transparent `fighter-avatar-01.png`
through `fighter-avatar-40.png` assets. Replaceable icons and
standalone opponent silhouettes in the
[GitHub assets folder](https://github.com/jayjonesvip/cage-warrior/tree/main/assets)
are source copies of the visual artwork. Regression tests live under `tests/` and
cover script parsing plus behavioral save recovery and migration, resource
clamping, fight booking and payouts, rematches, opponent availability, training,
recovery options, blackjack rules and wager limits,
gear pity, endorsements, daily resets, roster rules, readable text sizing,
equipment drops, reward reveals, and the Cash/Career Earnings economy.

## Deployment, search, and installation

`cagegrind.com` is the canonical public URL. The repository includes the Pages
`CNAME`, canonical and social-sharing metadata, structured game and site data,
`robots.txt`, `sitemap.xml`, and a 1200×630 social card. DNS still has to point
the apex domain to GitHub Pages at the registrar; `onlinecagefighting.com`
should redirect to the canonical URL rather than serve a second copy.

`manifest.webmanifest` and the branded 192px/512px icons make the game
installable on supporting browsers. Transparent icons are used for the normal
install artwork, while the separate maskable icon intentionally has an opaque
safe-zone background for launchers that crop icons into platform shapes.
After career setup, Home presents an install offer until installation succeeds.
Chromium browsers use the native install prompt; iPhone and iPad players are
directed to Share → Add to Home Screen. A successful `appinstalled` event or a
verified standalone launch grants exactly one deterministic collectible drop,
then permanently hides the offer for that saved career.

`service-worker.js` caches the core shell and previously visited same-origin
assets for offline fallback. `pwa.js` checks uncached `app-version.json` on
startup, when the app returns to the foreground, and when connectivity returns.
If a newer semantic version is deployed, the game opens a styled update dialog;
updating reloads code without modifying the career save. For each release, keep
the versions in `package.json`, the `app-version` meta tag, `app-version.json`,
and `service-worker.js` synchronized. Tests enforce that contract.

### Supabase Cage Feed setup

Low-level Supabase authentication, session recovery, REST, and RPC calls live in
`supabase-client.js`; Cage Feed-specific queries live in `cage-social.js`.
Both remain dependency-free browser scripts. Apply the SQL files in
`supabase/migrations/` in filename order using the Supabase SQL Editor (or the
Supabase CLI). The avatar migration adds each career portrait to its public
profile; existing fighters populate it automatically on their next Feed visit.
The profile-count migration supplies the exact shared-roster Following count.
The opponent-candidate migration supplies authenticated, exact-level profiles
updated within the last 30 days for local AI snapshots; the game falls back to
its generated roster if the RPC or network is unavailable. In the Supabase
identity migration, `cage_name_registry` permanently reserves unique names,
removes duplicate public name fields, excludes retired profiles from active
counts and opponents, and adds the retirement announcement RPC. In the Supabase
Dashboard, enable **Authentication → Providers → Anonymous Sign-Ins**. The
migration enables Row Level Security, permits authenticated reads, and restricts
profile and post creation to validated RPC functions. Never place a secret or
`service_role` key in this repository—the checked-in `sb_publishable_` key is
the intentionally public browser key.

## Analytics

Google Analytics 4 measurement ID `G-LMT6RLVT5L` is loaded from the page head.
`analytics.js` validates event and parameter names, strips unsupported values,
limits string lengths, and treats analytics failures as non-fatal so tracking
can never interrupt gameplay. The initial event set covers career setup and
starts, screen navigation, training and recovery, hustles and publicity,
endorsements, Cage Feed activity, daily rewards, blackjack, underground
sparring, matchup and fight decisions, fight results, titles, level-ups, gear
drops, and equipment changes. Events include gameplay categories and numeric
outcomes but never fighter names, opponent names, social post copy, or saved
career data.

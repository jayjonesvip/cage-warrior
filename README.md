# Cage Grind

[![pages-build-deployment](https://github.com/jayjonesvip/cage-warrior/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/jayjonesvip/cage-warrior/actions/workflows/pages/pages-build-deployment)

[Play Cage Grind](https://cagegrind.com/)

Cage Grind is a mobile-first, single-player combat-career game. Open
`index.html` directly in a modern browser; no build step or server is required.
The page uses ordinary, ordered scripts with no bundler. Shared presentation
lives in `css/styles.css`; the landing screen has its own `css/landing.css` and
`js/landing.js`; fight planning and fight-focus flows live in `js/fight-plan.js`
and `js/fight-focus.js`; and `js/game.js` coordinates those features with the career.

### Landing page

- Every browser visit opens on a branded, responsive Cage Grind front door
  before revealing the game interface.
- A completed local career receives a personalized **Welcome Back** message,
  current level, record, Followers, and a **Continue Career** action. A partially
  completed fighter receives **Continue Your Build** instead of being mistaken
  for a new or finished career.
- New players see **Build Your MMA Fighter. Become World Champion.** and the
  **Play Free Now** action without a simulated fighter card that could be
  mistaken for live gameplay. Choosing an entry action never resets or replaces
  the recovered local save.
- A non-blocking World Championship panel uses the shared championship client
  to show the current handle and successful defenses. Loading, vacant, and
  offline states use quiet fallbacks; none can disable or delay career entry.
- New-player landing pages scroll to three game-styled feature cards covering
  fighter creation, fight planning, and the shared title chase. On phones, the
  headline, entry action, automatic-save message, and championship proof remain
  near the top, while returning careers and unfinished builds keep their
  personalized copy and recovery actions.
- `landing_view` and `landing_enter` remain the primary funnel events.
  `landing_feature_view` records only when a new player actually reaches the
  feature-card section.

### Responsive desktop interface

- Phone and installed-mobile layouts remain unchanged below 1100px.
- At desktop widths, navigation becomes a persistent left rail, the fighter
  HUD becomes a single horizontal command bar, and the playable area expands
  to a 1440px maximum workspace.
- Home uses a split career dashboard, Training and Hustle use two-column
  workspaces, opponents and gear render four across, and Cage Feed receives a
  wider reading column.
- Fight Night keeps the same planned simulation, with a wider live timeline on
  desktop after the locker-room plan is locked.
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
  Finally, choose one of two permanent MMA archetypes: **Striker** for stand-up
  offense and knockout pressure, or **Grappler** for takedowns, control, and
  submissions. The last step suggests a fighter identity
  from shared color and weather/dangerous-animal pools, followed by the hometown
  abbreviation. **Shuffle** rerolls it, while **Manual Entry** opens the name card
  as a text field for a custom single-word handle. **Ready** checks the global
  roster, permanently reserves the unique identity, and starts the career.
- Every avatar has a unique base allocation across Power, Speed, Chin, and
  Cardio. Each value is a whole number from 2 through 8 and the four values
  always total exactly 20. The game validates that allocation before locking
  the fighter in.
- Each selector disappears as soon as its choice is locked. Career systems,
  the HUD, and navigation remain hidden until hometown, fighter, archetype, and
  permanent fighter name are complete. The Career Identity card keeps the hometown and archetype
  beside Followers, career earnings, and the live World Championship status; the selected
  avatar remains visible in the Home hero without a duplicate identity row.
  The fighter name is also the Cage Feed username and cannot be edited after
  **Ready**. New names use CapitalCase without a numeric suffix, such as
  `WhiteDrizzlePHX`, `GoldenTornadoNYC`, or `BlueViperCLE`. Manual handles are
  3–32 characters, start with a letter, and use only letters, numbers, or an
  underscore. Every hometown uses
  the same 76 opening words (colors, former wildcard modifiers, and 24
  nationality/origin terms), plus 23 weather/force, 35 animal, and 28 combat
  terms. Exact repeated words are excluded, producing 6,534 combinations per
  city and 65,340 across all ten
  hometowns. City endings are PHX, LAX, CHI,
  NYC, MIA, HOU, CLE, SEA, NOLA, and HNL.
- Home includes a deliberately red **Retire Fighter** action. Its confirmation
  warns that the local career, record, Cash, gear, and progress will be lost.
  CageReporter publishes the retirement, the name remains permanently reserved,
  and the game returns to the first fighter-creation step. Historical title
  results remain in the public record, while the newly claimed fighter starts
  with fresh title-shot eligibility against the current champion. If the public
  retirement cannot be recorded, the local career is kept safe.
- Home presents Hit the Gym, Take a Fight, Hustle, and Gear as illustrated
  choice cards. The cards explain each career path while distinct bottom
  buttons perform the actual navigation, so every action remains visually
  obvious. Enabled primary actions use consistent blue fills and bold white
  labels; secondary controls use slate, special opportunities use amber, and
  disabled or locked controls remain visibly subdued.
- `Make Ends Meet` side jobs are early-career work only. At Level 5 the section
  is replaced by a full-time fighter milestone note, while publicity,
  endorsements, and Underground Buzz remain available.
- Underground Buzz previews its locked games as future opportunities. Backroom
  Blackjack unlocks at Level 2, and Cage Dice unlocks at Level 4 with one daily
  roll on under seven, over seven, exactly seven, or doubles. Both games cap a
  wager at 25% of available Cash. Cage Dice uses `assets/cage-dice.jpg`, with a
  built-in dice fallback if the artwork cannot load.
- Fighter selection places each transparent portrait over a blue arena-light
  gradient, with a brighter keyboard-focus and hover treatment around the card.
- The Home hero shows a championship-aware career rank. Levels 1–2 are Rookie;
  Level 3+ is Prospect until the fighter reaches the reigning champion's level,
  when the rank becomes Title Contender. World Champion and Former World
  Champion override those progression ranks for the current career.
- An active endorsement appears in the Home hero directly beneath Cage Status,
  showing the sponsor brand and the number of contracted fights remaining.
- Endorsements form a sequential sponsor ladder beginning with Bob's Auto Shop
  at Level 2, followed by larger brands at 2,500, 10,000, 30,000, 80,000, and
  200,000 Followers. Only the next brand may offer a contract, so crossing
  several milestones at once never produces competing offers. Older saves
  repair incomplete sponsor history before rendering or accepting deals.
- A rotating promoter ticker leads the unlocked Home screen and teaches the
  active rules—fight costs, medical clearance, purses, rematches, tactics,
  drops, fight planning, and titles—in the voice of a suspiciously well-informed
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
- Every generated opponent uses the same Striker-or-Grappler system. Their card,
  tale of the tape, attributes, scouting report, and in-fight behavior all
  reflect that archetype.
- Every booked fight begins with a locker-room **Fight Plan**. Players set a
  **Slow** or **Fast** pace, choose **Conservative** or **Aggressive** offense,
  and decide whether to **Stick to Style** or **Adapt**. The last locked-in
  combination is saved and preselected for the next fight.
- Slow pace creates fewer exchanges and reduces accumulated cardio fatigue.
  Fast pace creates more exchanges and gains initiative when the fighter has
  both strong cardio and a cardio edge, but magnifies fatigue when that edge is
  missing. Conservative offense favors jabs, accuracy, and defense at the cost
  of damage and knockdowns; Aggressive offense favors power shots and finish
  attempts while sacrificing accuracy and creating counter opportunities.
- Stick to Style uses the permanent signature archetype and its full
  familiarity throughout the bout. Adapt starts in the signature style, makes
  a partial matchup adjustment in Round 2, and uses the full response plan in
  Round 3. High Focus improves the execution of those switches while low Focus
  can turn adaptation into hesitation. The fight then runs as one uninterrupted
  full simulation, with no coach fee or routine mid-fight decision prompts.
- Every booked fight generates a fight-only **Focus** rating from 75–90%. Half
  of walkouts receive an unread text from Mom, the fighter's wife, brother
  Tommy, Agent Carl, or Grandma. Reading it reveals one of 50 messages with a meaningful boost or distraction; ignoring
  it leaves the message hidden and applies a smaller known Focus cost. The
  other half offer quiet preparation: music gains 4–10 Focus with a 20% chance
  to reach 100%, while meditation reliably raises Focus to at least 92%.
  Focus is capped at 50–100% and affects initiative, strike execution, and the
  quality of adaptive game-plan changes for that fight only. The Focus screen
  reuses the full-bleed fight-plan locker room and shows the percentage in the
  final-moments label instead of a separate meter.
- Mom and Wife each have 16 possible texts, Tommy has 10, and Carl and Grandma
  have 4 each; every contact's pool is evenly split between positive and
  negative outcomes. Messages come from a shuffled, saved 50-card deck, so
  every text appears once before any repeats, including after a reload.
- Grapplers can finish a fight by tap after a successful takedown. Speed,
  cardio, opponent condition, and signature-plan proficiency affect the
  submission chance.
- Persistent Health determines starting fight Condition. Fighters at 90% or
  better Health enter at 100% Condition; 70–89% enters at 95%, 50–69% at 88%,
  and 20–49% at 78%. Below 20 Health still fails medical clearance, making a
  quick turnaround while hurt possible but meaningfully dangerous.
- Each confirmed opponent strike or takedown directly removes 1 persistent
  Health while its existing fight damage continues to reduce Condition. A
  knockdown removes 4 Health, then a losing KO/TKO removes 12 additional
  Health or a losing submission removes 8. Misses, movement, and defensive
  narration remove no Health. The live deductions are saved immediately and
  the result screen reports the total fight damage.
- Major incoming damage (4 or more persistent Health) triggers a brief,
  stylized blood-sport particle burst over the live fight. Routine shots do not.
- Fight energy scales with the player's current career level: Levels 1–2 cost
  6 energy per started round, Levels 3–4 cost 7, Levels 5–6 cost 8, Levels
  7–8 cost 9, and Level 9 onward costs 10. Three-round clearance therefore
  ranges from 18 to 30 energy. Only rounds that actually begin are charged.
- Fighters can complete up to 10 fights per local calendar day. The Fight page
  shows the remaining bouts and a live countdown to the local-midnight reset;
  energy and medical clearance remain the primary pacing limits.
- Watch fights normally or use 2× speed. There is no result skip and no routine
  interruption once the cage door closes. Each round-number interlude remains
  visible for two seconds; before Rounds 2 and 3 it carries the cumulative
  unofficial score and whether the fighter leads, trails, or is even.
- Fight results lead with a large **YOU WIN** or red **YOU LOST** outcome, then
  show the finish method, round, and clock beneath it before the full scorecard.
- Build win streaks and earn upset and rivalry bonuses. Streaks of two or more
  become notable Cage Feed headlines after every additional win.
- Cage Grind has one shared World Championship held only by an active ranked
  profile. A fighter may challenge once their level reaches or exceeds the
  champion's level.
- The Fight page starts with a dedicated World Championship section. Reach the
  champion's level to earn one title shot per UTC day. A dethroned champion gets
  one level-override **Title Rematch** against the fighter who took the belt;
  after that attempt, win or lose, the normal contender rules apply. Champions
  receive one deterministic active ranked challenger and may defend once per
  UTC day. Regular ranked fights are separate and never put the belt at risk.
  Retiring and claiming a new fighter preserves old results and title history
  while starting a new career-history window.
- Generated progression continues beyond level 15.
- Level-ups trigger a dedicated promotion celebration showing the new level
  and rank, cumulative max-energy and max-health gains, partial recovery,
  career bonus, and newly available competition. Every level restores up to 30
  energy and 25 health. Celebration effects share one bounded canvas loop,
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
  live count of ranked fighter profiles in the shared Cage Feed roster.
- The timeline owns the Feed explanation and scrolls inside its own card.
  Generic composer controls are removed; interaction begins by tapping a real
  fighter's avatar and opening their public profile. Feed and fighter-profile
  copy uses a larger mobile text scale for easier reading.
- Fights, win streaks, losses, appearances, autograph signings, and sponsor
  deals generate contextual `CageReporter` coverage. Wins earned while carrying
  a training injury receive dedicated headlines questioning whether fighting
  hurt was courageous, reckless, or both. The global feed emphasizes
  ranked fighters' canned posts instead of filling the timeline with fake fans.
- The verified `@CageGrindCEO` account uses the CEO's office portrait and a
  distinct black-and-gold treatment. Server-authored CEO posts recognize a new
  career and the first exceptional performance bonus without allowing arbitrary
  client-authored CEO copy. Championship transfers and defenses are announced
  only by the database-owned global belt workflow.
- Tapping the CEO portrait opens his verified public profile with his executive
  bio. The official account does not accept fighter-message interactions.
- Every sanctioned title shot receives an official CEO announcement. Outside
  the championship picture, only qualifying upsets and knockout finishes have
  a deterministic 10% chance at one modest CEO cash and Hype bonus per local day.
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
  offline. Fighting one never changes the ranked fighter's public record, never
  creates a misleading shared CageReporter result, and can never award a title.
- A Cage Network card uses the fighter's stored city or identity suffix to show
  where they fight out of, their region, and the available purse. A fighter with
  no prior player matchup is labeled **First Meeting** instead of showing an
  empty head-to-head message.
- Opponent style is always visible on roster cards, the Tale of the Tape,
  locker-room Fight Plan, and live fight header so players can make an informed
  tactical choice before the opening bell.
- The current level always replenishes to three fresh contenders, so the fight
  path cannot run dry before a level-up. Fresh current-level fights pay a full
  purse; past-level fights and rival fights pay half purse.
- Any available opponent who has beaten the player carries a bright horizontal
  **Rival Fight** banner across the lower part of their fighter image and remains
  immediately available.
- Regular opponents never retire. Every defeated fighter persists in the
  **Past Rivals** collection. A free taunt guarantees that rival
  accepts one more fight; the bout uses the player's current level-based round
  cost, pays half purse, and retains full fight XP. Winning closes the offer
  until another taunt, while losing keeps **Run It Back** immediately available.
- The Career Opponents roster shows available current and past opponents and
  rivals. Championship bouts never appear inside this roster. Fighters are presented as fixed-ratio
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
  spends no energy and explains the current level-based clearance and round
  cost directly beneath the purse. It then offers **Go Back** or **Set Fight
  Plan**; the first round's energy is charged only after the fight is booked.
- When the ten-fight daily allowance is exhausted, otherwise available fighter
  cards take on the locked presentation and replace **See Matchup** with
  **Daily Limit Reached — New Fights at Local Midnight** until the reset.
- The shared champion is rendered from the authenticated Supabase profile and
  is never generated or stored in the local career save. The dedicated card
  shows champion identity, record, level, defenses, player status, and one clear
  action or requirement. A champion sees one server-selected ranked challenger.
  A fighter who loses the belt while away receives a one-time title-loss notice
  naming the new champion and the next rematch date. The Tale
  of the Tape uses a dedicated **World Championship Bout** banner
  for championship matchups and compares Power, Speed, Chin, and Cardio with
  proportional meters; the stronger side of each attribute is highlighted in
  green and ties use a neutral gold treatment.
- Daily Contracts and the seeded Daily Challenge are currently removed. The
  guaranteed Daily Drop remains available and may be expanded later.

### Collectible drops

- Fight-win collectibles arrive as gifts from the CEO after the player catches
  his attention. Daily and install drops remain separately branded rewards;
  equipment is never purchased.
- The home-screen Daily Drop awards Cash, energy, and one deterministic,
  level-eligible collectible every day. It does not reset fight-drop pity.
- Collectible card artwork is emphasized within the fixed two-column card
  layout, while the Daily Drop uses the same high-contrast label treatment as
  other primary actions.
- A win has a 33% base chance to earn a CEO gift. Upsets, rivalries, and KO/TKO
  finishes improve the chance, up to 75%.
- The fourth win without a CEO gift guarantees one. Winning a title guarantees
  a specially labeled CEO title gift of at least Rare quality.
- Minimum level controls when an item enters the permanent pool. Earlier items
  remain eligible at higher levels.
- Duplicate copies increase the collectible quantity but never stack the
  item's perk.
- Drop reveals validate their reward data before rendering. If a stale item or
  a device-specific celebration effect fails, the awarded collectible remains
  saved and the result dialog recovers instead of blocking the career.
- Owned items appear as fixed 2:3 collectible cards, two across on mobile,
  with full-card Common, Rare, Epic, and Legendary treatments.
- Fight Gear starts with a two-slot active loadout and expands to four slots at
  Level 8. Attempting to exceed the current limit opens a focused Loadout Full
  dialog explaining the limit and unlock. Bling, Lifestyle, Property, and Rides
  provide passive career bonuses.
- The collectible pool also includes early-career and status drops such as a
  used car, small-batch bourbon, a small gym dog, Cuban cigars, fresh tennis
  shoes, a full-length fur coat, motorcycles, a scooter, camp food and
  supplements, a flagship phone, a diamond grill, and a concert grand piano.
  Small Gym Dog is a separate Common card from the existing Rare Gym Dog.
  Collectibles support same-name PNG artwork in `assets/icons/` through their
  stable item IDs.

### Economy and training

- **Cash** is the spendable balance shown in the header.
- New careers begin with $0 Cash. Early training upgrades must be earned through
  fight purses, side shifts, and the first small sponsorship instead of being
  affordable immediately.
- **Career Earnings** is a permanent prestige total. Professional fight pay,
  career bonuses, sponsors, and appearances increase both values.
- Side jobs, underground winnings, and daily cash increase Cash without
  inflating Career Earnings.
- Underground Buzz offers Backroom Blackjack as a once-per-local-day game.
  The player chooses a whole-dollar wager up
  to 25% of available Cash, then plays a persisted hand with Hit or Stand.
  Dealer stands on all 17s, natural blackjack pays 3:2, and pushes return the
  wager. There are no splits, doubles, or insurance.
- Basic training costs energy and allows four daily sessions. Sparring is a
  separate two-session daily track: Light Sparring costs 10 energy and improves
  one random skill without health damage, while Heavy Sparring costs 20 energy,
  improves two random skills, and risks 3–9 health.
- Training gains are whole points. Every gym or sparring session begins a
  one-minute recovery cooldown. Training again before the timer ends extends it
  by another minute and triggers a hidden injury roll. Knee, shoulder, elbow,
  rib, ankle, back, hand, and neck injuries reduce all four effective attributes
  by 10% or at least one point, whichever is greater. Injuries clear at the
  player's next local midnight and never carry into a new day. While injured,
  all gym and sparring actions are locked; recovery, hustles, and fights remain
  available, and fights use the reduced attributes.
- Coach Vega is an optional training upgrade that adds skill gain, XP, and a
  better perfect-session chance. His fee is `$250 + ($75 × fighter level)` per
  session, including each Light or Heavy Sparring session.
- The Training page also has a Recovery Room with one paid treatment
  opportunity. Every completed fight makes one treatment available; unused
  opportunities never accumulate. An Ice Bath restores 25 energy, a Sauna
  restores 15 energy and 12 health, and a Sports Massage restores 5 energy and
  25 health. Standard treatment costs `$40 + ($15 × fighter level)`. Premium
  Cryotherapy restores 20 energy and 35 health for
  `$250 + ($25 × fighter level)`. Treatments never exceed resource maximums
  and do not consume a training session.
- Live countdowns on the Training and Hustle pages show the time remaining
  until their daily limits reset at the player's next local midnight.

### Persistence

Progress is stored locally in the browser with `localStorage`. Save migration
preserves existing fighters, hometown identity, avatar and base allocation,
generated rosters, rivalries, collections, loadouts, Cash, and
Career Earnings. An in-progress blackjack hand is also persisted so a refresh
cannot consume the wager without allowing the player to finish. Legacy
Pressure Fighter, Counter-Striker, Brawler, Trickster, Technician, and
Endurance identities map to Striker. Control Grappler, Submission Hunter,
Wrestle-Boxer, and older wrestling identities map to Grappler. Old opponent
tendencies migrate without losing records or rivalries, and previously retired
regular fighters return to the permanent Past Rivals system. Legacy local title
progress and generated champions are removed because the shared database owns
the only World Championship. The game also keeps
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

The game uses static HTML, CSS, and ordinary scripts without a build step.
`js/game-logic.js` contains shared rule helpers used by the browser and behavioral
tests. `js/game.js` remains the coordinator; `js/landing.js`, `js/fight-plan.js`, and
`js/fight-focus.js` own their feature flows and receive state/UI callbacks from the
coordinator. `js/fight-focus-contacts.js` owns the locker-room contact and message
data, while `js/strings.js` groups the remaining opponent, commentary, Cage Feed,
username, and ticker copy. Script order in `index.html` and the service-worker
precache list must keep data and feature modules ahead of `js/game.js`.
The generated transparent header wordmark lives at
`assets/cage-grind-logo.png`. The six bottom-navigation icons live under
`assets/icons/nav-*.png` and automatically use the same asset-override system.
The 40 runtime fighter portraits use transparent `fighter-avatar-01.png`
through `fighter-avatar-40.png` assets. Replaceable icons and
standalone opponent silhouettes in the
[GitHub assets folder](https://github.com/jayjonesvip/cage-warrior/tree/main/assets)
are source copies of the visual artwork. Regression tests live under `tests/` and
cover script parsing plus behavioral save recovery and migration, resource
clamping, fight booking and payouts, rival fights, championship states and settlement, opponent availability, training,
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
assets for offline fallback. `js/pwa.js` checks uncached `app-version.json` on
startup, when the app returns to the foreground, and when connectivity returns.
If a newer semantic version is deployed, the game opens a styled update dialog;
updating reloads code without modifying the career save. For each release, keep
the versions in `package.json`, the `app-version` meta tag, `app-version.json`,
and `service-worker.js` synchronized. Tests enforce that contract.

### Supabase Cage Feed setup

Low-level Supabase authentication, session recovery, REST, and RPC calls live in
`js/supabase-client.js`; Cage Feed-specific queries live in `js/cage-social.js`.
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
`js/analytics.js` validates event and parameter names, strips unsupported values,
limits string lengths, and treats analytics failures as non-fatal so tracking
can never interrupt gameplay. The initial event set covers career setup and
starts, screen navigation, training and recovery, hustles and publicity,
endorsements, Cage Feed activity, daily rewards, blackjack, underground
sparring, matchup and fight-plan decisions, fight results, titles, level-ups, gear
drops, and equipment changes. Events include gameplay categories and numeric
outcomes but never fighter names, opponent names, social post copy, or saved
career data.

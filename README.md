# Cage Grind

[![pages-build-deployment](https://github.com/jayjonesvip/cage-warrior/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/jayjonesvip/cage-warrior/actions/workflows/pages/pages-build-deployment)

Cage Grind is a mobile-first, single-player combat-career game. Open
`index.html` directly in a modern browser; no build step or server is required.
The page loads its presentation from `styles.css`, scalable copy pools from
`strings.js`, testable gameplay rules from `game-logic.js`, and browser
interactions from `game.js`.

## Current game

Build a fighter from unknown rookie to champion through tactical fights,
training, side jobs, publicity, sponsors, equipment drops, and a persistent
generated league.

### Fighting and progression

- New careers complete three permanent Home-screen choices in order. First,
  choose a "Fighting Out Of" hometown: Phoenix, Los Angeles, Chicago, New York,
  Miami, Houston, or Cleveland. Next, choose one of 20 fighter avatar cards.
  Finally, choose one of seven permanent MMA archetypes: Pressure Fighter,
  Counter-Striker, Brawler, Trickster / Unorthodox, Control Grappler,
  Submission Hunter, or Wrestle-Boxer.
- Every avatar has a unique base allocation across Power, Speed, Chin, and
  Cardio. Each value is a whole number from 2 through 8 and the four values
  always total exactly 20. The game validates that allocation before locking
  the fighter in.
- Each selector disappears as soon as its choice is locked. Career systems,
  the HUD, and navigation remain hidden until hometown, fighter, and archetype
  are complete. All three choices then live in the Career Identity card beside
  Followers, career earnings, and the next milestone. A pencil beside the
  top-bar fighter name remains visibly locked for rookies; its naming modal
  unlocks at level 2 with Club Fighter status.
- Home presents Take a Fight, Hit the Gym, Hustle, and Gear as illustrated
  choice cards. The cards explain each career path while distinct bottom
  buttons perform the actual navigation, so every action remains visually
  obvious.
- An active endorsement appears in the Home hero directly beneath Cage Rank,
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
- XP sits beneath level and rank in the top-left identity block, while Hype
  sits beneath Cash and Followers on the right. The redundant Home resource
  card is removed.
- Followers are the fighter's lasting social audience, while Hype represents
  short-term attention. Cage Feed actions can build both, while a failed rival
  callout can cost Hype.
- Every generated opponent uses the same seven-archetype system. Their card,
  tale of the tape, attributes, scouting report, and in-fight behavior all
  reflect that archetype.
- Round 1 starts with a one-time opening choice. **Aggressive** immediately
  imposes your permanent signature style and gains initiative. **Feel Them
  Out** uses that same signature discipline more cautiously, conceding some
  early initiative in exchange for a deeper corner read. Either choice reveals
  the opponent's basic tendency after Round 1.
- Round 2 is a **Style Decision** and the final round asks the player to
  **Make Your Call**. The grounded tactical choices are **Fight Your Way** with
  the signature style or **Adapt To** the opponent's revealed archetype. Style
  descriptions and warnings sit above stacked blue and slate-grey buttons.
  Fighting outside your discipline carries a real penalty. When both fighters
  share an archetype, the duplicate choice collapses into one **Fight Your
  Way** action. The corner-call surface snaps directly to the live fight card
  edges.
- Submission Hunters can finish a fight by tap after a successful takedown.
  Speed, cardio, opponent condition, and signature-plan proficiency affect the
  submission chance.
- When condition falls to 25% or lower between rounds, the corner presents a
  one-time crisis choice. Throwing in the towel gives the opponent a TKO win;
  throwing a last-chance haymaker can swing or finish the fight, but missing it
  results in an immediate knockout loss. A haymaker costs 5 additional energy
  beyond the energy reserved for any rounds still to come.
- Three-round fight clearance requires 30 energy. The game charges 10 energy
  only when each round actually begins, so a first-round finish costs 10, a
  second-round finish costs 20, and a fight that reaches Round 3 costs 30.
- If the player's corner has them behind on the unofficial scorecards with ten
  seconds left in Round 3, the action pauses for one last decision: stay
  disciplined or spend 5 additional energy on a haymaker. Landing can score a
  dramatic knockdown, steal the decision, or produce a last-second knockout;
  missing leaves the fighter open to an immediate counter knockout.
- Watch fights normally or use 2× speed. There is no result skip: every
  surviving round requires its corner decision.
- Build win streaks and earn upset and rivalry bonuses. Streaks of two or more
  become notable Cage Feed headlines after every additional win.
- Progress through a hometown title, its regional title, the U.S. Title, and
  the World Title. Reaching a championship threshold only unlocks its reigning
  champion; the belt is awarded only after that fighter is defeated.
- Generated progression continues beyond level 15.
- Level-ups trigger a dedicated promotion celebration showing the new level
  and rank, cumulative max-energy and max-health gains, full restoration,
  career bonus, and any newly unlocked title challenge.

### Cage Feed

- A fighter has no social account and earns no Followers until Cage Feed is
  opened for the first time. That first visit creates the account, publishes a
  "Hello, fight fans" introduction, and draws the first reactions and Followers.
  Existing saved careers that already have Followers are treated as connected
  accounts and keep their audience.
- Cage Feed has its own bottom-navigation icon. New timeline entries add a
  numbered red unread badge, and opening the Feed marks the visible posts read.
- The timeline owns the Feed explanation and scrolls inside its own card. The
  player-post controls sit in a detached action dock pinned to the bottom of
  the Feed page and snapped flush to its side and bottom edges.
- Fights, win streaks, losses, appearances, autograph signings, and sponsor
  deals generate contextual posts from reporters, promoters, gyms, rivals,
  fans, and haters. Ordinary accounts use generated-style names such as
  `FightFan99`, `MMA4Life`, and `ScorecardBandit`.
- Each notable event starts a news cycle with one player post available. The
  player may thank Followers for safe growth, post a volatile rival callout
  that can unlock a rematch, or publish an Influencer Brand Post for Cash and
  Followers. There is only one player post per news cycle, and publishing
  scrolls the timeline to the new post at the top.
- Rival Callout and Influencer Brand Post live in Cage Feed rather than the
  Underground Buzz or Career Spotlight lists.

### Career opponents

- Opponents are generated locally with persistent names drawn from a broad
  international pool, plus attributes, archetypes, professional records, and
  head-to-head history.
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
  accepts one more fight; the bout uses the normal 10-energy-per-started-round
  cost, pays half purse, and retains full fight XP. Winning closes the offer
  until another taunt, while losing keeps the rematch immediately available.
- The Career Opponents roster shows available current and past opponents, past
  rivals, former champions, and a locked preview of the next level. The
  current-level group starts open; all other groups start
  collapsed behind tappable headers with fighter counts. Fighters are presented as fixed-ratio
  collectible-style cards, two across on mobile, with proportional artwork
  selected deterministically from 14 standalone transparent fighter
  silhouettes. Bright accent spotlights and subtle rim lighting keep the black
  silhouettes readable against every roster status and Tale of the Tape card.
  The front stays focused on identity and booking; tapping the card body flips
  it to a fixed-height details side with attributes, rating, availability,
  purse context, rivalry status, and head-to-head history. See Matchup remains
  a separate action and does not trigger the flip.
- An available opponent's **See Matchup** button opens a reversible Tale of the
  Tape preview without displaying the purse on the roster action. The preview
  spends no energy and explains the 30-energy clearance, 10-energy round cost,
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
- A win has a 25% base drop chance. Upsets, rivalries, and KO/TKO finishes
  improve the chance, up to 75%.
- The fourth win without a drop guarantees one. Winning a title guarantees a
  drop of at least Rare quality.
- Minimum level controls when an item enters the permanent pool. Earlier items
  remain eligible at higher levels.
- Duplicate copies increase the collectible quantity but never stack the
  item's perk.
- Owned items appear as fixed 2:3 collectible cards, two across on mobile,
  with full-card Common, Rare, Epic, and Legendary treatments.
- Fight Gear uses a four-slot active loadout. Attempting to equip a fifth item
  opens a focused Loadout Full dialog explaining that an equipped item must be
  removed first. Bling, Lifestyle, Property, and Rides provide passive career
  bonuses.
- The collectible pool also includes early-career and status drops such as a
  used car, small-batch bourbon, a small gym dog, Cuban cigars, fresh tennis
  shoes, and a full-length fur coat. Each supports an optional same-name PNG
  override in `assets/` through its stable item ID.

### Economy and training

- **Cash** is the spendable balance shown in the header.
- **Career Earnings** is a permanent prestige total. Professional fight pay,
  career bonuses, sponsors, and appearances increase both values.
- Side jobs, underground winnings, and daily cash increase Cash without
  inflating Career Earnings.
- Basic training costs energy and daily sessions, not Cash.
- Coach Vega is an optional training upgrade that adds skill gain, XP, and a
  better perfect-session chance. His fee is `$35 + ($20 × fighter level)` per
  session; two-session sparring pays twice the fee.
- The Training page also has a Recovery Room with one paid treatment per local
  day. An Ice Bath restores 25 energy. A Sauna restores 15 energy and 12 health.
  Treatment costs `$40 + ($15 × fighter level)`, never exceeds the resource
  maximums, and does not consume a training session.
- Live countdowns on the Training and Hustle pages show the time remaining
  until their daily limits reset at the player's next local midnight.

### Persistence

Progress is stored locally in the browser with `localStorage`. Save migration
preserves existing fighters, hometown identity, avatar and base allocation,
generated rosters, rivalries, collections, loadouts, championships, Cash, and
Career Earnings. Legacy Technician, Grappler, and Endurance identities map to
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

The game uses `index.html`, `styles.css`, `game-logic.js`, `strings.js`, and
`game.js` without a build step. `game-logic.js` contains the small shared rule
helpers used by both the browser and behavioral tests. `strings.js` groups
opponent names, fight commentary, Cage Feed
copy, generated social usernames, and promoter ticker lines so new variations
can be added without editing simulation logic.
The generated transparent header wordmark lives at
`assets/cage-grind-logo.png`. The six bottom-navigation icons live under
`assets/icons/nav-*.png` and automatically use the same asset-override system.
Fighter portraits, replaceable icons, and
standalone opponent silhouettes in the
[GitHub assets folder](https://github.com/jayjonesvip/cage-warrior/tree/main/assets)
are source copies of the visual artwork. Regression tests live under `tests/` and
cover script parsing plus behavioral save recovery and migration, resource
clamping, fight booking and payouts, rematches, opponent availability, training,
gear pity, endorsements, daily resets, roster rules, readable text sizing,
equipment drops, reward reveals, and the Cash/Career Earnings economy.

# Cage Warrior

[![pages-build-deployment](https://github.com/jayjonesvip/cage-warrior/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/jayjonesvip/cage-warrior/actions/workflows/pages/pages-build-deployment)

Cage Warrior is a mobile-first, single-player fight-career game. Open
`index.html` directly in a modern browser; no build step or server is required.

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
  are complete. All three choices then live in the Career Identity card.
- The persistent top HUD keeps all four fighter attributes in one compact row
  directly beneath energy and health across every unlocked game screen.
- XP sits beneath level and rank in the top-left identity block, while Hype
  sits beneath Cash and Fans on the right. The redundant Home resource card is
  removed.
- Every generated opponent uses the same seven-archetype system. Their card,
  tale of the tape, attributes, scouting report, and in-fight behavior all
  reflect that archetype.
- Round 1 starts with a one-time opening choice. **Aggressive** immediately
  imposes your permanent signature style and gains initiative. **Feel Them
  Out** uses that same signature discipline more cautiously, conceding some
  early initiative in exchange for a deeper corner read. Either choice reveals
  the opponent's basic tendency after Round 1.
- Before Rounds 2 and 3, the corner offers only grounded tactical choices:
  stay with your signature style or challenge the opponent in their revealed
  style. Style descriptions and tactical warnings sit above simple, stacked
  action buttons. Fighting outside your own discipline carries a real penalty.
  When both fighters share an archetype, the duplicate choice collapses into
  one **Start Round** action.
- Submission Hunters can finish a fight by tap after a successful takedown.
  Speed, cardio, opponent condition, and signature-plan proficiency affect the
  submission chance.
- When condition falls to 25% or lower between rounds, the corner presents a
  one-time crisis choice. Throwing in the towel gives the opponent a TKO win;
  throwing a last-chance haymaker can swing or finish the fight, but missing it
  results in an immediate knockout loss.
- Watch fights normally or use 2× speed. There is no result skip: every
  surviving round requires its corner decision.
- Build win streaks and earn upset and rivalry bonuses.
- Progress through a hometown title, its regional title, the U.S. Title, and
  the World Title. Reaching a championship threshold only unlocks its reigning
  champion; the belt is awarded only after that fighter is defeated.
- Generated progression continues beyond level 15.
- Level-ups trigger a dedicated promotion celebration showing the new level
  and rank, cumulative max-energy and max-health gains, full restoration,
  career bonus, and any newly unlocked title challenge.

### Career opponents

- Opponents are generated locally with persistent names, attributes,
  archetypes, professional records, and head-to-head history.
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
  accepts one more fight; the bout costs the normal 15 energy, pays half purse,
  and retains full fight XP. Winning closes the offer until another taunt, while
  losing keeps the rematch immediately available.
- The Career Opponents roster shows available current and past opponents, past
  rivals, former champions, and a locked preview of the next level. The
  current-level group starts open; all other groups start
  collapsed behind tappable headers with fighter counts. Fighters are presented as fixed-ratio
  collectible-style cards, two across on mobile, with proportional artwork
  selected deterministically from 14 standalone transparent fighter
  silhouettes.
  The front stays focused on identity and booking; tapping the card body flips
  it to a fixed-height details side with attributes, rating, availability,
  purse context, rivalry status, and head-to-head history. See Matchup remains
  a separate action and does not trigger the flip.
- An available opponent's **See Matchup** button opens a reversible Tale of the
  Tape preview without displaying the purse on the roster action. The preview
  spends no energy and emphasizes the purse with the 15-energy requirement
  directly beneath it, above your fighter card and the opponent's card. It then
  offers **Go Back** or **Fight!**; energy is charged only after Fight is
  confirmed and the cage-opening choice begins.
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
- Fight Gear uses a four-slot active loadout. Bling, Lifestyle, Property, and
  Rides provide passive career bonuses.

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
save is restored.

## Development

Run the repository checks with:

```sh
npm test
```

The game remains self-contained in `index.html`. Fighter portraits and
standalone opponent silhouettes in the
[GitHub assets folder](https://github.com/jayjonesvip/cage-warrior/tree/main/assets)
are source copies of the visual artwork. Regression tests live under `tests/` and
cover script parsing, save behavior, roster rules, readable text sizing,
equipment drops, collectible-card presentation, reward reveals, and the
Cash/Career Earnings economy.

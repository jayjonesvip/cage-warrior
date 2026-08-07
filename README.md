# Cage Warrior

[![pages-build-deployment](https://github.com/jayjonesvip/cage-warrior/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/jayjonesvip/cage-warrior/actions/workflows/pages/pages-build-deployment)

Cage Warrior is a mobile-first, single-player fight-career game. Open
`index.html` directly in a modern browser; no build step or server is required.

## Current game

Build a fighter from unknown rookie to champion through tactical fights,
training, side jobs, publicity, sponsors, equipment drops, and a persistent
generated league.

### Fighting and progression

- Choose one of seven permanent MMA archetypes: Pressure Fighter,
  Counter-Striker, Brawler, Trickster / Unorthodox, Control Grappler,
  Submission Hunter, or Wrestle-Boxer. Choose a "Fighting Out Of" hometown:
  Phoenix, Los Angeles, Chicago, New York, Miami, Houston, or Cleveland.
- New careers begin with two separate Home-screen identity choices. Each
  selector disappears as soon as its permanent choice is locked; career
  systems and navigation unlock only after both choices are complete. The
  selected archetype and hometown then live in the Career Identity card.
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
  Out** concedes some early initiative, then reveals the opponent's tactical
  tendency, scouting advice, and favorable or risky plan matchups before Round
  2. All seven archetypes become available as corner plans between rounds;
  unfamiliar striking or grappling disciplines still carry a real penalty.
- Submission Hunters can finish a fight by tap after a successful takedown.
  Speed, cardio, opponent condition, and signature-plan proficiency affect the
  submission chance.
- When condition falls to 25% or lower between rounds, the corner presents a
  one-time crisis choice. Throwing in the towel gives the opponent a TKO win;
  throwing a last-chance haymaker can swing or finish the fight, but missing it
  results in an immediate knockout loss.
- Watch fights normally, use 2× speed, or skip directly to the result.
- Complete daily contracts, build win streaks, and earn upset and rivalry
  bonuses.
- Progress through a hometown title, its regional title, the U.S. Title, and
  the World Title. Reaching a championship threshold only unlocks its reigning
  champion; the belt is awarded only after that fighter is defeated.
- Generated progression continues beyond level 15.

### Career opponents

- Opponents are generated locally with persistent names, attributes,
  archetypes, professional records, and head-to-head history.
- Current-level fighters are available at full purse. Unbeaten past-level
  opponents remain available for half purse.
- An opponent you defeat can decline another fight. Repeated losses to the
  player eventually cause retirement and generate a replacement fighter.
- The Career Opponents roster shows available current and past opponents,
  retired fighters, and
  a locked preview of the next level. Fighters are presented as fixed-ratio
  collectible-style cards, two across on mobile, with proportional artwork.
- An available opponent's **See Matchup** button opens a reversible Tale of the
  Tape preview without displaying the purse on the roster action. The preview
  spends no energy and emphasizes the purse above your fighter
  card and the opponent's card, then offers **Go Back** or **Fight!**. The 15
  energy cost is charged only after Fight is confirmed and the cage-opening
  choice begins.
- Title champions are persistent named fighters with professional records and
  attributes. A failed title challenge leaves the champion available for
  another attempt; a win archives the defeated former champion.
- A deterministic daily opponent provides one seeded attempt per day.

### Collectible drops

- Equipment is earned from fight wins and the guaranteed Daily Drop; it is
  never purchased.
- The home-screen Daily Drop awards Cash, energy, and one deterministic,
  level-eligible collectible every day. It does not reset fight-drop pity.
- A win has a 25% base drop chance. Upsets, rivalries, daily fights, and
  KO/TKO finishes improve the chance, up to 75%.
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
preserves existing fighters, hometown identity, generated rosters, rivalries,
retirements, collections, loadouts, championships, daily challenges, Cash, and
Career Earnings. Legacy Technician, Grappler, and Endurance identities map to
Counter-Striker, Control Grappler, and Pressure Fighter. Old opponent
tendencies migrate without losing records or rivalries. Legacy District and
National belt progress migrates into the new title ladder. The game also keeps
a last-known-good backup and refunds energy from an interrupted fight when the
save is restored.

## Development

Run the repository checks with:

```sh
npm test
```

The game remains self-contained in `index.html`. PNG files under `assets/` are
source copies of the visual artwork. Regression tests live under `tests/` and
cover script parsing, save behavior, roster rules, readable text sizing,
equipment drops, collectible-card presentation, reward reveals, and the
Cash/Career Earnings economy.

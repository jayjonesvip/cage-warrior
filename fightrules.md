# Cage Grind Fight Rules

This guide describes the player-facing rules for booking, planning, and resolving fights in Cage Grind.

## Fight eligibility

A fighter may book a fight when all of the following are true:

- At least one of the daily 10 fights remains.
- Health is at least 20.
- Enough Energy is available to clear all three scheduled rounds.
- No other fight is already pending.

The daily fight limit resets at local midnight. World Championship opportunities use their own UTC-day limit.

## Energy cost

Every fight is scheduled for three rounds. Energy is charged only when a round begins.

| Career level | Energy per round | Three-round clearance |
| --- | ---: | ---: |
| 1–2 | 6 | 18 |
| 3–4 | 7 | 21 |
| 5–6 | 8 | 24 |
| 7–8 | 9 | 27 |
| 9+ | 10 | 30 |

A fight that ends early does not charge Energy for unstarted rounds.

## Fighter attributes

- **Power** increases damage and knockout pressure. It also contributes to takedowns.
- **Speed** improves initiative, accuracy, defensive matchups, and submission opportunities.
- **Chin** reduces incoming damage and knockdown danger.
- **Cardio** supports sustained accuracy, initiative, control, and fast-paced fighting.

### Cardio imbalance

Ordinary specialist builds are allowed without an extra penalty. Additional fatigue begins when the fighter's higher Power or Speed rating exceeds Cardio by more than 75%.

- At 1.75× Cardio or below, there is no imbalance penalty.
- At roughly 2× Cardio, the fighter begins tiring noticeably faster.
- More extreme differences increase the penalty up to a safety cap.
- A Fast pace or Aggressive offense magnifies the effect.
- The same rule applies to player fighters and opponents.

This means a fighter can specialize heavily in Power or Speed, but needs enough Cardio to sustain that advantage across a full fight.

## Fight plan

Every booked fight starts in the locker room. The player locks one choice on each of three axes. The most recently selected combination is remembered for the next fight.

### Pace

- **Slow:** Fewer exchanges and less accumulated fatigue.
- **Fast:** More exchanges and potential initiative when Cardio supports the pace, but greater fatigue when it does not.

### Offense

- **Conservative:** More jabs, greater accuracy, safer defense, and fewer counter openings; lower damage and knockout pressure.
- **Aggressive:** More power shots, damage, and finish attempts; lower accuracy and more counter opportunities.

### Tactics

- **Stick to Style:** Uses the fighter's permanent Striker or Grappler identity with full familiarity.
- **Adapt:** Starts in the signature style, partially adjusts in Round 2, and makes the full matchup response in Round 3. Focus controls how well those changes are executed.

The plan is graded **Edge**, **Even**, or **Exposed** against the actual matchup. Power, Speed, Chin, Cardio, both archetypes, and Focus all contribute. Plan effects matter most in close matchups and are intentionally smaller when one fighter is physically dominant.

## Focus

Each booked fight starts with a temporary Focus value from 75–90% before the final locker-room choice.

- A contact message can improve or reduce Focus depending on the response.
- Ignoring a message applies a smaller known Focus cost.
- Music adds 4–10 Focus and has a chance to reach 100%.
- Meditation raises Focus to at least 92%.
- Final Focus is clamped from 50–100%.

Focus affects initiative, execution, and the quality of an adaptive fight plan. It lasts for that fight only.

## Archetypes and techniques

### Striker

Strikers favor jabs, crosses, hooks, and kicks. Their signature plan improves stand-up execution and knockout pressure.

### Grappler

Grapplers attempt more takedowns and gain extra control after successful entries. They can finish by submission. Submission chances improve with Speed, Cardio, signature-plan proficiency, and damage already dealt to the opponent.

## Fatigue and exchanges

Fatigue accumulates through each round and reduces execution accuracy.

- Later rounds carry more baseline fatigue.
- Cardio below 10 increases exchange-by-exchange fatigue.
- A major Power/Cardio or Speed/Cardio imbalance adds further fatigue.
- Fast pace increases the number of exchanges and multiplies player fatigue.
- Aggressive offense adds another fatigue multiplier.
- Slow and Conservative choices reduce the accumulated cost.

## Condition, Health, and injuries

Persistent Health determines starting fight Condition.

| Health before the fight | Starting Condition |
| --- | ---: |
| 90–100% | 100% |
| 70–89% | 95% |
| 50–69% | 88% |
| 20–49% | 78% |
| Below 20% | Not medically cleared |

Condition is the in-fight damage state. Health persists after the fight.

- A confirmed opponent strike or takedown removes 1 persistent Health.
- A knockdown removes 4 Health.
- A losing KO or TKO removes 12 additional Health.
- A losing submission removes 8 additional Health.
- Misses and defensive narration remove no Health.

Entering below full Health enables an injury roll on damaging opponent actions. Only one fight injury can occur per bout. An injury immediately halves current Condition, reduces every effective attribute by 1, and lasts until local midnight.

## Winning and scoring

A fight can end by:

- KO
- TKO
- Submission
- Unanimous decision
- Split decision
- Forfeit

Rounds use 10-point scoring. Damage, landed offense, takedowns, control, and knockdowns determine the round winner. A dominant round or knockdown advantage can produce a 10–8 score; otherwise the usual winning score is 10–9.

If all three rounds finish, the accumulated score decides the winner. The fight presentation shows unofficial totals between rounds and the official scorecard after the result.

## Forfeits

Leaving a committed fight requires confirmation. A forfeit:

- Records a professional loss.
- Uses one of the daily fights.
- Awards no Cash, Followers, XP, or gear.

## Rewards

### Wins

A win can award:

- The opponent purse.
- Fight XP.
- Followers.
- Hype.
- Streak, upset, or rivalry bonuses.
- A possible CEO gear gift.

Hype increases win payouts and Followers. Upsets are wins against an opponent whose combined ratings are at least 4 points higher.

### Losses

A completed non-forfeit loss awards:

- 8% of the base purse.
- 37.5% of the normal fight XP before other modifiers.
- A smaller number of Followers.

A loss resets the win streak and reduces Hype.

### XP modifiers

- Ranked fight: +20% XP.
- World Championship fight: +30% XP instead of the ranked bonus.
- Winning the World Championship: +25 additional XP.
- Upset victory: +25% XP.
- Past-level or ordinary rival fight: 50% XP.
- First win over an opponent that day: full XP.
- Second win over the same opponent that day: 25% XP.
- Further wins after two that day: no XP, no purse, and a Hype penalty.

## World Championship

Cage Grind has one shared World Champion.

- A challenger becomes eligible when their level reaches the champion's level.
- A contender receives one title opportunity per UTC day.
- The champion may defend once per UTC day against the selected active challenger.
- A dethroned champion receives one level-override rematch opportunity against the fighter who took the belt.
- After the rematch attempt, ordinary contender eligibility rules apply again.
- Regular ranked fights never place the championship at risk.

## Fight presentation

- Fights run as a complete planned simulation without a result skip.
- Playback can run at normal speed or 2× speed.
- Round introductions show the current unofficial score before Rounds 2 and 3.
- The result includes the finish, clock, judges' cards when applicable, round statistics, totals, rewards, and the final fight-plan grade.

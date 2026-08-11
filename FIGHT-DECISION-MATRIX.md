# Sim+ Fight Decision Matrix

Every round that survives to its midpoint pauses for exactly one Sim+ decision. The engine selects the first matching trigger in the priority table. If no contextual trigger matches, it uses the tactical fallback. A knockout or submission before the midpoint is the only exception.

Choosing **Feel Them Out** before round one reveals the estimated success percentage on every decision. Otherwise, players see the choice's tactical category without the exact odds.

## Trigger priority

| Priority | Trigger | Decision |
| --- | --- | --- |
| 1 | Player scores a knockdown, or opponent condition is 38% or lower | You Have Them Hurt |
| 2 | Opponent scores a knockdown, or player condition is 38% or lower | You Are Badly Hurt |
| 3 | Opponent lands a takedown at the checkpoint | They Shoot on Your Hips |
| 4 | Player lands a takedown at the checkpoint | You Secure Top Position |
| 5 | Opponent lands a strike at the checkpoint | Your Back Hits the Fence |
| 6 | No contextual trigger matches | The Round Is in the Balance |

## Choice matrix

| Decision | Choice | Category | Governing stat | Favored archetypes | Base success | Success | Failure |
| --- | --- | --- | --- | --- | ---: | --- | --- |
| You Have Them Hurt | Swarm for the Finish | High risk | Power | Pressure, Brawler | 54% | 14 damage | Take 8 damage |
| You Have Them Hurt | Pick Your Shots | Safe | Speed | Counter, Trickster | 78% | 8 damage | Take 2 damage |
| You Have Them Hurt | Change Levels | Control | Cardio | Control, Wrestle-box | 65% | 4 damage, 38s control, 1 takedown | Take 3 damage |
| You Are Badly Hurt | Shell Up & Recover | Safe | Chin | Counter, Control | 80% | 12s control credit | Take 4 damage |
| You Are Badly Hurt | Force the Clinch | Control | Cardio | Control, Wrestle-box | 66% | 32s control, 1 takedown | Take 6 damage |
| You Are Badly Hurt | Fire Back | High risk | Power | Pressure, Brawler | 48% | 13 damage | Take 11 damage |
| They Shoot on Your Hips | Sprawl & Reset | Safe | Cardio | Wrestle-box, Control | 76% | 18s control credit | Opponent gains 18s control |
| They Shoot on Your Hips | Attack the Guillotine | Finish hunt | Speed | Submission | 50% | 10 damage, 34s control | Opponent gains 34s control |
| They Shoot on Your Hips | Meet Them with a Knee | High risk | Power | Brawler, Trickster | 46% | 15 damage | Take 7 damage; opponent gains 24s control |
| You Secure Top Position | Ground-and-Pound | Damage | Power | Pressure, Brawler | 63% | 11 damage, 18s control | 8s control credit |
| You Secure Top Position | Advance Position | Control | Speed | Submission, Control | 70% | 5 damage, 42s control | 14s control credit |
| You Secure Top Position | Let Them Up | Safe reset | Cardio | Counter, Trickster | 88% | 5 damage | No swing |
| Your Back Hits the Fence | Circle into Open Space | Safe | Speed | Counter, Trickster | 76% | 4 damage | Take 3 damage |
| Your Back Hits the Fence | Fight for the Reversal | Control | Cardio | Control, Wrestle-box | 61% | 30s control | Opponent gains 22s control |
| Your Back Hits the Fence | Bite Down & Trade | High risk | Chin | Pressure, Brawler | 50% | 12 damage | Take 10 damage |
| The Round Is in the Balance | Raise the Pressure | Damage | Power | Pressure, Brawler | 61% | 9 damage | Take 5 damage |
| The Round Is in the Balance | Draw Out a Counter | Precision | Speed | Counter, Trickster | 68% | 8 damage | Take 3 damage |
| The Round Is in the Balance | Change Levels | Control | Cardio | Control, Submission, Wrestle-box | 63% | 3 damage, 34s control, 1 takedown | Opponent gains 14s control |

## Resolution formula

```text
success chance = base chance
               + 8% when the choice favors the fighter's archetype
               + 1.8% per point of relevant-stat advantage
```

The final chance is clamped between 22% and 90%. Decision results update condition, round statistics, total fight statistics, and the judges' score for that round. The existing corner, crisis, and final-ten-second decisions remain separate layers.

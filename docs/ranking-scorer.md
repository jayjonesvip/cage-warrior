> Historical reference: replaced in 2.7.197 by descending level and record tie-breakers. These scoring functions remain only for legacy compatibility; see README.md for current behavior.

# World Rank scorer v2 with win protection

Live weights: quality wins 45%, career 25%, recent form 25%, base attributes 5%. Every pillar is bounded to 0–100; the composite is rounded to six decimals in both JavaScript and PostgreSQL. Aura, followers, finish method and non-combat perks add nothing.

## Booking and historical data

`rankingFightSnapshot` stamps `opponent_rank_at_booking`, `opponent_level_at_booking` and `quality_points` when the bout is booked. Both fighter perspectives are captured for seeded opponents. The player's snapshot is persisted in `pendingFight`; completed fight history and durable result rows retain snapshots. Ranking settlement appends by immutable result ID and does not consult current opponent rank or level. Repeated result IDs do not append another result.

The approved quality curve is `30 + 65 * exp(-(rank - 1) / 40)`, clamped to 30–95 before level adjustment. Example base values: #1 95, #5 88.81, #10 81.90, #25 65.67, #50 49.09, #100 35.47. Ranked/title unknown rank uses 35; Circuit uses 20. Add twice the booked level difference, clamped to −10…+5. Final quality is capped at 100, or 25 for Circuit. The earlier steep exponential is not used.

Legacy rows retain their original stored quality exactly; missing booking rank/level remain null. No migration infers an old rank from today's standings. Consequently old bands remain on legacy wins until those rows leave the 30-fight window.

## Four pillars

- **Quality:** last 30 eligible fights, wins only; age 1–8 has weight 1, 9–18 weight .7, 19–30 weight .4. With fewer than five wins, average the existing decayed wins. Otherwise combine 70% average of the best five decayed wins with 30% average of all decayed wins. No wins in a nonempty history gives 0; no history gives 20.
- **Career:** `(wins + .5 * draws + 2) / (wins + losses + draws + 4)` is the smoothed win rate. Career is `85 * rate + 15 * min(wins, 50) / 50`. The counters are adjudicated W/L/D; NC, vacates, and DQs are excluded. Volume counts full wins only.
- **Form:** last 10 eligible results; wins score `50 + .5 * quality`, losses `10 + .3 * quality`. Draws use neutral 50. Average the available rows. No rows uses the smoothed career percentage. NC/vacate/DQ rows consume no window slots. Optional calendar inactivity decay is not enabled.
- **Attributes:** `100 * min(base total, 150) / 150`. Base Power/Speed/Chin/Cardio are authoritative; combat snapshots do not affect the live pillar. `score_with_perks` is a server-side shadow only.

## Wins preserve earned performance

The weighted quality, career, and form total is protected during a winning streak. A weaker win can lower the raw averages, but cannot lower the earned performance score. Stronger wins can still improve it. The current base-attribute contribution is added separately, so perks never enter the protection. A loss or draw ends the protection and uses the ordinary current score; other fighters can still pass a winning fighter by earning a higher score.

For existing saves, the scorer replays the available prefixes of the current winning streak, subtracting each removed win from the career count, and keeps the highest performance total. It stops at the most recent loss/draw. This recovers gains still reconstructable within the saved 30 bouts without rerating any opponent. Gains already lost outside that history cannot be reconstructed.

New player wins carry the pre-result protected performance as `win_score_floor` on their ranking-history row, rounded upward to six decimals and bounded to 0–95. This is calculated before trimming the history and survives sync, backup, reload, and repeated settlement. Seeded fighter wins receive the same carry through a database trigger before their rebuilt result history replaces the old window. Only winning rows retain a floor; losses and draws cannot inherit one.

## Ordering and visibility

Sort by composite descending, raw wins/fights descending, eligible career fight count descending, then immutable fighter ID ascending. Handles are never tie-breakers. After sorting, insert the visible, synced undisputed champion at #1. A vacant title, interim champion, hidden champion or champion lacking a valid combat snapshot has no lock. The Fight list filters unsynced fighters after assigning positions, so gaps are preserved.

## Apply and verify

Apply `supabase/migrations/20260908130000_ranking_scorer_v2.sql` before publishing this browser version. It normalizes legacy history without rerating it, preserves booked metadata on sync, adds draw support, updates the scorer and challenger selection, adds and backfills the perk shadow, and persists snapshots for seed results. The earlier unapplied `20260908120000_effective_attributes_world_rank.sql` is intentionally a no-op: do not deploy the old perk-live proposal. Applying v2 does not activate perk-inclusive ranking.

Then apply `supabase/migrations/20260908140000_protect_ranking_score_on_wins.sql` before publishing the win-protection browser update. It preserves the new history field, updates server scoring and seeded win settlement, and refreshes the diagnostic shadow. Existing championship ownership is unchanged.

`npm test` includes the acceptance fixtures in `tests/ranking-scorer.test.js`. `scripts/verify-ranking-sql.cjs` applies both migrations twice to an isolated PostgreSQL engine, compares both implementations over 183 scenarios, and checks snapshot sync, seed-result retry behavior, history rollover and shadow isolation. Install `@electric-sql/pglite` outside the project and set `PGLITE_MODULE_PATH` to that package path to run it without adding a production dependency.

## Debugging

In the browser console, call `cageRankingDebug(fighterId)` for any loaded fighter. It returns and logs the five best decayed wins, last-10 form line, smoothed record, base attribute total, all four pillars and final score. For direct logic tests use `CAGE_LOGIC.rankingDebug(profile, logger)`.

`rawScore` shows the ordinary weighted score before win protection; `winProtection` shows the credit retained above that raw score. `score` includes that credit.

In the Supabase SQL editor:

```sql
select id, public.cage_ranking_breakdown(wins, losses, draws, attribute_total, ranking_history) as debug,
       score_with_perks
from public.cage_profiles
where retired_at is null;
```

The debug calculation is deterministic and reads no live opponent ranks. The shadow column is never used to order the live rankings.

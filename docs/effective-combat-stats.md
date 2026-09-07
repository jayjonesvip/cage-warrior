# Real fighter combat stats

Run `supabase/migrations/20260907190000_effective_combat_stats.sql` before deployment.

Public profiles now store the exact four values returned by `effectiveStat()`:
allocated stats, style adjustments, and equipped combat-item bonuses. These are
the same integer values used by the owner's HUD and fight simulation. Snapshots
are synced at profile creation, normal career sync, and after UI changes to stats
or equipment (debounced). Network failures remain non-fatal and retry on later
updates/syncs. They are latest-synced snapshots, not live remote equipment reads.

Roster and candidate queries load snapshots through an authenticated RPC. Real
opponents no longer call `networkOpponentRatings`. The portrait and level do not
alter synced stats. Tale of the Tape and the simulation use the same opponent
object; no second application of gear bonuses occurs. Open Gym scouts use the
same snapshot and preserve their existing clone freeze behavior.

There is deliberately no guessed backfill. Until a fighter opens the updated game
and syncs, their ranked row says AWAITING STATS SYNC and cannot start a fight or
be scouted. Feed challenges enforce the same guard. Previously cached generated
opponents are also blocked unless they have a valid snapshot marker. Seeded
fighters keep their explicitly stored stats; generated Circuit opponents remain
available. New careers reset the snapshot, preventing retired-build inheritance.

The database accepts only complete integer stats between 1 and 10,000, restricts
writes to the authenticated user's active profile, and exposes no private save
contents. As with existing career records, these values remain client-reported;
this is not a server-authoritative anti-cheat system. Rank scoring's existing
base-attribute-total input is unchanged.

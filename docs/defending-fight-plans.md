# Defending fight plans

Run `supabase/migrations/20260907180000_defending_fight_plans.sql`.

The last locked-in plan is saved to the public fighter profile, independently of
the fight result. Normal career sync retries the saved preference if the immediate
request fails. Merely changing selections, canceling a fight, and Open Gym do not
publish a new defending plan. A new career resets to measured, disciplined, stick
to style. Opponent plans are fetched with the roster and copied into the bout at
booking, so a later roster refresh cannot change an active fight. Exact choices
are not displayed in the matchup UI (the public API is not a secrecy mechanism).

Both sides now share plan evaluation, adaptation, technique selection, fatigue,
accuracy, damage, knockdown intent, rocked intent and signature submission rules.
Round exchange count combines both pace choices; initiative uses differences
between the two sides. Exact scoring ties no longer automatically favor the
initiator. Reduced/injured starting condition is unchanged; these tests isolate
tactical fairness at equal starting condition and crowd support.

The regression suite runs the actual round simulator for 20,000 seeded bouts,
including identical-plan striker/grappler mirrors and swapped unequal matchups.
It checks win-rate symmetry within a four-percentage-point tolerance, not exact
50/50 outcomes for every finite sample. This does not prove all balance cases.

The subsequent effective-combat-stats migration replaces generated real-opponent
attributes with synced effective stats. See `effective-combat-stats.md` for rollout
and unsynced-profile behavior.

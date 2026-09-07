# The Daily Cage

Run `supabase/migrations/20260907120000_daily_cage_news.sql` before deploying.

Home shows one dismissible, manually swiped edition per local calendar day,
starting the day after the fighter profile was created. It covers the previous
local calendar day. Viewing marks the edition seen for that career on this browser;
closing, switching tabs, and reloading do not show it again. There is no autoplay.
An empty or failed query does not display filler or mark an edition seen.

Headlines use active profile creation dates, championship transfer/defense history,
and the new completed-bout log. An upset means a recorded win over a higher-ranked
opponent, using ranks captured before the bout. Circuit sparring never produces an
upset headline. Open Gym sessions are not recorded at all.

Fight counts start with this deployment; old totals cannot be reconstructed.
These are recorded client-reported results, like existing career record sync, not
server-verified fight simulation. Offline results retry after successful profile
sync for up to seven days (at most 100 pending results per browser/career). Unique
career/bout keys prevent retries from increasing the count. No private cloud saves
are queried. Only authenticated aggregate RPCs are exposed; direct result-table
access is disabled. Clearing browser storage can reset seen state or lose unsynced
results. Cross-device dismissal is not currently synchronized.

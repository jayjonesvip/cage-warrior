# Shared seeded fighter records

Run `supabase/migrations/20260907200000_seeded_fighter_records.sql` after the
Daily Cage migration. Existing seed records are the starting baseline; old bouts
cannot be reconstructed. Do not rerun the original seed upsert migration as a
routine refresh: it resets seeded baseline records.

Every newly reported completed ranked bout against a seed increments its shared
record from the opposite perspective: a player win adds a seed loss; a player
loss or forfeit adds a seed win. Open Gym and temporary generated Circuit fighters
never use this path. Stats, level, gear and XP do not grow. The existing 9,999 cap
per record column is retained. Seeds still cannot hold the authenticated title.

The same transaction inserts the Daily Cage result and adjusts the seed. Its
unique player/career/bout key prevents duplicate retries from adding wins or
losses. A row lock serializes simultaneous challengers. The newest 30 reported
seed results are ordered by bout time and supply win/quality history to the
existing ranking formula. Quality uses the challenger rank and level at booking,
matching the player's ranking quality tiers. Rankings therefore respond to
opponent quality and recent form, not just totals.

Pending results use the existing per-career browser outbox, retrying at career
sync for seven days, up to 100 pending results. Roster reads wait for that flush
before fetching the seed's new record. A missing migration or network failure
does not stop gameplay; shared records may lag until a successful sync. Deleting
browser storage can lose unsynced results. Client reports remain trusted under
the existing game model; this does not add server-authoritative combat validation.

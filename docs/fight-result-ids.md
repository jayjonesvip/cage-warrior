# Stable fight result IDs

Apply `supabase/migrations/20260907210000_unique_fight_result_ids.sql` after the
seeded-record migration. This is a general fix; it does not repair any individual
account or reconstruct previously discarded results.

Fight totals are mutable and are no longer idempotency keys. New completed fights
receive a UUID which persists in their local history and retry queue. Database
rows use that UUID as their primary key. Existing rows and older clients receive
deterministic IDs derived from the career, timestamp and opponent. A secondary
event-identity index protects against double-counting the same event under a new
UUID. Exact retries succeed without another record update. Conflicting outcomes
raise an error rather than silently dropping the submission.

Pending results are removed only on successful acknowledgment. Errors are reported
in a non-blocking toast and console warning. One failed event does not block later
events, and old events are retained for manual review instead of silently expired.
No personal historical data was inserted by this change. Cloud/local save rollback
remains a separate investigation: this fix prevents a reused record total from
discarding a different fight, but does not reconcile divergent career saves.

Validation includes local PostgreSQL-compatible execution of the migrations:
distinct fights with the same bout number both update the seed; identical retries
count once; conflicting UUID payloads are rejected without another update.

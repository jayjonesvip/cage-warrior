const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const sql=read('supabase/migrations/20260907200000_seeded_fighter_records.sql');
test('seed updates share a deduplicated transaction and lock concurrent challengers',()=>{
  assert.match(sql,/where id=seed and active for update/);
  assert.match(sql,/on conflict do nothing returning profile_id into inserted/);
  assert.match(sql,/if inserted is null or seed is null then return/);
  assert(sql.indexOf('if inserted is null')<sql.indexOf('update public.cage_seed_fighters set'));
  assert.match(sql,/wins=least\(9999,wins\+case when \(p_result->>'won'\)::boolean then 0 else 1 end\)/);
  assert.match(sql,/losses=least\(9999,losses\+case when \(p_result->>'won'\)::boolean then 1 else 0 end\)/);
});
test('seed progression changes records and quality history, not level or stats',()=>{
  const update=sql.slice(sql.indexOf('update public.cage_seed_fighters set'));
  assert.doesNotMatch(update,/\b(?:level|power|speed|chin|cardio|attribute_total)\s*=/);
  assert.match(sql,/jsonb_array_length\(ranking_history\)<=30/);
  assert.match(sql,/'won',not recent.won,'quality',recent.seed_opposition_quality/);
  assert.match(sql,/order by occurred_at desc,profile_id desc,bout_number desc limit 30/);
});
test('only seeded completed fights queue seed outcomes and flush precedes roster refresh',()=>{
  const game=read('js/game.js');
  assert.match(game,/seedId:o.seeded\?o.sourceProfileId:null,opponentId:o.network&&!o.seeded\?o.sourceProfileId:null,playerLevel:fight.playerLevelAtBooking/);
  const sync=game.slice(game.indexOf('  async function connectSharedSocial('));
  assert(sync.indexOf('await dailyNews.profile(profile)')<sync.indexOf('SHARED_FEED.loadSeedFighterRoster()'));
  assert.match(read('js/daily-news.js'),/await flush\(\);void load\(\)/);
});

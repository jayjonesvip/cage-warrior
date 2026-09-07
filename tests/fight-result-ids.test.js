const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const history=require('../js/fight-history.js');
test('fight IDs survive history saves and reload normalization',()=>{
  const resultId='11111111-1111-4111-8111-111111111111';
  const saved=history.append([],{resultId,winner:'opp',o:{name:'Seed'},method:'TKO'},Date.now());
  assert.equal(history.normalize(JSON.parse(JSON.stringify(saved)))[0].resultId,resultId);
});
test('database idempotence uses immutable identity rather than bout count',()=>{
  const sql=fs.readFileSync(path.join(__dirname,'../supabase/migrations/20260907210000_unique_fight_result_ids.sql'),'utf8');
  assert.match(sql,/add primary key\(result_id\)/);
  assert.match(sql,/raise exception 'Conflicting fight result ID'/);
  assert.doesNotMatch(sql,/n>p.wins\+p.losses/);
  assert.match(sql,/if inserted is null then/);
});

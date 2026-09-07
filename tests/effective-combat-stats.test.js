const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const LOGIC=require('../js/game-logic.js'),{createClient}=require('../js/cage-social.js');
const stats={power:23,speed:11,chin:17,cardio:9};
const game=fs.readFileSync(path.join(__dirname,'../js/game.js'),'utf8');
test('combat stat snapshots require all four exact bounded integers',()=>{
  assert.deepEqual(LOGIC.validCombatStats(stats),stats);
  for(const invalid of [null,{}, {...stats,power:'23'},{...stats,chin:0},{...stats,speed:1.5},{...stats,cardio:10001}])assert.equal(LOGIC.validCombatStats(invalid),null);
});
test('network opponent uses exact effective stats; no generated fallback; seeded stats remain explicit',()=>{
  const ctx={LOGIC,normalizeIdentityName:x=>x,networkOpponentDisplayName:x=>x,fighterAvatars:[{id:'avatar',asset:'portrait',stats:{power:1}}],opponentArchetypes:[{id:'striker',tag:'STRIKER',tendency:'striker'}],normalizeMajorArchetype:x=>x,hashSeed:()=>5,fighterAccent:()=>'',clamp:LOGIC.clamp};
  vm.createContext(ctx);vm.runInContext(game.slice(game.indexOf('  function networkOpponentFromProfile('),game.indexOf('  function syncRankedOpponents(')),ctx);
  const profile={id:'11111111-1111-4111-8111-111111111111',handle:'Fighter',fighter_avatar:'avatar',archetype:'striker',level:6,combat_stats:stats};
  const opponent=ctx.networkOpponentFromProfile(profile,6);assert.equal(opponent.statsReady,true);
  for(const key in stats)assert.equal(opponent[key],stats[key]);
  const missing=ctx.networkOpponentFromProfile({...profile,combat_stats:null},6);assert.equal(missing.statsReady,false);assert.equal(missing.power,undefined);
  const seeded=ctx.networkOpponentFromProfile({...profile,seeded:true,combat_stats:null,...stats},6);assert.equal(seeded.power,23);
});
test('shared sync publishes the effective snapshot and roster/candidate reads retain it',async()=>{
  let saved=null;const db={configured:()=>true,registerCageProfile:async()=>({id:'me'}),syncCageRanking:async()=>({id:'me'}),saveCombatStats:async s=>{saved=s},selectCageProfiles:async()=>[{id:'them'}],selectCageOpponentCandidates:async()=>[{id:'them'}],loadCombatStats:async()=>({them:{stats,updatedAt:'2026-09-07T12:00:00Z'}}),ensureSession:async()=>({user:{id:'me'}})};
  const client=createClient({databaseClient:db});await client.registerProfile({combatStats:stats});assert.deepEqual(saved,stats);
  assert.deepEqual((await client.loadProfiles())[0].combat_stats,stats);assert.deepEqual((await client.loadOpponentCandidates(6))[0].combat_stats,stats);
});
test('actual database client exposes both stats and defending plan RPCs',async()=>{
const calls=[],client=createClient({url:'https://test.supabase.co',key:'sb_publishable_test-key',storage:{getItem:()=>null,setItem(){}},fetchImpl:async(url,options)=>{calls.push({url,options});return {ok:true,status:200,text:async()=>JSON.stringify(url.includes('/signup')?{access_token:'test',refresh_token:'test',expires_at:9999999999,user:{id:'11111111-1111-4111-8111-111111111111'}}:null)}}});
  await client.saveCombatStats(stats);await client.saveDefendingPlan({pace:'fast',offense:'aggressive',tactics:'adapt'});
  assert(calls.some(call=>call.url.endsWith('/rpc/save_cage_combat_stats')&&JSON.parse(call.options.body).p_stats.power===23));
  assert(calls.some(call=>call.url.endsWith('/rpc/save_cage_defending_plan')));
});
test('payload and simulation share effective stats; missing stats block feed challenges as well',()=>{
  assert.match(game,/combatStats:Object\.fromEntries\(\['power','speed','chin','cardio'\]\.map\(key=>\[key,effectiveStat\(key\)\]\)\)/);
  assert.match(game,/const O=\{name:o.name,power:o.power,speed:o.speed,chin:o.chin,cardio:o.cardio\}/);
  assert.match(game,/function openTaleOfTape\(o,options=\{\}\)\{\s+if\(combatStatsPending\(o\)\)/);
  assert.match(game,/if\(!opponent\|\|combatStatsPending\(opponent\)\)return \[\]/);
});

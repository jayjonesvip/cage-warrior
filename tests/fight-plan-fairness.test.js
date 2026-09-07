const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const LOGIC=require('../js/game-logic.js');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/game.js'),'utf8');
const defaultPlan={pace:'slow',offense:'conservative',tactics:'stick'};
test('defending plan defaults and normalization are bounded',()=>{
  assert.deepEqual(LOGIC.normalizeFightPlan(null),defaultPlan);
  assert.deepEqual(LOGIC.normalizeFightPlan({pace:'bad',offense:'bad',tactics:'bad'}),defaultPlan);
});
test('shared roster carries defending plans and remains usable before migration',async()=>{
  const social=require('../js/cage-social.js');let offline=false,saved=null;
  const db={configured:()=>true,selectCageProfiles:async()=>[{id:'opponent'}],ensureSession:async()=>({user:{id:'me'}}),loadDefendingPlans:async()=>{if(offline)throw Error('missing rpc');return {opponent:{pace:'fast',offense:'aggressive',tactics:'adapt'}}},saveDefendingPlan:async plan=>{saved=plan},registerCageProfile:async()=>({id:'me'}),syncCageRanking:async()=>({id:'me'})};
  const client=social.createClient({databaseClient:db});
  assert.equal((await client.loadProfiles())[0].defending_plan.pace,'fast');
  await client.registerProfile({defendingPlan:defaultPlan});assert.deepEqual(saved,defaultPlan);
  offline=true;assert.equal((await client.loadProfiles()).length,1);
});
function harness(){
  let seed=654321;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const random=(a,b)=>a+math.random()*(b-a);
  const ctx={Math:math,LOGIC,FIGHT_ROUNDS:3,state:{fighterStyle:'striker',fightPlanPreference:defaultPlan},planDefs:[{id:'striker',name:'Striker'},{id:'grappler',name:'Grappler'}],fightRule:(key,fallback)=>fallback,clamp:LOGIC.clamp,rand:random,rint:(a,b)=>Math.floor(random(a,b+1)),planFamiliarity:(a,b)=>a===b?.08:-.06,fightPlanFeedback:()=>'',fightClock:()=>'',commentaryFor:()=>'',selectSubmissionFinish:()=>({name:'test',call:'finishes'}),emptyFightStats:()=>({attempted:0,landed:0,sig:0,takedowns:0,control:0,damage:0,kd:0}),addFightStats:(a,b)=>{for(const k in a)a[k]+=b[k]}};
  vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function plannedTechnique('),source.indexOf('  function renderTapeBreakdown(')),ctx);
  return (a,b,n)=>{let wins=0;for(let i=0;i<n;i++){
    ctx.state.fighterStyle=a.style;
    const sim={o:{tendency:b.style},player:{name:'A',...a.stats},opp:{name:'B',...b.stats},gamePlan:a.plan,opponentPlan:b.plan,playerCondition:100,oppCondition:100,playerAura:0,opponentAura:0,rounds:[],plans:[],timeline:[],totals:{player:ctx.emptyFightStats(),opp:ctx.emptyFightStats()},mode:'planned'};
    for(let round=1;round<=3&&!sim.winner;round++)ctx.simulateRound(sim,round,a.style);
    if(sim.winner==='player')wins++;
  }return wins/n};
}
test('equal-stat identical plans have no material initiating-side win bias',()=>{
  const run=harness(),stats={power:12,speed:12,chin:12,cardio:12};
  for(const style of ['striker','grappler'])for(const plan of [defaultPlan,{pace:'fast',offense:'aggressive',tactics:'adapt'}]){
    const fighter={stats,style,plan},rate=run(fighter,fighter,3000);
    assert(Math.abs(rate-.5)<.04,`${style} ${JSON.stringify(plan)}: ${rate}`);
  }
});
test('swapping styles, attributes and different plans preserves matchup odds',()=>{
  const run=harness(),a={stats:{power:13,speed:11,chin:12,cardio:14},style:'striker',plan:{pace:'fast',offense:'aggressive',tactics:'adapt'}},b={stats:{power:12,speed:13,chin:14,cardio:11},style:'grappler',plan:defaultPlan};
  const forward=run(a,b,4000),reverse=run(b,a,4000);
  assert(Math.abs(forward+reverse-1)<.04,`${forward} + ${reverse}`);
});

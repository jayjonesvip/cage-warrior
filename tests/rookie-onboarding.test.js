const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/game.js'),'utf8');
const LOGIC=require('../js/game-logic.js');
function harness(){
 const ctx={LOGIC,ROOKIE_SHOWCASE:{key:'rookie-showcase-vaso-jose-mx'},state:{fighterStyle:'striker'},emptyFightStats:()=>({attempted:0,landed:0,damage:0,kd:0,sig:0,takedowns:0,control:0}),addFightStats:(a,b)=>{for(const key in a)a[key]+=b[key]}};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function isTutorialShowcase('),source.indexOf('  function beginPlannedFight(')),ctx);return ctx;
}
test('tutorial protection is limited to the first career Vaso fight',()=>{
 const h=harness(),sim={o:{key:h.ROOKIE_SHOWCASE.key,rookieShowcase:true}},career={wins:0,losses:0};
 assert.equal(h.isTutorialShowcase(sim,career),true);
 for(const patch of [{key:'other'},{network:true},{meetings:1},{rookieShowcase:false}])assert.equal(h.isTutorialShowcase({o:{...sim.o,...patch}},career),false);
 assert.equal(h.isTutorialShowcase(sim,{wins:0,losses:1}),false);
 assert.equal(h.isTutorialShowcase(sim,{wins:1,losses:0}),false);
});
test('protected showcase preserves a complete normal winning simulation',()=>{
 const h=harness();let attempts=0;
 h.structuredClone=structuredClone;h.FIGHT_ROUNDS=3;h.plannedStyleForRound=()=> 'striker';
 h.simulateRound=(sim)=>{attempts++;sim.winner=attempts===2?'player':'opp';sim.method='SUBMISSION';sim.timeline.push({type:'submission',text:sim.winner});sim.rounds.push({round:1});};
 const sim={timeline:[],rounds:[]};h.simulateProtectedShowcase(sim);
 assert.equal(attempts,2);assert.equal(sim.winner,'player');assert.equal(sim.method,'SUBMISSION');assert.equal(sim.timeline.length,1);assert.equal(sim.timeline[0].text,'player');assert.equal(sim.rounds.length,1);
});
test('both styles and all plans get a consistent tutorial win without healing',()=>{
 const h=harness();
 for(const style of ['striker','grappler'])for(const pace of ['slow','fast'])for(const offense of ['conservative','aggressive'])for(const tactics of ['stick','adapt']){
  h.state.fighterStyle=style;
  const sim={player:{name:'Rookie',power:5,speed:5,chin:5,cardio:5},opp:{name:'Vaso',power:2,speed:2,chin:1,cardio:2},gamePlan:{pace,offense,tactics},playerCondition:62,oppCondition:100,plans:[],timeline:[],rounds:[],totals:{player:h.emptyFightStats(),opp:h.emptyFightStats()}};
  h.simulateTutorialShowcase(sim);
  assert.equal(sim.winner,'player');assert.equal(sim.method,'TKO');assert.equal(sim.timeline.at(-1).clock,sim.finishClock);
  assert.equal(sim.rounds.length,1);assert.equal(sim.totals.player.damage,72);assert.equal(sim.oppCondition,28);
  assert(sim.timeline.filter(x=>x.playerCondition!=null).every(x=>x.playerCondition===62));
  assert.equal(sim.totals.player.landed,sim.timeline.filter(x=>x.landed).length);
 }
});
test('new account publishes only its reporter signing announcement',()=>{
 const posts=[],queued=[],state={socialAccountCreated:false,socialCycle:0,ceoEvents:['debut'],wins:0,losses:0,name:'Rookie'};
 const ctx={state,STRINGS:{social:{contractSigning:{profile:'media',text:'SIGNED'}}},ensureSocialFeed:()=>false,copyPosts:x=>x,addSocialPosts:x=>posts.push(...x),queueSharedPosts:x=>queued.push(...x),currentStyle:()=>({name:'striker'}),currentCity:()=>({name:'Boston'}),changeFollowers:()=>5,trackEvent(){},toast(){},sfx:{win(){}},saveState(){},ceoRemoteEventKey:x=>x};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function createSocialAccount('),source.indexOf('  function drawSocialHeadline(')),ctx);
 ctx.createSocialAccount();assert.equal(posts.length,1);assert.equal(posts[0].profile,'media');assert.equal(queued.length,1);assert.equal(queued[0].kind,'reporter');
 ctx.createSocialAccount();assert.equal(posts.length,1);
});

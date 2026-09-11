const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const logic=require('../js/game-logic.js');
const game=fs.readFileSync(require('node:path').join(__dirname,'../js/game.js'),'utf8');

test('confirmed title outcomes follow the booked side even with stale champion flags',()=>{
  for(const [status,mode,heading,outcome] of [
    ['new_champion','defense','YOU LOST THE WORLD TITLE','loss'],
    ['new_champion','challenge','YOU ARE WORLD CHAMPION','win'],
    ['new_champion','rematch','TITLE RECLAIMED','win'],
    ['champion_defended','defense','TITLE DEFENDED','win'],
    ['champion_defended','challenge','TITLE FIGHT LOST','loss'],
    ['champion_defended','rematch','TITLE FIGHT LOST','loss'],
    ['stale','defense','CHAMPIONSHIP CHANGED','neutral'],
    ['expired','challenge','TITLE RESULT EXPIRED','neutral']
  ])for(const isChampion of [true,false]){
    const result=logic.championshipSettlementPresentation({status,mode,isChampion,championHandle:'NewChamp',defenses:3});
    assert.equal(result.heading,heading);assert.equal(result.outcome,outcome);
    if(status==='new_champion'&&mode==='defense')assert.match(result.message,/@NewChamp took the belt/);
  }
});

function settlementHarness({refreshFails=false,laterFight=false,replayed=false}={}){
  const nodes=new Map(),calls=[],$=key=>{if(!nodes.has(key))nodes.set(key,{textContent:'UNCHANGED',className:''});return nodes.get(key)};
  const pending={challengeId:42,mode:'defense',challengerWon:true};
  const result=replayed?{status:'new_champion',replayed:true}:{status:'new_champion',champion_id:'new',champion_handle:'NewChamp',defenses:0};
  const fresh={is_champion:false,champion_id:'new',champion_handle:'NewChamp'};
  const context={$,LOGIC:logic,state:{pendingChampionshipResult:pending},fight:{championshipBout:{challenge_id:laterFight?43:42}},sharedChampionship:{is_champion:true,champion_handle:'OldChamp'},championshipSettlementPromise:null,
    SHARED_FEED:{async settleChampionshipBout(){calls.push('settle');return result},async loadChampionship(){calls.push('fresh');if(refreshFails)throw Error('offline');return fresh}},
    async connectSharedSocial(){calls.push('shared');assert.equal($('#resultTitle').textContent,laterFight?'UNCHANGED':'YOU LOST THE WORLD TITLE');return true},
    landingFeature:{setAvailability(value){context.sharedChampionship=value}},queueTitleLossPresentation(value){calls.push('notice');assert.equal(value,fresh)},
    saveState(){},trackEvent(){},toast(){},updateUI(){},requestAnimationFrame(){},showPostFightFollowup(){},console:{warn(){}},setTimeout(){throw Error('A settled result must not be retried')}
  };
  vm.createContext(context);
  vm.runInContext(game.slice(game.indexOf('  function renderChampionshipSettlement('),game.indexOf('  function finalizePersistentFightDamage(')),context);
  return {context,nodes,$,calls,result};
}

test('lost defense renders loss styling before refreshing stale championship state',async()=>{
  const {context,$,calls}=settlementHarness();await context.settleChampionshipResult();
  assert.equal($('#resultTitle').className,'loss');
  assert.equal($('#championshipResultStatus').className,'championship-result-status settled loss');
  assert.match($('#championshipResultStatus').textContent,/YOU LOST THE WORLD TITLE.*@NewChamp took the belt/);
  assert.equal(context.sharedChampionship.is_champion,false);
  assert.deepEqual(calls,['settle','shared','fresh','notice']);
  assert.equal(context.state.pendingChampionshipResult,null);
});

test('replayed loss stays correct when championship refresh fails',async()=>{
  const {context,$,result}=settlementHarness({refreshFails:true,replayed:true});
  assert.equal(await context.settleChampionshipResult(),result);
  assert.equal(context.sharedChampionship,null);
  assert.match($('#resultLine').textContent,/Your challenger took the belt/);
  assert.equal($('#resultTitle').className,'loss');
  assert.equal(context.state.pendingChampionshipResult,null);
});

test('a late title settlement cannot overwrite another fight result',async()=>{
  const {context,$}=settlementHarness({laterFight:true});await context.settleChampionshipResult();
  assert.equal($('#resultTitle').textContent,'UNCHANGED');
  assert.equal($('#championshipResultStatus').textContent,'UNCHANGED');
});

test('title loss notice waits for other presentations and its button reveals the champion',()=>{
  const classes=new Set(),calls=[],frames=[];
  const node={style:{},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)},setAttribute(){},scrollIntoView(){calls.push('scroll')},focus(){calls.push('focus')}};
  const context={$:()=>node,pendingTitleLossPresentation:{id:7,opponent:'NewChamp'},state:{lastTitleLossSeenId:0},resetFightListPending:false,postFightPresentationBusy:()=>true,
    saveState(){},sfx:{tap(){},lose(){}},navTo(screen){calls.push(screen);assert.equal(context.resetFightListPending,true)},requestAnimationFrame:fn=>frames.push(fn),showPostFightFollowup(){calls.push('followup')}};
  vm.createContext(context);
  vm.runInContext(game.slice(game.indexOf('  function showPendingTitleLoss()'),game.indexOf('  function showPendingCeoOffice()')),context);
  assert.equal(context.showPendingTitleLoss(),false);assert.equal(classes.has('open'),false);
  context.closeTitleLoss(true);frames.shift()();
  assert.deepEqual(calls,['fight','scroll','focus','followup']);
  assert.equal(context.state.lastTitleLossSeenId,7);assert.equal(context.pendingTitleLossPresentation,null);
});

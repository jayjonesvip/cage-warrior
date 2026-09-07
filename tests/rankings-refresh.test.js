const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/game.js'),'utf8');
test('opening the fight list starts at the top without moving later refreshes',()=>{
 const scroller={scrollTop:640};
 const ctx={resetFightListPending:true,currentScreen:'fight',fight:null,$:()=>scroller};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function resetFightListScroll('),source.indexOf('  function maybeLoadMoreFightRankings(')),ctx);
 ctx.resetFightListScroll();assert.equal(scroller.scrollTop,0);assert.equal(ctx.resetFightListPending,false);
 scroller.scrollTop=250;ctx.resetFightListScroll();assert.equal(scroller.scrollTop,250);
 ctx.resetFightListPending=true;ctx.fight={};ctx.resetFightListScroll();assert.equal(scroller.scrollTop,250);assert.equal(ctx.resetFightListPending,true);
});
function harness(screen){
 const jobs=new Map(),calls=[];let serial=0;
 const ctx={currentScreen:screen,sharedSocialStatus:'ready',sharedSocialRefreshTimer:null,fight:null,combatLocked:false,setTimeout:(fn,ms)=>{assert.equal(ms,30000);jobs.set(++serial,fn);return serial},clearTimeout:id=>jobs.delete(id),connectSharedSocial:force=>calls.push(force)};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function scheduleSharedSocialRefresh('),source.indexOf('  async function connectSharedSocial(')),ctx);
 return {ctx,jobs,calls,tick(){const [id,fn]=jobs.entries().next().value;jobs.delete(id);fn()}};
}
test('rankings and feed share a single 30-second refresh timer',()=>{
 for(const screen of ['fight','feed']){const h=harness(screen);h.ctx.scheduleSharedSocialRefresh();h.ctx.scheduleSharedSocialRefresh();assert.equal(h.jobs.size,1);h.tick();assert.deepEqual(h.calls,[true])}
 for(const screen of ['home','gym','gear']){const h=harness(screen);h.ctx.scheduleSharedSocialRefresh();assert.equal(h.jobs.size,0)}
});
test('rankings defer refresh during a matchup and resume after it closes',()=>{
 const h=harness('fight');h.ctx.fight={};h.ctx.scheduleSharedSocialRefresh();h.tick();assert.equal(h.calls.length,0);assert.equal(h.jobs.size,1);
 h.ctx.fight=null;h.ctx.combatLocked=true;h.tick();assert.equal(h.calls.length,0);
 h.ctx.combatLocked=false;h.tick();assert.deepEqual(h.calls,[true]);
});
test('pending refresh does not fetch after navigation away',()=>{
 const h=harness('fight');h.ctx.scheduleSharedSocialRefresh();h.ctx.currentScreen='home';h.tick();assert.equal(h.calls.length,0);assert.equal(h.jobs.size,0);
});

test('fight rankings hide unsynced fighters and restore them after sync without changing rank',()=>{
 const nodes=new Map(),shown=[],$=id=>{if(!nodes.has(id))nodes.set(id,{});return nodes.get(id)};
 const waiting={key:'waiting',network:true,statsReady:false,worldRank:2},ready={key:'ready',network:true,statsReady:true,worldRank:5};
 const ctx={$,opponents:[waiting,ready],resetFightListPending:false,visibleFightRankingCount:30,DAILY_FIGHT_LIMIT:12,refreshOpponents(){},sessionsLeft:()=>12,currentRanking:()=>({fighters:[waiting,ready],profile:null,position:0}),combatStatsPending:o=>!o.statsReady,setLimitBadge(){},renderFightLadderRow:o=>{shown.push(o.worldRank);return `<button>${o.key}</button>`}};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function renderOpponents('),source.indexOf('  function resetFightListScroll(')),ctx);
 ctx.renderOpponents();assert.deepEqual(shown,[5]);assert.doesNotMatch($('#opponentList').innerHTML,/>waiting</);assert.match($('#rosterSummary').textContent,/1 RANKED/);
 waiting.statsReady=true;shown.length=0;ctx.renderOpponents();assert.deepEqual(shown,[2,5]);assert.match($('#opponentList').innerHTML,/>waiting</);assert.match($('#rosterSummary').textContent,/2 RANKED/);
});

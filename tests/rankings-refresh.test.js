const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/game.js'),'utf8');
test('opening rankings centers your fighter once without moving later refreshes',()=>{
 const scroller={scrollTop:0,clientHeight:400,getBoundingClientRect:()=>({top:100}),querySelector:()=>({getBoundingClientRect:()=>({top:900,height:80})})};
 const ctx={centerFightRankingPending:true,currentScreen:'fight',fight:null,sharedSocialStatus:'ready',$:()=>scroller};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function centerPlayerInRankings('),source.indexOf('  function maybeLoadMoreFightRankings(')),ctx);
 ctx.centerPlayerInRankings();assert.equal(scroller.scrollTop,640);assert.equal(ctx.centerFightRankingPending,false);
 scroller.scrollTop=250;ctx.centerPlayerInRankings();assert.equal(scroller.scrollTop,250);
 ctx.centerFightRankingPending=true;ctx.fight={};ctx.centerPlayerInRankings();assert.equal(scroller.scrollTop,250);assert.equal(ctx.centerFightRankingPending,true);
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

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

test('fight rankings hide unsynced fighters and restore them after sync in their level groups',()=>{
 const nodes=new Map(),shown=[],$=id=>{if(!nodes.has(id))nodes.set(id,{});return nodes.get(id)};
 const waiting={key:'waiting',network:true,statsReady:false,worldRank:2,tier:10,attributeTotal:40},ready={key:'ready',network:true,statsReady:true,worldRank:5,tier:5,attributeTotal:30};
 const ctx={$,opponents:[waiting,ready],resetFightListPending:false,visibleFightRankingCount:30,DAILY_FIGHT_LIMIT:12,refreshOpponents(){},sessionsLeft:()=>12,currentFighterList:()=>({fighters:[waiting,ready],profile:null,position:0}),combatStatsPending:o=>!o.statsReady,setLimitBadge(){},renderFightLadderRow:o=>{shown.push(o.worldRank);return `<button>${o.key}</button>`}};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function renderOpponents('),source.indexOf('  function resetFightListScroll(')),ctx);
 ctx.renderOpponents();assert.deepEqual(shown,[5]);assert.doesNotMatch($('#opponentList').innerHTML,/>waiting</);assert.match($('#rosterSummary').textContent,/1 FIGHTERS/);
 waiting.statsReady=true;shown.length=0;ctx.renderOpponents();assert.deepEqual(shown,[2,5]);assert.match($('#opponentList').innerHTML,/>waiting</);assert.match($('#rosterSummary').textContent,/2 FIGHTERS/);
});

test('champion precedes Circuit and descending level groups, including the player beyond the loaded window',()=>{
 const labels=new Map(),nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{});return nodes.get(id)};
 const fighter=(id,tier,attributeTotal,extra={})=>({key:id,sourceProfileId:id,network:true,tier,attributeTotal,fighterListOrder:({highest:1,strong:2,weak:3,champ:0})[id],...extra});
 const own={id:'self',level:10,attributeTotal:24};
 const ctx={$,opponents:[fighter('weak',10,900),fighter('champ',3,30,{isChampion:true}),fighter('strong',10,30),fighter('highest',20,30),{key:'circuit',tier:2}],resetFightListPending:false,visibleFightRankingCount:2,DAILY_FIGHT_LIMIT:12,refreshOpponents(){},sessionsLeft:()=>12,currentFighterList:()=>({profile:own,position:5}),combatStatsPending:()=>false,setLimitBadge(){},renderFightLadderRow:(o,fights,position)=>{labels.set(o.key,position);return `<button>${o.key}</button>`},renderPlayerRankingRow:p=>{labels.set('self',p.levelPosition);return '<button>self</button>'}};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function renderOpponents('),source.indexOf('  function resetFightListScroll(')),ctx);
 ctx.renderOpponents();
 const html=$('#opponentList').innerHTML;
 assert.equal(labels.get('highest'),1);assert.equal(labels.get('strong'),1);assert.equal(labels.get('weak'),2);assert.equal(labels.get('self'),3);assert.equal(labels.get('champ'),0);
 assert.deepEqual([...html.matchAll(/<b>(WORLD CHAMPION|ON-LEVEL CAGE CIRCUIT|LEVEL \d+)<\/b>/g)].map(m=>m[1]),['WORLD CHAMPION','ON-LEVEL CAGE CIRCUIT','LEVEL 20','LEVEL 10']);
 assert.deepEqual([...html.matchAll(/<button>([^<]+)<\/button>/g)].map(m=>m[1]),['champ','circuit','highest','strong','self']);
 assert.doesNotMatch(html,/WORLD RANKINGS|YOUR RANK|LEVEL 3</);
 ctx.visibleFightRankingCount=50;ctx.renderOpponents();
 assert.deepEqual([...$('#opponentList').innerHTML.matchAll(/<button>([^<]+)<\/button>/g)].map(m=>m[1]),['champ','circuit','highest','strong','weak','self']);
 own.isChampion=true;ctx.opponents=ctx.opponents.filter(p=>p.key!=='champ');ctx.renderOpponents();
 assert.equal($('#opponentList').innerHTML.match(/<button>self<\/button>/g).length,1);
 assert.ok($('#opponentList').innerHTML.indexOf('<button>self')<$('#opponentList').innerHTML.indexOf('<button>circuit'));
});

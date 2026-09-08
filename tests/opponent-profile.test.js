const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../js/game.js'),'utf8');
function harness(){
 const nodes=new Map(),stages=[],history=[],events=[];
 const $=id=>{if(!nodes.has(id)){const classes=new Set();nodes.set(id,{disabled:false,textContent:'',classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)},setAttribute(){},focus(){}})}return nodes.get(id)};
 const ctx={$,fight:null,combatLocked:false,fightBooking:false,state:{health:100,energy:100},DAILY_FIGHT_LIMIT:10,MINIMUM_FIGHT_HEALTH:20,FIGHT_ENERGY_COST:10,MINIMUM_ACTION_ENERGY_EXCLUSIVE:0,HISTORY_KEY:'test',history:{state:null},combatStatsPending:()=>false,opponentAvailable:()=>true,sessionsLeft:()=>10,hasActionEnergy:()=>true,closeTapeStats(){},closeTapeBreakdown(){},clearFightTimers(){},createFight:o=>({o,rounds:[]}),trackEvent:name=>events.push(name),showFightStage:s=>stages.push(s),fillTape:()=>{$('#opponentProfileFight').disabled=ctx.fightBooking},writeHistory:(...args)=>history.push(args),sfx:{tap(){}},toast(){},initAudio(){},saveState(){},updateUI(){},connectSharedSocial:async()=>true,SHARED_FEED:{},fighterSessionMessage:e=>e.message,LOGIC:{bookFight(state,key,cost){state.energy-=cost;state.pendingFight={key,cost};return {ok:true,energySpent:cost}}}};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function openTaleOfTape('),source.indexOf('  function forfeitFight(')),ctx);
 return {ctx,$,stages,history,events};
}
test('profile inspection and dismissal never book or charge a fight',()=>{
 const h=harness();h.ctx.openTaleOfTape({key:'rookie',name:'Rookie'});
 assert.equal(h.stages.at(-1),'opponentProfileModal');assert.equal(h.ctx.state.energy,100);assert.equal(h.ctx.state.pendingFight,undefined);assert.equal(h.ctx.combatLocked,false);
 h.ctx.closeFightPreview(true);assert.equal(h.ctx.fight,null);assert.equal(h.ctx.state.energy,100);
});
test('Start Fight books once, retains callout context, and opens the committed poster',async()=>{
 const h=harness();h.ctx.openTaleOfTape({key:'rookie',name:'Rookie'},{fromFeed:true,feedChallengePostId:'shared-12'});
 await h.ctx.commitFight();assert.equal(h.stages.at(-1),'tapeStage');assert.equal(h.ctx.combatLocked,true);assert.equal(h.ctx.state.energy,90);assert.equal(h.ctx.fight.feedChallengePostId,'shared-12');
 h.ctx.closeFightPreview(true);assert.ok(h.ctx.fight);await h.ctx.commitFight();assert.equal(h.ctx.state.energy,90);assert.equal(h.events.filter(x=>x==='fight_started').length,1);
});
test('pending title booking blocks duplicate clicks and dismissal; failure restores profile controls',async()=>{
 const h=harness();let reject;h.ctx.SHARED_FEED.beginChampionshipBout=()=>new Promise((resolve,no)=>{reject=no});h.ctx.openTaleOfTape({key:'title',name:'Champion',globalChampionship:true});
 const booking=h.ctx.commitFight();await Promise.resolve();assert.equal(h.ctx.fightBooking,true);assert.equal(h.$('#opponentProfileBack').disabled,true);
 h.ctx.closeFightPreview(true);await h.ctx.commitFight();assert.ok(h.ctx.fight);assert.equal(h.ctx.state.energy,100);
 reject(new Error('Unavailable'));await booking;assert.equal(h.ctx.fightBooking,false);assert.equal(h.$('#opponentProfileBack').disabled,false);assert.equal(h.$('#opponentProfileFight').disabled,false);assert.equal(h.ctx.combatLocked,false);assert.equal(h.stages.at(-1),'opponentProfileModal');
});
test('insufficient energy leaves the profile uncommitted',async()=>{
 const h=harness();h.ctx.hasActionEnergy=()=>false;h.ctx.openTaleOfTape({key:'rookie',name:'Rookie'});await h.ctx.commitFight();assert.equal(h.ctx.state.pendingFight,undefined);assert.equal(h.ctx.combatLocked,false);assert.equal(h.stages.at(-1),'opponentProfileModal');
});
test('profile is a dialog and poster has only its fight-plan action',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const modal=html.slice(html.indexOf('id="opponentProfileModal"'),html.indexOf('id="fightOverlay"'));
 assert.match(modal,/role="dialog" aria-modal="true"/);for(const id of ['opponentProfileAvatar','opponentProfileSkin','opponentProfileStats','tapeAgentRead','opponentProfileBack','opponentProfileFight'])assert.ok(modal.includes(`id="${id}"`));
 const poster=html.slice(html.indexOf('id="tapeStage"'),html.indexOf('id="tapeStatsPanel"'));assert.doesNotMatch(poster,/tapeBackBtn|tapeAgentRead/);assert.match(poster,/class="tape-actions"><button class="tape-action fight" id="tapeFightBtn" type="button">SET FIGHT PLAN<\/button><\/div>/);
});

test('shared attribute chart reports exact totals and resets cleanly for empty stats',()=>{
 const context={formatStat:String};vm.createContext(context);vm.runInContext(source.slice(source.indexOf('  function renderProfileAttributes('),source.indexOf('  function renderOpponentProfile(')),context);
 const chart={style:{},setAttribute(key,value){this[key]=value}},totalLabel={},legend={};
 context.renderProfileAttributes({chart,totalLabel,legend},{power:25,speed:20,chin:10,cardio:7});
 assert.equal(totalLabel.textContent,'62');assert.match(chart.style.background,/conic-gradient/);assert.match(chart['aria-label'],/power 25, speed 20, chin 10, cardio 7/);assert.equal((legend.innerHTML.match(/--attribute-color/g)||[]).length,4);
 context.renderProfileAttributes({chart,totalLabel,legend},{});assert.equal(totalLabel.textContent,'0');assert.equal(chart.style.background,'#30475c');assert.doesNotMatch(legend.innerHTML,/NaN/);
});

test('shared sponsor component keeps only wallpaper and clears it for an unsponsored fighter',()=>{
 const context={sponsorLogo:s=>s.id+'.png'};vm.createContext(context);vm.runInContext(source.slice(source.indexOf('  function renderProfileSponsor('),source.indexOf('  function renderProfileAttributes(')),context);
 const wallpaper={style:{}},surface={classList:{toggle(key,value){this[key]=value}}};
 context.renderProfileSponsor({wallpaper,surface},{id:'volt',brand:'Surge Core'});assert.equal(wallpaper.hidden,false);assert.equal(surface.classList.sponsored,true);assert.match(wallpaper.style.backgroundImage,/volt.png/);
 context.renderProfileSponsor({wallpaper,surface},null);assert.equal(wallpaper.hidden,true);assert.equal(surface.classList.sponsored,false);assert.equal(wallpaper.style.backgroundImage,'');
});

test('unavailable opponents remain inspectable but cannot be booked',async()=>{
 const h=harness();h.ctx.opponentAvailable=()=>false;h.ctx.openTaleOfTape({key:'cooldown',name:'Champion',titleCooldown:true});
 assert.equal(h.stages.at(-1),'opponentProfileModal');await h.ctx.commitFight();assert.equal(h.ctx.state.energy,100);assert.equal(h.ctx.state.pendingFight,undefined);
});
test('fighters awaiting stat sync remain inspectable but cannot be booked',async()=>{
 const h=harness();h.ctx.combatStatsPending=()=>true;h.ctx.openTaleOfTape({key:'pending',name:'Pending fighter'});
 assert.equal(h.stages.at(-1),'opponentProfileModal');await h.ctx.commitFight();assert.equal(h.ctx.state.energy,100);assert.equal(h.ctx.state.pendingFight,undefined);
});

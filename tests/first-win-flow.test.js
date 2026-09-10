const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const LOGIC=require('../js/game-logic.js'),source=fs.readFileSync(require.resolve('../js/game.js'),'utf8');
const stringsContext={};vm.runInNewContext(fs.readFileSync(require.resolve('../js/strings.js'),'utf8'),stringsContext);
const career=()=>({nameLocked:true,name:'Rookie',wins:1,losses:0,level:1,stats:{power:5,speed:5,chin:5,cardio:5},attributePoints:1});
const opponent=(key,power=5,extra={})=>({key,name:key,tier:1,power,speed:5,chin:5,cardio:5,...extra});

test('first-win recommendation picks a fresh on-level circuit match near the build and survives reload',()=>{
 const state=career(),candidates=[opponent('hard',10),opponent('close',4),opponent('even'),opponent('other-level',5,{tier:2})];
 assert.equal(LOGIC.firstWinCircuitOpponent(state,candidates).key,'even');
 assert.equal(LOGIC.firstWinCircuitOpponent(JSON.parse(JSON.stringify(state)),candidates).key,'even');
 for(const patch of [{wins:0},{wins:2},{losses:1},{nameLocked:false},{rookieShowcasePending:true}])assert.equal(LOGIC.firstWinCircuitOpponent({...state,...patch},candidates),null);
 for(const patch of [{network:true},{rookieShowcase:true},{firstContract:true},{globalChampionship:true},{championship:true},{selfProfile:true},{retired:true},{meetings:1}])assert.equal(LOGIC.firstWinCircuitOpponent(state,[opponent('excluded',5,patch)]),null);
 assert.equal(LOGIC.firstWinCircuitOpponent(state,[]),null);
});

test('recommendation UI excludes locked opponents and disappears after the next completed fight',()=>{
 const nodes=new Map(),$=key=>{if(!nodes.has(key))nodes.set(key,{dataset:{}});return nodes.get(key)};
 const ctx={$,LOGIC,state:career(),opponents:[opponent('locked'),opponent('fresh',4)],opponentAvailable:o=>o.key!=='locked'};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function renderFirstWinNextFight('),source.indexOf('  function renderOpponents(')),ctx);
 ctx.renderFirstWinNextFight();assert.equal($('#firstWinNextFight').hidden,false);assert.equal($('#firstWinNextButton').dataset.fightKey,'fresh');
 ctx.state.losses++;ctx.renderFirstWinNextFight();assert.equal($('#firstWinNextFight').hidden,true);
 ctx.state.losses=0;ctx.opponents=[opponent('locked')];ctx.renderFirstWinNextFight();assert.equal($('#firstWinNextFight').hidden,true);
});

test('first win always selects a personal message even when the random roll would skip ordinary texts',()=>{
 const ctx={STRINGS:stringsContext.CAGE_STRINGS,state:career(),lastPostFightTextContactId:'mom',clamp:LOGIC.clamp,rint:()=>0,Math:{...Math,random:()=>1},copyText:(text,values)=>text.replace('{name}',values.name)};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function selectPostFightText('),source.indexOf('  function showPendingPostFightText(')),ctx);
 const message=ctx.selectPostFightText({firstCareerWin:true,won:true,lowerLevelWin:true});
 assert.equal(message.contact.id,'mom');assert.match(message.messages[0],/@Rookie/);assert.equal(message.messages.length,2);
 assert.equal(ctx.selectPostFightText({won:true,winStreak:2}),null);
 assert.equal(ctx.selectPostFightText({firstCareerWin:true,won:true,forfeited:true}),null);
 assert.equal(ctx.selectPostFightText({firstCareerWin:true,won:false}),null);
});

test('result upgrade spends and saves exactly one permanent point and rejects a second click',()=>{
 const nodes=new Map(),$=key=>{if(!nodes.has(key))nodes.set(key,{focus(){this.focused=true}});return nodes.get(key)};
 let saves=0,updates=0;
 const ctx={$,LOGIC,state:career(),fight:{firstCareerWin:true},saveState:()=>saves++,flashAttributeStats(){},trackEvent(){},sfx:{level(){}},toast(){},updateUI:()=>updates++};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function assignAttribute('),source.indexOf('  function ensureFighterDraft(')),ctx);
 ctx.assignAttribute('power');ctx.assignAttribute('power');
 assert.equal(ctx.state.stats.power,6);assert.equal(ctx.state.attributePoints,0);assert.equal(saves,1);assert.equal(updates,1);
 assert.equal($('#continueBtn').focused,true);assert.match($('#postFightTutorialReward').textContent,/Upgrade saved/);
 const restored=JSON.parse(JSON.stringify(ctx.state));assert.equal(restored.stats.power,6);assert.equal(restored.attributePoints,0);
});

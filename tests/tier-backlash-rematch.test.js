const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const logic=require('../js/game-logic.js'),history=require('../js/fight-history.js'),source=fs.readFileSync(require.resolve('../js/game.js'),'utf8');
test('same-tier wins avoid Aura and follower penalties across lower, equal and higher levels',()=>{
 for(const opponentLevel of [10,11,12])for(const exhausted of [false,true]){
  const context={playerLevel:11,opponentLevel,tierHighestLevel:15,won:true,exhausted};
  assert.equal(logic.lowerLevelFollowerPenalty(1000,context),0);
  assert.ok(logic.auraFightChange(context)>0);
  assert.notEqual(logic.matchupAdvice(context).headline,'FAN BACKLASH');
 }
 const base={playerLevel:11,opponentLevel:10,tierHighestLevel:15};
 assert.equal(logic.auraFightChange({...base,won:false}),-7);
 assert.equal(logic.auraFightChange({...base,forfeited:true}),-10);
 assert.equal(logic.auraFightChange({...base,won:true,callout:true}),5);
 assert.equal(logic.auraFightChange({...base,won:true,titleWon:true}),10);
 for(const context of [{...base,circuit:true},{...base,tierHighestLevel:18},{...base,opponentLevel:9}]){
  assert.ok(logic.lowerLevelFollowerPenalty(1000,{...context,won:true})>0);
  assert.ok(logic.auraFightChange({...context,won:true})<0);
 }
});
test('same-tier previews retain the zero-XP notice without inventing backlash',()=>{
 const ctx={LOGIC:logic,state:{level:11,stats:{power:5,speed:5,chin:5,cardio:5}},rankingProfiles:()=>[{level:15}],fightRewardRanks:()=>({}),opponentWinsToday:()=>0,fightRewardTier:()=>({tier:'lower_level'}),fightRule:(key,fallback)=>fallback};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function highestRosterLevel('),source.indexOf('  function renderFightLadderRow(')),ctx);
 const opponent={network:true,tier:10,power:5,speed:5,chin:5,cardio:5};
 const preview=ctx.fightWinRewardPreview(opponent);
 assert.equal(preview.points,1);assert.equal(preview.xp,0);assert.equal(preview.xpPenalty,false);
 assert.equal(preview.xpNote,'LOWER LEVEL · NO XP');
 const lowerTier=ctx.fightWinRewardPreview({...opponent,tier:9});
 assert.equal(lowerTier.xpPenalty,true);assert.match(lowerTier.xpNote,/-5% FOLLOWERS/);
});
test('24-hour rematch locks cover wins, losses and forfeits and cross midnight',()=>{
 const at=Date.parse('2026-09-10T03:55:00Z'),day=24*60*60*1000,opponent={sourceProfileId:'fighter-id',key:'network-fighter-id',networkHandle:'NewName'};
 for(const [won,method] of [[true,'KO'],[false,'SUBMISSION'],[false,'FORFEIT']]){
  const entries=[{date:at,won,method,opponent:'OldName',opponentId:'fighter-id'}];
  assert.equal(history.rematchRemaining(entries,opponent,at),day);
  assert.equal(history.rematchRemaining(entries,opponent,at+10*60000),day-10*60000);
  assert.equal(history.rematchRemaining(entries,opponent,at+day-1),1);
  assert.equal(history.rematchRemaining(entries,opponent,at+day),0);
  assert.equal(history.rematchRemaining(history.normalize(JSON.parse(JSON.stringify(entries))),opponent,at+1000),day-1000);
 }
});
test('rematch identity supports legacy names without blocking different known fighter IDs',()=>{
 const at=1000000,opponent={sourceProfileId:'a',key:'network-a',networkHandle:'SameName'};
 assert.ok(history.rematchRemaining([{date:at,won:true,opponent:'@SAMENAME'}],opponent,at)>0);
 assert.equal(history.rematchRemaining([{date:at,won:true,opponent:'SameName',opponentId:'b'}],opponent,at),0);
 assert.equal(history.rematchRemaining([null,{won:true,date:Infinity},{}],opponent,at),0);
 const entries=history.append([],{winner:'opp',method:'KO',o:{name:'Circuit',key:'circuit-1'}},at);
 assert.ok(history.rematchRemaining(entries,{name:'Circuit',key:'circuit-1'},at)>0);
 assert.equal(history.rematchRemaining(entries,{name:'Circuit',key:'circuit-2'},at),0);
});
test('rematch countdown refreshes and unlocks roster and preview when time expires',()=>{
 let now=1000,roster=0,preview=0;const node={dataset:{rematchUntil:62000},textContent:''};
 const ctx={Date:{now:()=>now},combatLocked:false,fight:{},fightBooking:false,$$:()=>[node],renderOpponents:()=>roster++,fillTape:()=>preview++};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function rematchTimeLabel('),source.indexOf('  function opponentAvailable(')),ctx);
 ctx.updateRematchClocks();assert.equal(node.textContent,'REMATCH IN 0H 2M');assert.equal(roster,0);
 now=62000;ctx.updateRematchClocks();assert.equal(roster,1);assert.equal(preview,1);
 ctx.combatLocked=true;ctx.updateRematchClocks();assert.equal(roster,1);
});

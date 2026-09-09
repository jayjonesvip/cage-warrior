const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const history=require('../js/fight-history.js'),logic=require('../js/game-logic.js');
const stats=n=>({power:n,speed:n,chin:n,cardio:n});
test('finish percentages count known wins and isolate the Circuit opponent',()=>{
 const entries=['KO','TKO','SUBMISSION','DECISION','Unknown'].map((method,i)=>({date:i+1,won:true,method,opponent:'Rival'}));
 entries.push({date:6,won:false,method:'KO',opponent:'Rival',opponentId:'rival'},{date:7,won:false,method:'SUBMISSION',opponent:'Rival',opponentId:'different'});
 assert.deepEqual(history.finishStats(entries),{wins:4,ko:2,sub:1,dec:1,other:0});
 assert.deepEqual(history.finishStats(entries,{opponent:'Rival',opponentId:'rival'}),{wins:1,ko:1,sub:0,dec:0,other:0});
 assert.equal(history.finishStats([{date:1,won:false,method:'TKO',opponent:'Rival'}],{opponent:'Rival',opponentId:'rival'}).ko,1);
});
test('estimated odds are symmetric, condition-sensitive and bounded without changing fighters',()=>{
 const player=stats(10),opponent=stats(5),before=JSON.stringify(player);
 const odds=logic.matchupOdds({player,opponent}),reverse=logic.matchupOdds({player:opponent,opponent:player});
 assert.equal(odds.playerOdds,'-400');assert.equal(odds.opponentOdds,'+400');
 assert.equal(reverse.playerOdds,odds.opponentOdds);assert.equal(reverse.opponentOdds,odds.playerOdds);
 assert.equal(logic.matchupOdds({player,opponent:player}).playerOdds,'+100');
 assert.ok(logic.matchupOdds({player,opponent,playerCondition:20}).playerProbability<odds.playerProbability);
 assert.equal(logic.matchupOdds({player:stats(10000),opponent:stats(1)}).playerProbability,.95);
 assert.equal(logic.matchupOdds({player,opponent:null}),null);assert.equal(JSON.stringify(player),before);
});
test('Tale of the Tape renders actual percentages, shared opponent data and unknown states',()=>{
 const source=fs.readFileSync(require.resolve('../js/game.js'),'utf8'),nodes={};
 const ctx={$:id=>nodes[id]||=( {textContent:''}),CAGE_FIGHT_HISTORY:history,LOGIC:logic,state:{socialProfileId:'you',fightHistory:[{date:1,won:true,method:'KO'}]},sharedFinishStats:{opponent:{wins:4,ko:2,sub:1,dec:1,other:0}},combatStatsPending:o=>o.pending};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function renderTapeMatchupStats('),source.indexOf('  function fillTape(')),ctx);
 const fight={o:{network:true,sourceProfileId:'opponent'},player:stats(10),opp:stats(5)};
 ctx.renderTapeMatchupStats(fight);
 assert.equal(nodes['#tapePKo'].textContent,'100%');assert.equal(nodes['#tapeOKo'].textContent,'50%');assert.equal(nodes['#tapeOSub'].textContent,'25%');assert.equal(nodes['#tapePOdds'].textContent,'-400');
 ctx.renderTapeMatchupStats({...fight,o:{network:true,sourceProfileId:'unknown',pending:true}});
 assert.equal(nodes['#tapeOKo'].textContent,'—');assert.equal(nodes['#tapeOOdds'].textContent,'—');
});

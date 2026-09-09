const test=require('node:test'),assert=require('node:assert/strict'),logic=require('../js/game-logic.js');
const stats=n=>({power:n,speed:n,chin:n,cardio:n});
test('fighter order prioritizes level, exact win percentage, wins, then head-to-head',()=>{
 const rows=[{id:'low',level:3,wins:100},{id:'many',level:20,wins:80,losses:20,combat_stats:stats(100)},{id:'few',level:20,wins:8,losses:2},{id:'best',level:20,wins:9,losses:1},{id:'high',level:21,wins:0,losses:100},{id:'tie',level:20,wins:80,losses:20}];
 const h2h=[{fighter_id:'tie',opponent_id:'many',wins:2,losses:1},{fighter_id:'many',opponent_id:'tie',wins:1,losses:2},{fighter_id:'few',opponent_id:'best',wins:9,losses:0}];
 for(const input of [rows,[...rows].reverse()])assert.deepEqual(logic.orderFighters(input,null,1000,h2h).map(p=>p.id),['high','best','tie','many','few','low']);
 assert.equal(logic.orderFighters([...rows,rows[0]]).length,6);
 assert.equal(logic.orderFighters(rows).find(p=>p.id==='many').attributeTotal,400);
});
test('head-to-head cycles and unplayed ties use stable identity, while draws count in win percentage',()=>{
 const rows=['c','b','a'].map(id=>({id,level:10,wins:5,losses:5})),h2h=[];
 for(const [winner,loser] of [['a','b'],['b','c'],['c','a']])h2h.push({fighter_id:winner,opponent_id:loser,wins:1,losses:0},{fighter_id:loser,opponent_id:winner,wins:0,losses:1});
 for(const input of [rows,[...rows].reverse(),[rows[1],rows[0],rows[2]]])assert.deepEqual(logic.orderFighters(input,null,1000,h2h).map(p=>p.id),['a','b','c']);
 assert.deepEqual(logic.orderFighters(rows).map(p=>p.id),['a','b','c']);
 assert.deepEqual(logic.orderFighters([{id:'draw',level:10,wins:8,draws:2},{id:'clean',level:10,wins:8}]).map(p=>p.id),['clean','draw']);
 // Rounded display percentages must not create a false tie.
 assert.deepEqual(logic.orderFighters([{id:'a',level:10,wins:501,losses:499},{id:'b',level:10,wins:502,losses:498}]).map(p=>p.id),['b','a']);
});
test('only a synced visible undisputed champion is separated from the level order',()=>{
 const rows=[{id:'high',level:50,combat_stats:stats(20)},{id:'champ',level:3,combat_stats:stats(5)}];
 assert.deepEqual(logic.orderFighters(rows,{champion_id:'champ'}).map(p=>p.id),['champ','high']);
 for(const flag of [{interim:true},{is_interim:true},{title_type:'interim'}])assert.equal(logic.orderFighters(rows,{champion_id:'champ',...flag})[0].id,'high');
 for(const flag of [{combat_stats:null},{hidden:true}])assert.equal(logic.orderFighters([rows[0],{...rows[1],...flag}],{champion_id:'champ'})[0].id,'high');
});
test('attribute totals use complete valid combat snapshots and safe legacy fallbacks',()=>{
 assert.equal(logic.fighterAttributeTotal({seeded:true,...stats(7)}),28);
 for(const combat_stats of [null,{power:10},{...stats(2),cardio:0},{...stats(2),speed:1.5}])assert.equal(logic.fighterAttributeTotal({combat_stats,attribute_total:35}),35);
 assert.equal(logic.fighterAttributeTotal({level:6}),25);
});

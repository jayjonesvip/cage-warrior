const test=require('node:test'),assert=require('node:assert/strict'),logic=require('../js/game-logic.js');
const stats={power:10,speed:10,chin:10,cardio:10};
const row=(rank,won=true,extra={})=>logic.rankingFightEntry({opponentRank:rank,ranked:rank>0,won,playerLevel:10,opponentLevel:10,...extra});
const fighter=(id,wins,losses,history=[],extra={})=>({id,handle:id,level:10,wins,losses,attributeTotal:40,combat_stats:stats,rankingHistory:history,...extra});
test('prospect beats a zero-win high-attribute fighter without empty best-win slots',()=>{
 const prospect=fighter('prospect',3,0,[row(25),row(25),row(25)]),raw=fighter('raw',0,8,Array.from({length:8},()=>row(0,false)),{attributeTotal:150});
 assert.equal(logic.rankFighters([raw,prospect])[0].id,'prospect');assert.equal(logic.rankingComponents(prospect).qualityScore,row(25).quality);
});
test('40–8 circuit farmer stays outside top 15 against eighteen-and-two contenders',()=>{
 const contenders=Array.from({length:18},(_,i)=>fighter('contender-'+i,18,2,[...Array.from({length:2},()=>row(20,false)),...Array.from({length:18},()=>row(25))]));
 const farmer=fighter('farmer',40,8,Array.from({length:30},()=>row(0)),{attributeTotal:150});
 assert.ok(logic.rankFighters([...contenders,farmer]).findIndex(f=>f.id==='farmer')>=15);
});
test('beating the immediately higher fighter can move you ahead',()=>{
 const higher=fighter('a',10,2,Array.from({length:10},()=>row(25))),challenger=fighter('z',10,2,Array.from({length:10},()=>row(26)));
 assert.equal(logic.rankFighters([challenger,higher])[0].id,'a');
 const snapshot=logic.rankingFightSnapshot({opponentRank:1,ranked:true,playerLevel:10,opponentLevel:10});
 const improved={...challenger,wins:11,rankingHistory:logic.appendRankingResult(challenger.rankingHistory,snapshot,'win-event','win')};
 assert.equal(logic.rankFighters([improved,higher])[0].id,'z');
});
test('an elite loss hurts form less than a circuit loss; every win beats every loss',()=>{
 const score=(rank,won)=>logic.rankingComponents(fighter('p',8,2,[row(rank,won)])).recentScore;
 assert.equal(score(1,false),38.5);assert.equal(score(0,false),16);assert.equal(score(1,true),97.5);assert.equal(score(0,true),60);assert.ok(score(0,true)>score(1,false));
});
test('booked snapshots survive live rank changes and repeated settlement',()=>{
 const opponent={opponentRank:5,opponentLevel:12,playerLevel:10,ranked:true},snapshot=logic.rankingFightSnapshot(opponent),before=JSON.stringify(snapshot);opponent.opponentRank=999;opponent.opponentLevel=99;
 const history=logic.appendRankingResult([],snapshot,'event','win'),again=logic.appendRankingResult(history,snapshot,'event','win');assert.equal(JSON.stringify(snapshot),before);assert.deepEqual(history,again);assert.equal(history[0].opponent_rank_at_booking,5);
 assert.equal(logic.rankingComponents({wins:1,rankingHistory:history}).qualityScore,snapshot.quality_points);
});
test('only visible synced undisputed champion locks first, with vacant and interim titles unlocked',()=>{
 const champion=fighter('champ',1,20,[row(0,false)]),best=fighter('best',18,2,[row(1)]);assert.ok(logic.rankingComponents(best).score>logic.rankingComponents(champion).score);
 assert.equal(logic.rankFighters([best,champion],{champion_id:'champ'})[0].id,'champ');
 for(const title of [null,{champion_id:''},{champion_id:'champ',interim:true}])assert.equal(logic.rankFighters([best,champion],title)[0].id,'best');
 for(const changed of [{...champion,combat_stats:null},{...champion,hidden:true}])assert.equal(logic.rankFighters([best,changed],{champion_id:'champ'})[0].id,'best');
});
test('identical records swap order with booked opponent quality, while renamed handles do not break ties',()=>{
 const a=fighter('a',10,2,[row(1)]),b=fighter('b',10,2,[row(50)]);assert.equal(logic.rankFighters([b,a])[0].id,'a');[a.rankingHistory,b.rankingHistory]=[b.rankingHistory,a.rankingHistory];assert.equal(logic.rankFighters([a,b])[0].id,'b');
 b.rankingHistory=a.rankingHistory;a.handle='ZZZ';b.handle='AAA';assert.equal(logic.rankFighters([b,a])[0].id,'a');
});
test('decay is based on eligible fight position with exact 8/18/30 boundaries',()=>{
 const result=logic.rankingComponents(fighter('p',30,0,Array.from({length:30},()=>row(1))));
 const expected=(8*95+10*95*.7+12*95*.4)/30;assert.ok(Math.abs(result.qualityScore-(95*.7+expected*.3))<1e-9);
 assert.deepEqual(result.debug.bestDecayedWins.map(r=>r.decay),[1,1,1,1,1]);
});
test('draws enter the smoother as half a win; excluded results never consume windows',()=>{
 const history=[row(1),...Array.from({length:40},()=>({outcome:'dq',quality_points:95})),{outcome:'draw',quality_points:50}];
 const result=logic.rankingComponents(fighter('p',1,1,history,{draws:2}));assert.equal(result.provenWinPercentage,.5);assert.equal(result.fights,4);assert.equal(result.debug.lastTenForm.length,2);assert.equal(result.debug.lastTenForm[1].formPoints,50);assert.equal(result.qualityScore,95);
 for(const outcome of ['nc','no contest','vacate','dq']){assert.equal(logic.normalizeRankingHistory([{outcome,quality:95}]).length,0);assert.equal(logic.normalizeRankingHistory([{outcome:'loss',method:outcome,quality:95}]).length,0)}
});
test('no history uses quality 20 and smoothed form; live base pillar caps at 150',()=>{
 const empty=logic.rankingComponents(fighter('p',0,0,[]));assert.equal(empty.qualityScore,20);assert.equal(empty.recentScore,50);assert.equal(empty.provenWinPercentage,.5);
 const p=fighter('p',5,2,[row(10)],{attributeTotal:150});assert.equal(logic.rankingComponents(p).skillScore,100);assert.equal(logic.rankingComponents({...p,attributeTotal:500}).skillScore,100);
 assert.equal(logic.rankingComponents({...p,combat_stats:{power:999,speed:999,chin:999,cardio:999},aura:100,followers:1e9}).score,logic.rankingComponents(p).score);
});
test('debug dump explains all four pillars without changing state',()=>{
 const p=fighter('debug',4,2,[row(1),row(0,false)]),before=JSON.stringify(p),logs=[],dump=logic.rankingDebug(p,d=>logs.push(d));assert.equal(logs.length,1);assert.equal(dump.fighterId,'debug');assert.equal(dump.score,logic.rankingComponents(p).score);assert.equal(Object.keys(dump.pillars).length,4);assert.equal(JSON.stringify(p),before);
});

test('stored fight history preserves booking metadata through append and reload',()=>{
 const history=require('../js/fight-history.js'),snapshot=logic.rankingFightSnapshot({opponentRank:5,ranked:true,playerLevel:10,opponentLevel:12});
 const fight={winner:'player',resultId:'11111111-1111-4111-8111-111111111111',rankingSnapshot:snapshot,o:{name:'Opponent'},method:'DECISION',finishRound:3};
 const saved=history.append([],fight,1000),restored=history.normalize(JSON.parse(JSON.stringify(saved)));
 assert.equal(restored[0].quality_points,snapshot.quality_points);assert.equal(restored[0].opponent_rank_at_booking,5);assert.equal(restored[0].opponent_level_at_booking,12);
});
test('ranking snapshot normalization never rerates legacy rows or replaces an existing result',()=>{
 const legacy=logic.normalizeRankingHistory([{won:true,quality:94}]);assert.equal(legacy[0].quality_points,94);assert.equal(legacy[0].opponent_rank_at_booking,null);
 const snapshot=logic.rankingFightSnapshot({opponentRank:5,ranked:true}),first=logic.appendRankingResult([],snapshot,'event','win');
 assert.deepEqual(logic.appendRankingResult(first,{...snapshot,quality_points:20},'event','loss'),first);
});

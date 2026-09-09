const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const logic=require('../js/game-logic.js'),source=fs.readFileSync(require.resolve('../js/game.js'),'utf8');
test('five named tiers divide fifteen levels into three-level bands',()=>{
 assert.deepEqual(logic.fighterTierBands(15),[
  {number:1,name:'New Blood',minLevel:1,maxLevel:3},{number:2,name:'Prospects',minLevel:4,maxLevel:6},
  {number:3,name:'Challengers',minLevel:7,maxLevel:9},{number:4,name:'Contenders',minLevel:10,maxLevel:12},
  {number:5,name:'Elite',minLevel:13,maxLevel:15}
 ]);
 for(let level=1;level<=15;level++)assert.equal(logic.fighterCompetitiveTier(level,15),Math.ceil(level/3));
});
test('uneven level ranges have no gaps or overlap and the highest fighter reaches Elite',()=>{
 for(const highest of [5,6,14,16,17,53,70,99,1000]){
  const bands=logic.fighterTierBands(highest),sizes=bands.map(b=>b.maxLevel-b.minLevel+1);
  assert.equal(bands[0].minLevel,1);assert.equal(bands[4].maxLevel,highest);
  assert.ok(Math.max(...sizes)-Math.min(...sizes)<=1);
  for(let i=1;i<5;i++)assert.equal(bands[i].minLevel,bands[i-1].maxLevel+1);
  for(const band of bands){assert.equal(logic.fighterCompetitiveTier(band.minLevel,highest),band.number);assert.equal(logic.fighterCompetitiveTier(band.maxLevel,highest),band.number)}
  assert.equal(logic.fighterCompetitiveTier(highest,highest),5);
 }
 assert.equal(logic.fighterCompetitiveTier(1,1),1);
 assert.equal(logic.fighterTierBands(null).length,5);
});
test('roster points follow tiers while Circuit and level-based rewards remain unchanged',()=>{
 const context={tierHighestLevel:15};
 for(const [level,points] of [[9,0],[10,1],[11,1],[12,1],[13,2],[15,2]])assert.equal(logic.victoryAttributePointReward(11,level,context),points);
 assert.equal(logic.victoryAttributePointReward(11,10,{...context,circuit:true}),0);
 assert.equal(logic.victoryAttributePointReward(11,11,{...context,circuit:true}),1);
 assert.equal(logic.victoryAttributePointReward(11,12,{...context,circuit:true}),2);
 assert.equal(logic.fightXp({playerLevel:11,opponentLevel:10,won:true,...context}).xp,0);
 const state={level:11,attributePoints:4};
 assert.equal(logic.awardVictoryAttributePoint(state,{...context,opponentLevel:10,won:true}),1);assert.equal(state.attributePoints,5);
 assert.equal(logic.awardVictoryAttributePoint(state,{...context,opponentLevel:15,won:false}),0);
 assert.equal(logic.awardVictoryAttributePoint(state,{...context,opponentLevel:15,won:true,forfeited:true}),0);
 assert.equal(state.attributePoints,5);
});
test('preview and settlement retain booked tiers when the roster or player level changes',()=>{
 let highest=15;
 const ctx={LOGIC:logic,state:{level:10,stats:{power:5,speed:5,chin:5,cardio:5},attributePoints:0},rankingProfiles:()=>[{level:highest},{level:500,retired_at:'retired'},{level:900,active:false}],fightRewardRanks:()=>({}),opponentWinsToday:()=>0,fightRewardTier:()=>({tier:'full'}),fightRule:(key,fallback)=>fallback};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function highestRosterLevel('),source.indexOf('  function renderFightLadderRow(')),ctx);
 const opponent={network:true,tier:9,power:5,speed:5,chin:5,cardio:5},booked=ctx.attributeRewardContext(opponent);
 assert.equal(booked.tierHighestLevel,15);assert.equal(ctx.fightWinRewardPreview(opponent,booked).points,0);
 highest=20;assert.equal(ctx.fightWinRewardPreview(opponent).points,1);
 ctx.state.level=20;assert.equal(ctx.fightWinRewardPreview(opponent,booked).points,0);
 assert.equal(logic.awardVictoryAttributePoint(ctx.state,{...booked,won:true}),0);
 assert.match(source,/attributeRewardContext:attributeRewardContext\(o\)/);
 assert.match(source,/awardVictoryAttributePoint\(state,\{[^}]*\.\.\.fight\.attributeRewardContext\}\)/);
 assert.match(source,/fightWinRewardPreview\(f\.o,f\.attributeRewardContext\)/);
});
test('every matchup in the player tier receives the green highlight and YOUR TIER badge',()=>{
 const ctx={LOGIC:logic,state:{level:11},attributeRewardContext:()=>({tierHighestLevel:15}),fightWinRewardPreview:()=>({points:1,xp:0}),combatStatsPending:()=>false,silhouetteForOpponent:()=>'',escapeHtml:String,opponentCountry:()=>({name:'USA'}),opponentCountryBadge:()=>''};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function renderFightLadderRow('),source.indexOf('  function renderPlayerRankingRow(')),ctx);
 for(const level of [10,11,12]){
  const html=ctx.renderFightLadderRow({network:true,tier:level,wins:1,losses:0},12,1);
  assert.match(html,/fight-ranking-row same-level/);assert.match(html,/>YOUR TIER</);
 }
 for(const level of [9,13])assert.doesNotMatch(ctx.renderFightLadderRow({network:true,tier:level,wins:1,losses:0},12,1),/same-level|YOUR TIER/);
 assert.match(ctx.renderFightLadderRow({tier:11,wins:1,losses:0},12),/>YOUR LEVEL</);
});

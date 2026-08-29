'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
global.CAGE_FIGHT_RULES=require('../js/fight-rules.js');
const logic=require('../js/game-logic.js');

const defaults={level:1,xp:0,fans:0,wins:0,losses:0,winStreak:0,bestStreak:0,attributePoints:0,maxEnergy:100,energy:100,maxHealth:100,health:100,hype:0,stats:{power:5,speed:5,chin:5,cardio:5},lastSave:0};
const state=(overrides={})=>Object.assign(structuredClone(defaults),overrides);

test('core migration preserves career data and adds simplified fields',()=>{
  const raw={level:4,xp:22,fans:900,wins:8,losses:2,energy:47.9,health:81,stats:{power:9.4,speed:7.6,chin:8,cardio:6},cash:999,careerEarnings:1200,trainerOn:true,trainingInjury:{id:'knee'},roster:[]};
  const migrated=logic.normalizeCoreState(structuredClone(raw),defaults,raw);
  assert.equal(migrated.level,4);
  assert.equal(migrated.wins,8);
  assert.equal(migrated.energy,47);
  assert.deepEqual(migrated.stats,{power:9,speed:8,chin:8,cardio:6});
  assert.equal(migrated.attributePoints,0);
  assert.ok(Number.isFinite(migrated.energyRecoveryAt));
  assert.ok(Number.isFinite(migrated.healthRecoveryAt));
  for(const key of ['cash','careerEarnings','trainerOn','trainingInjury'])assert.equal(key in migrated,false,key);
});

test('migration clears interrupted legacy activity sessions',()=>{
  const raw=state({activeTraining:{endsAt:1},trainingSession:{},activeRecovery:{},recoverySession:{},restSession:{},activeHustle:{},hustleSession:{},publicitySession:{},autographSession:{},activeActivity:'train',activitySession:{}});
  const migrated=logic.normalizeCoreState(structuredClone(raw),defaults,raw);
  for(const key of ['activeTraining','trainingSession','activeRecovery','recoverySession','restSession','activeHustle','hustleSession','publicitySession','autographSession','activeActivity','activitySession'])assert.equal(key in migrated,false,key);
});

test('first-fight tutorial migration hides guidance for established careers',()=>{
  assert.equal(logic.normalizeCoreState(state({wins:0,losses:0}),defaults,{wins:0,losses:0}).postFightTutorialSeen,false);
  assert.equal(logic.normalizeCoreState(state({wins:1,losses:0}),defaults,{wins:1,losses:0}).postFightTutorialSeen,true);
  assert.equal(logic.normalizeCoreState(state({wins:0,losses:0}),defaults,{wins:0,losses:0,postFightTutorialSeen:true}).postFightTutorialSeen,true);
});

test('legacy saves seed passive recovery from their existing save timestamp',()=>{
  const lastSave=Date.now()-5000,raw=state({energy:50,health:50,lastSave});
  const migrated=logic.normalizeCoreState(structuredClone(raw),defaults,raw);
  assert.equal(migrated.energyRecoveryAt,lastSave);
  assert.equal(migrated.healthRecoveryAt,lastSave);
});

test('Energy remains continuous and is never normalized to battery quarters',()=>{
  const migrated=logic.normalizeCoreState(state({energy:63.8}),defaults,{energy:63.8});
  assert.equal(migrated.energy,63);
});

test('passive Energy recovers one point every five seconds',()=>{
  const fighter=state({energy:90,health:100,energyRecoveryAt:1000,healthRecoveryAt:1000});
  assert.deepEqual(logic.passiveRecovery(fighter,16000),{energy:3,health:0});
  assert.equal(fighter.energy,93);
  assert.equal(fighter.energyRecoveryAt,16000);
});

test('equipped gear interval can reduce Energy recovery to four seconds',()=>{
  const fighter=state({energy:90,health:100,energyRecoveryAt:1000,healthRecoveryAt:1000});
  const result=logic.passiveRecovery(fighter,13000,28_800_000,{energy:4000});
  assert.equal(result.energy,3);
  assert.equal(fighter.energy,93);
});

test('passive Health recovers one point every minute',()=>{
  const fighter=state({energy:100,health:90,energyRecoveryAt:1000,healthRecoveryAt:1000});
  assert.deepEqual(logic.passiveRecovery(fighter,181000),{energy:0,health:3});
  assert.equal(fighter.health,93);
});

test('offline recovery restores both resources without exceeding maximums',()=>{
  const fighter=state({energy:98,health:99,energyRecoveryAt:1000,healthRecoveryAt:1000});
  const result=logic.passiveRecovery(fighter,601000);
  assert.deepEqual(result,{energy:2,health:1});
  assert.equal(fighter.energy,100);
  assert.equal(fighter.health,100);
});

test('offline recovery cap limits long absences',()=>{
  const fighter=state({energy:0,health:0,energyRecoveryAt:1,healthRecoveryAt:1});
  const now=100_000_000;
  logic.passiveRecovery(fighter,now,60_000);
  assert.equal(fighter.energy,12);
  assert.equal(fighter.health,1);
});

test('future timestamps from clock changes do not grant recovery',()=>{
  const fighter=state({energy:50,health:50,energyRecoveryAt:20_000,healthRecoveryAt:20_000});
  assert.deepEqual(logic.passiveRecovery(fighter,10_000),{energy:0,health:0});
  assert.equal(fighter.energyRecoveryAt,10_000);
  assert.equal(fighter.healthRecoveryAt,10_000);
});

test('full recovery time accounts for a partially elapsed interval',()=>{
  assert.equal(logic.recoveryTimeRemaining(97,100,1000,5000,3000),13_000);
  assert.equal(logic.recoveryTimeRemaining(100,100,1000,5000,3000),0);
});

test('spending Energy starts the charging timestamp when leaving full',()=>{
  const fighter=state({energyRecoveryAt:100});
  assert.equal(logic.spendEnergy(fighter,25,5000),25);
  assert.equal(fighter.energy,75);
  assert.equal(fighter.energyRecoveryAt,5000);
});

test('victory Attribute Points scale with opponent level',()=>{
  const fighter=state({level:5});
  assert.equal(logic.victoryAttributePointReward(5,4),0);
  assert.equal(logic.victoryAttributePointReward(5,5),1);
  assert.equal(logic.victoryAttributePointReward(5,6),2);
  assert.equal(logic.awardVictoryAttributePoint(fighter,{won:true,playerLevel:5,opponentLevel:4}),0);
  assert.equal(logic.awardVictoryAttributePoint(fighter,{won:true,playerLevel:5,opponentLevel:5}),1);
  assert.equal(logic.awardVictoryAttributePoint(fighter,{won:true,playerLevel:5,opponentLevel:6}),2);
  assert.equal(fighter.attributePoints,3);
  assert.equal(logic.awardVictoryAttributePoint(fighter,{won:false}),0);
  assert.equal(logic.awardVictoryAttributePoint(fighter,{won:true,forfeited:true}),0);
  assert.equal(fighter.attributePoints,3);
});

test('matchup advice distinguishes low-return, right-sized, step-up, and dangerous fights',()=>{
  assert.equal(logic.matchupAdvice({playerLevel:5,opponentLevel:4}).headline,'LOW-RETURN FIGHT');
  assert.equal(logic.matchupAdvice({playerLevel:5,opponentLevel:5,playerRating:30,opponentRating:30}).headline,'RIGHT-SIZED FIGHT');
  assert.equal(logic.matchupAdvice({playerLevel:5,opponentLevel:6,playerRating:30,opponentRating:32}).headline,'STEP-UP FIGHT');
  assert.equal(logic.matchupAdvice({playerLevel:5,opponentLevel:7,playerRating:30,opponentRating:40}).headline,'HIGH-RISK FIGHT');
  assert.equal(logic.matchupAdvice({playerLevel:5,opponentLevel:8,titleBout:true}).headline,'YOUR TITLE SHOT');
});

test('Attribute Points assign permanently to one whole-number stat',()=>{
  const fighter=state({attributePoints:2});
  assert.equal(logic.assignAttributePoint(fighter,'power'),true);
  assert.equal(fighter.stats.power,6);
  assert.equal(fighter.attributePoints,1);
  assert.equal(logic.assignAttributePoint(fighter,'invalid'),false);
  assert.equal(logic.assignAttributePoint(fighter,'cardio'),true);
  assert.equal(logic.assignAttributePoint(fighter,'speed'),false);
  assert.equal(fighter.stats.cardio,6);
});

test('sponsors advance sequentially from followers',()=>{
  const sponsors=[{id:'bob',followersRequired:0},{id:'gary',followersRequired:500},{id:'surge',followersRequired:2500}];
  const progress=logic.sponsorProgress(sponsors,2600,['bob']);
  assert.equal(progress.active.id,'surge');
  assert.deepEqual(progress.history,['bob','gary','surge']);
  assert.equal(progress.next,null);
});

test('sponsor migration never moves a career backward',()=>{
  const sponsors=[{id:'bob',followersRequired:0},{id:'gary',followersRequired:500},{id:'surge',followersRequired:2500}];
  const progress=logic.sponsorProgress(sponsors,20,['bob','gary']);
  assert.equal(progress.active.id,'gary');
});

test('share text includes dynamic finish, record, streak and championship',()=>{
  const text=logic.fightWinShareText({opponent:'@VasoJoseMX',method:'KO',round:2,record:'8-2',winStreak:4,titleWon:true});
  assert.match(text,/@VasoJoseMX by KO in round 2/);
  assert.match(text,/record is now 8-2/);
  assert.match(text,/4 wins in a row/);
  assert.match(text,/World Championship/);
  assert.match(text,/https:\/\/cagegrind\.com/);
});

test('booking a fight spends up to 25 Energy and blocks duplicate bookings',()=>{
  const fighter=state({energy:10,pendingFight:null,energyRecoveryAt:0});
  const booking=logic.bookFight(fighter,'opponent',25,5000);
  assert.deepEqual(booking,{ok:true,reason:'',energySpent:10});
  assert.equal(fighter.energy,0);
  assert.equal(logic.bookFight(fighter,'other',25,6000).reason,'pending');
});

test('zero Energy cannot start a fight',()=>{
  const fighter=state({energy:0,pendingFight:null});
  assert.equal(logic.bookFight(fighter,'opponent',25).reason,'energy');
});

test('daily counters retain only the fight count',()=>{
  assert.deepEqual(logic.dailyCountersFor({date:'2026-08-28',fight:4,train:3,hustle:2},'2026-08-28'),{date:'2026-08-28',fight:4});
  assert.deepEqual(logic.dailyCountersFor({},'2026-08-28'),{date:'2026-08-28',fight:0});
});

test('level-up resources raise Health maximum without filling resources',()=>{
  const fighter=state({energy:31,health:42,maxHealth:100});
  logic.applyLevelUpResources(fighter);
  assert.equal(fighter.maxHealth,105);
  assert.equal(fighter.energy,31);
  assert.equal(fighter.health,42);
});

test('fight damage and starting condition remain active',()=>{
  assert.equal(logic.liveFightHealthDamage({finish:'KO'}),12);
  assert.equal(logic.liveFightHealthDamage({finish:'SUBMISSION'}),8);
  assert.equal(logic.liveFightHealthDamage({knockdown:true}),4);
  assert.equal(logic.startingFightCondition(95,100),100);
  assert.ok(logic.startingFightCondition(45,100)<100);
});

test('lower-level opponents award zero XP and same-level runbacks award half',()=>{
  const lower=logic.fightXp({won:true,playerLevel:4,opponentLevel:3});
  const first=logic.fightXp({won:true,playerLevel:4,opponentLevel:4});
  const runback=logic.fightXp({won:true,playerLevel:4,opponentLevel:4,opponentWinsToday:1});
  assert.equal(lower.xp,0);
  assert.equal(runback.xp,Math.round(first.xp*.5));
});

test('rankings place champion first then sort by level and win percentage',()=>{
  const profiles=[{id:'a',handle:'Alpha',level:9,wins:10,losses:0},{id:'b',handle:'Bravo',level:8,wins:2,losses:8},{id:'c',handle:'Champ',level:4,wins:1,losses:2}];
  const ranked=logic.rankFighters(profiles,{champion_id:'c'},25);
  assert.deepEqual(ranked.map(row=>row.id),['c','a','b']);
});

test('on-level opponent ratings track one Attribute Point per expected victory',()=>{
  const expected={1:[3.9,4.1],5:[8.3,8.5],9:[13,13.4],12:[16.9,17.3]};
  for(const [level,[minimum,maximum]] of Object.entries(expected)){
    const rating=logic.generatedOpponentBaseRating(Number(level));
    assert.ok(rating>=minimum&&rating<=maximum,`Level ${level}: ${rating}`);
  }
  const ranked=logic.networkOpponentRatings(12,{power:5,speed:5,chin:5,cardio:5},{power:0,speed:0,chin:0,cardio:0},0);
  assert.deepEqual(ranked,{power:17,speed:17,chin:17,cardio:17});
});

test('fighter creation allocations stay whole and total twenty',()=>{
  const stats=logic.rollFighterAllocation(()=>.42);
  assert.equal(logic.validFighterAllocation(stats),true);
  assert.equal(Object.values(stats).reduce((sum,value)=>sum+value,0),20);
});

test('Victory Pack progress remains capped and eligibility requires an on-level win',()=>{
  assert.equal(logic.nextVictoryPackProgress(3,2),4);
  assert.equal(logic.victoryPackReady(4),true);
  assert.equal(logic.victoryPackWinEligible({playerLevel:4,opponentLevel:4}),true);
  assert.equal(logic.victoryPackWinEligible({playerLevel:4,opponentLevel:3}),false);
});

test('gear drops are validated without economy fields',()=>{
  const drop=logic.normalizeGearDrop({item:{id:'wraps',name:'Wraps',category:'Fight Gear'},rarity:'COMMON',count:1,reason:'VICTORY'});
  assert.equal(drop.item.id,'wraps');
  assert.equal(drop.rarity,'COMMON');
  assert.equal(logic.normalizeGearDrop({item:{},rarity:'COMMON'}),null);
});

test('countdown formatting supports Energy and Health timers',()=>{
  assert.equal(logic.formatCountdown(444000),'00:07:24');
  assert.equal(logic.formatCountdown(0),'00:00:00');
});

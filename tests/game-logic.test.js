'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
global.CAGE_FIGHT_RULES=require('../js/fight-rules.js');
const logic=require('../js/game-logic.js');

const defaults={level:1,xp:0,fans:0,wins:0,losses:0,winStreak:0,bestStreak:0,attributePoints:0,maxEnergy:100,energy:100,maxHealth:100,health:100,aura:0,stats:{power:5,speed:5,chin:5,cardio:5},lastSave:0};
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
  assert.ok(Number.isFinite(migrated.followersUpdatedAt));
  assert.equal(migrated.followersAccrualAura,0);
  for(const key of ['cash','careerEarnings','trainerOn','trainingInjury'])assert.equal(key in migrated,false,key);
});

test('legacy Hype migrates directly to Aura and new careers start at zero',()=>{
  const migrated=logic.normalizeCoreState(state(),defaults,{hype:43});
  const fresh=logic.normalizeCoreState(state(),defaults,{});
  assert.equal(migrated.aura,43);
  assert.equal(migrated.followersAccrualAura,43);
  assert.equal('hype' in migrated,false);
  assert.equal(fresh.aura,0);
});

test('Aura cosmetic titles advance at the intended thresholds',()=>{
  assert.equal(logic.auraTitle(0).label,'UNKNOWN');
  assert.equal(logic.auraTitle(20).label,'GETTING NOTICED');
  assert.equal(logic.auraTitle(40).label,'MAGNETIC');
  assert.equal(logic.auraTitle(60).label,'SUPERSTAR');
  assert.equal(logic.auraTitle(80).label,'ICONIC');
});

test('Aura fight rewards distinguish ordinary, marquee, stale, and callout results',()=>{
  assert.equal(logic.auraFightChange({won:true,playerLevel:5,opponentLevel:5}),2);
  assert.equal(logic.auraFightChange({won:true,playerLevel:5,opponentLevel:4}),-3);
  assert.equal(logic.auraFightChange({won:true,playerLevel:4,opponentLevel:3}),-3);
  assert.equal(logic.auraFightChange({won:true,playerLevel:7,opponentLevel:6}),-3);
  assert.equal(logic.auraFightChange({won:true,playerLevel:4,opponentLevel:5}),5);
  assert.equal(logic.auraFightChange({won:true,playerLevel:7,opponentLevel:8}),14);
  assert.equal(logic.auraFightChange({won:true,playerLevel:5,opponentLevel:5,upset:true}),5);
  assert.equal(logic.auraFightChange({won:true,titleWon:true}),10);
  assert.equal(logic.auraFightChange({won:true,titleDefense:true}),6);
  assert.equal(logic.auraFightChange({won:true,exhausted:true}),-7);
  assert.equal(logic.auraFightChange({won:false}),-7);
  assert.equal(logic.auraFightChange({won:false,forfeited:true}),-10);
  assert.equal(logic.auraFightChange({won:true,callout:true,playerLevel:10,opponentLevel:1}),5);
  assert.equal(logic.auraFightChange({won:false,callout:true}),-10);
});

test('positive Aura growth slows by status while penalties stay at full strength',()=>{
  assert.deepEqual([0,20,40,60,80].map(logic.auraGrowthMultiplier),[1,.8,.6,.4,.25]);
  assert.deepEqual([0,20,40,60,80].map(currentAura=>logic.auraFightChange({won:true,upset:true,currentAura})),[5,4,3,2,1]);
  assert.deepEqual([0,20,40,60,80].map(currentAura=>logic.auraFightChange({won:true,titleWon:true,currentAura})),[10,8,6,4,3]);
  assert.equal(logic.auraFightChange({won:false,currentAura:80}),-7);
  assert.equal(logic.auraFightChange({won:false,forfeited:true,currentAura:80}),-10);
  assert.equal(logic.socialInteractionReward(17,0).aura,3);
  assert.equal(logic.socialInteractionReward(17,60).aura,1);
});

test('lower-level title fights keep their Aura penalty instead of awarding a title bonus',()=>{
  assert.equal(logic.auraFightChange({won:true,titleWon:true,playerLevel:10,opponentLevel:5,currentAura:80}),-10);
  assert.equal(logic.auraFightChange({won:true,titleDefense:true,playerLevel:10,opponentLevel:5,currentAura:80}),-10);
  assert.equal(logic.auraFightChange({won:true,titleDefense:true,playerLevel:10,opponentLevel:10,currentAura:80}),2);
});

test('lower-level Aura penalties use the level gap and never exceed ten',()=>{
  assert.deepEqual([1,2,3,4,5,10].map(gap=>logic.lowerLevelAuraPenalty(20,20-gap)),[3,5,7,9,10,10]);
});

test('social interactions award followers and Aura without reviving Hype',()=>{
  const reward=logic.socialInteractionReward(17);
  assert.deepEqual(reward,{followers:6,aura:3});
  assert.equal('hype' in reward,false);
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

test('first contract unlocks from a Vaso win and migrates a one-win rookie save',()=>{
  assert.equal(logic.firstContractUnlockEligible({won:true,rookieShowcase:true}),true);
  assert.equal(logic.firstContractUnlockEligible({won:false,rookieShowcase:true}),false);
  assert.equal(logic.firstContractPending({nameLocked:true,level:1,wins:1,losses:0}),true);
  assert.equal(logic.firstContractPending({savedPending:false,nameLocked:true,level:1,wins:1,losses:0}),false);
  assert.equal(logic.firstContractPending({nameLocked:true,level:2,wins:1,losses:0}),false);
});

test('legacy saves seed passive recovery from their existing save timestamp',()=>{
  const lastSave=Date.now()-5000,raw=state({energy:50,health:50,lastSave});
  const migrated=logic.normalizeCoreState(structuredClone(raw),defaults,raw);
  assert.equal(migrated.energyRecoveryAt,lastSave);
  assert.equal(migrated.healthRecoveryAt,lastSave);
});

test('legacy saves initialize follower accrual at migration time without a retroactive award',()=>{
  const raw=state({fans:900,aura:50,lastSave:Date.now()-72*3_600_000});
  const migrated=logic.normalizeCoreState(structuredClone(raw),defaults,raw);
  assert.ok(migrated.followersUpdatedAt>raw.lastSave);
  assert.equal(migrated.followersAccrualAura,50);
  assert.equal(logic.passiveFollowerGrowth(migrated,migrated.followersUpdatedAt).followers,0);
  assert.equal(migrated.fans,900);
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

test('passive follower rate scales once per ten Aura',()=>{
  assert.equal(logic.followersPerHour(0),1);
  assert.equal(logic.followersPerHour(9),1);
  assert.equal(logic.followersPerHour(50),6);
  assert.equal(logic.followersPerHour(59),6);
  assert.equal(logic.followersPerHour(100),11);
});

test('passive followers accrue completed hours and preserve partial-hour progress',()=>{
  const hour=3_600_000,fighter=state({fans:10,aura:50,followersUpdatedAt:1000,followersAccrualAura:50});
  assert.deepEqual(logic.passiveFollowerGrowth(fighter,1000+hour+30*60_000),{followers:6,hours:1,rate:6,aura:50,changed:true});
  assert.equal(fighter.fans,16);
  assert.equal(fighter.followersUpdatedAt,1000+hour);
  assert.equal(logic.passiveFollowerGrowth(fighter,1000+2*hour-1).followers,0);
  assert.equal(logic.passiveFollowerGrowth(fighter,1000+2*hour).followers,6);
});

test('passive followers cap offline accrual at 48 hours',()=>{
  const hour=3_600_000,now=1000+72*hour,fighter=state({fans:0,aura:100,followersUpdatedAt:1000,followersAccrualAura:100});
  const result=logic.passiveFollowerGrowth(fighter,now);
  assert.equal(result.hours,48);
  assert.equal(result.followers,528);
  assert.equal(fighter.followersUpdatedAt,now);
  assert.equal(logic.passiveFollowerGrowth(fighter,now).followers,0);
});

test('invalid and backward follower timestamps reset without granting followers',()=>{
  const invalid=state({fans:20,aura:50,followersUpdatedAt:'bad',followersAccrualAura:50}),backward=state({fans:20,aura:50,followersUpdatedAt:20_000,followersAccrualAura:50});
  assert.equal(logic.passiveFollowerGrowth(invalid,10_000).followers,0);
  assert.equal(invalid.followersUpdatedAt,10_000);
  assert.equal(logic.passiveFollowerGrowth(backward,10_000).followers,0);
  assert.equal(backward.followersUpdatedAt,10_000);
  assert.equal(invalid.fans,20);
  assert.equal(backward.fans,20);
});

test('an in-progress follower hour retains its saved Aura rate',()=>{
  const hour=3_600_000,fighter=state({fans:0,aura:0,followersUpdatedAt:1000,followersAccrualAura:0});
  fighter.aura=50;
  assert.equal(logic.passiveFollowerGrowth(fighter,1000+hour/2).followers,0);
  assert.equal(logic.passiveFollowerGrowth(fighter,1000+hour).followers,1);
  assert.equal(fighter.followersAccrualAura,50);
  assert.equal(logic.passiveFollowerGrowth(fighter,1000+2*hour).followers,6);
});

test('passive follower growth accepts an equipped effective Aura value for future hours',()=>{
  const hour=3_600_000,fighter=state({fans:0,aura:10,followersUpdatedAt:1000,followersAccrualAura:10});
  const first=logic.passiveFollowerGrowth(fighter,1000+hour,48*hour,30);
  assert.equal(first.followers,2);
  assert.equal(fighter.followersAccrualAura,30);
  const second=logic.passiveFollowerGrowth(fighter,1000+2*hour,48*hour,30);
  assert.equal(second.followers,4);
});

test('fight followers apply the twenty-five percent reduction without changing forfeits',()=>{
  const base={opponentBaseFollowers:746,aura:50,followerPerks:0,upset:false,rivalry:false,won:true};
  assert.equal(logic.fightFollowerReward({...base,randomMultiplier:.9}),755);
  assert.equal(logic.fightFollowerReward({...base,randomMultiplier:1}),839);
  assert.equal(logic.fightFollowerReward({...base,randomMultiplier:1.2}),1007);
  assert.equal(logic.fightFollowerReward({...base,followerPerks:20,upset:true,rivalry:true,randomMultiplier:1}),1448);
  assert.equal(logic.fightFollowerReward({opponentBaseFollowers:746,won:false}),84);
  assert.equal(logic.fightFollowerReward({opponentBaseFollowers:746,won:false,forfeited:true}),0);
});

test('passive followers immediately affect sponsor eligibility',()=>{
  const hour=3_600_000,fighter=state({fans:499,aura:0,followersUpdatedAt:1000,followersAccrualAura:0}),sponsors=[{id:'bob',followersRequired:0},{id:'gary',followersRequired:500}];
  logic.passiveFollowerGrowth(fighter,1000+hour);
  assert.equal(logic.sponsorProgress(sponsors,fighter.fans).active.id,'gary');
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

test('a lower-level victory costs five percent of current followers',()=>{
  assert.equal(logic.lowerLevelFollowerPenalty(1000,{won:true,playerLevel:5,opponentLevel:4}),50);
  assert.equal(logic.lowerLevelFollowerPenalty(101,{won:true,playerLevel:5,opponentLevel:4}),6);
  assert.equal(logic.lowerLevelFollowerPenalty(1000,{won:true,playerLevel:5,opponentLevel:5}),0);
  assert.equal(logic.lowerLevelFollowerPenalty(1000,{won:false,playerLevel:5,opponentLevel:4}),0);
  assert.equal(logic.lowerLevelFollowerPenalty(1000,{won:true,forfeited:true,playerLevel:5,opponentLevel:4}),0);
});

test('matchup advice distinguishes low-return, right-sized, step-up, and dangerous fights',()=>{
  assert.equal(logic.matchupAdvice({playerLevel:5,opponentLevel:4}).headline,'FAN BACKLASH');
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

test('sponsors drop to the follower-qualified tier without erasing history',()=>{
  const sponsors=[{id:'bob',followersRequired:0},{id:'gary',followersRequired:500},{id:'surge',followersRequired:2500}];
  const progress=logic.sponsorProgress(sponsors,20,['bob','gary']);
  assert.equal(progress.active.id,'bob');
  assert.deepEqual(progress.history,['bob','gary']);
  assert.equal(progress.next.id,'gary');
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
  assert.equal(logic.finalFightHealthLoss({rawDamage:4,won:true,finish:'DECISION'}),5);
  assert.equal(logic.finalFightHealthLoss({rawDamage:0,won:true,finish:'KO'}),5);
  assert.equal(logic.finalFightHealthLoss({rawDamage:3,finish:'UNANIMOUS DECISION'}),10);
  assert.equal(logic.finalFightHealthLoss({rawDamage:12,finish:'UNANIMOUS DECISION'}),15);
  assert.equal(logic.finalFightHealthLoss({rawDamage:9,finish:'SUBMISSION'}),15);
  assert.equal(logic.finalFightHealthLoss({rawDamage:16,finish:'KO'}),20);
  assert.equal(logic.finalFightHealthLoss({rawDamage:24,finish:'TKO'}),30);
  assert.equal(logic.finalFightHealthLoss({rawDamage:0,forfeited:true,finish:'FORFEIT'}),0);
  assert.equal(logic.startingFightCondition(95,100),100);
  assert.ok(logic.startingFightCondition(45,100)<100);
});

test('significant strikes can rock either fighter without making every shot a finish',()=>{
  assert.equal(logic.rockedChance({significant:false,power:20,chin:1,damage:30}),0);
  assert.equal(logic.rockedChance({significant:true,power:5,chin:5,damage:6}),.025);
  assert.equal(logic.rockedChance({significant:true,power:10,chin:5,damage:11,aggressive:true}),.13);
  assert.equal(logic.rockedChance({significant:true,power:99,chin:1,damage:99,aggressive:true}),.16);
});

test('rocked fighters recover from Chin and Cardio or remain vulnerable to a follow-up',()=>{
  assert.equal(logic.rockedRecoveryChance({chin:5,cardio:5,exchangesRocked:1}),.565);
  assert.ok(Math.abs(logic.rockedRecoveryChance({chin:5,cardio:5,exchangesRocked:2})-.765)<Number.EPSILON);
  assert.equal(logic.knockoutFinishChance({targetCondition:50,rocked:false,damage:10,power:10,chin:5}),0);
  assert.ok(logic.knockoutFinishChance({targetCondition:50,rocked:true,damage:10,power:10,chin:5})>.2);
  assert.ok(logic.knockoutFinishChance({targetCondition:50,rocked:true,knockdown:true,damage:10,power:10,chin:5})>.4);
});

test('grappling finish pressure rises against a rocked opponent',()=>{
  const normal=logic.submissionFinishChance({speed:5,opponentSpeed:5,cardio:5,opponentCardio:5,targetCondition:100});
  const rocked=logic.submissionFinishChance({speed:5,opponentSpeed:5,cardio:5,opponentCardio:5,targetCondition:100,rocked:true});
  assert.equal(normal,.07);
  assert.equal(rocked,.14);
});

test('lower-level opponents award zero XP and same-level runbacks award half',()=>{
  const lower=logic.fightXp({won:true,playerLevel:4,opponentLevel:3});
  const first=logic.fightXp({won:true,playerLevel:4,opponentLevel:4});
  const runback=logic.fightXp({won:true,playerLevel:4,opponentLevel:4,opponentWinsToday:1});
  assert.equal(lower.xp,0);
  assert.equal(runback.xp,Math.round(first.xp*.5));
});

test('balanced XP curve slows late-career leveling while preserving early progression',()=>{
  const requirements=[120,160,200,240,280,326,384,454,536,630,736,854,984,1126,1280];
  requirements.forEach((requirement,index)=>assert.equal(logic.xpRequirement(index+1),requirement,`Level ${index+1}`));
  assert.equal(logic.rescaleXpProgress(56,logic.legacyXpRequirement(15),logic.xpRequirement(15)),105);
  assert.equal(logic.rescaleXpProgress(140,logic.legacyXpRequirement(5),logic.xpRequirement(5)),140);
});

test('hybrid rankings keep the champion first and score the remaining field',()=>{
  const profiles=[{id:'a',handle:'Alpha',level:9,wins:10,losses:0},{id:'b',handle:'Bravo',level:8,wins:2,losses:8},{id:'c',handle:'Champ',level:4,wins:1,losses:2}];
  const ranked=logic.rankFighters(profiles,{champion_id:'c'},25);
  assert.deepEqual(ranked.map(row=>row.id),['c','a','b']);
  assert.ok(ranked.every(row=>Number.isFinite(row.rankScore)));
});

test('hybrid ranking rewards opponent quality, recent form, and permanent attributes',()=>{
  const base={level:8,wins:12,losses:8};
  const quality=logic.rankFighters([
    {...base,id:'low-quality',handle:'LowQuality',attributeTotal:40,rankingHistory:[{won:true,quality:35}]},
    {...base,id:'high-quality',handle:'HighQuality',attributeTotal:40,rankingHistory:[{won:true,quality:90}]}
  ],null,25);
  assert.equal(quality[0].id,'high-quality');
  const form=logic.rankFighters([
    {...base,id:'cold',handle:'Cold',attributeTotal:40,rankingHistory:Array.from({length:10},()=>({won:false,quality:50}))},
    {...base,id:'hot',handle:'Hot',attributeTotal:40,rankingHistory:Array.from({length:10},()=>({won:true,quality:50}))}
  ],null,25);
  assert.equal(form[0].id,'hot');
  const skill=logic.rankFighters([
    {...base,id:'developed',handle:'Developed',attributeTotal:80},
    {...base,id:'raw',handle:'Raw',attributeTotal:24}
  ],null,25);
  assert.equal(skill[0].id,'developed');
});

test('hybrid ranking requires a proven record before rewarding an undefeated percentage',()=>{
  const ranked=logic.rankFighters([
    {id:'one-fight',handle:'OneFight',level:1,wins:1,losses:0,attributeTotal:21},
    {id:'prospect',handle:'Prospect',level:5,wins:12,losses:1,attributeTotal:25},
    {id:'veteran',handle:'Veteran',level:15,wins:51,losses:27,attributeTotal:76}
  ],null,25);
  assert.deepEqual(ranked.map(row=>row.id),['veteran','prospect','one-fight']);
  assert.ok(ranked[2].provenWinPercentage<ranked[2].winPercentage);
});

test('ranking fight history grades opponent difficulty deterministically',()=>{
  assert.deepEqual(logic.rankingFightEntry({won:true,playerLevel:10,opponentLevel:10}),{won:true,quality:50});
  assert.deepEqual(logic.rankingFightEntry({won:false,playerLevel:10,opponentLevel:12,ranked:true}),{won:false,quality:75});
  assert.deepEqual(logic.rankingFightEntry({won:true,playerLevel:10,opponentLevel:12,championship:true}),{won:true,quality:85});
});

test('the champion can take normal ranked fights after completing the daily defense',()=>{
  assert.equal(logic.rankedFightTitleMode({playerIsChampion:true,defenseUsedToday:false}),'defense');
  assert.equal(logic.rankedFightTitleMode({playerIsChampion:true,defenseUsedToday:true}),'ranked');
  assert.equal(logic.rankedFightTitleMode({opponentIsChampion:true}),'challenge');
  assert.equal(logic.rankedFightTitleMode({opponentIsChampion:false}),'ranked');
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

test('Cage Circuit ratings preserve distribution within the player-total cap',()=>{
  const player={power:10,speed:10,chin:10,cardio:10},ratings={power:24,speed:16,chin:12,cardio:8};
  const standard=logic.capOpponentRatings(ratings,player,1),rebound=logic.capOpponentRatings(ratings,player,-1);
  assert.equal(Object.values(standard).reduce((sum,value)=>sum+value,0),41);
  assert.equal(Object.values(rebound).reduce((sum,value)=>sum+value,0),39);
  assert.ok(standard.power>standard.speed&&standard.speed>standard.cardio);
  assert.ok(Object.values(standard).every(Number.isInteger));
  assert.deepEqual(logic.capOpponentRatings({power:4,speed:5,chin:4,cardio:5},player,1),{power:4,speed:5,chin:4,cardio:5});
});

test('fighter creation allocations stay whole and total twenty',()=>{
  const stats=logic.rollFighterAllocation(()=>.42);
  assert.equal(logic.validFighterAllocation(stats),true);
  assert.equal(Object.values(stats).reduce((sum,value)=>sum+value,0),20);
});

test('every gear category has exactly two active loadout slots',()=>{
  assert.equal(logic.loadoutCategoryLimit(),2);
  assert.equal(logic.loadoutCategoryLimit(1),2);
  assert.equal(logic.loadoutCategoryLimit(15),2);
});

test('Victory Pack progress remains capped and eligibility requires an on-level win',()=>{
  assert.equal(logic.nextVictoryPackProgress(3,2),4);
  assert.equal(logic.victoryPackReady(4),true);
  assert.equal(logic.victoryPackWinEligible({playerLevel:4,opponentLevel:4}),true);
  assert.equal(logic.victoryPackWinEligible({playerLevel:4,opponentLevel:3}),false);
});

test('gear drops are validated without economy fields',()=>{
  const drop=logic.normalizeGearDrop({item:{id:'heavy-bag',name:'Championship Heavy Bag',category:'Fight Gear'},rarity:'LEGENDARY',count:1,reason:'VICTORY'});
  assert.equal(drop.item.id,'heavy-bag');
  assert.equal(drop.rarity,'LEGENDARY');
  assert.equal(logic.normalizeGearDrop({item:{},rarity:'COMMON'}),null);
});

test('collectible drops exclude owned and level-locked items',()=>{
  const items=[
    {id:'owned',rarity:'COMMON',minLevel:1},
    {id:'new-common',rarity:'COMMON',minLevel:2},
    {id:'new-rare',rarity:'RARE',minLevel:2},
    {id:'locked',rarity:'COMMON',minLevel:4}
  ];
  assert.deepEqual(logic.undiscoveredCollectibles(items,['owned'],2,'COMMON').map(item=>item.id),['new-common']);
  assert.deepEqual(logic.undiscoveredCollectibles(items,['owned'],2).map(item=>item.id),['new-common','new-rare']);
  assert.deepEqual(logic.undiscoveredCollectibles(items,['owned','new-common','new-rare'],2),[]);
});

test('countdown formatting supports Energy and Health timers',()=>{
  assert.equal(logic.formatCountdown(444000),'00:07:24');
  assert.equal(logic.formatCountdown(0),'00:00:00');
});

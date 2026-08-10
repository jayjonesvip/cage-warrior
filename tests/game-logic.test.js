const test = require('node:test');
const assert = require('node:assert/strict');
const logic = require('../game-logic.js');

const defaults = {
  level:1,xp:0,cash:250,careerEarnings:0,fans:0,wins:0,losses:0,winStreak:0,bestStreak:0,
  energy:100,maxEnergy:100,health:100,maxHealth:100,hype:0,
  stats:{power:5,speed:5,chin:5,cardio:5},roster:[],pendingFight:null,lastSave:0,lastDaily:'',
  fighterCity:'',fighterAvatar:'',fighterStyle:'',gear:[]
};

function normalize(raw={}){
  const state=Object.assign(structuredClone(defaults),raw);
  return logic.normalizeCoreState(state,defaults,raw);
}

test('a new game loads with valid default resources',()=>{
  const state=logic.selectStoredState({primary:null,backup:null,legacy:null},normalize,defaults);
  assert.equal(state.level,1);
  assert.equal(state.cash,250);
  assert.equal(state.careerEarnings,0);
  assert.equal(state.energy,100);
  assert.equal(state.health,100);
  assert.deepEqual(state.stats,{power:5,speed:5,chin:5,cardio:5});
});

test('an older save keeps progression and fills newer resource fields',()=>{
  const state=normalize({version:4,name:'OLD SAVE',level:4,wins:7,losses:2,cash:900,stats:{power:11}});
  assert.equal(state.level,4);
  assert.equal(state.wins,7);
  assert.equal(state.losses,2);
  assert.equal(state.careerEarnings,900);
  assert.deepEqual(state.stats,{power:11,speed:5,chin:5,cardio:5});
  assert.equal(state.maxEnergy,100);
  assert.equal(state.health,100);
});

test('invalid and blank primary saves recover a progressed backup',()=>{
  const backup=JSON.stringify({name:'BACKUP FIGHTER',level:4,wins:3,fighterCity:'phoenix',fighterAvatar:'fighter-16',fighterStyle:'counter',gear:[]});
  const invalid=logic.selectStoredState({primary:'{broken',backup,legacy:null},normalize,defaults);
  const blank=logic.selectStoredState({primary:'{}',backup,legacy:null},normalize,defaults);
  assert.equal(invalid.name,'BACKUP FIGHTER');
  assert.equal(blank.name,'BACKUP FIGHTER');
  assert.equal(blank.level,4);
});

test('blank or invalid saves never replace a useful backup',()=>{
  assert.equal(logic.shouldBackupRaw('',normalize),false);
  assert.equal(logic.shouldBackupRaw('{broken',normalize),false);
  assert.equal(logic.shouldBackupRaw('{}',normalize),false);
  assert.equal(logic.shouldBackupRaw(JSON.stringify({level:3,wins:2,fighterCity:'miami'}),normalize),true);
});

test('resources and counters are clamped during save migration',()=>{
  const opponent={key:'valid',name:'VALID FIGHTER',tier:2,min:2,power:6,speed:5,chin:5,cardio:6,reward:100,fans:20};
  const state=normalize({energy:-50,maxEnergy:120,health:999,maxHealth:130,hype:250,cash:-40,fans:-1,stats:{power:-3,speed:'bad',chin:8,cardio:9},roster:[null,{key:'partial'},opponent,'bad'],pendingFight:{key:'rival',cost:900}});
  assert.equal(state.energy,0);
  assert.equal(state.health,130);
  assert.equal(state.hype,100);
  assert.equal(state.cash,0);
  assert.equal(state.fans,0);
  assert.deepEqual(state.stats,{power:1,speed:5,chin:8,cardio:9});
  assert.deepEqual(state.roster,[opponent]);
  assert.equal(state.pendingFight.cost,35);
});

test('fight booking charges ten per started round and protects the scheduled reserve',()=>{
  const state={energy:40,maxEnergy:100,pendingFight:null};
  assert.equal(logic.bookFight(state,'opponent-1',10,1000,30).ok,true);
  assert.equal(state.energy,30);
  assert.deepEqual(state.pendingFight,{key:'opponent-1',cost:10,startedAt:1000});
  assert.equal(logic.bookFight(state,'opponent-1',10,1001,30).reason,'pending');
  assert.equal(logic.chargePendingFightEnergy(state,10),true);
  assert.equal(logic.chargePendingFightEnergy(state,10),true);
  assert.equal(state.energy,10);
  assert.equal(state.pendingFight.cost,30);
  assert.equal(logic.availableFightEnergy(state,0,10),10);
  assert.equal(logic.chargePendingFightEnergy(state,5),true);
  assert.equal(state.pendingFight.cost,35);
  assert.equal(state.energy,5);
  state.pendingFight=null;
  assert.equal(logic.bookFight(state,'opponent-2',10,1002,30).reason,'energy');
  assert.equal(state.energy,5);
});

test('ordinary level ups grant partial recovery while title milestones restore fully',()=>{
  const ordinary={energy:10,maxEnergy:100,health:20,maxHealth:100};
  logic.applyLevelUpResources(ordinary,false);
  assert.deepEqual(ordinary,{energy:40,maxEnergy:103,health:45,maxHealth:105});

  const milestone={energy:10,maxEnergy:100,health:20,maxHealth:100};
  logic.applyLevelUpResources(milestone,true);
  assert.deepEqual(milestone,{energy:103,maxEnergy:103,health:105,maxHealth:105});
});

test('fight and rematch payouts preserve existing formulas',()=>{
  const newOpponent={reward:200,tier:3,lossesToPlayer:0};
  const beatenOpponent={reward:200,tier:2,lossesToPlayer:1};
  assert.equal(logic.payoutForOpponent(newOpponent,3),200);
  assert.equal(logic.payoutForOpponent(beatenOpponent,3),100);
  assert.equal(logic.payoutForOpponent({...beatenOpponent,championship:true},3),200);
  assert.equal(logic.winFightCash({basePurse:200,hype:0,cashBonus:0,winStreak:1,variance:1}),200);
  assert.equal(logic.lossFightCash(200),16);
});

test('opponent availability covers current fights, locked titles, and accepted rematches',()=>{
  const context={level:5,milestones:[],titleOrder:['city','regional','us','world'],hasCity:true};
  assert.equal(logic.opponentAvailable({tier:5,lossesToPlayer:0},context),true);
  assert.equal(logic.opponentAvailable({tier:6,lossesToPlayer:0},context),false);
  assert.equal(logic.opponentAvailable({tier:2,lossesToPlayer:1,rematchAccepted:false},context),false);
  assert.equal(logic.opponentAvailable({tier:2,lossesToPlayer:1,rematchAccepted:true},context),true);
  assert.equal(logic.opponentAvailable({championship:true,titleId:'city',tier:5,titleDefeated:false},context),true);
  assert.equal(logic.opponentAvailable({championship:true,titleId:'regional',tier:5,titleDefeated:false},context),false);
});

test('network opponent ratings combine level, avatar allocation, and archetype without changing balance bounds',()=>{
  const avatar={power:8,speed:6,chin:2,cardio:4},style={power:2,speed:-1,chin:1,cardio:0};
  const levelOne=logic.networkOpponentRatings(1,avatar,style,.7);
  const levelFive=logic.networkOpponentRatings(5,avatar,style,.7);
  assert.deepEqual(levelOne,{power:8,speed:4,chin:5,cardio:4});
  assert.deepEqual(levelFive,{power:15,speed:12,chin:12,cardio:12});
  assert.ok(levelFive.power>levelFive.speed);
  assert.deepEqual(logic.networkOpponentRatings(5,avatar,style,.7),levelFive);
});

test('confirmed fighter interactions award bounded deterministic social rewards',()=>{
  assert.deepEqual(logic.socialInteractionReward(0),{followers:5,hype:1});
  assert.deepEqual(logic.socialInteractionReward(7),{followers:12,hype:1});
  assert.deepEqual(logic.socialInteractionReward(23),{followers:12,hype:3});
  assert.deepEqual(logic.socialInteractionReward(-50),{followers:5,hype:1});
});

test('training quote enforces daily, cash, and energy costs before rewards',()=>{
  const action={cost:20,sessions:2,gain:2};
  assert.equal(logic.trainingQuote({cash:500,energy:50},action,true,75,1).reason,'limit');
  assert.equal(logic.trainingQuote({cash:100,energy:50},action,true,75,4).reason,'cash');
  assert.equal(logic.trainingQuote({cash:500,energy:10},action,true,75,4).reason,'energy');
  assert.deepEqual(logic.trainingQuote({cash:500,energy:50},action,true,75,4),{ok:true,reason:'',sessions:2,cashCost:150,energyCost:20});
  assert.equal(logic.trainingGain(2,false,false),2);
  assert.equal(logic.trainingGain(2,true,true),6);
});

test('recovery treatments share one daily use and clamp restored resources',()=>{
  const ice={energy:25,health:0},sauna={energy:15,health:12},massage={energy:5,health:25},state={cash:100,energy:82,maxEnergy:100,health:94,maxHealth:100};
  assert.equal(logic.recoveryQuote(state,ice,55,true).reason,'limit');
  assert.equal(logic.recoveryQuote({...state,cash:40},ice,55,false).reason,'cash');
  assert.equal(logic.recoveryQuote({cash:100,energy:100,maxEnergy:100,health:100,maxHealth:100},sauna,55,false).reason,'full');
  assert.equal(logic.recoveryQuote(state,sauna,55,false).ok,true);
  assert.deepEqual(logic.applyRecovery(state,sauna),{energy:15,health:6});
  assert.equal(state.energy,97);
  assert.equal(state.health,100);
  assert.deepEqual(logic.applyRecovery({energy:95,maxEnergy:100,health:70,maxHealth:100},massage),{energy:5,health:25});
});

test('blackjack values aces correctly, caps bets, and pays standard outcomes',()=>{
  assert.deepEqual(logic.blackjackHandValue(['AS','KH']),{total:21,soft:true,blackjack:true,bust:false});
  assert.deepEqual(logic.blackjackHandValue(['AS','6H']),{total:17,soft:true,blackjack:false,bust:false});
  assert.deepEqual(logic.blackjackHandValue(['AS','6H','KC']),{total:17,soft:false,blackjack:false,bust:false});
  assert.equal(logic.blackjackHandValue(['KS','QH','2C']).bust,true);
  assert.equal(logic.blackjackBetLimit(403),100);
  assert.deepEqual(logic.blackjackOutcome(['AS','KH'],['9S','9H'],20),{result:'blackjack',payout:50,profit:30,player:{total:21,soft:true,blackjack:true,bust:false},dealer:{total:18,soft:false,blackjack:false,bust:false}});
  assert.equal(logic.blackjackOutcome(['TS','QH'],['9S','9H'],20).payout,40);
  assert.equal(logic.blackjackOutcome(['TS','8H'],['9S','9H'],20).result,'push');
  assert.equal(logic.blackjackOutcome(['TS','8H'],['KS','QH'],20).result,'loss');
});

test('score helpers expose a trailing player for the final-ten-second decision',()=>{
  const rounds=[{scoreP:9,scoreO:10},{scoreP:10,scoreO:9},{scoreP:9,scoreO:10}];
  assert.deepEqual(logic.fightScore(rounds),{player:28,opponent:29});
  assert.equal(logic.playerTrailing(rounds),true);
  rounds[2]={scoreP:10,scoreO:8};
  assert.equal(logic.playerTrailing(rounds),false);
});

test('gear pity guarantees the fourth win without an earlier drop',()=>{
  let count=0;
  for(let win=1;win<=3;win++){
    count=logic.nextGearPityCount(count);
    assert.equal(logic.isGearPity(count),false);
  }
  count=logic.nextGearPityCount(count);
  assert.equal(count,4);
  assert.equal(logic.isGearPity(count),true);
});

test('endorsement progression exposes only the next unsigned deal',()=>{
  const ids=['volt','ironhide','apex'];
  assert.equal(logic.nextEndorsementId(ids,[]),'volt');
  assert.equal(logic.nextEndorsementId(ids,['volt']),'ironhide');
  assert.equal(logic.nextEndorsementId(ids,['volt','ironhide','apex']),'');
});

test('daily counters use local calendar dates, reset once, and clamp tampered limits',()=>{
  const localDate=new Date(2026,0,2,0,30);
  const today=logic.localDateKey(localDate);
  assert.equal(today,'2026-01-02');
  assert.deepEqual(logic.dailyCountersFor({date:'2026-01-01',fight:7,train:4,hustle:3,risk:1,blackjack:1,publicity:2,recovery:1},today),{date:today,fight:0,train:0,hustle:0,risk:0,blackjack:0,publicity:0,recovery:0});
  assert.deepEqual(logic.dailyCountersFor({date:today,fight:99,train:99,hustle:-4,risk:8,blackjack:9,publicity:3,recovery:9},today),{date:today,fight:10,train:4,hustle:0,risk:1,blackjack:1,publicity:2,recovery:1});
});

test('daily reset countdown targets the next local midnight',()=>{
  const now=new Date(2026,7,8,21,34,56,250),next=new Date(2026,7,9,0,0,0,0);
  assert.equal(logic.millisecondsUntilNextLocalDay(now),next-now);
  assert.equal(logic.formatCountdown(next-now),'02:25:04');
  assert.equal(logic.formatCountdown(999),'00:00:01');
  assert.equal(logic.millisecondsUntilNextLocalDay('not-a-date'),0);
});

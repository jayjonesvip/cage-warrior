const test = require('node:test');
const assert = require('node:assert/strict');
const logic = require('../js/game-logic.js');

const defaults = {
  level:1,xp:0,cash:0,careerEarnings:0,fans:0,wins:0,losses:0,winStreak:0,bestStreak:0,
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
  assert.equal(state.cash,0);
  assert.equal(state.careerEarnings,0);
  assert.equal(state.energy,100);
  assert.equal(state.health,100);
  assert.deepEqual(state.stats,{power:5,speed:5,chin:5,cardio:5});
});

test('landing mode distinguishes new, unfinished, and completed careers',()=>{
  assert.equal(logic.careerLandingMode(null),'new');
  assert.equal(logic.careerLandingMode({}),'new');
  assert.equal(logic.careerLandingMode({fighterCity:'phoenix'}),'building');
  assert.equal(logic.careerLandingMode({fighterCity:'phoenix',fighterAvatar:'fighter-01',fighterStyle:'brawler',nameLocked:false}),'building');
  assert.equal(logic.careerLandingMode({fighterCity:'phoenix',fighterAvatar:'fighter-01',fighterStyle:'brawler',nameLocked:true}),'returning');
});

test('partial careers stay building until the full identity is locked and complete',()=>{
  assert.equal(logic.careerLandingMode({fighterCity:'phoenix',nameLocked:true}),'building');
  assert.equal(logic.careerLandingMode({fighterCity:'phoenix',fighterAvatar:'fighter-01',fighterStyle:'brawler',nameLocked:false}),'building');
  assert.equal(logic.careerLandingMode({fighterCity:'phoenix',fighterAvatar:'fighter-01',fighterStyle:'brawler',nameLocked:true}),'returning');
});

test('landing championship proof covers loading, champion, vacant, and offline states',()=>{
  assert.deepEqual(logic.landingChampionshipProof(null,false,false),{heading:'CHECKING THE CHAMPION…',meta:'Title update loading',state:'loading'});
  assert.deepEqual(logic.landingChampionshipProof({champion_handle:'BlazingCoyoteCHI',defenses:1},true,false),{heading:'@BlazingCoyoteCHI',meta:'1 successful title defense',state:'loaded'});
  assert.deepEqual(logic.landingChampionshipProof({champion_handle:'@NightWolf',defenses:3},true,false),{heading:'@NightWolf',meta:'3 successful title defenses',state:'loaded'});
  assert.deepEqual(logic.landingChampionshipProof(null,true,false),{heading:'THE BELT IS VACANT',meta:'The next reign is waiting',state:'vacant'});
  assert.deepEqual(logic.landingChampionshipProof(null,true,true),{heading:'TITLE UPDATE OFFLINE',meta:'Champion status unavailable — play anytime',state:'offline'});
});

test('selectStoredState falls back to the last useful legacy save when all newer slots are blank',()=>{
  const raw={
    primary:'{}',
    backup:'{"fighterCity":"","fighterAvatar":""}',
    legacy:JSON.stringify({name:'LEGACY FIGHTER',fighterCity:'phoenix',fighterAvatar:'fighter-07',fighterStyle:'counter',nameLocked:true})
  };
  const state=logic.selectStoredState(raw,normalize,defaults);
  assert.equal(state.name,'LEGACY FIGHTER');
  assert.equal(state.fighterCity,'phoenix');
  assert.equal(state.fighterStyle,'counter');
});

test('an older save keeps progression and fills newer resource fields',()=>{
  const state=normalize({version:4,name:'OLD SAVE',level:4,xp:73,wins:7,losses:2,cash:900,stats:{power:11}});
  assert.equal(state.level,4);
  assert.equal(state.xp,73);
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

test('level-up resource helper supports ordinary recovery and explicit full recovery',()=>{
  const ordinary={energy:10,maxEnergy:100,health:20,maxHealth:100};
  logic.applyLevelUpResources(ordinary,false);
  assert.deepEqual(ordinary,{energy:40,maxEnergy:103,health:45,maxHealth:105});

  const milestone={energy:10,maxEnergy:100,health:20,maxHealth:100};
  logic.applyLevelUpResources(milestone,true);
  assert.deepEqual(milestone,{energy:103,maxEnergy:103,health:105,maxHealth:105});
});

test('resource warning state begins only below twenty-five percent',()=>{
  assert.equal(logic.resourceIsCritical(24,100),true);
  assert.equal(logic.resourceIsCritical(24.99,100),true);
  assert.equal(logic.resourceIsCritical(25,100),false);
  assert.equal(logic.resourceIsCritical(26,100),false);
  assert.equal(logic.resourceIsCritical(-20,100),true);
});

test('fight energy rises by career tier and caps at ten per round',()=>{
  const expected=new Map([[1,6],[2,6],[3,7],[4,7],[5,8],[6,8],[7,9],[8,9],[9,10],[10,10],[15,10]]);
  for(const [level,cost] of expected)assert.equal(logic.fightRoundCost(level),cost,`level ${level}`);
  assert.equal(logic.fightRoundCost(0),6);
  assert.equal(logic.fightRoundCost('bad'),6);

  const rookie={energy:18,maxEnergy:100,pendingFight:null},rookieCost=logic.fightRoundCost(1);
  assert.equal(logic.bookFight(rookie,'rookie-opponent',rookieCost,1000,rookieCost*3).ok,true);
  assert.equal(logic.chargePendingFightEnergy(rookie,rookieCost),true);
  assert.equal(logic.chargePendingFightEnergy(rookie,rookieCost),true);
  assert.equal(rookie.energy,0);
  assert.equal(rookie.pendingFight.cost,18);
});

test('fight and rematch payouts preserve existing formulas',()=>{
  const newOpponent={reward:200,tier:3,lossesToPlayer:0};
  const beatenOpponent={reward:200,tier:2,lossesToPlayer:1};
  assert.equal(logic.payoutForOpponent(newOpponent,3),200);
  assert.equal(logic.payoutForOpponent(beatenOpponent,3),100);
  assert.equal(logic.payoutForOpponent({...beatenOpponent,globalChampionship:true},3),200);
  assert.equal(logic.winFightCash({basePurse:200,hype:0,cashBonus:0,winStreak:1,variance:1}),200);
  assert.equal(logic.lossFightCash(200),16);
});

test('fight XP covers current-level wins, higher-level upsets, losses, and forfeits',()=>{
  assert.equal(logic.xpRequirement(1),120);
  assert.equal(logic.xpRequirement(5),280);
  assert.deepEqual(logic.fightXp({playerLevel:4,opponentLevel:4,won:true}),{xp:62,category:'standard',modifiers:[]});
  assert.equal(logic.fightXp({playerLevel:4,opponentLevel:5,won:true,upset:true}).xp,89);
  assert.equal(logic.fightXp({playerLevel:4,opponentLevel:4,won:false}).xp,23);
  assert.deepEqual(logic.fightXp({playerLevel:4,opponentLevel:4,won:false,forfeited:true}),{xp:0,category:'forfeit',modifiers:['FORFEIT · NO XP']});
});

test('past-level and ordinary rival fights award half XP without double reduction',()=>{
  assert.deepEqual(logic.fightXp({playerLevel:5,opponentLevel:4,won:true}),{xp:31,category:'reduced',modifiers:['PAST-LEVEL FIGHT · 50% XP']});
  assert.deepEqual(logic.fightXp({playerLevel:4,opponentLevel:4,won:true,rival:true}),{xp:31,category:'reduced',modifiers:['RIVAL FIGHT · 50% XP']});
  assert.equal(logic.fightXp({playerLevel:5,opponentLevel:4,won:true,rival:true}).xp,31);
});

test('ranked and championship XP bonuses do not stack',()=>{
  assert.deepEqual(logic.fightXp({playerLevel:4,opponentLevel:4,won:true,ranked:true}),{xp:74,category:'ranked',modifiers:['RANKED FIGHT BONUS +20%']});
  assert.deepEqual(logic.fightXp({playerLevel:4,opponentLevel:4,won:true,ranked:true,championship:true}),{xp:81,category:'championship',modifiers:['WORLD TITLE BOUT BONUS +30%']});
});

test('winning the belt adds 25 XP once while a title defense does not',()=>{
  assert.deepEqual(logic.fightXp({playerLevel:4,opponentLevel:4,won:true,championship:true,titleWon:true}),{xp:106,category:'title_victory',modifiers:['WORLD TITLE BOUT BONUS +30%','WORLD TITLE WON +25 XP']});
  assert.deepEqual(logic.fightXp({playerLevel:4,opponentLevel:4,won:true,championship:true,titleWon:false}),{xp:81,category:'championship',modifiers:['WORLD TITLE BOUT BONUS +30%']});
});

test('small early-career fight XP boosts hit the target without changing middle levels',()=>{
  assert.equal(logic.fightXp({playerLevel:1,opponentLevel:1,won:true}).xp,50);
  assert.equal(logic.fightXp({playerLevel:2,opponentLevel:2,won:true}).xp,54);
  assert.equal(logic.fightXp({playerLevel:3,opponentLevel:3,won:true}).xp,58);
  assert.equal(logic.fightXp({playerLevel:5,opponentLevel:5,won:true}).xp,71);
});

test('opponent availability covers career fights, the global title, and accepted rematches',()=>{
  const context={level:5};
  assert.equal(logic.opponentAvailable({tier:5,lossesToPlayer:0},context),true);
  assert.equal(logic.opponentAvailable({tier:6,lossesToPlayer:0},context),false);
  assert.equal(logic.opponentAvailable({tier:2,lossesToPlayer:1,rematchAccepted:false},context),false);
  assert.equal(logic.opponentAvailable({tier:2,lossesToPlayer:1,rematchAccepted:true},context),true);
  assert.equal(logic.opponentGroup({network:true,tier:2,lossesToPlayer:1},context),'passed');
  assert.equal(logic.opponentAvailable({network:true,tier:2,lossesToPlayer:1},context),true);
  assert.equal(logic.opponentAvailable({globalChampionship:true,tier:5,challengeEligible:true},context),true);
  assert.equal(logic.opponentAvailable({globalChampionship:true,tier:5,challengeEligible:false},context),false);
  assert.equal(logic.opponentState({globalChampionship:true,tier:5,challengeEligible:true,titleCooldown:true},context),'blocked');
  assert.equal(logic.opponentAvailable({globalChampionship:true,tier:5,challengeEligible:true,titleCooldown:true},context),false);
  assert.equal(logic.opponentState({globalChampionship:true,championDefense:true,tier:5,challengeEligible:true},context),'title');
  assert.equal(logic.opponentState({globalChampionship:true,championDefense:true,tier:3,challengeEligible:true},context),'title');
  assert.equal(logic.opponentState({globalChampionship:true,championDefense:true,tier:6,challengeEligible:true},context),'title');
  assert.equal(logic.opponentAvailable({globalChampionship:true,championDefense:true,tier:3,challengeEligible:false,titleCooldown:true},context),false);
});

test('championship career rank follows rookie, prospect, contender, former champion, and champion priority',()=>{
  assert.equal(logic.championshipCareerRank(1,null),'ROOKIE');
  assert.equal(logic.championshipCareerRank(2,{champion_id:'champ',champion_level:5}),'ROOKIE');
  assert.equal(logic.championshipCareerRank(3,{champion_id:'champ',champion_level:5}),'PROSPECT');
  assert.equal(logic.championshipCareerRank(6,{champion_id:'champ',champion_level:5}),'TITLE CONTENDER');
  assert.equal(logic.championshipCareerRank(4,{champion_id:'champ',champion_level:7,former_champion:true}),'FORMER WORLD CHAMPION');
  assert.equal(logic.championshipCareerRank(2,{champion_id:'self',champion_level:2,is_champion:true,former_champion:true}),'WORLD CHAMPION');
});

test('simplified championship experience covers contender, champion, rematch, and offline states',()=>{
  const locked=logic.championshipExperience({champion_level:5,challenge_eligible:false},{level:4});
  assert.deepEqual(locked,{status:'locked',headline:'WORLD TITLE SHOT LOCKED',action:'REACH LEVEL 5',disabled:true});
  const eligible=logic.championshipExperience({champion_level:5,challenge_eligible:true},{level:5});
  assert.deepEqual(eligible,{status:'eligible',headline:'TITLE SHOT AVAILABLE',action:'CHALLENGE FOR TITLE',disabled:false});
  assert.deepEqual(logic.championshipExperience({champion_level:5,challenge_eligible:false},{level:6}),{status:'eligible',headline:'TITLE SHOT AVAILABLE',action:'CHALLENGE FOR TITLE',disabled:false});
  assert.deepEqual(logic.championshipExperience({champion_level:5,daily_bout_used:true},{level:6}),{status:'used',headline:'TITLE SHOT USED TODAY',action:'AVAILABLE AT MIDNIGHT',disabled:true});
  assert.deepEqual(logic.championshipExperience({is_champion:true,selected_challenger_id:'challenger'}),{status:'defense',headline:'YOU ARE THE WORLD CHAMPION',action:'DEFEND YOUR TITLE',disabled:false});
  assert.deepEqual(logic.championshipExperience({is_champion:true,defense_used_today:true}),{status:'defended',headline:'TITLE DEFENDED',action:'NEXT CHALLENGER AVAILABLE TOMORROW',disabled:true});
  assert.deepEqual(logic.championshipExperience({is_champion:true}),{status:'no-challenger',headline:'YOU ARE THE WORLD CHAMPION',action:'NO CHALLENGER AVAILABLE',disabled:true});
  assert.deepEqual(logic.championshipExperience({former_champion_rematch:true,daily_bout_used:true}),{status:'rematch-waiting',headline:'TITLE REMATCH AVAILABLE TOMORROW',action:'AVAILABLE AT MIDNIGHT',disabled:true});
  assert.deepEqual(logic.championshipExperience({former_champion_rematch:true}),{status:'rematch',headline:'TITLE REMATCH AVAILABLE',action:'RECLAIM YOUR TITLE',disabled:false});
  assert.deepEqual(logic.championshipExperience(null,{networkUnavailable:true}),{status:'unavailable',headline:'CHAMPIONSHIP UPDATE UNAVAILABLE',action:'TRY AGAIN',disabled:false});
});

test('regular ranked fighters never become championship bouts',()=>{
  const ranked={network:true,tier:5,lossesToPlayer:0};
  assert.equal(logic.opponentState(ranked,{level:5}),'current');
  assert.equal(logic.opponentAvailable(ranked,{level:5}),true);
  assert.equal(ranked.globalChampionship,undefined);
});

test('title-rematch wins, losses, and stale settlements use authoritative presentation',()=>{
  assert.deepEqual(logic.championshipSettlementPresentation({status:'new_champion',mode:'rematch',isChampion:true}),{heading:'TITLE RECLAIMED',message:'You took back the World Championship.'});
  assert.deepEqual(logic.championshipSettlementPresentation({status:'champion_defended',mode:'rematch',isChampion:false}),{heading:'TITLE FIGHT LOST',message:'The reigning champion kept the belt.'});
  assert.deepEqual(logic.championshipSettlementPresentation({status:'stale',mode:'challenge'}),{heading:'CHAMPIONSHIP CHANGED',message:'The belt changed before this result could transfer it.'});
  assert.deepEqual(logic.championshipSettlementPresentation({status:'new_champion',mode:'defense',isChampion:false,championHandle:'NewChamp'}),{heading:'YOU LOST THE WORLD TITLE',message:'@NewChamp took the belt. TITLE REMATCH AVAILABLE TOMORROW.'});
});

test('retirement suppresses unload saves and clears only career storage',()=>{
  const values=new Map([
    ['cage-warrior-save-v3','progressed career'],
    ['cage-warrior-save-backup-v1','progressed backup'],
    ['fytr-save-v1','legacy career'],
    ['unrelated-preference','keep me'],
  ]);
  const storage={removeItem:key=>values.delete(key)};

  assert.equal(logic.shouldPersistCareer(false),true);
  assert.equal(logic.shouldPersistCareer(true),false);
  assert.equal(logic.shouldPersistCareer(false,true,null),false,'a removed active save must not be resurrected');
  assert.equal(logic.shouldPersistCareer(false,false,null),true,'a new career may create its first save');
  assert.equal(logic.shouldPersistCareer(false,true,undefined),true,'an unreadable store should retain normal save error handling');
  assert.deepEqual(logic.clearCareerStorage(storage,['cage-warrior-save-v3','cage-warrior-save-backup-v1','fytr-save-v1']),[
    'cage-warrior-save-v3','cage-warrior-save-backup-v1','fytr-save-v1'
  ]);
  assert.equal(values.has('cage-warrior-save-v3'),false);
  assert.equal(values.has('cage-warrior-save-backup-v1'),false);
  assert.equal(values.has('fytr-save-v1'),false);
  assert.equal(values.get('unrelated-preference'),'keep me');
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

test('fighter identities preserve CapitalCase and use color descriptor city format',()=>{
  assert.equal(logic.buildFighterIdentity('white','drizzle','phx'),'WhiteDrizzlePHX');
  assert.equal(logic.buildFighterIdentity('Golden','Tornado','NYC'),'GoldenTornadoNYC');
  assert.equal(logic.buildFighterIdentity('blue','viper','cle'),'BlueViperCLE');
  assert.equal(logic.buildFighterIdentity('Mexican','Wind','SEA'),'MexicanWindSEA');
  assert.equal(logic.buildFighterIdentity('Russian','Hammer','NYC'),'RussianHammerNYC');
  assert.equal(logic.normalizeFighterIdentity('DarkCobraLAX'),'DarkCobraLAX');
  assert.equal(logic.normalizeFighterIdentity('legacyfighter'),'legacyfighter');
  assert.equal(logic.normalizeFighterIdentity('phxbrawler_01'),'phxbrawler_01');
  assert.equal(logic.buildFighterIdentity('Blue','Viper','too-long'),'');
});

test('shared fighter opponent names keep CapitalCase without rewriting stored handles',()=>{
  const openers=['White','Polish','Turbo'];
  const descriptors=['Drizzle','Lightning','Thunder'];
  const cityCodes=['PHX','NOLA','LAX','NYC'];
  assert.equal(logic.displayFighterIdentity('PolishLightningNOLA',openers,descriptors,cityCodes),'PolishLightningNOLA');
  assert.equal(logic.displayFighterIdentity('POLISHLIGHTNINGNOLA',openers,descriptors,cityCodes),'PolishLightningNOLA');
  assert.equal(logic.displayFighterIdentity('TURBOTHUNDERLAX',openers,descriptors,cityCodes),'TurboThunderLAX');
  assert.equal(logic.displayFighterIdentity('phxbrawler_01',openers,descriptors,cityCodes),'PHXBrawler_01');
  assert.equal(logic.displayFighterIdentity('NYCTRICKSTER_01',openers,descriptors,cityCodes),'NYCTrickster_01');
  assert.equal(logic.displayFighterIdentity('ROCKYVOLUME',openers,descriptors,cityCodes),'Rockyvolume');
});

test('fighter identity randomizer uses the full pools and supports deterministic tests',()=>{
  assert.equal(logic.randomFighterIdentity(['White','Golden'],['Drizzle','Viper'],'SEA',()=>0),'WhiteDrizzleSEA');
  const values=[0.75,0.5];
  assert.equal(logic.randomFighterIdentity(['White','Golden'],['Drizzle','Viper'],'NYC',()=>values.shift()),'GoldenViperNYC');
  assert.equal(logic.randomFighterIdentity([],['Drizzle'],'PHX',()=>0),'');
  assert.equal(logic.randomFighterIdentity(['White'],[],'PHX',()=>0),'');
});

test('training quote enforces daily, cash, and energy costs before rewards',()=>{
  const action={cost:20,sessions:2,gain:2};
  assert.equal(logic.trainingQuote({cash:500,energy:50},action,true,75,1).reason,'limit');
  assert.equal(logic.trainingQuote({cash:100,energy:50},action,true,75,4).reason,'cash');
  assert.equal(logic.trainingQuote({cash:500,energy:10},action,true,75,4).reason,'energy');
  assert.deepEqual(logic.trainingQuote({cash:500,energy:50},action,true,75,4),{ok:true,reason:'',sessions:2,cashCost:150,energyCost:20});
  assert.equal(logic.trainingGain(2,false,false),2);
  assert.equal(logic.trainingGain(2,true,true),3);
  assert.equal(logic.trainingGain(1,false,true),2);
});

test('Coach Vega improves training and reduces explicit injury risk without XP',()=>{
  assert.equal(logic.trainingGain(1,false,false),1);
  assert.equal(logic.trainingGain(1,true,false),2);
  assert.equal(logic.trainingPerfectChance(false),.17);
  assert.equal(logic.trainingPerfectChance(true),.27);
  assert.equal(logic.trainingInjuryChance(false,false),0);
  assert.equal(logic.trainingInjuryChance(true,false),.33);
  assert.equal(logic.trainingInjuryChance(true,true),.20);
});

test('training cooldowns scale with workout gains and sparring intensity',()=>{
  assert.equal(logic.trainingCooldownDuration({type:'training',gain:1}),60000);
  assert.equal(logic.trainingCooldownDuration({type:'training',gain:2}),120000);
  assert.equal(logic.trainingCooldownDuration({type:'training',gain:3}),120000);
  assert.equal(logic.trainingCooldownDuration({type:'sparring',skills:1}),120000);
  assert.equal(logic.trainingCooldownDuration({type:'sparring',skills:2}),240000);
});

test('repeated training and sparring sessions ramp the cost and damage instead of staying flat',()=>{
  assert.equal(logic.trainingCost({cost:8},0),8);
  assert.equal(logic.trainingCost({cost:8},2),12);
  assert.equal(logic.trainingGain(1,false,false,0),1);
  assert.equal(logic.trainingGain(1,false,false,2),1);
  assert.equal(Number.isInteger(logic.trainingGain(1,true,true,2)),true);
  assert.equal(logic.sparringDamage(3,0),3);
  assert.ok(logic.sparringDamage(3,2)>3);
});

test('recovery treatments require one available opportunity and clamp restored resources',()=>{
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

test('training injuries reduce every effective attribute by ten percent or at least one point',()=>{
  assert.equal(logic.injuredStat(5,true),4);
  assert.equal(logic.injuredStat(20,true),18);
  assert.ok(Math.abs(logic.injuredStat(8.66,true)-7.66)<.000001);
  assert.equal(logic.injuredStat(1,true),1);
  assert.equal(logic.injuredStat(8.66,false),8.66);
});

test('persistent health sets a tiered starting fight condition',()=>{
  assert.equal(logic.startingFightCondition(100,100),100);
  assert.equal(logic.startingFightCondition(90,100),100);
  assert.equal(logic.startingFightCondition(89,100),95);
  assert.equal(logic.startingFightCondition(70,100),95);
  assert.equal(logic.startingFightCondition(69,100),88);
  assert.equal(logic.startingFightCondition(50,100),88);
  assert.equal(logic.startingFightCondition(49,100),78);
  assert.equal(logic.startingFightCondition(20,100),78);
  assert.equal(logic.startingFightCondition(90,120),95);
});

test('landed opponent offense directly damages persistent health',()=>{
  assert.equal(logic.liveFightHealthDamage(),0);
  assert.equal(logic.liveFightHealthDamage({landed:true}),1);
  assert.equal(logic.liveFightHealthDamage({landed:true,knockdown:true}),4);
  assert.equal(logic.liveFightHealthDamage({finish:'KO'}),12);
  assert.equal(logic.liveFightHealthDamage({finish:'TKO'}),12);
  assert.equal(logic.liveFightHealthDamage({finish:'SUBMISSION'}),8);
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

test('Cage Dice caps wagers and settles every supported bet',()=>{
  assert.equal(logic.cageDiceBetLimit(403),100);
  assert.deepEqual(logic.cageDiceOutcome(2,3,'under',20),{die1:2,die2:3,total:5,doubles:false,choice:'under',multiplier:2,won:true,payout:40,profit:20});
  assert.equal(logic.cageDiceOutcome(5,4,'over',20).payout,40);
  assert.equal(logic.cageDiceOutcome(3,4,'seven',20).payout,100);
  assert.equal(logic.cageDiceOutcome(6,6,'doubles',20).payout,120);
  assert.equal(logic.cageDiceOutcome(3,4,'doubles',20).payout,0);
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

test('gear drop reveal data is normalized without mutating the awarded item',()=>{
  const item={id:'small-gym-dog',name:' Small Gym Dog ',category:' Lifestyle ',rarity:'COMMON',icon:'dog'};
  const drop=logic.normalizeGearDrop({item,rarity:'common',count:'2.9',isNew:true,reason:' DAILY DROP ',extras:'+$100 CASH'});
  assert.deepEqual(drop,{
    item:{id:'small-gym-dog',name:'Small Gym Dog',category:'Lifestyle',rarity:'COMMON',icon:'dog'},
    rarity:'COMMON',count:2,isNew:true,reason:'DAILY DROP',extras:'+$100 CASH'
  });
  assert.equal(item.name,' Small Gym Dog ');
});

test('invalid or stale gear drop data is rejected before the result UI renders it',()=>{
  const validItem={id:'wraps',name:'Stiff Hand Wraps',category:'Fight Gear',rarity:'COMMON'};
  assert.equal(logic.normalizeGearDrop(null),null);
  assert.equal(logic.normalizeGearDrop({item:null,rarity:'COMMON'}),null);
  assert.equal(logic.normalizeGearDrop({item:{id:'missing',name:'',category:'Lifestyle'},rarity:'COMMON'}),null);
  assert.equal(logic.normalizeGearDrop({item:validItem,rarity:'MYTHIC'}),null);
  assert.deepEqual(logic.normalizeGearDrop({item:validItem,count:-4}),{
    item:validItem,rarity:'COMMON',count:1,isNew:false,reason:'GEAR DROP',extras:''
  });
});

test('endorsement progression exposes only the next unsigned deal',()=>{
  const ids=['bobs-auto','volt','ironhide','apex'];
  assert.equal(logic.nextEndorsementId(ids,[]),'bobs-auto');
  assert.equal(logic.nextEndorsementId(ids,['bobs-auto']),'volt');
  assert.equal(logic.nextEndorsementId(ids,['bobs-auto','volt']),'ironhide');
  assert.equal(logic.nextEndorsementId(ids,['bobs-auto','volt','ironhide','apex']),'');
});

test('daily counters use local calendar dates, reset once, and clamp tampered limits',()=>{
  const localDate=new Date(2026,0,2,0,30);
  const today=logic.localDateKey(localDate);
  assert.equal(today,'2026-01-02');
  assert.deepEqual(logic.dailyCountersFor({date:'2026-01-01',fight:7,train:4,sparring:2,hustle:3,blackjack:1,cageDice:1,publicity:2,recovery:1},today),{date:today,fight:0,train:0,sparring:0,hustle:0,blackjack:0,cageDice:0,publicity:0,recovery:0});
  assert.deepEqual(logic.dailyCountersFor({date:today,fight:99,train:99,sparring:9,hustle:-4,blackjack:9,cageDice:7,publicity:3,recovery:9},today),{date:today,fight:10,train:4,sparring:2,hustle:0,blackjack:1,cageDice:1,publicity:1,recovery:1});
});

test('fight gear loadout expands from two slots to four at level eight', () => {
  assert.equal(logic.gearLoadoutLimit(1),2);
  assert.equal(logic.gearLoadoutLimit(7),2);
  assert.equal(logic.gearLoadoutLimit(8),4);
  assert.equal(logic.gearLoadoutLimit(15),4);
});

test('daily reset countdown targets the next local midnight',()=>{
  const now=new Date(2026,7,8,21,34,56,250),next=new Date(2026,7,9,0,0,0,0);
  assert.equal(logic.millisecondsUntilNextLocalDay(now),next-now);
  assert.equal(logic.formatCountdown(next-now),'02:25:04');
  assert.equal(logic.formatCountdown(999),'00:00:01');
  assert.equal(logic.millisecondsUntilNextLocalDay('not-a-date'),0);
});

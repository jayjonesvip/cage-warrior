(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.CAGE_LOGIC=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';

  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const finite=(value,fallback=0)=>{if(value===null||value==='')return fallback;const number=Number(value);return Number.isFinite(number)?number:fallback};
  const whole=(value,fallback=0)=>Math.floor(finite(value,fallback));
  const nonNegativeWhole=(value,fallback=0)=>Math.max(0,whole(value,fallback));
  const fightRule=(path,fallback)=>root.CAGE_FIGHT_RULES?.number(path,fallback)??fallback;
  const maximumEnergy=()=>fightRule('energyEconomy.maximumEnergy',100);
  const ENERGY_RECOVERY_INTERVAL=5000;
  const HEALTH_RECOVERY_INTERVAL=60000;
  const OFFLINE_RECOVERY_CAP=8*60*60*1000;
  const FOLLOWER_HOUR=60*60*1000;
  const FOLLOWER_OFFLINE_CAP=48*FOLLOWER_HOUR;

  function localDateKey(value=new Date()){
    const date=value instanceof Date?value:new Date(value);
    if(!Number.isFinite(date.getTime()))return '';
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }

  function millisecondsUntilNextLocalDay(value=new Date()){
    const date=value instanceof Date?value:new Date(value);
    if(!Number.isFinite(date.getTime()))return 0;
    const next=new Date(date.getFullYear(),date.getMonth(),date.getDate()+1);
    return Math.max(0,next.getTime()-date.getTime());
  }

  function formatCountdown(milliseconds){
    const totalSeconds=Math.max(0,Math.ceil(finite(milliseconds)/1000));
    const hours=Math.floor(totalSeconds/3600),minutes=Math.floor(totalSeconds%3600/60),seconds=totalSeconds%60;
    return `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
  }

  function validFighterAllocation(stats){
    const keys=['power','speed','chin','cardio'];
    return !!stats&&keys.every(key=>Number.isInteger(stats[key])&&stats[key]>=2&&stats[key]<=8)&&keys.reduce((sum,key)=>sum+stats[key],0)===20;
  }

  function rollFighterAllocation(random=Math.random){
    const keys=['power','speed','chin','cardio'],stats={power:2,speed:2,chin:2,cardio:2};
    for(let remaining=12;remaining>0;remaining--){
      const available=keys.filter(key=>stats[key]<8),value=Number(random()),unit=Number.isFinite(value)?clamp(value,0,.999999999999):0,key=available[Math.floor(unit*available.length)]||available[0];
      stats[key]++;
    }
    return stats;
  }

  function fighterArchetypeFromStats(stats){
    if(!validFighterAllocation(stats))return '';
    return stats.power+stats.speed>=stats.chin+stats.cardio?'striker':'grappler';
  }

  function isBlankCareer(state){
    if(!state||typeof state!=='object')return true;
    return !state.fighterCity&&!state.fighterAvatar&&!state.fighterStyle&&
      nonNegativeWhole(state.level,1)<=1&&nonNegativeWhole(state.xp)===0&&
      nonNegativeWhole(state.wins)===0&&nonNegativeWhole(state.losses)===0&&
      (!Array.isArray(state.gear)||state.gear.length===0);
  }

  function careerLandingMode(state){
    if(!state||typeof state!=='object')return 'new';
    const complete=!!(state.fighterCity&&state.fighterAvatar&&state.fighterStyle&&state.nameLocked);
    if(complete)return 'returning';
    return state.fighterCity||state.fighterAvatar||state.fighterStyle||state.nameLocked?'building':'new';
  }

  function parseStoredState(raw,normalize){
    if(typeof raw!=='string'||!raw.trim())return null;
    try{
      const parsed=JSON.parse(raw);
      if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return null;
      return normalize(parsed);
    }catch(error){return null}
  }

  function selectStoredState(rawSaves,normalize,fallback){
    const primary=parseStoredState(rawSaves.primary,normalize);
    const backup=parseStoredState(rawSaves.backup,normalize);
    const legacy=parseStoredState(rawSaves.legacy,normalize);
    const candidate=[primary,backup,legacy].find(state=>state&&!isBlankCareer(state));
    return candidate||structuredClone(fallback);
  }

  function shouldBackupRaw(raw,normalize){
    const state=parseStoredState(raw,normalize);
    return !!state&&!isBlankCareer(state);
  }

  function normalizeCoreState(state,defaults,raw={}){
    state.level=Math.max(1,whole(state.level,defaults.level));
    state.xp=Math.max(0,finite(state.xp,defaults.xp));
    state.fans=nonNegativeWhole(state.fans,defaults.fans);
    state.wins=nonNegativeWhole(state.wins,defaults.wins);
    state.losses=nonNegativeWhole(state.losses,defaults.losses);
    state.winStreak=nonNegativeWhole(state.winStreak,defaults.winStreak);
    state.bestStreak=Math.max(state.winStreak,nonNegativeWhole(state.bestStreak,defaults.bestStreak));
    state.attributePoints=nonNegativeWhole(state.attributePoints,defaults.attributePoints);
    state.postFightTutorialSeen=raw.postFightTutorialSeen===true||state.wins+state.losses>0;
    state.maxEnergy=maximumEnergy();
    state.maxHealth=Math.max(1,finite(state.maxHealth,defaults.maxHealth));
    state.energy=clamp(Math.floor(finite(state.energy,defaults.energy)),0,state.maxEnergy);
    state.health=clamp(finite(state.health,defaults.health),0,state.maxHealth);
    const now=Date.now(),savedAt=finite(raw.lastSave,now),legacyRecoveryAt=savedAt>0&&savedAt<=now?savedAt:now,validTimestamp=(value,fallback=legacyRecoveryAt)=>{const timestamp=finite(value,fallback);return timestamp>0&&timestamp<=now?timestamp:fallback};
    state.energyRecoveryAt=validTimestamp(raw.energyRecoveryAt);
    state.healthRecoveryAt=validTimestamp(raw.healthRecoveryAt);
    const savedAura=Number.isFinite(Number(raw.aura))?raw.aura:Number.isFinite(Number(raw.hype))?raw.hype:state.aura;
    state.aura=clamp(finite(savedAura,defaults.aura??defaults.hype??0),0,100);
    const savedFollowersAt=Number(raw.followersUpdatedAt);state.followersUpdatedAt=Number.isFinite(savedFollowersAt)&&savedFollowersAt>0&&savedFollowersAt<=now?savedFollowersAt:now;
    state.followersAccrualAura=clamp(whole(raw.followersAccrualAura,state.aura),0,100);
    const stats=state.stats&&typeof state.stats==='object'&&!Array.isArray(state.stats)?state.stats:{};
    state.stats={};
    for(const key of ['power','speed','chin','cardio'])state.stats[key]=Math.max(1,Math.round(finite(stats[key],defaults.stats[key])));
    const usableOpponent=entry=>entry&&typeof entry==='object'&&!Array.isArray(entry)&&
      typeof entry.key==='string'&&entry.key&&typeof entry.name==='string'&&entry.name.trim()&&
      ['tier','min','power','speed','chin','cardio','fans'].every(key=>Number.isFinite(entry[key]));
    state.roster=Array.isArray(state.roster)?state.roster.filter(usableOpponent):[];
    const pending=state.pendingFight;
    state.pendingFight=pending&&typeof pending==='object'&&typeof pending.key==='string'&&pending.key?{
      key:pending.key,
      cost:clamp(whole(pending.cost,maximumEnergy()),1,maximumEnergy()),
      startedAt:Math.max(0,finite(pending.startedAt,0))
    }:null;
    state.lastSave=Math.max(0,finite(state.lastSave,Date.now()));
    state.lastDaily=typeof state.lastDaily==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(state.lastDaily)?state.lastDaily:'';
    for(const obsolete of [
      'cash','careerEarnings','freeLoot','trainerOn','trainingInjury','treatmentAvailable',
      'blackjackHand','cageDiceResult','horseRaceResult','lastAutographPrice',
      'activeTraining','trainingSession','activeRecovery','recoverySession','restSession',
      'activeHustle','hustleSession','publicitySession','autographSession','activeActivity','activitySession','hype'
    ])delete state[obsolete];
    return state;
  }

  function dailyCountersFor(counters,today){
    if(!counters||typeof counters!=='object'||counters.date!==today)return {date:today,fight:0,qualifyingWinStreak:0,bonusFightAwarded:false};
    return {date:today,fight:clamp(nonNegativeWhole(counters.fight),0,50),qualifyingWinStreak:clamp(nonNegativeWhole(counters.qualifyingWinStreak),0,50),bonusFightAwarded:counters.bonusFightAwarded===true};
  }

  function applyDailyFightStreak(counters,{won=false,playerLevel=1,opponentLevel=1,requiredStreak=5}={}){
    const qualifies=won===true&&whole(opponentLevel,1)>=whole(playerLevel,1),target=clamp(whole(requiredStreak,5),1,50);
    counters.qualifyingWinStreak=qualifies?clamp(nonNegativeWhole(counters.qualifyingWinStreak)+1,0,50):0;
    const awarded=counters.bonusFightAwarded!==true&&counters.qualifyingWinStreak>=target;
    if(awarded)counters.bonusFightAwarded=true;
    return {qualifies,awarded,streak:counters.qualifyingWinStreak};
  }

  function spendEnergy(state,cost,now=Date.now()){
    const amount=Math.max(0,finite(cost));
    const available=clamp(finite(state.energy),0,finite(state.maxEnergy,100));
    if(available<=0||amount<=0)return 0;
    const energySpent=Math.min(available,amount);
    state.energy=clamp(available-energySpent,0,state.maxEnergy);
    if(available>=state.maxEnergy||!Number.isFinite(Number(state.energyRecoveryAt)))state.energyRecoveryAt=Math.max(0,finite(now,Date.now()));
    return energySpent;
  }

  function applyLevelUpResources(state,fullRestore=false){
    state.maxEnergy=maximumEnergy();
    state.maxHealth=Math.max(1,finite(state.maxHealth)+5);
    state.energy=clamp(finite(state.energy),0,state.maxEnergy);
    state.health=clamp(finite(state.health),0,state.maxHealth);
    return state;
  }

  function passiveRecovery(state,now=Date.now(),offlineCap=OFFLINE_RECOVERY_CAP,intervals={}){
    const current=Math.max(0,finite(now,Date.now())),cap=Math.max(0,finite(offlineCap,OFFLINE_RECOVERY_CAP)),result={energy:0,health:0};
    const recover=(valueKey,maxKey,timeKey,interval)=>{
      const maximum=Math.max(1,finite(state[maxKey],100)),value=clamp(Math.floor(finite(state[valueKey])),0,maximum),saved=finite(state[timeKey],current),anchor=saved>current||saved<=0?current:Math.max(saved,current-cap);
      if(value>=maximum){state[valueKey]=maximum;state[timeKey]=current;return 0}
      const ticks=Math.max(0,Math.floor((current-anchor)/interval)),gain=Math.min(maximum-value,ticks);
      state[valueKey]=value+gain;
      state[timeKey]=state[valueKey]>=maximum?current:anchor+ticks*interval;
      return gain;
    };
    result.energy=recover('energy','maxEnergy','energyRecoveryAt',Math.max(1000,finite(intervals.energy,ENERGY_RECOVERY_INTERVAL)));
    result.health=recover('health','maxHealth','healthRecoveryAt',Math.max(1000,finite(intervals.health,HEALTH_RECOVERY_INTERVAL)));
    return result;
  }

  function followersPerHour(aura=0){return Math.max(0,Math.round(fightRule('followerRewards.passiveBasePerHour',1)))+Math.floor(clamp(finite(aura),0,100)/Math.max(1,fightRule('followerRewards.auraPerFollowerStep',10)))}

  function passiveFollowerGrowth(state,now=Date.now(),offlineCap=FOLLOWER_OFFLINE_CAP,aura=state?.aura){
    const current=Math.max(0,finite(now,Date.now())),currentAura=clamp(whole(aura),0,100),saved=Number(state?.followersUpdatedAt),savedAura=clamp(whole(state?.followersAccrualAura,currentAura),0,100),cap=Math.max(FOLLOWER_HOUR,finite(offlineCap,FOLLOWER_OFFLINE_CAP));
    if(!Number.isFinite(saved)||saved<=0||saved>current){state.followersUpdatedAt=current;state.followersAccrualAura=currentAura;return {followers:0,hours:0,rate:followersPerHour(currentAura),aura:currentAura,changed:true}}
    const elapsed=current-saved,cappedElapsed=Math.min(elapsed,cap),hours=Math.floor(cappedElapsed/FOLLOWER_HOUR),rate=followersPerHour(savedAura);
    if(hours<1)return {followers:0,hours:0,rate,aura:savedAura,changed:false};
    const followers=hours*rate,remainder=cappedElapsed-hours*FOLLOWER_HOUR;state.fans=nonNegativeWhole(state.fans)+followers;state.followersUpdatedAt=elapsed>cap?current-remainder:saved+hours*FOLLOWER_HOUR;state.followersAccrualAura=currentAura;
    return {followers,hours,rate,aura:savedAura,changed:true};
  }

  function fightFollowerReward({opponentBaseFollowers=0,aura=0,followerPerks=0,upset=false,rivalry=false,randomMultiplier=1,won=true,forfeited=false}={}){
    if(forfeited)return 0;
    const base=Math.max(0,finite(opponentBaseFollowers)),fightMultiplier=fightRule('followerRewards.fightPayoutMultiplier',.75);
    if(!won)return Math.round(base*fightRule('followerRewards.completedLossMultiplier',.15)*fightMultiplier);
    return Math.round(base*(1+clamp(finite(aura),0,100)/100)*(1+Math.max(0,finite(followerPerks))/100)*(upset?1.25:1)*(rivalry?1.15:1)*clamp(finite(randomMultiplier,1),.9,1.2)*fightMultiplier);
  }

  function recoveryTimeRemaining(value,maximum,lastRecoveryAt,interval,now=Date.now()){
    const missing=Math.max(0,Math.ceil(finite(maximum,100)-finite(value)));
    if(!missing)return 0;
    const current=Math.max(0,finite(now,Date.now())),saved=finite(lastRecoveryAt,current),anchor=saved>current||saved<=0?current:saved,remainder=Math.max(0,current-anchor)%interval;
    return Math.max(0,missing*interval-remainder);
  }

  function victoryAttributePointReward(playerLevel=1,opponentLevel=1){
    const player=Math.max(1,whole(playerLevel,1)),opponent=Math.max(1,whole(opponentLevel,1));
    if(opponent<player)return fightRule('attributePointRewards.victoryAgainstLowerLevelOpponent',0);
    if(opponent>player)return fightRule('attributePointRewards.victoryAgainstHigherLevelOpponent',2);
    return fightRule('attributePointRewards.victoryAgainstSameLevelOpponent',1);
  }

  function awardVictoryAttributePoint(state,{won=false,forfeited=false,playerLevel=state?.level,opponentLevel=playerLevel}={}){
    if(!won||forfeited)return 0;
    const points=victoryAttributePointReward(playerLevel,opponentLevel);
    state.attributePoints=nonNegativeWhole(state.attributePoints)+points;
    return points;
  }

  function firstContractPending({savedPending,nameLocked=false,level=1,wins=0,losses=0}={}){
    if(typeof savedPending==='boolean')return savedPending;
    return nameLocked===true&&whole(level,1)===1&&nonNegativeWhole(wins)===1&&nonNegativeWhole(losses)===0;
  }

  function firstContractUnlockEligible({won=false,rookieShowcase=false}={}){
    return won===true&&rookieShowcase===true;
  }

  function lowerLevelFollowerPenalty(followers,{won=false,forfeited=false,playerLevel=1,opponentLevel=1}={}){
    if(!won||forfeited||whole(opponentLevel,1)>=whole(playerLevel,1))return 0;
    return Math.ceil(nonNegativeWhole(followers)*fightRule('experienceRewards.lowerLevelOpponentFollowerLossPercent',5)/100);
  }

  function matchupAdvice({playerLevel=1,opponentLevel=1,playerRating=0,opponentRating=0,titleBout=false,playerIsChampion=false,rookieShowcase=false}={}){
    const levelDifference=whole(opponentLevel,1)-whole(playerLevel,1),ratingEdge=finite(playerRating)-finite(opponentRating),points=victoryAttributePointReward(playerLevel,opponentLevel);
    if(rookieShowcase)return {tone:'favorable',headline:'LET US SEE WHAT YOU HAVE',message:'A clean opening test. Stay composed and make the first contract count.'};
    if(titleBout&&playerIsChampion)return {tone:'title',headline:'PROTECT THE BELT',message:'Every ranked challenger can take what you earned. Do not overlook this defense.'};
    if(titleBout)return {tone:levelDifference>0||ratingEdge<=-4?'danger':'title',headline:'YOUR TITLE SHOT',message:levelDifference>0||ratingEdge<=-4?'You are the underdog on paper, but one win changes everything.':'This is the moment you climbed for. Fight smart and take the belt.'};
    if(levelDifference<0){const auraCost=Math.abs(auraFightChange({won:true,playerLevel,opponentLevel}));return {tone:'avoid',headline:'FAN BACKLASH',message:`A win pays no XP or Attribute Points, costs ${fightRule('experienceRewards.lowerLevelOpponentFollowerLossPercent',5)}% of your followers, and loses ${auraCost} Aura.`}}
    if(levelDifference>=2||ratingEdge<=-8)return {tone:'danger',headline:'HIGH-RISK FIGHT',message:`You are out of your league on paper. A win still earns ${points} Attribute Points.`};
    if(levelDifference>0)return {tone:'step-up',headline:'STEP-UP FIGHT',message:`A real test of your skills. The risk comes with ${points} Attribute Points.`};
    if(ratingEdge>=4)return {tone:'favorable',headline:'GOOD TEST OF SKILLS',message:'You have the edge, but this opponent is at your level. Go earn the point.'};
    if(ratingEdge<=-4)return {tone:'danger',headline:'TOUGH MATCHUP',message:'A hard fight at your level. Bring a real plan and earn the point.'};
    return {tone:'even',headline:'RIGHT-SIZED FIGHT',message:'A good test of your skills. This is the matchup your career needs.'};
  }

  function assignAttributePoint(state,attribute){
    if(!['power','speed','chin','cardio'].includes(attribute)||nonNegativeWhole(state.attributePoints)<1)return false;
    if(!state.stats||typeof state.stats!=='object')return false;
    state.stats[attribute]=Math.max(1,whole(state.stats[attribute],1))+1;
    state.attributePoints--;
    return true;
  }

  function sponsorProgress(definitions,followers,history=[]){
    const sponsors=Array.isArray(definitions)?definitions:[],count=nonNegativeWhole(followers),known=new Set(Array.isArray(history)?history:[]),activeIndex=sponsors.reduce((last,item,index)=>count>=nonNegativeWhole(item.followersRequired)?index:last,-1),active=sponsors[activeIndex]||null,newlyUnlocked=active&&!known.has(active.id)?active:null;
    for(const item of sponsors.slice(0,activeIndex+1))known.add(item.id);
    return {active,activeIndex,history:sponsors.filter(item=>known.has(item.id)).map(item=>item.id),next:sponsors[activeIndex+1]||null,newlyUnlocked};
  }

  function fightWinShareText({opponent='Opponent',method='',round=0,record='',winStreak=0,titleWon=false,url='https://cagegrind.com'}={}){
    const handle=String(opponent||'Opponent').replace(/^@/,''),finish=String(method||'decision').toUpperCase(),roundText=nonNegativeWhole(round)>0?` in round ${nonNegativeWhole(round)}`:'',recordText=record?` My record is now ${String(record)}.`:'',streakText=nonNegativeWhole(winStreak)>1?` ${nonNegativeWhole(winStreak)} wins in a row.`:'',titleText=titleWon?' I won the Cage Grind World Championship.':'';
    return `I defeated @${handle} by ${finish}${roundText} in Cage Grind.${recordText}${streakText}${titleText} Think you can do better? ${url}`;
  }

  function resourceIsCritical(value,maximum){
    const max=Math.max(1,finite(maximum,1));
    return clamp(finite(value),0,max)/max<.25;
  }

  function fightEnergyCost(){
    return fightRule('energyEconomy.fightEnergyCost',25);
  }

  function bookFight(state,key,cost=25,startedAt=Date.now(),minimumEnergyExclusive=0){
    if(state.pendingFight)return {ok:false,reason:'pending'};
    const availableEnergy=clamp(finite(state.energy),0,finite(state.maxEnergy,100));
    if(availableEnergy<=Math.max(0,finite(minimumEnergyExclusive)))return {ok:false,reason:'energy'};
    const energySpent=Math.min(availableEnergy,Math.max(0,finite(cost)));
    state.energy=clamp(availableEnergy-energySpent,0,state.maxEnergy);
    if(availableEnergy>=state.maxEnergy||!Number.isFinite(Number(state.energyRecoveryAt)))state.energyRecoveryAt=Math.max(0,finite(startedAt,Date.now()));
    state.pendingFight={key,cost:energySpent,startedAt:Math.max(0,finite(startedAt))};
    return {ok:true,reason:'',energySpent};
  }

  function startingFightCondition(health,maxHealth){
    const healthPercent=clamp(finite(health)/Math.max(1,finite(maxHealth,100))*100,0,100);
    if(healthPercent>=fightRule('startingCondition.fullConditionMinimumHealthPercent',90))return fightRule('startingCondition.fullCondition',100);
    if(healthPercent>=fightRule('startingCondition.slightlyReducedConditionMinimumHealthPercent',70))return fightRule('startingCondition.slightlyReducedCondition',95);
    if(healthPercent>=fightRule('startingCondition.reducedConditionMinimumHealthPercent',50))return fightRule('startingCondition.reducedCondition',88);
    return fightRule('startingCondition.badlyReducedCondition',78);
  }

  function rockedChance({significant=false,power=0,chin=0,damage=0,aggressive=false}={}){
    if(!significant)return 0;
    const chance=fightRule('fightFinishes.significantStrikeRockedBaseChance',.025)+Math.max(0,finite(power)-finite(chin))*fightRule('fightFinishes.powerVsChinRockedChancePerPoint',.01)+Math.max(0,finite(damage)-6)*fightRule('fightFinishes.damageRockedChancePerPoint',.008)+(aggressive?fightRule('fightFinishes.aggressiveRockedChanceBonus',.015):0);
    return clamp(chance,0,fightRule('fightFinishes.maximumRockedChance',.16));
  }

  function rockedRecoveryChance({chin=0,cardio=0,exchangesRocked=1}={}){
    const chance=fightRule('fightFinishes.rockedRecoveryBaseChance',.38)+Math.max(0,finite(chin))*fightRule('fightFinishes.rockedRecoveryChinPerPoint',.025)+Math.max(0,finite(cardio))*fightRule('fightFinishes.rockedRecoveryCardioPerPoint',.012)+(whole(exchangesRocked)>=2?fightRule('fightFinishes.rockedRecoverySecondExchangeBonus',.2):0);
    return clamp(chance,0,fightRule('fightFinishes.maximumRockedRecoveryChance',.9));
  }

  function knockoutFinishChance({targetCondition=100,rocked=false,knockdown=false,damage=0,power=0,chin=0}={}){
    const condition=clamp(finite(targetCondition,100),0,100);
    if(condition<=0)return 1;
    const existing=knockdown&&condition<28?.48:condition<10?.3:0;
    if(!rocked)return existing;
    const rockedChance=fightRule('fightFinishes.rockedFinishBaseChance',.09)+Math.max(0,finite(damage)-6)*fightRule('fightFinishes.rockedFinishDamageChancePerPoint',.012)+Math.max(0,finite(power)-finite(chin))*fightRule('fightFinishes.rockedFinishPowerVsChinPerPoint',.01)+(knockdown?fightRule('fightFinishes.rockedFinishKnockdownBonus',.22):0)+(100-condition)*.0015;
    return clamp(Math.max(existing,rockedChance),0,fightRule('fightFinishes.maximumRockedFinishChance',.58));
  }

  function submissionFinishChance({speed=0,opponentSpeed=0,cardio=0,opponentCardio=0,targetCondition=100,signature=false,rocked=false}={}){
    const chance=fightRule('fightFinishes.submissionBaseChance',.07)+(finite(speed)-finite(opponentSpeed))*fightRule('fightFinishes.submissionSpeedEdgeChancePerPoint',.012)+(finite(cardio)-finite(opponentCardio))*fightRule('fightFinishes.submissionCardioEdgeChancePerPoint',.008)+(100-clamp(finite(targetCondition,100),0,100))*fightRule('fightFinishes.submissionConditionChancePerPoint',.001)+(signature?fightRule('fightFinishes.submissionSignatureBonus',.05):0)+(rocked?fightRule('fightFinishes.submissionRockedBonus',.07):0);
    return clamp(chance,fightRule('fightFinishes.minimumSubmissionChance',.05),fightRule('fightFinishes.maximumSubmissionChance',.38));
  }

  function liveFightHealthDamage({landed=false,knockdown=false,finish=''}={}){
    const result=String(finish||'').toUpperCase();
    if(result==='SUBMISSION')return fightRule('persistentHealthDamage.submissionLoss',8);
    if(result.includes('KO'))return fightRule('persistentHealthDamage.knockoutOrTechnicalKnockoutLoss',12);
    if(knockdown)return fightRule('persistentHealthDamage.knockdown',4);
    return landed?fightRule('persistentHealthDamage.landedAttack',1):0;
  }

  function finalFightHealthLoss({rawDamage=0,won=false,forfeited=false,finish=''}={}){
    const increased=Math.ceil(Math.max(0,finite(rawDamage))*fightRule('persistentHealthDamage.totalDamageMultiplier',1.25));
    if(forfeited)return increased;
    if(won)return Math.max(increased,Math.round(fightRule('persistentHealthDamage.victoryMinimum',5)));
    const result=String(finish||'').toUpperCase();
    const minimum=result==='SUBMISSION'?fightRule('persistentHealthDamage.submissionLossMinimum',15):result.includes('KO')?fightRule('persistentHealthDamage.knockoutOrTechnicalKnockoutLossMinimum',20):fightRule('persistentHealthDamage.decisionLossMinimum',10);
    return Math.max(increased,Math.round(minimum));
  }


  function legacyXpRequirement(level){return 80+Math.max(1,whole(level,1))*40}
  function xpRequirement(level){const value=Math.max(1,whole(level,1)),lateCareerLevels=Math.max(0,value-5);return legacyXpRequirement(value)+6*lateCareerLevels*lateCareerLevels}
  function rescaleXpProgress(xp,oldRequirement,newRequirement){const previous=Math.max(1,finite(oldRequirement,1)),next=Math.max(1,finite(newRequirement,1));return Math.round(clamp(finite(xp,0)/previous,0,1)*next)}

  function opponentXpTier(winsToday=0,opponentLevel=null,playerLevel=null){
    const wins=nonNegativeWhole(winsToday);
    if(opponentLevel!==null&&playerLevel!==null&&whole(opponentLevel)<whole(playerLevel))return {wins,multiplier:fightRule('experienceRewards.lowerLevelOpponentExperienceMultiplier',0),tier:'lower_level',shortLabel:'NO XP · LOWER LEVEL',tapeLabel:'NO XP · LOWER-LEVEL OPPONENT',resultLabel:'LOWER LEVEL · NO XP'};
    if(wins>=2)return {wins,multiplier:0,tier:'exhausted',shortLabel:'NO XP · STALE MATCHUP',tapeLabel:'NO XP · STALE MATCHUP',resultLabel:'NO XP · STALE MATCHUP'};
    const repeatMultiplier=fightRule('experienceRewards.sameDayRunbackExperienceMultiplier',.5),repeatPercent=Math.round(repeatMultiplier*100);
    if(wins===1)return {wins,multiplier:repeatMultiplier,tier:'repeat',shortLabel:`${repeatPercent}% XP`,tapeLabel:`${repeatPercent}% XP · SAME-DAY RUNBACK`,resultLabel:`RUNBACK · ${repeatPercent}% XP`};
    return {wins:0,multiplier:1,tier:'full',shortLabel:'FULL XP',tapeLabel:'FULL XP · FIRST WIN TODAY',resultLabel:'FULL XP'};
  }

  function auraTitle(value=0){
    const aura=clamp(whole(value),0,100);
    if(aura>=99)return {key:'legend',label:'LEGEND',minimum:99,maximum:100};
    if(aura>=80)return {key:'iconic',label:'ICONIC',minimum:80,maximum:98};
    if(aura>=60)return {key:'elite',label:'ELITE',minimum:60,maximum:79};
    if(aura>=40)return {key:'mainstream',label:'MAINSTREAM',minimum:40,maximum:59};
    return {key:'obscure',label:'OBSCURE',minimum:0,maximum:39};
  }

  function auraGrowthMultiplier(value=0){
    const multipliers={obscure:1,mainstream:.8,elite:.6,iconic:.4,legend:.25};
    return multipliers[auraTitle(value).key]??1;
  }

  function scaledAuraGain(value,currentAura=0){
    const gain=finite(value);
    return gain>0?Math.max(1,Math.round(gain*auraGrowthMultiplier(currentAura))):Math.round(gain);
  }

  function lowerLevelAuraPenalty(playerLevel=1,opponentLevel=1){
    const gap=Math.max(1,whole(playerLevel,1)-whole(opponentLevel,1)),base=Math.max(0,whole(fightRule('auraRewards.lowerLevelWinBasePenalty',3))),step=Math.max(0,whole(fightRule('auraRewards.lowerLevelWinPenaltyPerAdditionalLevel',2))),maximum=Math.max(base,whole(fightRule('auraRewards.lowerLevelWinMaximumPenalty',10)));
    return Math.min(maximum,base+(gap-1)*step);
  }

  function auraFightChange({won=false,forfeited=false,callout=false,playerLevel=1,opponentLevel=1,upset=false,titleWon=false,titleDefense=false,exhausted=false,currentAura=0}={}){
    let change;
    if(callout)change=fightRule(won?'auraRewards.calloutWin':'auraRewards.calloutLoss',won?5:-10);
    else if(forfeited)change=fightRule('auraRewards.forfeit',-10);
    else if(!won)change=fightRule('auraRewards.normalLoss',-7);
    else if(whole(opponentLevel,1)<whole(playerLevel,1))change=-lowerLevelAuraPenalty(playerLevel,opponentLevel);
    else if(titleWon)change=fightRule('auraRewards.titleWin',10);
    else if(titleDefense)change=fightRule('auraRewards.titleDefenseWin',6);
    else if(exhausted)change=fightRule('auraRewards.exhaustedOpponent',-7);
    else if(whole(opponentLevel,1)>whole(playerLevel,1))change=Math.ceil(whole(playerLevel,1)*whole(opponentLevel,1)*fightRule('auraRewards.higherLevelWinMultiplier',.25));
    else if(upset)change=fightRule('auraRewards.upsetWin',5);
    else change=fightRule('auraRewards.normalWin',2);
    return scaledAuraGain(change,currentAura);
  }

  function nextOpponentXpStage(stageToday=0,won=false){
    const stage=clamp(nonNegativeWhole(stageToday),0,2);
    if(stage===1)return 2;
    if(stage===0&&won)return 1;
    return stage;
  }

  function fightDropEligible(winsToday=0){return opponentXpTier(winsToday).tier!=='exhausted'}

  function fightXp({playerLevel=1,opponentLevel=1,won=false,forfeited=false,upset=false,ranked=false,championship=false,titleWon=false,rival=false,opponentWinsToday=0}={}){
    if(forfeited)return {xp:0,category:'forfeit',modifiers:['FORFEIT · NO XP']};
    const fighterLevel=Math.max(1,whole(playerLevel,1)),opponent=Math.max(1,whole(opponentLevel,1));
    if(opponent<fighterLevel)return {xp:0,category:'lower_level',modifiers:['LOWER-LEVEL OPPONENT · NO XP']};
    const earlyCareerBonus=Math.max(0,fightRule('experienceRewards.earlyCareerExperienceBonusMaximum',20)-opponent*fightRule('experienceRewards.earlyCareerExperienceBonusReductionPerOpponentLevel',5)),baseVictory=fightRule('experienceRewards.victoryBaseExperiencePoints',26)+opponent*fightRule('experienceRewards.victoryExperiencePointsPerOpponentLevel',9)+earlyCareerBonus;
    let amount=baseVictory*(upset&&won?fightRule('experienceRewards.upsetVictoryExperienceMultiplier',1.25):1)*(won?1:fightRule('experienceRewards.lossExperienceMultiplier',.375));
    const modifiers=[];
    if(championship){const multiplier=fightRule('experienceRewards.championshipFightExperienceMultiplier',1.3);amount*=multiplier;modifiers.push(`WORLD TITLE BOUT BONUS +${Math.round((multiplier-1)*100)}%`)}
    else if(ranked){const multiplier=fightRule('experienceRewards.rankedFightExperienceMultiplier',1.2);amount*=multiplier;modifiers.push(`RANKED FIGHT BONUS +${Math.round((multiplier-1)*100)}%`)}
    const beltBonus=championship&&won&&titleWon?fightRule('experienceRewards.worldTitleVictoryExperienceBonus',25):0;
    if(beltBonus)modifiers.push(`WORLD TITLE WON +${beltBonus} XP`);
    const repeatTier=opponentXpTier(opponentWinsToday),earned=Math.max(0,Math.round(amount)+beltBonus);
    if(repeatTier.tier==='repeat')modifiers.push('SAME-DAY RUNBACK · 50% XP');
    else if(repeatTier.tier==='exhausted')modifiers.push('OPPONENT XP EXHAUSTED · NO XP');
    const baseCategory=beltBonus?'title_victory':championship?'championship':ranked?'ranked':'standard',category=repeatTier.tier==='full'?baseCategory:`${baseCategory}_${repeatTier.tier}`;
    return {xp:Math.max(0,Math.round(earned*repeatTier.multiplier)),category,modifiers};
  }

  function loadoutCategoryLimit(){return 2}

  function fightScore(rounds){return (Array.isArray(rounds)?rounds:[]).reduce((score,round)=>({player:score.player+finite(round.scoreP),opponent:score.opponent+finite(round.scoreO)}),{player:0,opponent:0})}
  function playerTrailing(rounds){const score=fightScore(rounds);return score.player<score.opponent}

  function opponentState(opponent,{level}){
    if(opponent.globalChampionship&&opponent.championDefense){
      return opponent.titleCooldown?'blocked':opponent.challengeEligible?'title':'locked';
    }
    if(opponent.globalChampionship)return opponent.titleCooldown?'blocked':opponent.challengeEligible?'title':'locked';
    if(opponent.network)return level>opponent.tier?'passed':'current';
    if(level<opponent.tier)return 'locked';
    if(level>opponent.tier)return 'passed';
    return 'current';
  }

  function opponentGroup(opponent,context){return !opponent.network&&!opponent.globalChampionship&&nonNegativeWhole(opponent.lossesToPlayer)>0?'rival':opponentState(opponent,context)}
  function opponentAvailable(opponent,context){if(opponent.globalChampionship&&opponent.titleCooldown)return false;const status=opponentGroup(opponent,context);return ['title','current','passed'].includes(status)||(status==='rival'&&opponent.rematchAccepted===true)}
  function championshipCareerRank(level,championship){
    const fighterLevel=Math.max(1,whole(level,1)),title=championship&&typeof championship==='object'?championship:null;
    if(title?.is_champion)return 'WORLD CHAMPION';
    if(title?.former_champion)return 'FORMER WORLD CHAMPION';
    if(title?.champion_id&&fighterLevel>=Math.max(1,whole(title.champion_level,1)))return 'TITLE CONTENDER';
    return fighterLevel>=3?'PROSPECT':'ROOKIE';
  }
  function championshipExperience(championship,{level=1,networkUnavailable=false}={}){
    const champ=championship&&typeof championship==='object'?championship:null,fighterLevel=Math.max(1,whole(level,1));
    if(networkUnavailable)return {status:'unavailable',headline:'CHAMPIONSHIP UPDATE UNAVAILABLE',action:'TRY AGAIN',disabled:false};
    if(!champ)return {status:'loading',headline:'CHECKING THE WORLD CHAMPION',action:'PLEASE WAIT',disabled:true};
    if(champ.is_champion){
      if(champ.defense_used_today)return {status:'defended',headline:'TITLE DEFENDED',action:'NEXT CHALLENGER AVAILABLE TOMORROW',disabled:true};
      if(!champ.selected_challenger_id)return {status:'no-challenger',headline:'YOU ARE THE WORLD CHAMPION',action:'NO CHALLENGER AVAILABLE',disabled:true};
      return {status:'defense',headline:'YOU ARE THE WORLD CHAMPION',action:'DEFEND YOUR TITLE',disabled:false};
    }
    if(champ.daily_bout_used)return champ.former_champion_rematch?{status:'rematch-waiting',headline:'TITLE REMATCH AVAILABLE TOMORROW',action:'AVAILABLE AT MIDNIGHT',disabled:true}:{status:'used',headline:'TITLE SHOT USED TODAY',action:'AVAILABLE AT MIDNIGHT',disabled:true};
    if(champ.former_champion_rematch)return {status:'rematch',headline:'TITLE REMATCH AVAILABLE',action:'RECLAIM YOUR TITLE',disabled:false};
    const requiredLevel=Math.max(1,whole(champ.champion_level,1));
    if(fighterLevel>=requiredLevel)return {status:'eligible',headline:'TITLE SHOT AVAILABLE',action:'CHALLENGE FOR TITLE',disabled:false};
    return {status:'locked',headline:'WORLD TITLE SHOT LOCKED',action:`REACH LEVEL ${requiredLevel}`,disabled:true};
  }
  function championshipSettlementPresentation({status='',mode='challenge',isChampion=false,defenses=0,championHandle='' }={}){
    if(status==='stale')return {heading:'CHAMPIONSHIP CHANGED',message:'The belt changed before this result could transfer it.'};
    if(status==='expired')return {heading:'TITLE RESULT EXPIRED',message:'The championship was not changed.'};
    if(status==='champion_defended')return mode==='defense'?{heading:'TITLE DEFENDED',message:`${nonNegativeWhole(defenses)} SUCCESSFUL DEFENSE${nonNegativeWhole(defenses)===1?'':'S'} · NEXT CHALLENGER AVAILABLE TOMORROW`}:{heading:'TITLE FIGHT LOST',message:'The reigning champion kept the belt.'};
    if(status==='new_champion'&&isChampion)return mode==='rematch'?{heading:'TITLE RECLAIMED',message:'You took back the World Championship.'}:{heading:'YOU ARE WORLD CHAMPION',message:'The World Championship is yours.'};
    if(status==='new_champion')return {heading:'YOU LOST THE WORLD TITLE',message:`@${String(championHandle||'THE NEW CHAMPION')} took the belt. TITLE REMATCH AVAILABLE TOMORROW.`};
    return {heading:'CHAMPIONSHIP RESULT SETTLED',message:'The official championship record is updated.'};
  }
  function networkOpponentRatings(tier,avatarStats={},archetypeMods={},difficulty=0){
    const base=generatedOpponentBaseRating(tier),variance=clamp(finite(difficulty),-.7,.7),ratings={};
    for(const key of ['power','speed','chin','cardio']){
      const allocation=clamp(finite(avatarStats[key],5),2,8),style=clamp(finite(archetypeMods[key],0),-2,2);
      ratings[key]=Math.max(3,Math.round(base+variance+style+(allocation-5)*.35));
    }
    return ratings;
  }

  function generatedOpponentBaseRating(level){
    const tier=Math.max(1,whole(level,1)),base=fightRule('computerGeneratedOpponentDifficulty.baseAttributeRatingAtLevelOne',4),linearGain=fightRule('computerGeneratedOpponentDifficulty.linearAttributeRatingGainPerLevel',1.9),growthStart=fightRule('computerGeneratedOpponentDifficulty.compoundingGrowthStartsAtLevel',4),growthMultiplier=fightRule('computerGeneratedOpponentDifficulty.attributeGrowthMultiplierPerLevel',1.04),compoundingLevels=Math.max(0,tier-growthStart+1);
    return (base+(tier-1)*linearGain)*Math.pow(growthMultiplier,compoundingLevels);
  }

  function capOpponentRatings(ratings={},fighterStats={},maximumAdvantage=1){
    const keys=['power','speed','chin','cardio'],playerTotal=keys.reduce((sum,key)=>sum+Math.max(1,whole(fighterStats?.[key],1)),0),cap=Math.max(keys.length,playerTotal+whole(maximumAdvantage)),values=Object.fromEntries(keys.map(key=>[key,Math.max(1,whole(ratings?.[key],1))])),total=keys.reduce((sum,key)=>sum+values[key],0);
    if(total<=cap)return values;
    const ratio=cap/total,fractions=[];let assigned=0;
    for(const key of keys){const scaled=values[key]*ratio,wholeValue=Math.max(1,Math.floor(scaled));values[key]=wholeValue;assigned+=wholeValue;fractions.push({key,remainder:scaled-wholeValue})}
    fractions.sort((a,b)=>b.remainder-a.remainder||keys.indexOf(a.key)-keys.indexOf(b.key));
    for(let index=0;assigned<cap;index=(index+1)%fractions.length){values[fractions[index].key]++;assigned++}
    return values;
  }

  function fightPlanAssessment({player={},opponent={},plan={},fighterStyle='striker',opponentStyle='striker',focus=80,adaptationScale=.5}={}){
    const stat=(source,key)=>Math.max(1,finite(source?.[key],1)),p={power:stat(player,'power'),speed:stat(player,'speed'),chin:stat(player,'chin'),cardio:stat(player,'cardio')},o={power:stat(opponent,'power'),speed:stat(opponent,'speed'),chin:stat(opponent,'chin'),cardio:stat(opponent,'cardio')};
    const cardioEdge=p.cardio-o.cardio,speedEdge=p.speed-o.speed,paceSignal=clamp(cardioEdge/4+(p.cardio-8)/12,-1,1),pace=plan.pace==='fast'?paceSignal:-paceSignal;
    const aggressionSignal=clamp((p.power-o.chin)/4-(o.power-p.chin)/6+cardioEdge/10-speedEdge/10,-1,1),offense=plan.offense==='aggressive'?aggressionSignal:-aggressionSignal;
    const responseStyle=opponentStyle==='grappler'?'striker':'grappler',needsAdapt=fighterStyle!==responseStyle,execution=clamp((finite(focus,80)-70)/20,-1,1),lowFocusBonus=clamp((70-finite(focus,80))/40,0,.25);
    const tacticsRaw=plan.tactics==='adapt'?(needsAdapt?execution:-.65):(needsAdapt?-.15:.85)+lowFocusBonus,tactics=tacticsRaw*(plan.tactics==='adapt'?clamp(finite(adaptationScale,.5),0,1):1);
    const score=clamp((pace+offense+tactics)/3,-1,1),playerAverage=(p.power+p.speed+p.chin+p.cardio)/4,opponentAverage=(o.power+o.speed+o.chin+o.cardio)/4,closeness=clamp(1-Math.abs(playerAverage-opponentAverage)/10,.35,1),modifier=clamp(score*.12*closeness,-.12,.12),grade=score>=.2?'EDGE':score<=-.2?'EXPOSED':'EVEN',components={pace,offense,tactics},axis=Object.entries(components).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1]))[0]?.[0]||'pace';
    return {grade,score,modifier,closeness,axis,components};
  }

  function cardioImbalanceFatigue(fighter={}){
    const cardio=Math.max(1,finite(fighter.cardio,1)),explosive=Math.max(cardio,finite(fighter.power,cardio),finite(fighter.speed,cardio)),ratio=explosive/cardio;
    return clamp((ratio-fightRule('fatigue.powerOrSpeedToCardioRatioThreshold',1.75))*fightRule('fatigue.imbalancePenaltyPerRatioPoint',.012),0,fightRule('fatigue.maximumImbalancePenaltyPerExchange',.018));
  }

  function shouldPersistCareer(retirementPending,saveWasKnown=false,currentRaw=undefined){
    return retirementPending!==true&&!(saveWasKnown===true&&currentRaw===null);
  }

  function clearCareerStorage(storage,keys){
    const removed=[];
    for(const key of Array.isArray(keys)?keys:[]){
      try{storage?.removeItem?.(key);removed.push(key)}catch(error){/* one blocked key must not preserve the others */}
    }
    return removed;
  }
  function socialInteractionReward(seed,currentAura=0){
    const value=nonNegativeWhole(seed);
    return {followers:5+value%8,aura:scaledAuraGain(1+Math.floor(value/8)%3,currentAura)};
  }
  function normalizeFighterIdentity(value){
    const name=String(value||'').replace(/[^A-Za-z0-9_]+/g,'').slice(0,32);
    return /^[A-Za-z][A-Za-z0-9_]{2,31}$/.test(name)?name:'';
  }
  function displayFighterIdentity(value,openers=[],descriptors=[],cityCodes=[]){
    const name=normalizeFighterIdentity(value);
    if(!name)return name;
    const codes=[...cityCodes].sort((a,b)=>String(b).length-String(a).length),legacySerial=name.match(/(_\d+)$/),legacyPrefix=legacySerial&&codes.find(code=>name.toUpperCase().startsWith(String(code).toUpperCase()));
    if(legacyPrefix){
      const middle=name.slice(String(legacyPrefix).length,-legacySerial[1].length);
      if(middle)return `${String(legacyPrefix).toUpperCase()}${middle[0].toUpperCase()}${middle.slice(1).toLowerCase()}${legacySerial[1]}`;
    }
    if(/[a-z]/.test(name))return name;
    const canonical=(list,token)=>list.find(word=>String(word).toUpperCase()===token)||'';
    const suffix=codes.find(code=>name.endsWith(String(code).toUpperCase()))||'';
    const stem=suffix?name.slice(0,-String(suffix).length):name;
    const first=[...openers].sort((a,b)=>String(b).length-String(a).length).find(word=>stem.startsWith(String(word).toUpperCase()))||'';
    if(first){
      const second=canonical(descriptors,stem.slice(String(first).length));
      if(second)return `${first}${second}${String(suffix).toUpperCase()}`;
    }
    return name[0].toUpperCase()+name.slice(1).toLowerCase();
  }
  function buildFighterIdentity(color,descriptor,cityCode){
    const word=value=>{const clean=String(value||'').replace(/[^A-Za-z]+/g,'');return clean?clean[0].toUpperCase()+clean.slice(1).toLowerCase():''},suffix=String(cityCode||'').toUpperCase().replace(/[^A-Z]+/g,'');
    if(!/^[A-Z]{3,4}$/.test(suffix))return '';
    return normalizeFighterIdentity(`${word(color)}${word(descriptor)}${suffix}`);
  }
  function randomFighterIdentity(openers,descriptors,cityCode,random=Math.random){
    const first=Array.isArray(openers)?openers.filter(Boolean):[],second=Array.isArray(descriptors)?descriptors.filter(Boolean):[];
    if(!first.length||!second.length)return '';
    const pick=list=>{const value=Number(random()),unit=Number.isFinite(value)?clamp(value,0,0.999999999999):0;return list[Math.floor(unit*list.length)]||''},opener=pick(first),remaining=second.filter(word=>word!==opener);
    return buildFighterIdentity(opener,pick(remaining.length?remaining:second),cityCode);
  }
  function nextVictoryPackProgress(value,steps=1){return Math.min(4,nonNegativeWhole(value)+clamp(nonNegativeWhole(steps),0,2))}
  function victoryPackReady(value){return nonNegativeWhole(value)>=4}
  function victoryPackWinEligible({playerLevel=1,opponentLevel=1,repeatEligible=true}={}){
    return repeatEligible&&Math.max(1,nonNegativeWhole(opponentLevel))>=Math.max(1,nonNegativeWhole(playerLevel));
  }
  function landingChampionshipProof(champ,loaded=false,unavailable=false){
    if(champ?.champion_handle){const handle=String(champ.champion_handle).replace(/^@/,'');const defenses=Math.max(0,Number(champ.defenses)||0);return {heading:`@${handle}`,meta:`${defenses} successful title defense${defenses===1?'':'s'}`,state:'loaded'}}
    if(unavailable)return {heading:'TITLE UPDATE OFFLINE',meta:'Champion status unavailable — play anytime',state:'offline'};
    if(loaded)return {heading:'THE BELT IS VACANT',meta:'The next reign is waiting',state:'vacant'};
    return {heading:'CHECKING THE CHAMPION…',meta:'Title update loading',state:'loading'};
  }

  function rankingFightEntry({won=false,playerLevel=1,opponentLevel=1,ranked=false,championship=false}={}){
    const levelDifference=whole(opponentLevel,1)-whole(playerLevel,1),quality=clamp(50+levelDifference*10+(ranked?5:0)+(championship?15:0),0,100);
    return {won:won===true,quality};
  }

  function rankingComponents(profile){
    const wins=nonNegativeWhole(profile?.wins),losses=nonNegativeWhole(profile?.losses),fights=wins+losses,winPercentage=fights?wins/fights:0,provenWinPercentage=fights?(wins+2)/(fights+4):0,history=(Array.isArray(profile?.rankingHistory)?profile.rankingHistory:[]).filter(entry=>entry&&typeof entry==='object').slice(-10),recentScore=history.length?history.filter(entry=>entry.won===true).length/history.length*100:provenWinPercentage*100,qualityWins=history.filter(entry=>entry.won===true),qualityScore=qualityWins.length?qualityWins.reduce((sum,entry)=>sum+clamp(finite(entry.quality,50),0,100),0)/qualityWins.length:50,attributeTotal=Math.max(20,finite(profile?.attributeTotal,20+Math.max(0,whole(profile?.level,1)-1))),resumeScore=provenWinPercentage*75+Math.min(fights,50)/50*25,skillScore=clamp(attributeTotal/150*100,0,100),score=resumeScore*.5+qualityScore*.25+recentScore*.15+skillScore*.1;
    return {score,resumeScore,qualityScore,recentScore,skillScore,attributeTotal,winPercentage,provenWinPercentage,fights};
  }

  function rankFighters(profiles,championship=null,limit=25){
    const championId=String(championship?.champion_id||''),championHandle=String(championship?.champion_handle||'').replace(/^@/,'').toLowerCase(),seen=new Set(),fighters=[];
    for(const profile of Array.isArray(profiles)?profiles:[]){
      const id=String(profile?.id||''),handle=String(profile?.handle||'').replace(/^@/,'');
      if((!id&&!handle)||seen.has(id||handle.toLowerCase()))continue;
      seen.add(id||handle.toLowerCase());
      const wins=nonNegativeWhole(profile?.wins),losses=nonNegativeWhole(profile?.losses),components=rankingComponents({...profile,wins,losses});
      fighters.push({...profile,id,handle,wins,losses,...components,level:Math.max(1,whole(profile?.level,1)),rankScore:components.score,isChampion:Boolean(championId&&id===championId||championHandle&&handle.toLowerCase()===championHandle)});
    }
    fighters.sort((a,b)=>Number(b.isChampion)-Number(a.isChampion)||b.rankScore-a.rankScore||b.winPercentage-a.winPercentage||b.fights-a.fights||a.handle.localeCompare(b.handle)||a.id.localeCompare(b.id));
    return fighters.slice(0,Math.max(1,Math.min(1000,whole(limit,25))));
  }

  function rankedFightTitleMode({playerIsChampion=false,defenseUsedToday=false,opponentIsChampion=false}={}){
    if(playerIsChampion)return defenseUsedToday?'ranked':'defense';
    return opponentIsChampion?'challenge':'ranked';
  }

  function undiscoveredCollectibles(items,ownedIds=[],level=1,rarity=''){
    const owned=new Set(Array.isArray(ownedIds)?ownedIds.map(String):[]),maximumLevel=Math.max(1,whole(level,1)),targetRarity=String(rarity||'').toUpperCase();
    return (Array.isArray(items)?items:[]).filter(item=>item&&typeof item.id==='string'&&!owned.has(item.id)&&(Math.max(1,whole(item.minLevel,1))<=maximumLevel)&&(!targetRarity||String(item.rarity||'').toUpperCase()===targetRarity));
  }

  function normalizeGearDrop(drop,rarities=['COMMON','RARE','EPIC','LEGENDARY']){
    if(!drop||typeof drop!=='object'||!drop.item||typeof drop.item!=='object')return null;
    const item=drop.item,id=typeof item.id==='string'?item.id.trim():'',name=typeof item.name==='string'?item.name.trim():'',category=typeof item.category==='string'?item.category.trim():'';
    if(!id||!name||!category)return null;
    const allowed=(Array.isArray(rarities)?rarities:[]).map(value=>String(value).toUpperCase()),rarity=String(drop.rarity||item.rarity||'').toUpperCase();
    if(!allowed.includes(rarity))return null;
    return {
      item:Object.assign({},item,{id,name,category}),
      rarity,
      count:Math.max(1,nonNegativeWhole(drop.count,1)),
      isNew:drop.isNew===true,
      autoEquipped:drop.autoEquipped===true,
      reason:typeof drop.reason==='string'&&drop.reason.trim()?drop.reason.trim():'GEAR DROP',
      extras:typeof drop.extras==='string'?drop.extras:''
    };
  }

  return {clamp,localDateKey,millisecondsUntilNextLocalDay,formatCountdown,validFighterAllocation,rollFighterAllocation,fighterArchetypeFromStats,isBlankCareer,careerLandingMode,landingChampionshipProof,rankingFightEntry,rankingComponents,rankFighters,rankedFightTitleMode,parseStoredState,selectStoredState,shouldBackupRaw,shouldPersistCareer,clearCareerStorage,normalizeCoreState,dailyCountersFor,applyDailyFightStreak,spendEnergy,applyLevelUpResources,passiveRecovery,followersPerHour,passiveFollowerGrowth,fightFollowerReward,recoveryTimeRemaining,victoryAttributePointReward,awardVictoryAttributePoint,firstContractPending,firstContractUnlockEligible,lowerLevelFollowerPenalty,matchupAdvice,assignAttributePoint,sponsorProgress,fightWinShareText,resourceIsCritical,fightEnergyCost,bookFight,startingFightCondition,rockedChance,rockedRecoveryChance,knockoutFinishChance,submissionFinishChance,liveFightHealthDamage,finalFightHealthLoss,legacyXpRequirement,xpRequirement,rescaleXpProgress,opponentXpTier,auraTitle,auraGrowthMultiplier,scaledAuraGain,lowerLevelAuraPenalty,auraFightChange,nextOpponentXpStage,fightDropEligible,fightXp,loadoutCategoryLimit,fightScore,playerTrailing,opponentState,opponentGroup,opponentAvailable,championshipCareerRank,championshipExperience,championshipSettlementPresentation,networkOpponentRatings,generatedOpponentBaseRating,capOpponentRatings,fightPlanAssessment,cardioImbalanceFatigue,socialInteractionReward,normalizeFighterIdentity,displayFighterIdentity,buildFighterIdentity,randomFighterIdentity,nextVictoryPackProgress,victoryPackReady,victoryPackWinEligible,undiscoveredCollectibles,normalizeGearDrop};
});

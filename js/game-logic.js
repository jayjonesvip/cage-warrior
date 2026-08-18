(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.CAGE_LOGIC=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const finite=(value,fallback=0)=>{if(value===null||value==='')return fallback;const number=Number(value);return Number.isFinite(number)?number:fallback};
  const whole=(value,fallback=0)=>Math.floor(finite(value,fallback));
  const nonNegativeWhole=(value,fallback=0)=>Math.max(0,whole(value,fallback));

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
    state.cash=Math.max(0,whole(state.cash,defaults.cash));
    const careerEarnings=Number(raw.careerEarnings),hasLegacyCash=Object.prototype.hasOwnProperty.call(raw,'cash');
    state.careerEarnings=Number.isFinite(careerEarnings)?Math.max(0,whole(careerEarnings)):hasLegacyCash?state.cash:Math.max(0,whole(defaults.careerEarnings));
    state.fans=nonNegativeWhole(state.fans,defaults.fans);
    state.wins=nonNegativeWhole(state.wins,defaults.wins);
    state.losses=nonNegativeWhole(state.losses,defaults.losses);
    state.winStreak=nonNegativeWhole(state.winStreak,defaults.winStreak);
    state.bestStreak=Math.max(state.winStreak,nonNegativeWhole(state.bestStreak,defaults.bestStreak));
    state.maxEnergy=Math.max(1,finite(state.maxEnergy,defaults.maxEnergy));
    state.maxHealth=Math.max(1,finite(state.maxHealth,defaults.maxHealth));
    state.energy=clamp(finite(state.energy,defaults.energy),0,state.maxEnergy);
    state.health=clamp(finite(state.health,defaults.health),0,state.maxHealth);
    state.hype=clamp(finite(state.hype,defaults.hype),0,100);
    const stats=state.stats&&typeof state.stats==='object'&&!Array.isArray(state.stats)?state.stats:{};
    state.stats={};
    for(const key of ['power','speed','chin','cardio'])state.stats[key]=Math.max(1,finite(stats[key],defaults.stats[key]));
    const usableOpponent=entry=>entry&&typeof entry==='object'&&!Array.isArray(entry)&&
      typeof entry.key==='string'&&entry.key&&typeof entry.name==='string'&&entry.name.trim()&&
      ['tier','min','power','speed','chin','cardio','reward','fans'].every(key=>Number.isFinite(entry[key]));
    state.roster=Array.isArray(state.roster)?state.roster.filter(usableOpponent):[];
    const pending=state.pendingFight;
    state.pendingFight=pending&&typeof pending==='object'&&typeof pending.key==='string'&&pending.key?{
      key:pending.key,
      cost:clamp(whole(pending.cost,15),1,35),
      startedAt:Math.max(0,finite(pending.startedAt,0))
    }:null;
    state.lastSave=Math.max(0,finite(state.lastSave,Date.now()));
    state.lastDaily=typeof state.lastDaily==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(state.lastDaily)?state.lastDaily:'';
    return state;
  }

  function dailyCountersFor(counters,today){
    if(!counters||typeof counters!=='object'||counters.date!==today)return {date:today,fight:0,train:0,sparring:0,hustle:0,blackjack:0,cageDice:0,publicity:0,recovery:0};
    return {
      date:today,
      fight:clamp(nonNegativeWhole(counters.fight),0,10),
      train:clamp(nonNegativeWhole(counters.train),0,4),
      sparring:clamp(nonNegativeWhole(counters.sparring),0,2),
      hustle:clamp(nonNegativeWhole(counters.hustle),0,3),
      blackjack:clamp(nonNegativeWhole(counters.blackjack),0,1),
      cageDice:clamp(nonNegativeWhole(counters.cageDice),0,1),
      publicity:clamp(nonNegativeWhole(counters.publicity),0,1),
      recovery:clamp(nonNegativeWhole(counters.recovery),0,1)
    };
  }

  function spendEnergy(state,cost){
    const amount=Math.max(0,finite(cost));
    if(state.energy<amount)return false;
    state.energy=clamp(state.energy-amount,0,state.maxEnergy);
    return true;
  }

  function applyLevelUpResources(state,fullRestore=false){
    state.maxEnergy=Math.max(1,finite(state.maxEnergy)+3);
    state.maxHealth=Math.max(1,finite(state.maxHealth)+5);
    state.energy=fullRestore?state.maxEnergy:clamp(finite(state.energy)+30,0,state.maxEnergy);
    state.health=fullRestore?state.maxHealth:clamp(finite(state.health)+25,0,state.maxHealth);
    return state;
  }

  function resourceIsCritical(value,maximum){
    const max=Math.max(1,finite(maximum,1));
    return clamp(finite(value),0,max)/max<.25;
  }

  function fightRoundCost(level){
    const careerLevel=Math.max(1,whole(level,1));
    return Math.min(10,5+Math.ceil(careerLevel/2));
  }

  function bookFight(state,key,cost=15,startedAt=Date.now(),requiredEnergy=cost){
    if(state.pendingFight)return {ok:false,reason:'pending'};
    if(state.energy<Math.max(cost,finite(requiredEnergy,cost)))return {ok:false,reason:'energy'};
    if(!spendEnergy(state,cost))return {ok:false,reason:'energy'};
    state.pendingFight={key,cost:Math.max(0,finite(cost)),startedAt:Math.max(0,finite(startedAt))};
    return {ok:true,reason:''};
  }

  function chargePendingFightEnergy(state,cost){
    if(!state.pendingFight)return false;
    const amount=Math.max(0,finite(cost));
    if(!spendEnergy(state,amount))return false;
    state.pendingFight.cost=Math.max(0,finite(state.pendingFight.cost))+amount;
    return true;
  }

  function availableFightEnergy(state,roundsRemaining,roundCost=10){
    return Math.max(0,finite(state.energy)-nonNegativeWhole(roundsRemaining)*Math.max(0,finite(roundCost)));
  }

  function trainingQuote(state,action,coach,coachFee,sessionsLeft){
    const sessions=Math.max(1,nonNegativeWhole(action.sessions,1));
    const cashCost=coach?Math.max(0,whole(coachFee))*sessions:0;
    const energyCost=Math.max(0,finite(action.cost));
    if(sessionsLeft<sessions)return {ok:false,reason:'limit',sessions,cashCost,energyCost};
    if(state.cash<cashCost)return {ok:false,reason:'cash',sessions,cashCost,energyCost};
    if(state.energy<energyCost)return {ok:false,reason:'energy',sessions,cashCost,energyCost};
    return {ok:true,reason:'',sessions,cashCost,energyCost};
  }

  function trainingCost(action,repeatCount=0){
    const base=Math.max(0,finite(action&&action.cost,0));
    return Math.max(1,Math.ceil(base+Math.max(0,nonNegativeWhole(repeatCount))*2));
  }

  function trainingGain(baseGain,coach,perfect,repeatCount=0){
    const base=Math.max(1,Math.round(finite(baseGain,1)));
    return base+(coach||perfect?1:0);
  }

  function trainingPerfectChance(coach=false){return coach ? .27 : .17}
  function trainingInjuryChance(overtraining=false,coach=false){return overtraining?(coach ? .20 : .33):0}

  function trainingCooldownDuration({type='training',gain=1,skills=1}={}){
    const minutes=type==='sparring'?(Number(skills)>=2?4:2):(Number(gain)>=2?2:1);
    return minutes*60000;
  }

  function trainingRiskBonus(overtraining=false,injured=false){return overtraining&&!injured?.25:0}

  function hustleBonus(actionId,chanceRoll=1,rewardRoll=0){
    if(clamp(finite(chanceRoll,1),0,1)>=.25)return {type:'',amount:0};
    const roll=clamp(finite(rewardRoll,0),0,.999999);
    if(actionId==='corner-gym-cleanup')return {type:'cash',amount:2+Math.floor(roll*49)};
    if(actionId==='unload-freight')return {type:'power',amount:.5};
    if(actionId==='nightclub-door')return {type:'hype',amount:2+Math.floor(roll*3)};
    return {type:'',amount:0};
  }

  function injuredStat(value,injured=false){
    const rating=Math.max(1,finite(value,1));
    return injured?Math.max(1,rating-Math.max(1,rating*.10)):rating;
  }

  function sparringDamage(baseDamage,repeatCount=0){
    return Math.max(0,finite(baseDamage)+Math.max(0,nonNegativeWhole(repeatCount))*2);
  }

  function recoveryQuote(state,treatment,fee,used){
    const cashCost=Math.max(0,whole(fee)),energyGain=Math.max(0,finite(treatment.energy)),healthGain=Math.max(0,finite(treatment.health));
    if(used)return {ok:false,reason:'limit',cashCost,energyGain,healthGain};
    if(state.cash<cashCost)return {ok:false,reason:'cash',cashCost,energyGain,healthGain};
    const energyRoom=Math.max(0,finite(state.maxEnergy)-finite(state.energy)),healthRoom=Math.max(0,finite(state.maxHealth)-finite(state.health));
    if(Math.min(energyRoom,energyGain)+Math.min(healthRoom,healthGain)<=0)return {ok:false,reason:'full',cashCost,energyGain,healthGain};
    return {ok:true,reason:'',cashCost,energyGain,healthGain};
  }

  function applyRecovery(state,treatment){
    const beforeEnergy=state.energy,beforeHealth=state.health;
    state.energy=clamp(finite(state.energy)+Math.max(0,finite(treatment.energy)),0,state.maxEnergy);
    state.health=clamp(finite(state.health)+Math.max(0,finite(treatment.health)),0,state.maxHealth);
    return {energy:state.energy-beforeEnergy,health:state.health-beforeHealth};
  }

  function startingFightCondition(health,maxHealth){
    const healthPercent=clamp(finite(health)/Math.max(1,finite(maxHealth,100))*100,0,100);
    if(healthPercent>=90)return 100;
    if(healthPercent>=70)return 95;
    if(healthPercent>=50)return 88;
    return 78;
  }

  function liveFightHealthDamage({landed=false,knockdown=false,finish=''}={}){
    const result=String(finish||'').toUpperCase();
    if(result==='SUBMISSION')return 8;
    if(result.includes('KO'))return 12;
    if(knockdown)return 4;
    return landed?1:0;
  }

  function blackjackHandValue(cards){
    const hand=Array.isArray(cards)?cards:[];
    let total=0,aces=0;
    for(const card of hand){
      const raw=typeof card==='string'?card:(card&&card.rank)||'';
      const rank=String(raw).toUpperCase().replace(/[SHDC]$/,'');
      if(rank==='A'){total+=11;aces++}
      else if(['K','Q','J','T','10'].includes(rank))total+=10;
      else{const value=Number(rank);if(Number.isInteger(value)&&value>=2&&value<=9)total+=value}
    }
    let softAces=aces;
    while(total>21&&softAces>0){total-=10;softAces--}
    return {total,soft:softAces>0,blackjack:hand.length===2&&total===21,bust:total>21};
  }

  function blackjackBetLimit(cash){return Math.floor(Math.max(0,finite(cash))*.25)}

  function blackjackOutcome(playerCards,dealerCards,bet){
    const wager=Math.max(0,whole(bet)),player=blackjackHandValue(playerCards),dealer=blackjackHandValue(dealerCards);
    let result='loss',payout=0;
    if(player.bust){result='loss'}
    else if(player.blackjack&&dealer.blackjack){result='push';payout=wager}
    else if(player.blackjack){result='blackjack';payout=wager+Math.round(wager*1.5)}
    else if(dealer.blackjack){result='loss'}
    else if(dealer.bust||player.total>dealer.total){result='win';payout=wager*2}
    else if(player.total===dealer.total){result='push';payout=wager}
    return {result,payout,profit:payout-wager,player,dealer};
  }

  function cageDiceBetLimit(cash){return Math.floor(Math.max(0,finite(cash))*.25)}

  function cageDiceOutcome(die1,die2,choice,bet){
    const first=clamp(whole(die1,1),1,6),second=clamp(whole(die2,1),1,6),total=first+second,doubles=first===second,wager=Math.max(0,whole(bet));
    const selected=['under','over','seven','doubles'].includes(choice)?choice:'under',multiplier={under:2,over:2,seven:5,doubles:6}[selected];
    const won=selected==='under'?total<7:selected==='over'?total>7:selected==='seven'?total===7:doubles,payout=won?wager*multiplier:0;
    return {die1:first,die2:second,total,doubles,choice:selected,multiplier,won,payout,profit:payout-wager};
  }

  function payoutForOpponent(opponent,level){
    const reward=Math.max(0,finite(opponent&&opponent.reward));
    const tier=Math.max(1,whole(opponent&&opponent.tier,1));
    const full=!!(opponent&&opponent.globalChampionship)||(!(opponent&&opponent.lossesToPlayer)&&tier>=Math.max(1,whole(level,1)));
    return Math.round(reward*(full?1:.5));
  }

  function winFightCash({basePurse,hype=0,cashBonus=0,winStreak=0,upset=false,rivalry=false,variance=1}){
    const streakBonus=Math.min(.25,Math.max(0,nonNegativeWhole(winStreak)-1)*.05);
    return Math.round(Math.max(0,finite(basePurse))*(1+finite(hype)/130)*(1+finite(cashBonus)/100)*(1+streakBonus+(upset?.25:0)+(rivalry?.15:0))*finite(variance,1));
  }

  function lossFightCash(basePurse){return Math.round(Math.max(0,finite(basePurse))*.08)}

  function xpRequirement(level){return 80+Math.max(1,whole(level,1))*40}

  function fightXp({playerLevel=1,opponentLevel=1,won=false,forfeited=false,upset=false,ranked=false,championship=false,titleWon=false,rival=false}={}){
    if(forfeited)return {xp:0,category:'forfeit',modifiers:['FORFEIT · NO XP']};
    const fighterLevel=Math.max(1,whole(playerLevel,1)),opponent=Math.max(1,whole(opponentLevel,1));
    const earlyCareerBonus=Math.max(0,20-opponent*5),baseVictory=26+opponent*9+earlyCareerBonus;
    const reduced=!!rival||opponent<fighterLevel,reductionReason=rival?'RIVAL FIGHT · 50% XP':'PAST-LEVEL FIGHT · 50% XP';
    let amount=baseVictory*(upset&&won?1.25:1)*(reduced?.5:1)*(won?1:.375);
    const modifiers=[];
    if(reduced)modifiers.push(reductionReason);
    if(championship){amount*=1.3;modifiers.push('WORLD TITLE BOUT BONUS +30%')}
    else if(ranked){amount*=1.2;modifiers.push('RANKED FIGHT BONUS +20%')}
    const beltBonus=championship&&won&&titleWon?25:0;
    if(beltBonus)modifiers.push('WORLD TITLE WON +25 XP');
    const category=beltBonus?'title_victory':championship?'championship':ranked?'ranked':reduced?'reduced':'standard';
    return {xp:Math.max(0,Math.round(amount)+beltBonus),category,modifiers};
  }

  function gearLoadoutLimit(level){return finite(level)>=8?4:2}

  function fightScore(rounds){return (Array.isArray(rounds)?rounds:[]).reduce((score,round)=>({player:score.player+finite(round.scoreP),opponent:score.opponent+finite(round.scoreO)}),{player:0,opponent:0})}
  function playerTrailing(rounds){const score=fightScore(rounds);return score.player<score.opponent}

  function opponentState(opponent,{level}){
    if(opponent.globalChampionship&&opponent.championDefense){
      return opponent.titleCooldown?'blocked':opponent.challengeEligible?'title':'locked';
    }
    if(opponent.globalChampionship)return opponent.titleCooldown?'blocked':opponent.challengeEligible?'title':'locked';
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
    const base=4+(Math.max(1,whole(tier,1))-1)*1.9,variance=clamp(finite(difficulty),-.7,.7),ratings={};
    for(const key of ['power','speed','chin','cardio']){
      const allocation=clamp(finite(avatarStats[key],5),2,8),style=clamp(finite(archetypeMods[key],0),-2,2);
      ratings[key]=Math.max(3,Math.round(base+variance+style+(allocation-5)*.35));
    }
    return ratings;
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
  function socialInteractionReward(seed){
    const value=nonNegativeWhole(seed);
    return {followers:5+value%8,hype:1+Math.floor(value/8)%3};
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
  function nextGearPityCount(value){return Math.min(4,nonNegativeWhole(value)+1)}
  function isGearPity(value){return nonNegativeWhole(value)>=4}
  function nextEndorsementId(ids,history){const completed=new Set(Array.isArray(history)?history:[]);return ids.find(id=>!completed.has(id))||''}
  function landingChampionshipProof(champ,loaded=false,unavailable=false){
    if(champ?.champion_handle){const handle=String(champ.champion_handle).replace(/^@/,'');const defenses=Math.max(0,Number(champ.defenses)||0);return {heading:`@${handle}`,meta:`${defenses} successful title defense${defenses===1?'':'s'}`,state:'loaded'}}
    if(unavailable)return {heading:'TITLE UPDATE OFFLINE',meta:'Champion status unavailable — play anytime',state:'offline'};
    if(loaded)return {heading:'THE BELT IS VACANT',meta:'The next reign is waiting',state:'vacant'};
    return {heading:'CHECKING THE CHAMPION…',meta:'Title update loading',state:'loading'};
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
      reason:typeof drop.reason==='string'&&drop.reason.trim()?drop.reason.trim():'GEAR DROP',
      extras:typeof drop.extras==='string'?drop.extras:''
    };
  }

  return {clamp,localDateKey,millisecondsUntilNextLocalDay,formatCountdown,isBlankCareer,careerLandingMode,landingChampionshipProof,parseStoredState,selectStoredState,shouldBackupRaw,shouldPersistCareer,clearCareerStorage,normalizeCoreState,dailyCountersFor,spendEnergy,applyLevelUpResources,resourceIsCritical,fightRoundCost,bookFight,chargePendingFightEnergy,availableFightEnergy,trainingQuote,trainingCost,trainingGain,trainingPerfectChance,trainingInjuryChance,trainingCooldownDuration,trainingRiskBonus,hustleBonus,injuredStat,sparringDamage,recoveryQuote,applyRecovery,startingFightCondition,liveFightHealthDamage,blackjackHandValue,blackjackBetLimit,blackjackOutcome,cageDiceBetLimit,cageDiceOutcome,payoutForOpponent,winFightCash,lossFightCash,xpRequirement,fightXp,gearLoadoutLimit,fightScore,playerTrailing,opponentState,opponentGroup,opponentAvailable,championshipCareerRank,championshipExperience,championshipSettlementPresentation,networkOpponentRatings,socialInteractionReward,normalizeFighterIdentity,displayFighterIdentity,buildFighterIdentity,randomFighterIdentity,nextGearPityCount,isGearPity,nextEndorsementId,normalizeGearDrop};
});

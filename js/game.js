(async () => {
  'use strict';

  const FIGHT_RULE_CONFIGURATION=globalThis.CAGE_FIGHT_RULES;
  if(FIGHT_RULE_CONFIGURATION?.ready)await FIGHT_RULE_CONFIGURATION.ready;
  const fightRule=(path,fallback)=>FIGHT_RULE_CONFIGURATION?.number(path,fallback)??fallback;
  const LOGIC=globalThis.CAGE_LOGIC;
  if(!LOGIC)throw new Error('game-logic.js must load before game.js');
  const STRINGS=globalThis.CAGE_STRINGS;
  if(!STRINGS)throw new Error('strings.js must load before game.js');
  const SHARED_UI=globalThis.CAGE_SHARED_UI;
  if(!SHARED_UI)throw new Error('shared-ui.js must load before game.js');
  const SHARED_FEED=globalThis.CAGE_SOCIAL;
  function copyText(template,values={}){return String(template).replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g,(match,key)=>Object.prototype.hasOwnProperty.call(values,key)?String(values[key]):match)}
  function copyPosts(entries,values={}){return entries.map(entry=>Object.assign({},entry,{text:copyText(entry.text,values)},entry.author?{author:copyText(entry.author,values)}:{}))}

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const clamp = LOGIC.clamp;
  const rand = (a,b) => Math.random()*(b-a)+a;
  const rint = (a,b) => Math.floor(rand(a,b+1));
  const fmt = n => Math.floor(n).toLocaleString();
  const formatStat = value => Number.isFinite(Number(value))?String(Math.round(Number(value))):'0';
  const formatGain = value => Number.isInteger(Number(value))?String(Number(value)):Number(value).toFixed(2);
  const ICON_ASSET_PATH = 'assets/icons/';
  const ICON_ASSET_VERSION = '2.5.206';
  const DROP_PACK_ASSET = `assets/cage-grind-drop-pack.png?v=${ICON_ASSET_VERSION}`;
  function gameIcon(name,fallback,extension='png'){return `<span class="game-icon" data-game-icon="${name}" aria-hidden="true"><span class="icon-fallback">${fallback}</span><img class="icon-asset" src="${ICON_ASSET_PATH}${name}.${extension}?v=${ICON_ASSET_VERSION}" alt="" onload="this.parentElement.classList.add('asset-ready')" onerror="this.remove()"></span>`}
  function dropPackIcon(){return `<img class="drop-pack-icon" src="${DROP_PACK_ASSET}" alt="" aria-hidden="true">`}
  function cageDiceIcon(){return `<span class="game-icon cage-dice-logo" data-game-icon="cage-dice" aria-hidden="true"><span class="icon-fallback">🎲</span><img class="icon-asset" src="assets/cage-dice.jpg?v=${ICON_ASSET_VERSION}" alt="" onload="this.parentElement.classList.add('asset-ready')" onerror="this.remove()"></span>`}
  function hydrateStaticIcons(){document.querySelectorAll('[data-icon-name]').forEach(el=>{if(el.dataset.iconHydrated)return;const fallback=el.dataset.iconFallback||el.textContent;el.innerHTML=gameIcon(el.dataset.iconName,fallback);el.dataset.iconHydrated='true'})}
  const SAVE_KEY = 'cage-warrior-save-v1';
  const SAVE_BACKUP_KEY = 'cage-warrior-save-backup-v1';
  const ENDORSEMENT_FIGHTS = {'bobs-auto':3,'garys-bar-grill':3,volt:4,ironhide:5,'apex-wireless':6,'northline-auto':7,'titan-global':8};
  const ENDORSEMENT_IDS = Object.keys(ENDORSEMENT_FIGHTS);
  let saveWarningShown = false;
  let careerSaveKnown = false;

  const defaultState = {
    version:22,name:'ROOKIE',nameLocked:false,cash:0,careerEarnings:0,fans:0,level:1,xp:0,wins:0,losses:0,winStreak:0,bestStreak:0,
    energy:100,maxEnergy:100,health:100,maxHealth:100,hype:0,
    stats:{power:5,speed:5,chin:5,cardio:5},
    gear:[],gearCounts:{},gearSeed:Math.floor(Math.random()*0xffffffff),gearWinsSinceDrop:0,trainerOn:false,dailyCounters:{date:'',fight:0,train:0,sparring:0,hustle:0,blackjack:0,cageDice:0,horseRace:0,publicity:0,recovery:0},dailyOpponentWins:{date:'',wins:{}},blackjackHand:null,cageDiceResult:null,horseRaceResult:null,
    activeEndorsement:null,endorsementHistory:[],lastAutographPrice:0,lastSave:Date.now(),lastDaily:'',freeLoot:0,installDetected:false,installRewardClaimed:false,
    socialAccountCreated:false,socialFeed:[],socialCycle:0,socialPostedCycle:0,socialSerial:0,socialLastReadSerial:0,socialLastMentionSerial:0,socialProfileId:'',socialLastRemotePostId:0,socialLastRemoteMentionPostId:0,socialRemoteInitialized:false,socialFollowingCount:0,socialHeadlineCounts:{},ceoEvents:[],ceoBonusDate:'',lastTitleLossSeenId:0,hasHeldWorldTitle:false,
    pendingFight:null,pendingChampionshipResult:null,fightPlanPreference:{pace:'slow',offense:'conservative',tactics:'stick'},opponentFilter:'recommended',focusTextDeck:[],lastFocusTextId:'',trainingInjury:null,
    roster:[],rosterSerial:0,fighterStyle:'',fighterCity:'',fighterAvatar:'',fighterBaseStats:null,equippedGear:[],leagueInitialized:false
  };

  let state;
  const ANALYTICS=globalThis.CAGE_ANALYTICS;
  function trackEvent(eventName,parameters={}){
    if(!ANALYTICS)return false;
    return ANALYTICS.track(eventName,Object.assign({fighter_level:state?.level||1},parameters));
  }
  let recoveryReport = null;
  let landingFeature = null;
  let audioCtx = null;
  let currentScreen = 'home';
  let fight = null;
  let fightTimers = [];
  let pendingResultDrop = null;
  let resultDropRevealed = false;
  let pendingDropContext = null;
  let resultActionTimer = null;
  let confettiFrameId = null;
  let confettiRun = 0;
  let levelUpSummary = null;
  let combatLocked = false;
  let fightSpeed = 1;
  let fightTimelineIndex = 0;
  let loadoutDialogReturnFocus = null;
  let lastShownEnergy = null;
  let lastShownHealth = null;
  let dailyResetDate = '';
  let sharedSocialPosts=[];
  let sharedSocialProfiles=[];
  let sharedSocialStatus='idle';
  let sharedSocialError='';
  let sharedSocialSyncPromise=null;
  let sharedSocialRefreshTimer=null;
  let sharedSocialNoticeShown=false;
  let sharedSocialInteractionsRemaining=0;
  let feedFilter='all';
  let sharedChampionship=null;
  let championshipCardView='';
  let championshipSettlementPromise=null;
  let activeBioProfileId='';
  let fighterInteractionPending=false;
  let fighterPostIntent='';
  let fighterPostTarget=null;
  let fighterPostDraftOffset=0;
  let identitySuggestion='';
  let identityPending=false;
  let identityShufflePending=false;
  let identityManualMode=false;
  let identityManualValue='';
  let retirementPending=false;
  let activeSparringSession=null;
  let sparringSessionTimer=null;
  let activeRecoverySession=null;
  let recoverySessionTimer=null;
  let activeHustleShift=null;
  let hustleShiftTimer=null;
  let activePublicitySession=null;
  let publicitySessionTimer=null;
  let pendingCeoPresentation=null;
  let pendingTitleLossPresentation=null;
  const HISTORY_KEY='cageGrind';

  const fighterStyles = [
    {id:'striker',icon:'🥊',name:'STRIKER',text:'+1 Power and Speed. Better stand-up offense and knockout pressure.',stats:{power:1,speed:1},plan:'striker'},
    {id:'grappler',icon:'🔒',name:'GRAPPLER',text:'+1 Power and Cardio. Better takedowns, control, and submissions.',stats:{power:1,cardio:1},plan:'grappler'}
  ];
  function normalizeMajorArchetype(value){return ['control','submission','wrestleBox','wrestle','wrestler','grappler'].includes(value)?'grappler':['pressure','counter','brawler','trickster','technician','endurance','tank','cardio','striker'].includes(value)?'striker':''}
  const TRAINING_INJURY_IDS=new Set(['knee','shoulder','elbow','ribs','ankle','back','hand','neck']);
  state = loadState();
  const fighterCities = [
    {id:'phoenix',name:'PHOENIX',region:'SOUTHWEST',accent:'#e98032'},
    {id:'los-angeles',name:'LOS ANGELES',region:'WEST COAST',accent:'#c9618e'},
    {id:'chicago',name:'CHICAGO',region:'MIDWEST',accent:'#63b9d8'},
    {id:'new-york',name:'NEW YORK',region:'NORTHEAST',accent:'#d8ad45'},
    {id:'miami',name:'MIAMI',region:'SOUTHEAST',accent:'#39c8b5'},
    {id:'houston',name:'HOUSTON',region:'GULF COAST',accent:'#b06ed1'},
    {id:'cleveland',name:'CLEVELAND',region:'GREAT LAKES',accent:'#ba554b'},
    {id:'seattle',name:'SEATTLE',region:'PACIFIC NORTHWEST',accent:'#4eaa78'},
    {id:'new-orleans',name:'NEW ORLEANS',region:'DEEP SOUTH',accent:'#9d78d5'},
    {id:'hawaii',name:'HAWAII',region:'PACIFIC ISLANDS',accent:'#36b7cf'},
    {id:'boston',name:'BOSTON',region:'NORTHEAST',accent:'#4ca66a'},
    {id:'atlanta',name:'ATLANTA',region:'SOUTHEAST',accent:'#d25555'},
    {id:'san-francisco',name:'SAN FRANCISCO',region:'WEST COAST',accent:'#dd7351'},
    {id:'denver',name:'DENVER',region:'MOUNTAIN WEST',accent:'#6f91d8'},
    {id:'tampa-bay',name:'TAMPA BAY',region:'GULF COAST',accent:'#4aa7d8'},
    {id:'philadelphia',name:'PHILADELPHIA',region:'NORTHEAST',accent:'#4f78c7'},
    {id:'san-antonio',name:'SAN ANTONIO',region:'SOUTHWEST',accent:'#c98b52'},
    {id:'las-vegas',name:'LAS VEGAS',region:'MOUNTAIN WEST',accent:'#d4a944'},
    {id:'portland',name:'PORTLAND',region:'PACIFIC NORTHWEST',accent:'#5aa879'},
    {id:'baltimore',name:'BALTIMORE',region:'MID-ATLANTIC',accent:'#e28a32'}
  ];
  const DEFAULT_FIGHTER_ACCENT='#6ed7ff';
  function fighterCityById(id){return fighterCities.find(city=>city.id===String(id||''))||null}
  function fighterAccent(cityId){return fighterCityById(cityId)?.accent||DEFAULT_FIGHTER_ACCENT}
  function fighterThemeStyle(cityId,property='--fighter-accent'){return `${property}:${fighterAccent(cityId)}`}
  let opponents=[];
  const opponentNameCountries=STRINGS.opponentNames.countries;
  const opponentArchetypes=[
    {id:'striker',tag:'STRIKER',tendency:'striker',scout:'Expect combinations, kicks, and knockout pressure. Disrupt the range or force grappling exchanges.',mods:{power:1,speed:1,chin:0,cardio:0}},
    {id:'grappler',tag:'GRAPPLER',tendency:'grappler',scout:'Expect level changes, fence control, and submission attacks. Punish entries and protect position.',mods:{power:1,speed:0,chin:0,cardio:1}}
  ];
  const rosterColors=['#b94a35','#377ea6','#7c5836','#9f2c43','#8052a6','#267ca8','#566b85','#2e6aa8','#326f63','#8a6a2e'];
  function rosterPick(list,seed){return list[Math.abs(seed)%list.length]}
  function generatedOpponentIdentity(seed){const country=rosterPick(opponentNameCountries,hashSeed(`country|${seed}`)),first=rosterPick(country.first,hashSeed(`first|${seed}|${country.code}`)),last=rosterPick(country.last,hashSeed(`last|${seed}|${country.code}`));return {name:`${first}${last}${country.code}`,country:country.code}}
  function generateOpponent(tier){
    const serial=++state.rosterSerial,seed=serial*7919+tier*104729,arch=rosterPick(opponentArchetypes,seed),identity=generatedOpponentIdentity(seed),base=LOGIC.generatedOpponentBaseRating(tier),difficulty=((serial%3)-1)*fightRule('computerGeneratedOpponentDifficulty.opponentCardDifficultyStep',.7);
    const stat=k=>Math.max(3,Math.round(base+difficulty+(arch.mods[k]||0)+(((seed>>(k.length%8))%3)-1)*fightRule('computerGeneratedOpponentDifficulty.individualAttributeVariationStep',.45)));
    return {key:`cw-${tier}-${serial}`,name:identity.name,country:identity.country,tag:arch.tag,archetype:arch.id,tendency:arch.tendency,scout:arch.scout,tier,min:tier,max:99,power:stat('power'),speed:stat('speed'),chin:stat('chin'),cardio:stat('cardio'),reward:Math.round(125*Math.pow(1.55,tier-1)*(1+difficulty*.08)),fans:Math.round(22*Math.pow(1.48,tier-1)),color:rosterPick(rosterColors,seed),look:seed%10,wins:Math.max(1,tier*2+Math.abs(seed%7)),losses:Math.abs((seed>>>5)%Math.max(2,tier+2)),winsVsPlayer:0,lossesToPlayer:0,meetings:0,rematchAccepted:false,recordInitialized:true,createdAt:Date.now()};
  }
  function hashSeed(text){let hash=2166136261;for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619)}return hash>>>0}
  function fighterCityCode(cityId){return STRINGS.fighterIdentity?.cityCodes?.[cityId]||String(cityId||'CG').slice(0,3).toUpperCase()}
  function fighterPortraitStyle(identity){const seed=hashSeed(String(identity||'cage-grind')),brightness=(.98+(seed%5)*.01).toFixed(2),contrast=(1+(Math.floor(seed/5)%4)*.01).toFixed(2),saturation=(.98+(Math.floor(seed/20)%5)*.01).toFixed(2),offset=((Math.floor(seed/100)%5)-2)*.4;return `--portrait-brightness:${brightness};--portrait-contrast:${contrast};--portrait-saturation:${saturation};--portrait-offset:${offset.toFixed(1)}%`}
  function applyPortraitStyle(element,identity){const seed=hashSeed(String(identity||'cage-grind'));element.style.setProperty('--portrait-brightness',(.98+(seed%5)*.01).toFixed(2));element.style.setProperty('--portrait-contrast',(1+(Math.floor(seed/5)%4)*.01).toFixed(2));element.style.setProperty('--portrait-saturation',(.98+(Math.floor(seed/20)%5)*.01).toFixed(2));element.style.setProperty('--portrait-offset',`${((Math.floor(seed/100)%5)-2)*.4}%`)}
  function seededRandom(seed){let value=seed>>>0;return ()=>{value+=0x6D2B79F5;let n=value;n=Math.imul(n^n>>>15,n|1);n^=n+Math.imul(n^n>>>7,n|61);return ((n^n>>>14)>>>0)/4294967296}}
  function normalizeOpponentArchetype(o){
    if(!o)return;const id=normalizeMajorArchetype(o.archetype)||normalizeMajorArchetype(o.tendency)||'striker',arch=opponentArchetypes.find(a=>a.id===id)||opponentArchetypes[0];o.archetype=arch.id;o.tendency=arch.id;o.tag=arch.tag;o.scout=arch.scout;
  }
  function ensureProfessionalRecord(o){if(!o||o.recordInitialized)return;const seed=hashSeed(o.key||`${o.name}|${o.tier}`);o.wins=(Number(o.wins)||0)+Math.max(1,(Number(o.tier)||1)*2+(seed%7));o.losses=(Number(o.losses)||0)+((seed>>>5)%Math.max(2,(Number(o.tier)||1)+2));o.recordInitialized=true}
  function networkOpponentDisplayName(value){const identity=STRINGS.fighterIdentity||{};return LOGIC.displayFighterIdentity(normalizeIdentityName(value),[...(identity.colors||[]),...(identity.origins||[])],[...(identity.weather||[]),...(identity.animals||[]),...(identity.combat||[])],Object.values(identity.cityCodes||{}))}
  function networkOpponentLocation(o){
    const cityId=String(o?.networkCity||'').toLowerCase(),direct=fighterCities.find(city=>city.id===cityId);if(direct)return direct;
    const handle=String(o?.networkHandle||'').toUpperCase(),codes=Object.entries(STRINGS.fighterIdentity?.cityCodes||{}),match=codes.find(([,code])=>handle.endsWith(String(code).toUpperCase())||handle.startsWith(String(code).toUpperCase()));
    return match?fighterCities.find(city=>city.id===match[0])||null:null;
  }
  function payoutForOpponent(o){return LOGIC.opponentFightPurse(LOGIC.payoutForOpponent(o,state.level),opponentWinsToday(o))}
  function ensureRoster(){
    if(!Array.isArray(state.roster))state.roster=[];state.roster=state.roster.filter(o=>!o.championship&&!o.globalChampionship&&(o.network||(o.tier===state.level&&(o.lossesToPlayer||0)===0)));if(!Number.isFinite(state.rosterSerial))state.rosterSerial=0;
    state.roster.forEach(o=>{normalizeOpponentArchetype(o);if(o.network&&o.networkHandle)o.name=networkOpponentDisplayName(o.networkHandle);if(o.retired){o.retired=false;delete o.retiredAt}});
    const active=state.roster.filter(o=>o.tier===state.level&&!o.network&&(o.lossesToPlayer||0)===0).length;for(let i=active;i<3;i++)state.roster.push(generateOpponent(state.level));
    state.roster.forEach(o=>{normalizeOpponentArchetype(o);ensureProfessionalRecord(o)});
    state.leagueInitialized=true;
    refreshOpponents();
  }
  function networkOpponentFromProfile(profile,tier){
    const id=String(profile?.id||''),handle=normalizeIdentityName(profile?.handle),name=networkOpponentDisplayName(handle),avatar=fighterAvatars.find(item=>item.id===profile?.fighter_avatar),arch=opponentArchetypes.find(item=>item.id===normalizeMajorArchetype(profile?.archetype));
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)||!handle||!name||!avatar||!arch||Number(profile?.level)!==tier)return null;
    const seed=hashSeed(`cage-network-v1|${id}|${tier}`),difficulty=((seed%3)-1)*.7,ratings=LOGIC.networkOpponentRatings(tier,avatar.stats,arch.mods,difficulty);
    return {key:`network-${id}`,network:true,sourceProfileId:id,networkHandle:handle,networkCity:String(profile.city||''),networkPortrait:avatar.asset,fighterAvatar:avatar.id,name,tag:arch.tag,archetype:arch.id,tendency:arch.tendency,scout:arch.scout,tier,min:tier,max:99,...ratings,reward:Math.round(125*Math.pow(1.55,tier-1)*(1+difficulty*.08)),fans:Math.round(22*Math.pow(1.48,tier-1)),color:fighterAccent(profile.city),look:seed%10,wins:Math.max(0,Math.floor(Number(profile.wins))||0),losses:Math.max(0,Math.floor(Number(profile.losses))||0),winsVsPlayer:0,lossesToPlayer:0,meetings:0,rematchAccepted:false,recordInitialized:true,createdAt:Date.now()};
  }
  function championshipOpponent(){
    if(!sharedChampionship)return null;
    const champion=sharedChampionship.is_champion,role=champion?'selected_challenger':'champion',id=sharedChampionship[`${role}_id`],level=Number(sharedChampionship[`${role}_level`]);
    if(!id||!level)return null;
    const opponent=networkOpponentFromProfile({id,handle:sharedChampionship[`${role}_handle`],city:sharedChampionship[`${role}_city`],archetype:sharedChampionship[`${role}_archetype`],fighter_avatar:sharedChampionship[`${role}_avatar`],level,wins:sharedChampionship[`${role}_wins`],losses:sharedChampionship[`${role}_losses`]},level);
    const rematch=!champion&&sharedChampionship.former_champion_rematch===true;
    return opponent?Object.assign(opponent,{key:`championship-${id}`,globalChampionship:true,championDefense:champion,titleMode:champion?'defense':rematch?'rematch':'challenge',titleName:'CAGE GRIND WORLD CHAMPIONSHIP',challengeEligible:champion?!sharedChampionship.defense_used_today:sharedChampionship.challenge_eligible===true,titleCooldown:champion?sharedChampionship.defense_used_today===true:sharedChampionship.daily_bout_used===true,eligibilityStatus:String(sharedChampionship.eligibility_status||''),formerChampionRematch:rematch,defenses:Math.max(0,Number(sharedChampionship.defenses)||0)}):null;
  }
  function syncRankedOpponents(profiles){
    const existing=new Map(state.roster.filter(o=>o.network&&o.sourceProfileId).map(o=>[o.sourceProfileId,o])),ranked=[];
    for(const profile of Array.isArray(profiles)?profiles:[]){
      if(profile?.id===state.socialProfileId)continue;
      const opponent=networkOpponentFromProfile(profile,Number(profile?.level));if(!opponent)continue;const previous=existing.get(opponent.sourceProfileId);
      if(previous)Object.assign(opponent,{winsVsPlayer:Math.max(0,Number(previous.winsVsPlayer)||0),lossesToPlayer:Math.max(0,Number(previous.lossesToPlayer)||0),meetings:Math.max(0,Number(previous.meetings)||0),rematchAccepted:previous.rematchAccepted===true,createdAt:Number(previous.createdAt)||opponent.createdAt});
      ranked.push(opponent);
    }
    state.roster=[...state.roster.filter(o=>!o.network),...ranked];
  }
  function fighterLevelOrder(a,b){return b.tier-a.tier||Number(b.network)-Number(a.network)||String(a.name).localeCompare(String(b.name))}
  function refreshOpponents(){
    opponents=state.roster.filter(o=>(o.network||(o.tier===state.level&&(o.lossesToPlayer||0)===0))&&o.sourceProfileId!==state.socialProfileId&&o.sourceProfileId!==sharedChampionship?.champion_id).filter(o=>o.network||opponentGroup(o)==='current').sort(fighterLevelOrder);
  }
  const fighterSilhouettes=Array.from({length:24},(_,i)=>`assets/silhouettes/fighter-silhouette-${i+1}.png`);
  function spriteIndexForOpponent(o){
    let h=0;
    for(const ch of o.name) h=(h*31+ch.charCodeAt(0))>>>0;
    return h%fighterSilhouettes.length;
  }
  function silhouetteForOpponent(o){return o?.networkPortrait||fighterSilhouettes[spriteIndexForOpponent(o)]}
  function opponentContext(){return {level:state.level}}
  function opponentState(o){return LOGIC.opponentState(o,opponentContext())}
  function opponentGroup(o){return LOGIC.opponentGroup(o,opponentContext())}
  function opponentAvailable(o){return LOGIC.opponentAvailable(o,opponentContext())}

  const FIGHT_ROUNDS=fightRule('fightStructure.scheduledRounds',3),ENERGY_SEGMENT=fightRule('energyEconomy.energySegmentSize',25),FIGHT_ENERGY_COST=fightRule('energyEconomy.fightEnergyCost',25),MINIMUM_ACTION_ENERGY_EXCLUSIVE=fightRule('energyEconomy.minimumEnergyToStartConsumingActionExclusive',0),REST_ENERGY_GAIN=fightRule('energyEconomy.restEnergyRestored',25),REST_DURATION_SECONDS=fightRule('energyEconomy.restDurationSeconds',10),DAILY_DROP_ENERGY=fightRule('energyEconomy.dailyDropEnergyRestored',25),DAILY_FIGHT_LIMIT=fightRule('fightStructure.dailyFightLimit',10),MINIMUM_FIGHT_HEALTH=fightRule('fightStructure.minimumHealthForMedicalClearance',20),DAILY_TRAINING_LIMIT=fightRule('dailyDevelopmentLimits.ordinaryAttributeTrainingSessionLimit',3),DAILY_SPARRING_LIMIT=fightRule('dailyDevelopmentLimits.sparringSessionLimit',1);
  const ODD_JOB_ENERGY_COST=fightRule('energyEconomy.oddJobEnergyCost',25),PUBLICITY_ENERGY_COST=fightRule('energyEconomy.publicityEnergyCost',25);
  const RECOVERY_DOLLARS_PER_HEALTH_POINT_PER_FIGHTER_LEVEL=fightRule('recoveryEconomy.dollarsPerHealthPointPerFighterLevel',3);
  hustleDefs.forEach(action=>action.cost=ODD_JOB_ENERGY_COST);publicityDefs.forEach(action=>action.cost=PUBLICITY_ENERGY_COST);const restDefinition=recoveryDefs.find(action=>action.freeRest);if(restDefinition){restDefinition.energy=REST_ENERGY_GAIN;restDefinition.meterSeconds=REST_DURATION_SECONDS}
  const hasActionEnergy=()=>state.energy>MINIMUM_ACTION_ENERGY_EXCLUSIVE;

  function normalizeBlackjackHand(hand){
    if(!hand||typeof hand!=='object'||hand.date!==LOGIC.localDateKey())return null;
    const cleanCards=cards=>Array.isArray(cards)?cards.filter(card=>typeof card==='string'&&/^[2-9TJQKA][SHDC]$/.test(card)):[];
    const deck=cleanCards(hand.deck),player=cleanCards(hand.player),dealer=cleanCards(hand.dealer),all=[...deck,...player,...dealer];
    if(player.length<2||dealer.length<2||all.length>52||new Set(all).size!==all.length)return null;
    const bet=clamp(Math.floor(Number(hand.bet))||0,1,1000000000),status=hand.status==='settled'?'settled':'playing';
    const result=['blackjack','win','push','loss'].includes(hand.result)?hand.result:'';
    return {date:hand.date,bet,deck,player,dealer,status,result:status==='settled'?result:'',payout:status==='settled'?Math.max(0,Math.floor(Number(hand.payout))||0):0};
  }

  function normalizeCageDiceResult(result){
    if(!result||typeof result!=='object'||result.date!==LOGIC.localDateKey())return null;const bet=clamp(Math.floor(Number(result.bet))||0,1,1000000000),outcome=LOGIC.cageDiceOutcome(result.die1,result.die2,result.choice,bet);return {date:result.date,bet,...outcome};
  }

  function normalizeHorseRaceResult(result){
    if(!result||typeof result!=='object'||result.date!==LOGIC.localDateKey())return null;
    const profiles=new Map(horseRaceProfiles.map(profile=>[profile.id,profile])),field=Array.isArray(result.field)?result.field.map(horse=>{const profile=profiles.get(horse?.id),odds=Math.floor(Number(horse?.odds));return profile&&[2,3,4,5,7,11].includes(odds)?Object.assign({},profile,{lane:clamp(Math.floor(Number(horse.lane))||1,1,6),odds}):null}).filter(Boolean):[],ids=field.map(horse=>horse.id),finishOrder=Array.isArray(result.finishOrder)?result.finishOrder.filter(id=>ids.includes(id)):[],selectedHorseId=ids.includes(result.selectedHorseId)?result.selectedHorseId:'';
    if(field.length!==6||new Set(ids).size!==6||finishOrder.length!==6||new Set(finishOrder).size!==6||!selectedHorseId)return null;
    const bet=clamp(Math.floor(Number(result.bet))||0,1,1000000000),selected=field.find(horse=>horse.id===selectedHorseId),outcome=LOGIC.horseRacePayout(bet,selected.odds,finishOrder[0]===selectedHorseId);
    return {date:result.date,bet,field,selectedHorseId,finishOrder,...outcome};
  }

  function normalizeState(parsed){
      const source=parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:{};
      const s = Object.assign(structuredClone(defaultState),source);
      LOGIC.normalizeCoreState(s,defaultState,source);
      const legacyGear=Array.isArray(s.gear)?s.gear.filter(id=>typeof id==='string'):[];
      const savedCounts=s.gearCounts&&typeof s.gearCounts==='object'&&!Array.isArray(s.gearCounts)?s.gearCounts:{};
      s.gear=[...new Set(legacyGear)];s.gearCounts={};for(const id of s.gear){const legacyCount=legacyGear.filter(x=>x===id).length;s.gearCounts[id]=Math.max(1,legacyCount,Math.floor(Number(savedCounts[id]))||0)}
      s.gearSeed=(Number(s.gearSeed)>>>0)||Math.floor(Math.random()*0xffffffff);s.gearWinsSinceDrop=clamp(Math.floor(Number(s.gearWinsSinceDrop))||0,0,4);
      const currentDate=LOGIC.localDateKey();s.dailyCounters = LOGIC.dailyCountersFor(s.dailyCounters,currentDate);const savedOpponentWins=source.dailyOpponentWins&&typeof source.dailyOpponentWins==='object'&&!Array.isArray(source.dailyOpponentWins)?source.dailyOpponentWins:null,winEntries=savedOpponentWins?.date===currentDate&&savedOpponentWins.wins&&typeof savedOpponentWins.wins==='object'&&!Array.isArray(savedOpponentWins.wins)?Object.entries(savedOpponentWins.wins):[];s.dailyOpponentWins={date:currentDate,wins:Object.fromEntries(winEntries.filter(([key])=>typeof key==='string'&&key.length<=100).map(([key,value])=>[key,clamp(Math.floor(Number(value))||0,0,2)]))};s.blackjackHand=normalizeBlackjackHand(source.blackjackHand);if(s.blackjackHand)s.dailyCounters.blackjack=1;s.cageDiceResult=normalizeCageDiceResult(source.cageDiceResult);if(s.cageDiceResult)s.dailyCounters.cageDice=1;s.horseRaceResult=normalizeHorseRaceResult(source.horseRaceResult);if(s.horseRaceResult)s.dailyCounters.horseRace=1;
      s.trainerOn = !!s.trainerOn;delete s.treatmentAvailable;
      const trainingDate=LOGIC.localDateKey(),savedInjury=source.trainingInjury&&typeof source.trainingInjury==='object'?source.trainingInjury:null,injuryId=TRAINING_INJURY_IDS.has(savedInjury?.id)?savedInjury.id:'';s.trainingInjury=injuryId&&savedInjury.date===trainingDate?{id:injuryId,date:trainingDate}:null;
      const savedHistory=Array.isArray(s.endorsementHistory)?s.endorsementHistory:[],savedActiveId=s.activeEndorsement&&typeof s.activeEndorsement==='object'&&ENDORSEMENT_IDS.includes(s.activeEndorsement.id)?s.activeEndorsement.id:'';
      const furthestEndorsement=Math.max(-1,...savedHistory.map(id=>ENDORSEMENT_IDS.indexOf(id)),savedActiveId?ENDORSEMENT_IDS.indexOf(savedActiveId):-1);s.endorsementHistory=ENDORSEMENT_IDS.slice(0,furthestEndorsement+1);s.activeEndorsement=savedActiveId?{id:savedActiveId,fightsLeft:clamp(Math.floor(Number(s.activeEndorsement.fightsLeft))||ENDORSEMENT_FIGHTS[savedActiveId],1,ENDORSEMENT_FIGHTS[savedActiveId])}:null;
      s.lastAutographPrice = clamp(Number(s.lastAutographPrice)||0,0,50);s.installDetected=source.installDetected===true;s.installRewardClaimed=source.installRewardClaimed===true;if(s.installRewardClaimed)s.installDetected=true;
      const savedPlan=source.fightPlanPreference&&typeof source.fightPlanPreference==='object'?source.fightPlanPreference:{};s.fightPlanPreference={pace:['slow','fast'].includes(savedPlan.pace)?savedPlan.pace:'slow',offense:['conservative','aggressive'].includes(savedPlan.offense)?savedPlan.offense:'conservative',tactics:['stick','adapt'].includes(savedPlan.tactics)?savedPlan.tactics:'stick'};s.opponentFilter=['recommended','ranked','rematches','all'].includes(source.opponentFilter)?source.opponentFilter:'recommended';delete s.fightModePreference;
      const pendingTitle=source.pendingChampionshipResult&&typeof source.pendingChampionshipResult==='object'?source.pendingChampionshipResult:null;s.pendingChampionshipResult=pendingTitle&&Number.isSafeInteger(Number(pendingTitle.challengeId))&&/^[0-9a-f-]{36}$/i.test(String(pendingTitle.challengerId||''))?{challengeId:Number(pendingTitle.challengeId),challengerId:String(pendingTitle.challengerId),challengerWon:pendingTitle.challengerWon===true,mode:['challenge','defense','rematch'].includes(pendingTitle.mode)?pendingTitle.mode:'challenge'}:null;
      const focusTextIds=(STRINGS.fightFocus?.contacts||[]).flatMap(contact=>contact.messages.map(message=>message.id));s.focusTextDeck=Array.isArray(source.focusTextDeck)?source.focusTextDeck.filter((id,index,deck)=>focusTextIds.includes(id)&&deck.indexOf(id)===index):[];s.lastFocusTextId=focusTextIds.includes(source.lastFocusTextId)?source.lastFocusTextId:'';delete s.focusInterruptionDeck;delete s.lastFocusInterruptionId;
      s.socialAccountCreated=typeof source.socialAccountCreated==='boolean'?source.socialAccountCreated:(Number(s.fans)||0)>0;s.socialFeed=Array.isArray(s.socialFeed)?s.socialFeed.filter(p=>p&&typeof p==='object').slice(0,30):[];s.socialCycle=Math.max(0,Math.floor(Number(s.socialCycle))||0);s.socialPostedCycle=clamp(Math.floor(Number(s.socialPostedCycle))||0,0,s.socialCycle);s.socialSerial=Math.max(s.socialFeed.length,Math.floor(Number(s.socialSerial))||0);s.socialLastReadSerial=source.socialLastReadSerial===undefined?s.socialSerial:clamp(Math.floor(Number(source.socialLastReadSerial))||0,0,s.socialSerial);s.socialLastMentionSerial=source.socialLastMentionSerial===undefined?s.socialSerial:clamp(Math.floor(Number(source.socialLastMentionSerial))||0,0,s.socialSerial);s.socialProfileId=typeof source.socialProfileId==='string'&&/^[0-9a-f-]{36}$/i.test(source.socialProfileId)?source.socialProfileId:'';s.socialLastRemotePostId=Math.max(0,Math.floor(Number(source.socialLastRemotePostId))||0);s.socialLastRemoteMentionPostId=source.socialLastRemoteMentionPostId===undefined?s.socialLastRemotePostId:Math.max(0,Math.floor(Number(source.socialLastRemoteMentionPostId))||0);s.socialRemoteInitialized=source.socialRemoteInitialized===true;s.socialFollowingCount=Math.max(0,Math.floor(Number(source.socialFollowingCount))||0);const savedHeadlineCounts=source.socialHeadlineCounts&&typeof source.socialHeadlineCounts==='object'&&!Array.isArray(source.socialHeadlineCounts)?source.socialHeadlineCounts:{};s.socialHeadlineCounts={};for(const key of ['fightWin','fightInjuredWin','fightStreak','fightLoss'])s.socialHeadlineCounts[key]=Math.max(0,Math.floor(Number(savedHeadlineCounts[key]))||0);s.ceoEvents=Array.isArray(source.ceoEvents)?[...new Set(source.ceoEvents.filter(key=>typeof key==='string'&&key.length<=40))].slice(-40):[];s.ceoBonusDate=typeof source.ceoBonusDate==='string'?source.ceoBonusDate:'';s.lastTitleLossSeenId=Math.max(0,Math.floor(Number(source.lastTitleLossSeenId))||0);s.hasHeldWorldTitle=source.hasHeldWorldTitle===true;if(!s.socialAccountCreated){s.fans=0;s.socialFollowingCount=0}
      s.fighterStyle=normalizeMajorArchetype(s.fighterStyle);
      s.rosterSerial=Math.max(0,Number(s.rosterSerial)||0);s.fighterStyle=['striker','grappler'].includes(s.fighterStyle)?s.fighterStyle:'';s.fighterCity=['phoenix','los-angeles','chicago','new-york','miami','houston','cleveland','seattle','new-orleans','hawaii','boston','atlanta','san-francisco','denver','tampa-bay','philadelphia','san-antonio','las-vegas','portland','baltimore'].includes(s.fighterCity)?s.fighterCity:'';s.fighterAvatar=fighterAvatars.some(a=>a.id===s.fighterAvatar)?s.fighterAvatar:'';const avatar=fighterAvatars.find(a=>a.id===s.fighterAvatar);s.fighterBaseStats=avatar&&validFighterAllocation(s.fighterBaseStats)?Object.assign({},s.fighterBaseStats):avatar?Object.assign({},avatar.stats):null;delete s.milestones;s.roster=Array.isArray(s.roster)?s.roster.filter(o=>!o.championship&&!o.globalChampionship):[];s.equippedGear=Array.isArray(s.equippedGear)?s.equippedGear.filter(id=>s.gear.includes(id)):[];s.leagueInitialized=source.leagueInitialized===true;
      const coreReady=!!(s.fighterStyle&&s.fighterCity&&s.fighterAvatar&&validFighterAllocation(s.fighterBaseStats)),legacyHandle=normalizeIdentityName(source.socialHandle),legacyName=normalizeIdentityName(source.name);s.nameLocked=coreReady&&(source.nameLocked===undefined?true:source.nameLocked===true);s.name=s.nameLocked?(legacyHandle||legacyName||'cagefighter'):'ROOKIE';delete s.socialHandle;
      s.version=22;
      return s;
  }
  function loadState(){
    const readRaw=key=>{try{return localStorage.getItem(key)}catch(e){return null}};
    const primary=readRaw(SAVE_KEY);careerSaveKnown=primary!==null;
    return LOGIC.selectStoredState({primary,backup:readRaw(SAVE_BACKUP_KEY),legacy:readRaw('fytr-save-v1')},normalizeState,defaultState);
  }
  function saveState(){
    let current;try{current=localStorage.getItem(SAVE_KEY)}catch(e){current=undefined}
    if(!LOGIC.shouldPersistCareer(retirementPending,careerSaveKnown,current))return;
    state.lastSave=Date.now();
    try{
      if(LOGIC.shouldBackupRaw(current,normalizeState))localStorage.setItem(SAVE_BACKUP_KEY,current);
    }catch(e){/* A backup is helpful but must never block the primary save. */}
    try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));careerSaveKnown=true;saveWarningShown=false}
    catch(e){if(!saveWarningShown){saveWarningShown=true;setTimeout(()=>toast('SAVE FAILED · Check browser storage before closing.','#ff766d'),0)}}
  }
  function todayKey(){return LOGIC.localDateKey()}
  function applyOfflineRecovery(){
    const now=Date.now(),last=Number(state.lastSave)||now,elapsed=clamp(now-last,0,8*60*60*1000),ticks=Math.floor(elapsed/15000);
    const oldEnergy=state.energy,oldHealth=state.health;
    if(ticks>0)state.health=clamp(state.health+ticks*(.12+ownedBonus('healthRegen')),0,state.maxHealth);
    let refunded=0;if(state.pendingFight){refunded=clamp(Number(state.pendingFight.cost)||FIGHT_ENERGY_COST,0,state.maxEnergy);state.energy=clamp(state.energy+refunded,0,state.maxEnergy);state.pendingFight=null}
    const energy=Math.max(0,Math.floor(state.energy)-Math.floor(oldEnergy)),health=Math.max(0,Math.floor(state.health)-Math.floor(oldHealth));
    return energy||health||refunded?{energy,health,refunded}:null;
  }
  function resolveChampionshipIdentity(value){
    return SHARED_UI.resolveChampionshipIdentity(value,state);
  }
  function setSharedChampionship(value){
    sharedChampionship=resolveChampionshipIdentity(value);
    if(sharedChampionship?.is_champion||sharedChampionship?.former_champion)state.hasHeldWorldTitle=true;
    return sharedChampionship;
  }
  function rankName(){
    const championship=sharedChampionship?Object.assign({},sharedChampionship,{former_champion:sharedChampionship.former_champion===true||state.hasHeldWorldTitle}):state.hasHeldWorldTitle?{former_champion:true}:null;return LOGIC.championshipCareerRank(state.level,championship);
  }
  function renderLanding(){landingFeature.render()}
  function loadLandingChampionship(){return landingFeature.loadChampionship()}
  function observeLandingFeatures(){landingFeature.observeFeatures()}
  function showRecoveryReport(){
    if(!recoveryReport)return;const parts=[];if(recoveryReport.energy)parts.push(`+${recoveryReport.energy} energy`);if(recoveryReport.health)parts.push(`+${recoveryReport.health} health`);if(recoveryReport.refunded)parts.push('fight booking refunded');recoveryReport=null;toast(`WELCOME BACK · ${parts.join(' · ')}`,'#78dfff');
  }
  landingFeature=globalThis.CAGE_LANDING.createLandingFeature({
    $,logic:LOGIC,getState:()=>state,getRank:()=>rankName(),getChampionship:()=>sharedChampionship,setChampionship:setSharedChampionship,sharedFeed:SHARED_FEED,sharedUi:SHARED_UI,trackEvent,tap:()=>sfx.tap(),onEntered:()=>setTimeout(showRecoveryReport,180),onChampionshipChange:renderFightChampionship
  });
  function enterGameFromLanding(){landingFeature.enter()}
  function cageStatus(){
    return rankName();
  }
  function xpNeed(){return LOGIC.xpRequirement(state.level)}
  function effectiveStat(key){
    let v=state.stats[key],style=fighterStyles.find(s=>s.id===state.fighterStyle);if(style&&style.stats[key])v+=style.stats[key];
    for(const id of state.equippedGear){const g=gearItems.find(x=>x.id===id);if(g&&g.stat===key)v+=g.bonus}
    return LOGIC.injuredStat(v,!!state.trainingInjury);
  }
  function ensureLoadout(){const limit=LOGIC.gearLoadoutLimit(state.level),ownedFight=state.gear.filter(id=>{const g=gearItems.find(x=>x.id===id);return g&&g.category==='Fight Gear'});state.equippedGear=state.equippedGear.filter(id=>ownedFight.includes(id)).slice(0,limit);if(!state.equippedGear.length&&ownedFight.length)state.equippedGear=ownedFight.slice(0,limit)}
  function currentStyle(){return fighterStyles.find(s=>s.id===state.fighterStyle)||null}
  function currentCity(){return fighterCityById(state.fighterCity)}
  function currentAvatar(){return fighterAvatars.find(a=>a.id===state.fighterAvatar)||null}
  function normalizeIdentityName(value){return LOGIC.normalizeFighterIdentity(value)}
  function manualIdentityName(value){const name=String(value||'').trim();return /^[A-Za-z][A-Za-z0-9_]{2,31}$/.test(name)?name:''}
  function identityPools(){const pools=STRINGS.fighterIdentity||{};return {openers:[...(pools.colors||[]),...(pools.origins||[])],descriptors:[...(pools.weather||[]),...(pools.animals||[]),...(pools.combat||[])],cityCode:pools.cityCodes?.[state.fighterCity]||''}}
  function canonicalIdentitySuggestion(){const pools=identityPools();return LOGIC.buildFighterIdentity(pools.openers[0]||'White',pools.descriptors[0]||'Drizzle',pools.cityCode||'PHX')||'WhiteDrizzlePHX'}
  function randomIdentitySuggestion(){const pools=identityPools();return LOGIC.randomFighterIdentity(pools.openers,pools.descriptors,pools.cityCode)||canonicalIdentitySuggestion()}
  function identityClaimCandidates(preferred){
    const pools=identityPools(),names=[],add=value=>{const name=normalizeIdentityName(value);if(name&&!names.includes(name))names.push(name)};add(preferred);add(canonicalIdentitySuggestion());
    const combinations=pools.openers.flatMap(opener=>pools.descriptors.filter(descriptor=>descriptor!==opener).map(descriptor=>LOGIC.buildFighterIdentity(opener,descriptor,pools.cityCode))).filter(Boolean),total=combinations.length,start=total?hashSeed(`${preferred}|${state.fighterAvatar}|${state.fighterStyle}`)%total:0;
    for(let i=0;i<total&&names.length<300;i++)add(combinations[(start+i*37)%total]);
    return names.slice(0,300);
  }
  function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
  function validFighterAllocation(stats){const keys=['power','speed','chin','cardio'];return !!stats&&keys.every(k=>Number.isInteger(stats[k])&&stats[k]>=2&&stats[k]<=8)&&keys.reduce((sum,k)=>sum+stats[k],0)===20}
  function awardCeoPerformanceBonus({upset=false,ko=false,titleWon=false}={}){const date=todayKey(),qualifies=!titleWon&&(upset||ko),roll=hashSeed(`${state.name}|${state.wins}|${date}|ceo-bonus-v2`)%100;if(!qualifies||state.ceoBonusDate===date||roll>=10)return 0;const bonus=125+state.level*50;state.ceoBonusDate=date;receiveMoney(bonus,true);state.hype=clamp(state.hype+3,0,100);publishCeoEvent(`performance_bonus_${state.wins}`);trackEvent('ceo_performance_bonus',{cash_bonus:bonus,upset,ko});return bonus}
  function gearCount(id){return Math.max(0,Math.floor(Number(state.gearCounts&&state.gearCounts[id]))||0)}
  function ownedBonus(prop){return state.gear.reduce((sum,id)=>{const g=gearItems.find(x=>x.id===id);return sum+(g&&g[prop]?g[prop]:0)},0)}
  function receiveMoney(amount,career=false){const value=Math.max(0,Math.round(Number(amount)||0));state.cash+=value;if(career)state.careerEarnings+=value;return value}
  function changeFollowers(amount){if(!state.socialAccountCreated)return 0;const before=state.fans,value=Math.round(Number(amount)||0);state.fans=Math.max(0,before+value);return state.fans-before}
  const gearRarityOrder=['COMMON','RARE','EPIC','LEGENDARY'];
  function gearRarityWeights(level){
    if(level<=3)return [80,18,2,0];
    if(level<=6)return [62,29,8,1];
    if(level<=10)return [45,36,16,3];
    return [30,40,23,7];
  }
  function rollGearRarity(level,roll,minRarity='COMMON'){
    const minRank=Math.max(0,gearRarityOrder.indexOf(minRarity)),weights=gearRarityWeights(level).map((w,i)=>i>=minRank?w:0),total=weights.reduce((sum,w)=>sum+w,0);let cursor=roll*total;
    for(let i=minRank;i<weights.length;i++){cursor-=weights[i];if(cursor<0)return gearRarityOrder[i]}
    return gearRarityOrder[minRank];
  }
  function eligibleGearAtLevel(level,rarity){return gearItems.filter(g=>(g.minLevel||1)<=level&&g.rarity===rarity)}
  function awardDeterministicGearDrop({opponent,upset=false,rivalry=false,titleWon=false,ko=false}){
    state.gearWinsSinceDrop=LOGIC.nextGearPityCount(state.gearWinsSinceDrop);
    const random=seededRandom(hashSeed(`${state.gearSeed}|${state.wins}|${opponent.key}|${state.level}|gear-v1`)),pity=LOGIC.isGearPity(state.gearWinsSinceDrop),chance=Math.min(.75,.33+(upset?.10:0)+(rivalry?.10:0)+(ko?.05:0));
    if(!titleWon&&!pity&&random()>=chance)return null;
    const minRarity=titleWon?'RARE':'COMMON',minRank=gearRarityOrder.indexOf(minRarity);let rarity=rollGearRarity(state.level,random(),minRarity),rank=gearRarityOrder.indexOf(rarity),pool=eligibleGearAtLevel(state.level,rarity);
    for(let r=rank-1;!pool.length&&r>=minRank;r--){rarity=gearRarityOrder[r];pool=eligibleGearAtLevel(state.level,rarity)}
    for(let r=rank+1;!pool.length&&r<gearRarityOrder.length;r++){rarity=gearRarityOrder[r];pool=eligibleGearAtLevel(state.level,rarity)}
    if(!pool.length)return null;
    const item=pool[Math.floor(random()*pool.length)],isNew=!state.gear.includes(item.id);if(isNew)state.gear.push(item.id);state.gearCounts[item.id]=gearCount(item.id)+1;state.gearWinsSinceDrop=0;ensureLoadout();
    return {item,rarity,count:state.gearCounts[item.id],isNew,guaranteed:titleWon||pity,reason:titleWon?'CHAMPIONSHIP DROP':'FIGHT WIN DROP'};
  }
  function awardDailyCollectible(date){
    const random=seededRandom(hashSeed(`${state.gearSeed}|${date}|${state.level}|daily-collectible-v1`)),minRank=0;let rarity=rollGearRarity(state.level,random()),rank=gearRarityOrder.indexOf(rarity),pool=eligibleGearAtLevel(state.level,rarity);
    for(let r=rank-1;!pool.length&&r>=minRank;r--){rarity=gearRarityOrder[r];pool=eligibleGearAtLevel(state.level,rarity)}
    for(let r=rank+1;!pool.length&&r<gearRarityOrder.length;r++){rarity=gearRarityOrder[r];pool=eligibleGearAtLevel(state.level,rarity)}
    if(!pool.length)return null;const item=pool[Math.floor(random()*pool.length)],isNew=!state.gear.includes(item.id);if(isNew)state.gear.push(item.id);state.gearCounts[item.id]=gearCount(item.id)+1;ensureLoadout();return {item,rarity,count:state.gearCounts[item.id],isNew,guaranteed:true,reason:'DAILY DROP'};
  }
  function ensureDailyCounters(){
    const today=todayKey();state.dailyCounters=LOGIC.dailyCountersFor(state.dailyCounters,today);if(state.dailyOpponentWins?.date!==today)state.dailyOpponentWins={date:today,wins:{}};if(state.blackjackHand&&state.blackjackHand.date!==today)state.blackjackHand=null;if(state.cageDiceResult&&state.cageDiceResult.date!==today)state.cageDiceResult=null;if(state.horseRaceResult&&state.horseRaceResult.date!==today)state.horseRaceResult=null;if(state.trainingInjury?.date!==today)state.trainingInjury=null;
  }
  function opponentWinsToday(o){ensureDailyCounters();return clamp(Math.floor(Number(state.dailyOpponentWins.wins[o?.key]))||0,0,2)}
  function opponentXpTier(o){return LOGIC.opponentXpTier(opponentWinsToday(o),o?.min,state.level)}
  function currentTrainingInjury(){return trainingInjuryDefs.find(entry=>entry.id===state.trainingInjury?.id)||null}
  function awardInstallCollectible(){const drop=awardDailyCollectible('install-reward-v1');if(drop)drop.reason='INSTALL DROP';return drop}
  function sessionsLeft(type,max){ensureDailyCounters();return Math.max(0,max-(state.dailyCounters[type]||0))}
  function setLimitBadge(selector,text){const badge=$(selector);if(!badge)return;badge.textContent=text;badge.classList.toggle('exhausted',/^0\b.*\bLEFT$/.test(text)||text==='FIGHT TO UNLOCK')}
  function coachFee(){return 250+state.level*75}
  function recoveryFee(treatment){return treatment?.freeRest?0:Math.max(0,Number(treatment?.health)||0)*state.level*RECOVERY_DOLLARS_PER_HEALTH_POINT_PER_FIGHTER_LEVEL}
  function updateDailyResetClocks(){
    const date=todayKey(),clocks=$$('[data-daily-reset-clock]');
    if(dailyResetDate&&date!==dailyResetDate){dailyResetDate=date;ensureDailyCounters();updateUI();return}
    dailyResetDate=date;
    const countdown=LOGIC.formatCountdown(LOGIC.millisecondsUntilNextLocalDay());clocks.forEach(clock=>clock.textContent=countdown);
    $$('[data-championship-reset]').forEach(element=>{const reset=new Date(element.dataset.championshipReset||'');if(Number.isFinite(reset.getTime()))element.textContent=`AVAILABLE IN ${LOGIC.formatCountdown(Math.max(0,reset.getTime()-Date.now()))}`});
  }

  function initAudio(){
    if(!audioCtx){audioCtx=new (window.AudioContext||window.webkitAudioContext)()}
    if(audioCtx.state==='suspended')audioCtx.resume();
  }
  function tone(freq=220,dur=.08,type='square',vol=.035,slide=0){
    if(!audioCtx)return;
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,audioCtx.currentTime);
    if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),audioCtx.currentTime+dur);
    g.gain.setValueAtTime(vol,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+dur);
    o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur);
  }
  function noise(dur=.07,vol=.05){
    if(!audioCtx)return;
    const len=audioCtx.sampleRate*dur,b=audioCtx.createBuffer(1,len,audioCtx.sampleRate),d=b.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
    const s=audioCtx.createBufferSource(),g=audioCtx.createGain();s.buffer=b;g.gain.value=vol;s.connect(g);g.connect(audioCtx.destination);s.start();
  }
  const sfx={
    tap(){tone(180,.04,'square',.018,55)},
    coin(){tone(520,.06,'triangle',.03,260);setTimeout(()=>tone(760,.07,'triangle',.025,220),55)},
    hit(){noise(.055,.06);tone(85,.07,'sine',.06,-25)},
    crit(){noise(.12,.09);tone(150,.12,'sawtooth',.05,-90)},
    train(){tone(210,.06,'square',.03,120);setTimeout(()=>tone(340,.06,'square',.025,100),55)},
    win(){[392,523,659,784].forEach((f,i)=>setTimeout(()=>tone(f,.18,'square',.04,70),i*85))},
    lose(){tone(180,.3,'sawtooth',.04,-130)},
    rage(){noise(.25,.12);tone(70,.35,'sawtooth',.07,250)},
    level(){[523,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,.13,'triangle',.04),i*70))}
  };

  function toast(msg,color='white',iconName='',iconFallback='',duration=1700){
    const t=$('#toast');t.textContent=msg;if(iconName)t.insertAdjacentHTML('afterbegin',gameIcon(iconName,iconFallback)+' ');t.style.color=color;t.classList.add('show-toast');
    clearTimeout(t._to);t._to=setTimeout(()=>t.classList.remove('show-toast'),duration);
  }
  function vibrate(pattern){if(navigator.vibrate)navigator.vibrate(pattern)}
  function shake(hard=false){const a=$('#app');a.classList.remove('shake');void a.offsetWidth;a.classList.add('shake');vibrate(hard?[35,20,55]:18)}

  function flashResource(kind,amount){
    if(amount<=0)return;
    const hud=$(`#${kind}Hud`),delta=$(`#hud${kind[0].toUpperCase()+kind.slice(1)}Delta`);
    const cls=kind==='health'?'drop-health':'drop-energy';
    hud.classList.remove('drop-health','drop-energy');void hud.offsetWidth;hud.classList.add(cls);
    delta.textContent=`-${amount}`;delta.style.color=kind==='health'?'#ff7a82':'#77e8ff';
    delta.classList.remove('show');void delta.offsetWidth;delta.classList.add('show');
    clearTimeout(hud._flashTimer);hud._flashTimer=setTimeout(()=>hud.classList.remove(cls),760);
    clearTimeout(delta._flashTimer);delta._flashTimer=setTimeout(()=>delta.classList.remove('show'),950);
    if(kind==='health')vibrate([28,18,28]);
  }

  function flashTrainingStats(skills){
    skills.forEach(skill=>{const card=$(`#${skill}Stat`)?.closest('.hud-attribute');if(!card)return;card.classList.remove('stat-rewarded');void card.offsetWidth;card.classList.add('stat-rewarded');clearTimeout(card._rewardTimer);card._rewardTimer=setTimeout(()=>card.classList.remove('stat-rewarded'),1900)});
  }

  function flashRecoveryResources(restored){
    [['energy',restored.energy],['health',restored.health]].forEach(([kind,value])=>{const amount=Number(value)||0;if(amount<=0)return;const hud=$(`#${kind}Hud`),delta=$(`#hud${kind[0].toUpperCase()+kind.slice(1)}Delta`);hud.classList.remove('resource-restored');void hud.offsetWidth;hud.classList.add('resource-restored');delta.textContent=`+${formatGain(amount)}`;delta.style.color='#78dcff';delta.classList.remove('show');void delta.offsetWidth;delta.classList.add('show');clearTimeout(hud._restoreTimer);hud._restoreTimer=setTimeout(()=>hud.classList.remove('resource-restored'),1900);clearTimeout(delta._restoreTimer);delta._restoreTimer=setTimeout(()=>delta.classList.remove('show'),1900)});
  }

  function gainXp(amount){
    state.xp+=amount;const startingLevel=state.level;
    let leveled=false,earningsBonus=0;
    while(state.xp>=xpNeed()){
      state.xp-=xpNeed();state.level++;LOGIC.applyLevelUpResources(state,false);const bonus=100*state.level;receiveMoney(bonus,true);earningsBonus+=bonus;leveled=true;
    }
    if(leveled){const previous=levelUpSummary;levelUpSummary={fromLevel:previous?.fromLevel||startingLevel,toLevel:state.level,earningsBonus:(previous?.earningsBonus||0)+earningsBonus};trackEvent('level_up',{from_level:startingLevel,to_level:state.level,levels_gained:state.level-startingLevel});ensureRoster();if(state.socialAccountCreated)connectSharedSocial(true)}
  }
  function showLevelUp(summary){if(!summary)return;const levels=summary.toLevel-summary.fromLevel,loadoutUnlocked=summary.fromLevel<8&&summary.toLevel>=8;$('#levelUpNumber').textContent=summary.toLevel;$('#levelUpTitle').textContent=rankName();$('#levelUpFrom').textContent=`LEVEL ${summary.fromLevel} → LEVEL ${summary.toLevel}`;$('#levelUpEnergy').textContent=`+${levels*ENERGY_SEGMENT}%`;$('#levelUpHealth').textContent=`+${levels*5}`;$('#levelUpCash').textContent=`+$${fmt(summary.earningsBonus)}`;$('#levelUpNote').textContent=`Your corner restored one Energy segment and up to 25 Health per level. ${loadoutUnlocked?'Four-slot Fight Gear loadout unlocked.':'New competition is now available.'}`;const modal=$('#levelUpModal');modal.classList.add('active');modal.setAttribute('aria-hidden','false');sfx.level();vibrate([35,35,65,35,90]);confettiBurst();clearTimeout(modal._burstTimer);modal._burstTimer=setTimeout(confettiBurst,620)}
  function closeLevelUp(){const modal=$('#levelUpModal');clearTimeout(modal._burstTimer);modal._burstTimer=null;stopConfetti();modal.classList.remove('active');modal.setAttribute('aria-hidden','true');levelUpSummary=null;sfx.tap();updateUI();requestAnimationFrame(()=>showPendingTitleLoss()||showPendingCeoOffice())}
  function spendEnergy(n){const energySpent=LOGIC.spendEnergy(state,n);if(!energySpent){toast('Energy is empty. Use Rest & Recharge on the Train page.','#ff766d');return 0}return energySpent}

  function updateUI(){
    const careerRank=rankName(),rankText=$('#rankText');$('#fighterName').textContent=state.name;$('#levelText').textContent=`LVL ${state.level}`;rankText.textContent=careerRank;rankText.classList.toggle('world-champion',careerRank==='WORLD CHAMPION');
    $('#cashText').textContent='$'+fmt(state.cash);$('#recordText').textContent=`${state.wins}-${state.losses}`;$('#cageStatus').textContent=cageStatus();$('#heroLevel').textContent=`LVL ${state.level}`;
    const energyNow=Math.floor(state.energy),healthNow=Math.floor(state.health);
    if(lastShownEnergy!==null&&energyNow<lastShownEnergy)flashResource('energy',lastShownEnergy-energyNow);
    if(lastShownHealth!==null&&healthNow<lastShownHealth)flashResource('health',lastShownHealth-healthNow);
    lastShownEnergy=energyNow;lastShownHealth=healthNow;
    $('#hudEnergyText').textContent=`${energyNow}%`;$('#energyBattery').setAttribute('aria-label',`Energy ${energyNow} percent`);$$('#energyBattery i').forEach((segment,index)=>segment.classList.toggle('charged',state.energy>index*ENERGY_SEGMENT));$('#energyHud').classList.toggle('critical',state.energy<=ENERGY_SEGMENT);
    $('#hudHealthText').textContent=`${healthNow}/${state.maxHealth}`;$('#hudHealthBar').style.width=(state.health/state.maxHealth*100)+'%';$('#healthHud').classList.toggle('critical',LOGIC.resourceIsCritical(state.health,state.maxHealth));
    $('#xpText').textContent=`${Math.floor(state.xp)}/${xpNeed()}`;
    $('#hypeText').textContent=Math.floor(state.hype)+'%';
    const trainingInjury=currentTrainingInjury(),attributesRow=$('.hud-attributes-row');attributesRow.classList.toggle('injured',!!trainingInjury);attributesRow.setAttribute('aria-label',trainingInjury?`Fighter attributes reduced by ${trainingInjury.name}`:'Fighter attributes');
    ['power','speed','chin','cardio'].forEach(k=>{const value=effectiveStat(k);$('#'+k+'Stat').textContent=formatStat(value);$('#'+k+'Mini').style.width=clamp(value*4,5,100)+'%'});
    $('#dailyBtn').disabled=false;$('#dailyBtnLabel').textContent='CLAIM DAILY DROP';$('#dailyDropCountdown').hidden=true;
    renderCareer();renderSocial();renderTrain();renderHustle();renderGear();renderOpponents();drawHero();saveState();if(state.installDetected&&!state.installRewardClaimed)queueMicrotask(maybeGrantInstallReward);
  }

  const championshipResetCopy=SHARED_UI.championshipResetCopy;

  function renderCareer(){
    const style=currentStyle(),city=currentCity(),avatar=currentAvatar(),allocationValid=!!avatar&&validFighterAllocation(state.fighterBaseStats),coreReady=!!(style&&city&&avatar&&allocationValid),ready=coreReady&&state.nameLocked,completed=Number(!!city)+Number(!!avatar&&allocationValid)+Number(!!style)+Number(state.nameLocked),progress=completed*25,pwa=globalThis.CAGE_PWA;
    $('#app').style.setProperty('--fighter-accent',city?.accent||DEFAULT_FIGHTER_ACCENT);applyPortraitStyle($('#app'),state.name);
    if(pwa?.isInstalled?.())state.installDetected=true;
    const nativeInstall=!!pwa?.installAvailable?.(),dailyAvailable=ready&&state.lastDaily!==todayKey(),installAvailable=ready&&!dailyAvailable&&!state.installDetected&&!state.installRewardClaimed,dailyClaimed=ready&&!dailyAvailable&&!installAvailable,homeDropOffer=$('#homeDropOffer'),dailyButton=$('#dailyBtn'),dailyCountdown=$('#dailyDropCountdown');homeDropOffer.hidden=!ready;homeDropOffer.classList.toggle('claimed',dailyClaimed);dailyButton.hidden=installAvailable;dailyButton.disabled=!dailyAvailable;dailyCountdown.hidden=!dailyClaimed;$('#installGameBtn').hidden=!installAvailable;$('#installGameBtn').disabled=false;if(dailyAvailable){$('#homeDropEyebrow').textContent='ONE FREE PACK EVERY DAY';$('#homeDropTitle').textContent='DAILY DROP';$('#homeDropDescription').textContent='Cash · 25% Energy · Guaranteed collectible';$('#dailyBtnLabel').textContent='CLAIM DAILY DROP'}else if(installAvailable){$('#homeDropEyebrow').textContent=nativeInstall?'FREE PACK AFTER INSTALL':'INSTALL FROM YOUR BROWSER';$('#homeDropTitle').textContent='TAKE CAGE GRIND WITH YOU';$('#homeDropDescription').textContent='Install for faster access, offline play, and a free collectible drop'}else if(dailyClaimed){$('#homeDropEyebrow').textContent='TODAY’S PACK CLAIMED';$('#homeDropTitle').textContent='DAILY DROP';$('#homeDropDescription').textContent='Next free pack at your local midnight';$('#dailyBtnLabel').textContent='CLAIMED · NEXT DROP IN'}$('#app').classList.toggle('career-setup',!ready);$('.resource-hud').hidden=!ready;$('.bottomnav').hidden=!ready;$('#fighterBuilderIntro').hidden=ready;$('#builderProgressStep').textContent=`${completed} OF 4 COMPLETE`;$('#builderProgressPercent').textContent=`${progress}%`;$('#builderProgressFill').style.width=`${progress}%`;$('#builderProgressTrack').setAttribute('aria-valuenow',String(progress));$('#citySetup').hidden=!!city;$('#fighterSetup').hidden=!city||!!avatar;$('#archetypeSetup').hidden=!city||!avatar||!!style;$('#fighterNameSetup').hidden=!coreReady||state.nameLocked;if(coreReady&&!state.nameLocked&&!identitySuggestion)identitySuggestion=randomIdentitySuggestion();const identityDisplay=$('#fighterNameSuggestion'),manualInput=$('#manualFighterNameInput'),nameRule=$('#fighterNameRule'),manualValid=manualIdentityName(identityManualValue);identityDisplay.textContent=identitySuggestion||state.name;identityDisplay.hidden=identityManualMode;manualInput.hidden=!identityManualMode;nameRule.hidden=!identityManualMode;if(document.activeElement!==manualInput)manualInput.value=identityManualValue||identitySuggestion;manualInput.disabled=identityPending;manualInput.classList.toggle('invalid',identityManualMode&&!!identityManualValue&&!manualValid);nameRule.classList.toggle('invalid',identityManualMode&&!!identityManualValue&&!manualValid);$('#newFighterNameBtn').disabled=identityPending||identityShufflePending;$('#manualFighterNameBtn').disabled=identityPending||identityShufflePending;$('#manualFighterNameBtn').textContent=identityManualMode?'USE SUGGESTION':'MANUAL ENTRY';$('#lockFighterNameBtn').disabled=identityPending||identityShufflePending||(identityManualMode&&!manualValid);$('#lockFighterNameBtn').textContent=identityPending?'CHECKING NAME…':'READY';$('#careerIdentityStatus').textContent='LOCKED IN';$('#homeCityText').textContent=city?city.name:'NOT SELECTED';$('#homeStyleText').textContent=style?style.name:'NOT SELECTED';$('#careerFollowersText').textContent=fmt(state.fans);$('#careerEarningsText').textContent='$'+fmt(state.careerEarnings);
    const sponsor=state.activeEndorsement?endorsementDefs.find(d=>d.id===state.activeEndorsement.id):null,sponsorBadge=$('#heroSponsor'),hero=$('.hero'),sponsorWallpaper=$('#heroSponsorWallpaper');sponsorBadge.hidden=!sponsor;sponsorBadge.innerHTML=sponsor?`${gameIcon(sponsor.id,sponsor.icon)}<span class="hero-sponsor-copy"><small>SPONSORED BY</small><b>${sponsor.brand}</b><em>${state.activeEndorsement.fightsLeft} FIGHTS LEFT</em></span>`:'';hero.classList.toggle('sponsored',!!sponsor);sponsorWallpaper.hidden=!sponsor;sponsorWallpaper.style.backgroundImage=sponsor?`url("assets/icons/${sponsor.id}.png?v=${ICON_ASSET_VERSION}")`:'';
    $('#buildChoices').innerHTML=style?'':fighterStyles.map(s=>`<button class="build-choice" data-style="${s.id}"><b>${s.name}</b><small>${s.text}</small></button>`).join('');
    $('#cityChoices').innerHTML=city?'':fighterCities.map(c=>`<button class="city-choice" data-city="${c.id}" style="${fighterThemeStyle(c.id)}"><i aria-hidden="true"></i>${c.name}<small>${c.region}</small></button>`).join('');
    $('#fighterChoices').innerHTML=avatar?'':fighterAvatars.map((a,i)=>`<button class="avatar-card" data-avatar="${a.id}" aria-label="Select Fighter ${i+1}, Power ${formatStat(a.stats.power)}, Speed ${formatStat(a.stats.speed)}, Chin ${formatStat(a.stats.chin)}, Cardio ${formatStat(a.stats.cardio)}"><img src="${a.asset}" alt="Fighter ${i+1}" loading="lazy"><h3>FIGHTER ${String(i+1).padStart(2,'0')}</h3><div class="avatar-stats"><span>PWR ${formatStat(a.stats.power)}</span><span>SPD ${formatStat(a.stats.speed)}</span><span>CHN ${formatStat(a.stats.chin)}</span><span>CAR ${formatStat(a.stats.cardio)}</span></div><span class="avatar-total">SELECT</span></button>`).join('');
    if(avatar)$('#heroFighterArt').src=avatar.asset;
  }
  function chooseStyle(id){if(state.fighterStyle||!state.fighterCity||!state.fighterAvatar)return;const style=fighterStyles.find(s=>s.id===id);if(!style)return;state.fighterStyle=id;identitySuggestion=randomIdentitySuggestion();trackEvent('career_setup_step',{step:'archetype',selection:id});sfx.win();confettiBurst();toast(`${style.name} IDENTITY LOCKED IN`,'#76dcff');updateUI()}
  function chooseCity(id){if(state.fighterCity)return;const city=fighterCities.find(c=>c.id===id);if(!city)return;state.fighterCity=id;trackEvent('career_setup_step',{step:'city',selection:id});sfx.win();confettiBurst();toast(`FIGHTING OUT OF ${city.name}`,'#76dcff');updateUI()}
  function chooseAvatar(id){if(state.fighterAvatar||!state.fighterCity)return;const avatar=fighterAvatars.find(a=>a.id===id);if(!avatar||!validFighterAllocation(avatar.stats)){toast('Fighter build must use exactly 20 points with every attribute from 2 through 8.','#ff766d');return}const keys=['power','speed','chin','cardio'],earned=Object.fromEntries(keys.map(k=>[k,Math.max(0,(Number(state.stats[k])||5)-5)]));state.fighterAvatar=id;state.fighterBaseStats=Object.assign({},avatar.stats);state.stats=Object.fromEntries(keys.map(k=>[k,avatar.stats[k]+earned[k]]));trackEvent('career_setup_step',{step:'avatar',selection:id});sfx.win();confettiBurst();toast(`FIGHTER ${String(fighterAvatars.indexOf(avatar)+1).padStart(2,'0')} LOCKED IN · 20 POINT BUILD`,'#76dcff');updateUI()}
  function rerollFighterIdentity(){
    if(state.nameLocked||identityPending||identityShufflePending)return;identityManualMode=false;identityManualValue='';identityShufflePending=true;const button=$('#newFighterNameBtn');button.classList.add('shuffling');renderCareer();sfx.tap();
    setTimeout(()=>{let next=identitySuggestion;for(let attempt=0;attempt<12&&next===identitySuggestion;attempt++)next=randomIdentitySuggestion();identitySuggestion=next;identityShufflePending=false;button.classList.remove('shuffling');trackEvent('career_name_rerolled');renderCareer()},420);
  }
  function toggleManualFighterIdentity(){
    if(state.nameLocked||identityPending||identityShufflePending)return;identityManualMode=!identityManualMode;identityManualValue=identityManualMode?(identityManualValue||identitySuggestion):'';renderCareer();sfx.tap();if(identityManualMode)setTimeout(()=>{$('#manualFighterNameInput').focus();$('#manualFighterNameInput').select()},0)
  }
  function updateManualFighterIdentity(event){identityManualValue=event.target.value;renderCareer()}
  async function lockFighterIdentity(){
    if(state.nameLocked||identityPending||!currentStyle()||!currentCity()||!currentAvatar())return;
    const manualRequested=identityManualMode,requested=manualRequested?manualIdentityName(identityManualValue):(identitySuggestion||canonicalIdentitySuggestion());if(!requested){toast('USE ONE WORD · 3–32 CHARACTERS · START WITH A LETTER','#ff766d');$('#manualFighterNameInput').focus();return}
    if(!SHARED_FEED?.configured?.()||!SHARED_FEED.claimIdentity){toast('INTERNET CONNECTION REQUIRED TO VERIFY A UNIQUE NAME','#ffcf78');return}
    identityPending=true;renderCareer();
    try{
      const candidates=manualRequested?[requested]:identityClaimCandidates(requested),profile=await SHARED_FEED.claimIdentity(Object.assign(sharedProfilePayload(),{candidates}));if(!profile?.id||!normalizeIdentityName(profile.handle))throw new Error('Unique fighter name was not returned.');
      state.name=normalizeIdentityName(profile.handle);state.nameLocked=true;state.socialProfileId=profile.id;identitySuggestion='';identityManualMode=false;identityManualValue='';trackEvent('career_setup_step',{step:'name'});trackEvent('career_started',{archetype:state.fighterStyle,city:state.fighterCity,avatar:state.fighterAvatar});createSocialAccount();saveState();sfx.win();confettiBurst();toast(requested===state.name?`@${state.name} IS READY`:`@${requested} WAS TAKEN · @${state.name} IS YOURS`,'#76dcff');updateUI();navTo('home');connectSharedSocial(true);
    }catch(error){const unavailable=manualRequested&&/no unique cage grind name/i.test(String(error?.message||error));toast(unavailable?`@${requested} IS NOT AVAILABLE`:'NAME CHECK FAILED · TRY AGAIN WHEN CONNECTED','#ff766d');console.warn('Cage identity claim failed:',error)}finally{identityPending=false;renderCareer()}
  }
  function openRetirementDialog(){if(!state.nameLocked||retirementPending)return;$('#retireFighterName').textContent=`@${state.name}`;$('#retireCareerModal').classList.add('open');$('#retireCareerModal').setAttribute('aria-hidden','false');sfx.tap()}
  function closeRetirementDialog(){if(retirementPending)return;$('#retireCareerModal').classList.remove('open');$('#retireCareerModal').setAttribute('aria-hidden','true')}
  async function retireCareer(){
    if(retirementPending)return;retirementPending=true;const button=$('#confirmRetireBtn');button.disabled=true;button.textContent='RETIRING…';
    try{
      if(SHARED_FEED?.configured?.()&&SHARED_FEED.retireProfile)await SHARED_FEED.retireProfile();
      trackEvent('career_retired',{career_level:state.level,career_wins:state.wins,career_losses:state.losses});
      window.removeEventListener('beforeunload',saveState);
      LOGIC.clearCareerStorage(localStorage,[SAVE_KEY,SAVE_BACKUP_KEY,'fytr-save-v1']);
      window.location.reload();
    }catch(error){retirementPending=false;button.disabled=false;button.textContent='RETIRE FIGHTER';toast('RETIREMENT COULD NOT BE POSTED · CAREER KEPT SAFE','#ff766d');console.warn('Career retirement failed:',error)}
  }

  function sponsorFeedProfile(sponsorId){const sponsor=endorsementDefs.find(item=>item.id===sponsorId);if(!sponsor)return null;return {id:sponsor.id,author:sponsor.brand,handle:sponsor.handle||`@${sponsor.brand.replace(/[^A-Za-z0-9]/g,'')}`,tone:'sponsor',avatar:`assets/icons/${sponsor.id}.png?v=${ICON_ASSET_VERSION}`,verified:true,bio:sponsor.bio||`${sponsor.brand} supports Cage Grind fighters through ${sponsor.product.toLowerCase()}.`}}
  function socialProfile(key,sponsorId=''){
    const profiles=STRINGS.social.profiles;
    if(key==='fan'||key==='hater'){const names=STRINGS.social.usernames[key],username=names[hashSeed(`${key}|${state.socialCycle}|${state.socialSerial+1}`)%names.length];return {author:username,handle:`@${username.toLowerCase()}`,tone:key}}
    if(key==='player')return {author:state.name,handle:`@${state.name}`,tone:'player player-post',themeAccent:fighterAccent(state.fighterCity)}
    if(key==='sponsor')return sponsorFeedProfile(sponsorId)||profiles.media;
    return profiles[key]||profiles.media;
  }
  function socialHandle(name){return `@${String(name).toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,18)||'cagefighter'}`}
  function makeSocialPost(entry){const profile=socialProfile(entry.profile,entry.sponsorId),author=entry.author||profile.author,handle=entry.handle||profile.handle||socialHandle(author),id=++state.socialSerial,seed=hashSeed(`${id}|${entry.text}|${state.socialCycle}`);return {id,cycle:state.socialCycle,author,handle,tone:profile.tone,text:String(entry.text),likes:5+seed%Math.max(18,36+state.level*12),reposts:seed%Math.max(4,7+state.level*3),avatarAsset:profile.avatar||'',verified:profile.verified===true,themeAccent:profile.themeAccent||'',sponsorId:entry.sponsorId||'',targetProfileId:entry.targetProfileId||''}}
  function addSocialPosts(entries){const posts=entries.map(makeSocialPost);state.socialFeed=[...posts,...state.socialFeed].slice(0,30)}
  function ensureSocialFeed(){return !!(state.socialAccountCreated&&state.socialFeed.length)}
  function socialUnreadCount(){return ensureSocialFeed()?state.socialFeed.filter(post=>feedPostMentionsPlayer(post)&&(Number(post.id)||0)>state.socialLastMentionSerial).length:0}
  function sharedSocialUnreadCount(){return sharedSocialStatus==='ready'?sharedSocialPosts.filter(post=>feedPostMentionsPlayer(post)&&(Number(String(post.id).replace('shared-',''))||0)>state.socialLastRemoteMentionPostId).length:0}
  function sharedProfilePayload(){return {city:state.fighterCity,archetype:state.fighterStyle,fighterAvatar:state.fighterAvatar,level:state.level,wins:state.wins,losses:state.losses}}
  function feedPostMentionsPlayer(post){const targetProfileId=String(post?.targetProfileId||post?.target_profile_id||'');if(targetProfileId&&targetProfileId===state.socialProfileId)return true;const ownHandle=String(state.name||'').toLowerCase();return !!ownHandle&&String(post?.text||post?.body||'').split(/(@[A-Za-z][A-Za-z0-9_]{2,31})/g).some(part=>part[0]==='@'&&part.slice(1).toLowerCase()===ownHandle)}
  function mapSharedPost(post){const reporter=post.post_kind==='reporter',ceo=post.post_kind==='ceo',sponsor=post.post_kind==='sponsor',sponsorProfile=sponsor?sponsorFeedProfile(String(post.sponsor_id||'')):null,mine=post.author_id===state.socialProfileId,profile=reporter||ceo||sponsor?null:sharedSocialProfiles.find(item=>item.id===post.author_id)||null,avatar=fighterAvatars.find(item=>item.id===profile?.fighter_avatar),ceoProfile=STRINGS.social.profiles.ceo,reporterProfile=STRINGS.social.profiles.media,officialProfile=sponsorProfile||(ceo?ceoProfile:reporter?reporterProfile:null),targetProfileId=String(post.target_profile_id||'');return {id:`shared-${post.id}`,author:officialProfile?.author||post.author_handle,handle:officialProfile?.handle||`@${post.author_handle}`,tone:sponsor?'sponsor':ceo?'ceo':reporter?'media':mine?'player player-post':'fighter',text:String(post.body||''),createdAt:post.created_at,shared:true,profileId:profile?.id||'',targetProfileId,targetHandle:String(post.target_handle||''),sponsorId:sponsorProfile?.id||'',avatarAsset:officialProfile?.avatar||avatar?.asset||'',verified:Boolean(officialProfile?.verified),themeAccent:officialProfile?'':fighterAccent(profile?.city)}}
  function fighterSessionMessage(error){const message=String(error?.message||error||'Cage Network unavailable.');if(/permanent fighter identity/i.test(message))return 'FIGHTER REGISTRATION MISSING · RECOVERY REQUIRED';if(/fighter (network )?session (missing|expired)/i.test(message))return 'FIGHTER NETWORK SESSION UNAVAILABLE · RECOVERY REQUIRED';if(/fighter (network )?(session disconnected|identity does not match)/i.test(message))return 'FIGHTER NETWORK IDENTITY DOES NOT MATCH THIS CAREER · RECOVERY REQUIRED';if(/No unique Cage Grind name was available/i.test(message))return 'FIGHTER NETWORK IDENTITY CONFLICT · RECOVERY REQUIRED';return message}
  function sharedProfileMatchesCareer(profile){return !!profile&&normalizeIdentityName(profile.handle)===state.name&&String(profile.city||'')===state.fighterCity&&normalizeMajorArchetype(profile.archetype)===state.fighterStyle&&String(profile.fighter_avatar||'')===state.fighterAvatar}
  async function syncSharedProfile(){const existing=await SHARED_FEED.loadOwnProfile(state.socialProfileId);if(existing){if(!sharedProfileMatchesCareer(existing))throw new Error('Fighter network identity does not match this saved career.');return SHARED_FEED.registerProfile(sharedProfilePayload())}if(!SHARED_FEED.claimIdentity)throw new Error('Create a permanent fighter identity before syncing');const profile=await SHARED_FEED.claimIdentity(Object.assign(sharedProfilePayload(),{candidates:[state.name]}));if(!sharedProfileMatchesCareer(profile))throw new Error('Fighter network identity does not match this saved career.');return profile}
  function scheduleSharedSocialRefresh(){clearTimeout(sharedSocialRefreshTimer);sharedSocialRefreshTimer=null;if(currentScreen==='feed'&&sharedSocialStatus==='ready')sharedSocialRefreshTimer=setTimeout(()=>connectSharedSocial(true),30000)}
  async function connectSharedSocial(force=false){
    if(!state.nameLocked||!SHARED_FEED?.configured?.())return false;
    if(sharedSocialStatus==='ready'&&!force){scheduleSharedSocialRefresh();return true}
    if(sharedSocialSyncPromise)return sharedSocialSyncPromise;
    if(sharedSocialStatus!=='ready')sharedSocialStatus='loading';renderSocial();
    sharedSocialSyncPromise=(async()=>{
      const profile=await syncSharedProfile();
      if(!profile?.id||!profile?.handle)throw new Error('Shared profile registration failed.');
      if(state.socialProfileId&&profile.id!==state.socialProfileId)throw new Error('Fighter network identity does not match this saved career.');
      state.socialProfileId=profile.id;if(normalizeIdentityName(profile.handle)!==state.name){state.name=normalizeIdentityName(profile.handle);state.nameLocked=true}
      let [posts,profiles,interactionsRemaining,championship]=await Promise.all([SHARED_FEED.loadFeed(50),SHARED_FEED.loadProfiles(1000),SHARED_FEED.loadInteractionAllowance(),SHARED_FEED.loadChampionship()]);setSharedChampionship(championship);syncRankedOpponents(profiles);queueTitleLossPresentation(sharedChampionship);landingFeature.setAvailability(sharedChampionship,true,false);const hasOwnRemotePost=Array.isArray(posts)&&posts.some(post=>post.author_id===profile.id);
      if(state.socialAccountCreated&&!hasOwnRemotePost&&!state.socialRemoteInitialized){await SHARED_FEED.publishPost({kind:'player',body:'Hello, fight fans! Stay tuned—the climb starts now.'});posts=await SHARED_FEED.loadFeed(50)}
      state.socialRemoteInitialized=state.socialAccountCreated&&(hasOwnRemotePost||Array.isArray(posts)&&posts.some(post=>post.author_id===profile.id));
      sharedSocialProfiles=[profile,...(Array.isArray(profiles)?profiles.filter(item=>item.id!==profile.id):[])];try{state.socialFollowingCount=await SHARED_FEED.loadProfileCount()}catch{state.socialFollowingCount=sharedSocialProfiles.length}sharedSocialInteractionsRemaining=Math.max(0,Math.min(5,Number(interactionsRemaining)||0));sharedSocialPosts=Array.isArray(posts)?posts.map(mapSharedPost):[];
      sharedSocialStatus='ready';sharedSocialError='';sharedSocialNoticeShown=false;saveState();renderSocial();renderLanding();renderCareer();renderOpponents();$('#cageStatus').textContent=cageStatus();scheduleSharedSocialRefresh();if(state.pendingChampionshipResult&&!championshipSettlementPromise)queueMicrotask(()=>settleChampionshipResult());requestAnimationFrame(showPendingTitleLoss);return true;
    })().catch(error=>{
      sharedSocialStatus='error';sharedSocialError=fighterSessionMessage(error);sharedSocialPosts=[];sharedSocialProfiles=[];sharedSocialInteractionsRemaining=0;if(!landingFeature.status().championshipLoaded)landingFeature.setAvailability(null,true,true);renderSocial();renderLanding();renderOpponents();
      if(currentScreen==='feed'&&!sharedSocialNoticeShown){sharedSocialNoticeShown=true;toast('SHARED FEED SETUP PENDING · USING LOCAL FEED','#ffcf78')}
      return false;
    }).finally(()=>{sharedSocialSyncPromise=null});
    return sharedSocialSyncPromise;
  }
  function queueSharedPosts(entries){
    if(!entries.length||!state.socialAccountCreated)return;
    queueMicrotask(async()=>{
      if(!await connectSharedSocial(false))return;
      try{for(const entry of entries){if(entry.kind==='ceo')await SHARED_FEED.publishCeoPost(entry.eventKey);else await SHARED_FEED.publishPost({kind:entry.kind,body:entry.body,targetProfileId:entry.targetProfileId||null})}await connectSharedSocial(true)}
      catch(error){sharedSocialStatus='error';sharedSocialError=String(error?.message||'Shared post failed.');renderSocial();toast('POST SAVED LOCALLY · SHARED FEED WILL RETRY LATER','#ffcf78')}
    });
  }
  function publishSponsorSigning(sponsor){if(!sponsor||!state.socialAccountCreated)return;state.socialCycle=Math.max(1,state.socialCycle+1);const text=copyText(STRINGS.social.sponsorSigning,{name:state.name,brand:sponsor.brand});addSocialPosts([{profile:'sponsor',sponsorId:sponsor.id,text,targetProfileId:state.socialProfileId}]);saveState();queueMicrotask(async()=>{if(!await connectSharedSocial(false)||!SHARED_FEED.publishSponsorPost)return;try{await SHARED_FEED.publishSponsorPost(sponsor.id);await connectSharedSocial(true)}catch(error){toast('SPONSOR POST SAVED LOCALLY · SHARED FEED WILL RETRY LATER','#ffcf78')}})}
  function ceoCopyKey(eventKey){return eventKey.startsWith('performance_bonus_')?'performanceBonus':eventKey==='debut'?'debut':''}
  function ceoRemoteEventKey(eventKey){return eventKey.startsWith('performance_bonus_')?'performance_bonus':eventKey}
  function publishCeoEvent(eventKey,{sync=true}={}){
    const copy=STRINGS.social.ceo[ceoCopyKey(eventKey)];if(!copy||state.ceoEvents.includes(eventKey))return false;
    state.ceoEvents.push(eventKey);state.ceoEvents=state.ceoEvents.slice(-40);state.socialCycle=Math.max(1,state.socialCycle+1);addSocialPosts(copyPosts([copy],{name:state.name}));
    if(sync&&state.socialAccountCreated)queueSharedPosts([{kind:'ceo',eventKey:ceoRemoteEventKey(eventKey)}]);saveState();return true;
  }
  function syncCeoCareerEvents(){if(!state.nameLocked)return;if(publishCeoEvent('debut',{sync:false})&&state.socialAccountCreated)queueSharedPosts([{kind:'ceo',eventKey:'debut'}])}
  function queueTitleLossPresentation(champ){
    const historyId=Math.max(0,Math.floor(Number(champ?.last_title_loss_id))||0);if(!historyId||historyId<=state.lastTitleLossSeenId)return false;
    pendingTitleLossPresentation={id:historyId,opponent:String(champ.last_title_loss_opponent_handle||champ.champion_handle||'THE NEW CHAMPION').replace(/^@/,''),lostAt:champ.last_title_loss_at||'',rematch:champ.former_champion_rematch===true,cooldown:champ.cooldown_until||''};return true;
  }
  function showPendingTitleLoss(){
    if(!pendingTitleLossPresentation||fight||combatLocked||$('#resultModal').style.display==='flex'||$('#levelUpModal').classList.contains('active')||$('#ceoOfficeModal').classList.contains('open'))return false;
    const notice=pendingTitleLossPresentation,lostAt=new Date(notice.lostAt),resetAt=new Date(notice.cooldown||''),dateCopy=Number.isFinite(lostAt.getTime())?lostAt.toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).toUpperCase():'CAGE NETWORK RESULT',waiting=Number.isFinite(resetAt.getTime())&&resetAt.getTime()>Date.now();$('#titleLossOpponent').textContent=`@${notice.opponent}`;$('#titleLossMeta').textContent=`BELT CHANGED HANDS · ${dateCopy}`;$('#titleLossRematch').textContent=notice.rematch?(waiting?'TITLE REMATCH AVAILABLE TOMORROW':'TITLE REMATCH AVAILABLE'):'STANDARD TITLE-SHOT RULES APPLY';$('#titleLossModal').classList.add('open');$('#titleLossModal').setAttribute('aria-hidden','false');sfx.lose();return true;
  }
  function closeTitleLoss(goToFight=false){
    const notice=pendingTitleLossPresentation;if(notice)state.lastTitleLossSeenId=Math.max(state.lastTitleLossSeenId,notice.id);pendingTitleLossPresentation=null;$('#titleLossModal').classList.remove('open');$('#titleLossModal').setAttribute('aria-hidden','true');saveState();sfx.tap();if(goToFight)navTo('fight');else requestAnimationFrame(showPendingCeoOffice);
  }
  function showPendingCeoOffice(){if(!pendingCeoPresentation)return false;const presentation=pendingCeoPresentation;pendingCeoPresentation=null;$('#ceoOfficeTitle').textContent=presentation.title;$('#ceoOfficeMessage').textContent=presentation.message;$('#ceoOfficeModal').classList.add('open');$('#ceoOfficeModal').setAttribute('aria-hidden','false');sfx.tap();return true}
  function closeCeoOffice(){$('#ceoOfficeModal').classList.remove('open');$('#ceoOfficeModal').setAttribute('aria-hidden','true');sfx.tap()}
  function createSocialAccount(){
    if(ensureSocialFeed())return;
    const firstAccount=!state.socialAccountCreated;state.socialAccountCreated=true;state.socialCycle=Math.max(1,state.socialCycle);state.socialPostedCycle=state.socialCycle;
    const previousCeoEvents=[...state.ceoEvents],accountPosts=copyPosts([STRINGS.social.account[0]],{name:state.name}),contractPosts=firstAccount?copyPosts([STRINGS.social.contractSigning],{name:state.name,archetype:currentStyle()?.name||'fighter',city:currentCity()?.name||'the regional circuit'}):[];addSocialPosts(accountPosts);publishCeoEvent('debut');if(contractPosts.length){addSocialPosts(contractPosts);queueSharedPosts(contractPosts.map(post=>({kind:'reporter',body:post.text})))}if(firstAccount&&previousCeoEvents.length)queueSharedPosts(previousCeoEvents.map(eventKey=>({kind:'ceo',eventKey:ceoRemoteEventKey(eventKey)})));
    const firstFollowers=firstAccount?changeFollowers(5):0;if(firstAccount)trackEvent('social_account_created',{followers_awarded:firstFollowers});toast(firstFollowers?`CAGE FEED ACCOUNT CREATED · +${firstFollowers} FOLLOWERS`:'CAGE FEED ACCOUNT CONNECTED','#6ed7ff');sfx.win();saveState();
  }
  function drawSocialHeadline(key,entries){
    const pool=(Array.isArray(entries)?entries:[entries]).filter(entry=>entry?.profile==='media');if(!pool.length)return null;
    const count=Math.max(0,Math.floor(Number(state.socialHeadlineCounts?.[key]))||0),deck=[...pool],batch=Math.floor(count/pool.length),random=seededRandom(hashSeed(`reporter-posts|${state.socialProfileId||state.name}|${key}|${batch}`));
    for(let index=deck.length-1;index>0;index--){const swap=Math.floor(random()*(index+1));[deck[index],deck[swap]]=[deck[swap],deck[index]]}
    state.socialHeadlineCounts=state.socialHeadlineCounts&&typeof state.socialHeadlineCounts==='object'?state.socialHeadlineCounts:{};state.socialHeadlineCounts[key]=count+1;return deck[count%deck.length];
  }
  function openSocialCycle(type,data={}){
    if(!ensureSocialFeed())return;state.socialCycle=Math.max(1,state.socialCycle+1);
    const name=state.name,posts=[],cycles=STRINGS.social.cycles,addHeadline=(key,entries,values)=>{const headline=drawSocialHeadline(key,entries),reporterValues=Object.assign({},values,{name:`@${String(values.name||name).replace(/^@/,'')}`});if(headline)posts.push(...copyPosts([headline],reporterValues))};
    if(type==='fight'){
      const values={name,opponent:data.opponent,finish:String(data.method||'decision').toUpperCase(),winStreak:data.winStreak,injury:data.injury,titleSuffix:data.title?` The new ${data.title} champion has arrived.`:''};
      if(data.win){const key=data.injury?'fightInjuredWin':data.winStreak>=2?'fightStreak':'fightWin',entries=key==='fightStreak'?cycles.fightStreakHeadline:cycles[key];addHeadline(key,entries,values)}
      else addHeadline('fightLoss',cycles.fightLoss,values);
    }
    const reporterPosts=posts.filter(post=>post.profile==='media');if(reporterPosts.length){addSocialPosts(reporterPosts);saveState();queueSharedPosts(reporterPosts.map(post=>({kind:'reporter',body:post.text})))}
  }
  function feedAge(post){if(post.createdAt){const seconds=Math.max(0,Math.floor((Date.now()-new Date(post.createdAt).getTime())/1000));if(seconds<60)return 'NOW';if(seconds<3600)return `${Math.floor(seconds/60)}M`;if(seconds<86400)return `${Math.floor(seconds/3600)}H`;return `${Math.floor(seconds/86400)}D`}const age=Math.max(0,state.socialCycle-(Number(post.cycle)||0));return age===0?'NOW':age===1?'1 EVENT AGO':`${age} EVENTS AGO`}
  function renderFeedText(post){const ownHandle=String(state.name||'').toLowerCase();return String(post.text||'').split(/(@[A-Za-z][A-Za-z0-9_]{2,31})/g).map(part=>/^@[A-Za-z][A-Za-z0-9_]{2,31}$/.test(part)?`<span class="feed-mention${part.slice(1).toLowerCase()===ownHandle?' self':''}">${escapeHtml(part)}</span>`:escapeHtml(part)).join('')}
  function renderFeedPost(post){const initials=String(post.author||'?').split(/\s+/).map(part=>part[0]||'').join('').slice(0,2).toUpperCase(),reactions=post.shared?'':`<div class="feed-reactions"><span>♡ ${fmt(post.likes||0)}</span><span>↻ ${fmt(post.reposts||0)}</span></div>`,avatarContent=post.avatarAsset?`<img src="${escapeHtml(post.avatarAsset)}" alt="">`:escapeHtml(initials),avatar=post.profileId?`<button class="feed-avatar fighter-photo" type="button" data-feed-profile="${escapeHtml(post.profileId)}" aria-label="View ${escapeHtml(post.author)} fighter bio">${avatarContent}</button>`:post.sponsorId?`<button class="feed-avatar sponsor-photo" type="button" data-sponsor-profile="${escapeHtml(post.sponsorId)}" aria-label="View ${escapeHtml(post.author)} sponsor profile">${avatarContent}</button>`:post.tone==='ceo'?`<button class="feed-avatar" type="button" data-ceo-profile aria-label="View Cage Grind CEO profile">${avatarContent}</button>`:post.tone==='media'?`<button class="feed-avatar reporter-photo" type="button" data-reporter-profile aria-label="View CageReporter profile">${avatarContent}</button>`:`<div class="feed-avatar">${avatarContent}</div>`,verified=post.verified?'<i class="feed-verified" aria-label="Verified official account" title="Verified official account">✓</i>':'',theme=post.themeAccent?` style="--fighter-accent:${escapeHtml(post.themeAccent)};${fighterPortraitStyle(post.handle)}"`:'';return `<article class="feed-post ${escapeHtml(post.tone||'media')}${feedPostMentionsPlayer(post)?' mentioned-post':''}"${theme}>${avatar}<div class="feed-post-copy"><div class="feed-post-head"><b>${escapeHtml(post.author)}</b>${verified}<span>${escapeHtml(post.handle)}</span><time>${feedAge(post)}</time></div><p>${renderFeedText(post)}</p>${reactions}</div></article>`}
  function fighterBioSentence(profile){const city=fighterCities.find(item=>item.id===profile.city)?.name||String(profile.city||'UNKNOWN').toUpperCase(),style=fighterStyles.find(item=>item.id===normalizeMajorArchetype(profile.archetype))?.name||'FIGHTER',wins=Math.max(0,Number(profile.wins)||0),losses=Math.max(0,Number(profile.losses)||0);return `${profile.handle} is a Level ${Math.max(1,Number(profile.level)||1)} ${style.toLowerCase()} fighting out of ${city}, with a professional record of ${wins} win${wins===1?'':'s'} and ${losses} loss${losses===1?'':'es'}.`}
  function fighterInteractionDraft(kind,profile,offset=0){const definition=STRINGS.social.interactions[kind],messages=definition?.messages||[];if(!messages.length||!profile)return null;const order=messages.map((message,index)=>({message,index})),random=seededRandom(hashSeed(`fighter-post|${state.socialProfileId||state.name}|${profile.id}|${kind}|${todayKey()}|${5-sharedSocialInteractionsRemaining}`));for(let index=order.length-1;index>0;index--){const swap=Math.floor(random()*(index+1));[order[index],order[swap]]=[order[swap],order[index]]}const selected=order[Math.max(0,offset)%order.length];return {id:`${kind}-${selected.index}`,kind,text:copyText(selected.message,{name:state.name,handle:profile.handle,targetName:profile.handle})}}
  function renderFighterBioInteractions(profile){const container=$('#fighterBioInteractions');container.innerHTML=profile?.id===state.socialProfileId?'<div class="fighter-bio-limit">THIS IS YOUR PUBLIC FIGHTER PROFILE</div>':'<div class="fighter-bio-limit">USE THE FEED ACTIONS TO POST TO THIS FIGHTER</div>'}
  function renderCeoBioDetails(){$('#fighterBioInteractions').innerHTML='<div class="fighter-bio-limit ceo-bio-official">VERIFIED OFFICIAL ACCOUNT · MESSAGES CLOSED</div>'}
  function renderReporterBioDetails(){$('#fighterBioInteractions').innerHTML='<div class="fighter-bio-limit reporter-bio-official">VERIFIED OFFICIAL ACCOUNT · READ ONLY</div>'}
  function renderSponsorBioDetails(){$('#fighterBioInteractions').innerHTML='<div class="fighter-bio-limit ceo-bio-official">VERIFIED SPONSOR · READ ONLY</div>'}
  function openCeoBio(){const profile=STRINGS.social.profiles.ceo;activeBioProfileId='official-ceo';$('#fighterBioModal').style.removeProperty('--fighter-accent');$('#fighterBioModal').classList.remove('reporter-profile');$('#fighterBioModal').classList.add('ceo-profile');$('#fighterBioKicker').textContent='VERIFIED OFFICIAL ACCOUNT';$('#fighterBioAvatar').innerHTML=`<img src="${escapeHtml(profile.avatar)}" alt="${escapeHtml(profile.author)}">`;$('#fighterBioHandle').textContent=profile.handle;$('#fighterBioTitle').textContent=profile.author;$('#fighterBioText').textContent=profile.bio;renderCeoBioDetails();$('#fighterBioModal').classList.add('open');$('#fighterBioModal').setAttribute('aria-hidden','false');sfx.tap()}
  function openReporterBio(){const profile=STRINGS.social.profiles.media;activeBioProfileId='official-reporter';$('#fighterBioModal').style.removeProperty('--fighter-accent');$('#fighterBioModal').classList.remove('ceo-profile');$('#fighterBioModal').classList.add('reporter-profile');$('#fighterBioKicker').textContent='CAGE GRIND NEWSROOM · VERIFIED';$('#fighterBioAvatar').innerHTML=`<img src="${escapeHtml(profile.avatar)}" alt="${escapeHtml(profile.author)}">`;$('#fighterBioHandle').textContent=profile.handle;$('#fighterBioTitle').textContent=profile.author;$('#fighterBioText').textContent=profile.bio;renderReporterBioDetails();$('#fighterBioModal').classList.add('open');$('#fighterBioModal').setAttribute('aria-hidden','false');sfx.tap()}
  function openSponsorBio(sponsorId){const profile=sponsorFeedProfile(sponsorId);if(!profile)return;activeBioProfileId=`official-sponsor:${profile.id}`;$('#fighterBioModal').style.removeProperty('--fighter-accent');$('#fighterBioModal').classList.remove('ceo-profile','reporter-profile');$('#fighterBioModal').classList.add('sponsor-profile');$('#fighterBioKicker').textContent='CAGE GRIND SPONSOR · VERIFIED';$('#fighterBioAvatar').innerHTML=`<img src="${escapeHtml(profile.avatar)}" alt="${escapeHtml(profile.author)}">`;$('#fighterBioHandle').textContent=profile.handle;$('#fighterBioTitle').textContent=profile.author;$('#fighterBioText').textContent=profile.bio;renderSponsorBioDetails();$('#fighterBioModal').classList.add('open');$('#fighterBioModal').setAttribute('aria-hidden','false');sfx.tap()}
  function openFighterBio(profile){if(!profile)return;activeBioProfileId=profile.id;$('#fighterBioModal').style.setProperty('--fighter-accent',fighterAccent(profile.city));applyPortraitStyle($('#fighterBioModal'),profile.handle);$('#fighterBioModal').classList.remove('ceo-profile','reporter-profile');$('#fighterBioKicker').textContent=`REAL CAGE GRIND FIGHTER · ${fighterCityCode(profile.city)}`;const avatar=fighterAvatars.find(item=>item.id===profile.fighter_avatar);$('#fighterBioAvatar').innerHTML=avatar?`<img src="${escapeHtml(avatar.asset)}" alt="${escapeHtml(profile.handle)}">`:'<span>CG</span>';$('#fighterBioHandle').textContent=`@${profile.handle}`;$('#fighterBioTitle').textContent=profile.handle;$('#fighterBioText').textContent=fighterBioSentence(profile);renderFighterBioInteractions(profile);$('#fighterBioModal').classList.add('open');$('#fighterBioModal').setAttribute('aria-hidden','false');sfx.tap()}
  function closeFighterBio(){activeBioProfileId='';$('#fighterBioModal').classList.remove('open','ceo-profile','reporter-profile','sponsor-profile');$('#fighterBioModal').setAttribute('aria-hidden','true')}
  function renderSocial(){
    const accountReady=ensureSocialFeed(),sharedReady=sharedSocialStatus==='ready',posts=sharedReady?sharedSocialPosts:state.socialFeed||[],mentions=posts.filter(feedPostMentionsPlayer);if(accountReady&&currentScreen==='feed'&&feedFilter==='mentions'){state.socialLastMentionSerial=Math.max(state.socialLastMentionSerial,...state.socialFeed.filter(feedPostMentionsPlayer).map(post=>Number(post.id)||0));state.socialLastRemoteMentionPostId=Math.max(state.socialLastRemoteMentionPostId,...sharedSocialPosts.filter(feedPostMentionsPlayer).map(post=>Number(String(post.id).replace('shared-',''))||0));saveState()}const unread=socialUnreadCount()+sharedSocialUnreadCount(),navBadge=$('#feedNavBadge');navBadge.hidden=unread<1;navBadge.textContent=unread>99?'99+':String(unread);navBadge.setAttribute('aria-label',`${unread} unread Cage Feed mention${unread===1?'':'s'}`);
    $('#feedCycleStatus').textContent=!accountReady?'ACCOUNT NOT CREATED':sharedReady?`${sharedSocialInteractionsRemaining}/5 POSTS LEFT`:sharedSocialStatus==='loading'?'CONNECTING':'LOCAL FEED';
    const visiblePosts=feedFilter==='mentions'?mentions:posts;$('#feedMentionCount').textContent=String(mentions.length);$('#feedPostAllowance').textContent=`${sharedSocialInteractionsRemaining} OF 5 POSTS LEFT`;$$('[data-feed-intent]').forEach(button=>button.disabled=!sharedReady||sharedSocialInteractionsRemaining<1);for(const filter of ['all','mentions']){const button=$(`#feedFilter${filter==='all'?'All':'Mentions'}`),active=feedFilter===filter;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))}$('#socialTimeline').innerHTML=visiblePosts.length?visiblePosts.map(renderFeedPost).join(''):`<div class="feed-preview-empty">${feedFilter==='mentions'?'No mentions yet.':'No posts yet.'}</div>`;
    if(activeBioProfileId&&$('#fighterBioModal').classList.contains('open'))activeBioProfileId==='official-ceo'?renderCeoBioDetails():activeBioProfileId==='official-reporter'?renderReporterBioDetails():activeBioProfileId.startsWith('official-sponsor:')?renderSponsorBioDetails():renderFighterBioInteractions(sharedSocialProfiles.find(profile=>profile.id===activeBioProfileId));
  }
  function renderFighterPostResults(){const query=$('#fighterPostSearch').value.trim().replace(/^@/,'').toLowerCase(),profiles=sharedSocialProfiles.filter(profile=>profile.id!==state.socialProfileId&&(!query||String(profile.handle||'').toLowerCase().includes(query))).sort((a,b)=>String(a.handle).localeCompare(String(b.handle))).slice(0,60);$('#fighterPostResults').innerHTML=profiles.length?profiles.map(profile=>{const avatar=fighterAvatars.find(item=>item.id===profile.fighter_avatar);return `<button class="fighter-post-result" type="button" data-fighter-post-target="${escapeHtml(profile.id)}">${avatar?`<img src="${escapeHtml(avatar.asset)}" alt="">`:'<span class="fighter-post-result-avatar">CG</span>'}<span><b>@${escapeHtml(profile.handle)}</b><small>LEVEL ${Math.max(1,Number(profile.level)||1)} · ${fighterCityCode(profile.city)} · ${Math.max(0,Number(profile.wins)||0)}-${Math.max(0,Number(profile.losses)||0)}</small></span><em>SELECT</em></button>`}).join(''):'<div class="fighter-post-empty">NO FIGHTERS MATCH THAT SEARCH</div>'}
  function currentFighterPostDraft(){return fighterInteractionDraft(fighterPostIntent,fighterPostTarget,fighterPostDraftOffset)}
  function renderFighterPostPreview(){const choice=currentFighterPostDraft();if(!fighterPostTarget||!choice)return;$('#fighterPostSearchStep').hidden=true;$('#fighterPostPreviewStep').hidden=false;$('#fighterPostTitle').textContent=STRINGS.social.interactions[fighterPostIntent]?.label||'FIGHTER POST';$('#fighterPostTarget').innerHTML=`<b>@${escapeHtml(fighterPostTarget.handle)}</b><span>LEVEL ${Math.max(1,Number(fighterPostTarget.level)||1)} · ${fighterCityCode(fighterPostTarget.city)}</span>`;$('#fighterPostDraft').textContent=choice.text;$('#fighterPostSend').disabled=fighterInteractionPending;$('#fighterPostRedraft').disabled=fighterInteractionPending;$('#fighterPostBack').disabled=fighterInteractionPending}
  function openFighterPostComposer(kind){if(sharedSocialStatus!=='ready'){toast('GLOBAL FEED CONNECTION REQUIRED','#ffcf78');return}if(sharedSocialInteractionsRemaining<1){toast('DAILY FIGHTER POST LIMIT REACHED','#ffcf78');return}if(!STRINGS.social.interactions[kind]||kind==='welcome')return;fighterPostIntent=kind;fighterPostTarget=null;fighterPostDraftOffset=0;$('#fighterPostTitle').textContent=STRINGS.social.interactions[kind].label;$('#fighterPostKicker').textContent=`CAGE FEED · ${sharedSocialInteractionsRemaining} OF 5 POSTS LEFT`;$('#fighterPostSearchStep').hidden=false;$('#fighterPostPreviewStep').hidden=true;$('#fighterPostSearch').value='';renderFighterPostResults();$('#fighterPostModal').classList.add('open');$('#fighterPostModal').setAttribute('aria-hidden','false');sfx.tap();requestAnimationFrame(()=>$('#fighterPostSearch').focus())}
  function closeFighterPostComposer(){if(fighterInteractionPending)return;fighterPostIntent='';fighterPostTarget=null;$('#fighterPostModal').classList.remove('open');$('#fighterPostModal').setAttribute('aria-hidden','true')}
  async function handleFighterInteraction(choice,target){
    if(fighterInteractionPending||!choice||!target?.id||target.id===state.socialProfileId)return;if(sharedSocialInteractionsRemaining<1){toast('DAILY FIGHTER POST LIMIT REACHED','#ffcf78');return}fighterInteractionPending=true;renderFighterPostPreview();
    try{await SHARED_FEED.publishPost({kind:choice.kind,body:choice.text,targetProfileId:target.id});sharedSocialInteractionsRemaining=Math.max(0,sharedSocialInteractionsRemaining-1);const reward=LOGIC.socialInteractionReward(hashSeed(`${choice.id}|${target.id}|${state.socialCycle}|${sharedSocialInteractionsRemaining}`)),followersGained=changeFollowers(reward.followers),hypeBefore=state.hype;state.hype=clamp(state.hype+reward.hype,0,100);const hypeGained=state.hype-hypeBefore;trackEvent('social_post',{post_type:'fighter_interaction',interaction_kind:choice.kind,posts_remaining:sharedSocialInteractionsRemaining,followers_gained:followersGained,hype_gained:hypeGained});saveState();fighterInteractionPending=false;closeFighterPostComposer();await connectSharedSocial(true);updateUI();toast(`POST SENT · +${followersGained} FOLLOWERS · +${hypeGained} HYPE · ${sharedSocialInteractionsRemaining}/5 LEFT`,'#6ed7ff');sfx.win();requestAnimationFrame(()=>$('#socialTimeline').scrollTo({top:0,behavior:'smooth'}))}
    catch(error){try{sharedSocialInteractionsRemaining=await SHARED_FEED.loadInteractionAllowance()}catch{/* keep the last known allowance */}toast(String(error?.message||'FIGHTER POST FAILED').toUpperCase(),'#ff766d')}
    finally{fighterInteractionPending=false;if($('#fighterPostModal').classList.contains('open'))renderFighterPostPreview()}
  }

  function historyLayer(layer='screen'){return {[HISTORY_KEY]:true,screen:currentScreen,layer}}
  function writeHistory(layer='screen',mode='push'){
    const entry=historyLayer(layer);if(mode==='replace')history.replaceState(entry,'');else if(mode==='push')history.pushState(entry,'');
  }
  function navTo(screen){
    const historyMode=arguments[1]||'push';
    if(!(state.fighterStyle&&state.fighterCity&&state.fighterAvatar&&validFighterAllocation(state.fighterBaseStats)))screen='home';
    if(screen==='feed'&&!ensureSocialFeed())createSocialAccount();
    const changed=currentScreen!==screen;currentScreen=screen;$$('.screen').forEach(s=>s.classList.toggle('active',s.dataset.screen===screen));$$('.navbtn').forEach(b=>b.classList.toggle('active',b.dataset.nav===screen));if(changed)trackEvent('game_screen_view',{screen_name:screen});
    if(changed&&historyMode!=='none')writeHistory('screen',historyMode);
    if(screen==='feed')connectSharedSocial(true);else{clearTimeout(sharedSocialRefreshTimer);sharedSocialRefreshTimer=null}
    sfx.tap();updateUI();if(screen==='fight'&&state.nameLocked)queueMicrotask(()=>connectSharedSocial(true));const appScroll=$('.app-scroll');if(appScroll)appScroll.scrollTop=0;if(screen==='feed')$('#socialTimeline').scrollTop=0;
  }

  function initStickyDashboard(){
    const root=$('.app-scroll'),sentinel=$('.resource-hud-sentinel'),dashboard=$('.resource-hud');if(!root||!sentinel||!dashboard||!('IntersectionObserver' in window))return;
    const observer=new IntersectionObserver(entries=>{const entry=entries[0];dashboard.classList.toggle('is-stuck',!entry.isIntersecting&&root.scrollTop>0)},{root,threshold:0});observer.observe(sentinel);
  }

  function fightExitGuarded(){return !!(fight&&combatLocked&&!fight.ended&&state.pendingFight)}
  function openForfeitFightDialog(){const modal=$('#forfeitFightModal');modal.classList.add('open');modal.setAttribute('aria-hidden','false');$('#keepFightingBtn').focus()}
  function closeForfeitFightDialog(){const modal=$('#forfeitFightModal');modal.classList.remove('open');modal.setAttribute('aria-hidden','true')}
  function handleHistoryNavigation(event){
    if(fightExitGuarded()){writeHistory('fight','push');openForfeitFightDialog();return}
    if(fight?.ended&&$('#resultModal').style.display==='flex'){writeHistory('result','push');toast('FINISH THE FIGHT RESULT TO CONTINUE','#ffcf78');return}
    if(fight&&!combatLocked&&$('#fightOverlay').classList.contains('active'))closeFightPreview(true);
    const destination=event.state?.[HISTORY_KEY]?event.state.screen:null;if(destination)navTo(destination,'none');
  }
  function handleFightBeforeUnload(event){if(!fightExitGuarded())return;saveState();event.preventDefault();event.returnValue=''}

  function renderTrain(){
    ensureDailyCounters();
    const left=sessionsLeft('train',DAILY_TRAINING_LIMIT),sparringLeft=sessionsLeft('sparring',DAILY_SPARRING_LIMIT),coachAvailable=left>0,coach=state.trainerOn&&coachAvailable,fee=coachFee(),injury=currentTrainingInjury();
    $('#trainingResetClock').hidden=!injury&&(left>0||sparringLeft>0);
    const injuryBanner=$('#trainingInjuryBanner');injuryBanner.hidden=!injury;if(injury){$('#trainingInjuryIcon').textContent=injury.icon;$('#trainingInjuryName').textContent=injury.name.toUpperCase()}
    setLimitBadge('#trainLimitText',`${left} SESSION${left===1?'':'S'} LEFT`);
    const trainerToggle=$('#trainerToggle');trainerToggle.disabled=!coachAvailable;trainerToggle.classList.toggle('active',coach);trainerToggle.setAttribute('aria-checked',String(coach));trainerToggle.innerHTML=`<span class="switch-copy"><b>${coachAvailable?`COACH ${coach?'ON':'OFF'}`:'COACH UNAVAILABLE'}</b><small>${coachAvailable?`$${fee} / SESSION`:'NO SESSIONS LEFT'}</small></span><span class="switch-track" aria-hidden="true"><i class="switch-knob"></i></span>`;
    $('#trainActions').innerHTML=trainDefs.map((a,i)=>{const trainRepeat=state.dailyCounters.train,coachCost=coach?fee:0,cost=LOGIC.trainingCost(a,trainRepeat),gain=LOGIC.trainingGain(a.gain,coach,false,trainRepeat),locked=!!injury||state.energy<cost||state.cash<coachCost||left<1,status=injury?'<b>INJURED</b><small>TRAINING CLOSED UNTIL MIDNIGHT</small>':`<b>+${gain} ${a.stat.toUpperCase()}</b><small>${cost}% ENERGY${coach?` &middot; COACH $${coachCost}`:''}</small>`;return `<button class="action${injury?' injury-locked':''}" data-train="${i}" ${locked?'disabled':''}><div class="ico">${gameIcon(a.id,a.icon)}</div><div><h3>${a.title}</h3><p>${a.text}</p></div><div class="cost">${status}</div></button>`}).join('');
    setLimitBadge('#sparringLimitText',`${sparringLeft} SESSION${sparringLeft===1?'':'S'} LEFT`);
    $('#sparringActions').innerHTML=sparringDefs.map((a,i)=>{const quote=LOGIC.sparringQuote(state,a,sparringLeft),risk=a.damage?` &middot; ${a.damage[0]}&ndash;${a.damage[1]} HEALTH`:' &middot; NO HEALTH LOSS',locked=!!injury||!quote.ok,skillLabel=a.skills===4?`+${a.gain} ALL SKILLS`:`+${a.gain} RANDOM SKILL`,blocked=quote.reason==='energy'?`NEEDS ${quote.energyCost}% ENERGY`:quote.reason==='health'?`NEEDS MORE THAN ${quote.maximumHealthCost} HEALTH`:quote.reason==='limit'?'DAILY SPAR USED':'',status=injury?'<b>INJURED</b><small>SPARRING CLOSED UNTIL MIDNIGHT</small>':`<b>${skillLabel}</b><small>${blocked||`${quote.energyCost}% ENERGY${risk}`}</small>`;return `<button class="action sparring-${a.tier}${injury?' injury-locked':''}" data-sparring="${i}" ${locked?'disabled':''}><div class="ico">${gameIcon(a.asset||a.id,a.icon)}</div><div><h3>${a.title}</h3><p>${a.text}</p></div><div class="cost">${status}</div></button>`}).join('');
    const recoveryOptions=recoveryDefs.map((a,i)=>{const treatmentFee=recoveryFee(a),quote=LOGIC.recoveryQuote(state,a,treatmentFee);return {a,i,treatmentFee,quote}}),restOption=recoveryOptions.find(({a})=>a.freeRest),treatmentOptions=recoveryOptions.filter(({a})=>!a.freeRest),restAvailable=state.energy<state.maxEnergy,recoveryActionHtml=({a,i,treatmentFee,quote})=>{const gains=[a.energy?`+${a.energy}% ENERGY`:'',a.health?`+${a.health} HEALTH`:''].filter(Boolean).map(gain=>`<span class="recovery-gain">${gain}</span>`).join(''),status=a.freeRest?`FREE &middot; ${REST_DURATION_SECONDS} SECONDS`:quote.reason==='cash'?`NEED $${treatmentFee}`:quote.reason==='full'?'HEALTH FULL':`-$${treatmentFee}`;return `<button class="action${a.freeRest?' rest-action':''}" data-recovery="${i}" ${quote.ok?'':'disabled'}><div class="ico">${gameIcon(a.id,a.icon)}</div><div><h3>${a.title}</h3><p>${a.text}</p></div><div class="cost"><b class="recovery-gains">${gains}</b><small>${status}</small></div></button>`};
    $('#trainRestCard').hidden=!restAvailable;$('#restActions').innerHTML=restAvailable&&restOption?recoveryActionHtml(restOption):'';
    const treatmentFees=treatmentOptions.map(({treatmentFee})=>treatmentFee);setLimitBadge('#recoveryLimitText',`$${Math.min(...treatmentFees)}-$${Math.max(...treatmentFees)}`);
    $('#recoveryActions').innerHTML=treatmentOptions.map(recoveryActionHtml).join('');
    updateDailyResetClocks();
  }
  function opportunityUnlocked(a){return state.level>=a.minLevel&&state.fans>=a.minFans}
  function nextEndorsementOffer(){const id=LOGIC.nextEndorsementId(ENDORSEMENT_IDS,state.endorsementHistory);return endorsementDefs.find(d=>d.id===id)||null}
  function requirementText(a){
    const missing=[];
    if(state.level<a.minLevel)missing.push(`LVL ${a.minLevel}`);
    if(state.fans<a.minFans)missing.push(`${fmt(a.minFans)} FOLLOWERS`);
    return missing.length?`NEEDS ${missing.join(' + ')}`:'AVAILABLE NOW';
  }
  function renderHustle(){
    ensureDailyCounters();
    const fullTimeFighter=state.level>=5,blackjackUnlocked=state.level>=2,diceUnlocked=state.level>=4,racingUnlocked=state.level>=6,hustleLeft=sessionsLeft('hustle',2),blackjackLeft=sessionsLeft('blackjack',1),diceLeft=sessionsLeft('cageDice',1),racingLeft=sessionsLeft('horseRace',1),publicityLeft=sessionsLeft('publicity',1),blackjackActive=state.blackjackHand?.status==='playing',maxBlackjackBet=LOGIC.blackjackBetLimit(state.cash),maxDiceBet=LOGIC.cageDiceBetLimit(state.cash),maxHorseRaceBet=LOGIC.horseRaceBetLimit(state.cash);
    const activeDailyLimits=[...(!fullTimeFighter?[hustleLeft]:[]),...(blackjackUnlocked?[blackjackLeft]:[]),...(diceUnlocked?[diceLeft]:[]),...(racingUnlocked?[racingLeft]:[]),...(publicityDefs.some(opportunityUnlocked)?[publicityLeft]:[])];$('#hustleResetClock').hidden=!activeDailyLimits.length||activeDailyLimits.some(remaining=>remaining>0);
    $('#makeEndsMeetCard').hidden=fullTimeFighter;$('#fullTimeFighterNote').hidden=!fullTimeFighter;
    setLimitBadge('#hustleLimitText',`${hustleLeft} JOB${hustleLeft===1?'':'S'} LEFT`);
    const undergroundLeft=(blackjackUnlocked?blackjackLeft:0)+(diceUnlocked?diceLeft:0)+(racingUnlocked?racingLeft:0);setLimitBadge('#undergroundLimitText',`${undergroundLeft} PLAY${undergroundLeft===1?'':'S'} LEFT`);
    setLimitBadge('#publicityLimitText',`${publicityLeft} GIG${publicityLeft===1?'':'S'} LEFT`);
    $('#hustleActions').innerHTML=hustleDefs.map((a,i)=>`<button class="action" data-hustle="${i}" ${state.energy<=0||hustleLeft<1?'disabled':''}><div class="ico">${gameIcon(a.asset||a.id,a.icon,a.extension||'png')}</div><div><h3>${a.title}</h3><p>${a.text}</p></div><div class="cost"><b>${a.ratePerMile?`$${a.ratePerMile}/MILE`:`$${a.cash[0]}–${a.cash[1]}`}</b><small>UP TO ${a.cost}% ENERGY</small></div></button>`).join('');
    const blackjackPlayed=blackjackUnlocked&&!blackjackActive&&blackjackLeft<1,dicePlayed=diceUnlocked&&diceLeft<1,racingPlayed=racingUnlocked&&racingLeft<1,blackjackLocked=!blackjackUnlocked||blackjackPlayed||(!blackjackActive&&maxBlackjackBet<1),blackjackStatus=!blackjackUnlocked?'UNLOCKS AT LVL 2':blackjackActive?'HAND IN PROGRESS':blackjackPlayed?'PLAYED TODAY':maxBlackjackBet<1?'NEED $4 CASH':`MAX BET $${fmt(maxBlackjackBet)}`,diceLocked=!diceUnlocked||dicePlayed||maxDiceBet<1,diceStatus=!diceUnlocked?'UNLOCKS AT LVL 4':dicePlayed?'PLAYED TODAY':maxDiceBet<1?'NEED $4 CASH':`MAX BET $${fmt(maxDiceBet)}`,racingLocked=!racingUnlocked||(!state.horseRaceResult&&maxHorseRaceBet<1),racingStatus=!racingUnlocked?'UNLOCKS AT LVL 6':racingPlayed?'FINISHED TODAY':maxHorseRaceBet<1?'NEED $4 CASH':`MAX BET $${fmt(maxHorseRaceBet)}`;
    const racingCard=racingPlayed?`<div class="action future horse-race-action horse-race-complete gig-unavailable"><div class="ico">${gameIcon('horse-racing','🐎')}</div><div><h3>Underground Racing</h3><p>Study the racing odds, back one horse, and watch the field run for the wire.</p><span class="unlock-copy">${racingStatus}</span></div><div class="cost"><button class="horse-review-link" type="button" data-horse-race-open>REVIEW FINISH</button><small>ONE RACE DAILY</small></div></div>`:`<button class="action future horse-race-action ${racingUnlocked?'':'locked-opportunity'}" data-horse-race-open ${racingLocked?'disabled':''}><div class="ico">${gameIcon('horse-racing','🐎')}</div><div><h3>Underground Racing</h3><p>Study the racing odds, back one horse, and watch the field run for the wire.</p><span class="unlock-copy">${racingStatus}</span></div><div class="cost"><b>BET TO WIN</b><small>${racingUnlocked?'ONE RACE DAILY':'LEVEL 6'}</small></div></button>`;
    $('#undergroundActions').innerHTML=`<button class="action future blackjack-action ${blackjackUnlocked?'':'locked-opportunity'} ${blackjackPlayed?'gig-unavailable':''}" data-blackjack-open ${blackjackLocked?'disabled':''}><div class="ico">${gameIcon('blackjack','🂡')}</div><div><h3>Backroom Blackjack</h3><p>Play one real hand against the dealer. Wager up to 25% of your available cash.</p><span class="unlock-copy">${blackjackStatus}</span></div><div class="cost"><b>${blackjackActive?'RESUME HAND':blackjackPlayed?'PLAYED TODAY':'HIT OR STAND'}</b><small>${blackjackUnlocked?'ONE HAND DAILY':'LEVEL 2'}</small></div></button><button class="action future cage-dice-action ${diceUnlocked?'':'locked-opportunity'} ${dicePlayed?'gig-unavailable':''}" data-cage-dice-open ${diceLocked?'disabled':''}><div class="ico">${cageDiceIcon()}</div><div><h3>Cage Dice</h3><p>Pick under, over, seven, or doubles—then roll two dice against the house.</p><span class="unlock-copy">${diceStatus}</span></div><div class="cost"><b>${dicePlayed?'PLAYED TODAY':'PICK YOUR BET'}</b><small>${diceUnlocked?'ONE ROLL DAILY':'LEVEL 4'}</small></div></button>${racingCard}`;
    $('#publicityActions').innerHTML=publicityDefs.map((a,i)=>{
      const unlocked=opportunityUnlocked(a),limited=publicityLeft<1,energyLow=state.energy<=0;
      const unavailable=limited&&unlocked?'gig-unavailable':'',availability=!unlocked?requirementText(a):limited?'NO GIGS LEFT':energyLow?'0% ENERGY · REST REQUIRED':'AVAILABLE NOW';
      return `<button class="action future ${unlocked?'':'locked-opportunity'} ${unavailable}" data-publicity="${i}" ${!unlocked||limited||energyLow?'disabled':''}><div class="ico">${gameIcon(a.id,a.icon)}</div><div><h3>${a.title}</h3><p>${a.text}</p><span class="unlock-copy">${availability}</span></div><div class="cost"><b>${a.payout}</b><small>UP TO ${a.cost}% ENERGY</small></div></button>`;
    }).join('');
    const active=state.activeEndorsement?endorsementDefs.find(d=>d.id===state.activeEndorsement.id):null,nextOffer=nextEndorsementOffer(),history=new Set(Array.isArray(state.endorsementHistory)?state.endorsementHistory:[]);
    $('#activeEndorsement').innerHTML=active?`<div class="active-deal"><div class="deal-top"><b>${gameIcon(active.id,active.icon)} ${active.brand}</b><strong>${state.activeEndorsement.fightsLeft} FIGHTS LEFT</strong></div><p>+$${fmt(active.perFight)} and +${fmt(active.fansPerFight)} followers after every fight.</p></div>`:`<div class="deal-empty">NO ACTIVE SPONSOR · LEVEL UP TO UNLOCK CONTRACT OFFERS</div>`;
    $('#endorsementActions').innerHTML=endorsementDefs.map((d,i)=>{
      const qualified=state.level>=d.minLevel&&state.fans>=d.minFans,isActive=!!active&&active.id===d.id,isPast=history.has(d.id)&&!isActive,isNext=!!nextOffer&&nextOffer.id===d.id,unlocked=!active&&isNext&&qualified;
      const req=[];if(state.level<d.minLevel)req.push(`LVL ${d.minLevel}`);if(state.fans<d.minFans)req.push(`${fmt(d.minFans)} FOLLOWERS`);
      const status=isActive?'ACTIVE CONTRACT':isPast?'PREVIOUS PARTNER':active?'FINISH CURRENT DEAL':!isNext?`LOCKED · LAND ${nextOffer?nextOffer.brand.toUpperCase():'EVERY'} DEAL FIRST`:unlocked?'ONLY OFFER AVAILABLE':`NEEDS ${req.join(' + ')}`;
      return `<button class="action future endorsement-action ${unlocked?'':'locked-opportunity'} ${isActive?'active-contract':''}" data-endorsement="${i}" ${unlocked?'':'disabled'}><div class="ico">${gameIcon(d.id,d.icon)}</div><div><h3>${d.brand}</h3><p>${d.product}. ${d.fights}-fight deal with a $${fmt(d.signing)} signing bonus.</p><span class="unlock-copy">${status}</span></div><div class="cost"><b>+$${fmt(d.perFight)}/FIGHT</b><small>+${fmt(d.fansPerFight)} followers</small></div></button>`;
    }).join('');
  }
  function collectibleBackHtml(item,rarity){
    const sponsored=item.sponsored===true,sponsorName=sponsored?escapeHtml(item.brand||item.name):'',sponsorDescription=sponsored&&item.sponsorDescription?`<p>${escapeHtml(item.sponsorDescription)}</p>`:'',sponsorLabel=sponsored?'<span class="sponsored-collectible-label">SPONSORED COLLECTIBLE</span>':'',perk=sponsored?`<div class="collectible-perk"><small>IN-GAME PERK</small><b>${escapeHtml(item.desc)}</b></div>`:`<p>${escapeHtml(item.desc)}</p>`,qr=item.qrAsset?`<div class="collectible-qr"><img src="${escapeHtml(item.qrAsset)}" alt="${escapeHtml(item.brand||item.name)} campaign QR code"><small>SCAN OR SAVE</small>${item.sponsorDisclosure?`<em>${escapeHtml(item.sponsorDisclosure)}</em>`:''}${item.promoCode?`<b>CODE · ${escapeHtml(item.promoCode)}</b>`:''}${item.campaignEnds?`<span>ENDS ${escapeHtml(item.campaignEnds)}</span>`:''}</div>`:'';
    return `<div class="collectible-side collectible-back" aria-hidden="true"><div class="gear-top"><span class="rarity-tag">${rarity}</span><span class="gear-count">×${gearCount(item.id)}</span></div><div class="collectible-back-copy">${sponsorLabel}<h3>${sponsorName||escapeHtml(item.name)}</h3>${sponsorDescription}${perk}${qr}</div><div class="collectible-flip-hint">TAP TO RETURN</div></div>`;
  }
  function collectibleCardHtml(item,{dropStatus=''}={}){
    const equipped=state.equippedGear.includes(item.id),rarity=item.rarity||'COMMON',levelLocked=state.level<(item.minLevel||1),action=dropStatus?`<div class="gear-status">${escapeHtml(dropStatus)}</div>`:levelLocked?`<button class="equip-btn" type="button" disabled>LOCKED · LVL ${item.minLevel}</button>`:item.category==='Fight Gear'?`<button class="equip-btn" type="button" data-equip="${item.id}" aria-label="${equipped?'Unequip':'Equip'} ${escapeHtml(item.name)}">${equipped?'✓ EQUIPPED':'EQUIP'}</button>`:'<div class="gear-status">PERK ACTIVE</div>';
    return `<div class="gear collectible-card owned rarity-card-${rarity.toLowerCase()} ${equipped?'equipped':''} ${levelLocked?'level-locked':''} ${dropStatus?'drop-claim-card':''}" data-collectible-flip data-collectible-id="${item.id}" tabindex="0" aria-label="${escapeHtml(item.name)} collectible. Tap for details." aria-pressed="false"><div class="collectible-flip"><div class="collectible-side collectible-front" aria-hidden="false"><div class="gear-top"><span class="rarity-tag">${rarity}</span><span class="gear-count">×${gearCount(item.id)}</span></div><div class="gear-hero"><span class="gear-flair"></span><span class="equip-burst"></span><div class="gear-icon">${gameIcon(item.iconName||item.id,item.icon,item.assetExt)}</div></div><div class="gear-copy"><h3>${escapeHtml(item.name)}</h3></div><div class="gear-footer"><span class="level-tag">MIN LVL ${item.minLevel||1}</span>${action}</div></div>${collectibleBackHtml(item,rarity)}</div></div>`;
  }
  function renderGear(){
    const order=['Fight Gear','Bling','Lifestyle','Property & Rides'],owned=gearItems.filter(g=>gearCount(g.id)>0);
    const subtitles={'Fight Gear':'Equippable combat upgrades','Bling':'Passive follower bonuses','Lifestyle':'Passive recovery bonuses','Property & Rides':'Passive career bonuses'};
    if(!owned.length){$('#gearShop').innerHTML='<div class="gear-empty"><b>NO GEAR YET</b><span>Win fights to earn deterministic drops. Your fourth win without a drop is guaranteed to produce one.</span></div>';return}
    const loadoutLimit=LOGIC.gearLoadoutLimit(state.level),loadoutProgress=loadoutLimit<4?' · 4 SLOTS AT LVL 8':'';
    $('#gearShop').innerHTML=order.map(cat=>{const items=owned.filter(g=>g.category===cat);if(!items.length)return '';const status=cat==='Fight Gear'?`${state.equippedGear.length}/${loadoutLimit} EQUIPPED${loadoutProgress}`:`${items.length} COLLECTIBLE${items.length===1?'':'S'}`;return `<section class="shop-section" aria-labelledby="gear-${cat.replace(/[^a-z]+/gi,'-').toLowerCase()}"><div class="shop-head"><div><b id="gear-${cat.replace(/[^a-z]+/gi,'-').toLowerCase()}">${cat}</b><small>${subtitles[cat]}</small></div><span class="shop-status">${status}</span></div>${cat==='Fight Gear'?'<div class="loadout-note">One copy powers each perk. Duplicates do not stack.</div>':''}<div class="gear-grid">${items.map(g=>collectibleCardHtml(g)).join('')}</div></section>`}).join('');
  }
  function toggleCollectibleCard(card){if(!card)return;const flipped=!card.classList.contains('flipped'),name=card.querySelector('.collectible-front h3')?.textContent||'Collectible',front=card.querySelector('.collectible-front'),back=card.querySelector('.collectible-back'),button=front?.querySelector('button'),item=gearItems.find(entry=>entry.id===card.dataset.collectibleId);card.classList.toggle('flipped',flipped);card.setAttribute('aria-pressed',String(flipped));card.setAttribute('aria-label',`${name} collectible. ${flipped?'Details shown. Tap to return.':'Tap for details.'}`);front?.setAttribute('aria-hidden',String(flipped));back?.setAttribute('aria-hidden',String(!flipped));if(button)button.tabIndex=flipped?-1:0;if(flipped&&item)trackEvent('collectible_details_viewed',{gear_id:item.id,sponsored:item.sponsored===true,has_qr:!!item.qrAsset});sfx.tap()}
  function openLoadoutFullDialog(trigger){const modal=$('#loadoutFullModal'),limit=LOGIC.gearLoadoutLimit(state.level);loadoutDialogReturnFocus=trigger&&typeof trigger.focus==='function'?trigger:null;$('#loadoutFullKicker').textContent=`FIGHT GEAR · ${limit}/${limit} SLOTS`;$('#loadoutFullDescription').textContent=limit<4?'Your rookie loadout has two active slots. Unequip one item to make room, or reach Level 8 to unlock four slots.':'Unequip one Fight Gear item before equipping another. Duplicate items still count as one active perk.';modal.classList.add('open');modal.setAttribute('aria-hidden','false');sfx.lose();requestAnimationFrame(()=>$('#loadoutFullOk').focus())}
  function closeLoadoutFullDialog(){const modal=$('#loadoutFullModal');if(!modal.classList.contains('open'))return;modal.classList.remove('open');modal.setAttribute('aria-hidden','true');sfx.tap();const returnFocus=loadoutDialogReturnFocus;loadoutDialogReturnFocus=null;if(returnFocus&&returnFocus.isConnected)requestAnimationFrame(()=>returnFocus.focus())}
  function toggleEquip(id,trigger){const g=gearItems.find(x=>x.id===id);if(!g||g.category!=='Fight Gear'||!state.gear.includes(id))return;const at=state.equippedGear.indexOf(id);if(at>=0){state.equippedGear.splice(at,1);trackEvent('gear_unequipped',{gear_id:id,gear_rarity:g.rarity.toLowerCase()});sfx.tap();updateUI();return}if(state.equippedGear.length>=LOGIC.gearLoadoutLimit(state.level)){openLoadoutFullDialog(trigger);return}state.equippedGear.push(id);trackEvent('gear_equipped',{gear_id:id,gear_rarity:g.rarity.toLowerCase()});initAudio();sfx.crit();const card=trigger&&trigger.closest('.gear');if(card){card.classList.add('equip-bursting');trigger.textContent='EQUIPPED!';trigger.disabled=true;saveState();setTimeout(updateUI,680)}else updateUI()}
  function championshipRecord(wins,losses){return `${Math.max(0,Number(wins)||0)}-${Math.max(0,Number(losses)||0)}`}
  function renderFightChampionship(){
    const card=$('#worldTitleCard');if(!card)return;
    const landingStatus=landingFeature.status(),unavailable=landingStatus.championshipUnavailable===true||(sharedSocialStatus==='error'&&!sharedChampionship&&!landingStatus.championshipLoaded),loading=!sharedChampionship&&!unavailable&&!landingStatus.championshipLoaded,champ=sharedChampionship,opponent=championshipOpponent(),defenses=Math.max(0,Number(champ?.defenses)||0),championHandle=champ?.champion_handle?`@${escapeHtml(champ.champion_handle)}`:'—',championLevel=Math.max(1,Number(champ?.champion_level)||1),reset=championshipResetCopy(champ),fightsLeft=sessionsLeft('fight',DAILY_FIGHT_LIMIT);
    let status='loading',headline='CHECKING THE WORLD CHAMPION',message='Loading the current champion and your title status.',action='PLEASE WAIT',disabled=true,actionLabel='Championship information is loading',opponentHtml='',reign='';
    if(unavailable){status='unavailable';headline='CHAMPIONSHIP UPDATE UNAVAILABLE';message='Regular fights are still available.';action='TRY AGAIN';disabled=false;actionLabel='Retry championship update'}
    else if(champ?.is_champion){
      const wonAt=new Date(champ.won_at||'');reign=Number.isFinite(wonAt.getTime())?`CURRENT REIGN BEGAN ${wonAt.toLocaleDateString([],{month:'short',day:'numeric',year:'numeric'}).toUpperCase()}`:'';
      if(champ.defense_used_today){status='defended';headline='TITLE DEFENDED';message=`${defenses} SUCCESSFUL DEFENSE${defenses===1?'':'S'} · NEXT CHALLENGER AVAILABLE TOMORROW`;action=reset;actionLabel='Next title defense availability';}
      else if(!opponent){status='no-challenger';headline='YOU ARE THE WORLD CHAMPION';message=`${defenses} SUCCESSFUL DEFENSE${defenses===1?'':'S'} · NO ELIGIBLE CHALLENGER RIGHT NOW`;action='NO CHALLENGER AVAILABLE';actionLabel='No eligible title challenger';}
      else{status='defense';headline='YOU ARE THE WORLD CHAMPION';message=`${defenses} SUCCESSFUL DEFENSE${defenses===1?'':'S'}`;action=fightsLeft?'DEFEND YOUR TITLE':'DAILY FIGHT LIMIT REACHED';disabled=!fightsLeft;actionLabel=fightsLeft?`Defend the World Championship against @${opponent.networkHandle}`:'Daily fight limit reached';}
    }else if(champ?.champion_id){
      const rematch=champ.former_champion_rematch===true;
      if(champ.daily_bout_used){status=rematch?'rematch-waiting':'used';headline=rematch?'TITLE REMATCH AVAILABLE TOMORROW':'TITLE SHOT USED TODAY';message=rematch?'Your chance to reclaim the belt resets at midnight.':'Another title shot becomes available at midnight.';action=reset;actionLabel='Next World Championship fight availability';}
      else if(rematch&&opponent){status='rematch';headline='TITLE REMATCH AVAILABLE';message=`${championHandle} TOOK THE BELT`;action=fightsLeft?'RECLAIM YOUR TITLE':'DAILY FIGHT LIMIT REACHED';disabled=!fightsLeft;actionLabel=fightsLeft?`Reclaim the World Championship from ${championHandle}`:'Daily fight limit reached';}
      else if(champ.challenge_eligible&&opponent){status='eligible';headline='TITLE SHOT AVAILABLE';message=`CHAMPION ${championHandle} · LEVEL ${championLevel}`;action=fightsLeft?'CHALLENGE FOR THE BELT':'DAILY FIGHT LIMIT REACHED';disabled=!fightsLeft;actionLabel=fightsLeft?`Challenge ${championHandle} for the World Championship`:'Daily fight limit reached';}
      else{status='locked';headline='WORLD TITLE SHOT LOCKED';message=`Reach Level ${championLevel} to earn a shot at the reigning champion.`;action=`UNLOCKS AT LEVEL ${championLevel}`;actionLabel=`Unlocks at level ${championLevel}`;}
    }else if(!loading){status='vacant';headline='THE WORLD TITLE IS OPEN';message='Waiting for the next active champion.';action='CHECK BACK SOON';actionLabel='No current World Champion'}
    if(opponent&&!unavailable){const portrait=silhouetteForOpponent(opponent),championTag=champ?.is_champion?'SELECTED RANKED CHALLENGER':'REIGNING WORLD CHAMPION',location=networkOpponentLocation(opponent);opponentHtml=`<div class="championship-matchup" style="${fighterThemeStyle(opponent.networkCity)};${fighterPortraitStyle(opponent.networkHandle)}"><span class="championship-portrait"><img src="${portrait}" alt="${escapeHtml(opponent.name)} fighter portrait"><i class="fighter-city-badge">${fighterCityCode(opponent.networkCity)}</i></span><div class="championship-fighter-copy"><small>${championTag}</small><b>${escapeHtml(opponent.name)}</b><span>@${escapeHtml(opponent.networkHandle)} · PRO ${championshipRecord(opponent.wins,opponent.losses)} · LEVEL ${opponent.tier}</span><em>${escapeHtml(opponent.tag||'UNKNOWN STYLE')} · ${escapeHtml(location.name)} ${escapeHtml(location.region)}</em></div><div class="championship-tape-preview" aria-label="Tale of the Tape preview"><span>PWR <b>${formatStat(opponent.power)}</b></span><span>SPD <b>${formatStat(opponent.speed)}</b></span><span>CHN <b>${formatStat(opponent.chin)}</b></span><span>CAR <b>${formatStat(opponent.cardio)}</b></span></div></div>`}
    const resetAttribute=disabled&&champ?.cooldown_until?`data-championship-reset="${escapeHtml(champ.cooldown_until)}"`:'',actionHtml=unavailable?`<button class="championship-action retry" type="button" data-championship-retry aria-label="${actionLabel}">${action}</button>`:opponent&&!disabled?`<div class="championship-action-wrap"><button class="championship-action" type="button" data-championship-fight aria-label="${actionLabel}">${action}</button><small>1 TITLE FIGHT AVAILABLE TODAY · ${fightsLeft} TOTAL FIGHT${fightsLeft===1?'':'S'} LEFT</small></div>`:`<div class="championship-lock-status" role="status"><b ${resetAttribute}>${action}</b><span>${status==='locked'?'LEVEL UP TO ENTER THE TITLE PICTURE':actionLabel}</span></div>`;card.className=`card championship-hub career-after-setup ${status}`;card.innerHTML=`<div class="championship-heading"><span class="championship-icon">${gameIcon('title-world','👑')}</span><div><small>CAGE GRIND · ONE BELT</small><h2 id="worldTitleHeading">WORLD CHAMPIONSHIP</h2><b>${headline}</b>${message?`<p>${message}</p>`:''}${reign?`<em>${reign}</em>`:''}</div></div>${opponentHtml}${actionHtml}<details class="championship-rules"><summary>TITLE RULES</summary><p>Reach the champion’s level to earn a title shot. One World Championship fight is available per day. Win to take the belt; champions defend against one ranked challenger at a time.</p></details>`;
    const viewKey=`${status}|${champ?.champion_id||''}|${opponent?.sourceProfileId||''}`;if(viewKey!==championshipCardView){championshipCardView=viewKey;trackEvent('championship_card_viewed',{championship_state:status,has_challenger:!!opponent})}
  }
  function opponentHasHistory(o){return (Number(o?.meetings)||0)>0||(Number(o?.winsVsPlayer)||0)>0||(Number(o?.lossesToPlayer)||0)>0}
  function recommendedOpponentOrder(a,b){
    const rank=o=>{const available=opponentAvailable(o),xp=opponentXpTier(o);if(available&&xp.tier==='full'&&o.tier===state.level)return 0;if(available&&o.network&&Math.abs(o.tier-state.level)<=1)return 1;if(available&&opponentHasHistory(o))return 2;if(available)return 3;return 4};
    return rank(a)-rank(b)||Math.abs(a.tier-state.level)-Math.abs(b.tier-state.level)||Number(b.network)-Number(a.network)||fighterLevelOrder(a,b);
  }
  function filteredOpponents(){
    const filter=state.opponentFilter||'recommended',list=filter==='ranked'?opponents.filter(o=>o.network):filter==='rematches'?opponents.filter(opponentHasHistory):opponents.slice();return filter==='recommended'?list.sort(recommendedOpponentOrder):list.sort(fighterLevelOrder);
  }
  function renderOpponents(){
    renderFightChampionship();
    refreshOpponents();const fightsLeft=sessionsLeft('fight',DAILY_FIGHT_LIMIT),activeCount=opponents.filter(opponentAvailable).length,rankedCount=opponents.filter(o=>o.network).length,visibleOpponents=filteredOpponents();$('#fightResetClock').hidden=fightsLeft>0;setLimitBadge('#fightLimitText',`${fightsLeft} ${fightsLeft===1?'FIGHT':'FIGHTS'} LEFT`);$('#rosterSummary').textContent=`${activeCount} ACTIVE · ${rankedCount} RANKED`;$('#fightInjuryWarning').hidden=state.health>=state.maxHealth;document.querySelectorAll('[data-opponent-filter]').forEach(button=>{const selected=button.dataset.opponentFilter===state.opponentFilter;button.setAttribute('aria-pressed',String(selected));button.classList.toggle('active',selected)});
    const renderCard=o=>{
      const status=opponentGroup(o);
      const available=opponentAvailable(o);
      const dailyExhausted=fightsLeft<1&&available;
      const stars=clamp(Math.ceil((o.power+o.speed+o.chin+o.cardio)/18),1,5);
      const silhouette=silhouetteForOpponent(o);
      const fighterClass=o.network?'RANKED FIGHTER':'UNRANKED FIGHTER',frontClass=o.network?'RANKED':'UNRANKED';
      const hasHistory=opponentHasHistory(o),tauntable=status==='rival'&&!available,rivalFight=available&&(o.winsVsPlayer||0)>0,rivalry=o.meetings>=2,purse=payoutForOpponent(o),networkLocation=o.network?networkOpponentLocation(o):null,region=networkLocation?`${networkLocation.name} ${networkLocation.region}`:(o.country?`${o.country} CIRCUIT`:'CAGE CIRCUIT'),matchup=hasHistory?`${rivalry?'RIVAL · ':''}YOU ${o.lossesToPlayer||0}-${o.winsVsPlayer||0}`:'FIRST MEETING';
      const xpTier=opponentXpTier(o),xpSupport=xpTier.tier==='repeat'?'50% XP · SAME-DAY RUNBACK':xpTier.tier==='exhausted'?'NO XP · PAYOUT EXHAUSTED':xpTier.tier==='lower_level'?'NO XP · LOWER LEVEL':'FULL XP',matchupAction=hasHistory?'RUN IT BACK':'VIEW MATCHUP',restriction=dailyExhausted?'NEW FIGHTS AT LOCAL MIDNIGHT':status==='locked'?`LEVEL TOO HIGH · REQUIRES LEVEL ${o.tier}`:tauntable?'REMATCH REQUIRES A TAUNT':xpSupport,rematchLabel=hasHistory?(dailyExhausted?'REMATCH PAUSED · DAILY LIMIT':xpTier.tier==='exhausted'||xpTier.tier==='lower_level'?'REMATCH · NO XP':tauntable?'REMATCH LOCKED':'REMATCH AVAILABLE'):'FIRST MATCHUP';
      const action=tauntable?`<button class="fight-btn taunt" type="button" data-taunt-key="${o.key}">TAUNT</button>`:dailyExhausted?'<button class="fight-btn locked daily-limit" type="button" disabled>UNAVAILABLE</button>':status==='locked'?'<button class="fight-btn locked" type="button" disabled>LOCKED</button>':`<button class="fight-btn ${status}" type="button" data-fight-key="${o.key}" ${!available?'disabled':''}>${matchupAction}</button>`;
      const safeName=escapeHtml(o.name),safeStyle=escapeHtml(o.tag||'UNKNOWN STYLE');
      return `<article class="opponent ${status} ${o.network?'network':''} ${rivalFight?'rematch':''} ${dailyExhausted?'daily-exhausted':''}"${o.network?` style="--hometown-accent:${fighterAccent(o.networkCity)};${fighterPortraitStyle(o.networkHandle)}"`:''} data-card-flip="true" data-card-name="${safeName}" tabindex="0" aria-label="${safeName} fighter card${dailyExhausted?', daily fight limit reached':rivalFight?', rival fight available':tauntable?', taunt available':''}. Tap for details." aria-pressed="false">
        <div class="opponent-flip">
          <div class="opponent-side opponent-front" aria-hidden="false">
            <div class="opp-card-top"><span class="opp-badge">${frontClass}</span><span class="opp-record">PRO ${o.wins}-${o.losses}</span></div>
            <div class="opp-face">
              <img class="opp-sprite" src="${silhouette}" alt="${safeName} ${o.network?'portrait':'silhouette'}" loading="lazy">
              <span class="fighter-city-badge">${o.network?fighterCityCode(o.networkCity):escapeHtml(o.country||'CAGE')}</span>
              ${rivalFight?`<span class="rematch-banner">${gameIcon('rematch','⚡')} RIVAL FIGHT</span>`:''}
            </div>
            <div class="opp-title"><h3>${safeName}</h3><span class="opp-identity">LVL ${o.tier}<i>•</i><b>${safeStyle}</b></span></div>
            <div class="opp-match-status ${hasHistory?'rematch-status':''}">${rematchLabel}</div>
            <div class="opp-action-support">${restriction}</div>
            ${action}
          </div>
          <div class="opponent-side opponent-back" aria-hidden="true">
            <div class="opp-card-top"><span class="opp-back-kicker">FIGHTER DETAILS</span><span class="opp-record">PRO ${o.wins}-${o.losses}</span></div>
            <div class="opp-back-title"><h3>${safeName}</h3><span>${fighterClass}<i>•</i>${safeStyle}</span></div>
            <div class="opp-back-stats"><div class="opp-back-stat"><small>PWR</small><b>${formatStat(o.power)}</b></div><div class="opp-back-stat"><small>SPD</small><b>${formatStat(o.speed)}</b></div><div class="opp-back-stat"><small>CHN</small><b>${formatStat(o.chin)}</b></div><div class="opp-back-stat"><small>CAR</small><b>${formatStat(o.cardio)}</b></div></div>
            <div class="opp-back-rating stars" aria-label="${stars} of 5 difficulty">${'★'.repeat(stars)}${'☆'.repeat(5-stars)}</div>
            <dl class="opp-back-info"><div><dt>REGION</dt><dd>${escapeHtml(region)}</dd></div><div><dt>PURSE</dt><dd>$${fmt(purse)}</dd></div><div><dt>MATCHUP</dt><dd>${matchup}</dd></div></dl>
            <div class="flip-hint">TAP CARD TO RETURN</div>
          </div>
        </div>
      </article>`;
    };
    const emptyTitle=state.opponentFilter==='rematches'?'NO REMATCHES YET':state.opponentFilter==='ranked'?'NO RANKED FIGHTERS':'NO OPPONENTS AVAILABLE',emptyCopy=state.opponentFilter==='ranked'?'No ranked fighters are available right now.':state.opponentFilter==='rematches'?'Fight someone first to build a rematch list.':'Reconnect to load more fighters.';$('#opponentList').innerHTML=visibleOpponents.length?`<div class="opponent-grid career-opponent-grid">${visibleOpponents.map(renderCard).join('')}</div>`:`<div class="gear-empty"><b>${emptyTitle}</b><span>${emptyCopy}</span></div>`;
  }
  function toggleOpponentCard(card){if(!card)return;const flipped=!card.classList.contains('flipped'),name=card.dataset.cardName||'Fighter',front=card.querySelector('.opponent-front'),back=card.querySelector('.opponent-back'),button=front.querySelector('button');card.classList.toggle('flipped',flipped);card.setAttribute('aria-pressed',String(flipped));card.setAttribute('aria-label',`${name} fighter card. ${flipped?'Details shown. Tap to return.':'Tap for details.'}`);front.setAttribute('aria-hidden',String(flipped));back.setAttribute('aria-hidden',String(!flipped));if(button)button.tabIndex=flipped?-1:0;sfx.tap()}

  function drawHero(){
    const c=$('#heroCanvas');
    if(!c) return;
    const dpr=Math.min(2,devicePixelRatio||1),r=c.getBoundingClientRect();if(!r.width)return;c.width=r.width*dpr;c.height=r.height*dpr;const x=c.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,r.width,r.height);
    const W=r.width,H=r.height;
    x.save();x.globalAlpha=.28;for(let i=0;i<11;i++){x.strokeStyle=i%2?'#687079':'#1b1d20';x.lineWidth=1;x.beginPath();x.moveTo(i*52-120,0);x.lineTo(i*52+40,H);x.stroke();x.beginPath();x.moveTo(i*52+40,0);x.lineTo(i*52-120,H);x.stroke()}x.restore();
    // spotlight
    const g=x.createRadialGradient(W*.52,H*.35,10,W*.52,H*.35,H*.75);g.addColorStop(0,'rgba(255,210,120,.17)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,W,H);
    drawFighter(x,W*.57,H*.58,1.42,false,'#b82729','#1d2126');
    // cage foreground
    x.strokeStyle='rgba(220,225,230,.17)';x.lineWidth=2;for(let i=-H;i<W+H;i+=34){x.beginPath();x.moveTo(i,0);x.lineTo(i-H,H);x.stroke();x.beginPath();x.moveTo(i,0);x.lineTo(i+H,H);x.stroke()}
  }

  function drawFighter(x,cx,cy,s,flip,shorts='#b92d32',skin='#b88662',variant=0,pose={}){
    x.save();x.translate(cx,cy);x.scale(flip?-s:s,s);x.lineCap='round';x.lineJoin='round';
    const bob=pose.bob||0,lean=pose.lean||0,punch=pose.punch||0,kick=pose.kick||0,guard=pose.guard||0;
    x.rotate(lean);x.translate(0,bob);
    // shadow
    x.fillStyle='rgba(0,0,0,.55)';x.beginPath();x.ellipse(0,48,34,8,0,0,Math.PI*2);x.fill();
    // back leg
    x.strokeStyle='#1b1e23';x.lineWidth=14;x.beginPath();x.moveTo(6,14);x.lineTo(19,37);x.lineTo(12,53);x.stroke();
    // front leg / kick
    x.strokeStyle='#25292f';x.lineWidth=15;x.beginPath();x.moveTo(-7,15);if(kick>0){x.lineTo(-12,30);x.lineTo(-42-28*kick,21-12*kick)}else{x.lineTo(-17,38);x.lineTo(-28,54)}x.stroke();
    x.strokeStyle='#0d0f12';x.lineWidth=8;x.beginPath();x.moveTo(kick>0?-42-28*kick:-28,kick>0?21-12*kick:54);x.lineTo(kick>0?-55-28*kick:-36,kick>0?20-12*kick:55);x.stroke();
    // shorts
    x.fillStyle=shorts;x.beginPath();x.roundRect(-22,-2,44,28,6);x.fill();x.fillStyle='#0c0d0f';x.fillRect(-2,1,4,23);x.fillStyle='#ddd';x.fillRect(-20,2,40,3);
    // torso
    const body=x.createLinearGradient(-20,-60,24,5);body.addColorStop(0,'#d3a17a');body.addColorStop(1,skin);x.fillStyle=body;x.beginPath();x.moveTo(-23,-7);x.quadraticCurveTo(-26,-48,-13,-58);x.quadraticCurveTo(0,-67,15,-56);x.quadraticCurveTo(27,-39,22,-6);x.closePath();x.fill();
    // abdomen scratches
    x.strokeStyle='rgba(75,25,20,.28)';x.lineWidth=1;for(let i=0;i<3;i++){x.beginPath();x.moveTo(-12,-18+i*6);x.lineTo(10,-17+i*6);x.stroke()}
    // head
    x.fillStyle=skin;x.beginPath();x.ellipse(0,-72,14,17,0,0,Math.PI*2);x.fill();
    // hair
    x.fillStyle='#111';x.beginPath();x.arc(0,-78,14,Math.PI,Math.PI*2);x.lineTo(14,-74);x.lineTo(-14,-74);x.fill();
    if(variant%3===0){x.fillStyle='#25150f';x.beginPath();x.arc(0,-68,11,0,Math.PI);x.fill()}
    // eye
    x.fillStyle='#111';x.fillRect(7,-74,4,2);
    // arms
    x.strokeStyle=skin;x.lineWidth=12;
    x.beginPath();x.moveTo(-17,-45);x.lineTo(-30,-23);x.lineTo(-23-8*guard,-5-22*guard);x.stroke();
    x.beginPath();x.moveTo(17,-45);if(punch>0){x.lineTo(28+20*punch,-36);x.lineTo(48+42*punch,-38)}else{x.lineTo(30,-24);x.lineTo(23+10*guard,-7-23*guard)}x.stroke();
    // gloves
    x.fillStyle='#181a1d';x.beginPath();x.arc(-23-8*guard,-5-22*guard,8,0,Math.PI*2);x.fill();x.beginPath();x.arc(punch>0?48+42*punch:23+10*guard,punch>0?-38:-7-23*guard,8.5,0,Math.PI*2);x.fill();
    // highlights
    x.strokeStyle='rgba(255,255,255,.16)';x.lineWidth=2;x.beginPath();x.moveTo(-12,-54);x.lineTo(-18,-24);x.stroke();
    x.restore();
  }

  function handleTrain(i){
    ensureDailyCounters();const a=trainDefs[i],coach=state.trainerOn;if(!a)return;if(currentTrainingInjury()){toast('Training is closed until your injury heals at midnight.','#ff6875');return}const repeatCount=state.dailyCounters.train;const action={...a,cost:LOGIC.trainingCost(a,repeatCount)};const quote=LOGIC.trainingQuote(state,action,coach,coachFee(),sessionsLeft('train',DAILY_TRAINING_LIMIT));
    if(quote.reason==='limit'){toast('No training sessions left today.','#ff766d');return}
    if(quote.reason==='cash'){toast(`Coach Scrapps costs $${quote.cashCost}. Pick up an odd job first.`,'#ffcc75');return}
    if(quote.reason==='energy'){toast(`Training requires ${quote.energyCost}% Energy.`,'#ff766d');return}
    const energySpent=spendEnergy(quote.energyCost);if(!energySpent)return;initAudio();state.cash-=quote.cashCost;state.dailyCounters.train+=quote.sessions;
    const perfect=Math.random()<LOGIC.trainingPerfectChance(coach),gain=LOGIC.trainingGain(a.gain,coach,perfect,repeatCount);
    const gainText=formatGain(gain);state.stats[a.stat]+=gain;sfx.train();shake(false);toast(perfect?`PERFECT SESSION! +${gainText} ${a.stat.toUpperCase()}`:`+${gainText} ${a.stat.toUpperCase()}`,perfect?'#f4c34a':'#77d13e');
    trackEvent('training_completed',{training_id:a.id,training_type:'gym',coach_used:coach,perfect_session:perfect,repeated_session:repeatCount>0,injury_id:'none',energy_spent:energySpent,cash_spent:quote.cashCost,stat_gain:gain,risk_bonus:0,sessions_used:quote.sessions});updateUI();
  }
  function modalMeterSummary(label,value,detail=''){
    const rewardLabel=item=>item.includes('FOLLOWER')?'NEW FOLLOWERS':item.includes('ENERGY')?(item.startsWith('-')?'ENERGY SPENT':'ENERGY RESTORED'):item.includes('HEALTH')?(item.includes('LOST')?'HEALTH LOST':'HEALTH RESTORED'):item.includes('POWER')?'POWER GAIN':item.includes('SPEED')?'SPEED GAIN':item.includes('CHIN')?'CHIN GAIN':item.includes('CARDIO')?'CARDIO GAIN':item.includes('$')?(item.startsWith('-')?'CASH SPENT':'CASH EARNED'):'RESULT';
    const items=String(value).split(' · ').filter(Boolean);
    const tiles=items.map(item=>`<span class="meter-reward-tile"><em>${rewardLabel(item)}</em><strong>${item}</strong></span>`).join('');
    return `<div class="cost-reward"><small>${label}</small><b>${value}</b><div class="meter-reward-grid" aria-hidden="true">${tiles}</div>${detail?`<span>${detail}</span>`:''}</div>`;
  }
  function handleSparring(i){
    ensureDailyCounters();const a=sparringDefs[i];if(!a||activeSparringSession)return;if(currentTrainingInjury()){toast('Sparring is closed until your injury heals at midnight.','#ff6875');return}const quote=LOGIC.sparringQuote(state,a,sessionsLeft('sparring',DAILY_SPARRING_LIMIT));
    if(quote.reason==='limit'){toast('No sparring sessions left today.','#ff766d');return}
    if(quote.reason==='energy'){toast(`${a.title} requires ${quote.energyCost}% Energy.`,'#ff766d');return}
    if(quote.reason==='health'){toast(`${a.title} requires more than ${quote.maximumHealthCost} Health.`,'#ff766d');return}
    initAudio();state.energy=clamp(state.energy-quote.energyCost,0,state.maxEnergy);state.dailyCounters.sparring+=quote.sessions;
    const skills=a.skills===4?['power','speed','chin','cardio']:['power','speed','chin','cardio'].sort(()=>Math.random()-.5).slice(0,a.skills),gain=a.gain,gainText=formatGain(gain),damage=a.damage?rint(...a.damage):0;skills.forEach(k=>state.stats[k]+=gain);if(damage)state.health=clamp(state.health-damage,1,state.maxHealth);activeSparringSession={action:a,skills,gainText,damage,energyCost:quote.energyCost};trackEvent('training_completed',{training_id:a.id,training_type:'sparring',coach_used:false,perfect_session:false,repeated_session:false,injury_id:'none',energy_spent:quote.energyCost,cash_spent:0,stat_gain:gain,risk_bonus:0,skills_improved:a.skills,health_lost:damage,sessions_used:quote.sessions});openSparringSession();
  }
  function openSparringSession(){
    const session=activeSparringSession;if(!session)return;const {action,energyCost,damage}=session,modal=$('#sparringSessionModal'),meter=$('#sparringSessionMeter'),seconds=Math.max(0,Number(action.meterSeconds)||2),duration=seconds*1000,costText=`-${energyCost}% ENERGY${damage?` · -${damage} HEALTH`:''}`;$('#sparringSessionKicker').textContent='SPARRING IN PROGRESS';$('#sparringSessionTitle').textContent=action.title.toUpperCase();$('#sparringSessionStatus').textContent=`Live rounds in progress · ${seconds} seconds`;$('#sparringSessionResult').innerHTML=modalMeterSummary('COST',costText,'SESSION IN PROGRESS');$('#collectSparringResult').hidden=true;meter.classList.remove('working');meter.style.setProperty('--modal-meter-duration',`${seconds}s`);meter.setAttribute('aria-valuenow','0');modal.classList.add('open');modal.setAttribute('aria-hidden','false');updateUI();void meter.offsetWidth;requestAnimationFrame(()=>meter.classList.add('working'));sparringSessionTimer=setTimeout(resolveSparringSession,duration);
  }
  function resolveSparringSession(){
    sparringSessionTimer=null;if(!activeSparringSession)return;const {action,skills,gainText,damage}=activeSparringSession,rewardLabel=skills.length===4?'ALL-SKILL REWARD':'RANDOM SKILL REWARD',rewards=skills.map(skill=>`${skill.toUpperCase()} +${gainText}`).join(' · '),details=[rewardLabel,damage?`${damage} HEALTH LOST`:'NO HEALTH LOST'].join(' · ');$('#sparringSessionKicker').textContent='SPARRING COMPLETE';$('#sparringSessionTitle').textContent=`${action.title.toUpperCase()} FINISHED.`;const sessionsRemaining=sessionsLeft('sparring',DAILY_SPARRING_LIMIT);$('#sparringSessionStatus').textContent=`${sessionsRemaining} session${sessionsRemaining===1?'':'s'} left today.`;$('#sparringSessionMeter').setAttribute('aria-valuenow','100');$('#sparringSessionResult').innerHTML=modalMeterSummary('REWARD',rewards,details);$('#collectSparringResult').hidden=false;sfx.train();if(skills.length>1)vibrate([24,18,35]);flashTrainingStats(skills);toast(`${rewardLabel} · ${rewards}`,'#77d13e','','',3200);requestAnimationFrame(()=>$('#collectSparringResult').focus());
  }
  function closeSparringSession(){if(sparringSessionTimer||!activeSparringSession)return;activeSparringSession=null;const modal=$('#sparringSessionModal');modal.classList.remove('open');modal.setAttribute('aria-hidden','true');sfx.tap()}
  function handleRecovery(i){
    ensureDailyCounters();const treatment=recoveryDefs[i];if(!treatment||activeRecoverySession)return;const fee=recoveryFee(treatment),quote=LOGIC.recoveryQuote(state,treatment,fee);
    if(quote.reason==='cash'){toast(`Recovery treatment costs $${fee}. Pick up an odd job first.`,'#ffcc75');return}
    if(quote.reason==='full'){toast(treatment.freeRest?'Your Energy battery is already full.':'Your health is already full.','#78dfff');return}
    state.cash-=quote.cashCost;const restored=treatment.freeRest?null:LOGIC.applyRecovery(state,treatment);initAudio();activeRecoverySession={treatment,cashCost:quote.cashCost,restored};openRecoverySession();
  }
  function openRecoverySession(){
    const session=activeRecoverySession;if(!session)return;const {treatment,cashCost}=session,modal=$('#recoverySessionModal'),meter=$('#recoverySessionMeter'),seconds=treatment.freeRest?REST_DURATION_SECONDS:Math.max(0,Number(treatment.meterSeconds)||2),duration=seconds*1000;$('#recoverySessionKicker').textContent=treatment.freeRest?'RESTING':'RECOVERY IN PROGRESS';$('#recoverySessionTitle').textContent=treatment.title.toUpperCase();$('#recoverySessionStatus').textContent=`${treatment.freeRest?'Rest':'Treatment'} in progress · ${seconds} seconds`;$('#recoverySessionResult').innerHTML=modalMeterSummary(treatment.freeRest?'RECOVERY':'COST',treatment.freeRest?`+${REST_ENERGY_GAIN}% ENERGY`:`-$${cashCost}`,treatment.freeRest?'ONE BATTERY SEGMENT':'TREATMENT IN PROGRESS');$('#collectRecoveryResult').hidden=true;$('#exitRecoveryResult').hidden=true;$('#recoverySessionActions').classList.add('single-action');meter.classList.remove('working');meter.style.setProperty('--modal-meter-duration',`${seconds}s`);meter.setAttribute('aria-valuenow','0');modal.classList.add('open');modal.setAttribute('aria-hidden','false');updateUI();void meter.offsetWidth;requestAnimationFrame(()=>meter.classList.add('working'));recoverySessionTimer=setTimeout(resolveRecoverySession,duration);
  }
  function resolveRecoverySession(){
    recoverySessionTimer=null;if(!activeRecoverySession)return;const {treatment,cashCost}=activeRecoverySession,restored=activeRecoverySession.restored||LOGIC.applyRecovery(state,treatment);activeRecoverySession.restored=restored;trackEvent('recovery_completed',{treatment_id:treatment.id,cash_spent:cashCost,energy_restored:Math.round(restored.energy),health_restored:Math.round(restored.health)});const rewards=[restored.energy?`ENERGY +${formatGain(restored.energy)}%`:'',restored.health?`HEALTH +${formatGain(restored.health)}`:''].filter(Boolean),rewardText=rewards.join(' · '),canRestAgain=treatment.freeRest&&state.energy<state.maxEnergy;$('#recoverySessionKicker').textContent=treatment.freeRest?'REST COMPLETE':'RECOVERY COMPLETE';$('#recoverySessionTitle').textContent=`${treatment.title.toUpperCase()} FINISHED.`;$('#recoverySessionStatus').textContent=treatment.freeRest?(canRestAgain?'One segment restored. Rest again or exit when ready.':'Battery fully charged.'):'Treatment collected.';$('#recoverySessionMeter').setAttribute('aria-valuenow','100');$('#recoverySessionResult').innerHTML=modalMeterSummary('REWARD',rewardText,treatment.freeRest?'BATTERY RECHARGED':'HEALTH RESTORED');const collect=$('#collectRecoveryResult'),exit=$('#exitRecoveryResult'),actions=$('#recoverySessionActions');collect.textContent=canRestAgain?'REST AGAIN · +25%':'BACK TO TRAINING';collect.hidden=treatment.freeRest&&!canRestAgain;exit.hidden=!treatment.freeRest;actions.classList.toggle('single-action',!canRestAgain);sfx.train();flashRecoveryResources(restored);toast(`RECOVERY REWARD · ${rewardText}`,'#78dcff','','',3200);updateUI();requestAnimationFrame(()=>(canRestAgain?collect:exit.hidden?collect:exit).focus());
  }
  function closeRecoverySession(){if(recoverySessionTimer||!activeRecoverySession)return;activeRecoverySession=null;const modal=$('#recoverySessionModal');modal.classList.remove('open');modal.setAttribute('aria-hidden','true');sfx.tap()}
  function resolveHustleShift(){
    hustleShiftTimer=null;if(!activeHustleShift)return;const {action,totalCash,payDetail,bonusText}=activeHustleShift,result=$('#hustleShiftResult'),jobsLeft=sessionsLeft('hustle',2),detail=[payDetail,bonusText||'JOB COMPLETE · NO BONUS THIS TIME'].filter(Boolean).join(' · ');$('#hustleShiftKicker').textContent='HUSTLE COMPLETE';$('#hustleShiftTitle').textContent=`${action.title.toUpperCase()} FINISHED.`;$('#hustleShiftStatus').textContent=`${jobsLeft} job${jobsLeft===1?'':'s'} left today.`;$('#hustleShiftMeter').setAttribute('aria-valuenow','100');result.innerHTML=modalMeterSummary('REWARD',`+$${totalCash} CASH`,detail);$('#collectHustleShift').hidden=false;sfx.coin();requestAnimationFrame(()=>$('#collectHustleShift').focus());
  }
  function closeHustleShift(){if(hustleShiftTimer||!activeHustleShift)return;activeHustleShift=null;const modal=$('#hustleShiftModal');modal.classList.remove('open');modal.setAttribute('aria-hidden','true');sfx.tap()}
  function handleHustle(i){
    ensureDailyCounters();if(activeHustleShift)return;if(state.level>=5){toast('ODD JOBS END AT LEVEL 5 · YOU ARE A FULL-TIME FIGHTER','#78dfff');return}if(sessionsLeft('hustle',2)<1){toast('No odd jobs left today.','#ff766d');return}const a=hustleDefs[i];if(!a)return;const energySpent=spendEnergy(a.cost);if(!energySpent)return;initAudio();state.dailyCounters.hustle++;const miles=a.miles?rint(...a.miles):0,cash=miles?miles*a.ratePerMile:rint(...a.cash),payDetail=miles?`${miles} MILES × $${a.ratePerMile} PER MILE`:'',bonus=LOGIC.hustleBonus(a.id,Math.random(),Math.random());receiveMoney(cash);let bonusText='',bonusCash=0,powerBonus=0,hypeBonus=0,energyBonus=0;if(bonus.type==='cash'){bonusCash=bonus.amount;receiveMoney(bonusCash);bonusText=`LUCKY FIND · +$${bonusCash} SPARE CHANGE`}if(bonus.type==='power'){powerBonus=bonus.amount;state.stats.power+=powerBonus;bonusText='EXTRA-HEAVY FREIGHT · +1 POWER'}if(bonus.type==='hype'){const before=state.hype;state.hype=clamp(state.hype+bonus.amount,0,100);hypeBonus=state.hype-before;bonusText=hypeBonus?`RECOGNIZED AT THE DOOR · +${hypeBonus}% HYPE`:'RECOGNIZED AT THE DOOR · HYPE ALREADY MAXED'}if(bonus.type==='energy'){const before=state.energy;state.energy=clamp(state.energy+bonus.amount,0,state.maxEnergy);energyBonus=state.energy-before;bonusText=`RESTED BETWEEN FARES · +${energyBonus} ENERGY`}const totalCash=cash+bonusCash,seconds=Math.max(0,Number(a.meterSeconds)||2),duration=seconds*1000;activeHustleShift={action:a,totalCash,payDetail,bonusText};trackEvent('hustle_completed',{hustle_id:a.id,cash_earned:totalCash,base_cash:cash,bonus_cash:bonusCash,power_bonus:powerBonus,hype_bonus:hypeBonus,energy_bonus:energyBonus,miles_driven:miles,rate_per_mile:a.ratePerMile||0,energy_spent:energySpent});const modal=$('#hustleShiftModal'),meter=$('#hustleShiftMeter');$('#hustleShiftKicker').textContent='HUSTLE IN PROGRESS';$('#hustleShiftTitle').textContent=a.title.toUpperCase();$('#hustleShiftStatus').textContent=miles?`Driving ${miles} miles... stay sharp and finish the route.`:'Working... keep your head down and finish the job.';$('#hustleShiftResult').innerHTML=modalMeterSummary('COST',`-${energySpent} ENERGY`,'SHIFT IN PROGRESS');$('#collectHustleShift').hidden=true;meter.classList.remove('working');meter.style.setProperty('--modal-meter-duration',`${seconds}s`);meter.setAttribute('aria-valuenow','0');modal.classList.add('open');modal.setAttribute('aria-hidden','false');updateUI();void meter.offsetWidth;requestAnimationFrame(()=>meter.classList.add('working'));hustleShiftTimer=setTimeout(resolveHustleShift,duration);
  }
  function handlePublicity(i){
    ensureDailyCounters();const a=publicityDefs[i];if(!a||activePublicitySession)return;
    if(!opportunityUnlocked(a)){toast(requirementText(a),'#75cfff');return}
    if(sessionsLeft('publicity',1)<1){toast('No publicity gigs left today.','#ff766d');return}
    if(a.autograph){openAutographModal();return}
    const energySpent=spendEnergy(a.cost);if(!energySpent)return;
    initAudio();state.dailyCounters.publicity++;
    let cash=rint(...a.cash),fans=rint(...a.fans),viral=false;
    if(a.viral&&Math.random()<a.viral){cash=Math.round(cash*1.65);fans=Math.round(fans*2.2);viral=true}
    receiveMoney(cash,true);fans=changeFollowers(fans);
    trackEvent('publicity_completed',{publicity_id:a.id,outcome:viral?'viral':'success',cash_earned:cash,followers_gained:fans,energy_spent:energySpent});
    activePublicitySession={action:a,energySpent,rewardText:`+$${fmt(cash)} · +${fmt(fans)} FOLLOWERS`,detail:viral?'THE CLIP WENT VIRAL':'APPEARANCE COMPLETE',toastText:viral?`THE CLIP WENT VIRAL! +$${fmt(cash)} · +${fmt(fans)} followers`:`+$${fmt(cash)} · +${fmt(fans)} followers`,viral};openPublicitySession();
  }
  function openPublicitySession(){
    const session=activePublicitySession;if(!session)return;const {action,energySpent}=session,modal=$('#publicitySessionModal'),meter=$('#publicitySessionMeter'),seconds=Math.max(0,Number(action.meterSeconds)||2),duration=seconds*1000;$('#publicitySessionKicker').textContent='SPOTLIGHT IN PROGRESS';$('#publicitySessionTitle').textContent=action.title.toUpperCase();$('#publicitySessionStatus').textContent=action.text;$('#publicitySessionResult').innerHTML=modalMeterSummary('COST',`-${energySpent} ENERGY`,'SPOTLIGHT IN PROGRESS');$('#collectPublicityResult').hidden=true;meter.classList.remove('working');meter.style.setProperty('--modal-meter-duration',`${seconds}s`);meter.setAttribute('aria-valuenow','0');modal.classList.add('open');modal.setAttribute('aria-hidden','false');updateUI();void meter.offsetWidth;requestAnimationFrame(()=>meter.classList.add('working'));publicitySessionTimer=setTimeout(resolvePublicitySession,duration);
  }
  function resolvePublicitySession(){
    publicitySessionTimer=null;if(!activePublicitySession)return;const {action,rewardText,detail,toastText,viral}=activePublicitySession;$('#publicitySessionKicker').textContent='SPOTLIGHT COMPLETE';$('#publicitySessionTitle').textContent=`${action.title.toUpperCase()} FINISHED.`;$('#publicitySessionStatus').textContent='Results are in.';$('#publicitySessionMeter').setAttribute('aria-valuenow','100');$('#publicitySessionResult').innerHTML=modalMeterSummary('REWARD',rewardText,detail);$('#collectPublicityResult').hidden=false;if(viral){confettiBurst();sfx.win()}else sfx.coin();toast(toastText,viral?'#6ed7ff':'#77d13e','','',3200);requestAnimationFrame(()=>$('#collectPublicityResult').focus());
  }
  function closePublicitySession(){if(publicitySessionTimer||!activePublicitySession)return;activePublicitySession=null;const modal=$('#publicitySessionModal');modal.classList.remove('open');modal.setAttribute('aria-hidden','true');sfx.tap()}
  function openAutographModal(){
    const a=publicityDefs.find(x=>x.autograph);if(!a||!opportunityUnlocked(a)){toast(requirementText(a),'#75cfff');return}
    if(sessionsLeft('publicity',1)<1){toast('No publicity gigs left today.','#ff766d');return}
    const slider=$('#autographPrice');slider.value=state.lastAutographPrice||0;
    $('#autographResult').classList.remove('show');$('#autographResult').innerHTML='';
    $('#autographRun').style.display='block';$('#autographRun').disabled=state.energy<=0;
    $('#autographCancel').textContent='CANCEL';updateAutographAdvice();
    $('#autographModal').classList.add('open');$('#autographModal').setAttribute('aria-hidden','false');sfx.tap();
  }
  function closeAutographModal(){
    $('#autographModal').classList.remove('open');$('#autographModal').setAttribute('aria-hidden','true');
  }
  function updateAutographAdvice(){
    const price=Number($('#autographPrice').value)||0;$('#autographPriceText').textContent='$'+price;
    const box=$('#autographAdvice');box.className='pricing-advice';
    if(price===0){box.classList.add('good');box.textContent='Free signings build the most goodwill and followers, but pay nothing.'}
    else if(price<=12){box.classList.add('good');box.textContent='Accessible pricing. Expect a long line, decent income, and positive buzz.'}
    else if(price<=25){box.classList.add('risky');box.textContent='Premium but believable. Fewer signatures, better money per follower.'}
    else if(price<=35){box.classList.add('risky');box.textContent='Expensive. The line will shrink and follower growth may disappear.'}
    else{box.classList.add('danger');box.textContent='Danger zone. You may make money, but people could call you greedy and unfollow.'}
  }
  function runAutographSigning(){
    const a=publicityDefs.find(x=>x.autograph);if(!a||sessionsLeft('publicity',1)<1)return;
    const price=clamp(Number($('#autographPrice').value)||0,0,50);state.lastAutographPrice=price;
    const energySpent=spendEnergy(a.cost);if(!energySpent)return;
    initAudio();state.dailyCounters.publicity++;
    const base=Math.max(35,Math.round(state.fans*rand(.11,.17)+state.level*12));
    const resistance=price===0?1.18:clamp(1-price/62,.12,1);
    const signatures=Math.max(5,Math.round(base*resistance*rand(.82,1.18)));
    const cash=signatures*price;
    let fanChange=0;
    if(price===0)fanChange=Math.round(signatures*rand(.55,.82));
    else if(price<=12)fanChange=Math.round(signatures*rand(.18,.32));
    else if(price<=25)fanChange=Math.round(signatures*rand(.03,.12));
    else if(price<=35)fanChange=Math.round(signatures*rand(-.04,.04));
    else fanChange=-Math.max(4,Math.round((price-34)*rand(.5,1.3)+state.fans*rand(.004,.012)));
    receiveMoney(cash,true);fanChange=changeFollowers(fanChange);
    const fanText=fanChange>=0?`+${fmt(fanChange)} followers`:`-${fmt(Math.abs(fanChange))} followers`;
    const outcome=price===0?'PACKED LINE · STRONG GOODWILL':price>35?'HIGH PRICE · FOLLOWER BACKLASH':'PRICE SHAPED TURNOUT';
    trackEvent('publicity_completed',{publicity_id:a.id,autograph_price:price,signatures,cash_earned:cash,followers_gained:fanChange,energy_spent:energySpent});
    closeAutographModal();activePublicitySession={action:a,energySpent,rewardText:`+$${fmt(cash)} · ${fanText.toUpperCase()}`,detail:`${fmt(signatures)} AUTOGRAPHS SIGNED · ${outcome}`,toastText:`${fmt(signatures)} AUTOGRAPHS · +$${fmt(cash)} · ${fanText}`,viral:price===0};saveState();openPublicitySession();
  }
  function handleEndorsement(i){
    const d=endorsementDefs[i];if(!d)return;
    if(state.activeEndorsement){toast('Finish your current endorsement first.','#ffcf78');return}
    const nextOffer=nextEndorsementOffer();if(!nextOffer){toast('Every endorsement tier is complete.','#6ed7ff');return}if(d.id!==nextOffer.id){toast(`${nextOffer.brand} is the only offer on the table. Land that deal first.`,'#ffcf78');return}
    if(state.level<d.minLevel||state.fans<d.minFans){toast(`Needs LVL ${d.minLevel} and ${fmt(d.minFans)} followers`,'#75cfff');return}
    initAudio();const history=Array.isArray(state.endorsementHistory)?state.endorsementHistory:[];state.activeEndorsement={id:d.id,fightsLeft:d.fights};state.endorsementHistory=[...new Set([...history,d.id])];receiveMoney(d.signing,true);changeFollowers(Math.round(d.fansPerFight*.5));trackEvent('endorsement_signed',{endorsement_id:d.id,signing_bonus:d.signing,contract_fights:d.fights});saveState();publishSponsorSigning(d);sfx.win();confettiBurst();toast(`${d.brand} SIGNED! +$${fmt(d.signing)}`,'#6ed7ff');updateUI();
  }
  const undergroundBuzzFeature=globalThis.CAGE_UNDERGROUND_BUZZ.createUndergroundBuzzFeature({$,$$,getState:()=>state,ensureDailyCounters,sessionsLeft,LOGIC,fmt,initAudio,sfx,trackEvent,saveState,updateUI,confettiBurst,toast,shake,rint,todayKey,clamp,hashSeed,horseRaceProfiles,escapeHtml});
  async function requestGameInstall(){
    const pwa=globalThis.CAGE_PWA;if(!pwa){toast('USE YOUR BROWSER MENU TO INSTALL CAGE GRIND','#78dfff');return}
    const result=await pwa.requestInstall();trackEvent('install_prompt_result',{outcome:result.status});
    if(result.status==='accepted'){toast('INSTALLING · YOUR FREE DROP UNLOCKS WHEN COMPLETE','#77d13e');return}
    if(result.status==='dismissed'){toast('INSTALL CANCELLED · YOUR FREE DROP IS STILL WAITING','#ffcf78');return}
    if(result.status==='installed'){state.installDetected=true;updateUI();return}
    const ios=/iPad|iPhone|iPod/i.test(navigator.userAgent);toast(ios?'ON IOS: SHARE → ADD TO HOME SCREEN':'USE THE BROWSER MENU → INSTALL CAGE GRIND','#78dfff');
  }
  function maybeGrantInstallReward(){
    const ready=!!(state.fighterStyle&&state.fighterCity&&state.fighterAvatar&&validFighterAllocation(state.fighterBaseStats));if(!ready||state.lastDaily!==todayKey()||!state.installDetected||state.installRewardClaimed||pendingResultDrop||fight||combatLocked||$('#resultModal').style.display==='flex'||$('#dropClaimModal').classList.contains('open')||$('#levelUpModal').classList.contains('active'))return;
    const gearDrop=awardInstallCollectible();if(!gearDrop)return;state.installRewardClaimed=true;trackEvent('install_reward_claimed',{gear_id:gearDrop.item.id,gear_rarity:gearDrop.rarity.toLowerCase(),new_item:gearDrop.isNew});saveState();updateUI();openDropClaim(gearDrop,{kind:'install',eyebrow:'THANKS FOR INSTALLING',title:'INSTALL DROP',message:'Your free collectible pack is ready.'});
  }
  function claimDaily(){
    const today=todayKey();if(state.lastDaily===today)return;initAudio();const cash=100+state.level*35,energy=DAILY_DROP_ENERGY,gearDrop=awardDailyCollectible(today);receiveMoney(cash);state.energy=clamp(state.energy+energy,0,state.maxEnergy);state.lastDaily=today;trackEvent('daily_reward_claimed',{cash_earned:cash,energy_restored:energy,gear_id:gearDrop?.item?.id||'none',gear_rarity:gearDrop?.rarity?.toLowerCase()||'none',new_item:!!gearDrop?.isNew});updateUI();if(!gearDrop){toast(`DAILY DROP: $${cash} + ${energy}% energy`,'#f4c34a');return}openDropClaim(gearDrop,{kind:'daily',eyebrow:'ONE FREE PACK EVERY DAY',title:'DAILY DROP',message:'Reveal today’s guaranteed collectible.',rewards:[`+$${cash} CASH`,`+${energy}% ENERGY`]});
  }

  function emptyFightStats(){return {attempted:0,landed:0,sig:0,takedowns:0,control:0,damage:0,kd:0}}
  function addFightStats(total,part){for(const k of Object.keys(total))total[k]+=part[k]||0}
  function scheduleFight(fn,delay){const id=setTimeout(fn,Math.max(40,delay/fightSpeed));fightTimers.push(id);return id}
  function clearFightTimers(){fightTimers.forEach(clearTimeout);fightTimers=[]}
  function fightClock(exchange,total){const seconds=Math.max(12,300-Math.round((exchange/Math.max(1,total))*288));return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`}

  function commentaryFor(type,attacker,defender,landed,big=false){
    const list=STRINGS.fightCommentary[landed?'hit':'miss'][type],template=list[rint(0,list.length-1)];return copyText(template,{A:attacker.name,D:defender.name});
  }

  function createFight(o){
    const P={name:state.name,power:effectiveStat('power'),speed:effectiveStat('speed'),chin:effectiveStat('chin'),cardio:effectiveStat('cardio')};
    const O={name:o.name,power:o.power,speed:o.speed,chin:o.chin,cardio:o.cardio};
    return {o,player:P,opp:O,playerCondition:LOGIC.startingFightCondition(state.health,state.maxHealth),oppCondition:100,healthLost:0,injuryEligible:state.health<state.maxHealth&&!currentTrainingInjury(),fightInjury:null,rounds:[],timeline:[],totals:{player:emptyFightStats(),opp:emptyFightStats()},winner:null,method:'DECISION',finishRound:FIGHT_ROUNDS,finishClock:'0:00',ended:false,mode:'planned',gamePlan:Object.assign({},state.fightPlanPreference),planAssessment:null,focus:0,focusBase:0,focusEncounter:null,focusResult:null,plans:[],lastPlan:state.fighterStyle||'striker',openingApproach:null,tendencyRevealed:true,deepRead:false,crisisUsed:false,cornerTowel:false,haymakerMiss:false,finalDecisionPending:false,lastChanceResolved:false,pendingMoment:null,resolvedMoments:[],roundIntros:[]};
  }

  function maybeRollLiveFightInjury(sim,landed=true){
    const chance=LOGIC.liveFightInjuryChance({eligible:!!sim?.injuryEligible,landed,injured:!!sim?.fightInjury});
    if(!chance||Math.random()>=chance)return null;
    const def=trainingInjuryDefs[rint(0,trainingInjuryDefs.length-1)],injury={id:def.id,name:def.name,icon:def.icon};sim.fightInjury=injury;sim.playerCondition=LOGIC.fightInjuryCondition(sim.playerCondition);for(const key of ['power','speed','chin','cardio'])sim.player[key]=LOGIC.injuredStat(sim.player[key],true);return injury;
  }

  function planFamiliarity(styleId,planId){
    if(!styleId)return 0;return styleId===planId?.08:-.06;
  }
  function matchupEdge(planId,opponentId){
    const matrix={striker:{striker:0,grappler:.14},grappler:{striker:.14,grappler:0}};return matrix[planId]?.[opponentId]||0;
  }
  function strategyEdge(planId,tendency){return clamp(matchupEdge(planId,tendency)+planFamiliarity(state.fighterStyle,planId),-.26,.24)}
  function focusTier(value){return value>=95?'LOCKED IN':value>=85?'SHARP':value>=70?'COMPOSED':value>=60?'DISTRACTED':'SHAKEN'}
  function fightFocusModifier(sim=fight){const value=Number(sim?.focus)||80;return value>=95?.05:value>=85?.025:value>=70?0:value>=60?-.025:-.06}
  function responsePlanId(tendency){return STRINGS.corner.matchups[tendency]?.plan||state.fighterStyle||'striker'}
  function plannedStyleForRound(sim,round){const signature=state.fighterStyle||'striker';return sim.gamePlan?.tactics==='adapt'&&round>1?responsePlanId(sim.o.tendency):signature}
  function adaptationModifier(sim,round){if(sim.gamePlan?.tactics!=='adapt'||round===1)return 0;const focus=Number(sim.focus)||80,execution=focus>=95?.04:focus>=85?.02:focus>=70?0:focus>=60?-.04:-.08;return execution+(round===2?-.025:0)}
  function assessFightPlan(sim=fight,adaptationScale=.5){return LOGIC.fightPlanAssessment({player:sim?.player,opponent:sim?.opp,plan:sim?.gamePlan,fighterStyle:state.fighterStyle,opponentStyle:sim?.o?.tendency,focus:sim?.focus,adaptationScale})}
  function fightPlanFeedback(assessment,plan){
    const axis=assessment.axis,positive=assessment.components[axis]>=0,reasons={pace:positive?(plan.pace==='fast'?'YOUR CARDIO SUPPORTS THE OUTPUT':'THE MEASURED PACE PROTECTS YOUR GAS TANK'):(plan.pace==='fast'?'THE PACE IS TAXING YOUR CARDIO':'THE LOW OUTPUT SURRENDERS YOUR PHYSICAL EDGE'),offense:positive?(plan.offense==='aggressive'?'YOUR PRESSURE TARGETS THEIR CHIN':'DISCIPLINED OFFENSE LIMITS THEIR COUNTERS'):(plan.offense==='aggressive'?'RECKLESS ENTRIES ARE LEAVING OPENINGS':'SAFE OFFENSE IS BLUNTING YOUR FINISHING EDGE'),tactics:positive?(plan.tactics==='adapt'?'YOUR FOCUS SUPPORTS THE ADJUSTMENT':'YOUR SIGNATURE STYLE FITS THIS MATCHUP'):(plan.tactics==='adapt'?'THE STYLE SWITCH IS BREAKING DOWN':'THEY ARE READING YOUR SIGNATURE STYLE')};
    return `${assessment.grade==='EDGE'?'FIGHT PLAN EDGE':assessment.grade==='EXPOSED'?'FIGHT PLAN EXPOSED':'FIGHT PLAN EVEN'} · ${reasons[axis]}`;
  }
  function plannedTechnique(archetype,offense){let type=techniqueFor(archetype,Math.random());if(offense==='conservative'&&['cross','hook','kick'].includes(type)&&Math.random()<.38)type='jab';else if(offense==='aggressive'&&type==='jab'&&Math.random()<.58)type=Math.random()<.62?'hook':'cross';return type}
  function techniqueFor(archetype,roll){
    if(archetype==='grappler')return roll<.41?'takedown':roll<.59?'jab':roll<.77?'cross':roll<.90?'hook':'kick';
    return roll<.20?'jab':roll<.47?'cross':roll<.70?'hook':roll<.91?'kick':'takedown';
  }

  function selectFightMoment({side,type,landed,kd,playerCondition,oppCondition}){
    if(side==='player'&&kd||oppCondition<=38)return 'opponentHurt';
    if(side==='opp'&&kd||playerCondition<=38)return 'playerHurt';
    if(side==='opp'&&landed&&type==='takedown')return 'opponentShot';
    if(side==='player'&&landed&&type==='takedown')return 'topControl';
    if(side==='opp'&&landed)return 'underPressure';
    return 'tactical';
  }
  function scoreRoundState(rs){
    const metric=s=>s.damage*fightRule('roundScoring.damageWeight',1.35)+s.landed*fightRule('roundScoring.landedAttackWeight',1)+s.takedowns*fightRule('roundScoring.takedownWeight',5)+s.control/fightRule('roundScoring.controlSecondsDivisor',12)+s.kd*fightRule('roundScoring.knockdownWeight',14),pMetric=metric(rs.player),oMetric=metric(rs.opp),dominantMargin=fightRule('roundScoring.dominantRoundMargin',20);
    if(pMetric>=oMetric){rs.scoreP=10;rs.scoreO=(pMetric-oMetric>dominantMargin||rs.player.kd>rs.opp.kd)?8:9}else{rs.scoreO=10;rs.scoreP=(oMetric-pMetric>dominantMargin||rs.opp.kd>rs.player.kd)?8:9}
  }

  function simulateRound(sim,round,planId,opening=null){
      if(sim.winner||round>FIGHT_ROUNDS)return;const plan=planDefs.find(p=>p.id===planId)||planDefs[0],gamePlan=sim.gamePlan||state.fightPlanPreference,adapting=gamePlan.tactics==='adapt'&&round>1,adaptScale=adapting?(round===2?.5:1):1,planAssessment=assessFightPlan(sim,gamePlan.tactics==='adapt'?(round===1?0:adaptScale):1),edge=clamp(strategyEdge(plan.id,sim.o.tendency)*adaptScale+adaptationModifier(sim,round)+planAssessment.modifier,-.28,.34),familiarity=planFamiliarity(state.fighterStyle,plan.id),focusMod=fightFocusModifier(sim),fastPace=gamePlan.pace==='fast',aggressiveOffense=gamePlan.offense==='aggressive';if(round===1)sim.planAssessment=assessFightPlan(sim);sim.lastPlan=plan.id;sim.plans.push(plan.id);
      const P=sim.player,O=sim.opp,rs={round,plan:plan.id,player:emptyFightStats(),opp:emptyFightStats(),scoreP:0,scoreO:0};let stopped=false;
      sim.timeline.push({type:'roundStart',round,clock:'5:00'});
      if(opening?.damage){const damage=opening.damage,knockdown=damage>=26||sim.oppCondition-damage<32;rs.player.attempted++;rs.player.landed++;rs.player.sig++;rs.player.damage+=damage;if(knockdown)rs.player.kd++;sim.oppCondition=clamp(sim.oppCondition-damage,0,100);sim.timeline.push({type:'action',round,clock:'4:56',text:`HAYMAKER LANDS! ${P.name} detonates a desperate right hand${knockdown?` and drops ${O.name}`:''}!`,className:'big',playerCondition:sim.playerCondition,oppCondition:sim.oppCondition,big:true,landed:true,side:'player'});const finishChance=sim.oppCondition<=0?1:sim.oppCondition<18?.42:0;if(finishChance&&Math.random()<finishChance){sim.winner='player';sim.method='KO';sim.finishRound=round;sim.finishClock='4:54';stopped=true;sim.timeline.push({type:'ko',round,clock:'4:54',text:`IT'S OVER! ${P.name} came back from the brink!`,className:'ko',playerCondition:sim.playerCondition,oppCondition:sim.oppCondition})}}
      if(!stopped){const discipline=familiarity<=-.08?' It is outside their natural discipline.':'',planAction=adapting?(round===2?'begins adjusting toward':'fully shifts to'):'opens with',openingText=opening?.damage?`${P.name} has life again and pours on pressure.`:`${P.name} ${planAction} the ${plan.name.toLowerCase()} game plan at a ${fastPace?'fast':'measured'} pace.${discipline}`;sim.timeline.push({type:'action',round,clock:opening?.damage?'4:48':'5:00',text:openingText,className:'big',playerCondition:sim.playerCondition,oppCondition:sim.oppCondition});if(round===1){const assessment=sim.planAssessment;sim.timeline.push({type:'action',round,clock:'4:55',text:fightPlanFeedback(assessment,gamePlan),className:`plan-${assessment.grade.toLowerCase()}`,playerCondition:sim.playerCondition,oppCondition:sim.oppCondition})}}
      const exchanges=fastPace?rint(fightRule('exchangeCounts.fastPaceMinimum',9),fightRule('exchangeCounts.fastPaceMaximum',11)):rint(fightRule('exchangeCounts.slowPaceMinimum',6),fightRule('exchangeCounts.slowPaceMaximum',7));
      for(let ex=1;ex<=exchanges&&!stopped;ex++){
        const initiativeMod={striker:.06,grappler:-.01}[plan.id]||0;
        const tendencyInitiative={striker:-.05,grappler:.01}[sim.o.tendency]||0;
        const paceInitiative=fastPace?clamp((P.cardio-O.cardio)*.018+(P.cardio-8)*.008,-.12,.14):0;
        const pInitiative=clamp(.5+(P.speed-O.speed)*.022+(P.cardio-O.cardio)*.008+initiativeMod+edge+tendencyInitiative+paceInitiative+focusMod*.7,.14,.86);
        const side=Math.random()<pInitiative?'player':'opp',A=side==='player'?P:O,D=side==='player'?O:P,aStats=rs[side],attackingStyle=side==='player'?plan.id:sim.o.tendency;
        const type=side==='player'?plannedTechnique(attackingStyle,gamePlan.offense):techniqueFor(attackingStyle,Math.random());aStats.attempted++;
        const fatiguePlan=side==='player'?(fastPace?fightRule('fatigue.fastPaceMultiplier',1.35):fightRule('fatigue.slowPaceMultiplier',.7))*(aggressiveOffense?fightRule('fatigue.aggressiveOffenseMultiplier',1.12):fightRule('fatigue.conservativeOffenseMultiplier',.9)):1,cardioTax=LOGIC.cardioImbalanceFatigue(A),roundFatigue=((round-1)*fightRule('fatigue.laterRoundPenalty',.025)+ex*(Math.max(0,fightRule('fatigue.lowCardioTarget',10)-A.cardio)*fightRule('fatigue.lowCardioPenaltyPerExchange',.0018)+cardioTax))*fatiguePlan;
        let chance=.53+(A.speed-D.speed)*.018+(A.cardio-D.cardio)*.006-roundFatigue+rand(-.11,.11);
        if(type==='takedown')chance=.43+(A.power+A.speed-D.chin-D.cardio)*.012+rand(-.10,.10);
        if(side==='player'){
          chance+=edge*.72+focusMod+(aggressiveOffense?-.045:.05);if(plan.id==='striker'&&type!=='takedown')chance+=.035;if(plan.id==='grappler'&&type==='takedown')chance+=.14;
        }else{
          chance-=edge*.45+focusMod*.35;chance+=aggressiveOffense?.04:-.035;if(sim.o.tendency==='striker'&&type!=='takedown')chance+=.03;if(sim.o.tendency==='grappler'&&type==='takedown')chance+=.13;if(plan.id==='striker')chance+=.025;
        }
        chance=clamp(chance,.22,.84);const landed=Math.random()<chance;let damage=0,kd=false,control=0,fightInjury=null;
        if(landed){
          aStats.landed++;const base={jab:3.2,cross:6.2,hook:7.4,kick:6.1,takedown:4.6}[type],powerScale={jab:.13,cross:.25,hook:.31,kick:.23,takedown:.18}[type];
          const styleDamage={striker:1.12,grappler:.88}[attackingStyle]||1,tacticalDamage=(side==='player'?1+edge:1-edge*.35)*styleDamage;
          const offenseDamage=side==='player'?(aggressiveOffense?1.16:.86):1;damage=Math.max(1,Math.round((base+A.power*powerScale)*rand(.72,1.22)*clamp(1-D.chin*.014,.55,.94)*tacticalDamage*offenseDamage));
          if(type!=='jab'&&type!=='takedown')aStats.sig++;
          if(type==='takedown'){const controlBonus=attackingStyle==='grappler'?22:0;aStats.takedowns++;control=rint(18,58)+Math.max(0,A.cardio-D.cardio)*2+controlBonus;aStats.control+=control}
          const intentKnockdown=side==='player'?(aggressiveOffense?.045:-.02):0,kdChance=clamp(.025+(A.power-D.chin)*.012+(damage-8)*.018+(attackingStyle==='striker'?.02:0)+intentKnockdown,0,.36);
          if(type!=='jab'&&type!=='takedown'&&Math.random()<kdChance){kd=true;aStats.kd++;damage+=rint(5,10)}
          aStats.damage+=damage;if(side==='player')sim.oppCondition=clamp(sim.oppCondition-damage,0,100);else{sim.playerCondition=clamp(sim.playerCondition-damage,0,100);fightInjury=maybeRollLiveFightInjury(sim,true)}
        }
        const clock=fightClock(ex,exchanges);let text=commentaryFor(type,A,D,landed),className=side==='player'?'you':'opp';if(kd){text=`DOWN! ${A.name} drops ${D.name}! The crowd detonates.`;className='big'}
        sim.timeline.push({type:'action',round,clock,text,className,playerCondition:sim.playerCondition,oppCondition:sim.oppCondition,big:kd,landed,side,healthDamage:side==='opp'?LOGIC.liveFightHealthDamage({landed,knockdown:kd}):0,fightInjury});
        if(landed&&type==='takedown'&&attackingStyle==='grappler'){
          const targetCondition=side==='player'?sim.oppCondition:sim.playerCondition,signatureBoost=side==='player'&&state.fighterStyle==='grappler'?.05:0,subChance=clamp(.055+(A.speed-D.speed)*.012+(A.cardio-D.cardio)*.008+(100-targetCondition)*.001+signatureBoost,.04,.34);
          if(Math.random()<subChance){sim.winner=side;sim.method='SUBMISSION';sim.finishRound=round;sim.finishClock=clock;stopped=true;sim.timeline.push({type:'submission',round,clock,text:`TAP! ${A.name} locks in the submission and ${D.name} has nowhere to go!`,className:'ko',playerCondition:sim.playerCondition,oppCondition:sim.oppCondition,big:true,healthDamage:side==='opp'?LOGIC.liveFightHealthDamage({finish:'SUBMISSION'}):0})}
        }
        if(!stopped){const targetCondition=side==='player'?sim.oppCondition:sim.playerCondition,koChance=targetCondition<=0?1:(kd&&targetCondition<22?.40:targetCondition<10?.24:0);if(koChance&&Math.random()<koChance){sim.winner=side;sim.method=targetCondition<=0?'KO':'TKO';sim.finishRound=round;sim.finishClock=clock;stopped=true;sim.timeline.push({type:'ko',round,clock,text:`IT'S OVER! ${A.name} gets the stoppage!`,className:'ko',playerCondition:sim.playerCondition,oppCondition:sim.oppCondition,healthDamage:side==='opp'?LOGIC.liveFightHealthDamage({finish:sim.method}):0})}}
        if(sim.mode==='sim-plus'&&!stopped&&ex===Math.ceil(exchanges/2)){
          const moment=selectFightMoment({side,type,landed,kd,playerCondition:sim.playerCondition,oppCondition:sim.oppCondition});
          sim.timeline.push({type:'fightMoment',round,clock:fightClock(ex+.35,exchanges),moment,playerCondition:sim.playerCondition,oppCondition:sim.oppCondition});
        }
      }
      scoreRoundState(rs);
      addFightStats(sim.totals.player,rs.player);addFightStats(sim.totals.opp,rs.opp);sim.rounds.push(rs);
      if(sim.mode==='sim-plus'&&!stopped&&round===3&&!sim.crisisUsed){sim.finalDecisionPending=true;sim.timeline.push({type:'lastChance',round:3,clock:'0:10'})}
      if(!stopped)sim.timeline.push({type:'roundEnd',round,clock:'0:00',text:`Round ${round} ends. The corner teams rush in.`,className:'round-end',playerCondition:sim.playerCondition,oppCondition:sim.oppCondition});
    if(round===3&&!sim.winner&&!sim.finalDecisionPending)settleFightDecision(sim)
  }
  function settleFightDecision(sim){const score=LOGIC.fightScore(sim.rounds),margin=Math.abs(score.player-score.opponent);sim.winner=score.player>=score.opponent?'player':'opp';sim.method=margin<=1&&Math.random()<.45?'SPLIT DECISION':'UNANIMOUS DECISION';sim.finishRound=3;sim.finishClock='0:00';sim.finalDecisionPending=false}

  function renderTapeBreakdown(f=fight){
    if(!f?.o)return;const basePurse=payoutForOpponent(f.o),hype=Math.floor(state.hype),hypePurse=Math.round(state.hype/1.3);$('#tapeBreakdownPurse').textContent='$'+fmt(basePurse);$('#tapeHypeBonus').textContent=`${hype}% HYPE · +${hypePurse}% WINNINGS`;$('#tapeBreakdownFollowers').textContent=`+${hype}% FOLLOWERS ON A WIN`;$('#tapeBreakdownMode').textContent='PLANNED FULL SIM · KEEP 100%';$('#tapeEnergy').textContent='ABOVE 0% REQUIRED · UP TO ONE CELL USED';$('#tapeBreakdownHaymaker').textContent='YOUR LOCKER-ROOM PLAN CONTROLS THE ENTIRE FIGHT.';$('#tapeBreakdownNetwork').hidden=!f.o.network;
  }
  function openTapeBreakdown(){if(!fight)return;renderTapeBreakdown();$('#tapeBreakdown').hidden=false;$('#tapePurseToggle').setAttribute('aria-expanded','true');$('#tapeBreakdownClose').focus();sfx.tap()}
  function closeTapeBreakdown(restoreFocus=true){const breakdown=$('#tapeBreakdown');if(breakdown.hidden)return;breakdown.hidden=true;$('#tapePurseToggle').setAttribute('aria-expanded','false');if(restoreFocus)$('#tapePurseToggle').focus()}
  function renderTapeAttributes(f){
    const attributes=[['Power','power','tapePPower','tapeOPower'],['Speed','speed','tapePSpeed','tapeOSpeed'],['Chin','chin','tapePChin','tapeOChin'],['Cardio','cardio','tapePCardio','tapeOCardio']],scale=Math.max(10,...attributes.flatMap(([,key])=>[Number(f.player[key])||0,Number(f.opp[key])||0]));
    attributes.forEach(([,key,playerId,oppId])=>{
      const playerValue=Number(f.player[key])||0,oppValue=Number(f.opp[key])||0,even=Math.abs(playerValue-oppValue)<.005,playerAdvantage=!even&&playerValue>oppValue,oppAdvantage=!even&&oppValue>playerValue,playerValueEl=$('#'+playerId),oppValueEl=$('#'+oppId),playerMeter=$('#'+playerId+'Meter').parentElement,oppMeter=$('#'+oppId+'Meter').parentElement;
      playerValueEl.textContent=formatStat(playerValue);oppValueEl.textContent=formatStat(oppValue);playerValueEl.classList.toggle('advantage',playerAdvantage);oppValueEl.classList.toggle('advantage',oppAdvantage);playerValueEl.classList.toggle('even',even);oppValueEl.classList.toggle('even',even);playerMeter.classList.toggle('advantage',playerAdvantage);oppMeter.classList.toggle('advantage',oppAdvantage);playerMeter.classList.toggle('even',even);oppMeter.classList.toggle('even',even);$('#'+playerId+'Meter').style.width=`${clamp(playerValue/scale*100,4,100)}%`;$('#'+oppId+'Meter').style.width=`${clamp(oppValue/scale*100,4,100)}%`;
    });
  }
  function fillTape(f){
    const fightsLeft=sessionsLeft('fight',DAILY_FIGHT_LIMIT),startingCondition=LOGIC.startingFightCondition(state.health,state.maxHealth),cleared=fightsLeft>0&&hasActionEnergy()&&state.health>=MINIMUM_FIGHT_HEALTH;
    const playerAccent=fighterAccent(state.fighterCity),opponentAccent=f.o.network?fighterAccent(f.o.networkCity):f.o.color||DEFAULT_FIGHTER_ACCENT,playerCard=$('#tapeStage .player-card'),opponentCard=$('#tapeStage .opponent-card');playerCard.style.setProperty('--fighter-accent',playerAccent);opponentCard.style.setProperty('--fighter-accent',opponentAccent);applyPortraitStyle(playerCard,state.name);applyPortraitStyle(opponentCard,f.o.networkHandle||f.o.name);$('#tapePlayerCity').textContent=fighterCityCode(state.fighterCity);$('#tapeOppCity').textContent=f.o.network?fighterCityCode(f.o.networkCity):String(f.o.country||'CG').slice(0,3).toUpperCase();
    const titleBout=!!f.o.globalChampionship,playerIsChampion=titleBout&&sharedChampionship?.is_champion===true;$('#tapePlayerName').textContent=f.player.name;$('#tapePlayerTag').textContent=playerIsChampion?'REIGNING WORLD CHAMPION':currentStyle()?.name||'NO ARCHETYPE';$('#tapePlayerRecord').textContent=`PRO ${state.wins}-${state.losses}`;$('#tapeOppName').textContent=f.opp.name;$('#tapeOppRecord').textContent=`PRO ${f.o.wins}-${f.o.losses}`;$('#tapeOppTag').textContent=titleBout&&!playerIsChampion?'REIGNING WORLD CHAMPION':f.o.tag||'UNKNOWN STYLE';
    $('#tapePlayerArt').src=$('#heroFighterArt').src;$('#tapeOppSprite').src=silhouetteForOpponent(f.o);$('#tapeOppSprite').classList.toggle('network-portrait',!!f.o.network);
    renderTapeAttributes(f);$('#tapeTitleBout').hidden=!titleBout;$('#tapeStage .tape-card').classList.toggle('title-bout',titleBout);$('#tapeChampionLabel').textContent=titleBout?(playerIsChampion?`${state.name} IS THE REIGNING CHAMPION`:`${f.o.name} IS THE REIGNING CHAMPION`):'';
    $('#tapePurse').textContent='$'+fmt(payoutForOpponent(f.o));$('#tapeBoutLabel').textContent=titleBout?'WORLD CHAMPIONSHIP BOUT · 3 ROUNDS':f.o.network?'RANKED FIGHT · 3 ROUNDS':'UNRANKED FIGHT · 3 ROUNDS';const xpTier=opponentXpTier(f.o),xpStatus=$('#tapeXpStatus'),needsEnergy=fightsLeft>0&&!hasActionEnergy(),fightButton=$('#tapeFightBtn'),recoveryButton=$('#tapeRecoveryBtn');xpStatus.textContent=xpTier.tapeLabel;xpStatus.className=`tape-xp-status ${xpTier.tier}`;fightButton.hidden=needsEnergy;fightButton.disabled=!cleared;recoveryButton.hidden=!needsEnergy;$('#tapeClearance').classList.toggle('recovery-needed',needsEnergy);$('#tapeClearance').textContent=!fightsLeft?'DAILY FIGHT LIMIT REACHED · NEW FIGHTS AT LOCAL MIDNIGHT':state.health<MINIMUM_FIGHT_HEALTH?`MEDICAL CLEARANCE REQUIRES ${MINIMUM_FIGHT_HEALTH} HEALTH`:needsEnergy?'0% ENERGY · VISIT THE RECOVERY ROOM TO REST BEFORE FIGHTING':startingCondition<100?`LIMITED CLEARANCE · ${startingCondition}% STARTING CONDITION`:`CLEARED · FIGHT USES UP TO ${FIGHT_ENERGY_COST}% ENERGY`;
    const edge=(f.player.power+f.player.speed+f.player.chin+f.player.cardio)-(f.opp.power+f.opp.speed+f.opp.chin+f.opp.cardio),playerFavorite=edge>=4,oppFavorite=edge<=-4;$('#tapePlayerFavorite').hidden=!playerFavorite;$('#tapeOppFavorite').hidden=!oppFavorite;
    const matchup=edge>4?'YOU HAVE THE STATISTICAL EDGE':edge<-4?'OPPONENT HAS THE STATISTICAL EDGE':'ATTRIBUTES ARE EVENLY MATCHED',titleAction=f.o.titleMode==='defense'?'DEFEND THE TITLE':f.o.titleMode==='rematch'?'RECLAIM THE TITLE':'FIGHT FOR THE TITLE';$('#walkoutText').textContent=matchup;$('#tapeFightBtn').textContent=titleBout?titleAction:'SET FIGHT PLAN';$('#fightPlanConfirm').textContent=titleBout?titleAction:'LOCK IN FIGHT PLAN';renderTapeBreakdown();
  }

  function showFightStage(stage){['tapeStage','planStage','focusStage','liveStage'].forEach(id=>$('#'+id).classList.toggle('hidden',id!==stage))}
  const fightFocusFeature=globalThis.CAGE_FIGHT_FOCUS.createFightFocusFeature({$,getFight:()=>fight,getState:()=>state,contacts:globalThis.CAGE_FIGHT_FOCUS_CONTACTS,clamp,rint,focusTier,showFightStage,saveState,trackEvent,tap:()=>sfx.tap(),beginPlannedFight});
  const fightPlanFeature=globalThis.CAGE_FIGHT_PLAN.createFightPlanFeature({$,$$,getFight:()=>fight,getState:()=>state,isCombatLocked:()=>combatLocked,currentStyle,escapeHtml,showFightStage,saveState,trackEvent,tap:()=>sfx.tap(),beginFocus:()=>fightFocusFeature.begin()});
  function fightPlanLabel(plan=fight?.gamePlan){return fightPlanFeature.label(plan)}
  function beginFightPlan(){fightPlanFeature.begin()}
  function selectFightPlanSetting(setting,value){fightPlanFeature.select(setting,value)}
  function confirmFightPlan(){fightPlanFeature.confirm()}
  function updateFocusDisplay(){fightFocusFeature.updateDisplay()}
  function resolveFocusChoice(choice){fightFocusFeature.resolve(choice)}
  function continueAfterFocus(){fightFocusFeature.continueAfter()}
  function tauntOpponent(key){
    const o=state.roster.find(f=>f.key===key);if(!o||o.globalChampionship||(o.lossesToPlayer||0)<1||o.rematchAccepted)return;
    o.rematchAccepted=true;state.hype=clamp(state.hype+3,0,100);trackEvent('rival_taunted',{prior_meetings:o.meetings||0});initAudio();sfx.rage();shake(true);updateUI();toast(`${o.name} TOOK THE BAIT · RIVAL FIGHT ACCEPTED!`,'#ffb157');
  }
  function openTaleOfTape(o){
    if(!opponentAvailable(o)){toast(o.globalChampionship?(o.titleCooldown?(sharedChampionship?.is_champion?'This fighter already had a title fight today. Choose another ranked fighter.':championshipResetCopy(sharedChampionship)):`Reach Level ${o.tier} to challenge @${o.networkHandle}.`):`${o.name} is locked until Level ${o.tier}.`,'#ffb157');return}
    clearFightTimers();fight=createFight(o);combatLocked=false;fightSpeed=1;fightTimelineIndex=0;trackEvent('fight_matchup_viewed',{opponent_archetype:o.tendency,is_rematch:(o.meetings||0)>0,is_title:!!o.globalChampionship});$('#fightOverlay').classList.add('active');showFightStage('tapeStage');$('#fightControls').classList.add('hidden');fillTape(fight);writeHistory('preview','push');sfx.tap();
  }
  function closeFightPreview(){const fromHistory=arguments[0]===true;if(combatLocked)return;if(!fromHistory&&history.state?.[HISTORY_KEY]&&history.state.layer==='preview'){history.back();return}closeTapeBreakdown(false);clearFightTimers();$('#fightOverlay').classList.remove('active');fight=null;sfx.tap()}
  function visitRecoveryRoom(){closeFightPreview(true);navTo('train');requestAnimationFrame(()=>$(state.energy<state.maxEnergy?'#trainRestCard':'#recoveryRoomCard').scrollIntoView({behavior:'smooth',block:'start'}));toast('REST & RECHARGE · FREE +25% ENERGY','#78dcff')}
  async function commitFight(o=fight?.o){
    if(!o)return;
    if(combatLocked||state.pendingFight)return;
    if(!opponentAvailable(o)){toast(o.globalChampionship?(o.titleCooldown?(sharedChampionship?.is_champion?'This fighter already had a title fight today. Choose another ranked fighter.':championshipResetCopy(sharedChampionship)):`Reach Level ${o.tier} to challenge @${o.networkHandle}.`):`${o.name} is locked until Level ${o.tier}.`,'#ffb157');return}
    if(sessionsLeft('fight',DAILY_FIGHT_LIMIT)<1){toast('Daily fight limit reached. New fights unlock at local midnight.','#ff766d');fillTape(fight);return}
    if(state.health<MINIMUM_FIGHT_HEALTH){toast(`You need at least ${MINIMUM_FIGHT_HEALTH} health to be cleared.`,'#ff766d');return}
    if(!hasActionEnergy()){toast('You cannot fight at 0% Energy. Rest first.','#ff766d');return}
    let championshipBout=null;if(o.globalChampionship){$('#tapeFightBtn').disabled=true;$('#tapeFightBtn').textContent='BOOKING TITLE FIGHT…';try{if(!await connectSharedSocial(true))throw new Error(sharedSocialError||'Cage Network connection required.');championshipBout=await SHARED_FEED.beginChampionshipBout(o.sourceProfileId);if(!championshipBout?.challenge_id)throw new Error('The title fight could not be booked.')}catch(error){toast(fighterSessionMessage(error),'#ff766d');fillTape(fight);return}}
    const booking=LOGIC.bookFight(state,o.key,FIGHT_ENERGY_COST,Date.now(),MINIMUM_ACTION_ENERGY_EXCLUSIVE);if(!booking.ok){if(booking.reason==='energy')toast('You cannot fight at 0% Energy. Rest first.','#ff766d');return}
    if(championshipBout)Object.assign(state.pendingFight,{challengeId:championshipBout.challenge_id,challengerId:championshipBout.challenger_id,playerIsChampion:championshipBout.player_is_champion===true});
    if(championshipBout){const event=o.titleMode==='defense'?'title_defense_started':o.titleMode==='rematch'?'title_rematch_started':'title_challenge_started';trackEvent(event,{opponent_id:o.sourceProfileId})}
    initAudio();clearFightTimers();fight=createFight(o);fight.championshipBout=championshipBout;combatLocked=true;fightSpeed=2;fightTimelineIndex=0;trackEvent('fight_started',{fight_mode:'planned',player_archetype:state.fighterStyle,opponent_archetype:o.tendency,is_rematch:(o.meetings||0)>0,is_title:!!o.globalChampionship,energy_spent:booking.energySpent});
    $('#fightOverlay').classList.add('active');$('#fightControls').classList.add('hidden');$('#actionFeed').innerHTML='';$('#cornerChoice').innerHTML='';$('#speedBtn').classList.add('active');$('#speedBtn').textContent='NORMAL ×1';$('#speedBtn').disabled=false;writeHistory('fight','replace');sfx.tap();saveState();updateUI();beginFightPlan();
  }

  function forfeitFight(){
    if(!fightExitGuarded())return;closeForfeitFightDialog();fight.forfeited=true;fight.winner='opp';fight.method='FORFEIT';fight.finishRound=Math.max(1,fight.rounds.length||1);fight.finishClock='5:00';trackEvent('fight_forfeited',{round_number:fight.finishRound,opponent_archetype:fight.o.tendency,is_title:!!fight.o.globalChampionship});finishFightSimulation();
  }

  function cornerFightState(rounds){const score=LOGIC.fightScore(rounds);return score.player>score.opponent?'ahead':score.player<score.opponent?'behind':'even'}
  function renderCornerPlans(container,nextRound){
    const signature=state.fighterStyle||'striker',opponentStyle=fight?.o.tendency||signature,signaturePlan=planDefs.find(plan=>plan.id===signature)||planDefs[0],matchup=STRINGS.corner.matchups[opponentStyle]||STRINGS.corner.matchups.striker,responsePlan=planDefs.find(plan=>plan.id===matchup.plan)||signaturePlan,sameStyle=signature===opponentStyle||signature===responsePlan.id;
    const signatureDescription=sameStyle&&signature===opponentStyle?'You know this style. Stay disciplined and win the familiar exchanges.':`Trust your ${signaturePlan.name.toLowerCase()} game and dictate the round.`;
    const choices=[{plan:signaturePlan,isSignature:true,label:'FIGHT YOUR WAY',description:signatureDescription}];
    if(!sameStyle){
      const edge=strategyEdge(responsePlan.id,opponentStyle),deepRead=fight?.deepRead?(edge>=.08?' Your corner sees a strong tactical edge.':edge<=-.08?' This is a risky switch outside your natural game.':' Your corner sees a workable adjustment.') : '';
      choices.push({plan:responsePlan,isSignature:false,label:matchup.action,description:matchup.description+deepRead});
    }
    container.innerHTML=choices.map(({plan,isSignature,label,description})=>`<button class="corner-plan-btn ${isSignature?'signature':'response'}" data-fight-plan="${plan.id}" data-plan-context="corner"><b>${label}</b><small>${description}</small></button>`).join('');
  }
  function haymakerChance(sim){return clamp(.15+(sim.player.power-sim.opp.chin)*.018+(sim.player.speed-sim.opp.speed)*.01+sim.playerCondition*.0015+(100-sim.oppCondition)*.002+(state.fighterStyle==='striker'?.04:0)+fightFocusModifier(sim),.15,.68)}
  function resetBloodSportBurst(){const layer=$('#bloodSportBurst');if(!layer)return;clearTimeout(layer._clearTimer);layer.classList.remove('active');layer.replaceChildren()}
  function prepareLiveFight(){
    const intro=$('#roundInterstitial'),playerCondition=Math.round(fight.playerCondition),liveCard=$('#liveStage .live-card');liveCard.style.setProperty('--player-accent',fighterAccent(state.fighterCity));liveCard.style.setProperty('--opponent-accent',fight.o.network?fighterAccent(fight.o.networkCity):fight.o.color||DEFAULT_FIGHTER_ACCENT);intro.classList.remove('active','leaving');intro.setAttribute('aria-hidden','true');resetBloodSportBurst();showFightStage('liveStage');setFightDecisionFocus(false);$('#fightControls').classList.remove('hidden');$('#livePlayerName').textContent=fight.player.name;$('#liveOppName').textContent=fight.opp.name;$('#liveOppStyle').textContent=fight.o.tag||'UNKNOWN STYLE';$('#livePlayerCondition').style.width=`${playerCondition}%`;$('#liveOppCondition').style.width='100%';$('#livePlayerConditionText').textContent=`${playerCondition}% CONDITION`;$('#liveOppConditionText').textContent='100% CONDITION';updateFocusDisplay();
  }
  function beginPlannedFight(){
    if(!fight||fight.rounds.length)return;fight.openingApproach=fightPlanLabel(fight.gamePlan).toLowerCase();fight.tendencyRevealed=true;
    for(let round=1;round<=FIGHT_ROUNDS&&!fight.winner;round++)simulateRound(fight,round,plannedStyleForRound(fight,round));
    fight.finalDecisionPending=false;if(!fight.winner&&fight.rounds.length>=FIGHT_ROUNDS)settleFightDecision(fight);fight.timeline=fight.timeline.filter(item=>item.type!=='fightMoment'&&item.type!=='lastChance');prepareLiveFight();$('#speedBtn').disabled=false;trackEvent('fight_planned_sim_started',{player_archetype:state.fighterStyle,pace:fight.gamePlan.pace,offense:fight.gamePlan.offense,tactics:fight.gamePlan.tactics,rounds_simulated:fight.rounds.length});fightTimelineIndex=0;playFightTimeline(0);
  }
  function setFightDecisionFocus(active){const card=$('#liveStage .live-card');if(card)card.classList.toggle('decision-active',!!active)}
  function showCornerChoice(){
    if(!fight||fight.winner||fight.rounds.length>=3){finishFightSimulation();return}
    const next=fight.rounds.length+1,box=$('#cornerChoice'),crisisThreshold=25;setFightDecisionFocus(true);box.scrollTop=0;
    if(fight.playerCondition<=crisisThreshold&&!fight.crisisUsed){
      const chance=Math.round(haymakerChance(fight)*100);
      box.innerHTML=`<div class="corner-panel crisis-panel"><h3>${gameIcon('corner-danger','🚨')} ${Math.round(fight.playerCondition)}% CONDITION · MAKE THE CALL</h3><p>Your fighter is badly hurt. The corner needs an answer before round ${next}.</p><div class="crisis-grid"><button class="crisis-btn towel" data-crisis="towel"><b>${gameIcon('corner-towel','🏳️')} THROW IN THE TOWEL</b><small>Protect your fighter. ${fight.o.name} wins by TKO.</small></button><button class="crisis-btn haymaker" data-crisis="haymaker"><b>${gameIcon('corner-haymaker','💥')} THROW A HAYMAKER</b><small>${chance}% chance. Miss and you are knocked out.</small></button></div></div>`;
      return;
    }
    const style=fighterStyles.find(item=>item.id===fight.o.tendency),fightState=cornerFightState(fight.rounds),stateCopy=STRINGS.corner.states[fightState],matchup=STRINGS.corner.matchups[fight.o.tendency]||STRINGS.corner.matchups.striker,roundLabel=next===3?'FINAL ROUND':'ROUND 2',readLabel=fight.deepRead?'DEEP READ':'OPPONENT READ';
    box.innerHTML=`<div class="corner-panel coach-corner"><h3>${roundLabel} — ${stateCopy.label}</h3><div class="corner-readline">${readLabel} · ${style?.name||fight.o.tag}</div><div class="corner-coach-quote"><b>COACH'S CORNER</b><p>“${stateCopy.advice} ${matchup.advice}”</p></div><div class="corner-plan-list" id="cornerPlanGrid"></div></div>`;renderCornerPlans($('#cornerPlanGrid'),next);
  }
  function chooseCornerPlan(planId){if(!fight||fight.winner)return;const next=fight.rounds.length+1;trackEvent('fight_strategy_selected',{round_number:next,plan_id:planId,is_signature:planId===state.fighterStyle});setFightDecisionFocus(false);$('#cornerChoice').innerHTML='';simulateRound(fight,next,planId);playFightTimeline(fightTimelineIndex)}
  function resolveFightCrisis(choice){
    if(!fight||fight.winner||fight.crisisUsed||fight.playerCondition>25)return;
    const next=fight.rounds.length+1,startIndex=fightTimelineIndex;
    fight.crisisUsed=true;setFightDecisionFocus(false);$('#cornerChoice').innerHTML='';
    if(choice==='towel'){
      trackEvent('fight_crisis_choice',{round_number:next,choice:'towel',outcome:'tko_loss'});fight.cornerTowel=true;fight.winner='opp';fight.method='TKO';fight.finishRound=next;fight.finishClock='5:00';fight.timeline.push({type:'roundStart',round:next,clock:'5:00'},{type:'ko',round:next,clock:'5:00',text:`The towel is in. ${state.name}'s corner stops the fight and ${fight.o.name} wins by TKO.`,className:'ko',playerCondition:fight.playerCondition,oppCondition:fight.oppCondition});playFightTimeline(startIndex);return;
    }
    const chance=haymakerChance(fight),landed=Math.random()<chance;trackEvent('fight_crisis_choice',{round_number:next,choice:'haymaker',outcome:landed?'landed':'missed'});
    if(!landed){
      const damage=Math.max(12,Math.round(16+fight.opp.power*.65)),playerRound=emptyFightStats(),oppRound=emptyFightStats();playerRound.attempted=1;oppRound.attempted=1;oppRound.landed=1;oppRound.sig=1;oppRound.kd=1;oppRound.damage=damage;addFightStats(fight.totals.player,playerRound);addFightStats(fight.totals.opp,oppRound);fight.rounds.push({round:next,plan:'haymaker',player:playerRound,opp:oppRound,scoreP:8,scoreO:10});const fightInjury=maybeRollLiveFightInjury(fight,true);fight.haymakerMiss=true;fight.playerCondition=0;fight.winner='opp';fight.method='KO';fight.finishRound=next;fight.finishClock='4:55';fight.timeline.push({type:'roundStart',round:next,clock:'5:00'},{type:'action',round:next,clock:'4:57',text:`${state.name} loads up on the haymaker—but ${fight.o.name} sees it coming.`,className:'opp',playerCondition:fight.playerCondition,oppCondition:fight.oppCondition,side:'opp',healthDamage:LOGIC.liveFightHealthDamage({landed:true,knockdown:true}),fightInjury},{type:'ko',round:next,clock:'4:55',text:`COUNTER SHOT! ${state.name} is knocked out cold.`,className:'ko',playerCondition:0,oppCondition:fight.oppCondition,healthDamage:LOGIC.liveFightHealthDamage({finish:'KO'})});playFightTimeline(startIndex);return;
    }
    const damage=Math.max(16,Math.round((18+fight.player.power*.72)*rand(.88,1.16)));simulateRound(fight,next,'striker',{damage});playFightTimeline(startIndex);
  }
  function fightMomentChance(choice){
    const stat=choice.stat||'speed',styleBonus=choice.styles?.includes(state.fighterStyle)?.08:0,statEdge=(fight.player[stat]-fight.opp[stat])*.018;
    return clamp(choice.base+styleBonus+statEdge+fightFocusModifier(fight),.22,.90);
  }
  function showFightMoment(item){
    if(!fight||fight.resolvedMoments.includes(item.round)){playFightTimeline(fightTimelineIndex+1);return}
    const def=fightMomentDefs[item.moment]||fightMomentDefs.tactical,box=$('#cornerChoice');fight.pendingMoment=item;setFightDecisionFocus(true);$('#speedBtn').disabled=true;
    const choices=def.choices.map(choice=>{const chance=Math.round(fightMomentChance(choice)*100),successLabel=fight.deepRead?` · ${chance}% SUCCESS`:'';return `<button class="moment-choice" data-fight-moment="${choice.id}"><b>${choice.label}</b><small>${choice.risk}${successLabel}</small></button>`}).join('');
    box.innerHTML=`<div class="corner-panel fight-moment-panel"><div class="moment-kicker">${item.clock} · SIM+ DECISION</div><h3>${def.title}</h3><p>${def.prompt}</p><div class="moment-choice-list">${choices}</div></div>`;box.scrollTop=0;sfx.tap();
  }
  function addMomentStats(stats,totals,{damage=0,control=0,takedown=0}={}){
    if(damage){stats.attempted++;stats.landed++;stats.sig++;stats.damage+=damage;totals.attempted++;totals.landed++;totals.sig++;totals.damage+=damage}
    if(control){stats.control+=control;totals.control+=control}
    if(takedown){stats.attempted++;stats.landed++;stats.takedowns+=takedown;totals.attempted++;totals.landed++;totals.takedowns+=takedown}
  }
  function fightMomentEffectChips({damage=0,selfDamage=0,control=0,oppControl=0,takedown=0}={}){
    const chips=[];if(damage)chips.push(`+${damage} DAMAGE`);if(selfDamage)chips.push(`-${selfDamage} CONDITION`);if(control)chips.push(`+${control}s CONTROL`);if(oppControl)chips.push(`OPP +${oppControl}s CONTROL`);if(takedown)chips.push(`+${takedown} TAKEDOWN`);if(!chips.length)chips.push('POSITION RESET');return chips;
  }
  function pulseFightCondition(target){
    const bar=$(target==='player'?'#livePlayerCondition':'#liveOppCondition');if(!bar)return;bar.classList.remove('moment-impact');void bar.offsetWidth;bar.classList.add('moment-impact');
  }
  function resolveFightMoment(choiceId){
    if(!fight?.pendingMoment)return;const item=fight.pendingMoment,def=fightMomentDefs[item.moment]||fightMomentDefs.tactical,choice=def.choices.find(option=>option.id===choiceId);if(!choice)return;
    const success=Math.random()<fightMomentChance(choice),effect=success?choice.success:choice.fail,round=fight.rounds.find(entry=>entry.round===item.round);if(!round)return;
    const damage=Math.max(0,effect.damage||0),selfDamage=Math.max(0,effect.selfDamage||0),control=Math.max(0,effect.control||0),oppControl=Math.max(0,effect.oppControl||0),takedown=Math.max(0,effect.takedown||0);
    addMomentStats(round.player,fight.totals.player,{damage,control,takedown});addMomentStats(round.opp,fight.totals.opp,{damage:selfDamage,control:oppControl});scoreRoundState(round);
    const playerConditionBefore=fight.playerCondition;fight.playerCondition=clamp(fight.playerCondition-selfDamage,0,100);fight.oppCondition=clamp(fight.oppCondition-damage,0,100);const fightInjury=!success&&selfDamage?maybeRollLiveFightInjury(fight,true):null,playerConditionLoss=playerConditionBefore-fight.playerCondition;
    for(let i=fightTimelineIndex+1;i<fight.timeline.length;i++){const future=fight.timeline[i];if(future.round!==item.round)break;if(future.playerCondition!=null){future.playerCondition=clamp(future.playerCondition-playerConditionLoss,0,100);future.oppCondition=clamp(future.oppCondition-damage,0,100)}}
    const outcome=success?(damage>=12?'The gamble pays off with a major momentum swing.':control>=30?'You take command of the position.':'The adjustment works and you win the exchange.'):(selfDamage>=8?'The gamble backfires and you eat a hard counter.':oppControl>=18?'The opponent reads it and takes control.':'The opening closes before you can capitalize.');
    trackEvent('fight_moment_selected',{round_number:item.round,moment_id:item.moment,choice_id:choice.id,outcome:success?'success':'failure',player_archetype:state.fighterStyle});
    const chips=fightMomentEffectChips({damage,selfDamage,control,oppControl,takedown}),resultTitle=success?`${choice.label} WORKED`:`${choice.label} COUNTERED`,box=$('#cornerChoice');
    fight.resolvedMoments.push(item.round);fight.pendingMoment=null;box.innerHTML=`<div class="corner-panel fight-moment-result ${success?'success':'failure'}"><div class="moment-result-mark">${success?'✓':'✕'}</div><div><h3>${resultTitle}</h3><div class="moment-effect-chips">${chips.map(chip=>`<span>${chip}</span>`).join('')}</div><p>${outcome}</p></div></div>`;box.scrollTop=0;if(damage)pulseFightCondition('opponent');if(selfDamage)pulseFightCondition('player');
    scheduleFight(()=>{setFightDecisionFocus(false);box.innerHTML='';$('#livePlayerCondition').classList.remove('moment-impact');$('#liveOppCondition').classList.remove('moment-impact');$('#speedBtn').disabled=false;appendFightLine({clock:item.clock,text:`${choice.label}: ${outcome}`,className:success?'big':'opp',playerCondition:clamp(item.playerCondition-playerConditionLoss,0,100),oppCondition:clamp(item.oppCondition-damage,0,100),big:success&&damage>=12,landed:success,side:success?'player':'opp',healthDamage:!success&&selfDamage?LOGIC.liveFightHealthDamage({landed:true,knockdown:selfDamage>=10}):0,fightInjury});playFightTimeline(fightTimelineIndex+1)},900*fightSpeed);
  }
  function showLastChanceDecision(){
    if(!fight||!fight.finalDecisionPending||fight.lastChanceResolved)return;if(!LOGIC.playerTrailing(fight.rounds)){settleFightDecision(fight);playFightTimeline(fightTimelineIndex+1);return}const score=LOGIC.fightScore(fight.rounds),chance=Math.round(haymakerChance(fight)*100),box=$('#cornerChoice');setFightDecisionFocus(true);
    box.innerHTML=`<div class="corner-panel last-chance-panel"><h3>0:10 LEFT · YOUR CORNER HAS YOU BEHIND</h3><p>The scorecards are slipping away. Stay disciplined and live with the decision, or risk one final knockout swing.</p><div class="last-chance-score"><b>UNOFFICIAL SCORE</b> · YOU ${score.player} · ${fight.o.name.toUpperCase()} ${score.opponent}</div><div class="last-chance-actions"><button class="last-chance-btn discipline" data-last-chance="discipline">STAY DISCIPLINED</button><button class="last-chance-btn haymaker" data-last-chance="haymaker">THROW THE HAYMAKER · ${chance}%</button></div></div>`;
  }
  function resolveLastChance(choice){
    if(!fight||!fight.finalDecisionPending||fight.lastChanceResolved||!['discipline','haymaker'].includes(choice))return;const startIndex=fightTimelineIndex;fight.lastChanceResolved=true;setFightDecisionFocus(false);$('#cornerChoice').innerHTML='';
    if(choice==='discipline'){trackEvent('fight_last_chance_choice',{choice:'discipline',outcome:'decision'});settleFightDecision(fight);playFightTimeline(startIndex+1);return}
    fight.crisisUsed=true;const landed=Math.random()<haymakerChance(fight),round=fight.rounds[fight.rounds.length-1];trackEvent('fight_last_chance_choice',{choice:'haymaker',outcome:landed?'landed':'missed'});round.player.attempted++;fight.totals.player.attempted++;
    if(!landed){const damage=Math.max(12,Math.round(16+fight.opp.power*.65));round.opp.attempted++;round.opp.landed++;round.opp.sig++;round.opp.kd++;round.opp.damage+=damage;fight.totals.opp.attempted++;fight.totals.opp.landed++;fight.totals.opp.sig++;fight.totals.opp.kd++;fight.totals.opp.damage+=damage;const fightInjury=maybeRollLiveFightInjury(fight,true);fight.playerCondition=0;fight.haymakerMiss=true;fight.winner='opp';fight.method='KO';fight.finishRound=3;fight.finishClock='0:04';fight.finalDecisionPending=false;fight.timeline.splice(startIndex+1,1,{type:'action',round:3,clock:'0:07',text:`${state.name} loads up—but ${fight.o.name} reads the final swing.`,className:'opp',playerCondition:fight.playerCondition,oppCondition:fight.oppCondition,side:'opp',healthDamage:LOGIC.liveFightHealthDamage({landed:true,knockdown:true}),fightInjury},{type:'ko',round:3,clock:'0:04',text:`COUNTER SHOT! ${state.name} is knocked out with seconds left.`,className:'ko',playerCondition:0,oppCondition:fight.oppCondition,healthDamage:LOGIC.liveFightHealthDamage({finish:'KO'})});playFightTimeline(startIndex+1);return}
    const damage=Math.max(18,Math.round((20+fight.player.power*.78)*rand(.9,1.18)));round.player.landed++;round.player.sig++;round.player.kd++;round.player.damage+=damage;fight.totals.player.landed++;fight.totals.player.sig++;fight.totals.player.kd++;fight.totals.player.damage+=damage;fight.oppCondition=clamp(fight.oppCondition-damage,0,100);round.scoreP=10;round.scoreO=8;fight.lastChanceLanded=true;const finishChance=clamp(.22+(100-fight.oppCondition)*.004,.22,.68),knockout=fight.oppCondition<=0||Math.random()<finishChance;fight.timeline.splice(startIndex+1,0,{type:'action',round:3,clock:'0:06',text:`HAYMAKER LANDS! ${state.name} drops ${fight.o.name} with the fight slipping away!`,className:'big',playerCondition:fight.playerCondition,oppCondition:fight.oppCondition,big:true,landed:true,side:'player'});if(knockout){fight.winner='player';fight.method='KO';fight.finishRound=3;fight.finishClock='0:03';fight.finalDecisionPending=false;fight.timeline.splice(startIndex+2,1,{type:'ko',round:3,clock:'0:03',text:`IT'S OVER! ${state.name} steals it in the final seconds!`,className:'ko',playerCondition:fight.playerCondition,oppCondition:fight.oppCondition})}else settleFightDecision(fight);playFightTimeline(startIndex+1);
  }
  function toggleFightSpeed(){fightSpeed=fightSpeed===1?2:1;$('#speedBtn').classList.toggle('active',fightSpeed===2);$('#speedBtn').textContent=fightSpeed===2?'NORMAL ×1':'FAST ×2';sfx.tap()}

  function applyLiveFightHealthDamage(item){
    const requested=Math.max(0,Math.round(Number(item?.healthDamage)||0));if(!requested||item.healthApplied)return 0;item.healthApplied=true;const before=state.health;state.health=clamp(state.health-requested,1,state.maxHealth);const lost=Math.max(0,Number((before-state.health).toFixed(2)));if(!lost)return 0;fight.healthLost=Number(((fight.healthLost||0)+lost).toFixed(2));$('#hudHealthText').textContent=`${Math.floor(state.health)}/${state.maxHealth}`;$('#hudHealthBar').style.width=(state.health/state.maxHealth*100)+'%';flashResource('health',lost);lastShownHealth=Math.floor(state.health);saveState();return lost;
  }
  function applyLiveFightInjury(item){
    if(!item?.fightInjury||item.injuryApplied)return null;item.injuryApplied=true;const injury=trainingInjuryDefs.find(def=>def.id===item.fightInjury.id);if(!injury)return null;if(!state.trainingInjury)state.trainingInjury={id:injury.id,date:todayKey()};saveState();trackEvent('fight_injury_suffered',{injury_id:injury.id,condition_after:Math.round(Number(item.playerCondition)||0)});return injury;
  }
  function showBloodSportBurst(item){
    const majorDamage=LOGIC.liveFightHealthDamage({landed:true,knockdown:true}),layer=$('#bloodSportBurst');if(!layer||Number(item?.healthDamage)<majorDamage)return;clearTimeout(layer._clearTimer);layer.classList.remove('active');layer.replaceChildren();const particles=document.createDocumentFragment(),count=item.type==='ko'?20:14;
    for(let i=0;i<count;i++){const particle=document.createElement('i');particle.style.setProperty('--blood-x',`${rand(-145,175)}px`);particle.style.setProperty('--blood-y',`${rand(-150,125)}px`);particle.style.setProperty('--blood-size',`${rand(3,8)}px`);particle.style.setProperty('--blood-delay',`${rint(0,85)}ms`);particle.style.setProperty('--blood-rotate',`${rint(-170,170)}deg`);particles.appendChild(particle)}
    layer.appendChild(particles);void layer.offsetWidth;layer.classList.add('active');layer._clearTimer=setTimeout(()=>resetBloodSportBurst(),760);
  }
  function appendFightLine(item){
    applyLiveFightHealthDamage(item);
    showBloodSportBurst(item);
    const injury=applyLiveFightInjury(item),feed=$('#actionFeed'),line=document.createElement('div');line.className=`action-line ${item.className||''}`;line.innerHTML=`<span class="stamp">${item.clock||''}</span>${item.text}`;feed.appendChild(line);if(injury){const injuryLine=document.createElement('div');injuryLine.className='action-line fight-injury';injuryLine.innerHTML=`<span class="stamp">INJURY</span><b>${escapeHtml(injury.icon)} ${escapeHtml(injury.name.toUpperCase())}</b><span>Current condition cut in half · heals at local midnight</span>`;feed.appendChild(injuryLine);toast(`INJURY · ${injury.name.toUpperCase()} · CONDITION CUT IN HALF`,'#ff8b94');shake(true)}feed.scrollTop=feed.scrollHeight;
    if(item.playerCondition!=null){const p=Math.round(item.playerCondition),o=Math.round(item.oppCondition);$('#livePlayerCondition').style.width=p+'%';$('#liveOppCondition').style.width=o+'%';$('#livePlayerConditionText').textContent=p+'% CONDITION';$('#liveOppConditionText').textContent=o+'% CONDITION'}
    if(item.big||item.type==='ko'){sfx.crit();shake(true)}else if(item.type==='action'&&item.landed){sfx.hit()}else{tone(170,.025,'square',.012,25)}
  }

  function unofficialScoreLine(round){
    const completed=fight.rounds.filter(item=>item.round<=round),score=LOGIC.fightScore(completed),leader=score.player>score.opponent?'YOU AHEAD':score.player<score.opponent?`${fight.o.name.toUpperCase()} AHEAD`:'EVEN';appendFightLine({clock:'',text:`<b>UNOFFICIAL SCORECARD · AFTER ROUND ${round}</b><span>YOU ${score.player} · ${escapeHtml(fight.o.name.toUpperCase())} ${score.opponent} · ${escapeHtml(leader)}</span>`,className:'unofficial-score'});
  }

  function showRoundInterstitial(round,resume){
    const intro=$('#roundInterstitial');if(!intro){resume();return}const score=$('#roundInterstitialScore');$('#roundInterstitialIcon').innerHTML=gameIcon(`round-intro-${round}`,'🔔');$('#roundInterstitialNumber').textContent=`ROUND ${round}`;if(round===1){score.textContent='THE FIGHT STARTS NOW'}else{const totals=LOGIC.fightScore(fight.rounds.filter(item=>item.round<round)),read=totals.player>totals.opponent?'YOU LEAD':totals.player<totals.opponent?'YOU TRAIL':'EVEN';score.textContent=`CORNER SCORE · ${read} ${totals.player}–${totals.opponent}`}intro.classList.remove('leaving');intro.classList.add('active');intro.setAttribute('aria-hidden','false');scheduleFight(()=>{intro.classList.add('leaving');intro.classList.remove('active');scheduleFight(()=>{intro.classList.remove('leaving');intro.setAttribute('aria-hidden','true');resume()},300*fightSpeed)},2000*fightSpeed);
  }

  function playFightTimeline(index){
    if(!fight)return;
    fightTimelineIndex=index;if(index>=fight.timeline.length){if(fight.winner||fight.rounds.length>=3)scheduleFight(()=>finishFightSimulation(),420);else showCornerChoice();return}
    const item=fight.timeline[index];$('#liveRound').textContent=`ROUND ${item.round||1}`;$('#liveClock').textContent=item.clock||'5:00';if(item.type==='roundStart'&&!fight.roundIntros.includes(item.round)){fight.roundIntros.push(item.round);showRoundInterstitial(item.round,()=>playFightTimeline(index));return}if(item.type==='fightMoment'){showFightMoment(item);return}if(item.type==='lastChance'){showLastChanceDecision();return}
    if(item.type==='roundStart')appendFightLine({clock:item.clock,text:`ROUND ${item.round} begins. Both fighters meet in the center.`,className:'round-end'});else{appendFightLine(item);if(item.type==='roundEnd')unofficialScoreLine(item.round)}
    const delay=item.type==='roundStart'?430:item.type==='roundEnd'?560:item.type==='ko'?760:300;
    scheduleFight(()=>playFightTimeline(index+1),delay);
  }

  function officialJudgeScores(f,official=LOGIC.fightScore(f.rounds)){
    if(!f.method.includes('DECISION'))return[];const playerWon=f.winner==='player',baseSupportsWinner=official.player!==official.opponent&&(official.player>official.opponent)===playerWon,winningCard=baseSupportsWinner?official:playerWon?{player:29,opponent:28}:{player:28,opponent:29},dissent={player:winningCard.opponent,opponent:winningCard.player};return f.method==='SPLIT DECISION'?[winningCard,dissent,winningCard]:[winningCard,winningCard,winningCard];
  }

  function renderOfficialJudges(f,official=LOGIC.fightScore(f.rounds)){
    const box=$('#officialJudges'),cards=officialJudgeScores(f,official);box.hidden=!cards.length;if(!cards.length){box.innerHTML='';return cards}box.innerHTML=`<div class="official-judges-title">OFFICIAL JUDGE SCORES</div><div class="official-judge-names"><span>${escapeHtml(f.player.name)}</span><span>${escapeHtml(f.opp.name)}</span></div><div class="official-judge-cards">${cards.map((card,index)=>`<div class="official-judge-card"><small>J${index+1}</small><b><span class="${card.player>card.opponent?'card-winner':''}">${card.player}</span>–<span class="${card.opponent>card.player?'card-winner':''}">${card.opponent}</span></b></div>`).join('')}</div>`;return cards;
  }

  function buildResultDetails(f){
    $('#resultMethod').textContent=`${f.method} · ROUND ${f.finishRound} · ${f.finishClock}`;
    const planAssessment=f.planAssessment||assessFightPlan(f);f.planAssessment=planAssessment;
    const resultTape=$('#resultTape');resultTape.style.setProperty('--player-accent',fighterAccent(state.fighterCity));resultTape.style.setProperty('--opponent-accent',f.o.network?fighterAccent(f.o.networkCity):f.o.color||DEFAULT_FIGHTER_ACCENT);resultTape.innerHTML=`<div class="rt-name player">${f.player.name}</div><div class="rt-vs">VS</div><div class="rt-name opponent">${f.opp.name}</div><div class="rt-stats"><div class="player"><b>${formatStat(f.player.power)}/${formatStat(f.player.speed)}/${formatStat(f.player.chin)}/${formatStat(f.player.cardio)}</b><br><small>PWR · SPD · CHN · CAR</small></div><div class="rt-vs">RATINGS</div><div class="opponent"><b>${formatStat(f.opp.power)}/${formatStat(f.opp.speed)}/${formatStat(f.opp.chin)}/${formatStat(f.opp.cardio)}</b><br><small>PWR · SPD · CHN · CAR</small></div></div><div class="rt-focus">FIGHT PLAN · <b>${fightPlanLabel(f.gamePlan)}</b><br>PLAN GRADE · <b class="plan-grade ${planAssessment.grade.toLowerCase()}">${planAssessment.grade}</b><br>FOCUS · <b>${f.focus}% ${focusTier(f.focus)}</b></div>`;
    const official=LOGIC.fightScore(f.rounds),decision=f.method.includes('DECISION'),judgeScores=renderOfficialJudges(f,official),officialWinner=f.winner==='player'?f.player.name:f.opp.name,judgeLine=judgeScores.map((card,index)=>`J${index+1} ${card.player}-${card.opponent}`).join(' · ');$('#roundStats').innerHTML=`<table class="round-table"><thead><tr><th>RD</th><th>${f.player.name}<br>LAND/DAMAGE</th><th>SCORE</th><th>${f.opp.name}<br>LAND/DAMAGE</th></tr></thead><tbody>${f.rounds.map(r=>`<tr><td>${r.round}</td><td class="${r.scoreP>r.scoreO?'winner-cell':'loser-cell'}">${r.player.landed}/${r.player.attempted} · ${r.player.damage}</td><td>${r.scoreP}-${r.scoreO}</td><td class="${r.scoreO>r.scoreP?'winner-cell':'loser-cell'}">${r.opp.landed}/${r.opp.attempted} · ${r.opp.damage}</td></tr>`).join('')}<tr class="score-total"><td>TOTAL</td><td>${official.player}</td><td>—</td><td>${official.opponent}</td></tr></tbody></table><div class="official-decision"><b>OFFICIAL RESULT</b> · ${officialWinner.toUpperCase()} · ${decision?`${judgeLine} · `:''}${f.method}</div>`;
    const p=f.totals.player,o=f.totals.opp;
    $('#fightTotals').innerHTML=`<div class="totals-grid"><div><b>${p.landed}/${p.attempted}</b></div><div class="label">Strikes</div><div><b>${o.landed}/${o.attempted}</b></div><div><b>${p.sig}</b></div><div class="label">Significant</div><div><b>${o.sig}</b></div><div><b>${p.takedowns}</b></div><div class="label">Takedowns</div><div><b>${o.takedowns}</b></div><div><b>${p.control}s</b></div><div class="label">Control</div><div><b>${o.control}s</b></div><div><b>${p.kd}</b></div><div class="label">Knockdowns</div><div><b>${o.kd}</b></div><div><b>${p.damage}</b></div><div class="label">Damage</div><div><b>${o.damage}</b></div></div>`;
  }

  function renderResultBonuses(notes=[]){
    const summary=$('#resultBonuses');if(!summary)return;summary.hidden=!notes.length;summary.innerHTML=notes.map(note=>`${note.iconName?`${gameIcon(note.iconName,note.icon)} `:''}${escapeHtml(note.text)}`).join(' · ');
  }

  function renderChampionshipSettlement(status,text){const output=$('#championshipResultStatus');if(!output)return;output.hidden=!status;output.className=`championship-result-status ${status||''}`;output.textContent=text||''}
  function authoritativeChampionshipResult(result,pending){
    return LOGIC.championshipSettlementPresentation({status:String(result?.status||''),mode:pending.mode,isChampion:sharedChampionship?.is_champion===true,defenses:sharedChampionship?.defenses,championHandle:sharedChampionship?.champion_handle});
  }
  function settleChampionshipResult(pending=state.pendingChampionshipResult){
    if(!pending||championshipSettlementPromise)return championshipSettlementPromise;
    renderChampionshipSettlement('pending','CONFIRMING TITLE RESULT');
    championshipSettlementPromise=(async()=>{try{
      const result=await SHARED_FEED.settleChampionshipBout(pending);state.pendingChampionshipResult=null;saveState();await connectSharedSocial(true);const official=authoritativeChampionshipResult(result,pending);renderChampionshipSettlement('settled',`${official.heading} · ${official.message}`);if(fight){$('#resultTitle').textContent=official.heading;$('#resultTitle').className=/LOST|EXPIRED|CHANGED/.test(official.heading)?'loss':'win';$('#resultLine').textContent=official.message}trackEvent('championship_result_settled',{settlement_status:String(result?.status||'unknown'),championship_mode:pending.mode});updateUI();toast(official.heading,'#ffd36e','title-world','👑');return result;
    }catch(error){renderChampionshipSettlement('pending','CONFIRMING TITLE RESULT · SAVED FOR RETRY');saveState();console.warn('Championship result settlement will retry.',error);setTimeout(()=>{if(state.pendingChampionshipResult&&!championshipSettlementPromise)settleChampionshipResult()},15000);return null}finally{championshipSettlementPromise=null}})();
    return championshipSettlementPromise;
  }

  function finishFightSimulation(){
    if(!fight||fight.ended)return;fight.ended=true;clearFightTimers();combatLocked=true;ensureDailyCounters();state.dailyCounters.fight++;
    const o=fight.o,basePurse=payoutForOpponent(o),win=fight.winner==='player',winsToday=opponentWinsToday(o),xpTier=LOGIC.opponentXpTier(winsToday,o.min,state.level),dropEligible=LOGIC.fightDropEligible(winsToday),isRematch=(o.meetings||0)>0,rivalry=(o.meetings||0)>=2,ordinaryRival=!o.network&&!o.globalChampionship&&(o.lossesToPlayer||0)>0,playerRating=fight.player.power+fight.player.speed+fight.player.chin+fight.player.cardio,oppRating=fight.opp.power+fight.opp.speed+fight.opp.chin+fight.opp.cardio,upset=win&&oppRating>=playerRating+4,healthLoss=fight.healthLost||0,titleWon=!!(win&&o.globalChampionship&&!fight.championshipBout?.player_is_champion),xpResult=LOGIC.fightXp({playerLevel:state.level,opponentLevel:o.min,won:win,forfeited:!!fight.forfeited,upset,ranked:!!o.network&&!o.globalChampionship,championship:!!o.globalChampionship,titleWon,rival:ordinaryRival,opponentWinsToday:winsToday});let cash=0,fans=0,xp=xpResult.xp,ceoBonus=0,gearDrop=null;const lootNotes=[];o.meetings=(o.meetings||0)+1;
    if(win){
      o.losses=(o.losses||0)+1;o.lossesToPlayer=(o.lossesToPlayer||0)+1;o.rematchAccepted=false;state.wins++;state.winStreak++;state.bestStreak=Math.max(state.bestStreak,state.winStreak);cash=LOGIC.winFightCash({basePurse,hype:state.hype,cashBonus:ownedBonus('cashBonus'),winStreak:state.winStreak,upset,rivalry,variance:rand(.9,1.15)});fans=Math.round(o.fans*(1+state.hype/100)*(1+ownedBonus('prestige')/100)*(upset?1.25:1)*(rivalry?1.15:1)*rand(.9,1.2));receiveMoney(cash,true);fans=changeFollowers(fans);state.hype=clamp(state.hype+xpTier.hypeChange,0,100);sfx.win();confettiBurst();
      if(dropEligible)gearDrop=awardDeterministicGearDrop({opponent:o,upset,rivalry,titleWon,ko:fight.method.includes('KO')});ceoBonus=awardCeoPerformanceBonus({upset,ko:fight.method.includes('KO'),titleWon});cash+=ceoBonus;
      if(o.globalChampionship)lootNotes.push({iconName:'title-world',icon:'👑',text:'CONFIRMING TITLE RESULT'});if(ceoBonus)lootNotes.push({text:`CEO NOTICED · +$${fmt(ceoBonus)} · +3 HYPE`});if(upset)lootNotes.push({iconName:'upset-bonus',icon:'⚡',text:'UPSET BONUS +25%'});if(rivalry)lootNotes.push({iconName:'rivalry-bonus',icon:'🔥',text:'RIVALRY FIGHT BONUS +15%'});if(state.winStreak>1)lootNotes.push({iconName:'win-streak',icon:'🔥',text:`${state.winStreak}-FIGHT WIN STREAK`});ensureRoster()
      $('#resultTitle').textContent='YOU WIN';$('#resultTitle').className='win';$('#resultLine').textContent=fight.lastChanceLanded?`Ten seconds left, behind on the cards, and one haymaker changed everything.`:fight.method==='SUBMISSION'?`${o.name} taps out. Your grappling just made a statement.`:fight.method.includes('KO')?`${o.name} could not answer the damage. Your stock just jumped.`:`The scorecards are in. Your hand gets raised.`;
    }else{
      o.wins=(o.wins||0)+1;o.winsVsPlayer=(o.winsVsPlayer||0)+1;o.rematchAccepted=true;state.losses++;state.winStreak=0;if(!fight.forfeited){cash=LOGIC.lossFightCash(basePurse);fans=Math.round(o.fans*.15);receiveMoney(cash,true);fans=changeFollowers(fans)}state.hype=clamp(state.hype-7,0,100);sfx.lose();
      if(fight.forfeited){$('#resultTitle').textContent='FIGHT FORFEITED';$('#resultLine').textContent=`You left the cage. ${o.name} receives the win, and the loss is official.`}else{$('#resultTitle').textContent='YOU LOST';$('#resultLine').textContent=fight.cornerTowel?`Your corner protected you. ${o.name} gets the TKO win.`:fight.haymakerMiss?'The last-chance haymaker missed, and the counter ended the fight.':fight.method==='SUBMISSION'?`${o.name} forced the tap. Rebuild your defense and come back sharper.`:fight.method.includes('KO')?'The referee saves you from more damage. Back to the gym.':'Close the scorecard, remember the lesson, and come back better.'}$('#resultTitle').className='loss';
    }
    state.dailyOpponentWins.wins[o.key]=LOGIC.nextOpponentXpStage(winsToday,win);
    if(xp)gainXp(xp);xpResult.modifiers.forEach(text=>lootNotes.push({text}));if(win&&xpTier.hypeChange<0)lootNotes.push({text:`STALE MATCHUP · ${xpTier.hypeChange} HYPE · NO COLLECTIBLE DROP`});
    if(healthLoss)$('#resultLine').textContent+=` Fight damage: -${healthLoss} Health.`
    $('#ceoResultSpotlight').hidden=true;
    if(state.activeEndorsement&&!fight.forfeited){
      const deal=endorsementDefs.find(d=>d.id===state.activeEndorsement.id);
      if(deal){
        const sponsorFollowers=changeFollowers(deal.fansPerFight);cash+=deal.perFight;fans+=sponsorFollowers;receiveMoney(deal.perFight,true);state.activeEndorsement.fightsLeft--;
        const contractDone=state.activeEndorsement.fightsLeft<=0;
        const sponsorNote=`SPONSOR: ${deal.brand} +$${fmt(deal.perFight)} +${fmt(sponsorFollowers)} followers${contractDone?' · CONTRACT COMPLETE':''}`;
        lootNotes.push({text:sponsorNote});
        if(contractDone)state.activeEndorsement=null;
      }
    }
    openSocialCycle('fight',{win,opponent:o.name,method:fight.method,winStreak:state.winStreak,injury:win?currentTrainingInjury()?.name||'':'',title:''});
    renderResultBonuses(lootNotes);
    const xpResultLabel=fight.forfeited?'FORFEIT · NO XP':xpTier.resultLabel,planAssessment=fight.planAssessment||assessFightPlan(fight);trackEvent('fight_completed',{result:win?'win':'loss',fight_mode:'planned',fight_focus:fight.focus,focus_tier:focusTier(fight.focus).toLowerCase().replace(/\s+/g,'_'),plan_pace:fight.gamePlan.pace,plan_offense:fight.gamePlan.offense,plan_tactics:fight.gamePlan.tactics,plan_grade:planAssessment.grade.toLowerCase(),plan_modifier:Number(planAssessment.modifier.toFixed(3)),health_lost:healthLoss,method:String(fight.method).toLowerCase().replace(/\s+/g,'_'),finish_round:fight.finishRound,rounds_fought:fight.rounds.length,player_archetype:state.fighterStyle,opponent_archetype:o.tendency,is_rematch:isRematch,is_title:!!o.globalChampionship,title_won:titleWon,upset,rivalry,cash_earned:cash,followers_gained:fans,xp_earned:xp,xp_category:xpResult.category,xp_repeat_tier:xpTier.tier,gear_rarity:gearDrop?.rarity?.toLowerCase()||'none'});if(o.globalChampionship&&fight.championshipBout)state.pendingChampionshipResult={challengeId:fight.championshipBout.challenge_id,challengerId:fight.championshipBout.challenger_id,challengerWon:fight.championshipBout.player_is_champion===true?!win:win,mode:o.titleMode||'challenge'};state.pendingFight=null;pendingResultDrop=gearDrop;resultDropRevealed=false;buildResultDetails(fight);renderChampionshipSettlement(o.globalChampionship?'pending':'',o.globalChampionship?'CONFIRMING TITLE RESULT':'');$('#rewardCash').textContent='+$'+cash;$('#rewardCashLabel').textContent='Earnings';$('#rewardFans').textContent='+'+fans;$('#rewardFansLabel').textContent='Followers';$('#rewardXp').textContent='+'+xp;$('#rewardXpLabel').textContent=xpResultLabel;armResultAction(win?'CLAIM REWARDS':'CONTINUE');const lootBox=$('#lootBox');lootBox.style.display='none';lootBox.className='loot';lootBox.innerHTML='';$('#resultDetails').classList.remove('open');const detailsToggle=$('#detailsToggle');detailsToggle.style.display='';detailsToggle.textContent='SCORECARD';const card=$('#resultModal .result-card');card.classList.remove('revealing','drop-celebration','fight-win','fight-loss');card.classList.add(win?'fight-win':'fight-loss');void card.offsetWidth;card.classList.add('revealing');card.scrollTop=0;writeHistory('result','replace');saveState();if(o.globalChampionship)settleChampionshipResult();scheduleFight(()=>{$('#resultModal').style.display='flex'},180);
  }

  function armResultAction(label){
    clearTimeout(resultActionTimer);resultActionTimer=null;const button=$('#continueBtn');button.disabled=false;button.textContent=label;
  }

  function delayResultActionUnlock(){
    clearTimeout(resultActionTimer);const button=$('#continueBtn');button.disabled=true;resultActionTimer=setTimeout(()=>{resultActionTimer=null;if(button.isConnected)button.disabled=false},500);
  }

  function openDropClaim(drop,context={}){
    if(!drop)return false;pendingResultDrop=drop;pendingDropContext=context;resultDropRevealed=false;const modal=$('#dropClaimModal');$('#dropClaimEyebrow').textContent=context.eyebrow||'SEALED CAGE GRIND PACK';$('#dropClaimTitle').textContent=context.title||'VICTORY DROP';$('#dropClaimMessage').textContent=context.message||'A surprise collectible drop landed after your win.';const rewards=$('#dropClaimRewards'),rewardItems=Array.isArray(context.rewards)?context.rewards:[];rewards.hidden=!rewardItems.length;rewards.innerHTML=rewardItems.map(reward=>`<span>${escapeHtml(reward)}</span>`).join('');$('#dropClaimStage').innerHTML='<img class="drop-claim-pack" src="assets/cage-grind-drop-pack.png?v=2.5.206" alt="Sealed Cage Grind collectible pack">';$('#dropRevealBtn').hidden=false;$('#dropRevealBtn').disabled=false;$('#dropCloseBtn').hidden=true;modal.classList.add('open');modal.setAttribute('aria-hidden','false');requestAnimationFrame(()=>$('#dropRevealBtn').focus());sfx.win();return true
  }
  function revealDropClaim(){
    if(!pendingResultDrop||resultDropRevealed)return false;
    const normalized=LOGIC.normalizeGearDrop(pendingResultDrop,gearRarityOrder),item=normalized&&gearItems.find(entry=>entry.id===normalized.item.id);
    if(!normalized||!item){
      console.error('Cage Grind could not render a gear drop.',pendingResultDrop);resultDropRevealed=true;$('#dropClaimStage').innerHTML='<div class="drop-claim-saved"><b>DROP SAVED</b><span>Your reward is safe in Gear.</span></div>';$('#dropRevealBtn').hidden=true;$('#dropCloseBtn').hidden=false;$('#dropCloseBtn').focus();toast('DROP SAVED · OPEN GEAR TO VIEW IT','#f4c34a');return true;
    }
    const drop=Object.assign({},normalized,{item}),status=drop.isNew?'NEW ITEM':`OWNED ×${drop.count}`;$('#dropClaimStage').innerHTML=collectibleCardHtml(item,{dropStatus:status});$('#dropRevealBtn').hidden=true;$('#dropCloseBtn').hidden=false;resultDropRevealed=true;$('#dropCloseBtn').focus();
    trackEvent('gear_drop_revealed',{gear_id:item.id,gear_rarity:drop.rarity.toLowerCase(),is_new:drop.isNew,drop_reason:drop.reason.toLowerCase().replace(/\s+/g,'_')});
    try{sfx.coin()}catch(error){console.warn('Drop sound unavailable.',error)}
    try{confettiBurst()}catch(error){console.warn('Drop celebration unavailable.',error)}
    if(drop.rarity==='EPIC'||drop.rarity==='LEGENDARY')scheduleFight(()=>{try{confettiBurst()}catch(error){console.warn('Bonus drop celebration unavailable.',error)}},650);
    return true;
  }

  function handleResultAction(){
    if(resultActionTimer)return;
    closeResult()
  }

  function closeResult(){
    const victoryDrop=pendingResultDrop;clearTimeout(resultActionTimer);resultActionTimer=null;stopConfetti();clearFightTimers();$('#resultModal').style.display='none';$('#fightOverlay').classList.remove('active');fight=null;pendingResultDrop=victoryDrop;resultDropRevealed=false;combatLocked=false;fightSpeed=1;updateUI();navTo('home','replace');if(victoryDrop)setTimeout(()=>openDropClaim(victoryDrop,{kind:'victory',eyebrow:'WAIT — ONE MORE THING',title:'VICTORY DROP',message:'A surprise collectible pack landed after your win.'}),180);else requestAnimationFrame(()=>levelUpSummary?showLevelUp(levelUpSummary):showPendingTitleLoss()||showPendingCeoOffice());
  }
  function closeDropClaim(){
    const context=pendingDropContext||{};$('#dropClaimModal').classList.remove('open');$('#dropClaimModal').setAttribute('aria-hidden','true');pendingResultDrop=null;pendingDropContext=null;resultDropRevealed=false;stopConfetti();if(context.kind==='daily')queueMicrotask(maybeGrantInstallReward);if(context.kind==='victory')requestAnimationFrame(()=>levelUpSummary?showLevelUp(levelUpSummary):showPendingTitleLoss()||showPendingCeoOffice());
  }

  function stopConfetti(){
    confettiRun++;if(confettiFrameId!==null)cancelAnimationFrame(confettiFrameId);confettiFrameId=null;const canvas=$('#confetti'),context=canvas&&canvas.getContext('2d');if(context)context.clearRect(0,0,canvas.width,canvas.height);
  }

  function confettiBurst(){
    const c=$('#confetti');if(!c||document.hidden||globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)return false;const r=c.getBoundingClientRect();if(!r.width||!r.height)return false;
    stopConfetti();const run=++confettiRun,dpr=Math.min(1.25,devicePixelRatio||1),x=c.getContext('2d');if(!x)return false;c.width=Math.ceil(r.width*dpr);c.height=Math.ceil(r.height*dpr);x.setTransform(dpr,0,0,dpr,0,0);
    const count=r.width<700?48:64,bits=[],colors=['#6ed7ff','#227cff','#5578ff','#a8e9ff','#ffffff'];for(let i=0;i<count;i++)bits.push({x:r.width/2,y:r.height*.24,vx:rand(-5,5),vy:rand(-10,-3),g:.24,w:rint(3,8),h:rint(4,12),a:rand(0,6),va:rand(-.2,.2),c:colors[rint(0,colors.length-1)]});
    const started=performance.now();let previous=started;function frame(now){if(run!==confettiRun)return;const step=Math.min(2,Math.max(.25,(now-previous)/16.67));previous=now;x.clearRect(0,0,r.width,r.height);for(const b of bits){b.x+=b.vx*step;b.y+=b.vy*step;b.vy+=b.g*step;b.a+=b.va*step;x.save();x.translate(b.x,b.y);x.rotate(b.a);x.fillStyle=b.c;x.fillRect(-b.w/2,-b.h/2,b.w,b.h);x.restore()}if(now-started<1200)confettiFrameId=requestAnimationFrame(frame);else{confettiFrameId=null;x.clearRect(0,0,r.width,r.height)}}confettiFrameId=requestAnimationFrame(frame);return true
  }

  // Global events
  document.addEventListener('pointerdown',initAudio,{once:true});
  document.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;if(e.target.matches('[data-card-flip]')){e.preventDefault();toggleOpponentCard(e.target)}else if(e.target.matches('[data-collectible-flip]')){e.preventDefault();toggleCollectibleCard(e.target)}});
  document.addEventListener('click',e=>{
    const fightMoment=e.target.closest('[data-fight-moment]');if(fightMoment){resolveFightMoment(fightMoment.dataset.fightMoment);return}
    const lastChance=e.target.closest('[data-last-chance]');if(lastChance){resolveLastChance(lastChance.dataset.lastChance);return}
    const crisis=e.target.closest('[data-crisis]');if(crisis){resolveFightCrisis(crisis.dataset.crisis);return}
    const focusChoice=e.target.closest('[data-focus-choice]');if(focusChoice){resolveFocusChoice(focusChoice.dataset.focusChoice);return}
    const focusContinue=e.target.closest('[data-focus-continue]');if(focusContinue){continueAfterFocus();return}
    const planSetting=e.target.closest('[data-plan-setting]');if(planSetting){selectFightPlanSetting(planSetting.dataset.planSetting,planSetting.dataset.planValue);return}
    const fp=e.target.closest('[data-fight-plan]');if(fp){chooseCornerPlan(fp.dataset.fightPlan);return}
    const opponentFilter=e.target.closest('[data-opponent-filter]');if(opponentFilter){state.opponentFilter=opponentFilter.dataset.opponentFilter;saveState();renderOpponents();sfx.tap();return}
    const flip=e.target.closest('[data-card-flip]');if(flip&&!e.target.closest('button')){toggleOpponentCard(flip);return}
    const collectibleFlip=e.target.closest('[data-collectible-flip]');if(collectibleFlip&&!e.target.closest('button')){toggleCollectibleCard(collectibleFlip);return}
    const nav=e.target.closest('[data-nav]');if(nav){navTo(nav.dataset.nav);return}
    const go=e.target.closest('[data-go]');if(go){navTo(go.dataset.go);return}
    const tt=e.target.closest('#trainerToggle');if(tt){if(tt.disabled)return;state.trainerOn=!state.trainerOn;sfx.tap();updateUI();return}
    const tr=e.target.closest('[data-train]');if(tr){handleTrain(+tr.dataset.train);return}
    const sparring=e.target.closest('[data-sparring]');if(sparring){handleSparring(+sparring.dataset.sparring);return}
    const recovery=e.target.closest('[data-recovery]');if(recovery){handleRecovery(+recovery.dataset.recovery);return}
    const hu=e.target.closest('[data-hustle]');if(hu){handleHustle(+hu.dataset.hustle);return}
    const pu=e.target.closest('[data-publicity]');if(pu){handlePublicity(+pu.dataset.publicity);return}
    const en=e.target.closest('[data-endorsement]');if(en){handleEndorsement(+en.dataset.endorsement);return}
    if(undergroundBuzzFeature.handleActionClick(e))return;
    const feedFilterButton=e.target.closest('[data-feed-filter]');if(feedFilterButton){feedFilter=feedFilterButton.dataset.feedFilter==='mentions'?'mentions':'all';renderSocial();$('#socialTimeline').scrollTop=0;sfx.tap();return}
    const feedIntent=e.target.closest('[data-feed-intent]');if(feedIntent){openFighterPostComposer(feedIntent.dataset.feedIntent);return}
    const fighterPostProfile=e.target.closest('[data-fighter-post-target]');if(fighterPostProfile){fighterPostTarget=sharedSocialProfiles.find(item=>item.id===fighterPostProfile.dataset.fighterPostTarget)||null;fighterPostDraftOffset=0;renderFighterPostPreview();sfx.tap();return}
    const ceoProfile=e.target.closest('[data-ceo-profile]');if(ceoProfile){openCeoBio();return}
    const reporterProfile=e.target.closest('[data-reporter-profile]');if(reporterProfile){openReporterBio();return}
    const sponsorProfile=e.target.closest('[data-sponsor-profile]');if(sponsorProfile){openSponsorBio(sponsorProfile.dataset.sponsorProfile);return}
    const feedProfile=e.target.closest('[data-feed-profile]');if(feedProfile){openFighterBio(sharedSocialProfiles.find(item=>item.id===feedProfile.dataset.feedProfile));return}
    const eq=e.target.closest('[data-equip]');if(eq){toggleEquip(eq.dataset.equip,eq);return}
    const st=e.target.closest('[data-style]');if(st){chooseStyle(st.dataset.style);return}
    const city=e.target.closest('[data-city]');if(city){chooseCity(city.dataset.city);return}
    const avatar=e.target.closest('[data-avatar]');if(avatar){chooseAvatar(avatar.dataset.avatar);return}
    const taunt=e.target.closest('[data-taunt-key]');if(taunt){tauntOpponent(taunt.dataset.tauntKey);return}
    const championshipFight=e.target.closest('[data-championship-fight]');if(championshipFight){const opponent=championshipOpponent();if(opponent)openTaleOfTape(opponent);return}
    const championshipRetry=e.target.closest('[data-championship-retry]');if(championshipRetry){championshipRetry.disabled=true;championshipRetry.textContent='CHECKING…';connectSharedSocial(true).finally(renderOpponents);return}
    const fi=e.target.closest('[data-fight-key]');if(fi){const opponent=opponents.find(o=>o.key===fi.dataset.fightKey);if(opponent)openTaleOfTape(opponent);return}
  });
  document.addEventListener('cagegrind:installchange',()=>updateUI());
  document.addEventListener('cagegrind:installed',()=>{const firstDetection=!state.installDetected;state.installDetected=true;if(firstDetection)trackEvent('game_installed');saveState();updateUI()});
  $('#installGameBtn').addEventListener('click',requestGameInstall);
  $('#landingEnterBtn').addEventListener('click',enterGameFromLanding);
  $('#dailyBtn').addEventListener('click',claimDaily);$('#dropRevealBtn').addEventListener('click',revealDropClaim);$('#dropCloseBtn').addEventListener('click',closeDropClaim);$('#continueBtn').addEventListener('click',handleResultAction);$('#levelUpContinue').addEventListener('click',closeLevelUp);
  $('#tapeBackBtn').addEventListener('click',closeFightPreview);$('#tapeFightBtn').addEventListener('click',()=>commitFight());$('#tapeRecoveryBtn').addEventListener('click',visitRecoveryRoom);$('#fightPlanConfirm').addEventListener('click',confirmFightPlan);$('#tapePurseToggle').addEventListener('click',openTapeBreakdown);$('#tapeBreakdownClose').addEventListener('click',()=>closeTapeBreakdown());$('#tapeBreakdownBackdrop').addEventListener('click',()=>closeTapeBreakdown());$('#tapeBreakdown').addEventListener('keydown',e=>{if(e.key==='Escape')closeTapeBreakdown()});
  $('#speedBtn').addEventListener('click',toggleFightSpeed);$('#detailsToggle').addEventListener('click',()=>{const details=$('#resultDetails'),open=!details.classList.contains('open');details.classList.toggle('open',open);$('#detailsToggle').textContent=open?'HIDE STATS':'SCORECARD'});
  $('#autographPrice').addEventListener('input',updateAutographAdvice);
  $('#autographRun').addEventListener('click',runAutographSigning);
  $('#autographCancel').addEventListener('click',closeAutographModal);
  $('#autographModal').addEventListener('click',e=>{if(e.target===$('#autographModal'))closeAutographModal()});
  $('#collectHustleShift').addEventListener('click',closeHustleShift);$('#hustleShiftModal').addEventListener('click',e=>{if(e.target===$('#hustleShiftModal'))closeHustleShift()});$('#hustleShiftModal').addEventListener('keydown',e=>{if(e.key==='Escape')closeHustleShift()});
  $('#collectSparringResult').addEventListener('click',closeSparringSession);$('#sparringSessionModal').addEventListener('click',e=>{if(e.target===$('#sparringSessionModal'))closeSparringSession()});$('#sparringSessionModal').addEventListener('keydown',e=>{if(e.key==='Escape')closeSparringSession()});
  $('#collectRecoveryResult').addEventListener('click',()=>{const restAgain=activeRecoverySession?.treatment?.freeRest&&state.energy<state.maxEnergy;closeRecoverySession();if(restAgain)handleRecovery(recoveryDefs.findIndex(treatment=>treatment.freeRest))});$('#exitRecoveryResult').addEventListener('click',closeRecoverySession);$('#recoverySessionModal').addEventListener('click',e=>{if(e.target===$('#recoverySessionModal'))closeRecoverySession()});$('#recoverySessionModal').addEventListener('keydown',e=>{if(e.key==='Escape')closeRecoverySession()});
  $('#collectPublicityResult').addEventListener('click',closePublicitySession);$('#publicitySessionModal').addEventListener('click',e=>{if(e.target===$('#publicitySessionModal'))closePublicitySession()});$('#publicitySessionModal').addEventListener('keydown',e=>{if(e.key==='Escape')closePublicitySession()});
  undergroundBuzzFeature.bind();
  $('#newFighterNameBtn').addEventListener('click',rerollFighterIdentity);$('#manualFighterNameBtn').addEventListener('click',toggleManualFighterIdentity);$('#manualFighterNameInput').addEventListener('input',updateManualFighterIdentity);$('#manualFighterNameInput').addEventListener('keydown',event=>{if(event.key==='Enter')lockFighterIdentity()});$('#lockFighterNameBtn').addEventListener('click',lockFighterIdentity);
  $('#retireCareerBtn').addEventListener('click',openRetirementDialog);$('#cancelRetireBtn').addEventListener('click',closeRetirementDialog);$('#confirmRetireBtn').addEventListener('click',retireCareer);
  $('#retireCareerModal').addEventListener('click',e=>{if(e.target===$('#retireCareerModal'))closeRetirementDialog()});$('#retireCareerModal').addEventListener('keydown',e=>{if(e.key==='Escape')closeRetirementDialog()});
  $('#fighterBioClose').addEventListener('click',closeFighterBio);
  $('#fighterBioModal').addEventListener('click',e=>{if(e.target===$('#fighterBioModal'))closeFighterBio()});
  $('#fighterBioModal').addEventListener('keydown',e=>{if(e.key==='Escape')closeFighterBio()});
  $('#fighterPostSearch').addEventListener('input',renderFighterPostResults);$('#fighterPostBack').addEventListener('click',()=>{fighterPostTarget=null;$('#fighterPostSearchStep').hidden=false;$('#fighterPostPreviewStep').hidden=true;$('#fighterPostTitle').textContent=STRINGS.social.interactions[fighterPostIntent]?.label||'CHOOSE A FIGHTER';requestAnimationFrame(()=>$('#fighterPostSearch').focus())});$('#fighterPostRedraft').addEventListener('click',()=>{fighterPostDraftOffset++;renderFighterPostPreview();sfx.tap()});$('#fighterPostSend').addEventListener('click',()=>handleFighterInteraction(currentFighterPostDraft(),fighterPostTarget));$('#fighterPostClose').addEventListener('click',closeFighterPostComposer);$('#fighterPostModal').addEventListener('click',e=>{if(e.target===$('#fighterPostModal'))closeFighterPostComposer()});$('#fighterPostModal').addEventListener('keydown',e=>{if(e.key==='Escape')closeFighterPostComposer()});
  $('#ceoOfficeClose').addEventListener('click',closeCeoOffice);
  $('#ceoOfficeModal').addEventListener('click',e=>{if(e.target===$('#ceoOfficeModal'))closeCeoOffice()});
  $('#ceoOfficeModal').addEventListener('keydown',e=>{if(e.key==='Escape')closeCeoOffice()});
  $('#titleLossContinue').addEventListener('click',()=>closeTitleLoss(false));$('#titleLossFight').addEventListener('click',()=>closeTitleLoss(true));
  $('#loadoutFullOk').addEventListener('click',closeLoadoutFullDialog);
  $('#loadoutFullModal').addEventListener('click',e=>{if(e.target===$('#loadoutFullModal'))closeLoadoutFullDialog()});
  $('#loadoutFullModal').addEventListener('keydown',e=>{if(e.key==='Escape')closeLoadoutFullDialog()});
  $('#keepFightingBtn').addEventListener('click',closeForfeitFightDialog);$('#confirmForfeitBtn').addEventListener('click',forfeitFight);
  $('#forfeitFightModal').addEventListener('keydown',e=>{if(e.key==='Escape')closeForfeitFightDialog()});

  // Health heals passively. Energy is restored only through explicit whole-segment rewards.
  setInterval(()=>{
    const oldH=Math.floor(state.health);state.health=clamp(state.health+.12+ownedBonus('healthRegen'),0,state.maxHealth);if(Math.floor(state.health)!==oldH)updateUI()
  },15000);

  const tickerLines=STRINGS.ticker;let ti=0;setInterval(()=>{$('#tickerText').textContent=tickerLines[++ti%tickerLines.length]},5200);
  setInterval(updateDailyResetClocks,1000);

  window.addEventListener('resize',drawHero);
  window.addEventListener('popstate',handleHistoryNavigation);
  window.addEventListener('beforeunload',saveState);
  window.addEventListener('beforeunload',handleFightBeforeUnload);
  hydrateStaticIcons();initStickyDashboard();ensureLoadout();ensureRoster();syncCeoCareerEvents();
  recoveryReport=applyOfflineRecovery();
  updateUI();
  renderLanding();
  if(!state.nameLocked)loadLandingChampionship();
  observeLandingFeatures();
  writeHistory('screen','replace');
  if(state.nameLocked)connectSharedSocial(true);
  const initialLandingMode=landingFeature.status().mode;trackEvent('game_open',{returning_career:initialLandingMode==='returning',setup_complete:initialLandingMode==='returning'});trackEvent('landing_view',{career_state:initialLandingMode});
})();

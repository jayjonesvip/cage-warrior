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
  const formatGain = value => String(Math.round(Number(value)||0));
  const ICON_ASSET_PATH = 'assets/icons/';
  const ICON_ASSET_VERSION = '2.7.44';
  function gameIcon(name,fallback,extension='png'){return `<span class="game-icon" data-game-icon="${name}" aria-hidden="true"><span class="icon-fallback">${fallback}</span><img class="icon-asset" src="${ICON_ASSET_PATH}${name}.${extension}?v=${ICON_ASSET_VERSION}" alt="" onload="this.parentElement.classList.add('asset-ready')" onerror="this.remove()"></span>`}
  function hydrateStaticIcons(){document.querySelectorAll('[data-icon-name]').forEach(el=>{if(el.dataset.iconHydrated)return;const fallback=el.dataset.iconFallback||el.textContent;el.innerHTML=gameIcon(el.dataset.iconName,fallback);el.dataset.iconHydrated='true'})}
  const SAVE_KEY = 'cage-warrior-save-v1';
  const SAVE_BACKUP_KEY = 'cage-warrior-save-backup-v1';
  const STATE_VERSION = 27;
  const ENDORSEMENT_IDS = endorsementDefs.map(item=>item.id);
  let saveWarningShown = false;
  let careerSaveKnown = false;

  const defaultState = {
    version:STATE_VERSION,name:'ROOKIE',nameLocked:false,rookieShowcasePending:false,firstContractPending:false,postFightTutorialSeen:false,fans:0,level:1,xp:0,wins:0,losses:0,winStreak:0,bestStreak:0,attributePoints:0,
    energy:100,maxEnergy:100,health:100,maxHealth:100,hype:0,
    energyRecoveryAt:Date.now(),healthRecoveryAt:Date.now(),
    stats:{power:5,speed:5,chin:5,cardio:5},
    gear:[],gearCounts:{},gearSeed:Math.floor(Math.random()*0xffffffff),gearWinsSinceDrop:0,dailyCounters:{date:'',fight:0},dailyOpponentWins:{date:'',wins:{}},
    activeEndorsement:null,endorsementHistory:[],sponsorAnnouncementPending:'',lastSave:Date.now(),lastDaily:'',installDetected:false,installRewardClaimed:false,
    socialAccountCreated:false,socialFeed:[],socialCycle:0,socialPostedCycle:0,socialSerial:0,socialLastReadSerial:0,socialLastMentionSerial:0,socialProfileId:'',socialLastRemotePostId:0,socialLastRemoteMentionPostId:0,socialConsumedChallengePostIds:[],socialChallengeResults:{},socialRemoteInitialized:false,socialFollowingCount:0,socialHeadlineCounts:{},ceoEvents:[],ceoBonusDate:'',lastTitleLossSeenId:0,hasHeldWorldTitle:false,
    pendingFight:null,pendingChampionshipResult:null,fightPlanPreference:{pace:'slow',offense:'conservative',tactics:'stick'},fightInjury:null,
    roster:[],rosterSerial:0,circuitLossStreak:0,fighterStyle:'',fighterCity:'',fighterAvatar:'',fighterBaseStats:null,fighterDraftAvatar:'',fighterDraftStats:null,equippedGear:[],leagueInitialized:false
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
  let rewardAnimationRun = 0;
  let confettiFrameId = null;
  let confettiRun = 0;
  let levelUpSummary = null;
  let combatLocked = false;
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
  let shareWinPending=false;
  let lastFightShareData=null;
  let pendingCeoPresentation=null;
  let pendingTitleLossPresentation=null;
  const HISTORY_KEY='cageGrind';

  const fighterStyles = [
    {id:'striker',icon:'🥊',name:'STRIKER',text:'+1 Power and Speed. Better stand-up offense and knockout pressure.',stats:{power:1,speed:1},plan:'striker'},
    {id:'grappler',icon:'🔒',name:'GRAPPLER',text:'+1 Power and Cardio. Better takedowns, control, and submissions.',stats:{power:1,cardio:1},plan:'grappler'}
  ];
  function normalizeMajorArchetype(value){return ['control','submission','wrestleBox','wrestle','wrestler','grappler'].includes(value)?'grappler':['pressure','counter','brawler','trickster','technician','endurance','tank','cardio','striker'].includes(value)?'striker':''}
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
  const opponentCountryMeta={USA:['US','United States'],MX:['MX','Mexico'],RUS:['RU','Russia'],BRA:['BR','Brazil'],CAN:['CA','Canada'],IRL:['IE','Ireland'],GBR:['GB','United Kingdom'],JPN:['JP','Japan'],KOR:['KR','South Korea'],NGA:['NG','Nigeria'],THA:['TH','Thailand'],PHI:['PH','Philippines'],CUB:['CU','Cuba'],PR:['PR','Puerto Rico'],AUS:['AU','Australia'],POL:['PL','Poland'],GEO:['GE','Georgia'],ARM:['AM','Armenia'],COL:['CO','Colombia'],ARG:['AR','Argentina'],NED:['NL','Netherlands'],SAM:['WS','Samoa']};
  function opponentCountry(code){const key=String(code||'').toUpperCase(),meta=opponentCountryMeta[key],iso=meta?.[0]||key.slice(0,2);return {code:key||'CG',iso:String(iso||'').toLowerCase(),name:meta?.[1]||key||'Cage Grind'}}
  function opponentCountryBadge(code){const country=opponentCountry(code);return `<span class="fight-country-badge" title="${escapeHtml(country.name)}" aria-label="Fighting out of ${escapeHtml(country.name)}"><img src="assets/flags/${country.iso}.svg?v=${ICON_ASSET_VERSION}" alt="" aria-hidden="true"></span>`}
  const opponentArchetypes=[
    {id:'striker',tag:'STRIKER',tendency:'striker',scout:'Expect combinations, kicks, and knockout pressure. Disrupt the range or force grappling exchanges.',mods:{power:1,speed:1,chin:0,cardio:0}},
    {id:'grappler',tag:'GRAPPLER',tendency:'grappler',scout:'Expect level changes, fence control, and submission attacks. Punish entries and protect position.',mods:{power:1,speed:0,chin:0,cardio:1}}
  ];
  const ROOKIE_SHOWCASE={
    key:'rookie-showcase-vaso-jose-mx',name:'VasoJoseMX',country:'MX',headline:"LET'S SEE WHAT YOU GOT, KID",
    boutLabel:'ROOKIE SHOWCASE · 3 ROUNDS',cardLabel:'ROOKIE SHOWCASE',actionLabel:'TAKE YOUR FIRST FIGHT',
    scout:'A willing rookie with a fragile chin. Stay composed, trust your preparation, and show the matchmaker you belong.'
  };
  const FIRST_CONTRACT={
    key:'first-contract-diego-ramos-br',name:'DiegoRamosBR',country:'BRA',headline:'YOUR FIRST CONTRACT STARTS NOW',
    boutLabel:'FIRST CONTRACT · 3 ROUNDS',cardLabel:'FIRST CONTRACT',actionLabel:'FIGHT DIEGORAMOSBR',
    scout:'A compact grappler with strong cardio and disciplined pressure. Protect your hips, manage the pace, and make your first contract count.'
  };
  const rosterColors=['#b94a35','#377ea6','#7c5836','#9f2c43','#8052a6','#267ca8','#566b85','#2e6aa8','#326f63','#8a6a2e'];
  function rosterPick(list,seed){return list[Math.abs(seed)%list.length]}
  function generatedOpponentIdentity(seed){const country=rosterPick(opponentNameCountries,hashSeed(`country|${seed}`)),first=rosterPick(country.first,hashSeed(`first|${seed}|${country.code}`)),last=rosterPick(country.last,hashSeed(`last|${seed}|${country.code}`));return {name:`${first}${last}${country.code}`,country:country.code}}
  function generatedOpponentRatings(tier,serial,seed,arch,maximumAdvantage=1){
    const base=LOGIC.generatedOpponentBaseRating(tier),difficulty=((serial%3)-1)*fightRule('computerGeneratedOpponentDifficulty.opponentCardDifficultyStep',.7),ratings={};
    for(const key of ['power','speed','chin','cardio'])ratings[key]=Math.max(3,Math.round(base+difficulty+(arch.mods[key]||0)+(((seed>>(key.length%8))%3)-1)*fightRule('computerGeneratedOpponentDifficulty.individualAttributeVariationStep',.45)));
    return LOGIC.capOpponentRatings(ratings,state.stats,maximumAdvantage);
  }
  function generateOpponent(tier){
    const serial=++state.rosterSerial,seed=serial*7919+tier*104729,arch=rosterPick(opponentArchetypes,seed),identity=generatedOpponentIdentity(seed),circuitRatingAdvantage=state.circuitLossStreak>=2?-1:1,ratings=generatedOpponentRatings(tier,serial,seed,arch,circuitRatingAdvantage);
    return {key:`cw-${tier}-${serial}`,name:identity.name,country:identity.country,tag:arch.tag,archetype:arch.id,tendency:arch.tendency,scout:arch.scout,tier,min:tier,max:99,...ratings,fans:Math.round(22*Math.pow(1.48,tier-1)),color:rosterPick(rosterColors,seed),look:seed%10,wins:Math.max(1,tier*2+Math.abs(seed%7)),losses:Math.abs((seed>>>5)%Math.max(2,tier+2)),winsVsPlayer:0,lossesToPlayer:0,meetings:0,rematchAccepted:false,circuitRatingAdvantage,recordInitialized:true,createdAt:Date.now()};
  }
  function rebalanceGeneratedOpponent(opponent){
    const match=/^cw-(\d+)-(\d+)$/.exec(String(opponent?.key||''));if(!match||opponent.network||opponent.rookieShowcase||opponent.firstContract)return;
    const tier=Math.max(1,Number(match[1])||opponent.tier||1),serial=Math.max(1,Number(match[2])||1),seed=serial*7919+tier*104729,arch=rosterPick(opponentArchetypes,seed),rematch=(opponent.winsVsPlayer||0)>0,maximumAdvantage=rematch?1:state.circuitLossStreak>=2?-1:1;opponent.circuitRatingAdvantage=maximumAdvantage;Object.assign(opponent,generatedOpponentRatings(tier,serial,seed,arch,maximumAdvantage));
  }
  function hashSeed(text){let hash=2166136261;for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619)}return hash>>>0}
  function fighterCityCode(cityId){return STRINGS.fighterIdentity?.cityCodes?.[cityId]||String(cityId||'CG').slice(0,3).toUpperCase()}
  function fighterPortraitStyle(identity){const seed=hashSeed(String(identity||'cage-grind')),brightness=(.98+(seed%5)*.01).toFixed(2),contrast=(1+(Math.floor(seed/5)%4)*.01).toFixed(2),saturation=(.98+(Math.floor(seed/20)%5)*.01).toFixed(2),offset=((Math.floor(seed/100)%5)-2)*.4;return `--portrait-brightness:${brightness};--portrait-contrast:${contrast};--portrait-saturation:${saturation};--portrait-offset:${offset.toFixed(1)}%`}
  function applyPortraitStyle(element,identity){const seed=hashSeed(String(identity||'cage-grind'));element.style.setProperty('--portrait-brightness',(.98+(seed%5)*.01).toFixed(2));element.style.setProperty('--portrait-contrast',(1+(Math.floor(seed/5)%4)*.01).toFixed(2));element.style.setProperty('--portrait-saturation',(.98+(Math.floor(seed/20)%5)*.01).toFixed(2));element.style.setProperty('--portrait-offset',`${((Math.floor(seed/100)%5)-2)*.4}%`)}
  function seededRandom(seed){let value=seed>>>0;return ()=>{value+=0x6D2B79F5;let n=value;n=Math.imul(n^n>>>15,n|1);n^=n+Math.imul(n^n>>>7,n|61);return ((n^n>>>14)>>>0)/4294967296}}
  function normalizeOpponentArchetype(o){
    if(!o)return;if(o.rookieShowcase){o.archetype='striker';o.tendency='striker';o.tag='ROOKIE TEST';o.scout=ROOKIE_SHOWCASE.scout;o.portraitAsset=`assets/opponents/vaso-jose.png?v=${ICON_ASSET_VERSION}`;return}if(o.firstContract){o.archetype='grappler';o.tendency='grappler';o.tag='GRAPPLER';o.scout=FIRST_CONTRACT.scout;o.portraitAsset=`assets/opponents/diego-ramos-br.png?v=${ICON_ASSET_VERSION}`;return}const id=normalizeMajorArchetype(o.archetype)||normalizeMajorArchetype(o.tendency)||'striker',arch=opponentArchetypes.find(a=>a.id===id)||opponentArchetypes[0];o.archetype=arch.id;o.tendency=arch.id;o.tag=arch.tag;o.scout=arch.scout;
  }
  function ensureProfessionalRecord(o){if(!o||o.recordInitialized)return;const seed=hashSeed(o.key||`${o.name}|${o.tier}`);o.wins=(Number(o.wins)||0)+Math.max(1,(Number(o.tier)||1)*2+(seed%7));o.losses=(Number(o.losses)||0)+((seed>>>5)%Math.max(2,(Number(o.tier)||1)+2));o.recordInitialized=true}
  function networkOpponentDisplayName(value){const identity=STRINGS.fighterIdentity||{};return LOGIC.displayFighterIdentity(normalizeIdentityName(value),[...(identity.colors||[]),...(identity.origins||[])],[...(identity.weather||[]),...(identity.animals||[]),...(identity.combat||[])],Object.values(identity.cityCodes||{}))}
  function networkOpponentLocation(o){
    const cityId=String(o?.networkCity||'').toLowerCase(),direct=fighterCities.find(city=>city.id===cityId);if(direct)return direct;
    const handle=String(o?.networkHandle||'').toUpperCase(),codes=Object.entries(STRINGS.fighterIdentity?.cityCodes||{}),match=codes.find(([,code])=>handle.endsWith(String(code).toUpperCase())||handle.startsWith(String(code).toUpperCase()));
    return match?fighterCities.find(city=>city.id===match[0])||null:null;
  }
  function rookieShowcaseOpponent(){
    return {key:ROOKIE_SHOWCASE.key,name:ROOKIE_SHOWCASE.name,country:ROOKIE_SHOWCASE.country,tag:'ROOKIE TEST',archetype:'striker',tendency:'striker',scout:ROOKIE_SHOWCASE.scout,portraitAsset:`assets/opponents/vaso-jose.png?v=${ICON_ASSET_VERSION}`,tier:1,min:1,max:99,power:2,speed:2,chin:1,cardio:2,fans:22,color:'#4aa7d8',look:7,wins:0,losses:8,winsVsPlayer:0,lossesToPlayer:0,meetings:0,rematchAccepted:false,recordInitialized:true,rookieShowcase:true,createdAt:Date.now()};
  }
  function ensureRookieShowcaseOpponent(){
    if(!state.rookieShowcasePending)return state.roster.find(o=>o.key===ROOKIE_SHOWCASE.key)||null;
    const existing=state.roster.find(o=>o.key===ROOKIE_SHOWCASE.key);if(existing)return existing;
    let disposableIndex=-1;for(let index=state.roster.length-1;index>=0;index--){const opponent=state.roster[index];if(!opponent.network&&!opponent.rookieShowcase&&opponent.tier===state.level&&!opponentHasHistory(opponent)){disposableIndex=index;break}}if(disposableIndex>=0)state.roster.splice(disposableIndex,1);
    const opponent=rookieShowcaseOpponent();state.roster.unshift(opponent);return opponent;
  }
  function firstContractOpponent(){
    return {key:FIRST_CONTRACT.key,name:FIRST_CONTRACT.name,country:FIRST_CONTRACT.country,tag:'GRAPPLER',archetype:'grappler',tendency:'grappler',scout:FIRST_CONTRACT.scout,portraitAsset:`assets/opponents/diego-ramos-br.png?v=${ICON_ASSET_VERSION}`,tier:1,min:1,max:99,power:5,speed:4,chin:5,cardio:7,fans:35,color:'#267ca8',look:11,wins:2,losses:1,winsVsPlayer:0,lossesToPlayer:0,meetings:0,rematchAccepted:false,recordInitialized:true,firstContract:true,createdAt:Date.now()};
  }
  function ensureFirstContractOpponent(){
    const existing=state.roster.find(o=>o.key===FIRST_CONTRACT.key);if(existing)return existing;
    if(!state.firstContractPending)return null;
    const opponent=firstContractOpponent();state.roster.unshift(opponent);return opponent;
  }
  function ensureRoster(){
    if(!Array.isArray(state.roster))state.roster=[];state.roster=state.roster.filter(o=>!o.championship&&!o.globalChampionship&&(o.firstContract?state.firstContractPending:o.network||(o.tier===state.level&&(o.lossesToPlayer||0)===0)));if(!Number.isFinite(state.rosterSerial))state.rosterSerial=0;
    const circuitRematches=state.roster.filter(o=>!o.network&&!o.rookieShowcase&&!o.firstContract&&(o.winsVsPlayer||0)>0).sort((a,b)=>(Number(b.lastDefeatedPlayerAt)||0)-(Number(a.lastDefeatedPlayerAt)||0)||(Number(b.meetings)||0)-(Number(a.meetings)||0));if(circuitRematches.length>1){const currentRematch=circuitRematches[0];state.roster=state.roster.filter(o=>o.network||o.rookieShowcase||o.firstContract||(o.winsVsPlayer||0)===0||o.key===currentRematch.key)}
    state.roster.forEach(o=>{rebalanceGeneratedOpponent(o);normalizeOpponentArchetype(o);if(o.network&&o.networkHandle)o.name=networkOpponentDisplayName(o.networkHandle);if(o.retired){o.retired=false;delete o.retiredAt}});
    const active=state.roster.filter(o=>o.tier===state.level&&!o.network&&!o.rookieShowcase&&!o.firstContract&&(o.lossesToPlayer||0)===0).length;for(let i=active;i<2;i++)state.roster.push(generateOpponent(state.level));ensureRookieShowcaseOpponent();ensureFirstContractOpponent();
    state.roster.forEach(o=>{normalizeOpponentArchetype(o);ensureProfessionalRecord(o)});
    state.leagueInitialized=true;
    refreshOpponents();
  }
  function networkOpponentFromProfile(profile,tier){
    const id=String(profile?.id||''),handle=normalizeIdentityName(profile?.handle),name=networkOpponentDisplayName(handle),avatar=fighterAvatars.find(item=>item.id===profile?.fighter_avatar),arch=opponentArchetypes.find(item=>item.id===normalizeMajorArchetype(profile?.archetype));
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)||!handle||!name||!avatar||!arch||Number(profile?.level)!==tier)return null;
    const seed=hashSeed(`cage-network-v1|${id}|${tier}`),difficulty=((seed%3)-1)*.7,ratings=LOGIC.networkOpponentRatings(tier,avatar.stats,arch.mods,difficulty);
    return {key:`network-${id}`,network:true,sourceProfileId:id,networkHandle:handle,networkCity:String(profile.city||''),networkPortrait:avatar.asset,fighterAvatar:avatar.id,name,tag:arch.tag,archetype:arch.id,tendency:arch.tendency,scout:arch.scout,tier,min:tier,max:99,...ratings,fans:Math.round(22*Math.pow(1.48,tier-1)),color:fighterAccent(profile.city),look:seed%10,wins:Math.max(0,Math.floor(Number(profile.wins))||0),losses:Math.max(0,Math.floor(Number(profile.losses))||0),winsVsPlayer:0,lossesToPlayer:0,meetings:0,rematchAccepted:false,recordInitialized:true,createdAt:Date.now()};
  }
  function syncRankedOpponents(profiles){
    const existing=new Map(state.roster.filter(o=>o.network&&o.sourceProfileId).map(o=>[o.sourceProfileId,o])),ranked=[];
    for(const profile of Array.isArray(profiles)?profiles:[]){
      if(profile?.id===state.socialProfileId)continue;
      const opponent=networkOpponentFromProfile(profile,Number(profile?.level));if(!opponent)continue;const previous=existing.get(opponent.sourceProfileId);
      if(previous)Object.assign(opponent,{winsVsPlayer:Math.max(0,Number(previous.winsVsPlayer)||0),lossesToPlayer:Math.max(0,Number(previous.lossesToPlayer)||0),meetings:Math.max(0,Number(previous.meetings)||0),rematchAccepted:previous.rematchAccepted===true,createdAt:Number(previous.createdAt)||opponent.createdAt});
      ranked.push(opponent);
    }
    if(ranked.length)state.roster=[...state.roster.filter(o=>!o.network),...ranked];
  }
  function fighterLevelOrder(a,b){return b.tier-a.tier||Number(b.network)-Number(a.network)||String(a.name).localeCompare(String(b.name))}
  function rankedTitleContext(opponent,worldRank){
    const playerIsChampion=sharedChampionship?.is_champion===true,opponentIsChampion=opponent.sourceProfileId===sharedChampionship?.champion_id,fightMode=LOGIC.rankedFightTitleMode({playerIsChampion,defenseUsedToday:sharedChampionship?.defense_used_today===true,opponentIsChampion});
    if(fightMode==='ranked')return Object.assign({},opponent,{worldRank,titleDefenseComplete:playerIsChampion});
    const rematch=!playerIsChampion&&sharedChampionship?.former_champion_rematch===true,titleCooldown=playerIsChampion?sharedChampionship?.defense_used_today===true:sharedChampionship?.daily_bout_used===true;
    return Object.assign({},opponent,{worldRank,globalChampionship:true,championDefense:playerIsChampion,titleMode:playerIsChampion?'defense':rematch?'rematch':'challenge',titleName:'CAGE GRIND WORLD CHAMPIONSHIP',challengeEligible:!titleCooldown,titleCooldown,formerChampionRematch:rematch,defenses:Math.max(0,Number(sharedChampionship?.defenses)||0)});
  }
  function refreshOpponents(){
    const ranking=currentRanking().fighters,ranked=[];
    ranking.forEach((profile,index)=>{if(profile.id===state.socialProfileId||String(profile.handle||'').toLowerCase()===String(state.name||'').toLowerCase())return;let opponent=state.roster.find(item=>item.network&&item.sourceProfileId===profile.id);if(!opponent)opponent=networkOpponentFromProfile(profile,profile.level);if(opponent)ranked.push(rankedTitleContext(opponent,index+1))});
    const showcase=state.roster.filter(item=>item.rookieShowcase&&state.rookieShowcasePending),contract=state.roster.filter(item=>item.firstContract&&state.firstContractPending),circuit=state.roster.filter(item=>!item.network&&!item.rookieShowcase&&!item.firstContract&&item.tier===state.level&&(item.lossesToPlayer||0)===0).sort(fighterLevelOrder).slice(0,2).map(opponent=>Object.assign(opponent,{worldRank:null,circuitFallback:true}));
    opponents=[...showcase,...contract,...circuit,...ranked];
  }
  const fighterSilhouettes=Array.from({length:24},(_,i)=>`assets/silhouettes/fighter-silhouette-${i+1}.png`);
  function spriteIndexForOpponent(o){
    let h=0;
    for(const ch of o.name) h=(h*31+ch.charCodeAt(0))>>>0;
    return h%fighterSilhouettes.length;
  }
  function silhouetteForOpponent(o){return o?.portraitAsset||o?.networkPortrait||fighterSilhouettes[spriteIndexForOpponent(o)]}
  function opponentContext(){return {level:state.level}}
  function opponentState(o){return LOGIC.opponentState(o,opponentContext())}
  function opponentAvailable(o){return LOGIC.opponentAvailable(o,opponentContext())}

  const FIGHT_ROUNDS=fightRule('fightStructure.scheduledRounds',3),FIGHT_ENERGY_COST=fightRule('energyEconomy.fightEnergyCost',25),MINIMUM_ACTION_ENERGY_EXCLUSIVE=fightRule('energyEconomy.minimumEnergyToStartConsumingActionExclusive',0),ENERGY_RECOVERY_INTERVAL=fightRule('energyEconomy.energyRecoveryIntervalMilliseconds',5000),HEALTH_RECOVERY_INTERVAL=fightRule('energyEconomy.healthRecoveryIntervalMilliseconds',60000),OFFLINE_RECOVERY_CAP=fightRule('energyEconomy.offlineRecoveryCapMilliseconds',28800000),DAILY_FIGHT_LIMIT=fightRule('fightStructure.dailyFightLimit',10),MINIMUM_FIGHT_HEALTH=fightRule('fightStructure.minimumHealthForMedicalClearance',20);
  const hasActionEnergy=()=>state.energy>MINIMUM_ACTION_ENERGY_EXCLUSIVE;

  function normalizeState(parsed){
      const source=parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:{};
      const s = Object.assign(structuredClone(defaultState),source);
      LOGIC.normalizeCoreState(s,defaultState,source);
      if((Math.floor(Number(source.version))||0)<27)s.xp=LOGIC.rescaleXpProgress(s.xp,LOGIC.legacyXpRequirement(s.level),LOGIC.xpRequirement(s.level));
      const legacyGear=Array.isArray(s.gear)?s.gear.filter(id=>typeof id==='string'):[];
      const savedCounts=s.gearCounts&&typeof s.gearCounts==='object'&&!Array.isArray(s.gearCounts)?s.gearCounts:{};
      s.gear=[...new Set(legacyGear)];s.gearCounts={};for(const id of s.gear){const legacyCount=legacyGear.filter(x=>x===id).length;s.gearCounts[id]=Math.max(1,legacyCount,Math.floor(Number(savedCounts[id]))||0)}
      s.gearSeed=(Number(s.gearSeed)>>>0)||Math.floor(Math.random()*0xffffffff);s.gearWinsSinceDrop=clamp(Math.floor(Number(s.gearWinsSinceDrop))||0,0,4);
      const currentDate=LOGIC.localDateKey();s.dailyCounters=LOGIC.dailyCountersFor(s.dailyCounters,currentDate);const savedOpponentWins=source.dailyOpponentWins&&typeof source.dailyOpponentWins==='object'&&!Array.isArray(source.dailyOpponentWins)?source.dailyOpponentWins:null,winEntries=savedOpponentWins?.date===currentDate&&savedOpponentWins.wins&&typeof savedOpponentWins.wins==='object'&&!Array.isArray(savedOpponentWins.wins)?Object.entries(savedOpponentWins.wins):[];s.dailyOpponentWins={date:currentDate,wins:Object.fromEntries(winEntries.filter(([key])=>typeof key==='string'&&key.length<=100).map(([key,value])=>[key,clamp(Math.floor(Number(value))||0,0,2)]))};
      const legacySponsorId=ENDORSEMENT_IDS.includes(source.activeEndorsement?.id)?source.activeEndorsement.id:'',legacySponsorHistory=Array.isArray(source.endorsementHistory)?source.endorsementHistory:[],sponsor=LOGIC.sponsorProgress(endorsementDefs,s.fans,[...legacySponsorHistory,legacySponsorId].filter(Boolean)),pendingSponsorId=ENDORSEMENT_IDS.includes(source.sponsorAnnouncementPending)?source.sponsorAnnouncementPending:'';s.activeEndorsement=sponsor.active?{id:sponsor.active.id}:null;s.endorsementHistory=sponsor.history;s.sponsorAnnouncementPending=pendingSponsorId===s.activeEndorsement?.id?pendingSponsorId:'';
      const injurySource=source.fightInjury&&typeof source.fightInjury==='object'?source.fightInjury:null;s.fightInjury=injurySource&&fightInjuryDefs.some(item=>item.id===injurySource.id)&&injurySource.date===currentDate?{id:injurySource.id,date:currentDate}:null;
      s.installDetected=source.installDetected===true;s.installRewardClaimed=source.installRewardClaimed===true;if(s.installRewardClaimed)s.installDetected=true;
      const savedPlan=source.fightPlanPreference&&typeof source.fightPlanPreference==='object'?source.fightPlanPreference:{};s.fightPlanPreference={pace:['slow','fast'].includes(savedPlan.pace)?savedPlan.pace:'slow',offense:['conservative','aggressive'].includes(savedPlan.offense)?savedPlan.offense:'conservative',tactics:['stick','adapt'].includes(savedPlan.tactics)?savedPlan.tactics:'stick'};delete s.opponentFilter;delete s.fightModePreference;
      const pendingTitle=source.pendingChampionshipResult&&typeof source.pendingChampionshipResult==='object'?source.pendingChampionshipResult:null;s.pendingChampionshipResult=pendingTitle&&Number.isSafeInteger(Number(pendingTitle.challengeId))&&/^[0-9a-f-]{36}$/i.test(String(pendingTitle.challengerId||''))?{challengeId:Number(pendingTitle.challengeId),challengerId:String(pendingTitle.challengerId),challengerWon:pendingTitle.challengerWon===true,mode:['challenge','defense','rematch'].includes(pendingTitle.mode)?pendingTitle.mode:'challenge'}:null;
      delete s.focusTextDeck;delete s.lastFocusTextId;delete s.focusInterruptionDeck;delete s.lastFocusInterruptionId;
      s.socialAccountCreated=typeof source.socialAccountCreated==='boolean'?source.socialAccountCreated:(Number(s.fans)||0)>0;s.socialFeed=Array.isArray(s.socialFeed)?s.socialFeed.filter(p=>p&&typeof p==='object').slice(0,30):[];s.socialCycle=Math.max(0,Math.floor(Number(s.socialCycle))||0);s.socialPostedCycle=clamp(Math.floor(Number(s.socialPostedCycle))||0,0,s.socialCycle);s.socialSerial=Math.max(s.socialFeed.length,Math.floor(Number(s.socialSerial))||0);s.socialLastReadSerial=source.socialLastReadSerial===undefined?s.socialSerial:clamp(Math.floor(Number(source.socialLastReadSerial))||0,0,s.socialSerial);s.socialLastMentionSerial=source.socialLastMentionSerial===undefined?s.socialSerial:clamp(Math.floor(Number(source.socialLastMentionSerial))||0,0,s.socialSerial);s.socialProfileId=typeof source.socialProfileId==='string'&&/^[0-9a-f-]{36}$/i.test(source.socialProfileId)?source.socialProfileId:'';s.socialLastRemotePostId=Math.max(0,Math.floor(Number(source.socialLastRemotePostId))||0);s.socialLastRemoteMentionPostId=source.socialLastRemoteMentionPostId===undefined?s.socialLastRemotePostId:Math.max(0,Math.floor(Number(source.socialLastRemoteMentionPostId))||0);s.socialConsumedChallengePostIds=Array.isArray(source.socialConsumedChallengePostIds)?[...new Set(source.socialConsumedChallengePostIds.filter(id=>typeof id==='string'&&/^shared-\d+$/.test(id)))].slice(-100):[];const savedChallengeResults=source.socialChallengeResults&&typeof source.socialChallengeResults==='object'&&!Array.isArray(source.socialChallengeResults)?source.socialChallengeResults:{};s.socialChallengeResults=Object.fromEntries(Object.entries(savedChallengeResults).filter(([id,winner])=>/^shared-\d+$/.test(id)&&typeof winner==='string'&&winner.length<=33).slice(-100));s.socialRemoteInitialized=source.socialRemoteInitialized===true;s.socialFollowingCount=Math.max(0,Math.floor(Number(source.socialFollowingCount))||0);const savedHeadlineCounts=source.socialHeadlineCounts&&typeof source.socialHeadlineCounts==='object'&&!Array.isArray(source.socialHeadlineCounts)?source.socialHeadlineCounts:{};s.socialHeadlineCounts={};for(const key of ['fightWin','fightInjuredWin','fightStreak','fightLoss'])s.socialHeadlineCounts[key]=Math.max(0,Math.floor(Number(savedHeadlineCounts[key]))||0);s.ceoEvents=Array.isArray(source.ceoEvents)?[...new Set(source.ceoEvents.filter(key=>typeof key==='string'&&key.length<=40))].slice(-40):[];s.ceoBonusDate=typeof source.ceoBonusDate==='string'?source.ceoBonusDate:'';s.lastTitleLossSeenId=Math.max(0,Math.floor(Number(source.lastTitleLossSeenId))||0);s.hasHeldWorldTitle=source.hasHeldWorldTitle===true;if(!s.socialAccountCreated)s.socialFollowingCount=0;
      s.roster.forEach(opponent=>delete opponent.reward);
      s.fighterStyle=normalizeMajorArchetype(s.fighterStyle);
      s.rosterSerial=Math.max(0,Number(s.rosterSerial)||0);s.circuitLossStreak=Math.max(0,Math.floor(Number(source.circuitLossStreak))||0);s.fighterStyle=['striker','grappler'].includes(s.fighterStyle)?s.fighterStyle:'';s.fighterCity=['phoenix','los-angeles','chicago','new-york','miami','houston','cleveland','seattle','new-orleans','hawaii','boston','atlanta','san-francisco','denver','tampa-bay','philadelphia','san-antonio','las-vegas','portland','baltimore'].includes(s.fighterCity)?s.fighterCity:'';s.fighterAvatar=fighterAvatars.some(a=>a.id===s.fighterAvatar)?s.fighterAvatar:'';const avatar=fighterAvatars.find(a=>a.id===s.fighterAvatar);s.fighterBaseStats=avatar&&validFighterAllocation(s.fighterBaseStats)?Object.assign({},s.fighterBaseStats):avatar?Object.assign({},avatar.stats):null;if(avatar&&!s.fighterStyle)s.fighterStyle=LOGIC.fighterArchetypeFromStats(s.fighterBaseStats);if(!avatar)s.fighterStyle='';s.fighterDraftAvatar=!avatar&&fighterAvatars.some(a=>a.id===source.fighterDraftAvatar)?source.fighterDraftAvatar:'';s.fighterDraftStats=!avatar&&validFighterAllocation(source.fighterDraftStats)?Object.assign({},source.fighterDraftStats):null;delete s.milestones;s.roster=Array.isArray(s.roster)?s.roster.filter(o=>!o.championship&&!o.globalChampionship):[];s.equippedGear=Array.isArray(s.equippedGear)?s.equippedGear.filter(id=>s.gear.includes(id)):[];s.leagueInitialized=source.leagueInitialized===true;
      const coreReady=!!(s.fighterStyle&&s.fighterCity&&s.fighterAvatar&&validFighterAllocation(s.fighterBaseStats)),legacyHandle=normalizeIdentityName(source.socialHandle),legacyName=normalizeIdentityName(source.name);s.nameLocked=coreReady&&(source.nameLocked===undefined?true:source.nameLocked===true);s.name=s.nameLocked?(legacyHandle||legacyName||'cagefighter'):'ROOKIE';s.rookieShowcasePending=source.rookieShowcasePending===undefined?s.nameLocked&&s.level===1&&s.wins+s.losses===0:source.rookieShowcasePending===true;s.firstContractPending=LOGIC.firstContractPending({savedPending:source.firstContractPending,nameLocked:s.nameLocked,level:s.level,wins:s.wins,losses:s.losses});delete s.socialHandle;
      s.version=STATE_VERSION;
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
  function localFightNightDay(date=new Date()){return new Intl.DateTimeFormat('en-US',{weekday:'long'}).format(date).toUpperCase()}
  function fightPosterDate(date=new Date()){const parts=new Intl.DateTimeFormat('en-US',{weekday:'short',month:'short',day:'numeric'}).formatToParts(date),part=type=>parts.find(item=>item.type===type)?.value||'';return `${part('weekday').toUpperCase()} · ${part('month').toUpperCase()} ${part('day')}`}
  function applyOfflineRecovery(){
    const now=Date.now(),recovered=LOGIC.passiveRecovery(state,now,OFFLINE_RECOVERY_CAP,{energy:energyRecoveryInterval(),health:healthRecoveryInterval()});
    let refunded=0;if(state.pendingFight){refunded=clamp(Number(state.pendingFight.cost)||FIGHT_ENERGY_COST,0,state.maxEnergy);state.energy=clamp(state.energy+refunded,0,state.maxEnergy);state.pendingFight=null}
    return recovered.energy||recovered.health||refunded?{...recovered,refunded}:null;
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
    $,logic:LOGIC,getState:()=>state,getRank:()=>rankName(),getChampionship:()=>sharedChampionship,setChampionship:setSharedChampionship,sharedFeed:SHARED_FEED,sharedUi:SHARED_UI,trackEvent,tap:()=>sfx.tap(),onEntered:()=>setTimeout(()=>{showRecoveryReport();if(!offerRookieShowcase())offerFirstContractOpponent()},180),onChampionshipChange:renderOpponents
  });
  function enterGameFromLanding(){landingFeature.enter()}
  function cageStatus(){
    return rankName();
  }
  function xpNeed(){return LOGIC.xpRequirement(state.level)}
  function effectiveStat(key){
    let v=state.stats[key],style=fighterStyles.find(s=>s.id===state.fighterStyle);if(style&&style.stats[key])v+=style.stats[key];
    for(const id of state.equippedGear){const g=gearItems.find(x=>x.id===id);if(g&&g.stat===key)v+=g.bonus}
    return Math.max(1,Math.round(Number(v)||1));
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
  function validFighterAllocation(stats){return LOGIC.validFighterAllocation(stats)}
  function awardCeoPerformanceRecognition({upset=false,ko=false,titleWon=false}={}){const date=todayKey(),qualifies=!titleWon&&(upset||ko),roll=hashSeed(`${state.name}|${state.wins}|${date}|ceo-recognition-v1`)%100;if(!qualifies||state.ceoBonusDate===date||roll>=10)return 0;state.ceoBonusDate=date;state.hype=clamp(state.hype+3,0,100);publishCeoEvent(`performance_bonus_${state.wins}`);trackEvent('ceo_performance_recognition',{hype_bonus:3,upset,ko});return 3}
  function gearCount(id){return Math.max(0,Math.floor(Number(state.gearCounts&&state.gearCounts[id]))||0)}
  function ownedBonus(prop){return state.gear.reduce((sum,id)=>{const g=gearItems.find(x=>x.id===id);return sum+(g&&g[prop]?g[prop]:0)},0)}
  function ownedBestBonus(prop){return state.equippedGear.reduce((best,id)=>{const item=gearItems.find(entry=>entry.id===id);return Math.max(best,Number(item?.[prop])||0)},0)}
  function ownedCollectionBestBonus(prop){return state.gear.reduce((best,id)=>{const item=gearItems.find(entry=>entry.id===id);return Math.max(best,Number(item?.[prop])||0)},0)}
  function energyRecoveryInterval(){return Math.max(4000,ENERGY_RECOVERY_INTERVAL-ownedBestBonus('energyRecoverySpeed'))}
  function healthRecoveryInterval(){return Math.max(30000,HEALTH_RECOVERY_INTERVAL-ownedCollectionBestBonus('healthRecoverySpeed'))}
  function syncSponsorProgress(announce=true){const before=state.activeEndorsement?.id||'',beforeSponsor=endorsementDefs.find(item=>item.id===before),beforeIndex=endorsementDefs.findIndex(item=>item.id===before),previouslySponsored=new Set(state.endorsementHistory),progress=LOGIC.sponsorProgress(endorsementDefs,state.fans,state.endorsementHistory),after=progress.active?.id||'',afterIndex=progress.activeIndex;state.activeEndorsement=progress.active?{id:progress.active.id}:null;state.endorsementHistory=progress.history;if(announce&&after!==before){if(beforeSponsor&&afterIndex<beforeIndex){state.sponsorAnnouncementPending='';publishSponsorDrop(beforeSponsor);trackEvent('sponsor_dropped',{sponsor_id:beforeSponsor.id,followers:state.fans,followers_required:beforeSponsor.followersRequired})}else if(progress.active){const returning=previouslySponsored.has(progress.active.id);state.sponsorAnnouncementPending=progress.active.id;publishSponsorSigning(progress.active,{returning});trackEvent(returning?'sponsor_returned':'sponsor_unlocked',{sponsor_id:progress.active.id,followers:state.fans,followers_required:progress.active.followersRequired})}}return progress}
  function changeFollowers(amount){if(!state.socialAccountCreated)return 0;const before=state.fans,value=Math.round(Number(amount)||0);state.fans=Math.max(0,before+value);syncSponsorProgress();if(state.sponsorAnnouncementPending&&!fight)setTimeout(()=>showPendingSponsor(),0);return state.fans-before}
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
  function chooseGearWithDuplicateReroll(pool,random){
    let item=pool[Math.floor(random()*pool.length)];
    if(state.gear.includes(item.id)&&pool.length>1){const rerollPool=pool.filter(candidate=>candidate.id!==item.id);item=rerollPool[Math.floor(random()*rerollPool.length)]}
    return item;
  }
  function awardDeterministicGearDrop({opponent,titleWon=false,guaranteed=false,progressSteps=1}){
    state.gearWinsSinceDrop=LOGIC.nextVictoryPackProgress(state.gearWinsSinceDrop,progressSteps);
    const random=seededRandom(hashSeed(`${state.gearSeed}|${state.wins}|${opponent.key}|${state.level}|gear-v1`)),packReady=LOGIC.victoryPackReady(state.gearWinsSinceDrop);
    if(!guaranteed&&!titleWon&&!packReady)return null;
    const minRarity=titleWon?'RARE':'COMMON',minRank=gearRarityOrder.indexOf(minRarity);let rarity=rollGearRarity(state.level,random(),minRarity),rank=gearRarityOrder.indexOf(rarity),pool=eligibleGearAtLevel(state.level,rarity);
    for(let r=rank-1;!pool.length&&r>=minRank;r--){rarity=gearRarityOrder[r];pool=eligibleGearAtLevel(state.level,rarity)}
    for(let r=rank+1;!pool.length&&r<gearRarityOrder.length;r++){rarity=gearRarityOrder[r];pool=eligibleGearAtLevel(state.level,rarity)}
    if(!pool.length)return null;
    const item=chooseGearWithDuplicateReroll(pool,random),isNew=!state.gear.includes(item.id);if(isNew)state.gear.push(item.id);state.gearCounts[item.id]=gearCount(item.id)+1;state.gearWinsSinceDrop=0;ensureLoadout();
    return {item,rarity,count:state.gearCounts[item.id],isNew,guaranteed:true,reason:guaranteed?'FIRST WIN DROP':titleWon?'CHAMPIONSHIP DROP':'VICTORY PACK'};
  }
  function awardDailyCollectible(date){
    const random=seededRandom(hashSeed(`${state.gearSeed}|${date}|${state.level}|daily-collectible-v1`)),minRank=0;let rarity=rollGearRarity(state.level,random()),rank=gearRarityOrder.indexOf(rarity),pool=eligibleGearAtLevel(state.level,rarity);
    for(let r=rank-1;!pool.length&&r>=minRank;r--){rarity=gearRarityOrder[r];pool=eligibleGearAtLevel(state.level,rarity)}
    for(let r=rank+1;!pool.length&&r<gearRarityOrder.length;r++){rarity=gearRarityOrder[r];pool=eligibleGearAtLevel(state.level,rarity)}
    if(!pool.length)return null;const item=chooseGearWithDuplicateReroll(pool,random),isNew=!state.gear.includes(item.id);if(isNew)state.gear.push(item.id);state.gearCounts[item.id]=gearCount(item.id)+1;ensureLoadout();return {item,rarity,count:state.gearCounts[item.id],isNew,guaranteed:true,reason:'DAILY DROP'};
  }
  function victoryPackResultHtml({earned=false,eligible=false,steps=0,lowerLevel=false,repeatEligible=true,titleWon=false,firstCareerWin=false}={}){
    const progress=earned?4:clamp(Math.floor(Number(state.gearWinsSinceDrop))||0,0,4),title=earned?'VICTORY PACK EARNED':eligible?`VICTORY PACK ${progress}/4`:'VICTORY PACK UNCHANGED';
    let detail=progress>=3?'NEXT ELIGIBLE WIN GUARANTEES A PACK':'WIN AT YOUR LEVEL OR HIGHER TO ADVANCE';
    if(earned)detail=titleWon?'TITLE WIN · RARE+ PACK GUARANTEED':firstCareerWin?'FIRST WIN PACK GUARANTEED':'METER COMPLETE · PACK READY';
    else if(lowerLevel)detail='LOWER-LEVEL OPPONENTS DO NOT ADVANCE THE METER';
    else if(!repeatEligible)detail='THIS REPEAT WIN DOES NOT ADVANCE THE METER';
    else if(steps===2)detail='PERFORMANCE WIN · +2 VICTORY PACK PROGRESS';
    return `<div class="victory-pack-result-head"><span>${title}</span><b>${progress}/4</b></div><span class="victory-pack-result-track"><i style="width:${progress*25}%"></i></span><small>${detail}</small>`;
  }
  function ensureDailyCounters(){
    const today=todayKey();state.dailyCounters=LOGIC.dailyCountersFor(state.dailyCounters,today);if(state.dailyOpponentWins?.date!==today)state.dailyOpponentWins={date:today,wins:{}};if(state.fightInjury?.date!==today)state.fightInjury=null;
  }
  function opponentWinsToday(o){ensureDailyCounters();return clamp(Math.floor(Number(state.dailyOpponentWins.wins[o?.key]))||0,0,2)}
  function opponentXpTier(o){return LOGIC.opponentXpTier(opponentWinsToday(o),o?.min,state.level)}
  function currentFightInjury(){return fightInjuryDefs.find(entry=>entry.id===state.fightInjury?.id)||null}
  function awardInstallCollectible(){const drop=awardDailyCollectible('install-reward-v1');if(drop)drop.reason='INSTALL DROP';return drop}
  function sessionsLeft(type,max){ensureDailyCounters();return Math.max(0,max-(state.dailyCounters[type]||0))}
  function setLimitBadge(selector,text){const badge=$(selector);if(!badge)return;badge.textContent=text;badge.classList.toggle('exhausted',/^0\b.*\bLEFT$/.test(text)||text==='FIGHT TO UNLOCK')}
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
    win(){[392,523,659,784].forEach((f,i)=>setTimeout(()=>tone(f,.18,'square',.04,70),i*85))},
    lose(){tone(180,.3,'sawtooth',.04,-130)},
    rage(){noise(.25,.12);tone(70,.35,'sawtooth',.07,250)},
    level(){[523,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,.13,'triangle',.04),i*70))},
    rewardGood(step=0){const base=460+step*75;tone(base,.08,'triangle',.028,170);setTimeout(()=>tone(base+190,.11,'sine',.024,90),65)},
    rewardBad(negative=false){tone(negative?185:235,.18,'sawtooth',.028,negative?-125:-80);if(negative)noise(.055,.025)}
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

  function flashAttributeStats(skills,gain=1){
    const punch=`+${formatGain(gain)}`;
    skills.forEach(skill=>{const card=$(`#${skill}Stat`)?.closest('.hud-attribute');if(!card)return;card.dataset.statPunch=punch;card.classList.remove('stat-rewarded');void card.offsetWidth;card.classList.add('stat-rewarded');clearTimeout(card._rewardTimer);card._rewardTimer=setTimeout(()=>{card.classList.remove('stat-rewarded');delete card.dataset.statPunch},1900)});
  }

  function renderRecoveryClocks(){
    const energyStatus=$('#energyRecoveryStatus'),healthStatus=$('#healthRecoveryStatus');if(!energyStatus||!healthStatus)return;
    energyStatus.hidden=state.energy>=state.maxEnergy;energyStatus.textContent=`CHARGING · FULL IN ${LOGIC.formatCountdown(LOGIC.recoveryTimeRemaining(state.energy,state.maxEnergy,state.energyRecoveryAt,energyRecoveryInterval()))}`;
    healthStatus.hidden=state.health>=state.maxHealth;healthStatus.textContent=`RECOVERING · FULL IN ${LOGIC.formatCountdown(LOGIC.recoveryTimeRemaining(state.health,state.maxHealth,state.healthRecoveryAt,healthRecoveryInterval()))}`;
  }
  function renderResourceHud(){
    const energyNow=Math.floor(state.energy),healthNow=Math.floor(state.health);
    if(lastShownEnergy!==null&&energyNow<lastShownEnergy)flashResource('energy',lastShownEnergy-energyNow);
    if(lastShownHealth!==null&&healthNow<lastShownHealth)flashResource('health',lastShownHealth-healthNow);
    lastShownEnergy=energyNow;lastShownHealth=healthNow;
    $('#hudEnergyText').textContent=`${energyNow}%`;$('#energyBattery').setAttribute('aria-label',`Energy ${energyNow} percent`);$$('#energyBattery i').forEach((segment,index)=>segment.style.setProperty('--charge',`${clamp((state.energy-index*25)/25*100,0,100)}%`));$('#energyHud').classList.toggle('critical',state.energy<=25);
    $('#hudHealthText').textContent=`${healthNow}/${state.maxHealth}`;$('#hudHealthBar').style.width=(state.health/state.maxHealth*100)+'%';$('#healthHud').classList.toggle('critical',LOGIC.resourceIsCritical(state.health,state.maxHealth));
    renderRecoveryClocks();
  }
  function updatePassiveRecovery(){
    const recovered=LOGIC.passiveRecovery(state,Date.now(),OFFLINE_RECOVERY_CAP,{energy:energyRecoveryInterval(),health:healthRecoveryInterval()});
    if(recovered.energy>0)flashRecoveryResources({energy:recovered.energy,health:0});
    if(recovered.energy||recovered.health){saveState();if(state.nameLocked){renderResourceHud();$('#fightInjuryWarning').hidden=state.health>=state.maxHealth;if(fight&&!combatLocked&&$('#fightOverlay').classList.contains('active')&&!$('#tapeStage').classList.contains('hidden'))fillTape(fight)}}else renderRecoveryClocks();
  }

  function flashRecoveryResources(restored){
    [['energy',restored.energy],['health',restored.health]].forEach(([kind,value])=>{const amount=Number(value)||0;if(amount<=0)return;const hud=$(`#${kind}Hud`),delta=$(`#hud${kind[0].toUpperCase()+kind.slice(1)}Delta`);hud.classList.remove('resource-restored');void hud.offsetWidth;hud.classList.add('resource-restored');delta.textContent=`+${formatGain(amount)}`;delta.style.color='#78dcff';delta.classList.remove('show');void delta.offsetWidth;delta.classList.add('show');clearTimeout(hud._restoreTimer);hud._restoreTimer=setTimeout(()=>hud.classList.remove('resource-restored'),1900);clearTimeout(delta._restoreTimer);delta._restoreTimer=setTimeout(()=>delta.classList.remove('show'),1900)});
  }

  function gainXp(amount){
    state.xp+=amount;const startingLevel=state.level;
    let leveled=false;
    while(state.xp>=xpNeed()){
      state.xp-=xpNeed();state.level++;LOGIC.applyLevelUpResources(state,false);leveled=true;
    }
    if(leveled){const previous=levelUpSummary;levelUpSummary={fromLevel:previous?.fromLevel||startingLevel,toLevel:state.level};trackEvent('level_up',{from_level:startingLevel,to_level:state.level,levels_gained:state.level-startingLevel});ensureRoster();if(state.socialAccountCreated)connectSharedSocial(true)}
  }
  function showLevelUp(summary){if(!summary)return;const levels=summary.toLevel-summary.fromLevel,loadoutUnlocked=summary.fromLevel<8&&summary.toLevel>=8;$('#levelUpNumber').textContent=summary.toLevel;$('#levelUpTitle').textContent=rankName();$('#levelUpFrom').textContent=`LEVEL ${summary.fromLevel} → LEVEL ${summary.toLevel}`;$('#levelUpHealth').textContent=`+${levels*5}`;$('#levelUpNote').textContent=`Maximum Health increased. ${loadoutUnlocked?'Four-slot Fight Gear loadout unlocked.':'New competition is now available.'}`;const modal=$('#levelUpModal');modal.classList.add('active');modal.setAttribute('aria-hidden','false');sfx.level();vibrate([35,35,65,35,90]);confettiBurst();clearTimeout(modal._burstTimer);modal._burstTimer=setTimeout(confettiBurst,620)}
  function closeLevelUp(){const modal=$('#levelUpModal');clearTimeout(modal._burstTimer);modal._burstTimer=null;stopConfetti();modal.classList.remove('active');modal.setAttribute('aria-hidden','true');levelUpSummary=null;sfx.tap();updateUI();requestAnimationFrame(()=>showPendingTitleLoss()||showPendingCeoOffice())}
  function spendEnergy(n){const energySpent=LOGIC.spendEnergy(state,n);if(!energySpent){toast('ENERGY IS EMPTY · CHARGING AUTOMATICALLY','#ff766d');return 0}return energySpent}

  function updateUI(){
    const careerRank=rankName(),rankText=$('#rankText');$('#fightNightDay').textContent=localFightNightDay();$('#fighterName').textContent=state.name;$('#levelText').textContent=`LVL ${state.level}`;rankText.textContent=careerRank;rankText.classList.toggle('world-champion',careerRank==='WORLD CHAMPION');
    $('#progressText').textContent=state.attributePoints?`${state.attributePoints} POINT${state.attributePoints===1?'':'S'}`:(currentRanking()?.position?`RANK #${currentRanking().position}`:'UNRANKED');$('#recordText').textContent=`${state.wins}-${state.losses}`;$('#cageStatus').textContent=cageStatus();$('#heroLevel').textContent=`LVL ${state.level}`;
    const victoryPackProgress=clamp(Math.floor(Number(state.gearWinsSinceDrop))||0,0,4),victoryPackMeter=$('#victoryPackMeter');$('#victoryPackProgressText').textContent=`${victoryPackProgress} / 4 WINS`;$('#victoryPackFill').style.width=`${victoryPackProgress*25}%`;$('#victoryPackTrack').setAttribute('aria-valuenow',String(victoryPackProgress));$('#victoryPackHint').textContent=victoryPackProgress>=3?'NEXT ELIGIBLE WIN GUARANTEES':'WIN AT YOUR LEVEL OR HIGHER';victoryPackMeter.classList.toggle('ready',victoryPackProgress>=3);
    renderResourceHud();
    const currentXp=Math.floor(state.xp),neededXp=xpNeed();$('#xpText').textContent=`${currentXp}/${neededXp}`;$('#careerXpLevel').textContent=`LEVEL ${state.level} → LEVEL ${state.level+1}`;$('#careerXpProgress').textContent=`${Math.max(0,neededXp-currentXp)} XP NEEDED`;$('#careerXpProgressMeta').textContent=`${currentXp} / ${neededXp} XP`;$('#careerXpFill').style.width=`${clamp(currentXp/Math.max(1,neededXp)*100,0,100)}%`;$('#careerXpTrack').setAttribute('aria-valuemax',String(neededXp));$('#careerXpTrack').setAttribute('aria-valuenow',String(currentXp));
    $('#hypeText').textContent=Math.floor(state.hype)+'%';
    const fightInjury=currentFightInjury(),attributesRow=$('.hud-attributes-row');attributesRow.classList.toggle('injured',!!fightInjury);attributesRow.setAttribute('aria-label',fightInjury?`Fighter attributes reduced by ${fightInjury.name}`:'Fighter attributes');
    ['power','speed','chin','cardio'].forEach(k=>{const value=effectiveStat(k);$('#'+k+'Stat').textContent=formatStat(value);$('#'+k+'Mini').style.width=clamp(value*4,5,100)+'%'});
    $('#dailyBtn').disabled=false;$('#dailyBtnLabel').textContent='CLAIM DAILY DROP';$('#dailyDropCountdown').hidden=true;
    renderCareer();renderAttributeAssignment();renderSocial();renderGear();renderOpponents();saveState();if(state.installDetected&&!state.installRewardClaimed)queueMicrotask(maybeGrantInstallReward);
  }

  const championshipResetCopy=SHARED_UI.championshipResetCopy;

  function renderCareer(){
    const style=currentStyle(),city=currentCity(),avatar=currentAvatar(),allocationValid=!!avatar&&validFighterAllocation(state.fighterBaseStats),coreReady=!!(style&&city&&avatar&&allocationValid),ready=coreReady&&state.nameLocked,completed=Number(!!city)+Number(!!avatar&&allocationValid&&!!style)+Number(state.nameLocked),progress=Math.round(completed/3*100),pwa=globalThis.CAGE_PWA;
    $('#app').style.setProperty('--fighter-accent',city?.accent||DEFAULT_FIGHTER_ACCENT);applyPortraitStyle($('#app'),state.name);
    if(pwa?.isInstalled?.())state.installDetected=true;
    const nativeInstall=!!pwa?.installAvailable?.(),dailyAvailable=ready&&state.lastDaily!==todayKey(),installAvailable=ready&&!dailyAvailable&&!state.installDetected&&!state.installRewardClaimed,dailyClaimed=ready&&!dailyAvailable&&!installAvailable,gearDropOffer=$('#gearDropOffer'),dailyButton=$('#dailyBtn'),dailyCountdown=$('#dailyDropCountdown'),gearNav=$('.navbtn[data-nav="gear"]');gearDropOffer.hidden=!ready;gearDropOffer.classList.toggle('claimed',dailyClaimed);gearNav.classList.toggle('drop-ready',dailyAvailable);gearNav.setAttribute('aria-label',dailyAvailable?'Gear, Daily Drop ready':'Gear');dailyButton.hidden=installAvailable;dailyButton.disabled=!dailyAvailable;dailyCountdown.hidden=!dailyClaimed;$('#installGameBtn').hidden=!installAvailable;$('#installGameBtn').disabled=false;if(dailyAvailable){$('#gearDropEyebrow').textContent='ONE FREE PACK EVERY DAY';$('#gearDropTitle').textContent='DAILY DROP';$('#gearDropDescription').textContent='Guaranteed collectible';$('#dailyBtnLabel').textContent='CLAIM DAILY DROP'}else if(installAvailable){$('#gearDropEyebrow').textContent=nativeInstall?'FREE PACK AFTER INSTALL':'INSTALL FROM YOUR BROWSER';$('#gearDropTitle').textContent='TAKE CAGE GRIND WITH YOU';$('#gearDropDescription').textContent='Install for faster access, offline play, and a free collectible drop'}else if(dailyClaimed){$('#gearDropEyebrow').textContent='TODAY’S PACK CLAIMED';$('#gearDropTitle').textContent='DAILY DROP';$('#gearDropDescription').textContent='Next free pack at your local midnight';$('#dailyBtnLabel').textContent='CLAIMED · NEXT DROP IN'}$('#app').classList.toggle('career-setup',!ready);$('.resource-hud').hidden=!ready;$('.bottomnav').hidden=!ready;$('#fighterBuilderIntro').hidden=ready;$('#builderProgressStep').textContent=`${completed} OF 3 COMPLETE`;$('#builderProgressPercent').textContent=`${progress}%`;$('#builderProgressFill').style.width=`${progress}%`;$('#builderProgressTrack').setAttribute('aria-valuenow',String(progress));$('#citySetup').hidden=!!city;$('#fighterSetup').hidden=!city||!!avatar;$('#fighterNameSetup').hidden=!coreReady||state.nameLocked;if(coreReady&&!state.nameLocked&&!identitySuggestion)identitySuggestion=randomIdentitySuggestion();const identityDisplay=$('#fighterNameSuggestion'),manualInput=$('#manualFighterNameInput'),nameRule=$('#fighterNameRule'),manualValid=manualIdentityName(identityManualValue);identityDisplay.textContent=identitySuggestion||state.name;identityDisplay.hidden=identityManualMode;manualInput.hidden=!identityManualMode;nameRule.hidden=!identityManualMode;if(document.activeElement!==manualInput)manualInput.value=identityManualValue||identitySuggestion;manualInput.disabled=identityPending;manualInput.classList.toggle('invalid',identityManualMode&&!!identityManualValue&&!manualValid);nameRule.classList.toggle('invalid',identityManualMode&&!!identityManualValue&&!manualValid);$('#newFighterNameBtn').disabled=identityPending||identityShufflePending;$('#manualFighterNameBtn').disabled=identityPending||identityShufflePending;$('#manualFighterNameBtn').textContent=identityManualMode?'USE SUGGESTION':'MANUAL ENTRY';$('#lockFighterNameBtn').disabled=identityPending||identityShufflePending||(identityManualMode&&!manualValid);$('#lockFighterNameBtn').textContent=identityPending?'CHECKING NAME…':'READY';$('#careerIdentityStatus').textContent='LOCKED IN';$('#homeCityText').textContent=city?city.name:'NOT SELECTED';$('#homeStyleText').textContent=style?style.name:'NOT SELECTED';$('#careerFollowersText').textContent=fmt(state.fans);
    const homeRanking=ready?currentRanking():null;$('#homeRankText').textContent=homeRanking?.position?`YOUR RANK #${homeRanking.position}`:'VIEW RANKINGS';
    const sponsorProgress=syncSponsorProgress(false),sponsor=sponsorProgress.active,nextSponsor=sponsorProgress.next,sponsorBadge=$('#heroSponsor'),hero=$('.hero'),sponsorWallpaper=$('#heroSponsorWallpaper'),sponsorTrack=$('#careerSponsorProgressTrack'),sponsorFill=$('#careerSponsorProgressFill');
    if(nextSponsor){const currentFloor=sponsor?.followersRequired||0,goal=nextSponsor.followersRequired,needed=Math.max(0,goal-state.fans),stageProgress=clamp((state.fans-currentFloor)/Math.max(1,goal-currentFloor)*100,0,100);$('#careerSponsorLabel').textContent='NEXT SPONSOR';$('#careerSponsorText').textContent=nextSponsor.brand;$('#careerSponsorProgress').textContent=`${fmt(needed)} FOLLOWERS NEEDED`;$('#careerSponsorProgressMeta').textContent=`${fmt(state.fans)} / ${fmt(goal)} FOLLOWERS`;sponsorTrack.hidden=false;sponsorTrack.setAttribute('aria-valuemin',String(currentFloor));sponsorTrack.setAttribute('aria-valuemax',String(goal));sponsorTrack.setAttribute('aria-valuenow',String(state.fans));sponsorFill.style.width=`${stageProgress}%`}
    else{$('#careerSponsorLabel').textContent='SPONSOR STATUS';$('#careerSponsorText').textContent='TOP-TIER SPONSOR';$('#careerSponsorProgress').textContent=sponsor?.brand||'SPONSOR LADDER COMPLETE';$('#careerSponsorProgressMeta').textContent='';sponsorTrack.hidden=true;sponsorFill.style.width='100%'}
    sponsorBadge.hidden=!sponsor;sponsorBadge.innerHTML=sponsor?`${gameIcon(sponsor.id,sponsor.icon)}<span class="hero-sponsor-copy"><small>SPONSORED BY</small><b>${sponsor.brand}</b><em>CURRENT SPONSOR</em></span>`:'';hero.classList.toggle('sponsored',!!sponsor);sponsorWallpaper.hidden=!sponsor;sponsorWallpaper.style.backgroundImage=sponsor?`url("assets/icons/${sponsor.id}.png?v=${ICON_ASSET_VERSION}")`:'';
    $('#cityChoices').innerHTML=city?'':fighterCities.map(c=>`<button class="city-choice" data-city="${c.id}" style="${fighterThemeStyle(c.id)}"><i aria-hidden="true"></i>${c.name}<small>${c.region}</small></button>`).join('');
    if(city&&!avatar)renderFighterBuilder();
    if(avatar)$('#heroFighterArt').src=avatar.asset;
  }
  function renderAttributeAssignment(){
    const areas=$$('[data-attribute-assignment]');
    areas.forEach(area=>{area.hidden=state.attributePoints<1;const count=area.querySelector('[data-attribute-points]');if(count)count.textContent=`${state.attributePoints} POINT${state.attributePoints===1?'':'S'} AVAILABLE`;area.querySelectorAll('[data-assign-attribute]').forEach(button=>{const key=button.dataset.assignAttribute,stat=button.closest('.attribute-assignment-stat'),base=Math.round(Number(state.stats[key])||0),effective=effectiveStat(key),bonus=Math.max(0,effective-base);button.disabled=state.attributePoints<1;const value=stat?.querySelector('[data-attribute-effective]'),breakdown=stat?.querySelector('[data-attribute-breakdown]');if(value)value.textContent=effective;if(breakdown)breakdown.textContent=bonus?`${base} BASE · +${bonus} GEAR`:`${base} BASE`})});
  }

  function renderPostFightTutorial(win){
    const tutorial=$('#postFightTutorial');tutorial.hidden=state.postFightTutorialSeen;$('#postFightTutorialReward').textContent=win?'Your Attribute Point is saved at the top of the Fight screen.':'Attribute Points are awarded only when you win.';
  }
  function assignAttribute(attribute){
    if(!LOGIC.assignAttributePoint(state,attribute))return;
    saveState();flashAttributeStats([attribute],1);trackEvent('attribute_point_assigned',{attribute,points_remaining:state.attributePoints,new_value:state.stats[attribute]});sfx.level();toast(`+1 ${attribute.toUpperCase()} · ${state.attributePoints} POINT${state.attributePoints===1?'':'S'} SAVED`,'#6ed7ff');updateUI();
  }
  function ensureFighterDraft(){if(!state.fighterCity||state.fighterAvatar)return null;if(!fighterAvatars.some(avatar=>avatar.id===state.fighterDraftAvatar))state.fighterDraftAvatar=fighterAvatars[0].id;if(!validFighterAllocation(state.fighterDraftStats))state.fighterDraftStats=LOGIC.rollFighterAllocation();return {avatar:fighterAvatars.find(item=>item.id===state.fighterDraftAvatar),stats:state.fighterDraftStats}}
  function renderFighterBuilder(){const draft=ensureFighterDraft();if(!draft)return;const index=fighterAvatars.indexOf(draft.avatar),archetype=LOGIC.fighterArchetypeFromStats(draft.stats),style=fighterStyles.find(item=>item.id===archetype);$('#fighterBuildPortrait').src=draft.avatar.asset;$('#fighterBuildPortrait').alt=`Fighter ${index+1}`;$('#fighterBuildName').textContent=`FIGHTER ${String(index+1).padStart(2,'0')}`;$('#fighterBuildArchetype').textContent=style?.name||'STRIKER';$('#fighterBuildArchetypeReason').textContent=archetype==='grappler'?'Chin and cardio lead this build.':'Power and speed lead this build.';for(const key of ['power','speed','chin','cardio']){$(`#fighterBuild${key[0].toUpperCase()+key.slice(1)}`).textContent=draft.stats[key];$(`#fighterBuild${key[0].toUpperCase()+key.slice(1)}Meter`).style.width=`${draft.stats[key]/8*100}%`}}
  function chooseCity(id){if(state.fighterCity)return;const city=fighterCities.find(c=>c.id===id);if(!city)return;state.fighterCity=id;state.fighterDraftAvatar=fighterAvatars[0].id;state.fighterDraftStats=LOGIC.rollFighterAllocation();trackEvent('career_setup_step',{step:'city',selection:id});sfx.win();confettiBurst();toast(`FIGHTING OUT OF ${city.name}`,'#76dcff');updateUI()}
  function stepFighterAvatar(direction){const draft=ensureFighterDraft();if(!draft)return;const index=fighterAvatars.indexOf(draft.avatar);state.fighterDraftAvatar=fighterAvatars[(index+direction+fighterAvatars.length)%fighterAvatars.length].id;trackEvent('career_avatar_browsed',{direction:direction<0?'previous':'next'});sfx.tap();updateUI()}
  function randomFighterAvatar(){const draft=ensureFighterDraft();if(!draft)return;let index=fighterAvatars.indexOf(draft.avatar);if(fighterAvatars.length>1)index=(index+1+Math.floor(Math.random()*(fighterAvatars.length-1)))%fighterAvatars.length;state.fighterDraftAvatar=fighterAvatars[index].id;trackEvent('career_avatar_browsed',{direction:'random'});sfx.tap();updateUI()}
  function shuffleFighterAttributes(){const draft=ensureFighterDraft();if(!draft)return;let next=draft.stats;for(let attempt=0;attempt<12&&JSON.stringify(next)===JSON.stringify(draft.stats);attempt++)next=LOGIC.rollFighterAllocation();state.fighterDraftStats=next;trackEvent('career_attributes_rerolled',{archetype:LOGIC.fighterArchetypeFromStats(next)});sfx.tap();updateUI()}
  function lockFighterBuild(){const draft=ensureFighterDraft();if(!draft||!validFighterAllocation(draft.stats))return;const keys=['power','speed','chin','cardio'],earned=Object.fromEntries(keys.map(key=>[key,Math.max(0,(Number(state.stats[key])||5)-5)])),archetype=LOGIC.fighterArchetypeFromStats(draft.stats);state.fighterAvatar=draft.avatar.id;state.fighterBaseStats=Object.assign({},draft.stats);state.stats=Object.fromEntries(keys.map(key=>[key,draft.stats[key]+earned[key]]));state.fighterStyle=archetype;state.fighterDraftAvatar='';state.fighterDraftStats=null;identitySuggestion=randomIdentitySuggestion();trackEvent('career_setup_step',{step:'fighter_build',selection:draft.avatar.id,archetype});sfx.win();confettiBurst();toast(`${archetype.toUpperCase()} BUILD LOCKED IN · 20 POINTS`,'#76dcff');updateUI()}
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
      state.name=normalizeIdentityName(profile.handle);state.nameLocked=true;state.rookieShowcasePending=true;state.firstContractPending=false;state.socialProfileId=profile.id;identitySuggestion='';identityManualMode=false;identityManualValue='';ensureRookieShowcaseOpponent();trackEvent('career_setup_step',{step:'name'});trackEvent('career_started',{archetype:state.fighterStyle,city:state.fighterCity,avatar:state.fighterAvatar});createSocialAccount();saveState();sfx.win();confettiBurst();toast(requested===state.name?`@${state.name} IS READY`:`@${requested} WAS TAKEN · @${state.name} IS YOURS`,'#76dcff');updateUI();offerRookieShowcase();connectSharedSocial(true);
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
  function makeSocialPost(entry){const profile=socialProfile(entry.profile,entry.sponsorId),author=entry.author||profile.author,handle=entry.handle||profile.handle||socialHandle(author),id=++state.socialSerial,seed=hashSeed(`${id}|${entry.text}|${state.socialCycle}`);return {id,cycle:state.socialCycle,author,handle,tone:profile.tone,kind:String(entry.kind||''),text:String(entry.text),likes:5+seed%Math.max(18,36+state.level*12),reposts:seed%Math.max(4,7+state.level*3),avatarAsset:profile.avatar||'',verified:profile.verified===true,themeAccent:profile.themeAccent||'',sponsorId:entry.sponsorId||'',targetProfileId:entry.targetProfileId||''}}
  function addSocialPosts(entries){const posts=entries.map(makeSocialPost);state.socialFeed=[...posts,...state.socialFeed].slice(0,30)}
  function ensureSocialFeed(){return !!(state.socialAccountCreated&&state.socialFeed.length)}
  function socialUnreadCount(){return ensureSocialFeed()?state.socialFeed.filter(post=>feedPostMentionsPlayer(post)&&(Number(post.id)||0)>state.socialLastMentionSerial).length:0}
  function sharedSocialUnreadCount(){return sharedSocialStatus==='ready'?sharedSocialPosts.filter(post=>feedPostMentionsPlayer(post)&&(Number(String(post.id).replace('shared-',''))||0)>state.socialLastRemoteMentionPostId).length:0}
  function sharedProfilePayload(){return {city:state.fighterCity,archetype:state.fighterStyle,fighterAvatar:state.fighterAvatar,level:state.level,wins:state.wins,losses:state.losses}}
  function feedPostMentionsPlayer(post){const targetProfileId=String(post?.targetProfileId||post?.target_profile_id||'');if(targetProfileId&&targetProfileId===state.socialProfileId)return true;const ownHandle=String(state.name||'').toLowerCase();return !!ownHandle&&String(post?.text||post?.body||'').split(/(@[A-Za-z][A-Za-z0-9_]{2,31})/g).some(part=>part[0]==='@'&&part.slice(1).toLowerCase()===ownHandle)}
  function mapSharedPost(post){const reporter=post.post_kind==='reporter',ceo=post.post_kind==='ceo',sponsor=post.post_kind==='sponsor',sponsorProfile=sponsor?sponsorFeedProfile(String(post.sponsor_id||'')):null,mine=post.author_id===state.socialProfileId,profile=reporter||ceo||sponsor?null:sharedSocialProfiles.find(item=>item.id===post.author_id)||null,avatar=fighterAvatars.find(item=>item.id===profile?.fighter_avatar),ceoProfile=STRINGS.social.profiles.ceo,reporterProfile=STRINGS.social.profiles.media,officialProfile=sponsorProfile||(ceo?ceoProfile:reporter?reporterProfile:null),targetProfileId=String(post.target_profile_id||'');return {id:`shared-${post.id}`,author:officialProfile?.author||post.author_handle,handle:officialProfile?.handle||`@${post.author_handle}`,tone:sponsor?'sponsor':ceo?'ceo':reporter?'media':mine?'player player-post':'fighter',kind:String(post.post_kind||''),text:String(post.body||''),createdAt:post.created_at,shared:true,profileId:profile?.id||'',targetProfileId,targetHandle:String(post.target_handle||''),sponsorId:sponsorProfile?.id||'',avatarAsset:officialProfile?.avatar||avatar?.asset||'',verified:Boolean(officialProfile?.verified),themeAccent:officialProfile?'':fighterAccent(profile?.city)}}
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
      const [postsResult,profilesResult,candidatesResult,interactionsResult,championshipResult]=await Promise.allSettled([SHARED_FEED.loadFeed(50),SHARED_FEED.loadProfiles(1000),SHARED_FEED.loadOpponentCandidates(state.level,20),SHARED_FEED.loadInteractionAllowance(),SHARED_FEED.loadChampionship()]),postsLoaded=postsResult.status==='fulfilled',profilesLoaded=profilesResult.status==='fulfilled',candidatesLoaded=candidatesResult.status==='fulfilled';let posts=postsLoaded?postsResult.value:[],profiles=profilesLoaded?profilesResult.value:[],opponentCandidates=candidatesLoaded?candidatesResult.value:[];if(!profilesLoaded&&!candidatesLoaded)throw profilesResult.reason||candidatesResult.reason||new Error('World rankings unavailable.');const interactionsRemaining=interactionsResult.status==='fulfilled'?interactionsResult.value:sharedSocialInteractionsRemaining,championship=championshipResult.status==='fulfilled'?championshipResult.value:sharedChampionship,rankedProfiles=[...(Array.isArray(profiles)?profiles:[]),...(Array.isArray(opponentCandidates)?opponentCandidates:[])].filter((item,index,all)=>item?.id&&all.findIndex(candidate=>candidate?.id===item.id)===index);if(championshipResult.status==='fulfilled'){setSharedChampionship(championship);queueTitleLossPresentation(sharedChampionship);landingFeature.setAvailability(sharedChampionship,true,false)}else if(!landingFeature.status().championshipLoaded)landingFeature.setAvailability(null,true,true);syncRankedOpponents(rankedProfiles);const hasOwnRemotePost=Array.isArray(posts)&&posts.some(post=>post.author_id===profile.id);
      if(postsLoaded&&state.socialAccountCreated&&!hasOwnRemotePost&&!state.socialRemoteInitialized){await SHARED_FEED.publishPost({kind:'player',body:'Hello, fight fans! Stay tuned—the climb starts now.'});posts=await SHARED_FEED.loadFeed(50)}
      state.socialRemoteInitialized=state.socialAccountCreated&&(hasOwnRemotePost||Array.isArray(posts)&&posts.some(post=>post.author_id===profile.id));
      sharedSocialProfiles=[profile,...rankedProfiles.filter(item=>item.id!==profile.id)];try{state.socialFollowingCount=await SHARED_FEED.loadProfileCount()}catch{state.socialFollowingCount=sharedSocialProfiles.length}sharedSocialInteractionsRemaining=Math.max(0,Math.min(5,Number(interactionsRemaining)||0));sharedSocialPosts=Array.isArray(posts)?posts.map(mapSharedPost):[];
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
  function publishSponsorSigning(sponsor,{returning=false}={}){if(!sponsor||!state.socialAccountCreated)return;state.socialCycle=Math.max(1,state.socialCycle+1);const text=copyText(returning?STRINGS.social.sponsorReturning:STRINGS.social.sponsorSigning,{name:state.name,brand:sponsor.brand});addSocialPosts([{profile:'sponsor',sponsorId:sponsor.id,kind:returning?'sponsor-return':'',text,targetProfileId:state.socialProfileId}]);saveState();if(returning)return;queueMicrotask(async()=>{if(!await connectSharedSocial(false)||!SHARED_FEED.publishSponsorPost)return;try{await SHARED_FEED.publishSponsorPost(sponsor.id);await connectSharedSocial(true)}catch(error){toast('SPONSOR POST SAVED LOCALLY · SHARED FEED WILL RETRY LATER','#ffcf78')}})}
  function publishSponsorDrop(sponsor){if(!sponsor||!state.socialAccountCreated)return;state.socialCycle=Math.max(1,state.socialCycle+1);const text=copyText(STRINGS.social.sponsorDropped,{name:state.name,brand:sponsor.brand});addSocialPosts([{profile:'sponsor',sponsorId:sponsor.id,kind:'sponsor-drop',text,targetProfileId:state.socialProfileId}]);saveState()}
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
  function renderFeedPost(post){const initials=String(post.author||'?').split(/\s+/).map(part=>part[0]||'').join('').slice(0,2).toUpperCase(),reactions=post.shared?'':`<div class="feed-reactions"><span>♡ ${fmt(post.likes||0)}</span><span>↻ ${fmt(post.reposts||0)}</span></div>`,incomingCallout=post.kind==='callout'&&feedPostMentionsPlayer(post)&&post.profileId&&post.profileId!==state.socialProfileId,challengeComplete=incomingCallout&&state.socialConsumedChallengePostIds.includes(String(post.id)),challengeWinner=challengeComplete?state.socialChallengeResults[String(post.id)]:'',challenge=challengeComplete?`<div class="feed-challenge-result"><b>CHALLENGE COMPLETE</b><small>${challengeWinner?`${escapeHtml(challengeWinner)} WON`:'FIGHT COMPLETE'}</small></div>`:incomingCallout?`<button class="feed-challenge-action" type="button" data-feed-challenge="${escapeHtml(post.profileId)}" data-feed-challenge-post="${escapeHtml(post.id)}"><b>VIEW CHALLENGE</b><small>OPEN TALE OF THE TAPE</small></button>`:'',avatarContent=post.avatarAsset?`<img src="${escapeHtml(post.avatarAsset)}" alt="">`:escapeHtml(initials),avatar=post.profileId?`<button class="feed-avatar fighter-photo" type="button" data-feed-profile="${escapeHtml(post.profileId)}" aria-label="View ${escapeHtml(post.author)} fighter bio">${avatarContent}</button>`:post.sponsorId?`<button class="feed-avatar sponsor-photo" type="button" data-sponsor-profile="${escapeHtml(post.sponsorId)}" aria-label="View ${escapeHtml(post.author)} sponsor profile">${avatarContent}</button>`:post.tone==='ceo'?`<button class="feed-avatar" type="button" data-ceo-profile aria-label="View Cage Grind CEO profile">${avatarContent}</button>`:post.tone==='media'?`<button class="feed-avatar reporter-photo" type="button" data-reporter-profile aria-label="View CageReporter profile">${avatarContent}</button>`:`<div class="feed-avatar">${avatarContent}</div>`,verified=post.verified?'<i class="feed-verified" aria-label="Verified official account" title="Verified official account">✓</i>':'',theme=post.themeAccent?` style="--fighter-accent:${escapeHtml(post.themeAccent)};${fighterPortraitStyle(post.handle)}"`:'';return `<article class="feed-post ${escapeHtml(post.tone||'media')}${feedPostMentionsPlayer(post)?' mentioned-post':''}"${theme}>${avatar}<div class="feed-post-copy"><div class="feed-post-head"><b>${escapeHtml(post.author)}</b>${verified}<span>${escapeHtml(post.handle)}</span><time>${feedAge(post)}</time></div><p>${renderFeedText(post)}</p>${reactions}${challenge}</div></article>`}
  function openFeedChallenge(profileId,postId){const post=sharedSocialPosts.find(item=>String(item.id)===String(postId));if(!post||post.kind!=='callout'||post.profileId!==profileId||!feedPostMentionsPlayer(post)||state.socialConsumedChallengePostIds.includes(String(post.id))){toast('CHALLENGE IS NO LONGER AVAILABLE','#ffcf78');renderSocial();return}const profile=sharedSocialProfiles.find(item=>item.id===profileId);if(!profile){toast('CHALLENGE IS NO LONGER AVAILABLE','#ffcf78');return}let opponent=state.roster.find(item=>item.network&&item.sourceProfileId===profile.id);if(!opponent){opponent=networkOpponentFromProfile(profile,Number(profile.level));if(opponent){state.roster.push(opponent);refreshOpponents()}}if(!opponent){toast('CHALLENGE MATCHUP IS UNAVAILABLE','#ffcf78');return}trackEvent('feed_challenge_viewed',{opponent_id:profile.id});openTaleOfTape(opponent,{fromFeed:true,feedChallengePostId:String(post.id)})}
  function consumeFeedChallenge(postId,winnerHandle){const id=String(postId||''),winner=String(winnerHandle||'').slice(0,33);if(!/^shared-\d+$/.test(id)||state.socialConsumedChallengePostIds.includes(id)||!winner)return false;state.socialConsumedChallengePostIds=[...state.socialConsumedChallengePostIds,id].slice(-100);state.socialChallengeResults=Object.fromEntries([...Object.entries(state.socialChallengeResults).filter(([key])=>key!==id),[id,winner]].slice(-100));return true}
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
  function rankingProfiles(){
    if(sharedSocialProfiles.length)return sharedSocialProfiles;
    const player={id:state.socialProfileId||'local-player',handle:state.name,city:state.fighterCity,archetype:state.fighterStyle,fighter_avatar:state.fighterAvatar,level:state.level,wins:state.wins,losses:state.losses};
    return [player,...state.roster.filter(opponent=>opponent.network).map(opponent=>({id:opponent.sourceProfileId,handle:opponent.networkHandle,city:opponent.networkCity,archetype:opponent.archetype,fighter_avatar:opponent.fighterAvatar,level:opponent.tier,wins:opponent.wins,losses:opponent.losses}))];
  }
  function currentRanking(){const fighters=LOGIC.rankFighters(rankingProfiles(),sharedChampionship,1000),name=String(state.name||'').toLowerCase(),index=fighters.findIndex(profile=>profile.id===state.socialProfileId||String(profile.handle||'').toLowerCase()===name);return {fighters,profile:index>=0?fighters[index]:null,position:index>=0?index+1:0}}
  function renderRankings(){
    const list=$('#rankingsList'),ranking=currentRanking(),ranked=ranking.fighters.slice(0,25),current=ranking.profile;$('#rankingsCurrentPosition').textContent=ranking.position?`#${ranking.position}`:'—';$('#rankingsCurrentDetails').textContent=current?`LEVEL ${current.level} · ${current.wins}-${current.losses} RECORD · ${Math.round(current.winPercentage*100)}% WIN RATE`:'RANK UNAVAILABLE';$('#homeRankText').textContent=ranking.position?`YOUR RANK #${ranking.position}`:'VIEW RANKINGS';
    if(ranked.length){list.innerHTML=ranked.map((profile,index)=>{const mine=profile===current,winPercentage=Math.round(profile.winPercentage*100),champion=profile.isChampion?'<em class="rankings-champion">WORLD CHAMPION</em>':'';return `<div class="rankings-row${profile.isChampion?' champion':''}${mine?' player':''}"><strong class="rankings-position">#${index+1}</strong><span class="rankings-fighter"><b>@${escapeHtml(profile.handle)}</b><small>${champion}</small></span><b class="rankings-level">LVL ${profile.level}</b><span class="rankings-record">${profile.wins}-${profile.losses}</span><span class="rankings-percentage">${winPercentage}%</span></div>`}).join('');return}
    const message=sharedSocialStatus==='loading'?'CONNECTING TO WORLD STANDINGS…':sharedSocialStatus==='error'?'WORLD STANDINGS ARE TEMPORARILY OFFLINE':'NO RANKED FIGHTERS YET';list.innerHTML=`<div class="rankings-empty">${message}</div>`;
  }
  function openRankings(){const modal=$('#rankingsModal');renderRankings();modal.classList.add('open');modal.setAttribute('aria-hidden','false');sfx.tap();requestAnimationFrame(()=>$('#closeRankingsBtn').focus());if(sharedSocialStatus!=='ready')connectSharedSocial(true).then(()=>{if(modal.classList.contains('open'))renderRankings()})}
  function closeRankings(){$('#rankingsModal').classList.remove('open');$('#rankingsModal').setAttribute('aria-hidden','true');sfx.tap();requestAnimationFrame(()=>$('#openRankingsBtn').focus())}
  function feedFollowingTotal(){
    const socialHandles=new Set([...Object.values(STRINGS.social.profiles||{}).map(profile=>profile?.handle),...Object.values(STRINGS.social.usernames||{}).flat().map(handle=>`@${handle}`),...endorsementDefs.map(sponsor=>sponsorFeedProfile(sponsor.id)?.handle)].filter(Boolean).map(handle=>String(handle).toLowerCase())),ownId=state.socialProfileId||'local-player',ownHandle=String(state.name||'').toLowerCase(),rankedHandles=new Set(rankingProfiles().filter(profile=>profile&&profile.id!==ownId&&String(profile.handle||'').toLowerCase()!==ownHandle).map(profile=>String(profile.id||profile.handle||'').toLowerCase()).filter(Boolean)),knownRankedCount=Math.max(rankedHandles.size,Math.max(0,Math.floor(Number(state.socialFollowingCount)||0)-1));
    return socialHandles.size+knownRankedCount;
  }
  function renderSocial(){
    const accountReady=ensureSocialFeed(),sharedReady=sharedSocialStatus==='ready',localSponsorEvents=(state.socialFeed||[]).filter(post=>post.kind==='sponsor-drop'||post.kind==='sponsor-return'),posts=sharedReady?[...localSponsorEvents,...sharedSocialPosts]:state.socialFeed||[],mentions=posts.filter(feedPostMentionsPlayer);if(accountReady&&currentScreen==='feed'&&feedFilter==='mentions'){state.socialLastMentionSerial=Math.max(state.socialLastMentionSerial,...state.socialFeed.filter(feedPostMentionsPlayer).map(post=>Number(post.id)||0));state.socialLastRemoteMentionPostId=Math.max(state.socialLastRemoteMentionPostId,...sharedSocialPosts.filter(feedPostMentionsPlayer).map(post=>Number(String(post.id).replace('shared-',''))||0));saveState()}const unread=socialUnreadCount()+sharedSocialUnreadCount(),navBadge=$('#feedNavBadge');navBadge.hidden=unread<1;navBadge.textContent=unread>99?'99+':String(unread);navBadge.setAttribute('aria-label',`${unread} unread Cage Feed mention${unread===1?'':'s'}`);
    $('#feedFollowersCount').textContent=fmt(state.fans);$('#feedFollowingCount').textContent=fmt(feedFollowingTotal());
    const visiblePosts=feedFilter==='mentions'?mentions:posts;$('#feedMentionCount').textContent=String(mentions.length);$('#feedPostAllowance').textContent=`${sharedSocialInteractionsRemaining} OF 5 POSTS LEFT`;$$('[data-feed-intent]').forEach(button=>button.disabled=!sharedReady||sharedSocialInteractionsRemaining<1);for(const filter of ['all','mentions']){const button=$(`#feedFilter${filter==='all'?'All':'Mentions'}`),active=feedFilter===filter;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))}$('#socialTimeline').innerHTML=visiblePosts.length?visiblePosts.map(renderFeedPost).join(''):`<div class="feed-preview-empty">${feedFilter==='mentions'?'No mentions yet.':'No posts yet.'}</div>`;
    if(activeBioProfileId&&$('#fighterBioModal').classList.contains('open'))activeBioProfileId==='official-ceo'?renderCeoBioDetails():activeBioProfileId==='official-reporter'?renderReporterBioDetails():activeBioProfileId.startsWith('official-sponsor:')?renderSponsorBioDetails():renderFighterBioInteractions(sharedSocialProfiles.find(profile=>profile.id===activeBioProfileId));
  }
  function renderFighterPostResults(){const query=$('#fighterPostSearch').value.trim().replace(/^@/,'').toLowerCase(),ranked=LOGIC.rankFighters(sharedSocialProfiles,sharedChampionship,1000).map((profile,index)=>Object.assign(profile,{worldRank:index+1})),profiles=ranked.filter(profile=>profile.id!==state.socialProfileId&&(!query||String(profile.handle||'').toLowerCase().includes(query))).slice(0,60);$('#fighterPostResults').innerHTML=profiles.length?profiles.map(profile=>{const avatar=fighterAvatars.find(item=>item.id===profile.fighter_avatar);return `<button class="fighter-post-result" type="button" data-fighter-post-target="${escapeHtml(profile.id)}">${avatar?`<img src="${escapeHtml(avatar.asset)}" alt="">`:'<span class="fighter-post-result-avatar">CG</span>'}<span><b>@${escapeHtml(profile.handle)}</b><small>RANK #${profile.worldRank} · LEVEL ${profile.level} · ${fighterCityCode(profile.city)} · ${profile.wins}-${profile.losses}</small></span><em>SELECT</em></button>`}).join(''):'<div class="fighter-post-empty">NO FIGHTERS MATCH THAT SEARCH</div>'}
  function currentFighterPostDraft(){return fighterInteractionDraft(fighterPostIntent,fighterPostTarget,fighterPostDraftOffset)}
  function renderFighterPostPreview(){const choice=currentFighterPostDraft();if(!fighterPostTarget||!choice)return;$('#fighterPostSearchStep').hidden=true;$('#fighterPostPreviewStep').hidden=false;$('#fighterPostTitle').textContent=STRINGS.social.interactions[fighterPostIntent]?.label||'FIGHTER POST';$('#fighterPostTarget').innerHTML=`<b>@${escapeHtml(fighterPostTarget.handle)}</b><span>LEVEL ${Math.max(1,Number(fighterPostTarget.level)||1)} · ${fighterCityCode(fighterPostTarget.city)}</span>`;$('#fighterPostDraft').textContent=choice.text;$('#fighterPostSend').disabled=fighterInteractionPending;$('#fighterPostRedraft').disabled=fighterInteractionPending;$('#fighterPostBack').disabled=fighterInteractionPending}
  function openFighterPostComposer(kind){if(kind!=='callout')return;if(sharedSocialStatus!=='ready'){toast('GLOBAL FEED CONNECTION REQUIRED','#ffcf78');return}if(sharedSocialInteractionsRemaining<1){toast('DAILY FIGHTER POST LIMIT REACHED','#ffcf78');return}if(!STRINGS.social.interactions[kind])return;fighterPostIntent=kind;fighterPostTarget=null;fighterPostDraftOffset=0;$('#fighterPostTitle').textContent=STRINGS.social.interactions[kind].label;$('#fighterPostKicker').textContent=`CAGE FEED · ${sharedSocialInteractionsRemaining} OF 5 POSTS LEFT`;$('#fighterPostSearchStep').hidden=false;$('#fighterPostPreviewStep').hidden=true;$('#fighterPostSearch').value='';renderFighterPostResults();$('#fighterPostModal').classList.add('open');$('#fighterPostModal').setAttribute('aria-hidden','false');sfx.tap();requestAnimationFrame(()=>$('#fighterPostSearch').focus())}
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
    const subtitles={'Fight Gear':'Equippable combat upgrades','Bling':'Passive follower bonuses','Lifestyle':'Follower and status collectibles','Property & Rides':'Passive career bonuses'};
    if(!owned.length){$('#gearShop').innerHTML='<div class="gear-empty"><b>NO GEAR YET</b><span>Win fights to earn deterministic drops. Your fourth win without a drop is guaranteed to produce one.</span></div>';return}
    const loadoutLimit=LOGIC.gearLoadoutLimit(state.level),loadoutProgress=loadoutLimit<4?' · 4 SLOTS AT LVL 8':'';
    $('#gearShop').innerHTML=order.map(cat=>{const items=owned.filter(g=>g.category===cat);if(!items.length)return '';const categoryTotal=gearItems.filter(g=>g.category===cat).length,collectionStatus=`${items.length} / ${categoryTotal} COLLECTIBLES`,loadoutStatus=cat==='Fight Gear'?`${state.equippedGear.length}/${loadoutLimit} EQUIPPED${loadoutProgress}`:'',status=`<span>${collectionStatus}</span>${loadoutStatus?`<small>${loadoutStatus}</small>`:''}`;return `<section class="shop-section" aria-labelledby="gear-${cat.replace(/[^a-z]+/gi,'-').toLowerCase()}"><div class="shop-head"><div><b id="gear-${cat.replace(/[^a-z]+/gi,'-').toLowerCase()}">${cat}</b><small>${subtitles[cat]}</small></div><span class="shop-status">${status}</span></div>${cat==='Fight Gear'?'<div class="loadout-note">One copy powers each perk. Duplicates do not stack.</div>':''}<div class="gear-grid">${items.map(g=>collectibleCardHtml(g)).join('')}</div></section>`}).join('');
  }
  function toggleCollectibleCard(card){if(!card)return;const flipped=!card.classList.contains('flipped'),name=card.querySelector('.collectible-front h3')?.textContent||'Collectible',front=card.querySelector('.collectible-front'),back=card.querySelector('.collectible-back'),button=front?.querySelector('button'),item=gearItems.find(entry=>entry.id===card.dataset.collectibleId);card.classList.toggle('flipped',flipped);card.setAttribute('aria-pressed',String(flipped));card.setAttribute('aria-label',`${name} collectible. ${flipped?'Details shown. Tap to return.':'Tap for details.'}`);front?.setAttribute('aria-hidden',String(flipped));back?.setAttribute('aria-hidden',String(!flipped));if(button)button.tabIndex=flipped?-1:0;if(flipped&&item)trackEvent('collectible_details_viewed',{gear_id:item.id,sponsored:item.sponsored===true,has_qr:!!item.qrAsset});sfx.tap()}
  function openLoadoutFullDialog(trigger){const modal=$('#loadoutFullModal'),limit=LOGIC.gearLoadoutLimit(state.level);loadoutDialogReturnFocus=trigger&&typeof trigger.focus==='function'?trigger:null;$('#loadoutFullKicker').textContent=`FIGHT GEAR · ${limit}/${limit} SLOTS`;$('#loadoutFullDescription').textContent=limit<4?'Your rookie loadout has two active slots. Unequip one item to make room, or reach Level 8 to unlock four slots.':'Unequip one Fight Gear item before equipping another. Duplicate items still count as one active perk.';modal.classList.add('open');modal.setAttribute('aria-hidden','false');sfx.lose();requestAnimationFrame(()=>$('#loadoutFullOk').focus())}
  function closeLoadoutFullDialog(){const modal=$('#loadoutFullModal');if(!modal.classList.contains('open'))return;modal.classList.remove('open');modal.setAttribute('aria-hidden','true');sfx.tap();const returnFocus=loadoutDialogReturnFocus;loadoutDialogReturnFocus=null;if(returnFocus&&returnFocus.isConnected)requestAnimationFrame(()=>returnFocus.focus())}
  function toggleEquip(id,trigger){const g=gearItems.find(x=>x.id===id);if(!g||g.category!=='Fight Gear'||!state.gear.includes(id))return;const at=state.equippedGear.indexOf(id);if(at>=0){state.equippedGear.splice(at,1);trackEvent('gear_unequipped',{gear_id:id,gear_rarity:g.rarity.toLowerCase()});sfx.tap();updateUI();return}if(state.equippedGear.length>=LOGIC.gearLoadoutLimit(state.level)){openLoadoutFullDialog(trigger);return}state.equippedGear.push(id);trackEvent('gear_equipped',{gear_id:id,gear_rarity:g.rarity.toLowerCase()});initAudio();sfx.crit();const card=trigger&&trigger.closest('.gear');if(card){card.classList.add('equip-bursting');trigger.textContent='EQUIPPED!';trigger.disabled=true;saveState();setTimeout(updateUI,680)}else updateUI()}
  function opponentHasHistory(o){return (Number(o?.meetings)||0)>0||(Number(o?.winsVsPlayer)||0)>0||(Number(o?.lossesToPlayer)||0)>0}
  function fightWinRewardPreview(opponent){
    const points=LOGIC.victoryAttributePointReward(state.level,opponent.tier),playerRating=state.stats.power+state.stats.speed+state.stats.chin+state.stats.cardio,opponentRating=opponent.power+opponent.speed+opponent.chin+opponent.cardio,upset=opponentRating>=playerRating+4,titleWon=opponent.globalChampionship&&!opponent.championDefense,winsToday=opponentWinsToday(opponent),xpTier=LOGIC.opponentXpTier(winsToday,opponent.tier,state.level);
    const result=LOGIC.fightXp({playerLevel:state.level,opponentLevel:opponent.tier,won:true,upset,ranked:!!opponent.network&&!opponent.globalChampionship,championship:!!opponent.globalChampionship,titleWon,rival:false,opponentWinsToday:winsToday});
    const xpNote=xpTier.tier==='lower_level'?`-${fightRule('experienceRewards.lowerLevelOpponentFollowerLossPercent',5)}% FOLLOWERS`:xpTier.tier==='exhausted'?'XP USED TODAY':xpTier.tier==='repeat'?'RUNBACK · 50% XP':'';
    return {points,xp:result.xp,xpNote};
  }
  function renderFightLadderRow(opponent,fightsLeft){
    const reward=fightWinRewardPreview(opponent),fights=Math.max(0,Number(opponent.wins)||0)+Math.max(0,Number(opponent.losses)||0),winPercentage=fights?Math.round((Number(opponent.wins)||0)/fights*100):0,titleLocked=opponent.globalChampionship&&opponent.titleCooldown,dailyLocked=fightsLeft<1,locked=titleLocked||dailyLocked,champion=!!opponent.network&&opponent.sourceProfileId===sharedChampionship?.champion_id,portrait=silhouetteForOpponent(opponent),rank=opponent.network?`#${opponent.worldRank||'—'}`:'N/A',titleLabel=champion?'WORLD CHAMPION':opponent.championDefense?'TITLE DEFENSE':opponent.rookieShowcase?'OPENING FIGHT':opponent.firstContract?'FIRST CONTRACT':opponent.circuitFallback?(opponent.winsVsPlayer>0?'CAGE CIRCUIT REMATCH':'FRESH CAGE CIRCUIT'):'RANKED FIGHTER',country=!opponent.network?opponentCountry(opponent.country):null,countryBadge=country?opponentCountryBadge(opponent.country):'',lockCopy=dailyLocked?'DAILY LIMIT':titleLocked?(opponent.championDefense?'DEFENSE USED':'ATTEMPT USED'):'';
    return `<button class="fight-ranking-row${champion?' champion':''}${opponent.championDefense?' title-defense':''}${opponent.circuitFallback||opponent.rookieShowcase||opponent.firstContract?' circuit':''}${locked?' locked':''}" type="button" ${locked?'disabled':`data-fight-key="${escapeHtml(opponent.key)}"`} aria-label="${escapeHtml(opponent.name)}, ${opponent.network?`rank ${rank}`:`unranked, fighting out of ${country.name}`}, level ${opponent.tier}, ${reward.xp} XP and ${reward.points} Attribute Points for a win${reward.xpNote?`, ${reward.xpNote.toLowerCase()}`:''}${locked?`, ${lockCopy.toLowerCase()}`:'. Open Tale of the Tape.'}"><strong class="fight-rank-position">${rank}</strong><span class="fight-rank-avatar"><img src="${escapeHtml(portrait)}" alt="" loading="lazy"></span><span class="fight-rank-identity"><b>${escapeHtml(opponent.networkHandle?`@${opponent.networkHandle}`:opponent.name)}</b><small><span>${titleLabel}</span>${countryBadge}</small><em>PRO ${opponent.wins}-${opponent.losses} · LVL ${opponent.tier} · ${winPercentage}% WIN</em></span><span class="fight-rank-record"><small>RECORD</small><b>${opponent.wins}-${opponent.losses}</b></span><span class="fight-rank-level"><small>LEVEL</small><b>${opponent.tier}</b></span><span class="fight-rank-win"><small>WIN %</small><b>${winPercentage}%</b></span><span class="fight-rank-rewards"><b>+${reward.xp} XP</b><em>+${reward.points} ATTR PT${reward.points===1?'':'S'}</em>${lockCopy?`<small>${lockCopy}</small>`:reward.xpNote?`<small class="xp-note">${reward.xpNote}</small>`:''}</span></button>`;
  }
  function renderPlayerRankingRow(profile,position){
    if(!profile||!position)return '';const fights=Math.max(0,Number(profile.wins)||0)+Math.max(0,Number(profile.losses)||0),winPercentage=fights?Math.round((Number(profile.wins)||0)/fights*100):0,avatar=fighterAvatars.find(item=>item.id===profile.fighter_avatar)?.asset||currentAvatar()?.asset||fighterSilhouettes[0],champion=profile.isChampion===true;
    return `<div class="fight-ranking-row player${champion?' champion':''}" role="listitem" aria-label="Your fighter, rank #${position}, level ${profile.level}, record ${profile.wins}-${profile.losses}, ${winPercentage}% win rate"><strong class="fight-rank-position">#${position}</strong><span class="fight-rank-avatar"><img src="${escapeHtml(avatar)}" alt="" loading="lazy"></span><span class="fight-rank-identity"><b>@${escapeHtml(profile.handle)}</b><small><span>${champion?'WORLD CHAMPION · ':''}YOUR FIGHTER</span></small><em>PRO ${profile.wins}-${profile.losses} · LVL ${profile.level} · ${winPercentage}% WIN</em></span><span class="fight-rank-record"><small>RECORD</small><b>${profile.wins}-${profile.losses}</b></span><span class="fight-rank-level"><small>LEVEL</small><b>${profile.level}</b></span><span class="fight-rank-win"><small>WIN %</small><b>${winPercentage}%</b></span><span class="fight-rank-rewards"><b>YOUR FIGHTER</b><em>NOT SELECTABLE</em></span></div>`;
  }
  function renderOpponents(){
    refreshOpponents();const fightsLeft=sessionsLeft('fight',DAILY_FIGHT_LIMIT),ranking=currentRanking(),showcase=opponents.filter(item=>item.rookieShowcase),contract=opponents.filter(item=>item.firstContract),ranked=opponents.filter(item=>item.network),circuit=opponents.filter(item=>!item.network&&!item.rookieShowcase&&!item.firstContract),circuitRematches=circuit.filter(item=>(item.winsVsPlayer||0)>0).length;$('#fightResetClock').hidden=fightsLeft>0;setLimitBadge('#fightLimitText',`${fightsLeft} ${fightsLeft===1?'FIGHT':'FIGHTS'} LEFT`);$('#rosterSummary').textContent=`${contract.length?`${contract.length} CONTRACT · `:''}${circuit.length} CIRCUIT · ${ranking.fighters.length} RANKED${ranking.position?` · YOUR RANK #${ranking.position}`:''}`;$('#fightInjuryWarning').hidden=state.health>=state.maxHealth;const showcaseRows=showcase.map(opponent=>renderFightLadderRow(opponent,fightsLeft)).join(''),contractRows=contract.length?`<div class="fight-ranking-group circuit-group"><b>YOUR FIRST CONTRACT</b><span>VASO WIN UNLOCKED THIS FIGHT</span></div>${contract.map(opponent=>renderFightLadderRow(opponent,fightsLeft)).join('')}`:'',circuitSummary=circuitRematches?`${circuit.length-circuitRematches} FRESH · ${circuitRematches} REMATCH`:`${circuit.length} FRESH MATCHUPS · FULL XP`,circuitRows=circuit.length?`<div class="fight-ranking-group circuit-group"><b>ON-LEVEL CAGE CIRCUIT</b><span>${circuitSummary}</span></div>${circuit.map(opponent=>renderFightLadderRow(opponent,fightsLeft)).join('')}`:'',rankedEntries=ranked.map(opponent=>({rank:opponent.worldRank||Number.MAX_SAFE_INTEGER,html:renderFightLadderRow(opponent,fightsLeft)}));if(ranking.profile&&ranking.position)rankedEntries.push({rank:ranking.position,html:renderPlayerRankingRow(ranking.profile,ranking.position)});rankedEntries.sort((a,b)=>a.rank-b.rank);const rankedRows=rankedEntries.length?`<div class="fight-ranking-group ranked-group"><b>WORLD RANKINGS</b><span>${ranking.fighters.length} RANKED FIGHTERS</span></div>${rankedEntries.map(entry=>entry.html).join('')}`:'';$('#opponentList').innerHTML=opponents.length||ranking.profile?`<div class="fight-ranking-list">${showcaseRows}${contractRows}${circuitRows}${rankedRows}</div>`:`<div class="gear-empty"><b>BUILDING THE FIGHT CARD</b><span>New opponents will appear shortly.</span></div>`;
  }

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
    const today=todayKey();if(state.lastDaily===today)return;initAudio();const gearDrop=awardDailyCollectible(today);state.lastDaily=today;trackEvent('daily_reward_claimed',{gear_id:gearDrop?.item?.id||'none',gear_rarity:gearDrop?.rarity?.toLowerCase()||'none',new_item:!!gearDrop?.isNew});updateUI();if(!gearDrop){toast('DAILY DROP SAVED','#f4c34a');return}openDropClaim(gearDrop,{kind:'daily',eyebrow:'ONE FREE PACK EVERY DAY',title:'DAILY DROP',message:'Reveal today’s guaranteed collectible.'});
  }

  function emptyFightStats(){return {attempted:0,landed:0,sig:0,takedowns:0,control:0,damage:0,kd:0}}
  function addFightStats(total,part){for(const k of Object.keys(total))total[k]+=part[k]||0}
  function scheduleFight(fn,delay){const id=setTimeout(fn,Math.max(40,delay));fightTimers.push(id);return id}
  function clearFightTimers(){fightTimers.forEach(clearTimeout);fightTimers=[]}
  function fightClock(exchange,total){const seconds=Math.max(12,300-Math.round((exchange/Math.max(1,total))*288));return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`}

  function commentaryFor(type,attacker,defender,landed,big=false){
    const list=STRINGS.fightCommentary[landed?'hit':'miss'][type],template=list[rint(0,list.length-1)];return copyText(template,{A:attacker.name,D:defender.name});
  }

  function createFight(o){
    const P={name:state.name,power:effectiveStat('power'),speed:effectiveStat('speed'),chin:effectiveStat('chin'),cardio:effectiveStat('cardio')};
    const O={name:o.name,power:o.power,speed:o.speed,chin:o.chin,cardio:o.cardio};
    return {o,player:P,opp:O,playerCondition:LOGIC.startingFightCondition(state.health,state.maxHealth),oppCondition:100,healthLost:0,injuryEligible:state.health<state.maxHealth&&!currentFightInjury(),fightInjury:null,rounds:[],timeline:[],totals:{player:emptyFightStats(),opp:emptyFightStats()},winner:null,method:'DECISION',finishRound:FIGHT_ROUNDS,finishClock:'0:00',ended:false,mode:'planned',gamePlan:Object.assign({},state.fightPlanPreference),planAssessment:null,focus:80,plans:[],lastPlan:state.fighterStyle||'striker',openingApproach:null,tendencyRevealed:true,deepRead:false,crisisUsed:false,cornerTowel:false,haymakerMiss:false,finalDecisionPending:false,lastChanceResolved:false,pendingMoment:null,resolvedMoments:[],roundIntros:[]};
  }

  function maybeRollLiveFightInjury(sim,landed=true){
    const chance=LOGIC.liveFightInjuryChance({eligible:!!sim?.injuryEligible,landed,injured:!!sim?.fightInjury});
    if(!chance||Math.random()>=chance)return null;
    const def=fightInjuryDefs[rint(0,fightInjuryDefs.length-1)],injury={id:def.id,name:def.name,icon:def.icon};sim.fightInjury=injury;sim.playerCondition=LOGIC.fightInjuryCondition(sim.playerCondition);for(const key of ['power','speed','chin','cardio'])sim.player[key]=Math.max(1,Math.round(sim.player[key])-1);return injury;
  }

  function planFamiliarity(styleId,planId){
    if(!styleId)return 0;return styleId===planId?.08:-.06;
  }
  function matchupEdge(planId,opponentId){
    const matrix={striker:{striker:0,grappler:.14},grappler:{striker:.14,grappler:0}};return matrix[planId]?.[opponentId]||0;
  }
  function strategyEdge(planId,tendency){return clamp(matchupEdge(planId,tendency)+planFamiliarity(state.fighterStyle,planId),-.26,.24)}
  function fightFocusModifier(sim=fight){const value=Number(sim?.focus)||80;return value>=95?.05:value>=85?.025:value>=70?0:value>=60?-.025:-.06}
  function responsePlanId(tendency){return STRINGS.corner.matchups[tendency]?.plan||state.fighterStyle||'striker'}
  function plannedStyleForRound(sim,round){const signature=state.fighterStyle||'striker';return sim.gamePlan?.tactics==='adapt'&&round>1?responsePlanId(sim.o.tendency):signature}
  function adaptationModifier(sim,round){if(sim.gamePlan?.tactics!=='adapt'||round===1)return 0;const focus=Number(sim.focus)||80,execution=focus>=95?.04:focus>=85?.02:focus>=70?0:focus>=60?-.04:-.08;return execution+(round===2?-.025:0)}
  function assessFightPlan(sim=fight,adaptationScale=.5){return LOGIC.fightPlanAssessment({player:sim?.player,opponent:sim?.opp,plan:sim?.gamePlan,fighterStyle:state.fighterStyle,opponentStyle:sim?.o?.tendency,focus:sim?.focus,adaptationScale})}
  function fightPlanFeedback(assessment,plan){
    const axis=assessment.axis,positive=assessment.components[axis]>=0,reasons={pace:positive?(plan.pace==='fast'?'YOUR CARDIO SUPPORTS THE OUTPUT':'THE MEASURED PACE PROTECTS YOUR GAS TANK'):(plan.pace==='fast'?'THE PACE IS TAXING YOUR CARDIO':'THE LOW OUTPUT SURRENDERS YOUR PHYSICAL EDGE'),offense:positive?(plan.offense==='aggressive'?'YOUR PRESSURE TARGETS THEIR CHIN':'DISCIPLINED OFFENSE LIMITS THEIR COUNTERS'):(plan.offense==='aggressive'?'RECKLESS ENTRIES ARE LEAVING OPENINGS':'SAFE OFFENSE IS BLUNTING YOUR FINISHING EDGE'),tactics:positive?(plan.tactics==='adapt'?'YOUR TIMING SUPPORTS THE ADJUSTMENT':'YOUR SIGNATURE STYLE FITS THIS MATCHUP'):(plan.tactics==='adapt'?'THE STYLE SWITCH IS BREAKING DOWN':'THEY ARE READING YOUR SIGNATURE STYLE')};
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
    if(!f?.o)return;const hype=Math.floor(state.hype),reward=fightWinRewardPreview(f.o);$('#tapeHypeBonus').textContent=`${hype}% HYPE · +${hype}% FOLLOWER MOMENTUM`;$('#tapeBreakdownFollowers').textContent=`WIN · +${reward.points} ATTRIBUTE POINT${reward.points===1?'':'S'} · +${reward.xp} XP`;$('#tapeBreakdownMode').textContent='PLANNED FULL SIM';$('#tapeEnergy').textContent=`ABOVE 0 REQUIRED · UP TO ${FIGHT_ENERGY_COST} USED`;$('#tapeBreakdownHaymaker').textContent='YOUR LOCKER-ROOM PLAN CONTROLS THE ENTIRE FIGHT.';$('#tapeBreakdownNetwork').hidden=!f.o.network;
  }
  function openTapeStats(){if(!fight)return;closeTapeBreakdown(false);$('#tapeStatsPanel').hidden=false;$('#tapeStatsToggle').setAttribute('aria-expanded','true');$('#tapeStatsClose').focus();sfx.tap()}
  function closeTapeStats(restoreFocus=true){const panel=$('#tapeStatsPanel');if(panel.hidden)return;panel.hidden=true;$('#tapeStatsToggle').setAttribute('aria-expanded','false');if(restoreFocus)$('#tapeStatsToggle').focus()}
  function openTapeBreakdown(){if(!fight)return;closeTapeStats(false);renderTapeBreakdown();$('#tapeBreakdown').hidden=false;$('#tapeTermsToggle').setAttribute('aria-expanded','true');$('#tapeBreakdownClose').focus();sfx.tap()}
  function closeTapeBreakdown(restoreFocus=true){const breakdown=$('#tapeBreakdown');if(breakdown.hidden)return;breakdown.hidden=true;$('#tapeTermsToggle').setAttribute('aria-expanded','false');if(restoreFocus)$('#tapeTermsToggle').focus()}
  function renderTapeAttributes(f){
    const attributes=[['Power','power','tapePPower','tapeOPower'],['Speed','speed','tapePSpeed','tapeOSpeed'],['Chin','chin','tapePChin','tapeOChin'],['Cardio','cardio','tapePCardio','tapeOCardio']],scale=Math.max(10,...attributes.flatMap(([,key])=>[Number(f.player[key])||0,Number(f.opp[key])||0]));
    attributes.forEach(([,key,playerId,oppId])=>{
      const playerValue=Number(f.player[key])||0,oppValue=Number(f.opp[key])||0,even=Math.abs(playerValue-oppValue)<.005,playerAdvantage=!even&&playerValue>oppValue,oppAdvantage=!even&&oppValue>playerValue,playerValueEl=$('#'+playerId),oppValueEl=$('#'+oppId),playerMeter=$('#'+playerId+'Meter').parentElement,oppMeter=$('#'+oppId+'Meter').parentElement;
      playerValueEl.textContent=formatStat(playerValue);oppValueEl.textContent=formatStat(oppValue);playerValueEl.classList.toggle('advantage',playerAdvantage);oppValueEl.classList.toggle('advantage',oppAdvantage);playerValueEl.classList.toggle('even',even);oppValueEl.classList.toggle('even',even);playerMeter.classList.toggle('advantage',playerAdvantage);oppMeter.classList.toggle('advantage',oppAdvantage);playerMeter.classList.toggle('even',even);oppMeter.classList.toggle('even',even);$('#'+playerId+'Meter').style.width=`${clamp(playerValue/scale*100,4,100)}%`;$('#'+oppId+'Meter').style.width=`${clamp(oppValue/scale*100,4,100)}%`;
    });
  }
  function fillTape(f){
    const fightsLeft=sessionsLeft('fight',DAILY_FIGHT_LIMIT),startingCondition=LOGIC.startingFightCondition(state.health,state.maxHealth),opponentCleared=opponentAvailable(f.o),cleared=opponentCleared&&fightsLeft>0&&hasActionEnergy()&&state.health>=MINIMUM_FIGHT_HEALTH;
    const playerAccent=fighterAccent(state.fighterCity),opponentAccent=f.o.network?fighterAccent(f.o.networkCity):f.o.color||DEFAULT_FIGHTER_ACCENT,poster=$('#tapeStage .matchup-poster'),playerCard=$('#tapeStage .player-card'),opponentCard=$('#tapeStage .opponent-card');poster.style.setProperty('--player-accent',playerAccent);poster.style.setProperty('--opponent-accent',opponentAccent);playerCard.style.setProperty('--fighter-accent',playerAccent);opponentCard.style.setProperty('--fighter-accent',opponentAccent);applyPortraitStyle(playerCard,state.name);applyPortraitStyle(opponentCard,f.o.networkHandle||f.o.name);$('#tapeStatsPlayerCity').textContent=fighterCityCode(state.fighterCity);const tapeCountry=$('#tapeStatsOppCity');if(f.o.network)tapeCountry.textContent=fighterCityCode(f.o.networkCity);else tapeCountry.innerHTML=opponentCountryBadge(f.o.country);
    const titleBout=!!f.o.globalChampionship,rookieShowcase=f.o.rookieShowcase===true,firstContract=f.o.firstContract===true,playerIsChampion=titleBout&&sharedChampionship?.is_champion===true,playerTag=playerIsChampion?'REIGNING WORLD CHAMPION':currentStyle()?.name||'NO ARCHETYPE',opponentTag=titleBout&&!playerIsChampion?'REIGNING WORLD CHAMPION':f.o.tag||'UNKNOWN STYLE',playerRecord=`PRO ${state.wins}-${state.losses}`,opponentRecord=`PRO ${f.o.wins}-${f.o.losses}`;$('#tapePlayerName').textContent=f.player.name;$('#tapePlayerTag').textContent=playerTag;$('#tapeOppName').textContent=f.opp.name;$('#tapeOppTag').textContent=opponentTag;$('#tapePosterPlayerName').textContent=f.player.name;$('#tapePosterOppName').textContent=f.opp.name;$('#tapeFightDate').textContent=fightPosterDate();$('#tapeStatsPlayerName').textContent=f.player.name;$('#tapeStatsPlayerMeta').textContent=`${playerRecord} · ${playerTag}`;$('#tapeStatsOppName').textContent=f.opp.name;$('#tapeStatsOppMeta').textContent=`${opponentRecord} · ${opponentTag}`;
    $('#tapePlayerArt').src=$('#heroFighterArt').src;$('#tapeOppSprite').src=silhouetteForOpponent(f.o);$('#tapeOppSprite').alt=`${f.o.name} ${f.o.network||f.o.portraitAsset?'portrait':'silhouette'}`;$('#tapeOppSprite').classList.toggle('network-portrait',!!f.o.network);$('#tapeOppSprite').classList.toggle('real-portrait',!!f.o.portraitAsset);$('#tapeOppSprite').classList.toggle('unknown-silhouette',!f.o.network&&!f.o.portraitAsset);
    renderTapeAttributes(f);$('#tapeTitleBout').hidden=!titleBout;$('#tapeStage .tape-card').classList.toggle('title-bout',titleBout);$('#tapeChampionLabel').textContent=titleBout?(playerIsChampion?`${state.name} IS THE REIGNING CHAMPION`:`${f.o.name} IS THE REIGNING CHAMPION`):'';const advice=firstContract?{tone:'step-up',headline:'YOUR FIRST CONTRACT',message:'The Vaso win got you noticed. Diego brings grappling pressure, and beating him proves your debut was no fluke.'}:LOGIC.matchupAdvice({playerLevel:state.level,opponentLevel:f.o.tier,playerRating:f.player.power+f.player.speed+f.player.chin+f.player.cardio,opponentRating:f.opp.power+f.opp.speed+f.opp.chin+f.opp.cardio,titleBout,playerIsChampion,rookieShowcase});const agentRead=$('#tapeAgentRead');agentRead.className=`tape-agent-read ${advice.tone}`;$('#tapeAgentHeadline').textContent=advice.headline;$('#tapeAgentMessage').textContent=advice.message;
    $('#tapeBoutClass').textContent=titleBout?'WORLD TITLE':f.o.network?'RANKED BOUT':'UNRANKED BOUT';$('#tapeBoutRounds').textContent='3 ROUNDS';$('#tapeCardPlacement').textContent=titleBout?'MAIN EVENT':'MAIN CARD';const xpTier=opponentXpTier(f.o),reward=fightWinRewardPreview(f.o),xpStatus=$('#tapeXpStatus'),needsEnergy=opponentCleared&&fightsLeft>0&&!hasActionEnergy(),fightButton=$('#tapeFightBtn');xpStatus.textContent=`WIN REWARD · +${reward.xp} XP · +${reward.points} ATTR PT${reward.points===1?'':'S'}`;xpStatus.className=`tape-xp-status ${xpTier.tier}`;fightButton.hidden=false;fightButton.disabled=!cleared;$('#tapeClearance').classList.toggle('recovery-needed',needsEnergy);$('#tapeClearance').textContent=!opponentCleared?(f.o.titleCooldown?(f.o.championDefense?'TITLE DEFENSE USED · AVAILABLE AT MIDNIGHT':'TITLE ATTEMPT USED · AVAILABLE AT MIDNIGHT'):'MATCHUP UNAVAILABLE'):!fightsLeft?'DAILY FIGHT LIMIT REACHED · NEW FIGHTS AT LOCAL MIDNIGHT':state.health<MINIMUM_FIGHT_HEALTH?`MEDICAL CLEARANCE REQUIRES ${MINIMUM_FIGHT_HEALTH} HEALTH`:needsEnergy?`0 ENERGY · CHARGING AUTOMATICALLY · ${LOGIC.formatCountdown(LOGIC.recoveryTimeRemaining(state.energy,state.maxEnergy,state.energyRecoveryAt,energyRecoveryInterval()))}`:startingCondition<100?`LIMITED CLEARANCE · ${startingCondition}% STARTING CONDITION`:`CLEARED · FIGHT USES UP TO ${FIGHT_ENERGY_COST} ENERGY`;
    const edge=(f.player.power+f.player.speed+f.player.chin+f.player.cardio)-(f.opp.power+f.opp.speed+f.opp.chin+f.opp.cardio),playerFavorite=edge>=4,oppFavorite=edge<=-4;$('#tapeStatsPlayerFavorite').hidden=!playerFavorite;$('#tapeStatsOppFavorite').hidden=!oppFavorite;
    const matchup=edge>4?'YOU HAVE THE STATISTICAL EDGE':edge<-4?'OPPONENT HAS THE STATISTICAL EDGE':'ATTRIBUTES ARE EVENLY MATCHED',titleAction=f.o.titleMode==='defense'?'DEFEND THE TITLE':f.o.titleMode==='rematch'?'RECLAIM THE TITLE':'FIGHT FOR THE TITLE';$('#walkoutText').textContent=rookieShowcase?ROOKIE_SHOWCASE.headline:firstContract?FIRST_CONTRACT.headline:matchup;$('#tapeFightBtn').textContent=titleBout?titleAction:rookieShowcase?ROOKIE_SHOWCASE.actionLabel:firstContract?FIRST_CONTRACT.actionLabel:'SET FIGHT PLAN';$('#fightPlanConfirm').textContent=titleBout?titleAction:firstContract?FIRST_CONTRACT.actionLabel:'LOCK IN FIGHT PLAN';renderTapeBreakdown();
  }

  function showFightStage(stage){['tapeStage','planStage','liveStage'].forEach(id=>$('#'+id).classList.toggle('hidden',id!==stage))}
  const fightPlanFeature=globalThis.CAGE_FIGHT_PLAN.createFightPlanFeature({$,$$,getFight:()=>fight,getState:()=>state,isCombatLocked:()=>combatLocked,currentStyle,escapeHtml,showFightStage,saveState,trackEvent,tap:()=>sfx.tap(),beginFight:beginPlannedFight});
  function fightPlanLabel(plan=fight?.gamePlan){return fightPlanFeature.label(plan)}
  function beginFightPlan(){fightPlanFeature.begin()}
  function selectFightPlanSetting(setting,value){fightPlanFeature.select(setting,value)}
  function confirmFightPlan(){fightPlanFeature.confirm()}
  function offerRookieShowcase(){
    if(!state.nameLocked||!state.rookieShowcasePending||state.pendingFight)return false;
    const opponent=ensureRookieShowcaseOpponent();if(!opponent||!opponentAvailable(opponent))return false;
    navTo('fight');requestAnimationFrame(()=>openTaleOfTape(opponent));return true;
  }
  function offerFirstContractOpponent(){
    if(!state.nameLocked||!state.firstContractPending||state.pendingFight||fight)return false;
    const opponent=ensureFirstContractOpponent();if(!opponent||!opponentAvailable(opponent))return false;
    saveState();navTo('fight','replace');requestAnimationFrame(()=>openTaleOfTape(opponent));return true;
  }
  function openTaleOfTape(o,options={}){
    const fromFeed=options.fromFeed===true;if(!opponentAvailable(o)&&!fromFeed){toast(o.globalChampionship?(o.titleCooldown?(sharedChampionship?.is_champion?'Your title defense is complete for today.':championshipResetCopy(sharedChampionship)):'That title matchup is not currently available.'):`${o.name} is not currently available.`,'#ffb157');return}
    closeTapeStats(false);closeTapeBreakdown(false);clearFightTimers();fight=createFight(o);if(fromFeed&&/^shared-\d+$/.test(String(options.feedChallengePostId||'')))fight.feedChallengePostId=String(options.feedChallengePostId);combatLocked=false;fightTimelineIndex=0;trackEvent('fight_matchup_viewed',{opponent_key:o.key,opponent_archetype:o.tendency,is_rematch:(o.meetings||0)>0,is_title:!!o.globalChampionship,rookie_showcase:!!o.rookieShowcase,first_contract:!!o.firstContract});$('#tapeBackBtn').textContent=fromFeed?'BACK TO FEED':'GO BACK';$('#fightOverlay').classList.add('active');showFightStage('tapeStage');$('#tapeStage').scrollTop=0;fillTape(fight);writeHistory('preview','push');sfx.tap();
  }
  function closeFightPreview(){const fromHistory=arguments[0]===true;if(combatLocked)return;if(!fromHistory&&history.state?.[HISTORY_KEY]&&history.state.layer==='preview'){history.back();return}closeTapeStats(false);closeTapeBreakdown(false);clearFightTimers();$('#fightOverlay').classList.remove('active');$('#tapeBackBtn').textContent='GO BACK';fight=null;sfx.tap()}
  async function commitFight(o=fight?.o){
    if(!o)return;
    if(combatLocked||state.pendingFight)return;
    if(!opponentAvailable(o)){toast(o.globalChampionship?(o.titleCooldown?(sharedChampionship?.is_champion?'Your title defense is complete for today.':championshipResetCopy(sharedChampionship)):'That title matchup is not currently available.'):`${o.name} is not currently available.`,'#ffb157');return}
    if(sessionsLeft('fight',DAILY_FIGHT_LIMIT)<1){toast('Daily fight limit reached. New fights unlock at local midnight.','#ff766d');fillTape(fight);return}
    if(state.health<MINIMUM_FIGHT_HEALTH){toast(`You need at least ${MINIMUM_FIGHT_HEALTH} health to be cleared.`,'#ff766d');return}
    if(!hasActionEnergy()){toast('You cannot fight at 0 Energy. Charging automatically.','#ff766d');return}
    let championshipBout=null;if(o.globalChampionship){$('#tapeFightBtn').disabled=true;$('#tapeFightBtn').textContent='BOOKING TITLE FIGHT…';try{if(!await connectSharedSocial(true))throw new Error(sharedSocialError||'Cage Network connection required.');championshipBout=await SHARED_FEED.beginChampionshipBout(o.sourceProfileId);if(!championshipBout?.challenge_id)throw new Error('The title fight could not be booked.')}catch(error){toast(fighterSessionMessage(error),'#ff766d');fillTape(fight);return}}
    const booking=LOGIC.bookFight(state,o.key,FIGHT_ENERGY_COST,Date.now(),MINIMUM_ACTION_ENERGY_EXCLUSIVE);if(!booking.ok){if(booking.reason==='energy')toast('You cannot fight at 0 Energy. Charging automatically.','#ff766d');return}
    if(o.rookieShowcase)state.rookieShowcasePending=false;if(o.firstContract)state.firstContractPending=false;
    if(championshipBout)Object.assign(state.pendingFight,{challengeId:championshipBout.challenge_id,challengerId:championshipBout.challenger_id,playerIsChampion:championshipBout.player_is_champion===true});
    if(championshipBout){const event=o.titleMode==='defense'?'title_defense_started':o.titleMode==='rematch'?'title_rematch_started':'title_challenge_started';trackEvent(event,{opponent_id:o.sourceProfileId})}
    const feedChallengePostId=fight.feedChallengePostId;initAudio();clearFightTimers();fight=createFight(o);fight.championshipBout=championshipBout;if(feedChallengePostId)fight.feedChallengePostId=feedChallengePostId;combatLocked=true;fightTimelineIndex=0;trackEvent('fight_started',{fight_mode:'planned',player_archetype:state.fighterStyle,opponent_key:o.key,opponent_archetype:o.tendency,is_rematch:(o.meetings||0)>0,is_title:!!o.globalChampionship,rookie_showcase:!!o.rookieShowcase,first_contract:!!o.firstContract,energy_spent:booking.energySpent});
    $('#fightOverlay').classList.add('active');$('#actionFeed').innerHTML='';$('#cornerChoice').innerHTML='';writeHistory('fight','replace');sfx.tap();saveState();updateUI();beginFightPlan();
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
    const intro=$('#roundInterstitial'),playerCondition=Math.round(fight.playerCondition),liveCard=$('#liveStage .live-card');liveCard.style.setProperty('--player-accent',fighterAccent(state.fighterCity));liveCard.style.setProperty('--opponent-accent',fight.o.network?fighterAccent(fight.o.networkCity):fight.o.color||DEFAULT_FIGHTER_ACCENT);intro.classList.remove('active','leaving');intro.setAttribute('aria-hidden','true');resetBloodSportBurst();showFightStage('liveStage');setFightDecisionFocus(false);$('#livePlayerName').textContent=fight.player.name;$('#liveOppName').textContent=fight.opp.name;$('#liveOppStyle').textContent=fight.o.tag||'UNKNOWN STYLE';$('#livePlayerCondition').style.width=`${playerCondition}%`;$('#liveOppCondition').style.width='100%';$('#livePlayerConditionText').textContent=`${playerCondition}% CONDITION`;$('#liveOppConditionText').textContent='100% CONDITION';
  }
  function beginPlannedFight(){
    if(!fight||fight.rounds.length)return;fight.openingApproach=fightPlanLabel(fight.gamePlan).toLowerCase();fight.tendencyRevealed=true;
    for(let round=1;round<=FIGHT_ROUNDS&&!fight.winner;round++)simulateRound(fight,round,plannedStyleForRound(fight,round));
    fight.finalDecisionPending=false;if(!fight.winner&&fight.rounds.length>=FIGHT_ROUNDS)settleFightDecision(fight);fight.timeline=fight.timeline.filter(item=>item.type!=='fightMoment'&&item.type!=='lastChance');prepareLiveFight();trackEvent('fight_planned_sim_started',{player_archetype:state.fighterStyle,pace:fight.gamePlan.pace,offense:fight.gamePlan.offense,tactics:fight.gamePlan.tactics,rounds_simulated:fight.rounds.length});fightTimelineIndex=0;playFightTimeline(0);
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
    const def=fightMomentDefs[item.moment]||fightMomentDefs.tactical,box=$('#cornerChoice');fight.pendingMoment=item;setFightDecisionFocus(true);
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
    scheduleFight(()=>{setFightDecisionFocus(false);box.innerHTML='';$('#livePlayerCondition').classList.remove('moment-impact');$('#liveOppCondition').classList.remove('moment-impact');appendFightLine({clock:item.clock,text:`${choice.label}: ${outcome}`,className:success?'big':'opp',playerCondition:clamp(item.playerCondition-playerConditionLoss,0,100),oppCondition:clamp(item.oppCondition-damage,0,100),big:success&&damage>=12,landed:success,side:success?'player':'opp',healthDamage:!success&&selfDamage?LOGIC.liveFightHealthDamage({landed:true,knockdown:selfDamage>=10}):0,fightInjury});playFightTimeline(fightTimelineIndex+1)},900);
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

  function applyLiveFightHealthDamage(item){
    const requested=Math.max(0,Math.round(Number(item?.healthDamage)||0));if(!requested||item.healthApplied)return 0;item.healthApplied=true;const before=state.health;state.health=clamp(state.health-requested,1,state.maxHealth);const lost=Math.max(0,Number((before-state.health).toFixed(2)));if(!lost)return 0;fight.healthLost=Number(((fight.healthLost||0)+lost).toFixed(2));$('#hudHealthText').textContent=`${Math.floor(state.health)}/${state.maxHealth}`;$('#hudHealthBar').style.width=(state.health/state.maxHealth*100)+'%';flashResource('health',lost);lastShownHealth=Math.floor(state.health);saveState();return lost;
  }
  function applyLiveFightInjury(item){
    if(!item?.fightInjury||item.injuryApplied)return null;item.injuryApplied=true;const injury=fightInjuryDefs.find(def=>def.id===item.fightInjury.id);if(!injury)return null;if(!state.fightInjury)state.fightInjury={id:injury.id,date:todayKey()};saveState();trackEvent('fight_injury_suffered',{injury_id:injury.id,condition_after:Math.round(Number(item.playerCondition)||0)});return injury;
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
    const intro=$('#roundInterstitial');if(!intro){resume();return}const score=$('#roundInterstitialScore');$('#roundInterstitialIcon').innerHTML=gameIcon(`round-intro-${round}`,'🔔');$('#roundInterstitialNumber').textContent=`ROUND ${round}`;if(round===1){score.textContent='THE FIGHT STARTS NOW'}else{const totals=LOGIC.fightScore(fight.rounds.filter(item=>item.round<round)),read=totals.player>totals.opponent?'YOU LEAD':totals.player<totals.opponent?'YOU TRAIL':'EVEN';score.textContent=`CORNER SCORE · ${read} ${totals.player}–${totals.opponent}`}intro.classList.remove('leaving');intro.classList.add('active');intro.setAttribute('aria-hidden','false');scheduleFight(()=>{intro.classList.add('leaving');intro.classList.remove('active');scheduleFight(()=>{intro.classList.remove('leaving');intro.setAttribute('aria-hidden','true');resume()},300)},2000);
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
    const resultTape=$('#resultTape'),playerPortrait=currentAvatar()?.asset||$('#heroFighterArt').src,opponentPortrait=silhouetteForOpponent(f.o);resultTape.style.setProperty('--player-accent',fighterAccent(state.fighterCity));resultTape.style.setProperty('--opponent-accent',f.o.network?fighterAccent(f.o.networkCity):f.o.color||DEFAULT_FIGHTER_ACCENT);resultTape.innerHTML=`<div class="rt-name rt-player">${escapeHtml(f.player.name)}</div><div class="rt-vs">VS</div><div class="rt-name rt-opponent">${escapeHtml(f.opp.name)}</div><div class="rt-portrait rt-player"><img src="${escapeHtml(playerPortrait)}" alt="${escapeHtml(f.player.name)}"></div><div class="rt-vs rt-portrait-vs">VS</div><div class="rt-portrait rt-opponent"><img src="${escapeHtml(opponentPortrait)}" alt="${escapeHtml(f.opp.name)} ${f.o.network||f.o.portraitAsset?'portrait':'silhouette'}"></div><div class="rt-stats"><div class="rt-player"><b>${formatStat(f.player.power)}/${formatStat(f.player.speed)}/${formatStat(f.player.chin)}/${formatStat(f.player.cardio)}</b><br><small>PWR · SPD · CHN · CAR</small></div><div class="rt-vs">RATINGS</div><div class="rt-opponent"><b>${formatStat(f.opp.power)}/${formatStat(f.opp.speed)}/${formatStat(f.opp.chin)}/${formatStat(f.opp.cardio)}</b><br><small>PWR · SPD · CHN · CAR</small></div></div><div class="rt-focus">FIGHT PLAN · <b>${fightPlanLabel(f.gamePlan)}</b><br>PLAN GRADE · <b class="plan-grade ${planAssessment.grade.toLowerCase()}">${planAssessment.grade}</b></div>`;
    const official=LOGIC.fightScore(f.rounds),decision=f.method.includes('DECISION'),judgeScores=renderOfficialJudges(f,official),officialWinner=f.winner==='player'?f.player.name:f.opp.name,judgeLine=judgeScores.map((card,index)=>`J${index+1} ${card.player}-${card.opponent}`).join(' · ');$('#roundStats').innerHTML=`<table class="round-table"><thead><tr><th>RD</th><th>${f.player.name}<br>LAND/DAMAGE</th><th>SCORE</th><th>${f.opp.name}<br>LAND/DAMAGE</th></tr></thead><tbody>${f.rounds.map(r=>`<tr><td>${r.round}</td><td class="${r.scoreP>r.scoreO?'winner-cell':'loser-cell'}">${r.player.landed}/${r.player.attempted} · ${r.player.damage}</td><td>${r.scoreP}-${r.scoreO}</td><td class="${r.scoreO>r.scoreP?'winner-cell':'loser-cell'}">${r.opp.landed}/${r.opp.attempted} · ${r.opp.damage}</td></tr>`).join('')}<tr class="score-total"><td>TOTAL</td><td>${official.player}</td><td>—</td><td>${official.opponent}</td></tr></tbody></table><div class="official-decision"><b>OFFICIAL RESULT</b> · ${officialWinner.toUpperCase()} · ${decision?`${judgeLine} · `:''}${f.method}</div>`;
    const p=f.totals.player,o=f.totals.opp;
    $('#fightTotals').innerHTML=`<div class="totals-grid"><div><b>${p.landed}/${p.attempted}</b></div><div class="label">Strikes</div><div><b>${o.landed}/${o.attempted}</b></div><div><b>${p.sig}</b></div><div class="label">Significant</div><div><b>${o.sig}</b></div><div><b>${p.takedowns}</b></div><div class="label">Takedowns</div><div><b>${o.takedowns}</b></div><div><b>${p.control}s</b></div><div class="label">Control</div><div><b>${o.control}s</b></div><div><b>${p.kd}</b></div><div class="label">Knockdowns</div><div><b>${o.kd}</b></div><div><b>${p.damage}</b></div><div class="label">Damage</div><div><b>${o.damage}</b></div></div>`;
  }

  function renderResultBonuses(notes=[]){
    const summary=$('#resultBonuses');if(!summary)return;summary.hidden=!notes.length;summary.innerHTML=notes.map(note=>`<div class="result-bonus-row${note.kind==='streak'?' win-streak-bonus':note.kind==='penalty'?' non-positive':''}">${note.kind==='streak'?'🔥 ':''}${escapeHtml(note.text)}</div>`).join('');
  }

  function showResultStage(stage='outcome'){
    const rewards=stage==='rewards',outcomeStage=$('#resultOutcomeStage'),rewardsStage=$('#resultRewardsStage'),card=$('#resultModal .result-card');
    outcomeStage.hidden=rewards;rewardsStage.hidden=!rewards;card.classList.toggle('showing-rewards',rewards);card.scrollTop=0;
    if(rewards){setRewardClaimReady(false);requestAnimationFrame(animateRewardMetrics)}else resetRewardAnimations();
  }

  function formatRewardMetric(value,plus=false){const amount=Math.trunc(Number(value)||0),sign=amount<0?'-':plus?'+':'';return `${sign}${fmt(Math.abs(amount))}`}
  function prepareRewardMetric(selector,value,plus=false){const metric=$(selector),amount=Math.trunc(Number(value)||0);if(!metric)return;metric.dataset.rewardValue=String(amount);metric.dataset.rewardPlus=plus?'true':'false';metric.textContent=formatRewardMetric(amount,plus)}
  function setRewardClaimReady(ready){const button=$('#continueBtn');if(!button)return;button.disabled=!ready;button.setAttribute('aria-busy',String(!ready));button.classList.toggle('rewards-counting',!ready);if(ready&&$('#resultRewardsStage')?.hidden===false)requestAnimationFrame(()=>button.focus())}
  function resetRewardAnimations(){rewardAnimationRun++;setRewardClaimReady(true);$$('.rewardbox').forEach(box=>{box.classList.remove('reward-animating','reward-complete');box.querySelector('.reward-particles')?.remove();const metric=box.querySelector('b[data-reward-value]');if(metric)metric.textContent=formatRewardMetric(metric.dataset.rewardValue,metric.dataset.rewardPlus==='true')})}
  function rewardParticles(box,positive,index){box.querySelector('.reward-particles')?.remove();const layer=document.createElement('span');layer.className=`reward-particles ${positive?'gain':'loss'}`;layer.setAttribute('aria-hidden','true');for(let i=0;i<9;i++){const particle=document.createElement('i');particle.style.setProperty('--particle-x',`${12+((i*31+index*17)%77)}%`);particle.style.setProperty('--particle-drift',`${((i*19)%31)-15}px`);particle.style.setProperty('--particle-delay',`${(i%4)*45}ms`);layer.appendChild(particle)}box.appendChild(layer)}
  function animateRewardMetrics(){const run=++rewardAnimationRun,reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true,metrics=['#rewardPrimary','#rewardFans','#rewardXp'].map(selector=>$(selector)).filter(Boolean);let remaining=metrics.length;setRewardClaimReady(false);initAudio();const finishMetric=(box,metric,target,plus)=>{if(run!==rewardAnimationRun)return;metric.textContent=formatRewardMetric(target,plus);box.classList.remove('reward-animating');box.classList.add('reward-complete');remaining--;if(remaining===0)setRewardClaimReady(true)};if(!metrics.length){setRewardClaimReady(true);return}metrics.forEach((metric,index)=>{const box=metric.closest('.rewardbox'),target=Math.trunc(Number(metric.dataset.rewardValue)||0),plus=metric.dataset.rewardPlus==='true',positive=target>0;box.classList.remove('reward-animating','reward-complete');box.querySelector('.reward-particles')?.remove();metric.textContent=formatRewardMetric(0,plus);setTimeout(()=>{if(run!==rewardAnimationRun)return;box.classList.add('reward-animating');sfx[positive?'rewardGood':'rewardBad'](positive?index:target<0);if(!reduced)rewardParticles(box,positive,index);if(reduced){finishMetric(box,metric,target,plus);return}const started=performance.now(),duration=650+Math.min(350,Math.log10(Math.abs(target)+1)*130);const tick=now=>{if(run!==rewardAnimationRun)return;const progress=Math.min(1,(now-started)/duration),eased=1-Math.pow(1-progress,3),current=Math.round(target*eased);metric.textContent=formatRewardMetric(current,plus);if(progress<1)requestAnimationFrame(tick);else finishMetric(box,metric,target,plus)};requestAnimationFrame(tick)},index*230)})}

  function styleResultMetric(selector,value){
    const metric=$(selector),box=metric?.closest('.rewardbox'),nonPositive=Number(value)<=0;if(!box)return;box.classList.toggle('non-positive',nonPositive);box.classList.toggle('positive',!nonPositive);
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

  function finalizePersistentFightDamage(f){
    const rawDamage=Math.max(0,Math.round(Number(f?.healthLost)||0)),target=LOGIC.finalFightHealthLoss({rawDamage,won:f?.winner==='player',forfeited:!!f?.forfeited,finish:f?.method}),additional=Math.max(0,target-rawDamage),before=state.health;
    if(additional>0)state.health=clamp(state.health-additional,1,state.maxHealth);
    const applied=Math.max(0,Math.round(before-state.health));f.healthLost=rawDamage+applied;return f.healthLost;
  }

  function finishFightSimulation(){
    if(!fight||fight.ended)return;fight.ended=true;clearFightTimers();combatLocked=true;ensureDailyCounters();state.dailyCounters.fight++;
    const o=fight.o,win=fight.winner==='player',lowerLevelWin=win&&o.min<state.level,circuitOpponent=!o.network&&!o.rookieShowcase&&!o.firstContract&&!o.globalChampionship,firstCareerWin=win&&state.wins===0,firstContractUnlocked=LOGIC.firstContractUnlockEligible({won:win,rookieShowcase:o.rookieShowcase===true}),winsToday=opponentWinsToday(o),xpTier=LOGIC.opponentXpTier(winsToday,o.min,state.level),dropEligible=LOGIC.fightDropEligible(winsToday),isRematch=(o.meetings||0)>0,rivalry=(o.meetings||0)>=2,ordinaryRival=!o.network&&!o.globalChampionship&&(o.lossesToPlayer||0)>0,playerRating=fight.player.power+fight.player.speed+fight.player.chin+fight.player.cardio,oppRating=fight.opp.power+fight.opp.chin+fight.opp.speed+fight.opp.cardio,upset=win&&oppRating>=playerRating+4,healthLoss=finalizePersistentFightDamage(fight),titleWon=!!(win&&o.globalChampionship&&!fight.championshipBout?.player_is_champion),xpResult=LOGIC.fightXp({playerLevel:state.level,opponentLevel:o.min,won:win,forfeited:!!fight.forfeited,upset,ranked:!!o.network&&!o.globalChampionship,championship:!!o.globalChampionship,titleWon,rival:ordinaryRival,opponentWinsToday:winsToday}),hypeBefore=state.hype;let fans=0,xp=xpResult.xp,ceoHype=0,gearDrop=null,attributePoint=0;const lootNotes=[];o.meetings=(o.meetings||0)+1;
    const victoryPackEligible=win&&LOGIC.victoryPackWinEligible({playerLevel:state.level,opponentLevel:o.min,repeatEligible:dropEligible}),victoryPackProgressSteps=victoryPackEligible&&(upset||rivalry||fight.method.includes('KO'))?2:victoryPackEligible?1:0;
    if(win){
      o.losses=(o.losses||0)+1;o.lossesToPlayer=(o.lossesToPlayer||0)+1;o.rematchAccepted=false;state.wins++;state.winStreak++;state.bestStreak=Math.max(state.bestStreak,state.winStreak);attributePoint=LOGIC.awardVictoryAttributePoint(state,{won:true,forfeited:false,playerLevel:state.level,opponentLevel:o.min});if(lowerLevelWin){const penalty=LOGIC.lowerLevelFollowerPenalty(state.fans,{won:true,playerLevel:state.level,opponentLevel:o.min});fans=changeFollowers(-penalty)}else{fans=Math.round(o.fans*(1+state.hype/100)*(1+ownedBonus('prestige')/100)*(upset?1.25:1)*(rivalry?1.15:1)*rand(.9,1.2));fans=changeFollowers(fans)}state.hype=clamp(state.hype+xpTier.hypeChange,0,100);sfx.win();confettiBurst();
      if(victoryPackEligible||titleWon||firstCareerWin)gearDrop=awardDeterministicGearDrop({opponent:o,titleWon,guaranteed:firstCareerWin,progressSteps:victoryPackProgressSteps});ceoHype=awardCeoPerformanceRecognition({upset,ko:fight.method.includes('KO'),titleWon});
      if(lowerLevelWin)lootNotes.push({kind:'penalty',text:`FAN BACKLASH · ${fmt(Math.abs(fans))} FOLLOWERS LOST (5%)`});const currentSponsor=endorsementDefs.find(item=>item.id===state.activeEndorsement?.id);if(currentSponsor)lootNotes.push({kind:'sponsor',text:`CURRENT SPONSOR · ${currentSponsor.brand}`});if(firstContractUnlocked)lootNotes.push({kind:'milestone',text:'FIRST CONTRACT UNLOCKED · DIEGORAMOSBR'});if(o.globalChampionship)lootNotes.push({kind:'milestone',text:'CONFIRMING TITLE RESULT'});if(ceoHype)lootNotes.push({kind:'milestone',text:'CEO NOTICED · +3 HYPE'});if(upset)lootNotes.push({kind:'milestone',text:'UPSET VICTORY'});if(rivalry)lootNotes.push({kind:'milestone',text:'RIVALRY WIN'});if(state.winStreak>1)lootNotes.push({kind:'streak',text:`${state.winStreak}-FIGHT WIN STREAK`});if(circuitOpponent)state.circuitLossStreak=0;
      $('#resultTitle').textContent='YOU WIN';$('#resultTitle').className='win';$('#resultLine').textContent=fight.lastChanceLanded?`Ten seconds left, behind on the cards, and one haymaker changed everything.`:fight.method==='SUBMISSION'?`${o.name} taps out. Your grappling just made a statement.`:fight.method.includes('KO')?`${o.name} could not answer the damage. Your stock just jumped.`:`The scorecards are in. Your hand gets raised.`;
    }else{
      o.wins=(o.wins||0)+1;o.winsVsPlayer=(o.winsVsPlayer||0)+1;o.rematchAccepted=true;if(circuitOpponent&&!fight.forfeited){o.lastDefeatedPlayerAt=Date.now();state.circuitLossStreak++}state.losses++;state.winStreak=0;if(!fight.forfeited){fans=Math.round(o.fans*.15);fans=changeFollowers(fans)}state.hype=clamp(state.hype-7,0,100);sfx.lose();
      if(fight.forfeited){$('#resultTitle').textContent='FIGHT FORFEITED';$('#resultLine').textContent=`You left the cage. ${o.name} receives the win, and the loss is official.`}else{$('#resultTitle').textContent='YOU LOST';$('#resultLine').textContent=fight.cornerTowel?`Your corner protected you. ${o.name} gets the TKO win.`:fight.haymakerMiss?'The last-chance haymaker missed, and the counter ended the fight.':fight.method==='SUBMISSION'?`${o.name} forced the tap. Rebuild your defense and come back sharper.`:fight.method.includes('KO')?'The referee saves you from more damage. Back to the gym.':'Close the scorecard, remember the lesson, and come back better.'}$('#resultTitle').className='loss';
    }
    if(firstContractUnlocked){state.firstContractPending=true;ensureFirstContractOpponent();trackEvent('first_contract_unlocked',{opponent_key:FIRST_CONTRACT.key,source_opponent_key:o.key})}ensureRoster();state.dailyOpponentWins.wins[o.key]=LOGIC.nextOpponentXpStage(winsToday,win);
    if(xp)gainXp(xp);xpResult.modifiers.forEach(text=>lootNotes.push({kind:'milestone',text}));if(win&&xpTier.hypeChange<0)lootNotes.push({kind:'penalty',text:`STALE MATCHUP · ${xpTier.hypeChange} HYPE · NO VICTORY PACK PROGRESS`});
    const resultDamage=$('#resultDamage');resultDamage.hidden=!healthLoss;resultDamage.textContent=healthLoss?`♥ HEALTH −${healthLoss}`:'';
    $('#ceoResultSpotlight').hidden=true;
    if(consumeFeedChallenge(fight.feedChallengePostId,win?`@${state.name}`:`@${o.networkHandle||o.name}`))trackEvent('feed_challenge_completed',{opponent_id:o.sourceProfileId||'',result:win?'win':'loss',forfeited:!!fight.forfeited});
    openSocialCycle('fight',{win,opponent:o.name,method:fight.method,winStreak:state.winStreak,injury:win?currentFightInjury()?.name||'':'',title:''});
    renderResultBonuses(lootNotes);
    const xpResultLabel=fight.forfeited?'FORFEIT · NO XP':xpTier.resultLabel,planAssessment=fight.planAssessment||assessFightPlan(fight),hypeChange=state.hype-hypeBefore;trackEvent('fight_completed',{result:win?'win':'loss',fight_mode:'planned',plan_pace:fight.gamePlan.pace,plan_offense:fight.gamePlan.offense,plan_tactics:fight.gamePlan.tactics,plan_grade:planAssessment.grade.toLowerCase(),plan_modifier:Number(planAssessment.modifier.toFixed(3)),health_lost:healthLoss,method:String(fight.method).toLowerCase().replace(/\s+/g,'_'),finish_round:fight.finishRound,rounds_fought:fight.rounds.length,player_archetype:state.fighterStyle,opponent_key:o.key,opponent_archetype:o.tendency,is_rematch:isRematch,is_title:!!o.globalChampionship,rookie_showcase:!!o.rookieShowcase,first_contract:!!o.firstContract,title_won:titleWon,upset,rivalry,attribute_points_earned:attributePoint,followers_change:fans,hype_change:hypeChange,xp_earned:xp,xp_category:xpResult.category,xp_repeat_tier:xpTier.tier,gear_rarity:gearDrop?.rarity?.toLowerCase()||'none'});if(o.globalChampionship&&fight.championshipBout)state.pendingChampionshipResult={challengeId:fight.championshipBout.challenge_id,challengerId:fight.championshipBout.challenger_id,challengerWon:fight.championshipBout.player_is_champion===true?!win:win,mode:o.titleMode||'challenge'};state.pendingFight=null;pendingResultDrop=gearDrop;resultDropRevealed=false;buildResultDetails(fight);renderChampionshipSettlement(o.globalChampionship?'pending':'',o.globalChampionship?'CONFIRMING TITLE RESULT':'');prepareRewardMetric('#rewardPrimary',win?attributePoint:hypeChange,win||hypeChange>0);$('#rewardPrimaryLabel').textContent=win?(attributePoint===1?'ATTRIBUTE POINT':'ATTRIBUTE POINTS'):'HYPE';prepareRewardMetric('#rewardFans',fans,fans>=0);$('#rewardFansLabel').textContent=fans<0?'FOLLOWERS LOST':'FOLLOWERS';prepareRewardMetric('#rewardXp',xp,true);styleResultMetric('#rewardPrimary',win?attributePoint:hypeChange);styleResultMetric('#rewardFans',fans);styleResultMetric('#rewardXp',xp);const rewardXpLabel=$('#rewardXpLabel');rewardXpLabel.textContent='XP';rewardXpLabel.title=xpResultLabel;rewardXpLabel.setAttribute('aria-label',`XP · ${xpResultLabel}`);lastFightShareData=win?{opponent:o.networkHandle||o.name,method:fight.method,round:fight.finishRound,record:`${state.wins}-${state.losses}`,winStreak:state.winStreak,titleWon}:null;$('#shareWinBtn').hidden=!win;renderPostFightTutorial(win);renderAttributeAssignment();armResultAction(fight.forfeited?'CONTINUE':'CLAIM REWARDS');showResultStage('outcome');const lootBox=$('#lootBox');lootBox.style.display='none';lootBox.className='loot';lootBox.innerHTML='';$('#resultDetails').classList.remove('open');const detailsToggle=$('#detailsToggle');detailsToggle.style.display='';detailsToggle.textContent='VIEW SCORECARD';const card=$('#resultModal .result-card');card.classList.remove('revealing','drop-celebration','fight-win','fight-loss');card.classList.add(win?'fight-win':'fight-loss');void card.offsetWidth;card.classList.add('revealing');card.scrollTop=0;writeHistory('result','replace');saveState();if(o.globalChampionship)settleChampionshipResult();scheduleFight(()=>{$('#resultModal').style.display='flex';requestAnimationFrame(()=>$('#resultContinueBtn').focus())},180);
    if(win){const victoryLoot=$('#lootBox');victoryLoot.style.display='block';victoryLoot.className='loot victory-pack-progress';victoryLoot.innerHTML=victoryPackResultHtml({earned:!!gearDrop,eligible:victoryPackEligible,steps:victoryPackProgressSteps,lowerLevel:o.min<state.level,repeatEligible:dropEligible,titleWon,firstCareerWin})}
  }

  function armResultAction(label){
    const button=$('#continueBtn');button.disabled=false;button.textContent=label;
  }

  async function shareFightWin(){
    if(shareWinPending||!lastFightShareData)return;shareWinPending=true;const button=$('#shareWinBtn'),text=LOGIC.fightWinShareText(lastFightShareData);button.disabled=true;
    try{
      if(typeof navigator.share==='function'){await navigator.share({title:'Cage Grind Victory',text});button.textContent='WIN SHARED'}
      else{await navigator.clipboard.writeText(text);button.textContent='RESULT COPIED'}
      trackEvent('fight_win_shared',{method:String(lastFightShareData.method).toLowerCase().replace(/\s+/g,'_'),title_win:lastFightShareData.titleWon===true});
    }catch(error){
      if(error?.name==='AbortError'){button.textContent='SHARE WIN'}else{const modal=$('#shareFallbackModal'),field=$('#shareFallbackText');field.value=text;modal.classList.add('open');modal.setAttribute('aria-hidden','false');field.focus();field.select();button.textContent='SELECT RESULT TEXT'}
    }finally{shareWinPending=false;button.disabled=false;setTimeout(()=>{if(button.isConnected)button.textContent='SHARE WIN'},1800)}
  }
  function closeShareFallback(){const modal=$('#shareFallbackModal');modal.classList.remove('open');modal.setAttribute('aria-hidden','true')}
  function showPendingSponsor(){const sponsor=endorsementDefs.find(item=>item.id===state.sponsorAnnouncementPending);if(!sponsor)return false;$('#sponsorAnnouncementLogo').src=`assets/icons/${sponsor.id}.png?v=${ICON_ASSET_VERSION}`;$('#sponsorAnnouncementBrand').textContent=sponsor.brand;$('#sponsorAnnouncementMilestone').textContent=`${fmt(sponsor.followersRequired)} FOLLOWERS`;state.sponsorAnnouncementPending='';saveState();const modal=$('#sponsorAnnouncementModal');modal.classList.add('open');modal.setAttribute('aria-hidden','false');sfx.win();confettiBurst();requestAnimationFrame(()=>$('#sponsorAnnouncementClose').focus());return true}
  function closeSponsorAnnouncement(){const modal=$('#sponsorAnnouncementModal');modal.classList.remove('open');modal.setAttribute('aria-hidden','true');stopConfetti();updateUI();requestAnimationFrame(showPostFightFollowup)}
  function showPostFightFollowup(){if(showPendingSponsor())return true;if(levelUpSummary){showLevelUp(levelUpSummary);return true}if(offerFirstContractOpponent())return true;return showPendingTitleLoss()||showPendingCeoOffice()}

  function openDropClaim(drop,context={}){
    if(!drop)return false;pendingResultDrop=drop;pendingDropContext=context;resultDropRevealed=false;const modal=$('#dropClaimModal');$('#dropClaimEyebrow').textContent=context.eyebrow||'SEALED CAGE GRIND PACK';$('#dropClaimTitle').textContent=context.title||'VICTORY PACK';$('#dropClaimMessage').textContent=context.message||'You earned a sealed Victory Pack.';const rewards=$('#dropClaimRewards'),rewardItems=Array.isArray(context.rewards)?context.rewards:[];rewards.hidden=!rewardItems.length;rewards.innerHTML=rewardItems.map(reward=>`<span>${escapeHtml(reward)}</span>`).join('');$('#dropClaimStage').innerHTML='<img class="drop-claim-pack" src="assets/cage-grind-drop-pack.png?v=2.7.44" alt="Sealed Cage Grind collectible pack">';$('#dropRevealBtn').hidden=false;$('#dropRevealBtn').disabled=false;$('#dropCloseBtn').hidden=true;modal.classList.add('open');modal.setAttribute('aria-hidden','false');requestAnimationFrame(()=>$('#dropRevealBtn').focus());sfx.win();return true
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
    closeResult()
  }

  function closeResult(){
    const victoryDrop=pendingResultDrop;if(!state.postFightTutorialSeen){state.postFightTutorialSeen=true;saveState()}stopConfetti();clearFightTimers();$('#resultModal').style.display='none';$('#fightOverlay').classList.remove('active');fight=null;pendingResultDrop=victoryDrop;resultDropRevealed=false;combatLocked=false;updateUI();navTo('fight','replace');if(victoryDrop)setTimeout(()=>openDropClaim(victoryDrop,{kind:'victory',eyebrow:'VICTORY PACK EARNED',title:'VICTORY PACK',message:'A surprise collectible pack landed after your win.'}),180);else requestAnimationFrame(showPostFightFollowup);
  }
  function closeDropClaim(){
    const context=pendingDropContext||{};$('#dropClaimModal').classList.remove('open');$('#dropClaimModal').setAttribute('aria-hidden','true');pendingResultDrop=null;pendingDropContext=null;resultDropRevealed=false;stopConfetti();if(context.kind==='daily')queueMicrotask(maybeGrantInstallReward);if(context.kind==='victory')requestAnimationFrame(showPostFightFollowup);
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
  document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-collectible-flip]')){e.preventDefault();toggleCollectibleCard(e.target)}});
  document.addEventListener('click',e=>{
    const fightMoment=e.target.closest('[data-fight-moment]');if(fightMoment){resolveFightMoment(fightMoment.dataset.fightMoment);return}
    const lastChance=e.target.closest('[data-last-chance]');if(lastChance){resolveLastChance(lastChance.dataset.lastChance);return}
    const crisis=e.target.closest('[data-crisis]');if(crisis){resolveFightCrisis(crisis.dataset.crisis);return}
    const planSetting=e.target.closest('[data-plan-setting]');if(planSetting){selectFightPlanSetting(planSetting.dataset.planSetting,planSetting.dataset.planValue);return}
    const fp=e.target.closest('[data-fight-plan]');if(fp){chooseCornerPlan(fp.dataset.fightPlan);return}
    const collectibleFlip=e.target.closest('[data-collectible-flip]');if(collectibleFlip&&!e.target.closest('button')){toggleCollectibleCard(collectibleFlip);return}
    const nav=e.target.closest('[data-nav]');if(nav){navTo(nav.dataset.nav);return}
    const attribute=e.target.closest('[data-assign-attribute]');if(attribute){assignAttribute(attribute.dataset.assignAttribute);return}
    const feedFilterButton=e.target.closest('[data-feed-filter]');if(feedFilterButton){feedFilter=feedFilterButton.dataset.feedFilter==='mentions'?'mentions':'all';renderSocial();$('#socialTimeline').scrollTop=0;sfx.tap();return}
    const feedIntent=e.target.closest('[data-feed-intent]');if(feedIntent){openFighterPostComposer(feedIntent.dataset.feedIntent);return}
    const feedChallenge=e.target.closest('[data-feed-challenge]');if(feedChallenge){openFeedChallenge(feedChallenge.dataset.feedChallenge,feedChallenge.dataset.feedChallengePost);return}
    const fighterPostProfile=e.target.closest('[data-fighter-post-target]');if(fighterPostProfile){fighterPostTarget=sharedSocialProfiles.find(item=>item.id===fighterPostProfile.dataset.fighterPostTarget)||null;fighterPostDraftOffset=0;renderFighterPostPreview();sfx.tap();return}
    const ceoProfile=e.target.closest('[data-ceo-profile]');if(ceoProfile){openCeoBio();return}
    const reporterProfile=e.target.closest('[data-reporter-profile]');if(reporterProfile){openReporterBio();return}
    const sponsorProfile=e.target.closest('[data-sponsor-profile]');if(sponsorProfile){openSponsorBio(sponsorProfile.dataset.sponsorProfile);return}
    const feedProfile=e.target.closest('[data-feed-profile]');if(feedProfile){openFighterBio(sharedSocialProfiles.find(item=>item.id===feedProfile.dataset.feedProfile));return}
    const eq=e.target.closest('[data-equip]');if(eq){toggleEquip(eq.dataset.equip,eq);return}
    const city=e.target.closest('[data-city]');if(city){chooseCity(city.dataset.city);return}
    const fi=e.target.closest('[data-fight-key]');if(fi){const opponent=opponents.find(o=>o.key===fi.dataset.fightKey);if(opponent)openTaleOfTape(opponent);return}
  });
  document.addEventListener('cagegrind:installchange',()=>updateUI());
  document.addEventListener('cagegrind:installed',()=>{const firstDetection=!state.installDetected;state.installDetected=true;if(firstDetection)trackEvent('game_installed');saveState();updateUI()});
  $('#installGameBtn').addEventListener('click',requestGameInstall);
  $('#landingEnterBtn').addEventListener('click',enterGameFromLanding);
  $('#dailyBtn').addEventListener('click',claimDaily);$('#dropRevealBtn').addEventListener('click',revealDropClaim);$('#dropCloseBtn').addEventListener('click',closeDropClaim);$('#resultContinueBtn').addEventListener('click',()=>{sfx.tap();showResultStage('rewards')});$('#continueBtn').addEventListener('click',handleResultAction);$('#levelUpContinue').addEventListener('click',closeLevelUp);
  $('#tapeBackBtn').addEventListener('click',closeFightPreview);$('#tapeFightBtn').addEventListener('click',()=>commitFight());$('#fightPlanConfirm').addEventListener('click',confirmFightPlan);$('#tapeStatsToggle').addEventListener('click',openTapeStats);$('#tapeStatsClose').addEventListener('click',()=>closeTapeStats());$('#tapeStatsBackdrop').addEventListener('click',()=>closeTapeStats());$('#tapeStatsPanel').addEventListener('keydown',e=>{if(e.key==='Escape')closeTapeStats()});$('#tapeTermsToggle').addEventListener('click',openTapeBreakdown);$('#tapeBreakdownClose').addEventListener('click',()=>closeTapeBreakdown());$('#tapeBreakdownBackdrop').addEventListener('click',()=>closeTapeBreakdown());$('#tapeBreakdown').addEventListener('keydown',e=>{if(e.key==='Escape')closeTapeBreakdown()});
  $('#detailsToggle').addEventListener('click',()=>{const details=$('#resultDetails'),open=!details.classList.contains('open');details.classList.toggle('open',open);$('#detailsToggle').textContent=open?'HIDE SCORECARD':'VIEW SCORECARD'});$('#shareWinBtn').addEventListener('click',shareFightWin);
  $('#shareFallbackClose').addEventListener('click',closeShareFallback);$('#shareFallbackModal').addEventListener('click',e=>{if(e.target===$('#shareFallbackModal'))closeShareFallback()});$('#sponsorAnnouncementClose').addEventListener('click',closeSponsorAnnouncement);$('#sponsorAnnouncementModal').addEventListener('click',e=>{if(e.target===$('#sponsorAnnouncementModal'))closeSponsorAnnouncement()});
  $('#previousFighterAvatarBtn').addEventListener('click',()=>stepFighterAvatar(-1));$('#randomFighterAvatarBtn').addEventListener('click',randomFighterAvatar);$('#nextFighterAvatarBtn').addEventListener('click',()=>stepFighterAvatar(1));$('#shuffleFighterAttributesBtn').addEventListener('click',shuffleFighterAttributes);$('#lockFighterBuildBtn').addEventListener('click',lockFighterBuild);
  $('#newFighterNameBtn').addEventListener('click',rerollFighterIdentity);$('#manualFighterNameBtn').addEventListener('click',toggleManualFighterIdentity);$('#manualFighterNameInput').addEventListener('input',updateManualFighterIdentity);$('#manualFighterNameInput').addEventListener('keydown',event=>{if(event.key==='Enter')lockFighterIdentity()});$('#lockFighterNameBtn').addEventListener('click',lockFighterIdentity);
  $('#retireCareerBtn').addEventListener('click',openRetirementDialog);$('#cancelRetireBtn').addEventListener('click',closeRetirementDialog);$('#confirmRetireBtn').addEventListener('click',retireCareer);
  $('#retireCareerModal').addEventListener('click',e=>{if(e.target===$('#retireCareerModal'))closeRetirementDialog()});$('#retireCareerModal').addEventListener('keydown',e=>{if(e.key==='Escape')closeRetirementDialog()});
  $('#fighterBioClose').addEventListener('click',closeFighterBio);
  $('#fighterBioModal').addEventListener('click',e=>{if(e.target===$('#fighterBioModal'))closeFighterBio()});
  $('#fighterBioModal').addEventListener('keydown',e=>{if(e.key==='Escape')closeFighterBio()});
  $('#openRankingsBtn').addEventListener('click',openRankings);$('#closeRankingsBtn').addEventListener('click',closeRankings);$('#rankingsModal').addEventListener('click',e=>{if(e.target===$('#rankingsModal'))closeRankings()});$('#rankingsModal').addEventListener('keydown',e=>{if(e.key==='Escape')closeRankings()});
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

  setInterval(updatePassiveRecovery,1000);

  const tickerLines=STRINGS.ticker;let ti=0;setInterval(()=>{$('#tickerText').textContent=tickerLines[++ti%tickerLines.length]},5200);
  setInterval(updateDailyResetClocks,1000);

  document.addEventListener('visibilitychange',()=>{if(!document.hidden)updatePassiveRecovery()});
  window.addEventListener('pageshow',updatePassiveRecovery);
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

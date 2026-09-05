'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const html=read('index.html');
const game=read('js/game.js');
const logic=read('js/game-logic.js');
const rules=read('fight-rules.json');
const definitions=read('js/definitions.js');
const strings=read('js/strings.js');
const styles=read('css/styles.css');
const steel=read('css/github-steel.css');
const readme=read('README.md');
const serviceWorker=read('service-worker.js');

test('Fight Skins appear only in Compare Stats and render the saved cosmetic tier',()=>{
  const statsStart=html.indexOf('id="tapeStatsPanel"'),attributesStart=html.indexOf('id="tapeAttributes"');
  for(const id of ['tapeStatsPlayerSkin','tapeStatsOpponentSkin']){
    assert.ok(html.indexOf('id="'+id+'"')>statsStart);
    assert.ok(html.indexOf('id="'+id+'"')<attributesStart);
  }
  assert.doesNotMatch(html,/id="tapePlayerSkin"|id="tapeOpponentSkin"/);
  assert.match(game,/fightSkinAura:Math.floor\(effectiveAura\(\)\)/);
  assert.match(game,/Number\(profile.fight_skin_aura\)/);
  assert.match(game,/renderStatsFightSkin\('#tapeStatsOpponentSkin',f.o.fightSkinAura\|\|0\)/);
  const skinDefinition=definitions.match(/const auraFightSkins = \[[\s\S]*?\n\];/)[0];
  const renderer=game.slice(game.indexOf('  function renderStatsFightSkin('),game.indexOf('  function fillTape('));
  const container={innerHTML:'',style:{setProperty(name,value){this[name]=value}}};
  const context={LOGIC:require('../js/game-logic.js'),$:()=>container,ICON_ASSET_VERSION:'test'};
  vm.createContext(context);
  vm.runInContext(skinDefinition+'\n'+renderer,context);
  for(const [aura,label] of [[0,'OBSCURE'],[40,'MAINSTREAM'],[60,'ELITE'],[80,'ICONIC'],[99,'LEGEND'],[100,'LEGEND']]){
    vm.runInContext('renderStatsFightSkin("#test",'+aura+')',context);
    assert.ok(container.innerHTML.includes('<b>'+label+'</b>'));
    const images=[...container.innerHTML.matchAll(/src="([^"?]+)\?v=test"/g)];
    assert.equal(images.length,4);
    images.forEach(([,asset])=>assert.ok(fs.existsSync(path.join(root,asset)),asset));
  }
  assert.equal(container.style['--fight-skin-accent'],'#ffdc78');
});

test('Open Gym reuses checked Fight Plan controls with a scoped green palette',()=>{
  const gym=html.slice(html.indexOf('data-screen="gym"'),html.indexOf('data-screen="gym"')+6000);
  assert.match(gym,/class="spar-target-grid fight-plan-toggle"/);
  assert.equal((gym.match(/class="fight-plan-toggle" role="group" aria-label="Sparring/g)||[]).length,3);
  assert.equal((gym.match(/data-spar-setting=/g)||[]).length,6);
  assert.match(game,/button.setAttribute\('aria-pressed',String\(active\)\)/);
  assert.match(styles,/\.open-gym-card \.fight-plan-toggle button\[aria-pressed="true"\]:after\{background:#dbe9df;color:#315840/);
  assert.match(styles,/\.open-gym-card \.spar-session-track i\{background:linear-gradient\(90deg,#4e775b,#98baa3\)/);
  assert.doesNotMatch(styles,/\.spar-plan-row button\.active\{/);
});

test('all seven sponsors have five distinct brand reaction messages',()=>{
  const context={};vm.runInNewContext(strings,context);
  const pools=context.CAGE_STRINGS.sponsorHighlights;
  assert.equal(Object.keys(pools).length,7);
  for(const id of ['bobs-auto','garys-bar-grill','volt','ironhide','apex-wireless','northline-auto','titan-global']){
    assert.equal(pools[id].length,5,id);assert.equal(new Set(pools[id]).size,5,id);
    for(const message of pools[id]){assert.ok(message.includes('@{name}'));assert.ok(message.includes('{moment}'))}
  }
});

test('all first-party JavaScript parses without a build step',()=>{
  for(const file of fs.readdirSync(path.join(root,'js')).filter(name=>name.endsWith('.js'))){
    assert.doesNotThrow(()=>new vm.Script(read(`js/${file}`),{filename:file}),file);
  }
});

test('fighter creation offers all fifty portrait avatars',()=>{
  assert.equal((definitions.match(/id:'fighter-\d{2}'/g)||[]).length,50);
  for(let number=45;number<=50;number+=1){
    const suffix=String(number).padStart(2,'0');
    const asset=`assets/avatars/fighter-avatar-${suffix}.png`;
    assert.match(definitions,new RegExp(`id:'fighter-${suffix}'[^\\n]+asset:'${asset.replaceAll('/','\\/')}'`));
    const bytes=fs.readFileSync(path.join(root,asset));
    assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10],asset);
    assert.ok([4,6].includes(bytes[25]),`${asset} has an alpha channel`);
  }
});

test('seeded circuit migration supplies two read-only opponents per level from 2 through 15',()=>{
  const migration=read('supabase/migrations/20260903120000_seed_circuit_fighters.sql');
  const rows=[...migration.matchAll(/\('ca6e0000-0000-4000-8000-000000(\d{2})000[12]'::uuid/g)];
  assert.equal(rows.length,28);
  for(let level=2;level<=15;level+=1){
    assert.equal(rows.filter(match=>Number(match[1])===level).length,2,`level ${level}`);
  }
  assert.match(migration,/create table if not exists public\.cage_seed_fighters/);
  assert.match(migration,/base_power\+base_speed\+base_chin\+base_cardio=20/);
  assert.match(migration,/create or replace function public\.get_cage_opponent_candidates/);
  assert.match(migration,/from public\.cage_seed_fighters as seed/);
  assert.match(migration,/create or replace function public\.get_cage_seed_fighter_roster/);
  assert.match(read('js/supabase-client.js'),/get_cage_seed_fighter_roster/);
  assert.match(read('js/cage-social.js'),/loadSeedFighterRoster/);
  assert.match(game,/SHARED_FEED\.loadSeedFighterRoster\(\)/);
  assert.match(game,/profile\.seeded===true&&\['power','speed','chin','cardio'\]/);
  assert.match(migration,/where seed\.active and lower\(seed\.handle\)=lower\(v_candidate\)/);
  assert.doesNotMatch(migration,/insert into auth\.users/i);
});

test('removed canvas hero renderer has no stale runtime references',()=>{
  assert.doesNotMatch(game,/\bdrawHero\b/);
  assert.doesNotMatch(game,/\bdrawFighter\b/);
});

test('HTML ids are unique',()=>{
  const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(new Set(ids).size,ids.length);
});

test('literal game selectors point at existing or intentionally dynamic ids',()=>{
  const dynamic=new Set(['cornerPlanGrid','fightRankingsLoadMore']);
  const ids=new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(match=>match[1]));
  const selectors=[...game.matchAll(/\$\('#([A-Za-z][\w-]*)[^']*'\)/g)].map(match=>match[1]);
  for(const id of new Set(selectors))assert.ok(ids.has(id)||dynamic.has(id),id);
});

test('primary navigation places Open Gym directly after Fight',()=>{
  const nav=[...html.matchAll(/<button class="navbtn[^>]*data-nav="([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual(nav,['home','fight','gym','gear','feed']);
});

test('primary navigation renders the custom PNG icon set directly',()=>{
  for(const name of ['home','fight','gear','feed'])assert.match(html,new RegExp(`assets/icons/nav-${name}\\.png\\?v=`),name);
  assert.match(html,/assets\/icons\/nav-train\.png\?v=/);
  assert.doesNotMatch(html,/data-icon-name="nav-(?:home|fight|gear|feed)"/);
  assert.match(styles,/\.navbtn \.ni img/);
});

test('the five primary screens include the persistent Open Gym page',()=>{
  const screens=[...html.matchAll(/<section class="screen[^>]*data-screen="([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual(screens,['home','feed','fight','gym','gear']);
});

test('Open Gym runs reward-free scouting and persists the latest report',()=>{
  assert.match(html,/data-screen="gym"[\s\S]*?id="sparTargetChoices"[\s\S]*?id="sparReport"[\s\S]*?class="spar-action-dock"><button[^>]*id="startSparBtn"[\s\S]*?class="page-footer open-gym-footer"/);
  assert.match(html,/Test a matchup without spending Energy or affecting your record, rewards, ranking, or streaks/);
  assert.match(game,/sparringTarget:'level',lastSparringReport:null/);
  assert.match(game,/state\.lastSparringReport=report/);
  assert.match(game,/playerIsChampion[\s\S]*?'contender'/);
});

test('removed manual activity interfaces are absent',()=>{
  const removedIds=['trainScreen','hustleScreen','restModal','recoveryModal','blackjackModal','cageDiceModal','horseRaceModal','autographModal'];
  for(const id of removedIds)assert.doesNotMatch(html,new RegExp(`id="${id}"`),id);
  assert.doesNotMatch(styles,/training-injury|trainer-toggle|horse-race|blackjack|cage-dice|data-nav="train"/i);
  assert.doesNotMatch(steel,/training|trainer|sparring|horse-race|blackjack|cage-dice|hustle/i);
});

test('obsolete activity files and assets were removed',()=>{
  for(const file of ['js/underground-buzz.js','assets/cage-dice.jpg','assets/racehorse-right.png','assets/home-training.png','assets/home-hustle.png','assets/icons/nav-hustle.png','assets/icons/rest.png','assets/icons/rideshare-driver.jpg','assets/icons/surgecore-energy-drink.png']){
    assert.equal(fs.existsSync(path.join(root,file)),false,file);
  }
});

test('new careers use explicit save version 31',()=>{
  assert.match(game,/const STATE_VERSION\s*=\s*31/);
  assert.match(game,/version:STATE_VERSION/);
  assert.match(game,/attributePoints:0/);
  assert.match(game,/circuitLossStreak:0/);
  assert.match(game,/energyRecoveryAt:Date\.now\(\)/);
  assert.match(game,/healthRecoveryAt:Date\.now\(\)/);
  assert.match(game,/followersUpdatedAt:Date\.now\(\)/);
  assert.match(game,/followersAccrualAura:0/);
  assert.match(game,/rankingHistory:\[\]/);
  assert.match(game,/source\.version\)\)\|\|0\)<27\)s\.xp=LOGIC\.rescaleXpProgress/);
});

test('completed careers restore from private cloud saves before the landing screen renders',()=>{
  const migration=read('supabase/migrations/20260902160000_private_cloud_career_saves.sql');
  assert.match(migration,/create table if not exists public\.cage_career_saves/);
  assert.match(migration,/alter table public\.cage_career_saves enable row level security/);
  assert.match(migration,/revoke all on table public\.cage_career_saves from public, anon, authenticated/);
  assert.match(migration,/create or replace function public\.load_cage_career\(\)/);
  assert.match(migration,/create or replace function public\.save_cage_career\(p_state jsonb\)/);
  assert.match(game,/if\(LOGIC\.isBlankCareer\(state\)\)await restoreRemoteCareer\(\);\s*captureReferralInvite\(\);\s*function saveState/);
  assert.match(game,/const remote=await SHARED_FEED\.loadCareer/);
  assert.match(game,/const profile=await SHARED_FEED\.loadOwnProfile/);
  assert.match(game,/scheduleCloudCareerSave\(\)/);
  assert.ok(game.indexOf("const LOADOUT_CATEGORIES=")<game.indexOf('state = loadState();'),'save normalization dependencies must initialize before reading stored careers');
});

test('fighter-name shuffle is a compact action beside the proposed name',()=>{
  assert.match(html,/class="fighter-name-draft-row"[\s\S]*class="fighter-name-preview"[\s\S]*id="fighterNameSuggestion"[\s\S]*id="newFighterNameBtn"/);
  assert.match(html,/id="newFighterNameBtn"[^>]*aria-label="Shuffle fighter name"/);
  assert.doesNotMatch(html,/>SHUFFLE NAME</);
  assert.match(styles,/\.fighter-name-draft-row\{[^}]*grid-template-columns:minmax\(0,1fr\) 40px[^}]*align-items:stretch/);
  assert.match(styles,/\.fighter-name-shuffle\{[^}]*min-height:74px/);
});

test('World Rank uses fight quality, recent form, and permanent attributes without gear',()=>{
  assert.match(game,/attributeTotal:Object\.values\(state\.stats\)/);
  assert.match(game,/rankingHistory:state\.rankingHistory/);
  assert.match(game,/LOGIC\.rankingFightEntry\(\{won:win/);
  assert.doesNotMatch(game,/attributeTotal:[^;\n]*(effectiveStat|equippedGear)/);
  assert.match(read('README.md'),/30% résumé, 45% quality of defeated opposition, 20% recent form, and 5% permanent base attributes/);
  const migration=read('supabase/migrations/20260902120000_hybrid_world_rank.sql');
  assert.match(migration,/add column if not exists attribute_total integer not null default 20/);
  assert.match(migration,/add column if not exists ranking_history jsonb not null default '\[\]'::jsonb/);
  assert.match(migration,/create or replace function public\.sync_cage_ranking/);
  assert.match(migration,/create or replace function public\.cage_world_rank_score/);
  assert.match(read('js/cage-social.js'),/database\.syncCageRanking\(\{p_attribute_total:profile\.attributeTotal,p_ranking_history:profile\.rankingHistory\}\)/);
  assert.match(read('js/supabase-client.js'),/attribute_total,ranking_history/);
  const confidenceMigration=read('supabase/migrations/20260903160000_rebalance_world_rank_confidence.sql');
  assert.match(confidenceMigration,/\(wins\+2\)\/\(wins\+losses\+4\)/);
  assert.match(confidenceMigration,/proven_win_rate\*75/);
  assert.match(logic,/provenWinPercentage=fights\?\(wins\+2\)\/\(fights\+4\):0/);
});

test('migration does not erase followers when a legacy social flag is false',()=>{
  assert.doesNotMatch(game,/!s\.socialAccountCreated\)\{s\.fans=0/);
  assert.match(game,/!s\.socialAccountCreated\)s\.socialFollowingCount=0/);
});

test('money is absent from the player-facing shell and reward strip',()=>{
  assert.doesNotMatch(html,/\bCASH\b|CAREER EARNINGS|FIGHT PURSE|SIGNING BONUS|SPONSOR PAYMENT/i);
  assert.match(html,/id="rewardPrimary"/);
  assert.match(html,/id="rewardFans"/);
  assert.match(html,/id="rewardXp"/);
});

test('obsolete economy helpers are not exported from core logic',()=>{
  const exportBlock=logic.slice(logic.lastIndexOf('return {'));
  for(const name of ['receiveMoney','formatMoney','fightPurse','cashBonus','recoveryPrice','hustleReward'])assert.doesNotMatch(exportBlock,new RegExp(`\\b${name}\\b`),name);
});

test('persistent HUD swaps inline values for compact live recovery countdowns',()=>{
  assert.doesNotMatch(html,/recovery-status/);
  assert.match(game,/formatHudRecoveryCountdown/);
  assert.match(game,/`full in \$\{formatHudRecoveryCountdown/);
  assert.match(game,/Math\.floor\(totalSeconds\/60\)/);
  assert.match(game,/padStart\(2,'0'\)/);
  assert.match(styles,/#hudEnergyText\.recovering\{color:#4a9bf0\}#hudHealthText\.recovering\{color:#5cc978\}/);
  assert.match(game,/setInterval\(updatePassiveRecovery,1000\)/);
  assert.match(game,/visibilitychange/);
  assert.match(game,/pageshow/);
});

test('top bar stays compact and leaves XP progression on the Home card',()=>{
  const topbar=html.slice(html.indexOf('<header class="topbar">'),html.indexOf('</header>',html.indexOf('<header class="topbar">')));
  assert.doesNotMatch(topbar,/id="xpText"|>XP</);
  assert.match(styles,/\.topbar\{[\s\S]*?height:55px;padding:6px 9px/);
  assert.match(styles,/\.logo\{flex:0 0 74px;width:74px;height:40px/);
  assert.doesNotMatch(styles,/\.logo\{width:112px;height:50px/);
  assert.doesNotMatch(styles,/\.logo\{flex-basis:104px;width:104px;height:60px/);
  assert.match(styles,/\.career-progress-summary> b\.rank-status\{color:#7ddcff\}/);
  assert.match(topbar,/class="ti ti-flame"[^>]*aria-hidden="true"/);
  assert.match(styles,/\.top-progress \.ti-flame\{[^}]*background:#f39a3f/);
  assert.match(game,/progressText\.classList\.toggle\('rank-status',!state\.attributePoints&&!!headerRanking\?\.position\)/);
});

test('fight results increase persistent Health damage and enforce loss floors',()=>{
  assert.match(rules,/"totalDamageMultiplier": 1\.25/);
  assert.match(rules,/"victoryMinimum": 5/);
  assert.match(rules,/"decisionLossMinimum": 10/);
  assert.match(rules,/"submissionLossMinimum": 15/);
  assert.match(rules,/"knockoutOrTechnicalKnockoutLossMinimum": 20/);
  assert.match(game,/finalizePersistentFightDamage\(fight\)/);
});

test('below-full Health opens fights without invoking removed Training code',()=>{
  assert.match(game,/delete s\.fightInjury/);
  assert.doesNotMatch(game,/FIGHTING HURT|injuryEligible|currentFightInjury|liveFightInjury|fight_injury_suffered/);
  assert.doesNotMatch(html,/FIGHTING HURT|fight-injury-warning|attribute-injury-icon/);
  assert.doesNotMatch(styles,/fight-injury|attribute-injury|injury-locked/);
  assert.doesNotMatch(game,/currentTrainingInjury/);
  assert.match(game,/state\.health>=MINIMUM_FIGHT_HEALTH/);
});

test('passive recovery updates the HUD without rebuilding clickable opponent rows',()=>{
  const recoveryBody=game.match(/function updatePassiveRecovery\([^)]*\)\{([\s\S]*?)\n  \}/)?.[1]||'';
  assert.match(recoveryBody,/renderResourceHud\(\)/);
  assert.doesNotMatch(recoveryBody,/updateUI\(\)/);
  assert.match(game,/state\.health<state\.maxHealth/);
  assert.match(game,/state\.health>=MINIMUM_FIGHT_HEALTH/);
});

test('Aura passively grows followers and refreshes sponsor eligibility',()=>{
  assert.match(logic,/function followersPerHour\(aura=0\)/);
  assert.match(logic,/function passiveFollowerGrowth\(state,now=Date\.now\(\),offlineCap=FOLLOWER_OFFLINE_CAP,aura=state\?\.aura\)/);
  assert.match(game,/LOGIC\.passiveFollowerGrowth\(state,now,FOLLOWER_OFFLINE_CAP,effectiveAura\(\)\)/);
  assert.match(game,/syncSponsorProgress\(\)/);
  assert.match(game,/WHILE YOU WERE AWAY · \+\$\{fmt\(followerGrowth\.followers\)\} FOLLOWERS/);
  assert.match(game,/document\.addEventListener\('visibilitychange',[\s\S]*updatePassiveRecovery\(true\)/);
  assert.match(game,/window\.addEventListener\('pageshow',[\s\S]*updatePassiveRecovery\(true\)/);
});

test('positive Aura gains slow across status tiers while penalties stay full strength',()=>{
  assert.match(logic,/function auraGrowthMultiplier\(value=0\)/);
  assert.match(logic,/function scaledAuraGain\(value,currentAura=0\)/);
  assert.match(logic,/return gain>0\?Math\.max\(1,Math\.round\(gain\*auraGrowthMultiplier\(currentAura\)\)\):Math\.round\(gain\)/);
  assert.match(game,/LOGIC\.socialInteractionReward\([^\n]+,state\.aura\)/);
  assert.match(game,/LOGIC\.scaledAuraGain\([^\n]+state\.aura\)/);
});

test('fight follower rewards use Aura and the reduced payout helper',()=>{
  assert.match(logic,/function fightFollowerReward\(\{opponentBaseFollowers=0,aura=0/);
  assert.match(game,/LOGIC\.fightFollowerReward\(\{opponentBaseFollowers:o\.fans,aura:effectiveAura\(\)/);
  assert.match(game,/if\(!fight\.forfeited\)fans=changeFollowers\(LOGIC\.fightFollowerReward\(\{opponentBaseFollowers:o\.fans,won:false\}\)\)/);
});

test('Energy recovery popup reports accumulated Energy once',()=>{
  assert.match(game,/if\(recovered\.energy>0\)flashRecoveryResources\(\{energy:recovered\.energy,health:0\}\)/);
  assert.match(html,/id="hudEnergyDelta"/);
});

test('Energy uses eight discrete pips while Health remains a smooth vitality bar',()=>{
  const batteryMarkup=html.match(/id="energyBattery"[\s\S]*?<\/div>/)?.[0]||'';
  assert.equal((batteryMarkup.match(/<i><\/i>/g)||[]).length,8);
  assert.match(game,/chargedEnergyPips=Math\.ceil/);
  assert.match(game,/classList\.toggle\('charged',index<chargedEnergyPips\)/);
  assert.doesNotMatch(game,/--charge/);
  assert.match(styles,/\.energy-battery i\.charged\{background:#4a9bf0/);
  assert.match(styles,/\.health-hud \.hud-meter i[\s\S]*?#3fae5c,#5cc978/);
});

test('Attribute Point assignment has one source of truth above Fight rankings',()=>{
  assert.equal((html.match(/data-attribute-assignment/g)||[]).length,1);
  for(const stat of ['power','speed','chin','cardio'])assert.equal((html.match(new RegExp(`data-assign-attribute="${stat}"`,'g'))||[]).length,1,stat);
  assert.match(html,/data-screen="fight"[\s\S]*?fight-attribute-assignment[\s\S]*?opponent-roster fight-ladder/);
  assert.match(html,/data-attribute-effective/);
  assert.match(html,/data-attribute-breakdown/);
  assert.match(html,/data-attribute-toggle[^>]*aria-expanded="false"/);
  assert.match(html,/data-attribute-body hidden/);
  assert.match(html,/class="attribute-point-badge" data-attribute-points/);
  assert.match(html,/data-attribute-subtitle/);
  assert.match(styles,/\.attribute-assignment-stat button\{appearance:none/);
  assert.match(styles,/\.attribute-point-badge\{[^}]*background:#22c55e;[^}]*color:#052e13/);
  assert.match(styles,/\.attribute-assignment-stat button\{[^}]*border-radius:50%;background:#22c55e;color:#052e13/);
  assert.match(styles,/\.attribute-assignment-stat:nth-child\(1\) b\{color:#e2685f\}/);
  assert.match(styles,/\.attribute-assignment-stat:nth-child\(2\) b\{color:#e0b84a\}/);
  assert.match(styles,/\.attribute-assignment-stat:nth-child\(3\) b\{color:#a888e8\}/);
  assert.match(styles,/\.attribute-assignment-stat:nth-child\(4\) b\{color:#5cc978\}/);
  assert.match(game,/attributeAssignmentExpanded = false/);
  assert.match(game,/toggleAttributeAssignment/);
  assert.match(game,/subtitle\.textContent=attributeAssignmentExpanded\?'Choose one permanent upgrade'/);
  assert.match(game,/effective=effectiveStat\(key\)/);
  assert.match(game,/bonus\?`\$\{base\} BASE · \+\$\{bonus\} GEAR`/);
  assert.doesNotMatch(html,/result-attribute-assignment|ASSIGN YOUR POINT/);
  assert.doesNotMatch(game,/save it for Home/);
  assert.match(game,/assignAttributePoint/);
  assert.match(game,/awardVictoryAttributePoint/);
  assert.match(game,/saveState\(\)/);
});

test('post-fight tutorial appears only until the first result is closed',()=>{
  assert.match(html,/id="postFightTutorial"[^>]*hidden/);
  assert.match(html,/FIRST FIGHT GUIDE/);
  assert.match(game,/renderPostFightTutorial\(win\)/);
  assert.match(game,/tutorial\.hidden=state\.postFightTutorialSeen/);
  assert.match(game,/state\.postFightTutorialSeen=true;saveState\(\)/);
  assert.match(logic,/state\.postFightTutorialSeen=raw\.postFightTutorialSeen===true\|\|state\.wins\+state\.losses>0/);
});

test('occasional post-fight texts use the established contact portraits',()=>{
  assert.match(html,/id="postFightMessageModal"[\s\S]*id="postFightMessageAvatar"[\s\S]*id="postFightMessageList"[\s\S]*id="postFightMessageComposer"/);
  for(const asset of ['contact-wife.jpg','contact-mom.jpg','contact-grandma.jpg','contact-brother-tommy.png','contact-agent-carl.png'])assert.match(strings,new RegExp(`assets/${asset.replace('.','\\.')}`));
  assert.match(strings,/postFightTexts:[\s\S]*chance: \.32[\s\S]*relationship:'WIFE'[\s\S]*relationship:'AGENT'/);
  assert.match(game,/const notable=titleWon\|\|titleFight\|\|\(won&&winStreak>0&&winStreak%5===0\)/);
  assert.match(game,/pendingPostFightText=selectPostFightText\(\{won:win,forfeited:!!fight\.forfeited,lowerLevelWin,titleWon,titleFight:!!o\.globalChampionship/);
  assert.match(game,/if\(forfeited\|\|lowerLevelWin\|\|!contacts\.length\)return null/);
  assert.match(game,/function showPostFightFollowup\(\)\{if\(showPendingPostFightText\(\)\)return true/);
  assert.match(html,/id="postFightMessageInput"[^>]*placeholder="Replies unavailable"[^>]*disabled/);
  assert.doesNotMatch(html,/id="postFightMessageSend"/);
  assert.doesNotMatch(game,/sendPostFightTextReply|post_fight_text_replied/);
  assert.match(styles,/\.post-fight-message-thread\{[^}]*width:min\(100%,420px\)[^}]*border-radius:18px/);
  assert.match(game,/class="post-fight-message-row in post-fight-message-typing-row"/);
  assert.match(game,/messages\.slice\(1\)\.map\(messageRow\)\.join\(''\)/);
  assert.match(game,/\},1500\)/);
  assert.match(game,/if\(postFightMessageTimer\)\{clearTimeout\(postFightMessageTimer\);postFightMessageTimer=null\}/);
  assert.match(styles,/\.post-fight-message-typing i\{[^}]*animation:postFightTyping 1s ease-in-out infinite/);
  assert.match(styles,/@keyframes postFightTyping/);
  const copyContext={};vm.runInNewContext(strings,copyContext);const contacts=copyContext.CAGE_STRINGS.postFightTexts.contacts;
  assert.equal(contacts.length,5);
  contacts.forEach(contact=>{assert.equal(contact.win.length,10,`${contact.name} needs ten win texts`);assert.equal(contact.loss.length,10,`${contact.name} needs ten loss texts`);assert.ok(contact.titleWin.length>=3,`${contact.name} needs varied title texts`)});
});

test('legacy Diego presentation assets remain available while contract eligibility is controlled by core logic',()=>{
  assert.match(game,/key:'first-contract-diego-ramos-br',name:'DiegoRamosBR'/);
  assert.match(game,/assets\/opponents\/diego-ramos-br\.png/);
  assert.match(game,/firstContractUnlocked=LOGIC\.firstContractUnlockEligible\(\{won:win,rookieShowcase:o\.rookieShowcase===true\}\)/);
  assert.match(game,/state\.firstContractPending=true;ensureFirstContractOpponent\(\)/);
  assert.match(game,/if\(offerFirstContractOpponent\(\)\)return true/);
  assert.match(game,/if\(o\.firstContract\)state\.firstContractPending=false/);
  assert.match(serviceWorker,/assets\/opponents\/diego-ramos-br\.png/);
  assert.equal(fs.existsSync(path.join(root,'assets/opponents/diego-ramos-br.png')),true);
});

test('victory reward prioritizes Attribute Point, followers, and XP',()=>{
  assert.match(game,/attributePoint===1\?'ATTRIBUTE POINT':'ATTRIBUTE POINTS'/);
  assert.match(game,/attribute_points_earned:attributePoint/);
  assert.doesNotMatch(game,/AVAILABLE ON FIGHT PAGE/);
  assert.doesNotMatch(game,/ASSIGN NOW OR SAVE/);
  assert.match(game,/rewardFansLabel.*FOLLOWERS/);
  assert.match(game,/lowerLevelFollowerPenalty/);
  assert.match(game,/FAN BACKLASH/);
  assert.match(game,/FOLLOWERS LOST/);
  assert.match(game,/rewardXpLabel/);
  assert.doesNotMatch(game,/rewardCash|rewardEarnings/);
});

test('fight result uses focused outcome and rewards stages',()=>{
  assert.match(html,/id="resultOutcomeStage"[\s\S]*id="resultContinueBtn"[\s\S]*id="resultRewardsStage"/);
  assert.match(html,/id="resultRewardsStage"[^>]*hidden/);
  assert.match(html,/class="result-secondary-actions"[\s\S]*id="shareWinBtn"[\s\S]*id="detailsToggle"/);
  assert.match(game,/function showResultStage\(stage='outcome'\)/);
  assert.match(game,/showResultStage\('outcome'\)/);
  assert.match(game,/resultContinueBtn.*showResultStage\('rewards'\)/);
  assert.match(styles,/\.result-stage\[hidden\]\{display:none\}/);
});

test('zero and negative result metrics use the red non-positive treatment',()=>{
  assert.match(game,/function styleResultMetric\(selector,value\)/);
  assert.match(game,/nonPositive=Number\(value\)<=0/);
  assert.match(game,/styleResultMetric\('#rewardPrimary'/);
  assert.match(game,/styleResultMetric\('#rewardFans'/);
  assert.match(game,/styleResultMetric\('#rewardXp'/);
  assert.match(styles,/\.rewardbox\.non-positive b\{color:#ff6d77\}/);
  assert.match(styles,/\.result-bonus-row\.non-positive\{color:#ff737b\}/);
});

test('reward metrics count in sequence with positive and non-positive feedback',()=>{
  assert.match(game,/function prepareRewardMetric\(selector,value,plus=false\)/);
  assert.match(game,/function animateRewardMetrics\(\)/);
  assert.match(game,/index\*230/);
  assert.match(game,/sfx\[positive\?'rewardGood':'rewardBad'\]/);
  assert.match(game,/rewardGood\(step=0\)/);
  assert.match(game,/rewardBad\(negative=false\)/);
  assert.match(game,/rewardParticles\(box,positive,index\)/);
  assert.match(game,/function setRewardClaimReady\(ready\)/);
  assert.match(game,/\$\$\('#resultModal button'\)\.forEach\(action=>\{action\.disabled=!ready\}\)/);
  assert.match(game,/if\(rewards\)\{setRewardClaimReady\(false\);requestAnimationFrame\(animateRewardMetrics\)\}/);
  assert.match(game,/setRewardClaimReady\(false\)/);
  assert.match(game,/remaining===0\)setRewardClaimReady\(true\)/);
  assert.match(styles,/@keyframes rewardParticleRise/);
  assert.match(styles,/@keyframes rewardParticleFall/);
  assert.match(styles,/#continueBtn\.rewards-counting\{[^}]*cursor:wait/);
  assert.match(styles,/@media \(prefers-reduced-motion:reduce\)\{\.rewardbox\.reward-animating/);
});

test('post-fight scorecard renders both fighter portraits with silhouette fallback',()=>{
  assert.match(game,/class="rt-portrait rt-player"><img/);
  assert.match(game,/class="rt-portrait rt-opponent"><img/);
  assert.match(game,/opponentPortrait=silhouetteForOpponent\(f\.o\)/);
  assert.match(styles,/\.result-tape \.rt-portrait\{/);
  assert.match(styles,/\.result-tape \.rt-portrait img\{/);
  assert.doesNotMatch(game,/class="rt-name (?:player|opponent)"/);
  assert.match(styles,/\.result-secondary-actions \.details-toggle\{[^}]*border-radius:999px!important/);
});

test('post-fight details keep identity sticky and prioritize visible Fight Totals',()=>{
  const details=html.slice(html.indexOf('id="resultDetails"'),html.indexOf('id="sponsorAnnouncementModal"'));
  const scorecardIndex=details.indexOf('id="resultScorecardSection"'),totalsIndex=details.indexOf('id="fightTotals"'),tapeIndex=details.indexOf('id="resultTapeSection"');
  assert.ok(scorecardIndex>=0&&totalsIndex>scorecardIndex&&tapeIndex>totalsIndex);
  assert.match(details,/class="result-fighter-sticky"[\s\S]*id="resultStickyPlayer"[\s\S]*id="resultStickyOpponent"/);
  assert.match(details,/id="resultScorecardToggle"[^>]*aria-expanded="false"[^>]*aria-controls="resultScorecardBody"[\s\S]*id="resultScorecardBody" hidden/);
  assert.match(details,/id="resultTapeToggle"[^>]*aria-expanded="false"[^>]*aria-controls="resultTapeBody"[\s\S]*id="resultTapeSummary"[\s\S]*id="resultTapeBody" hidden/);
  assert.match(game,/setResultSectionExpanded\('resultScorecardSection',false\);setResultSectionExpanded\('resultTapeSection',false\)/);
  assert.match(game,/tapeSummary\.textContent=`\$\{planLabel\} — \$\{planAssessment\.grade\}`/);
  assert.match(game,/class="totals-fighter totals-tag-user">\$\{escapeHtml\(playerTag\)\}[\s\S]*class="totals-fighter totals-tag-opponent">\$\{escapeHtml\(opponentTag\)\}/);
  assert.match(styles,/\.result-fighter-sticky\{[^}]*position:sticky[^}]*top:0/);
  assert.match(styles,/\.result-section-body\[hidden\]\{display:none\}/);
  assert.match(styles,/\.totals-grid \.totals-fighter\.totals-tag-user\{color:#ffe084\}[\s\S]*\.totals-grid \.totals-fighter\.totals-tag-opponent\{color:#ff8178\}/);
});

test('Share Win is victory-only and retains Web Share and fallback paths',()=>{
  assert.match(html,/id="shareWinBtn"[^>]*hidden>SHARE WIN/);
  assert.match(game,/shareWinBtn'\)\.hidden=!win/);
  assert.match(game,/navigator\.share/);
  assert.match(game,/navigator\.clipboard\.writeText/);
  assert.match(html,/id="shareFallbackText"/);
  assert.match(game,/fight_win_shared/);
  assert.match(game,/shareWinPending/);
});

test('fight result returns to Fight and preserves reward/drop followups',()=>{
  assert.match(game,/navTo\('fight','replace'\)/);
  assert.match(game,/openDropClaim\(victoryDrop/);
  assert.match(game,/showPostFightFollowup/);
});

test('follower-based sponsor ladder uses the agreed thresholds',()=>{
  const thresholds=[...definitions.matchAll(/followersRequired:(\d+)/g)].map(match=>Number(match[1]));
  assert.deepEqual(thresholds,[0,500,2500,10000,30000,80000,200000]);
  assert.match(definitions,/brand:'Surge Core'/);
  assert.doesNotMatch(definitions,/perFight|signingBonus|fightsRequired|cashRequired/);
});

test('Career Identity shows the next sponsor goal instead of duplicating the current sponsor',()=>{
  assert.match(html,/id="careerSponsorLabel">Next Sponsor/);
  assert.match(html,/id="careerSponsorProgressTrack"[^>]*role="progressbar"/);
  assert.match(html,/id="careerSponsorProgressMeta"/);
  assert.match(game,/NEXT SPONSOR/);
  assert.match(game,/FOLLOWERS NEEDED/);
  assert.match(game,/TOP-TIER SPONSOR/);
  assert.match(game,/CURRENT SPONSOR/);
  assert.match(styles,/\.career-sponsor-progress-track/);
});

test('Home presents Career Progression in XP, Aura, Sponsor, Victory Pack, and Daily Heat order',()=>{
  const xpIndex=html.indexOf('id="careerXpLevel"');
  const auraIndex=html.indexOf('id="careerAuraTrack"');
  const sponsorIndex=html.indexOf('id="careerSponsorLabel"');
  const packIndex=html.indexOf('id="victoryPackMeter"');
  const heatIndex=html.indexOf('id="dailyFightBonusMeter"');
  const heroIndex=html.indexOf('<div class="hero career-after-setup">');
  assert.ok(heroIndex>=0&&xpIndex>=0&&auraIndex>xpIndex&&sponsorIndex>auraIndex&&packIndex>sponsorIndex&&heatIndex>packIndex);
  assert.match(html,/class="page-subhead home-profile-section-heading career-progression-heading"><b>CAREER PROGRESSION<\/b>/);
  assert.match(html,/id="careerAuraTrack"[^>]*role="progressbar"/);
  assert.match(html,/id="careerAuraProgress"/);
  assert.match(html,/id="careerXpTrack"[^>]*role="progressbar"/);
  assert.match(html,/id="victoryPackTrack"[^>]*role="progressbar"/);
  assert.match(html,/id="dailyFightBonusTrack"[^>]*role="progressbar"/);
  assert.match(html,/id="dailyFightBonusProgressText"/);
  assert.match(game,/\$\('#careerXpFill'\)\.style\.width/);
  assert.match(game,/\$\('#careerAuraFill'\)\.style\.width/);
  assert.match(game,/nextAuraSkin\?`\$\{auraTitle\.label\} → \$\{nextAuraSkin\.label\}`/);
  assert.match(game,/\$\('#victoryPackFill'\)\.style\.width/);
  assert.match(game,/\$\('#dailyFightBonusFill'\)\.style\.width/);
  assert.match(styles,/\.career-token\.career-progression-goal\{grid-column:1\/-1!important/);
  assert.doesNotMatch(styles,/\.victory-pack-meter\{position:absolute/);
});

test('Home uses one fixed Fighter Profile card with section headers, internal scroll, and coach footer',()=>{
  assert.match(html,/class="card build-card home-career-card page-card" id="careerGameContent"/);
  assert.match(html,/class="card-title career-after-setup">Fighter Profile/);
  assert.match(html,/id="careerIdentityCard">\s*<div class="page-subhead home-profile-section-heading"><b>CAREER IDENTITY<\/b><span>CAREER DETAILS<\/span><\/div>/);
  assert.match(html,/class="career-strip career-identity-grid"[\s\S]*id="careerFollowersText"[\s\S]*id="careerWorldRank"/);
  assert.match(game,/\$\('#careerWorldRank'\)\.textContent=careerRanking\.position\?`#\$\{careerRanking\.position\}`:'UNRANKED'/);
  assert.match(styles,/#careerIdentityCard \.career-identity-grid \.career-token:last-child\{grid-column:auto\}/);
  assert.match(html,/id="homeFightSkin"><div class="page-subhead home-profile-section-heading"><b>FIGHT SKIN<\/b><span>AURA · AUTOMATIC<\/span><\/div>/);
  assert.match(styles,/\.page-subhead,\.home-profile-section-heading\{[^}]*display:flex[^}]*white-space:nowrap/);
  assert.match(styles,/#app:not\(\.career-setup\) \.screen\[data-screen="home"\] #careerGameContent\{display:flex!important;gap:0\}/);
  assert.match(styles,/\.home-career-scroll\{display:flex;flex-direction:column\}/);
  assert.match(styles,/\.page-scroll\{min-height:0;flex:1 1 auto;overflow-y:auto/);
  assert.match(styles,/\.home-career-scroll>\.career-after-setup\{flex:0 0 auto\}/);
  assert.match(styles,/\.home-career-scroll>\.hero\{order:1;width:100%;margin:0;border-width:0 0 1px;border-radius:0/);
  assert.match(styles,/#homeFightSkin\{order:2\}/);
  assert.match(styles,/#careerIdentityCard\{order:3\}/);
  assert.match(styles,/\.home-fight-skin-accessories\{display:flex;justify-content:center;gap:1px;margin:1px auto -3px\}/);
  assert.match(html,/class="career-after-setup home-coach-footer page-footer"><div class="ticker"><i class="pulse-dot"><\/i><span id="tickerText">/);
  assert.doesNotMatch(html,/COACH'S NOTES/);
  assert.match(styles,/\.page-footer,\.home-coach-footer,\.gear-card-footer,\.fight-ladder-footer,\.feed-action-dock\{height:64px;flex:0 0 64px;[^}]*border-top:1px solid/);
  assert.match(styles,/\.home-coach-footer \.ticker span\{display:-webkit-box;overflow:hidden;line-height:1\.3;-webkit-box-orient:vertical;-webkit-line-clamp:3\}/);
  assert.match(styles,/\.home-career-scroll>\.career-identity-details,\.home-career-scroll>\.home-fight-skin,[^}]*width:100%;margin:0;border:0;border-top:1px solid/);
  assert.match(styles,/#app\.career-setup #careerGameContent,#app\.career-setup \.home-career-scroll\{display:contents\}/);
  const homeCard=html.slice(html.indexOf('id="careerGameContent"'),html.indexOf('<section class="screen" data-screen="feed">'));
  assert.ok(homeCard.indexOf('class="career-after-setup retirement-card"')<homeCard.indexOf('class="career-after-setup home-coach-footer page-footer"'));
  assert.doesNotMatch(html,/FIGHT\. IMPROVE\. CLIMB\.|career-guide|choice-action/);
  assert.doesNotMatch(styles,/career-guide|choice-action|choice-grid/);
  assert.doesNotMatch(game,/\[data-go\]/);
});

test('Feed summarizes followers and all known followed accounts',()=>{
  assert.match(html,/class="feed-network-summary"[^>]*aria-label="Cage Feed audience"/);
  assert.match(html,/class="feed-header-filters"[^>]*aria-label="Filter Cage Feed posts"/);
  assert.match(html,/data-feed-filter="all"[^>]*aria-pressed="true">SHOW ALL<\/button>/);
  assert.match(html,/data-feed-filter="mentions"[^>]*aria-pressed="false">MENTIONS/);
  assert.doesNotMatch(html,/id="feedCycleStatus"|class="feed-filter-bar"/);
  assert.match(html,/id="feedFollowersCount"/);
  assert.match(html,/id="feedFollowingCount"/);
  assert.match(game,/function feedFollowingTotal\(\)/);
  assert.match(game,/STRINGS\.social\.profiles/);
  assert.match(game,/STRINGS\.social\.usernames/);
  assert.match(game,/endorsementDefs\.map\(sponsor=>sponsorFeedProfile/);
  assert.match(game,/rankingProfiles\(\)/);
  assert.match(game,/profile\.id!==ownId/);
  assert.match(game,/\$\('#feedFollowersCount'\)\.textContent=fmt\(state\.fans\)/);
  assert.match(game,/\$\('#feedFollowingCount'\)\.textContent=fmt\(feedFollowingTotal\(\)\)/);
  assert.match(game,/function mergedSocialPosts\(localPosts,remotePosts\)/);
  assert.match(game,/createdAt:new Date\(\)\.toISOString\(\)/);
  assert.match(game,/function socialPostTime\(post\)/);
  assert.match(game,/\.sort\(\(a,b\)=>socialPostTime\(b\)-socialPostTime\(a\)\)/);
  assert.match(game,/posts=sharedReady\?mergedSocialPosts\(localPosts,sharedSocialPosts\):localPosts/);
  assert.match(game,/addSocialPosts\(reporterPosts\);saveState\(\);renderSocial\(\);queueSharedPosts/);
  assert.match(styles,/\.feed-network-summary\{display:grid;grid-template-columns:1fr 1fr/);
  assert.match(styles,/\.feed-network-summary>div\{min-width:0;display:flex;align-items:center;gap:6px/);
  assert.match(styles,/\.feed-network-summary>div:last-child\{justify-content:flex-end;text-align:right\}/);
  assert.match(styles,/\.feed-network-summary small\{display:inline;[^}]*white-space:nowrap\}/);
  assert.match(styles,/\.feed-network-summary b\{display:inline;margin:0;[^}]*white-space:nowrap\}/);
  assert.doesNotMatch(styles,/\.feed-network-summary[^}]*border|\.feed-network-summary>div\+div/);
  assert.match(styles,/\.feed-header-filters button\.active\{color:#70d9ff/);
  assert.doesNotMatch(html,/feed-page-note|Mentions isolates posts addressed to you/);
  assert.doesNotMatch(styles,/\.feed-page-note/);
  assert.doesNotMatch(styles,/\.feed-filter-bar/);
});

test('fighter post preview uses a compact redraft action and Cancel returns to selection',()=>{
  assert.match(html,/fighter-post-draft-row[\s\S]*id="fighterPostRedraft"[^>]*aria-label="Generate a new draft"[\s\S]*id="fighterPostSend"[^>]*>SEND</);
  assert.doesNotMatch(html,/CHANGE FIGHTER|POST TO THE FEED/);
  assert.match(game,/function cancelFighterPostComposer\(\)\{[\s\S]*if\(!fighterPostTarget\)\{closeFighterPostComposer\(\);return\}[\s\S]*fighterPostSearchStep/);
  assert.match(game,/fighterPostClose'\)\.addEventListener\('click',cancelFighterPostComposer\)/);
  assert.match(styles,/\.fighter-post-draft-row\{[^}]*grid-template-columns:minmax\(0,1fr\) 40px/);
});

test('fight feed runs at the default speed without a speed control',()=>{
  assert.doesNotMatch(html,/id="speedBtn"|id="fightControls"|sim-control/);
  assert.doesNotMatch(game,/fightSpeed|toggleFightSpeed|speedBtn|fightControls/);
  assert.doesNotMatch(styles,/sim-control/);
  assert.doesNotMatch(steel,/sim-control/);
  assert.doesNotMatch(read('js/fight-plan.js'),/fightControls/);
  assert.match(game,/function scheduleFight\(fn,delay\)\{const id=setTimeout\(fn,Math\.max\(40,delay\)\)/);
});

test('live fight log separates structure, consequences, routine flavor, and repeated lines',()=>{
  assert.match(game,/text:`ROUND \$\{item\.round\} BEGINS`,className:'round-divider'/);
  assert.match(game,/text:`ROUND \$\{item\.round\} ENDS`,className:'round-divider'/);
  assert.doesNotMatch(game,/className:'round-end'/);
  assert.match(styles,/\.action-line\.round-divider\{[^}]*border:0;[^}]*background:transparent;[^}]*text-align:center/);
  assert.match(game,/consequential=!divider&&!summary&&\/\(\^\|\\s\)\(opp\|big\|ko\|rocked\|plan-edge\|plan-even\|plan-exposed\)/);
  assert.match(styles,/\.action-line\.consequential\{[^}]*border-width:1px;[^}]*font-size:12px;font-weight:750/);
  assert.match(game,/class="event-icon" aria-hidden="true">&#9888;&#65038;/);
  assert.match(styles,/\.action-line:not\(\.consequential\):not\(\.round-divider\):not\(\.unofficial-score\)\{color:#aeb8c3/);
  assert.match(game,/previous\.dataset\.fightText===String\(item\.text\|\|''\)[\s\S]*previous\.dataset\.fightSide===String\(item\.side\|\|''\)/);
  assert.match(game,/tally\.textContent=`×\$\{count\}`/);
  assert.match(styles,/\.action-repeat\{[^}]*border-radius:999px/);
  assert.match(styles,/\.condition\{height:10px/);
  assert.match(styles,/\.action-line\.unofficial-score\{[^}]*border:1px solid #876b2c;[^}]*border-left:3px solid #e6bc56/);
});

test('rocked fighters and every stoppage receive dedicated live-fight toasts',()=>{
  assert.match(game,/type:'rocked'/);
  assert.match(game,/fighterName:D\.name/);
  assert.match(game,/\$\{String\(item\.fighterName\|\|'FIGHTER'\)\.toUpperCase\(\)\} IS ROCKED!/);
  assert.match(game,/\['ko','submission'\]\.includes\(item\.type\)/);
  assert.match(game,/\$\{fightMethodLabel\(fight\)\.toUpperCase\(\)\} · \$\{winner\.name\.toUpperCase\(\)\} FORCES \$\{loser\.name\.toUpperCase\(\)\} TO TAP/);
  assert.match(styles,/#toast\.fight-rocked-toast\{[^}]*border-color:#ff4c49/);
  assert.match(styles,/#toast\.fight-finish-win\{[^}]*border-color:#36df7c/);
  assert.match(styles,/#toast\.fight-finish-loss\{[^}]*border-color:#ff4c49/);
});

test('submission finishes name the technique throughout the fight and result flow',()=>{
  for(const move of ['Rear-Naked Choke','Guillotine Choke','Armbar','Triangle Choke','Kimura'])assert.ok(game.includes(`name:'${move}'`),move);
  assert.match(game,/function selectSubmissionFinish\(random=Math\.random\)/);
  assert.match(game,/sim\.method='SUBMISSION';sim\.submissionMove=submissionMove/);
  assert.match(game,/TAP! \$\{A\.name\} \$\{submissionMove\.call\}!/);
  assert.match(game,/function fightMethodLabel\(result\).*SUBMISSION \(\$\{result\.submissionMove\.name\}\)/);
  assert.match(game,/\$\('#resultMethod'\)\.textContent=`\$\{fightMethodLabel\(f\)\} · ROUND/);
  assert.match(game,/method:fightMethodLabel\(fight\)/);
  assert.match(game,/lastFightShareData\.method=fightMethodLabel\(fight\)/);
});

test('fight plan starts the bout directly and matchup portraits share one branded surface',()=>{
  const fightPlan=read('js/fight-plan.js');
  assert.doesNotMatch(html,/focusStage|liveFocusText|fight-focus/);
  assert.doesNotMatch(game,/fightFocusFeature|resolveFocusChoice|continueAfterFocus/);
  assert.match(fightPlan,/beginFight\(\)/);
  assert.match(game,/showFightStage\(stage\)\{\['tapeStage','planStage','liveStage'\]/);
  assert.match(html,/class="matchup-poster-backdrop" aria-hidden="true"/);
  assert.match(game,/poster\.style\.setProperty\('--player-accent',playerAccent\)/);
  assert.match(game,/poster\.style\.setProperty\('--opponent-accent',opponentAccent\)/);
  assert.match(styles,/\.matchup-poster-backdrop\{[^}]*linear-gradient\(90deg[^}]*--player-accent[^}]*--opponent-accent/);
  assert.match(styles,/\.matchup-poster-backdrop:before\{[^}]*cage-grind-octagon-transparent\.png[^}]*opacity:\.28[^}]*brightness\(\.48\)/);
  assert.match(styles,/\.matchup-promo-card \.tape-versus-cards\{[^}]*background:transparent/);
  assert.match(styles,/\.matchup-promo-card \.tape-card-portrait\{[^}]*background:transparent/);
  assert.match(styles,/\.matchup-promo-card \.tape-card-portrait img\{[^}]*-webkit-mask-image:linear-gradient\(90deg,transparent 0,#000 11%,#000 89%,transparent 100%\),linear-gradient\(180deg,transparent 0,#000 9%,#000 74%,transparent 100%\)[^}]*mask-composite:intersect/);
  assert.match(game,/classList\.toggle\('unknown-silhouette',unknownOpponent\)/);
  assert.match(styles,/\.tape-opp-sprite\.unknown-silhouette\{transform:scale\(1\.24\)/);
});

test('fight plan selections and matchup reasoning remain easy to scan',()=>{
  const fightPlan=read('js/fight-plan.js');
  assert.equal((html.match(/class="fight-plan-setting-icon"/g)||[]).length,3);
  assert.match(html,/fight-plan-setting-icon[^>]*>◴<\/span>PACE/);
  assert.match(html,/fight-plan-setting-icon[^>]*>&#9994;&#65038;<\/span>OFFENSE/);
  assert.match(html,/fight-plan-setting-icon[^>]*>✥<\/span>TACTICS/);
  assert.match(styles,/\.fight-plan-toggle button\{position:relative;[^}]*background:#1a2438;color:#c3cbd8/);
  assert.match(styles,/\.fight-plan-toggle button\[aria-pressed="true"\]:after\{content:"✓";[^}]*border-radius:50%;background:#fff;color:#1674b8/);
  assert.match(fightPlan,/OPPONENT STYLE · \$\{escapeHtml\(opponentStyle\)\}/);
  assert.equal((fightPlan.match(/class="fight-plan-reason"/g)||[]).length,2);
  assert.match(fightPlan,/outputReason/);
  assert.match(fightPlan,/tacticReason/);
});

test('sponsor announcement and next-milestone progress are wired',()=>{
  assert.match(html,/id="sponsorAnnouncementModal"/);
  assert.match(html,/id="careerSponsorProgress"/);
  assert.match(game,/sponsorAnnouncementPending/);
  assert.match(game,/TOP-TIER SPONSOR/);
  assert.match(styles,/\.sponsor-announcement-dialog \.modal-actions\.single-action\{grid-template-columns:minmax\(0,1fr\)\}/);
  assert.match(styles,/\.sponsor-announcement-dialog \.modal-run\{width:100%\}/);
});

test('Property loadout stacks bounded Energy recovery bonuses',()=>{
  assert.match(definitions,/Property & Rides'\)\{item\.energyRecoverySpeed=effect\.energyRecoverySpeed/);
  assert.match(game,/Math\.max\(4000,ENERGY_RECOVERY_INTERVAL-activePerkBonus\('energyRecoverySpeed'\)\)/);
  assert.doesNotMatch(definitions,/healthRegen/);
});

test('Lifestyle loadout stacks bounded Health recovery bonuses without follower perks',()=>{
  assert.match(definitions,/item\.category==='Lifestyle'\)\{item\.healthRecoverySpeed=effect\.healthRecoverySpeed/);
  assert.match(game,/Math\.max\(30000,HEALTH_RECOVERY_INTERVAL-activePerkBonus\('healthRecoverySpeed'\)\)/);
  assert.match(game,/health:healthRecoveryInterval\(\)/);
  assert.doesNotMatch(game,/activePerkBonus\('prestige'\)/);
});

test('sticky status dashboard remains native CSS sticky and overlay-safe',()=>{
  assert.match(styles,/\.resource-hud\{[\s\S]*?position:sticky/);
  assert.match(styles,/top:0/);
  assert.match(styles,/\.resource-hud\.is-stuck\{box-shadow:0 4px 10px/);
  assert.match(styles,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(styles,/height:80px;padding:10px 12px/);
  assert.match(styles,/\.hud-condition-row\{height:24px[\s\S]*?gap:14px/);
  assert.match(styles,/\.hud-attributes-row\{height:24px[\s\S]*?gap:10px/);
  assert.match(game,/value\/10\*100/);
  assert.match(html,/resource-hud-sentinel/);
});

test('mobile navigation and attribute grids avoid horizontal scrolling',()=>{
  assert.match(styles,/\.bottomnav\{grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(styles,/\.attribute-assignment-grid\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(styles,/@media \(max-width:699px\)\{\.attribute-assignment-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(styles,/\.fight-attribute-assignment\{padding:0;border-color:#22c55e;background:#111c2e/);
  assert.equal((html.match(/data-attribute-point-dot/g)||[]).length,1);
  assert.doesNotMatch(html,/data-nav="gear"[^>]*>[\s\S]*?data-attribute-point-dot[\s\S]*?<\/button>/);
  assert.match(styles,/\.navbtn\.attribute-ready\[data-nav="fight"\]/);
  assert.match(game,/fightNav\.classList\.toggle\('attribute-ready',available\)/);
  assert.match(game,/\$\$\('\[data-attribute-point-dot\]'\)\.forEach\(dot=>\{dot\.hidden=!available\}\)/);
  assert.match(styles,/@media \(max-width:340px\)/);
});

test('sponsors can drop and return as follower totals cross milestones',()=>{
  assert.match(game,/publishSponsorDrop\(beforeSponsor\)/);
  assert.match(game,/sponsor_dropped/);
  assert.match(game,/sponsor_returned/);
  assert.match(game,/posts=sharedReady\?mergedSocialPosts\(localPosts,sharedSocialPosts\):localPosts/);
  assert.match(game,/publishSponsorSigning\(progress\.active,\{returning\}\)/);
  assert.match(read('js/strings.js'),/sponsorDropped:/);
  assert.match(read('js/strings.js'),/sponsorReturning:/);
});

test('Daily Drop lives at the top of Gear while the install CTA stays on Home',()=>{
  const home=html.slice(html.indexOf('data-screen="home"'),html.indexOf('data-screen="fight"'));
  const gear=html.slice(html.indexOf('data-screen="gear"'),html.lastIndexOf('</main>'));
  assert.match(home,/id="homeInstallCta"[\s\S]*id="installGameBtn"[\s\S]*RETIRE THIS FIGHTER/);
  assert.doesNotMatch(home,/FREE DROP/);
  assert.match(gear,/id="gearDropOffer"[\s\S]*id="dailyBtn"[\s\S]*id="dailyDropResetClock"[\s\S]*id="gearShop"/);
  assert.doesNotMatch(gear,/id="installGameBtn"|INSTALL GAME · FREE DROP/);
  assert.match(game,/gearNav\.classList\.toggle\('drop-ready',dailyAvailable\)/);
  assert.match(game,/Gear, Daily Drop ready/);
  assert.match(styles,/\.navbtn\.drop-ready/);
});

test('Daily Drop offer uses a dramatic gold pack treatment and shares the Fight reset timer',()=>{
  assert.match(styles,/\.daily-drop-card\{[^}]*min-height:198px[^}]*border:2px solid #c7962e[^}]*radial-gradient\(circle at 21% 48%,#ffc8324d/);
  assert.match(styles,/\.daily-drop-pack\{[^}]*height:165px[^}]*animation:dailyDropHover/);
  assert.match(styles,/\.daily\{[^}]*linear-gradient\(#ffe47a[^}]*font-family:"Oswald"/);
  assert.match(styles,/@keyframes dailyDropShine/);
  assert.match(html,/id="fightResetClock"[^>]*>[\s\S]*class="daily-reset-clock career-after-setup" id="dailyDropResetClock"/);
  assert.match(html,/id="dailyDropResetClock"[^>]*>[\s\S]*id="dailyDropCountdown" data-daily-reset-clock/);
  assert.match(game,/dailyDropResetClock\.hidden=!dailyClaimed/);
  assert.doesNotMatch(styles,/\.daily-drop-card\.claimed/);
  assert.match(styles,/\.home-install-cta\{[^}]*display:flex/);
  assert.match(game,/function renderHomeInstallCta\(\)/);
  assert.match(game,/cta\.hidden=!ready\|\|installed;button\.hidden=!ready\|\|installed/);
  assert.doesNotMatch(game,/INSTALLING · YOUR FREE DROP|INSTALL DROP|install_reward_claimed/);
  assert.match(styles,/\.daily-drop-card\[hidden\]\{display:none\}/);
});

test('single-action modal footers fill their card width',()=>{
  assert.match(styles,/\.modal-actions\.single-action\{grid-template-columns:minmax\(0,1fr\)\}/);
  assert.match(styles,/\.modal-actions\.single-action>button\{width:100%\}/);
});

test('fight, championship, opponents, gear, packs, and Feed remain present',()=>{
  for(const token of ['id="opponentList"','id="gearShop"','id="victoryPackMeter"','id="socialTimeline"'])assert.ok(html.includes(token),token);
  assert.doesNotMatch(html,/id="openRankingsBtn"|World Standings|TOP 25 RANKINGS/);
  assert.doesNotMatch(html,/id="worldTitleCard"/);
  assert.match(game,/rankFighters/);
  assert.match(game,/settleChampionshipResult/);
  assert.match(game,/victoryPack/);
});

test('Gear category status reports unique collection completion',()=>{
  assert.match(game,/const categoryTotal=categoryItems\.length/);
  assert.match(game,/collectionStatus=`\$\{items\.length\} \/ \$\{categoryTotal\} COLLECTIBLES`/);
  assert.match(game,/loadoutStatus=`\$\{activeItems\.length\}\/\$\{loadoutLimit\} EQUIPPED`/);
  assert.match(game,/status=`<span>\$\{collectionStatus\}<\/span><small>\$\{loadoutStatus\}<\/small>`/);
  assert.doesNotMatch(game,/`\$\{items\.length\} COLLECTIBLE\$\{items\.length===1\?'':'S'\}`/);
  assert.match(styles,/\.shop-status>span\{white-space:nowrap\}/);
});

test('career perks equip inline with the same treatment as Fight Gear',()=>{
  assert.match(game,/equippedGear:\[\],equippedPerks:\[\]/);
  assert.match(game,/trimCategoryLoadout\(savedPerks,ownedPerks,LOADOUT_CATEGORIES\.slice\(1\)\)/);
  assert.match(logic,/function loadoutCategoryLimit\(\)\{return 2\}/);
  assert.doesNotMatch(game,/id="perk-loadout-title">PERK LOADOUT/);
  assert.match(game,/function equippedForCategory\(category/);
  assert.match(game,/function activePerkBonus\(prop\)/);
  assert.match(game,/function effectiveAura\(\)/);
  assert.match(game,/activePerkBonus\('healthRecoverySpeed'\)/);
  assert.match(game,/const perk=g\.category!==\'Fight Gear\'/);
  assert.doesNotMatch(styles,/\.perk-loadout-panel\{/);
  assert.match(game,/activeEffect=activeEffects\.length\?`ACTIVE ·/);
  assert.match(game,/activeEffects=\[\.\.\.combatLoadoutEffects\(activeItems\)/);
  assert.match(game,/class="gear-loadout-heading"/);
  assert.doesNotMatch(game,/Choose up to two active Combat items/);
  assert.doesNotMatch(game,/class="loadout-note/);
});

test('combat loadout heading totals equipped attribute perks',()=>{
  const helper=game.slice(game.indexOf('  function combatLoadoutEffects('),game.indexOf('  function renderGear('));
  const context={};vm.createContext(context);vm.runInContext(helper,context);
  const effects=items=>JSON.parse(vm.runInContext('JSON.stringify(combatLoadoutEffects('+JSON.stringify(items)+'))',context));
  assert.deepEqual(effects([]),[]);
  assert.deepEqual(effects([{stat:'power',bonus:2}]),['+2 POWER']);
  assert.deepEqual(effects([{stat:'chin',bonus:2},{stat:'chin',bonus:4}]),['+6 CHIN']);
  assert.deepEqual(effects([{stat:'cardio',bonus:2},{stat:'power',bonus:9}]),['+9 POWER','+2 CARDIO']);
  assert.deepEqual(effects([{auraBonus:3}]),[]);
});

test('each loadout category owns one distinct career effect',()=>{
  assert.match(game,/subtitles=\{'Fight Gear':'Attribute bonuses','Bling':'Aura bonuses','Lifestyle':'Health recovery','Property & Rides':'Energy recovery'\}/);
  assert.match(definitions,/COMMON:\{auraBonus:1,healthRecoverySpeed:2500,energyRecoverySpeed:100\}/);
  assert.match(definitions,/item\.category==='Fight Gear'\)item\.desc=item\.desc\.split/);
  assert.match(definitions,/item\.category==='Bling'\)\{item\.auraBonus=effect\.auraBonus/);
  assert.match(definitions,/item\.category==='Lifestyle'\)\{item\.healthRecoverySpeed=effect\.healthRecoverySpeed/);
  assert.match(definitions,/item\.category==='Property & Rides'\)\{item\.energyRecoverySpeed=effect\.energyRecoverySpeed/);
  assert.match(game,/state\.aura\+activePerkBonus\('auraBonus'\)/);
  assert.match(game,/\+\$\{auraGear\} BLING/);
});

test('every Gear category has the same eight-item rarity curve',()=>{
  const catalogSource=definitions.slice(definitions.indexOf('const gearItems'),definitions.indexOf('const gearCategoryEffectByRarity'));
  const items=[...catalogSource.matchAll(/\{id:'([^']+)',category:'([^']+)',name:'([^']+)',icon:'[^']+',(?:assetExt:'[^']+',)?rarity:'([^']+)'/g)].map(match=>({id:match[1],category:match[2],name:match[3],rarity:match[4]}));
  assert.equal(items.length,32);
  for(const category of ['Fight Gear','Bling','Lifestyle','Property & Rides']){
    const categoryItems=items.filter(item=>item.category===category);
    assert.equal(categoryItems.length,8,category);
    assert.deepEqual(Object.fromEntries(['COMMON','RARE','EPIC','LEGENDARY'].map(rarity=>[rarity,categoryItems.filter(item=>item.rarity===rarity).length])),{COMMON:4,RARE:2,EPIC:1,LEGENDARY:1},category);
  }
  assert.match(definitions,/EPIC:\{auraBonus:3,healthRecoverySpeed:7500,energyRecoverySpeed:300\}/);
  assert.match(definitions,/id:'private-jet'[^\n]+rarity:'EPIC'/);
  assert.match(definitions,/id:'mansion'[^\n]+rarity:'LEGENDARY'/);
  assert.match(definitions,/id:'performance-treadmill'[^\n]+rarity:'EPIC'[^\n]+stat:'cardio',bonus:6/);
  assert.match(definitions,/id:'heavy-bag'[^\n]+rarity:'LEGENDARY'[^\n]+stat:'power',bonus:9/);
  assert.match(game,/if\(g\?\.bonuses\?\.\[key\]\)v\+=g\.bonuses\[key\]/);
});

test('trimmed Gear items stay outside the active drop catalog',()=>{
  const cuts=['bourbon','cuban-cigars','fur-coat','diamond-watch','ice-ring','tennis-shoes','small-gym-dog','victory-bucket','hot-coffee','iced-coffee','dog','flagship-phone','shrimp-cocktail','white-loafers','concert-grand','performance-jet-ski','coastal-speedboat','house','supercar','luxury-yacht'];
  const catalogSource=definitions.slice(definitions.indexOf('const gearItems'),definitions.indexOf('const gearCategoryEffectByRarity'));
  for(const id of cuts)assert.doesNotMatch(catalogSource,new RegExp(`id:'${id}'`),id);
});

test('retired drop artwork is preserved outside the active icon catalog',()=>{
  const legacyDrops={
    'fight-gear':['wraps.png','mouth.png','mma-shorts.jpg','rookie-gloves.png','shoes.png','gloves.png','blackout-kit.png','storm-gloves.png','cobalt-kit.png','champ-gloves.png','main-event-kit.png'],
    bling:['bourbon.png','cuban-cigars.png','fur-coat.png','diamond-watch.png','ice-ring.png'],
    lifestyle:['tennis-shoes.png','small-gym-dog.png','victory-bucket.png','hot-coffee.png','iced-coffee.png','dog.png','flagship-phone.png','shrimp-cocktail.png','white-loafers.png','concert-grand.png'],
    'property-rides':['performance-jet-ski.png','coastal-speedboat.png','house.png','supercar.png','luxury-yacht.png']
  };
  assert.equal(Object.values(legacyDrops).flat().length,31);
  for(const [category,files] of Object.entries(legacyDrops))for(const file of files){
    assert.ok(fs.existsSync(path.join(root,'assets/legacy-drops',category,file)),`${category}/${file}`);
    assert.ok(!fs.existsSync(path.join(root,'assets/icons',file)),`active icons/${file}`);
  }
  assert.ok(fs.existsSync(path.join(root,'assets/legacy-drops/README.md')));
});

test('Gear keeps guidance in a fixed card footer and has no global active-loadout footer',()=>{
  assert.match(html,/class="card page-card gear-page-card"[\s\S]*id="gearCardHeader"[\s\S]*id="gearFilterTabs"[\s\S]*id="gearShop"/);
  assert.match(html,/class="page-footer gear-card-footer">Collectibles come from fight wins and the Daily Drop\. Drops reveal undiscovered items as they unlock; equip up to two per category\.<\/footer>/);
  assert.doesNotMatch(html,/gear-info-popover|About Gear collectibles/);
  assert.match(styles,/\.page-footer,\.home-coach-footer,\.gear-card-footer,\.fight-ladder-footer,\.feed-action-dock\{height:64px;flex:0 0 64px;[^}]*border-top:1px solid/);
  assert.doesNotMatch(html,/class="section-note">Collectibles come from fight wins/);
  assert.doesNotMatch(html,/id="gearLoadoutDock"|id="gearLoadoutSlots"|ACTIVE LOADOUT/);
  assert.doesNotMatch(game,/function renderGearLoadoutDock\(\)/);
});

test('Victory Packs and Daily Drops only award undiscovered collectibles',()=>{
  assert.match(game,/function eligibleGearAtLevel\(level,rarity\)\{return LOGIC\.undiscoveredCollectibles\(gearItems,ownedGearIds\(\),level,rarity\)\}/);
  assert.match(game,/function autoEquipNewDrop\(item\)\{/);
  assert.match(game,/equippedForCategory\(item\.category\)\.length>=LOGIC\.loadoutCategoryLimit\(\)/);
  assert.equal((game.match(/const autoEquipped=autoEquipNewDrop\(item\)/g)||[]).length,3);
  assert.doesNotMatch(game,/chooseGearWithDuplicateReroll/);
  assert.equal((game.match(/state\.gearCounts\[item\.id\]=1/g)||[]).length,3);
  assert.match(game,/ALL 32 COLLECTIBLES FOUND/);
  assert.match(game,/NEW COLLECTIBLES UNLOCK AS YOU LEVEL UP/);
});

test('Home invites award a server-validated nonduplicate referral drop after the invited fighter competes',()=>{
  const home=html.slice(html.indexOf('data-screen="home"'),html.indexOf('data-screen="fight"'));
  assert.match(home,/home-invite-heading"><b>FIGHTER REFERRALS<\/b><span>INVITE REWARDS<\/span>[\s\S]*id="inviteFighterBtn"[^>]*>INVITE<[\s\S]*RETIRE THIS FIGHTER/);
  assert.match(home,/home-danger-heading"><b>DANGER ZONE<\/b><span>PERMANENT ACTION<\/span>[\s\S]*RETIRE THIS FIGHTER/);
  assert.match(home,/guaranteed drop when they create a fighter and complete their first fight/i);
  assert.match(game,/url\.searchParams\.set\('invite',state\.socialProfileId\)/);
  assert.match(game,/I just started Cage Grind and it's brutal in the best way\. Come build your fighter and throw down —/);
  assert.match(game,/await SHARED_FEED\.qualifyReferral\(\)/);
  assert.match(game,/awardReferralCollectible\(referral\.referralId\)/);
  assert.match(game,/eligibleGearAtLevel\(state\.level,rarity\)/);
  assert.match(game,/reason:'REFERRAL DROP'/);
  const migration=read('supabase/migrations/20260905010000_fighter_referral_drops.sql');
  assert.match(migration,/create table if not exists public\.cage_fighter_referrals/i);
  assert.match(migration,/invitee_id uuid not null unique/i);
  assert.match(migration,/profile\.wins\+profile\.losses>0/i);
  assert.match(migration,/for update of referral skip locked/i);
  assert.match(migration,/grant execute on function public\.claim_cage_fighter_referral_reward\(\) to authenticated/i);
});

test('Aura can create a visible but bounded final-round crowd comeback edge',()=>{
  assert.match(logic,/function auraComebackEdge\(/);
  assert.match(logic,/if\(whole\(round\)!==3\)return 0/);
  assert.match(game,/crowdEdge=LOGIC\.auraComebackEdge\(\{round,rounds:sim\.rounds,playerAura:sim\.playerAura,opponentAura:sim\.opponentAura\}\)/);
  assert.match(game,/THE FANS ARE TRYING TO WILL \$\{favorite\.name\.toUpperCase\(\)\}'S COMEBACK INTO EXISTENCE/);
  assert.match(game,/THE CROWD CAN LIFT ITS FAVORITE WHEN A COMEBACK IS NEEDED/);
  assert.doesNotMatch(game,/CROWD AURA|HIGHER AURA (?:SPARKS|CAN SPARK)/);
  assert.match(styles,/\.action-line\.crowd-surge\{[^}]*border-color:#f3a447/);
});

test('Daily Drop claimed state always displays its reset countdown',()=>{
  assert.match(game,/dailyClaimed=ready&&!dailyAvailable/);
  assert.doesNotMatch(game,/installOfferDismissed|INSTALL_OFFER_DISMISS_KEY|installAvailable=ready&&!dailyAvailable/);
  assert.doesNotMatch(html,/installOfferHideBtn/);
});

test('daily fights use a twelve-bout limit with one three-fight qualifying streak bonus',()=>{
  assert.match(rules,/"dailyFightLimit": 12/);
  assert.match(rules,/"dailyBonusQualifyingWinStreak": 5/);
  assert.match(rules,/"dailyBonusFights": 3/);
  assert.match(game,/function updateDailyBonusStreak\(won,opponentLevel,playerLevel,ranks=\{\}\)/);
  assert.match(game,/LOGIC\.applyDailyFightStreak\(state\.dailyCounters,\{won,opponentLevel,playerLevel,...ranks,requiredStreak:DAILY_BONUS_WIN_STREAK\}\)\.awarded/);
  assert.match(logic,/const qualifies=won===true&&\(whole\(opponentLevel,1\)>=whole\(playerLevel,1\)/);
  assert.match(logic,/counters\.bonusFightAwarded!==true&&counters\.qualifyingWinStreak>=target/);
  assert.match(html,/id="dailyHeatResult"/);
  assert.match(html,/id="dailyHeatResultPips"/);
  assert.match(game,/function renderDailyHeatResult\(/);
  assert.match(game,/LOWER-LEVEL WIN NOT ELIGIBLE/);
  assert.match(game,/BONUS FIGHTS UNLOCKED/);
  assert.match(game,/renderDailyHeatResult\(\{won:win,lowerLevelWin,rankRepeatExhausted:.*?,forfeited:!!fight\.forfeited,dailyStreakBefore,dailyBonusAwarded\}\)/);
  assert.match(styles,/\.daily-heat-result-pips\{display:grid;grid-template-columns:repeat\(5,1fr\)/);
  assert.doesNotMatch(game,/kind:'streak'|-FIGHT WIN STREAK/);
  assert.doesNotMatch(styles,/\.win-streak-bonus/);
});

test('card titles cast a subtle shadow over their card content',()=>{
  assert.match(styles,/\.card-title\{[^}]*box-shadow:0 7px 14px #0008/);
});

test('Gear uses a fixed card shell, flat filters, rarity collections, and no quantity badges',()=>{
  assert.match(html,/class="gear-filter-tabs"[^>]*id="gearFilterTabs"/);
  for(const filter of ['combat','bling','property','lifestyle'])assert.match(html,new RegExp(`role="tab" data-gear-filter="${filter}"`));
  assert.doesNotMatch(html,/data-gear-filter="all"/);
  assert.match(game,/return \['combat','bling','property','lifestyle'\]\.includes\(saved\)\?saved:'combat'/);
  assert.match(game,/const categoryByFilter=\{combat:'Fight Gear',bling:'Bling',property:'Property & Rides',lifestyle:'Lifestyle'\},visibleOrder=\[categoryByFilter\[gearFilter\]\|\|'Fight Gear'\]/);
  assert.match(game,/loadoutCard&&equipped\?'equipped-full'/);
  assert.match(game,/data-equip="\$\{item\.id\}" aria-label="Unequip/);
  assert.doesNotMatch(game,/class="gear-count"/);
  assert.match(styles,/\.gear\.collectible-card\.rarity-card-common\{border:1px solid #2a3a52;background:#0d1622/);
  assert.match(styles,/\.gear\.collectible-card\.rarity-card-common:after,\.gear\.collectible-card\.rarity-card-common \.gear-flair\{display:none\}/);
  assert.match(styles,/\.gear\.collectible-card\.equipped-full\{/);
  assert.match(styles,/\.gear-equipped-full-check\{/);
  assert.match(game,/class="gear-top"><span class="rarity-tag">\$\{rarity\}<\/span>\$\{equippedMark\}<\/div>/);
  assert.match(styles,/\.gear-equipped-full-check\{position:static;/);
  assert.match(styles,/\.collectible-card \.gear-icon\{position:absolute;inset:0;[^}]*width:auto;height:auto;[^}]*padding:8px;overflow:hidden/);
  assert.match(styles,/\.collectible-card \.gear-icon \.icon-asset\{object-fit:contain;object-position:center\}/);
  assert.match(styles,/\.gear-filter-tabs\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(styles,/\.gear-filter-tabs button\[aria-selected="true"\]/);
  assert.match(styles,/\.gear-filter-tabs\{flex:0 0 auto;width:100%;margin:0;padding:0;border:0;[^}]*border-radius:0/);
  assert.match(styles,/\.page-scroll\{min-height:0;flex:1 1 auto;overflow-y:auto/);
  assert.match(styles,/\.gear-card-scroll \.gear-loadout-shop-block\{display:block;margin:0;border:0;border-radius:0;background:transparent;box-shadow:none\}/);
  assert.match(styles,/\.gear-card-scroll \.gear-loadout-shop-grid\{padding:7px\}/);
  assert.match(game,/function moveGearFilter\(key\)/);
  assert.match(game,/\$\('#gearCategoryTitle'\)\.textContent=headerCat/);
  assert.match(game,/class="gear-loadout-shop-block"/);
  assert.match(game,/Array\.from\(\{length:loadoutLimit\}/);
  assert.match(game,/collectibleCardHtml\(activeItems\[index\],\{loadoutCard:true\}\)/);
  assert.match(game,/loadoutEmptyCardHtml\(cat,index,hasAvailable\)/);
});

test('Gear merges available and anonymous undiscovered cards into rarity groups',()=>{
  assert.match(game,/undiscoveredItems=categoryItems\.filter\(g=>gearCount\(g\.id\)<1\)/);
  assert.match(game,/function undiscoveredCardHtml\(category,rarity,index\)/);
  assert.match(game,/class="gear collectible-card gear-undiscovered-card rarity-undiscovered-\$\{rarity\.toLowerCase\(\)\}"/);
  assert.match(game,/UNDISCOVERED<\/b><small>FIND IN A DROP/);
  assert.match(game,/function collectionBlockHtml\(category,availableItems,undiscoveredItems\)/);
  assert.match(game,/AVAILABLE \+ UNDISCOVERED/);
  assert.match(styles,/\.gear-collection-subhead>span\{min-width:0;height:auto;padding:0;place-items:initial;border:0;border-radius:0[^}]*text-align:left/);
  assert.match(game,/\$\{available\.map\(item=>collectibleCardHtml\(item\)\)\.join\(''\)\}\$\{hidden\.map/);
  assert.match(game,/const lockIcon=levelLocked\?'<span class="gear-level-lock"/);
  assert.match(game,/levelLocked\?`<button class="equip-btn" type="button" disabled>LOCKED/);
  assert.match(game,/rarities=\['COMMON','RARE','EPIC','LEGENDARY'\]/);
  assert.match(game,/class="gear-rarity-group rarity-undiscovered-\$\{rarity\.toLowerCase\(\)\}"/);
  assert.match(styles,/\.gear-rarity-group\.rarity-undiscovered-legendary\{--undiscovered-rarity:#ffe589\}/);
  assert.match(styles,/\.gear\.collectible-card\.gear-undiscovered-card\{display:grid;[^}]*border:1px dashed var\(--undiscovered-rarity,#748396\)/);
  assert.match(styles,/\.gear-level-lock\{position:absolute/);
});

test('full-height page cards share navigation spacing and keep scrolling internal',()=>{
  assert.match(styles,/#app:has\(\.resource-hud\.is-stuck\) \.bottomnav\{top:0\}/);
  assert.match(styles,/\.page-card\{display:flex;flex:1 1 0;[^}]*margin-bottom:0/);
  assert.match(styles,/#app:not\(\.career-setup\) \.screen\.active\{display:flex;height:calc\(100dvh - 230px - var\(--safe-top\) - var\(--safe-bottom\)\);min-height:0;flex-direction:column;overflow:hidden;padding-bottom:10px\}/);
  assert.match(styles,/\.screen\[data-screen="gear"\] :is\(#gearDropOffer,#dailyDropResetClock\),\.screen\[data-screen="fight"\] :is\(#fightResetClock,\.fight-attribute-assignment\)\{flex:0 0 auto\}/);
  assert.match(styles,/@media \(min-width:1100px\)\{#app:not\(\.career-setup\) \.screen\.active\{height:calc\(100dvh - 150px - var\(--safe-top\)\);padding-bottom:40px\}/);
  assert.match(styles,/\.page-scroll\{min-height:0;flex:1 1 auto;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none\}/);
  assert.match(html,/class="page-footer gear-card-footer"/);
  assert.match(html,/class="page-footer fight-ladder-footer"/);
  assert.match(html,/class="page-footer feed-action-dock"/);
  assert.match(html,/class="page-footer open-gym-footer"/);
  assert.match(styles,/\.page-footer,\.home-coach-footer,\.gear-card-footer,\.fight-ladder-footer,\.feed-action-dock\{height:64px;flex:0 0 64px;/);
});

test('Home, Fight, Gym, Gear, and Feed reuse the same page shell classes',()=>{
  for(const token of ['home-career-card page-card','page-card feed-page-card','fight-ladder page-card','page-card open-gym-card','page-card gear-page-card'])assert.match(html,new RegExp(token));
  for(const token of ['page-scroll home-career-scroll','page-scroll feed-list','page-scroll" id="opponentList"','page-scroll open-gym-scroll','page-scroll gear-card-scroll'])assert.match(html,new RegExp(token));
  assert.match(html,/id="gearCardHeader"><span class="page-title-copy"><b id="gearCategoryTitle">/);
  assert.match(html,/id="gearCategorySubtitle"/);
  assert.match(html,/id="gearCategoryStatus"/);
  assert.match(game,/class="page-subhead fight-ranking-group/);
  assert.match(game,/class="page-subhead gear-subhead/);
  assert.doesNotMatch(game,/class="shop-head"|headerHost\.replaceChildren|gearCategorySlug/);
});

test('Energy Drink collectible uses the Surge Core can artwork',()=>{
  assert.match(definitions,/id:'energy-drink'[^\n]+assetExt:'png'/);
  assert.ok(fs.existsSync(path.join(root,'assets/icons/energy-drink.png')));
  assert.ok(!fs.existsSync(path.join(root,'assets/icons/energy-drink.jpg')));
});

test('recovery-focused Lifestyle drops retain supplied artwork',()=>{
  for(const id of ['energy-drink','tinned-sardines','dill-pickle','fight-fuel-protein']){
    assert.match(definitions,new RegExp(`id:'${id}'[^\\n]+category:'Lifestyle'[^\\n]+rarity:'COMMON'`));
    assert.ok(fs.existsSync(path.join(root,`assets/icons/${id}.png`)),id);
  }
  for(const id of ['meal-plan','hot-tub'])assert.match(definitions,new RegExp(`id:'${id}'[^\\n]+category:'Lifestyle'[^\\n]+rarity:'RARE'`));
});

test('Kettlebell, Smart Watch, and Dill Pickle remain in the balanced catalog',()=>{
  const drops=[
    ['kettle-bell','Fight Gear','COMMON'],
    ['smart-watch','Bling','COMMON'],
    ['dill-pickle','Lifestyle','COMMON']
  ];
  for(const [id,category,rarity] of drops){
    assert.match(definitions,new RegExp(`id:'${id}'[^\\n]+category:'${category}'[^\\n]+rarity:'${rarity}'`));
    assert.ok(fs.existsSync(path.join(root,`assets/icons/${id}.png`)),id);
  }
});

test('Combat loadout uses training gear instead of fight apparel',()=>{
  const retired=['mouth','shoes','wraps','mma-shorts','rookie-gloves','gloves','blackout-kit','storm-gloves','cobalt-kit','champ-gloves','main-event-kit'];
  for(const id of retired)assert.doesNotMatch(definitions,new RegExp(`id:'${id}'[^\\n]+category:'Fight Gear'`));
  const training=[
    ['speed-bag','RARE'],
    ['performance-treadmill','EPIC'],
    ['heavy-bag','LEGENDARY']
  ];
  for(const [id,rarity] of training){
    assert.match(definitions,new RegExp(`id:'${id}'[^\\n]+category:'Fight Gear'[^\\n]+rarity:'${rarity}'`));
    assert.ok(fs.existsSync(path.join(root,`assets/icons/${id}.jpg`)),id);
  }
  assert.match(definitions,/id:'headgear'[^\n]+assetExt:'jpg'[^\n]+rarity:'RARE'[^\n]+stat:'chin',bonus:4/);
  assert.ok(fs.existsSync(path.join(root,'assets/icons/headgear.jpg')));
});

test('Aura fight skins appear on Home and stay outside perks and drops',()=>{
  assert.match(html,/id="homeFightSkin"[\s\S]*AURA · AUTOMATIC[\s\S]*id="homeFightSkinGloves"[\s\S]*id="homeFightSkinWraps"[\s\S]*id="homeFightSkinMouthguard"[\s\S]*id="homeFightSkinShorts"/);
  assert.match(styles,/\.home-fight-skin\{[^}]*--fight-skin-accent/);
  assert.match(styles,/\.home-fight-skin-display\{[^}]*display:grid/);
  const skinStart=definitions.indexOf('const auraFightSkins');
  const gearStart=definitions.indexOf('const gearItems');
  assert.ok(skinStart>=0&&skinStart<gearStart);
  const skins=[
    ['obscure','unknown','GRAY',0,39],
    ['mainstream','noticed','CYAN',40,59],
    ['elite','magnetic','PURPLE',60,79],
    ['iconic','iconic','ORANGE',80,98],
    ['legend','superstar','GOLD',99,100]
  ];
  for(const [key,assetKey,color,minimum,maximum] of skins){
    assert.match(definitions,new RegExp(`key:'${key}'[^\\n]+colorName:'${color}'[^\\n]+minimum:${minimum},maximum:${maximum}`));
    for(const piece of ['gloves','wraps','mouthguard','shorts']){
      const asset=`assets/skins/aura-${assetKey}-${piece}.png`;
      const bytes=fs.readFileSync(path.join(root,asset));
      assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10],`${key} ${piece} is a PNG`);
      assert.ok([4,6].includes(bytes[25]),`${key} ${piece} has an alpha channel`);
    }
  }
  const gearSource=definitions.slice(gearStart,definitions.indexOf('const endorsementDefs'));
  assert.doesNotMatch(gearSource,/aura-(?:unknown|noticed|magnetic|superstar|iconic)-(?:gloves|wraps|mouthguard|shorts)/);
  assert.match(game,/function currentAuraFightSkin\(\)/);
  assert.match(game,/fightSkinCard\.style\.setProperty\('--fight-skin-accent',fightSkin\.accent\)/);
  assert.equal((game.match(/currentAuraFightSkin\(\)\.accent/g)||[]).length,3);
  assert.match(styles,/\.hero-art img\{[^}]*mask-image:linear-gradient\(90deg,transparent 0,#000 10%,#000 90%,transparent 100%\)/);
});

test('Fight uses one clickable ranking ladder with visible matchup rewards',()=>{
  assert.match(html,/fight-ladder-heading[\s\S]*World Fight Rankings[\s\S]*id="rosterSummary"/);
  assert.match(styles,/\.fight-ladder-heading\{[\s\S]*display:grid/);
  for(const token of ['fight-ladder-columns','RANK · FIGHTER','WIN REWARDS'])assert.ok(html.includes(token),token);
  for(const token of ['fight-ranking-list','fight-ranking-row','fightWinRewardPreview','victoryAttributePointReward','data-fight-key'])assert.match(game,new RegExp(token));
  assert.match(game,/const FIGHT_RANKING_BATCH_SIZE=50/);
  assert.match(game,/rankedEntries\.slice\(0,visibleFightRankingCount\)/);
  assert.match(game,/visibleFightRankingCount\+=FIGHT_RANKING_BATCH_SIZE/);
  assert.match(game,/#opponentList'\)\.addEventListener\('scroll',maybeLoadMoreFightRankings,\{passive:true\}\)/);
  assert.match(game,/scroller\.scrollTop\+scroller\.clientHeight<scroller\.scrollHeight-240/);
  assert.match(styles,/\.page-scroll\{[^}]*overflow-y:auto/);
  assert.match(html,/fight-ladder-footer[^>]*>Tap a fighter for the Tale of the Tape/);
  assert.match(game,/PRO \$\{opponent\.wins\}-\$\{opponent\.losses\} · LVL \$\{opponent\.tier\} · \$\{winPercentage\}% WIN/);
  assert.doesNotMatch(html,/data-opponent-filter/);
  assert.match(game,/onChampionshipChange:renderOpponents/);
  assert.doesNotMatch(game,/renderFightChampionship|function filteredOpponents|function toggleOpponentCard|data-card-flip/);
  assert.match(game,/LOGIC\.rankedFightTitleMode/);
  assert.match(game,/fightMode==='ranked'\)return Object\.assign\(\{\},opponent,\{worldRank,titleDefenseComplete:playerIsChampion\}\)/);
  assert.match(game,/reward\.xp===0\?' class="zero"'/);
  assert.match(game,/reward\.points===0\?' class="zero"'/);
  assert.match(game,/xp-note\$\{reward\.xpPenalty\?' penalty':''\}/);
  assert.match(styles,/\.fight-rank-rewards>:is\(b,em\)\.zero\{color:#7d8995\}/);
  assert.match(styles,/\.fight-rank-rewards>small\.xp-note\.penalty\{color:#c47e79\}/);
});

test('CageReporter calls out lower-level wins and their follower backlash',()=>{
  const copyContext={};vm.runInNewContext(strings,copyContext);const cycles=copyContext.CAGE_STRINGS.social.cycles,pool=cycles.lowerLevelWin;
  assert.ok(Array.isArray(pool));
  for(const key of ['fightWin','lowerLevelWin','fightStreakHeadline','fightLoss']){
    const reporterPool=cycles[key].filter(post=>post.profile==='media');
    assert.equal(reporterPool.length,10,`${key} needs ten CageReporter variants`);
    assert.ok(reporterPool.some(post=>/verdict|no excuses|no sugarcoating|take note|tougher|important|dangerous|questions/i.test(post.text)),`${key} needs an editorial voice`);
  }
  pool.forEach(post=>{assert.equal(post.profile,'media');assert.match(post.text,/followers|audience|fans/i)});
  assert.match(game,/data\.win&&data\.lowerLevelWin/);
  assert.match(game,/followersLost:Math\.abs\(fans\)/);
  assert.match(game,/lowerLevelWin:lowerLevelWin&&!calloutFight/);
});

test('Fight ladder keeps the current fighter visible but not selectable',()=>{
  assert.match(game,/function renderPlayerRankingRow\(profile,position\)/);
  assert.match(game,/class="fight-ranking-row player\$\{champion\?' champion':''\}" role="listitem"/);
  assert.match(game,/YOUR FIGHTER<\/span>/);
  assert.match(game,/NOT SELECTABLE/);
  assert.match(game,/rankedEntries\.push\(\{rank:ranking\.position,html:renderPlayerRankingRow/);
  assert.match(styles,/\.fight-ranking-row\.player\{/);
});

test('Fight ladder switches to detailed columns from its card width, not viewport width',()=>{
  assert.match(styles,/\.fight-ladder\{[^}]*container-type:inline-size;container-name:fight-ladder\}/);
  assert.match(styles,/\.page-card\{display:flex;[^}]*overflow:hidden\}/);
  assert.match(styles,/@container fight-ladder \(min-width:660px\)/);
  assert.doesNotMatch(styles,/@media \(min-width:700px\)\{\s*\.fight-ladder-columns/);
});

test('Fight adds two on-level unranked Cage Circuit opponents above rankings',()=>{
  assert.match(game,/\.sort\(fighterLevelOrder\)\.slice\(0,2\)\.map\(opponent=>Object\.assign\(opponent,\{worldRank:null,circuitFallback:true\}\)\)/);
  assert.match(game,/o\.lossesToPlayer=\(o\.lossesToPlayer\|\|0\)\+1/);
  assert.match(game,/ensureRoster\(\);state\.dailyOpponentWins/);
  assert.match(game,/opponents=\[\.\.\.showcase,\.\.\.contract,\.\.\.circuit,\.\.\.ranked\]/);
  assert.match(game,/\$\{showcaseRows\}\$\{contractRows\}\$\{circuitRows\}\$\{rankedRows\}/);
  assert.match(game,/rank=opponent\.network\?`#\$\{opponent\.worldRank\|\|'—'\}`:'N\/A'/);
  assert.match(game,/ON-LEVEL CAGE CIRCUIT/);
  assert.match(game,/FRESH MATCHUPS · FULL XP · PRO RECORD/);
  assert.match(game,/f\.o\.network\?'RANKED BOUT':'UNRANKED PRO BOUT'/);
  assert.match(game,/if\(win\)\{[\s\S]*?state\.wins\+\+;state\.winStreak\+\+/);
  assert.match(game,/\}else\{[\s\S]*?state\.losses\+\+;state\.winStreak=0/);
  assert.match(html,/Tap a fighter for the Tale of the Tape; on-level wins earn 1 Attribute Point/);
  assert.match(game,/CAGE CIRCUIT REMATCH/);
  assert.match(game,/circuitRematches\.length>1/);
  assert.match(game,/state\.circuitLossStreak>=2\?-1:1/);
  assert.match(game,/state\.circuitLossStreak=0/);
  assert.match(game,/state\.circuitLossStreak\+\+/);
  assert.match(game,/LOGIC\.capOpponentRatings\(ratings,state\.stats,maximumAdvantage\)/);
  assert.match(game,/const opponentCountryMeta=\{USA:\['US','United States'\][\s\S]*SAM:\['WS','Samoa'\]\}/);
  assert.match(game,/function opponentCountryBadge\(code\)/);
  assert.match(game,/assets\/flags\/\$\{country\.iso\}\.svg\?v=\$\{ICON_ASSET_VERSION\}/);
  assert.match(game,/countryBadge=country\?opponentCountryBadge\(opponent\.country\):''/);
  assert.match(game,/country:f.o.country,style:f.o.tendency/);
  assert.match(game,/-\$\{fightRule\('experienceRewards\.lowerLevelOpponentFollowerLossPercent',5\)\}% FOLLOWERS/);
  assert.match(game,/XP USED TODAY/);
  assert.match(styles,/\.fight-ranking-row\.circuit/);
  assert.match(styles,/\.fight-country-badge/);
  assert.match(styles,/\.fight-country-badge img\{[^}]*width:20px/);
  assert.match(styles,/\.fighter-city-badge:has\(\.fight-country-badge\)\{[^}]*border:0/);
  for(const iso of ['us','mx','ru','br','ca','ie','gb','jp','kr','ng','th','ph','cu','pr','au','pl','ge','am','co','ar','nl','ws'])assert.ok(fs.existsSync(path.join(root,`assets/flags/${iso}.svg`)),iso);
  assert.ok(!fs.existsSync(path.join(root,'assets/flags/country-flags.svg')));
  assert.match(html,/on-level wins earn 1 Attribute Point; higher-level or higher-ranked wins earn 2/);
  assert.match(readme,/Beating either Circuit fighter removes that opponent and immediately generates a fresh on-level replacement/);
});

test('real ranked fighters remain available to new Level 1 careers',()=>{
  assert.doesNotMatch(game,/!profile\.isChampion&&profile\.fights<1/);
  assert.match(game,/loadOpponentCandidates\(state\.level,20\)/);
  assert.match(game,/loadSeedFighterRoster\(\)/);
  assert.match(game,/if\(ranked\.length\)state\.roster=/);
  assert.match(game,/Promise\.allSettled\(\[SHARED_FEED\.loadFeed/);
  assert.match(game,/if\(!profilesLoaded&&!candidatesLoaded&&!seedsLoaded\)throw/);
  assert.match(game,/if\(championshipResult\.status==='fulfilled'\)/);
});

test('desktop Fight layout uses a single-column navigation rail and centered details dialog',()=>{
  assert.match(styles,/@media \(min-width:1100px\)\{\.bottomnav\{grid-template-columns:1fr/);
  assert.match(styles,/\.tape-breakdown\{align-items:center;padding:24px\}/);
  assert.match(styles,/\.tape-breakdown-sheet\{width:min\(720px,calc\(100% - 48px\)\)/);
});

test('Tale of the Tape includes dynamic agent matchup advice',()=>{
  for(const id of ['tapeAgentRead','tapeAgentHeadline','tapeAgentMessage'])assert.ok(html.includes(`id="${id}"`),id);
  assert.equal((html.match(/id="tapeAgentRead"/g)||[]).length,1);
  assert.match(html,/class="tape-agent-avatar" src="assets\/contact-agent-carl.png\?v=[^"]+" alt="Agent Carl"/);
  assert.ok(fs.existsSync(path.join(root,'assets/contact-agent-carl.png')));
  assert.match(styles,/\.tape-agent-avatar\{[^}]*width:44px;height:44px/);
  assert.ok(html.indexOf('id="tapeAgentRead"')>html.indexOf('id="tapeStatsPanel"'));
  assert.ok(html.indexOf('id="tapeAgentRead"')<html.indexOf('class="tape-stats-bios"'));
  assert.ok(html.indexOf('id="tapeAgentRead"')<html.indexOf('id="tapeBreakdown"'));
  assert.match(game,/LOGIC\.matchupAdvice/);
  assert.match(styles,/\.tape-agent-read/);
});

test('fight-night masthead uses the local weekday and stays centered',()=>{
  assert.match(html,/class="fight-night-brand"><img src="assets\/cage-grind-logo\.png" alt="Cage Grind"><b><span id="fightNightDay">SUNDAY<\/span> NIGHT FIGHT/);
  assert.match(game,/function localFightNightDay\(date=new Date\(\)\)/);
  assert.match(game,/\$\('#fightNightDay'\)\.textContent=localFightNightDay\(\)/);
  assert.match(styles,/\.sim-header\{position:relative;display:grid;grid-template-columns:minmax\(0,1fr\);justify-items:center/);
  assert.match(styles,/\.fight-night-brand\{display:grid;justify-items:center/);
  assert.match(styles,/\.sim-header b\{[^}]*text-align:center;white-space:nowrap/);
});

test('matchup opens as a Las Vegas promo poster with event billing',()=>{
  assert.match(html,/class="matchup-poster"/);
  assert.match(html,/id="tapePosterPlayerName"[\s\S]*id="tapePosterOppName"/);
  assert.match(html,/id="tapeFightDate"[\s\S]*LAS VEGAS, NV[\s\S]*CAGE GRIND ARENA/);
  assert.match(game,/fightPosterDate\(\)/);
  assert.match(styles,/\.matchup-poster-title span\{[^}]*font-family:"Bebas Neue",Impact[^}]*white-space:nowrap/);
});

test('Tale of the Tape and Fight Details are top-level matchup sub-items',()=>{
  assert.match(html,/class="matchup-tools"[\s\S]*id="tapeStatsToggle"[^>]*>TALE OF THE TAPE<\/button>[\s\S]*id="tapeTermsToggle"[^>]*>FIGHT DETAILS<\/button>/);
  assert.match(html,/id="tapeStatsPanel"[\s\S]*id="tapeAttributes"/);
  assert.match(html,/id="tapeBreakdownTitle">FIGHT DETAILS<\/h2>/);
  assert.ok(html.indexOf('id="tapeStatsToggle"')<html.indexOf('class="matchup-poster"'));
  assert.ok(html.indexOf('id="tapeTermsToggle"')<html.indexOf('class="matchup-poster"'));
  assert.match(game,/tapeStatsToggle'\)\.addEventListener\('click',openTapeStats\)/);
  assert.match(styles,/\.matchup-promo-card \.tape-actions\{grid-template-columns:\.8fr 1\.45fr/);
  assert.match(styles,/\.matchup-promo-card \.tape-actions\{[^}]*width:100%;max-width:none/);
});

test('promo poster fits without scrolling and keeps fighter billing collision-free',()=>{
  assert.match(styles,/#tapeStage:has\(\.matchup-promo-card\)\{overflow:clip/);
  assert.doesNotMatch(html,/id="tapePlayerFavorite"/);
  assert.doesNotMatch(html,/id="tapeOppFavorite"/);
  assert.doesNotMatch(html,/id="tapePlayerRecord"/);
  assert.doesNotMatch(html,/id="tapeOppRecord"/);
  assert.doesNotMatch(html,/id="tapePlayerCity"/);
  assert.doesNotMatch(html,/id="tapeOppCity"/);
  assert.doesNotMatch(styles,/\.matchup-promo-card \.tape-card-top\{/);
  assert.match(styles,/\.matchup-poster-kicker>\*\{[^}]*border:0[^}]*background:transparent/);
  assert.match(styles,/\.matchup-promo-card \.tape-opp-sprite\.unknown-silhouette\{transform:scale\(1\.24\)/);
  assert.match(game,/unknownOpponent=!f\.o\.network&&!f\.o\.portraitAsset/);
  assert.match(game,/classList\.toggle\('solo-player-poster',unknownOpponent\)/);
  assert.match(styles,/\.matchup-promo-card\.solo-player-poster \.player-card\{grid-column:1\/-1;width:54%;justify-self:center\}/);
  assert.match(styles,/\.matchup-promo-card\.solo-player-poster \.opponent-card\{display:none\}/);
  assert.match(game,/classList\.toggle\('story-portrait',rookieShowcase\|\|firstContract\)/);
  assert.match(styles,/\.matchup-promo-card \.tape-opp-sprite\.story-portrait\{object-fit:cover;object-position:center top\}/);
  assert.match(styles,/\.matchup-poster-title\{[^}]*flex-direction:column/);
  assert.match(styles,/\.matchup-poster-title em\{[^}]*color:#e10600[^}]*font-family:"Bebas Neue"[^}]*text-shadow:/);
  assert.doesNotMatch(styles,/\.matchup-poster-title em\{[^}]*border-bottom/);
});

test('favorite designation is written into stacked fighter bios',()=>{
  assert.match(html,/class="tape-stats-bios"/);
  assert.doesNotMatch(html,/id="tapeStatsPlayerFavorite"|id="tapeStatsOppFavorite"/);
  assert.match(game,/favorite:playerFavorite/);
  assert.match(game,/favorite:oppFavorite/);
  const helper=game.slice(game.indexOf('  function statsFighterBio('),game.indexOf('  function renderStatsFightSkin('));
  const context={fighterCities:[{id:'chicago',name:'CHICAGO'}],opponentCountry:()=>({name:'Brazil'})};
  vm.createContext(context);vm.runInContext(helper,context);
  assert.equal(vm.runInContext("statsFighterBio({city:'chicago',style:'striker',wins:12,losses:1,favorite:true})",context),'A striker from Chicago with a 12-1 pro record. Comes in as the favorite on attributes.');
  assert.match(vm.runInContext("statsFighterBio({country:'BRA',style:'grappler',even:true})",context),/A grappler from Brazil.*evenly matched/);
  assert.equal(vm.runInContext("statsFighterBio({city:'chicago',style:'striker',wins:18,losses:4,even:true,showEven:false})",context),'A striker from Chicago with a 18-4 pro record.');
  assert.match(game,/favorite:oppFavorite,showEven:false,even:/);
  assert.match(styles,/\.tape-stats-bios p\{[^}]*text-align:left/);
  assert.match(vm.runInContext("statsFighterBio({})",context),/Cage Circuit.*underdog/);
});

test('Tale of the Tape makes tied attributes explicit and keeps opponent values legible',()=>{
  assert.match(game,/row\.classList\.toggle\('even',even\)/);
  assert.match(game,/row\.querySelector\('b'\)\.textContent=`\$\{label\}\$\{even\?' · TIE':''\}`/);
  assert.match(styles,/\.tape-attribute-meter\.even i\{background:#3a4658;box-shadow:none\}/);
  assert.match(styles,/\.tape-attribute-value\.even,[^{]+\{color:#9aa6b5;text-shadow:none\}/);
  assert.match(styles,/\.tape-attribute-row>\.tape-attribute-value:last-child\{color:#f9c4c1\}/);
});

test('career breakthrough modal uses flat materials and emphasizes the actionable unlock',()=>{
  assert.match(html,/class="level-up-reward unlock"><b id="levelUpUnlockValue">NEW<\/b><small id="levelUpUnlockLabel">COMPETITION<\/small>/);
  assert.doesNotMatch(html,/id="levelUpNote"/);
  assert.match(game,/\$\('#levelUpUnlockValue'\)\.textContent=loadoutUnlocked\?'4 \+ 4':'NEW'/);
  assert.match(game,/\$\('#levelUpUnlockLabel'\)\.textContent=loadoutUnlocked\?'LOADOUT SLOTS':'COMPETITION'/);
  assert.match(styles,/\.level-up-card\{[^}]*border:1px solid #d4af37[^}]*background:#0e1c30/);
  assert.match(styles,/\.level-up-card:before\{[^}]*width:200px[^}]*background:radial-gradient\(circle,#3ca8ff35 0,transparent 68%\)/);
  assert.match(styles,/\.level-up-number\{[^}]*border:3px solid #2f9cf4[^}]*background:#071a2d[^}]*box-shadow:none/);
  assert.match(styles,/\.level-up-reward\.unlock\{[^}]*border-color:#22c55e[^}]*background:#22c55e14/);
  assert.match(styles,/\.level-up-rewards\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(styles,/\.level-up-continue\{[^}]*background:#2376e5[^}]*box-shadow:none/);
  assert.doesNotMatch(styles,/\.level-up-card:before\{[^}]*repeating-conic-gradient/);
});

test('fighter bios use full locations without city badges',()=>{
  assert.doesNotMatch(html,/id="tapeStatsPlayerCity"|id="tapeStatsOppCity"/);
  assert.match(game,/city:state.fighterCity/);
  assert.match(game,/city:f.o.networkCity,country:f.o.country/);
  assert.match(styles,/\.tape-stats-bios h3\{[^}]*overflow-wrap:anywhere/);
});

test('promo poster uses a bundled condensed font and three-part card billing',()=>{
  assert.match(html,/id="tapeBoutClass">UNRANKED PRO BOUT<\/span>[\s\S]*id="tapeBoutRounds">3 ROUNDS<\/b>[\s\S]*id="tapeCardPlacement">MAIN CARD<\/strong>/);
  assert.match(game,/tapeBoutClass'\)\.textContent=titleBout\?'WORLD TITLE':f\.o\.network\?'RANKED BOUT':'UNRANKED PRO BOUT'/);
  assert.match(styles,/@font-face\{font-family:"Bebas Neue";src:url\("\.\.\/assets\/fonts\/BebasNeue-Regular\.ttf\?v=/);
  assert.ok(fs.existsSync(path.join(root,'assets/fonts/BebasNeue-Regular.ttf')));
  assert.ok(fs.existsSync(path.join(root,'assets/fonts/BebasNeue-OFL.txt')));
  assert.ok(fs.existsSync(path.join(root,'assets/fonts/Oswald-Variable.ttf')));
  assert.ok(fs.existsSync(path.join(root,'assets/fonts/BarlowCondensed-SemiBold.ttf')));
  assert.match(serviceWorker,/assets\/fonts\/BebasNeue-Regular\.ttf/);
  assert.match(serviceWorker,/assets\/fonts\/Oswald-Variable\.ttf/);
  assert.match(serviceWorker,/assets\/fonts\/BarlowCondensed-SemiBold\.ttf/);
  assert.match(styles,/\.matchup-poster-billing b\{font-family:"Oswald"/);
  assert.match(styles,/\.matchup-poster-billing small\{[^}]*font-family:"Barlow Condensed"/);
});

test('open ranked title migration allows one selected daily defense',()=>{
  const migration=read('supabase/migrations/20260829120000_open_ranked_title_fights.sql');
  assert.match(migration,/begin_cage_championship_challenge\(p_opponent_id uuid default null\)/);
  assert.match(migration,/where id=p_opponent_id[\s\S]*coalesce\(wins,0\)\+coalesce\(losses,0\)>0/);
  assert.match(migration,/prior\.initiated_by=v_user_id and prior\.challenge_day=v_today/);
  assert.doesNotMatch(migration,/v_player\.level\s*<\s*v_champion\.level/);
});

test('saved generated opponents are rebalanced to the fight-first curve',()=>{
  assert.match(game,/function rebalanceGeneratedOpponent/);
  assert.match(game,/rebalanceGeneratedOpponent\(o\)/);
  assert.match(game,/generatedOpponentRatings\(tier,serial,seed,arch,maximumAdvantage\)/);
});

test('service worker caches Open Gym navigation art but not removed activity code or art',()=>{
  const worker=read('service-worker.js');
  for(const token of ['underground-buzz','nav-hustle','home-training','home-hustle','racehorse','cage-dice'])assert.doesNotMatch(worker,new RegExp(token,'i'),token);
  assert.match(worker,/nav-train\.png/);
  assert.match(worker,/fight-rules\.json/);
});

test('README documents the complete simplified architecture',()=>{
  const readme=read('README.md');
  for(const token of ['zero below the fighter\'s level, one at the same level, and two above it','5 seconds','60 seconds','Attribute Points','Follower-based sponsors','Share Win','Home, Fight, Gym, Gear, and Feed','state version 31','balanced XP curve','1 + floor(Aura / 10)','0.75 payout multiplier','48 hours'])assert.ok(readme.includes(token),token);
  for(const threshold of ['500','2,500','10,000','30,000','80,000','200,000'])assert.ok(readme.includes(threshold),threshold);
  assert.match(readme,/five percent of current followers/);
  assert.match(readme,/drops to the highest sponsor tier their current follower total still qualifies for/);
});

test('PWA metadata describes the current fight-first game',()=>{
  const manifest=JSON.parse(read('manifest.webmanifest'));
  assert.match(manifest.description,/fights/);
  assert.doesNotMatch(manifest.description,/train|hustle|cash/i);
  assert.equal(manifest.display,'standalone');
});

test('stylesheet respects reduced motion',()=>{
  assert.match(styles,/@media \(prefers-reduced-motion:reduce\)/);
  assert.match(steel,/@media \(prefers-reduced-motion:reduce\)/);
});

test('Supabase and social integrations remain non-fatal and isolated',()=>{
  assert.equal(fs.existsSync(path.join(root,'js/supabase-client.js')),true);
  assert.equal(fs.existsSync(path.join(root,'js/cage-social.js')),true);
  assert.match(game,/connectSharedSocial/);
});

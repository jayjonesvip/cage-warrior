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
const definitions=read('js/definitions.js');
const styles=read('css/styles.css');
const steel=read('css/github-steel.css');
const readme=read('README.md');

test('all first-party JavaScript parses without a build step',()=>{
  for(const file of fs.readdirSync(path.join(root,'js')).filter(name=>name.endsWith('.js'))){
    assert.doesNotThrow(()=>new vm.Script(read(`js/${file}`),{filename:file}),file);
  }
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
  const dynamic=new Set(['cornerPlanGrid']);
  const ids=new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(match=>match[1]));
  const selectors=[...game.matchAll(/\$\('#([A-Za-z][\w-]*)[^']*'\)/g)].map(match=>match[1]);
  for(const id of new Set(selectors))assert.ok(ids.has(id)||dynamic.has(id),id);
});

test('primary navigation contains only Home, Fight, Gear, and Feed',()=>{
  const nav=[...html.matchAll(/<button class="navbtn[^>]*data-nav="([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual(nav,['home','fight','gear','feed']);
});

test('primary navigation renders the custom PNG icon set directly',()=>{
  for(const name of ['home','fight','gear','feed'])assert.match(html,new RegExp(`assets/icons/nav-${name}\\.png\\?v=`),name);
  assert.doesNotMatch(html,/data-icon-name="nav-(?:home|fight|gear|feed)"/);
  assert.match(styles,/\.navbtn \.ni img/);
});

test('only four primary screens remain',()=>{
  const screens=[...html.matchAll(/<section class="screen[^>]*data-screen="([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual(screens,['home','feed','fight','gear']);
});

test('removed manual activity interfaces are absent',()=>{
  const removedIds=['trainScreen','hustleScreen','restModal','recoveryModal','blackjackModal','cageDiceModal','horseRaceModal','autographModal'];
  for(const id of removedIds)assert.doesNotMatch(html,new RegExp(`id="${id}"`),id);
  assert.doesNotMatch(styles,/training-injury|trainer-toggle|sparring|horse-race|blackjack|cage-dice|data-nav="train"/i);
  assert.doesNotMatch(steel,/training|trainer|sparring|horse-race|blackjack|cage-dice|hustle/i);
});

test('obsolete activity files and assets were removed',()=>{
  for(const file of ['js/underground-buzz.js','assets/cage-dice.jpg','assets/racehorse-right.png','assets/home-training.png','assets/home-hustle.png','assets/icons/nav-train.png','assets/icons/nav-hustle.png','assets/icons/rest.png','assets/icons/rideshare-driver.jpg','assets/icons/surgecore-energy-drink.png']){
    assert.equal(fs.existsSync(path.join(root,file)),false,file);
  }
});

test('new careers use explicit save version 26',()=>{
  assert.match(game,/const STATE_VERSION\s*=\s*26/);
  assert.match(game,/version:STATE_VERSION/);
  assert.match(game,/attributePoints:0/);
  assert.match(game,/circuitLossStreak:0/);
  assert.match(game,/energyRecoveryAt:Date\.now\(\)/);
  assert.match(game,/healthRecoveryAt:Date\.now\(\)/);
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

test('persistent HUD exposes continuous charging and Health recovery status',()=>{
  assert.match(html,/id="energyRecoveryStatus"/);
  assert.match(html,/id="healthRecoveryStatus"/);
  assert.match(game,/CHARGING · FULL IN/);
  assert.match(game,/RECOVERING · FULL IN/);
  assert.match(game,/setInterval\(updatePassiveRecovery,1000\)/);
  assert.match(game,/visibilitychange/);
  assert.match(game,/pageshow/);
});

test('Energy recovery popup reports accumulated Energy once',()=>{
  assert.match(game,/if\(recovered\.energy>0\)flashRecoveryResources\(\{energy:recovered\.energy,health:0\}\)/);
  assert.match(html,/id="hudEnergyDelta"/);
});

test('battery cells display proportional continuous charge',()=>{
  assert.match(game,/--charge/);
  assert.match(styles,/var\(--charge/);
  assert.equal((html.match(/<i><\/i>/g)||[]).length>=4,true);
});

test('Attribute Point assignment appears on Home and victory results',()=>{
  assert.equal((html.match(/data-attribute-assignment/g)||[]).length,2);
  for(const stat of ['power','speed','chin','cardio'])assert.equal((html.match(new RegExp(`data-assign-attribute="${stat}"`,'g'))||[]).length,2,stat);
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

test('victory reward prioritizes Attribute Point, followers, and XP',()=>{
  assert.match(game,/attributePoint===1\?'ATTRIBUTE POINT':'ATTRIBUTE POINTS'/);
  assert.match(game,/attribute_points_earned:attributePoint/);
  assert.match(game,/rewardFansLabel.*FOLLOWERS/);
  assert.match(game,/rewardXpLabel/);
  assert.doesNotMatch(game,/rewardCash|rewardEarnings/);
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

test('sponsor announcement and next-milestone progress are wired',()=>{
  assert.match(html,/id="sponsorAnnouncementModal"/);
  assert.match(html,/id="careerSponsorProgress"/);
  assert.match(game,/sponsorAnnouncementPending/);
  assert.match(game,/TOP-TIER SPONSOR/);
});

test('Energy recovery gear is capped at the strongest equipped perk',()=>{
  assert.match(definitions,/energyRecoverySpeed:1000/);
  assert.match(game,/Math\.max\(4000,ENERGY_RECOVERY_INTERVAL-ownedBestBonus\('energyRecoverySpeed'\)\)/);
  assert.match(game,/Math\.max\(best,Number\(item\?\.\[prop\]\)\|\|0\)/);
  assert.doesNotMatch(definitions,/healthRegen/);
});

test('Home explains the fight-first loop',()=>{
  assert.match(html,/FIGHT\. IMPROVE\. CLIMB\./);
  assert.match(html,/Wins earn up to two Attribute Points based on opponent level/);
  assert.doesNotMatch(html,/BUILD YOUR CAREER[\s\S]*HUSTLE/i);
});

test('sticky status dashboard remains native CSS sticky and overlay-safe',()=>{
  assert.match(styles,/\.resource-hud\{[\s\S]*?position:sticky/);
  assert.match(styles,/top:0/);
  assert.match(styles,/\.resource-hud\.is-stuck\{box-shadow:0 4px 10px/);
  assert.match(styles,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(html,/resource-hud-sentinel/);
});

test('mobile navigation and attribute grids avoid horizontal scrolling',()=>{
  assert.match(styles,/\.bottomnav\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(styles,/\.attribute-assignment-grid\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(styles,/@media \(max-width:340px\)/);
});

test('fight, championship, opponents, rankings, gear, packs, and Feed remain present',()=>{
  for(const token of ['id="opponentList"','id="openRankingsBtn"','id="gearShop"','id="victoryPackMeter"','id="socialTimeline"'])assert.ok(html.includes(token),token);
  assert.doesNotMatch(html,/id="worldTitleCard"/);
  assert.match(game,/rankFighters/);
  assert.match(game,/settleChampionshipResult/);
  assert.match(game,/victoryPack/);
});

test('Fight uses one clickable ranking ladder with visible matchup rewards',()=>{
  for(const token of ['fight-ladder-columns','RANK · FIGHTER','WIN REWARDS'])assert.ok(html.includes(token),token);
  for(const token of ['fight-ranking-list','fight-ranking-row','fightWinRewardPreview','victoryAttributePointReward','data-fight-key'])assert.match(game,new RegExp(token));
  assert.match(game,/PRO \$\{opponent\.wins\}-\$\{opponent\.losses\} · LVL \$\{opponent\.tier\} · \$\{winPercentage\}% WIN/);
  assert.doesNotMatch(html,/data-opponent-filter/);
  assert.match(game,/onChampionshipChange:renderOpponents/);
  assert.doesNotMatch(game,/renderFightChampionship|function filteredOpponents|function toggleOpponentCard|data-card-flip/);
  assert.match(game,/LOGIC\.rankedFightTitleMode/);
  assert.match(game,/fightMode==='ranked'\)return Object\.assign\(\{\},opponent,\{worldRank,titleDefenseComplete:playerIsChampion\}\)/);
});

test('Fight adds two on-level unranked Cage Circuit opponents above rankings',()=>{
  assert.match(game,/\.sort\(fighterLevelOrder\)\.slice\(0,2\)\.map\(opponent=>Object\.assign\(opponent,\{worldRank:null,circuitFallback:true\}\)\)/);
  assert.match(game,/o\.lossesToPlayer=\(o\.lossesToPlayer\|\|0\)\+1/);
  assert.match(game,/ensureRoster\(\);state\.dailyOpponentWins/);
  assert.match(game,/opponents=\[\.\.\.showcase,\.\.\.circuit,\.\.\.ranked\]/);
  assert.match(game,/\$\{showcaseRows\}\$\{circuitRows\}\$\{rankedRows\}/);
  assert.match(game,/rank=opponent\.network\?`#\$\{opponent\.worldRank\|\|'—'\}`:'N\/A'/);
  assert.match(game,/ON-LEVEL CAGE CIRCUIT/);
  assert.match(game,/FRESH MATCHUPS · FULL XP/);
  assert.match(game,/CAGE CIRCUIT REMATCH/);
  assert.match(game,/circuitRematches\.length>1/);
  assert.match(game,/state\.circuitLossStreak>=2\?-1:1/);
  assert.match(game,/state\.circuitLossStreak=0/);
  assert.match(game,/state\.circuitLossStreak\+\+/);
  assert.match(game,/LOGIC\.capOpponentRatings\(ratings,state\.stats,maximumAdvantage\)/);
  assert.match(game,/LOWER LEVEL/);
  assert.match(game,/XP USED TODAY/);
  assert.match(styles,/\.fight-ranking-row\.circuit/);
  assert.match(html,/Two generated on-level Cage Circuit fighters stay at the top/);
  assert.match(readme,/Beating either Circuit fighter removes that opponent and immediately generates a fresh on-level replacement/);
});

test('Tale of the Tape includes dynamic agent matchup advice',()=>{
  for(const id of ['tapeAgentRead','tapeAgentHeadline','tapeAgentMessage'])assert.ok(html.includes(`id="${id}"`),id);
  assert.match(game,/LOGIC\.matchupAdvice/);
  assert.match(styles,/\.tape-agent-read/);
});

test('Tale of the Tape keeps the primary matchup clean and moves supporting information into Fight Details',()=>{
  assert.match(html,/id="tapeTermsToggle"[^>]*>FIGHT DETAILS<\/button>/);
  assert.match(html,/id="tapeBreakdownTitle">FIGHT DETAILS<\/h2>/);
  assert.ok(html.indexOf('id="tapeTermsToggle"')<html.indexOf('id="tapeBreakdown"'));
  assert.ok(html.indexOf('id="tapeAgentRead"')>html.indexOf('id="tapeBreakdown"'));
  assert.match(styles,/\.tape-actions\{grid-template-columns:\.85fr 1fr 1\.45fr/);
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

test('service worker no longer caches removed activity code or art',()=>{
  const worker=read('service-worker.js');
  for(const token of ['underground-buzz','nav-train','nav-hustle','home-training','home-hustle','racehorse','cage-dice'])assert.doesNotMatch(worker,new RegExp(token,'i'),token);
  assert.match(worker,/fight-rules\.json/);
});

test('README documents the complete simplified architecture',()=>{
  const readme=read('README.md');
  for(const token of ['zero below your level, one at your level, and two above it','5 seconds','60 seconds','Attribute Points','Follower-based sponsors','Share Win','Home, Fight, Gear, and Feed','state version 26'])assert.ok(readme.includes(token),token);
  for(const threshold of ['500','2,500','10,000','30,000','80,000','200,000'])assert.ok(readme.includes(threshold),threshold);
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

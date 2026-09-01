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
const styles=read('css/styles.css');
const steel=read('css/github-steel.css');
const readme=read('README.md');
const serviceWorker=read('service-worker.js');

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

test('new careers use explicit save version 28',()=>{
  assert.match(game,/const STATE_VERSION\s*=\s*28/);
  assert.match(game,/version:STATE_VERSION/);
  assert.match(game,/attributePoints:0/);
  assert.match(game,/circuitLossStreak:0/);
  assert.match(game,/energyRecoveryAt:Date\.now\(\)/);
  assert.match(game,/healthRecoveryAt:Date\.now\(\)/);
  assert.match(game,/source\.version\)\)\|\|0\)<27\)s\.xp=LOGIC\.rescaleXpProgress/);
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
  const recoveryBody=game.match(/function updatePassiveRecovery\(\)\{([\s\S]*?)\n  \}/)?.[1]||'';
  assert.match(recoveryBody,/renderResourceHud\(\)/);
  assert.doesNotMatch(recoveryBody,/updateUI\(\)/);
  assert.match(game,/state\.health>=state\.maxHealth/);
  assert.match(game,/state\.health>=MINIMUM_FIGHT_HEALTH/);
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

test('beating Vaso unlocks and opens the persistent Diego first contract',()=>{
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

test('Home presents XP and Victory Pack progress before sponsorship',()=>{
  const xpIndex=html.indexOf('id="careerXpLevel"');
  const packIndex=html.indexOf('id="victoryPackMeter"');
  const sponsorIndex=html.indexOf('id="careerSponsorLabel"');
  const heroIndex=html.indexOf('<div class="hero">');
  assert.ok(xpIndex>=0&&packIndex>xpIndex&&sponsorIndex>packIndex);
  assert.ok(packIndex<heroIndex,'Victory Pack progress belongs above the fighter portrait');
  assert.match(html,/id="careerXpTrack"[^>]*role="progressbar"/);
  assert.match(html,/id="victoryPackTrack"[^>]*role="progressbar"/);
  assert.match(game,/\$\('#careerXpFill'\)\.style\.width/);
  assert.match(game,/\$\('#victoryPackFill'\)\.style\.width/);
  assert.match(styles,/\.career-token\.career-progression-goal\{grid-column:1\/-1!important/);
  assert.doesNotMatch(styles,/\.victory-pack-meter\{position:absolute/);
});

test('Home visually leads with the fighter profile before career details',()=>{
  assert.match(styles,/#app:not\(\.career-setup\) \.screen\[data-screen="home"\]\.active\{display:flex;flex-direction:column\}/);
  assert.match(styles,/#careerGameContent>\.hero\{order:1\}/);
  assert.match(styles,/#careerIdentityCard\{order:2\}/);
  assert.match(html,/class="card career-after-setup home-ticker"/);
  assert.match(styles,/>\.home-ticker\{order:3\}/);
  assert.doesNotMatch(html,/FIGHT\. IMPROVE\. CLIMB\.|career-guide|choice-action/);
  assert.doesNotMatch(styles,/career-guide|choice-action|choice-grid/);
  assert.doesNotMatch(game,/\[data-go\]/);
  assert.match(styles,/#careerGameContent\{display:contents!important\}/);
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
  assert.match(styles,/\.feed-network-summary\{display:grid;grid-template-columns:1fr 1fr/);
  assert.match(styles,/\.feed-network-summary>div:last-child\{text-align:right\}/);
  assert.doesNotMatch(styles,/\.feed-network-summary[^}]*border|\.feed-network-summary>div\+div/);
  assert.match(styles,/\.feed-header-filters button\.active\{color:#70d9ff/);
  assert.doesNotMatch(html,/feed-page-note|Mentions isolates posts addressed to you/);
  assert.doesNotMatch(styles,/\.feed-page-note/);
  assert.doesNotMatch(styles,/\.feed-filter-bar/);
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
  assert.match(game,/consequential=!divider&&!summary&&\/\(\^\|\\s\)\(opp\|big\|ko\|plan-edge\|plan-even\|plan-exposed\)/);
  assert.match(styles,/\.action-line\.consequential\{[^}]*border-width:1px;[^}]*font-size:12px;font-weight:750/);
  assert.match(game,/class="event-icon" aria-hidden="true">&#9888;&#65038;/);
  assert.match(styles,/\.action-line:not\(\.consequential\):not\(\.round-divider\):not\(\.unofficial-score\)\{color:#aeb8c3/);
  assert.match(game,/previous\.dataset\.fightText===String\(item\.text\|\|''\)[\s\S]*previous\.dataset\.fightSide===String\(item\.side\|\|''\)/);
  assert.match(game,/tally\.textContent=`×\$\{count\}`/);
  assert.match(styles,/\.action-repeat\{[^}]*border-radius:999px/);
  assert.match(styles,/\.condition\{height:10px/);
  assert.match(styles,/\.action-line\.unofficial-score\{[^}]*border:1px solid #876b2c;[^}]*border-left:3px solid #e6bc56/);
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

test('Energy recovery gear is capped at the strongest equipped perk',()=>{
  assert.match(definitions,/energyRecoverySpeed:1000/);
  assert.match(game,/Math\.max\(4000,ENERGY_RECOVERY_INTERVAL-ownedBestBonus\('energyRecoverySpeed'\)\)/);
  assert.match(game,/Math\.max\(best,Number\(item\?\.\[prop\]\)\|\|0\)/);
  assert.doesNotMatch(definitions,/healthRegen/);
});

test('Dill Pickle electrolytes improve Health recovery without granting followers',()=>{
  const pickle=definitions.match(/\{id:'dill-pickle'[^\n]+\}/)?.[0]||'';
  assert.match(pickle,/healthRecoverySpeed:5000/);
  assert.doesNotMatch(pickle,/prestige:/);
  assert.match(game,/Math\.max\(30000,HEALTH_RECOVERY_INTERVAL-activePerkBestBonus\('healthRecoverySpeed'\)\)/);
  assert.match(game,/health:healthRecoveryInterval\(\)/);
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
  assert.match(game,/post\.kind==='sponsor-drop'\|\|post\.kind==='sponsor-return'/);
  assert.match(game,/publishSponsorSigning\(progress\.active,\{returning\}\)/);
  assert.match(read('js/strings.js'),/sponsorDropped:/);
  assert.match(read('js/strings.js'),/sponsorReturning:/);
});

test('drop offers live at the top of Gear and flag its navigation when ready',()=>{
  const home=html.slice(html.indexOf('data-screen="home"'),html.indexOf('data-screen="fight"'));
  const gear=html.slice(html.indexOf('data-screen="gear"'),html.lastIndexOf('</main>'));
  assert.doesNotMatch(home,/id="(?:gearDropOffer|dailyBtn|installGameBtn)"/);
  assert.match(gear,/id="gearDropOffer"[\s\S]*id="dailyBtn"[\s\S]*id="installGameBtn"[\s\S]*id="gearShop"/);
  assert.match(game,/gearNav\.classList\.toggle\('drop-ready',dailyAvailable\)/);
  assert.match(game,/Gear, Daily Drop ready/);
  assert.match(styles,/\.navbtn\.drop-ready/);
});

test('Daily Drop offer uses a dramatic gold pack treatment without changing claimed state',()=>{
  assert.match(styles,/\.daily-drop-card\{[^}]*min-height:198px[^}]*border:2px solid #c7962e[^}]*radial-gradient\(circle at 21% 48%,#ffc8324d/);
  assert.match(styles,/\.daily-drop-pack\{[^}]*height:165px[^}]*animation:dailyDropHover/);
  assert.match(styles,/\.daily\{[^}]*linear-gradient\(#ffe47a[^}]*font-family:"Oswald"/);
  assert.match(styles,/@keyframes dailyDropShine/);
  assert.match(styles,/\.daily-drop-card\.claimed\{[^}]*min-height:0/);
  assert.match(html,/id="installOfferHideBtn"[^>]*hidden>HIDE<\/button>/);
  assert.match(game,/INSTALL_OFFER_DISMISS_KEY = 'cage-grind-install-offer-hidden'/);
  assert.match(game,/sessionStorage\.getItem\(INSTALL_OFFER_DISMISS_KEY\)==='1'/);
  assert.match(game,/gearDropOffer\.hidden=!ready\|\|\(installAvailable&&installOfferDismissed\)/);
  assert.match(game,/sessionStorage\.setItem\(INSTALL_OFFER_DISMISS_KEY,'1'\)/);
  assert.doesNotMatch(game,/installOfferDismissed[^\n]*saveState/);
});

test('single-action modal footers fill their card width',()=>{
  assert.match(styles,/\.modal-actions\.single-action\{grid-template-columns:minmax\(0,1fr\)\}/);
  assert.match(styles,/\.modal-actions\.single-action>button\{width:100%\}/);
});

test('fight, championship, opponents, rankings, gear, packs, and Feed remain present',()=>{
  for(const token of ['id="opponentList"','id="openRankingsBtn"','id="gearShop"','id="victoryPackMeter"','id="socialTimeline"'])assert.ok(html.includes(token),token);
  assert.doesNotMatch(html,/id="worldTitleCard"/);
  assert.match(game,/rankFighters/);
  assert.match(game,/settleChampionshipResult/);
  assert.match(game,/victoryPack/);
});

test('Gear category status reports unique collection completion',()=>{
  assert.match(game,/const categoryTotal=gearItems\.filter\(g=>g\.category===cat\)\.length/);
  assert.match(game,/collectionStatus=`\$\{items\.length\} \/ \$\{categoryTotal\} COLLECTIBLES`/);
  assert.match(game,/fightGear=cat==='Fight Gear',loadoutStatus=fightGear\?`\$\{state\.equippedGear\.length\}\/\$\{loadoutLimit\} EQUIPPED/);
  assert.match(game,/status=`<span>\$\{collectionStatus\}<\/span><small>\$\{loadoutStatus\}<\/small>`/);
  assert.doesNotMatch(game,/`\$\{items\.length\} COLLECTIBLE\$\{items\.length===1\?'':'S'\}`/);
  assert.match(styles,/\.shop-status>span\{white-space:nowrap\}/);
});

test('career perks equip inline with the same treatment as Fight Gear',()=>{
  assert.match(game,/equippedGear:\[\],equippedPerks:\[\]/);
  assert.match(game,/LOGIC\.perkLoadoutLimit\(s\.level\)/);
  assert.match(logic,/function perkLoadoutLimit\(level\)/);
  assert.doesNotMatch(game,/id="perk-loadout-title">PERK LOADOUT/);
  assert.match(game,/state\.equippedPerks\.length\}\/\$\{perkLimit\} PERKS EQUIPPED/);
  assert.match(game,/Equip a collectible below to activate its career perk/);
  assert.match(game,/function activePerkBonus\(prop\)/);
  assert.match(game,/activePerkBonus\('prestige'\)/);
  assert.match(game,/activePerkBestBonus\('healthRecoverySpeed'\)/);
  assert.match(game,/const perk=g\.category!==\'Fight Gear\'/);
  assert.doesNotMatch(styles,/\.perk-loadout-panel\{/);
  assert.match(styles,/\.perk-category-note\{/);
});

test('Gear keeps an eight-thumbnail active loadout dock above navigation',()=>{
  assert.match(html,/id="gearLoadoutDock"[^>]*hidden/);
  assert.match(html,/class="gear-loadout-label"[^>]*>ACTIVE LOADOUT</);
  assert.match(html,/id="gearLoadoutSlots"/);
  assert.match(game,/function renderGearLoadoutDock\(\)/);
  assert.match(game,/Array\.from\(\{length:4\}/);
  assert.match(game,/group\(state\.equippedGear,LOGIC\.gearLoadoutLimit\(state\.level\),'Fight Gear'\)/);
  assert.match(game,/group\(state\.equippedPerks,LOGIC\.perkLoadoutLimit\(state\.level\),'Career perk'\)/);
  assert.match(game,/<button class="gear-loadout-thumb locked"[^>]*disabled><i class="slot-lock"/);
  assert.match(styles,/\.gear-loadout-dock\{position:absolute;[^}]*bottom:calc\(76px \+ var\(--safe-bottom\)\)/);
  assert.match(styles,/\.gear-loadout-group\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(styles,/\.gear-loadout-label\{position:absolute;top:3px;left:50%;transform:translateX\(-50%\)/);
  assert.match(styles,/\.slot-lock:before\{/);
});

test('Energy Drink collectible uses the Surge Core can artwork',()=>{
  assert.match(definitions,/id:'energy-drink'[^\n]+assetExt:'png'/);
  assert.ok(fs.existsSync(path.join(root,'assets/icons/energy-drink.png')));
  assert.ok(!fs.existsSync(path.join(root,'assets/icons/energy-drink.jpg')));
});

test('corner-store Lifestyle drops include three commons and one rare with artwork',()=>{
  for(const id of ['hot-coffee','iced-coffee','tinned-sardines']){
    assert.match(definitions,new RegExp(`id:'${id}'[^\\n]+category:'Lifestyle'[^\\n]+rarity:'COMMON'`));
    assert.ok(fs.existsSync(path.join(root,`assets/icons/${id}.png`)),id);
  }
  assert.match(definitions,/id:'white-loafers'[^\n]+category:'Lifestyle'[^\n]+rarity:'RARE'/);
  assert.ok(fs.existsSync(path.join(root,'assets/icons/white-loafers.png')));
});

test('kettlebell, Smart Watch, and Dill Pickle drops use supplied artwork and balanced rarities',()=>{
  const drops=[
    ['kettle-bell','Fight Gear','COMMON'],
    ['smart-watch','Bling','RARE'],
    ['dill-pickle','Lifestyle','COMMON']
  ];
  for(const [id,category,rarity] of drops){
    assert.match(definitions,new RegExp(`id:'${id}'[^\\n]+category:'${category}'[^\\n]+rarity:'${rarity}'`));
    assert.ok(fs.existsSync(path.join(root,`assets/icons/${id}.png`)),id);
  }
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

test('Fight ladder keeps the current fighter visible but not selectable',()=>{
  assert.match(game,/function renderPlayerRankingRow\(profile,position\)/);
  assert.match(game,/class="fight-ranking-row player\$\{champion\?' champion':''\}" role="listitem"/);
  assert.match(game,/YOUR FIGHTER<\/span>/);
  assert.match(game,/NOT SELECTABLE/);
  assert.match(game,/rankedEntries\.push\(\{rank:ranking\.position,html:renderPlayerRankingRow/);
  assert.match(styles,/\.fight-ranking-row\.player\{/);
});

test('Fight ladder switches to detailed columns from its card width, not viewport width',()=>{
  assert.match(styles,/\.fight-ladder\{container-type:inline-size;container-name:fight-ladder\}/);
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
  assert.match(html,/Their wins and losses count on your professional record and streak/);
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
  assert.match(game,/tapeCountry\.innerHTML=opponentCountryBadge\(f\.o\.country\)/);
  assert.match(game,/-\$\{fightRule\('experienceRewards\.lowerLevelOpponentFollowerLossPercent',5\)\}% FOLLOWERS/);
  assert.match(game,/XP USED TODAY/);
  assert.match(styles,/\.fight-ranking-row\.circuit/);
  assert.match(styles,/\.fight-country-badge/);
  assert.match(styles,/\.fight-country-badge img\{[^}]*width:20px/);
  assert.match(styles,/\.fighter-city-badge:has\(\.fight-country-badge\)\{[^}]*border:0/);
  for(const iso of ['us','mx','ru','br','ca','ie','gb','jp','kr','ng','th','ph','cu','pr','au','pl','ge','am','co','ar','nl','ws'])assert.ok(fs.existsSync(path.join(root,`assets/flags/${iso}.svg`)),iso);
  assert.ok(!fs.existsSync(path.join(root,'assets/flags/country-flags.svg')));
  assert.match(html,/Two generated on-level Cage Circuit fighters stay at the top/);
  assert.match(readme,/Beating either Circuit fighter removes that opponent and immediately generates a fresh on-level replacement/);
});

test('real ranked fighters remain available to new Level 1 careers',()=>{
  assert.doesNotMatch(game,/!profile\.isChampion&&profile\.fights<1/);
  assert.match(game,/loadOpponentCandidates\(state\.level,20\)/);
  assert.match(game,/if\(ranked\.length\)state\.roster=/);
  assert.match(game,/Promise\.allSettled\(\[SHARED_FEED\.loadFeed/);
  assert.match(game,/if\(!profilesLoaded&&!candidatesLoaded\)throw/);
  assert.match(game,/if\(championshipResult\.status==='fulfilled'\)/);
});

test('desktop Fight layout uses a single-column navigation rail and centered details dialog',()=>{
  assert.match(styles,/@media \(min-width:1100px\)\{\.bottomnav\{grid-template-columns:1fr/);
  assert.match(styles,/\.tape-breakdown\{align-items:center;padding:24px\}/);
  assert.match(styles,/\.tape-breakdown-sheet\{width:min\(720px,calc\(100% - 48px\)\)/);
});

test('Tale of the Tape includes dynamic agent matchup advice',()=>{
  for(const id of ['tapeAgentRead','tapeAgentHeadline','tapeAgentMessage'])assert.ok(html.includes(`id="${id}"`),id);
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

test('favorite designation lives in Tale of the Tape instead of the promo poster',()=>{
  assert.match(html,/id="tapeStatsPlayerFavorite" hidden><i aria-hidden="true">★<\/i>Favorite/);
  assert.match(html,/id="tapeStatsOppFavorite" hidden><i aria-hidden="true">★<\/i>Favorite/);
  assert.match(game,/\$\('#tapeStatsPlayerFavorite'\)\.hidden=!playerFavorite/);
  assert.match(game,/\$\('#tapeStatsOppFavorite'\)\.hidden=!oppFavorite/);
  assert.match(styles,/\.tape-stats-fighters \.tape-stats-favorite\{[^}]*display:inline-flex[^}]*border:0[^}]*background:transparent[^}]*color:#e7b84d/);
  assert.match(styles,/\.tape-stats-fighters \.tape-stats-favorite i\{[^}]*color:#f2bd43/);
  assert.match(styles,/\.tape-stats-fighters \.tape-stats-favorite\[hidden\]\{display:none\}/);
});

test('Tale of the Tape makes tied attributes explicit and keeps opponent values legible',()=>{
  assert.match(game,/row\.classList\.toggle\('even',even\)/);
  assert.match(game,/row\.querySelector\('b'\)\.textContent=`\$\{label\}\$\{even\?' · TIE':''\}`/);
  assert.match(styles,/\.tape-attribute-meter\.even i\{background:#3a4658;box-shadow:none\}/);
  assert.match(styles,/\.tape-attribute-value\.even,[^{]+\{color:#9aa6b5;text-shadow:none\}/);
  assert.match(styles,/\.tape-attribute-row>\.tape-attribute-value:last-child\{color:#f9c4c1\}/);
});

test('fighter locations live in Tale of the Tape instead of the promo portraits',()=>{
  assert.match(html,/id="tapeStatsPlayerCity">CG<\/span>/);
  assert.match(html,/id="tapeStatsOppCity">CG<\/span>/);
  assert.match(game,/\$\('#tapeStatsPlayerCity'\)\.textContent=fighterCityCode\(state\.fighterCity\)/);
  assert.match(game,/const tapeCountry=\$\('#tapeStatsOppCity'\)/);
  assert.match(styles,/\.tape-stats-fighters \.tape-stats-city\{[^}]*position:static[^}]*display:inline-grid/);
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

test('service worker no longer caches removed activity code or art',()=>{
  const worker=read('service-worker.js');
  for(const token of ['underground-buzz','nav-train','nav-hustle','home-training','home-hustle','racehorse','cage-dice'])assert.doesNotMatch(worker,new RegExp(token,'i'),token);
  assert.match(worker,/fight-rules\.json/);
});

test('README documents the complete simplified architecture',()=>{
  const readme=read('README.md');
  for(const token of ['zero below the fighter\'s level, one at the same level, and two above it','5 seconds','60 seconds','Attribute Points','Follower-based sponsors','Share Win','Home, Fight, Gear, and Feed','state version 28','balanced XP curve'])assert.ok(readme.includes(token),token);
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

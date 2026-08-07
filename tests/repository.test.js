const fs = require('node:fs');
const test = require('node:test');
const assert = require('node:assert/strict');

const html = fs.readFileSync('index.html', 'utf8');
const readme = fs.readFileSync('README.md', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];

test('embedded game script parses', () => {
  assert.ok(script, 'index.html must contain an embedded script');
  assert.doesNotThrow(() => new Function(script));
});

test('DOM ids are unique', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
});

test('mobile viewport permits accessibility zoom', () => {
  const viewport = html.match(/<meta name="viewport" content="([^"]+)"/i)?.[1] || '';
  assert.doesNotMatch(viewport, /user-scalable\s*=\s*no/i);
  assert.doesNotMatch(viewport, /maximum-scale\s*=\s*1/i);
});

test('interface text never renders below 8.5px', () => {
  const fontSizes = [...html.matchAll(/font-size:\s*([\d.]+)px/g)].map(match => Number(match[1]));
  assert.ok(fontSizes.length > 0, 'expected pixel font sizes in the interface');
  assert.ok(fontSizes.every(size => size >= 8.5), `found undersized text: ${fontSizes.filter(size => size < 8.5).join(', ')}`);
});

test('daily challenge uses its independent deterministic generator', () => {
  assert.match(script, /function generateDailyOpponent\(date,tier\)/);
  const ensureDaily = script.match(/function ensureDailyChallenge\(\)\{([\s\S]*?)\n\s*\}/)?.[1] || '';
  assert.match(ensureDaily, /generateDailyOpponent\(date,state\.level\)/);
  assert.doesNotMatch(ensureDaily, /generateOpponent\(/);
});

test('save recovery and one-time league migration remain enabled', () => {
  assert.match(script, /cage-warrior-save-backup-v1/);
  assert.match(script, /const bootstrapPast=!state\.leagueInitialized&&state\.roster\.length===0/);
  assert.match(script, /state\.leagueInitialized=true/);
});

test('rematch and exhausted-gig states reflect actual state without masking locks', () => {
  assert.match(script, /const hasHistory=\(o\.meetings\|\|0\)>0/);
  assert.match(script, /hasHistory\?`Current level \$\{o\.tier\} · revenge rematch payout/);
  assert.match(script, /:'SEE MATCHUP'/);
  assert.match(script, /rematch=available&&\(o\.winsVsPlayer\|\|0\)>0&&!declined/);
  assert.match(script, /\$\{rematch\?'<span class="rematch-banner">⚡ REMATCH<\/span>':''\}/);
  assert.match(script, /aria-label="\$\{o\.name\} fighter card\$\{rematch\?', rematch available':''\}/);
  assert.match(html, /\.rematch-banner\{[^}]*left:7px;right:7px;bottom:8px[^}]*font-size:8\.5px/);
  assert.match(script, /limited&&unlocked\?'gig-unavailable'/);
  assert.match(script, /availability=!unlocked\?requirementText\(a\):limited\?'NO GIGS LEFT'/);
  assert.doesNotMatch(html, /\.action\.future\.gig-unavailable:after/);
});

test('opponents have pro records, conditional H2H, and consent-aware rematches', () => {
  assert.match(script, /function payoutForOpponent\(o\).*o\.tier>=state\.level\?1:\.5/);
  assert.match(script, /recordInitialized:true/);
  assert.match(script, /<span class="opp-record">PRO \$\{o\.wins\}-\$\{o\.losses\}<\/span>/);
  assert.match(script, /hasHistory\?`<div class="opp-history">H2H YOU \$\{o\.lossesToPlayer\|\|0\}-\$\{o\.winsVsPlayer\|\|0\}<\/div>`:'<div class="opp-history">NO HEAD-TO-HEAD HISTORY<\/div>'/);
  assert.doesNotMatch(script, /<h3>\$\{o\.name\}<\/h3><p>\$\{o\.tag\}<\/p>/);
  assert.match(script, /declined=!o\.championship&&available&&\(o\.lossesToPlayer\|\|0\)>0/);
  assert.match(script, /DECLINED<br><small>YOU WON<\/small>/);
  assert.match(script, /cash=Math\.round\(basePurse/);
});

test('career identity includes a permanent hometown and a fight-earned title ladder', () => {
  for (const city of ['PHOENIX', 'LOS ANGELES', 'CHICAGO', 'NEW YORK', 'MIAMI', 'HOUSTON', 'CLEVELAND']) {
    assert.match(script, new RegExp(`name:'${city}'`));
  }
  for (const region of ['SOUTHWEST', 'WEST COAST', 'MIDWEST', 'NORTHEAST', 'SOUTHEAST', 'GULF COAST', 'GREAT LAKES']) {
    assert.match(script, new RegExp(`region:'${region}'`));
  }
  assert.match(html, /Fighting Out Of/);
  assert.match(script, /function chooseCity\(id\)/);
  assert.match(script, /function generateTitleChampion\(m\)/);
  assert.match(script, /championship:true,titleId:m\.id/);
  assert.match(script, /function awardTitle\(o\).*o&&o\.championship/);
  assert.match(script, /const titleWon=awardTitle\(o\)/);
  assert.doesNotMatch(script, /awardMilestones/);
  assert.match(script, /s\.milestones\.includes\('district'\).*s\.milestones\.push\('city'\)/);
  assert.match(script, /s\.milestones\.includes\('national'\).*s\.milestones\.push\('city','regional','us'\)/);
  assert.match(script, /s\.milestones\.includes\('world'\).*s\.milestones\.push\('city','regional','us'\)/);
  const normalize = script.match(/function normalizeState\(parsed\)\{([\s\S]*?)\n\s*\}/)?.[1] || '';
  assert.doesNotMatch(normalize, /fighterCities/);
  const careerRender = script.match(/function renderCareer\(\)\{([\s\S]*?)\n\s*\}/)?.[1] || '';
  assert.doesNotMatch(careerRender, /LVL/);
  assert.match(readme, /belt is awarded only after that fighter is defeated/);
});

test('career opponent roster uses proportional two-across collectible fighter cards', () => {
  assert.match(html, /\.opponent-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(html, /\.opponent\{[^}]*aspect-ratio:2\/3/);
  assert.match(html, /\.opp-sprite\{[^}]*aspect-ratio:3\/5[^}]*background-size:500% 200%/);
  assert.match(html, /Career Opponents/);
  assert.doesNotMatch(html, /The Living Roster/);
  assert.match(script, /<article class="opponent \$\{status\} \$\{o\.championship\?'champion':''\} \$\{rematch\?'rematch':''\}" data-card-flip="true"/);
  assert.match(html, /\.opponent-flip\{[^}]*transform-style:preserve-3d/);
  assert.match(html, /\.opponent\.flipped \.opponent-flip\{transform:rotateY\(180deg\)\}/);
  assert.match(script, /class="opponent-side opponent-front"/);
  assert.match(script, /class="opponent-side opponent-back"/);
  assert.match(script, /TAP CARD FOR DETAILS/);
  assert.match(script, /TAP CARD TO RETURN/);
  assert.match(script, /function toggleOpponentCard\(card\)/);
  assert.match(script, /front\.setAttribute\('aria-hidden',String\(flipped\)\)/);
  assert.match(script, /button\.tabIndex=flipped\?-1:0/);
  assert.match(script, /flip&&!e\.target\.closest\('button'\)/);
  assert.match(script, /data-card-flip.*e\.key==='Enter'/s);
  assert.match(script, /\['title','TITLE FIGHTS','BEAT THE CHAMPION · WIN THE BELT'\]/);
  assert.match(script, /:'SEE MATCHUP'/);
  assert.match(script, /past=state\.roster\.filter\(o=>opponentState\(o\)==='passed'&&\(o\.lossesToPlayer\|\|0\)===0\)/);
  assert.match(script, /const openRosterGroups = new Set\(\['current'\]\)/);
  assert.match(script, /data-roster-toggle="\$\{status\}" aria-expanded="\$\{expanded\}"/);
  assert.match(script, /function toggleRosterGroup\(button\)/);
  assert.match(script, /grid\.hidden=!next/);
  assert.match(script, /rosterToggle=e\.target\.closest\('\[data-roster-toggle\]'\)/);
  assert.match(html, /\.opponent-grid\[hidden\]\{display:none\}/);
});

test('career fights use a reversible tale-of-the-tape preview and a two-choice round-one opening', () => {
  assert.match(html, /id="tapePurse"/);
  assert.match(html, /class="tape-fighter-card player-card"/);
  assert.match(html, /class="tape-fighter-card opponent-card"/);
  assert.match(html, /class="tape-energy">⚡ 15 ENERGY REQUIRED/);
  assert.match(html, /id="tapeBackBtn"[^>]*>GO BACK</);
  assert.match(html, /id="tapeFightBtn"[^>]*>FIGHT!<\/button>/);
  assert.match(script, /function openTaleOfTape\(o\)/);
  assert.match(script, /function closeFightPreview\(\)/);
  assert.match(script, /function commitFight\(o=fight\?\.o\)/);
  const preview = script.match(/function openTaleOfTape\(o\)\{([\s\S]*?)\n\s*\}/)?.[1] || '';
  assert.doesNotMatch(preview, /spendEnergy|pendingFight/);
  assert.match(html, /data-opening-approach="aggressive"/);
  assert.match(html, /data-opening-approach="feel"/);
  assert.doesNotMatch(html, /id="openingPlanGrid"/);
  assert.doesNotMatch(html, /id="tapeOppTag"/);
  assert.doesNotMatch(script, /\$\{rivalry\?'🔥 RIVAL · ':''\}\$\{o\.tag\}/);
  assert.doesNotMatch(script, /\$\{o\.tag\} · PRO \$\{o\.wins\}-\$\{o\.losses\}/);
  assert.match(script, /const signature=state\.fighterStyle\|\|'pressure';fight\.openingApproach=approach;fight\.deepRead=approach==='feel';simulateRound\(fight,1,signature,\{mode:approach\}\);fight\.tendencyRevealed=true/);
  assert.match(script, /openingInitiative=round===1&&opening\?\.mode==='aggressive'\?\.08:round===1&&opening\?\.mode==='feel'\?-\.07:0/);
  assert.match(script, /function renderCornerPlans\(container,nextRound\)/);
  assert.match(script, /sameStyle\?\[signature\]:\[signature,opponentStyle\]/);
  assert.match(script, /`STICK WITH \$\{plan\.name\}`/);
  assert.match(script, /`FIGHT AS \$\{plan\.name\}`/);
  assert.match(script, /START ROUND \$\{nextRound\}/);
  assert.doesNotMatch(script, /renderPlanGrid/);
  assert.match(script, /class="corner-style-options"/);
  assert.match(script, /class="plan-btn \$\{isSignature\?'signature':'mirror'\}"[^>]*>\$\{label\}<\/button>/);
  assert.match(html, /\.plan-grid\{display:grid;grid-template-columns:1fr;gap:7px\}/);
  assert.match(script, /TENDENCY REVEALED/);
  assert.match(script, /DEEP READ/);
  assert.doesNotMatch(html, /id="skipBtn"/);
  assert.doesNotMatch(script, /function skipFight\(\)/);
  assert.doesNotMatch(script, /fight\.rounds\.length<3\)simulateRound/);
});

test('gear collection shows owned quantities and rarity above icons', () => {
  assert.match(script, /owned=gearItems\.filter\(g=>gearCount\(g\.id\)>0\)/);
  assert.match(html, /\.gear\.collectible-card\{[^}]*aspect-ratio:2\/3[^}]*grid-template-rows:/);
  assert.match(html, /\.gear-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(script, /rarity-card-\$\{rarity\.toLowerCase\(\)\}/);
  assert.match(script, /<div class="gear-hero"><span class="gear-flair"><\/span><span class="equip-burst"><\/span><div class="gear-icon">/);
  for (const rarity of ['common', 'rare', 'epic', 'legendary']) assert.match(html, new RegExp(`\\.rarity-${rarity}\\{`));
});

test('permanent identity onboarding gates the career and removes completed selectors', () => {
  const homeStart = html.indexOf('<section class="screen active" data-screen="home">');
  const trainStart = html.indexOf('<section class="screen" data-screen="train">');
  for (const id of ['careerIdentityCard', 'archetypeSetup', 'citySetup', 'careerGameContent']) {
    const position = html.indexOf(`id="${id}"`);
    assert.ok(position > homeStart && position < trainStart, `${id} should be on the Home screen`);
  }
  assert.match(html, /#app\.career-setup #careerGameContent,#app\.career-setup \.career-after-setup\{display:none\}/);
  assert.match(html, /#app\.career-setup \.resource-hud,#app\.career-setup \.bottomnav\{display:none\}/);
  assert.match(script, /\$\('#app'\)\.classList\.toggle\('career-setup',!ready\)/);
  assert.match(script, /\$\('#archetypeSetup'\)\.hidden=!!style/);
  assert.match(script, /\$\('#citySetup'\)\.hidden=!!city/);
  assert.match(script, /\$\('#buildChoices'\)\.innerHTML=style\?'':fighterStyles\.map/);
  assert.match(script, /\$\('#cityChoices'\)\.innerHTML=city\?'':fighterCities\.map/);
  assert.match(script, /if\(!\(state\.fighterStyle&&state\.fighterCity\)\)screen='home'/);
});

test('fighter attributes share the persistent condition HUD across game screens', () => {
  assert.match(html, /\.hud-attributes-row\{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(html, /<section class="resource-hud" aria-label="Current fighter condition and attributes">[\s\S]*class="hud-condition-row"[\s\S]*class="hud-attributes-row"/);
  const hudStart = html.indexOf('<section class="resource-hud"');
  const mainStart = html.indexOf('<main class="main">');
  for (const id of ['powerStat', 'speedStat', 'chinStat', 'cardioStat']) {
    const position = html.indexOf(`id="${id}"`);
    assert.ok(position > hudStart && position < mainStart, `${id} should live in the persistent HUD`);
  }
  assert.match(html, /\.main\{[^}]*top:calc\(150px \+ var\(--safe-top\)\)/);
  assert.match(html, /#app\.career-setup \.resource-hud,#app\.career-setup \.bottomnav\{display:none\}/);
  assert.doesNotMatch(html, /homeAttributes|trainStatGrid/);
});

test('XP and Hype live in the top bar without a duplicate Home resource card', () => {
  const headerStart = html.indexOf('<header class="topbar">');
  const headerEnd = html.indexOf('</header>', headerStart);
  for (const id of ['xpText', 'hypeText']) {
    const position = html.indexOf(`id="${id}"`);
    assert.ok(position > headerStart && position < headerEnd, `${id} should live in the top bar`);
  }
  assert.match(html, /id="rankText"[^>]*>UNRANKED<\/span><\/div><div class="top-progress"><span>XP<\/span><b id="xpText"/);
  assert.match(html, /id="fansText"[^>]*>0<\/span> FANS<\/small><div class="top-progress"><span>HYPE<\/span><b id="hypeText"/);
  assert.doesNotMatch(html, /card bars|id="energyBar"|id="healthBar"|id="xpBar"|id="hypeBar"/);
  assert.doesNotMatch(script, /\$\('#(?:energy|health|xp|hype)Bar'\)/);
});

test('equipping fight gear triggers the collectible-card burst before rerendering', () => {
  assert.match(html, /\.gear\.equip-bursting\{animation:equipCardBurst/);
  assert.match(html, /@keyframes equipRays/);
  assert.match(script, /toggleEquip\(eq\.dataset\.equip,eq\)/);
  assert.match(script, /card\.classList\.add\('equip-bursting'\)/);
  assert.match(script, /setTimeout\(updateUI,680\)/);
});

test('cash pays the scaling coach fee while career earnings remain cumulative', () => {
  assert.match(html, /id="careerEarningsText"/);
  assert.match(script, /function coachFee\(\)\{return 35\+state\.level\*20\}/);
  assert.match(script, /coachCost=coach\?fee\*a\.sessions:0/);
  assert.match(script, /state\.cash-=fee/);
  assert.match(script, /function receiveMoney\(amount,career=false\)/);
  assert.match(script, /receiveMoney\(cash,true\)/);
  assert.match(script, /receiveMoney\(cash\);gainXp\(a\.xp\).*shifts left/);
  assert.match(script, /s\.careerEarnings=Number\.isFinite\(savedCareerEarnings\).*:s\.cash/);
});

test('level ups receive a dedicated promotion celebration', () => {
  assert.match(html, /id="levelUpModal"/);
  assert.match(html, /CAREER BREAKTHROUGH/);
  assert.match(html, /id="levelUpEnergy"/);
  assert.match(html, /id="levelUpHealth"/);
  assert.match(html, /id="levelUpCash"/);
  assert.match(html, /\.level-up-overlay\.active\{display:flex\}/);
  assert.match(script, /function showLevelUp\(summary\)/);
  assert.match(script, /levelUpSummary=\{fromLevel:previous\?\.fromLevel\|\|startingLevel,toLevel:state\.level,earningsBonus:/);
  assert.match(script, /newTitles=milestoneDefs\.filter/);
  assert.match(script, /modal\._burstTimer=setTimeout\(confettiBurst,620\)/);
  assert.match(script, /function closeLevelUp\(\)/);
  assert.match(script, /\$\('#levelUpContinue'\)\.addEventListener\('click',closeLevelUp\)/);
});

test('gear is deterministic win loot with pity, title rarity, and non-stacking duplicates', () => {
  assert.match(script, /function awardDeterministicGearDrop/);
  assert.match(script, /seededRandom\(hashSeed\(`\$\{state\.gearSeed\}\|\$\{state\.wins\}\|\$\{opponent\.key\}\|\$\{state\.level\}\|gear-v1`\)\)/);
  assert.match(script, /if\(level<=3\)return \[80,18,2,0\]/);
  assert.match(script, /if\(level<=6\)return \[62,29,8,1\]/);
  assert.match(script, /if\(level<=10\)return \[45,36,16,3\]/);
  assert.match(script, /return \[30,40,23,7\]/);
  assert.match(script, /chance=Math\.min\(\.75,\.25\+\(upset\?\.10:0\)\+\(rivalry\?\.10:0\)\+\(opponent\.daily\?\.10:0\)\+\(ko\?\.05:0\)\)/);
  assert.match(script, /gearWinsSinceDrop>=4/);
  assert.match(script, /minRarity=titleWon\?'RARE':'COMMON'/);
  assert.match(script, /state\.gearCounts\[item\.id\]=gearCount\(item\.id\)\+1/);
  assert.match(script, /function ownedBonus\(prop\)\{return state\.gear\.reduce/);
  assert.doesNotMatch(script, /data-buy|function buyGear|function openCrate|Mystery Gear Crate/);
  assert.doesNotMatch(script, /price:\d/);
});

test('daily drop guarantees a deterministic collectible without resetting fight pity', () => {
  const dailyCollectible = script.match(/function awardDailyCollectible\(date\)\{([\s\S]*?)\r?\n\s*\}\r?\n\s*function ensureDailyCounters/)?.[1] || '';
  assert.match(dailyCollectible, /daily-collectible-v1/);
  assert.match(dailyCollectible, /state\.gearCounts\[item\.id\]=gearCount\(item\.id\)\+1/);
  assert.doesNotMatch(dailyCollectible, /gearWinsSinceDrop/);
  assert.match(script, /gearDrop=awardDailyCollectible\(today\)/);
  assert.match(script, /COLLECTIBLE CARD READY/);
  assert.match(script, /rewardXpLabel'\)\.textContent='Collectible'/);
  assert.match(readme, /Daily Drop awards Cash, energy, and one deterministic/);
});

test('fight result action celebrates wins without labeling losses as reward claims', () => {
  assert.match(script, /\$\('#continueBtn'\)\.textContent=win\?'CLAIM REWARDS':'CONTINUE'/);
  assert.match(script, /function handleResultAction\(\)\{if\(revealGearDrop\(\)\)return;closeResult\(\)\}/);
  assert.match(script, /BONUS GEAR DROP READY/);
  assert.match(script, /drop-icon/);
});

test('fighters, opponents, and round plans share the seven MMA archetypes', () => {
  assert.match(html, /Fighter Archetype/);
  assert.match(html, /Choose Your Fighter Archetype/);
  for (const id of ['pressure', 'counter', 'brawler', 'trickster', 'control', 'submission', 'wrestleBox']) {
    assert.match(script, new RegExp(`id:'${id}'`));
  }
  for (const name of ['PRESSURE FIGHTER', 'COUNTER-STRIKER', 'BRAWLER', 'TRICKSTER', 'CONTROL GRAPPLER', 'SUBMISSION HUNTER', 'WRESTLE-BOXER']) {
    assert.match(script, new RegExp(name));
  }
  assert.match(script, /archetype:arch\.id,tendency:arch\.tendency/);
  assert.match(script, /function normalizeOpponentArchetype\(o\)/);
  assert.match(script, /const legacy=\{wrestle:'control',wrestler:'control',tank:'brawler',cardio:'pressure'\}/);
  assert.match(script, /const legacyStyle=\{technician:'counter',grappler:'control',endurance:'pressure'\}/);
  assert.match(script, /\['pressure','counter','brawler','trickster','control','submission','wrestleBox'\]\.includes\(s\.fighterStyle\)/);
  assert.match(readme, /seven permanent MMA archetypes/);
});

test('round strategy combines matchup and player proficiency', () => {
  assert.match(script, /function planFamiliarity\(styleId,planId\)/);
  assert.match(script, /if\(styleId===planId\)return \.10/);
  assert.match(script, /grappling\.includes\(planId\)\?-\.11/);
  assert.match(script, /striking\.includes\(planId\)\?-\.09/);
  assert.match(script, /function matchupEdge\(planId,opponentId\)/);
  assert.match(script, /matchupEdge\(planId,tendency\)\+planFamiliarity\(state\.fighterStyle,planId\)/);
  assert.match(script, /class="plan-badge signature">YOUR SIGNATURE/);
  assert.match(script, /class="plan-badge unfamiliar">THEIR STYLE/);
  assert.match(script, /class="plan-badge good">TACTICAL EDGE/);
  assert.match(script, /class="plan-badge risky">TACTICAL RISK/);
  assert.match(script, /function techniqueFor\(archetype,roll\)/);
});

test('submission hunters can produce tap-out finishes', () => {
  assert.match(script, /landed&&type==='takedown'&&attackingStyle==='submission'/);
  assert.match(script, /signatureBoost=side==='player'&&state\.fighterStyle==='submission'\?\.05:0/);
  assert.match(script, /sim\.method='SUBMISSION'/);
  assert.match(script, /TAP!/);
  assert.match(script, /SUBMISSION WIN!/);
  assert.match(script, /SUBMITTED\./);
  assert.match(readme, /finish a fight by tap/);
});

test('low-condition corner crisis offers towel or last-chance haymaker outcomes', () => {
  assert.match(script, /crisisThreshold=25/);
  assert.match(script, /fight\.playerCondition<=crisisThreshold&&!fight\.crisisUsed/);
  assert.match(script, /data-crisis="towel"/);
  assert.match(script, /data-crisis="haymaker"/);
  assert.match(script, /function haymakerChance\(sim\).*\.20,\.68/);
  assert.match(script, /fight\.cornerTowel=true;fight\.winner='opp';fight\.method='TKO'/);
  assert.match(script, /fight\.haymakerMiss=true;fight\.playerCondition=0;fight\.winner='opp';fight\.method='KO'/);
  assert.match(script, /simulateRound\(fight,next,'pressure',\{damage\}\)/);
  assert.match(script, /HAYMAKER LANDS!/);
  assert.match(script, /Miss and you are knocked out/);
  assert.doesNotMatch(script, /skipBtn/);
  assert.match(html, /\.corner-panel\.crisis-panel\{/);
  assert.match(readme, /Throwing in the towel gives the opponent a TKO win/);
});

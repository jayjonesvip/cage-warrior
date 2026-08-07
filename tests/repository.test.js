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

test('daily contract and seeded challenge are removed while the daily drop remains', () => {
  assert.doesNotMatch(html, /Daily Contract|Daily Seeded Challenge/i);
  assert.doesNotMatch(script, /generateDailyOpponent|ensureDailyChallenge|dailyChallenge|dailyObjective|updateObjectiveFromFight/);
  assert.match(html, /Daily Drop/);
});

test('save recovery and one-time league migration remain enabled', () => {
  assert.match(script, /cage-warrior-save-backup-v1/);
  assert.match(script, /const bootstrapPast=!state\.leagueInitialized&&state\.roster\.length===0/);
  assert.match(script, /state\.leagueInitialized=true/);
  const avatarsReady = script.indexOf("const fighterAvatars = [");
  const stateLoaded = script.indexOf('state = loadState();');
  assert.ok(avatarsReady >= 0 && stateLoaded > avatarsReady, 'saved state must load only after avatar migration data is initialized');
  assert.doesNotMatch(script, /let state = loadState\(\)/);
  assert.match(script, /if\(primary&&blank\(primary\)&&backup&&!blank\(backup\)\)return backup/);
});

test('rematch, taunt, and exhausted-gig states reflect actual state without masking locks', () => {
  assert.match(script, /const hasHistory=\(o\.meetings\|\|0\)>0/);
  assert.match(script, /hasHistory\?`Current level \$\{o\.tier\} · rematch payout/);
  assert.match(script, /:'SEE MATCHUP'/);
  assert.match(script, /rematch=available&&\(o\.winsVsPlayer\|\|0\)>0/);
  assert.match(script, /gameIcon\('rematch','⚡'\).*REMATCH/);
  assert.match(script, /rematch available':tauntable\?', taunt available'/);
  assert.match(script, /data-taunt-key="\$\{o\.key\}"/);
  assert.match(script, /function tauntOpponent\(key\)/);
  assert.match(html, /\.rematch-banner\{[^}]*left:7px;right:7px;bottom:8px[^}]*font-size:8\.5px/);
  assert.match(script, /limited&&unlocked\?'gig-unavailable'/);
  assert.match(script, /availability=!unlocked\?requirementText\(a\):limited\?'NO GIGS LEFT'/);
  assert.doesNotMatch(html, /\.action\.future\.gig-unavailable:after/);
});

test('opponents have pro records, persistent rival history, and consent-aware rematches', () => {
  assert.match(script, /function payoutForOpponent\(o\).*o\.lossesToPlayer.*o\.tier>=state\.level.*\?1:\.5/);
  assert.match(script, /recordInitialized:true/);
  assert.match(script, /<span class="opp-record">PRO \$\{o\.wins\}-\$\{o\.losses\}<\/span>/);
  assert.match(script, /hasHistory\?`<div class="opp-history">H2H YOU \$\{o\.lossesToPlayer\|\|0\}-\$\{o\.winsVsPlayer\|\|0\}<\/div>`:'<div class="opp-history">NO HEAD-TO-HEAD HISTORY<\/div>'/);
  assert.doesNotMatch(script, /<h3>\$\{o\.name\}<\/h3><p>\$\{o\.tag\}<\/p>/);
  assert.match(script, /function opponentGroup\(o\).*\(o\.lossesToPlayer\|\|0\)>0\?'rival'/);
  assert.match(script, /function opponentAvailable\(o\)/);
  assert.match(script, /TAUNT<br><small>FOR REMATCH<\/small>/);
  assert.match(script, /o\.rematchAccepted=false/);
  assert.match(script, /o\.rematchAccepted=true/);
  assert.doesNotMatch(script, /lossesToPlayer>=o\.retireAt/);
  assert.doesNotMatch(script, /RETIRES AFTER/);
  assert.match(script, /cash=Math\.round\(basePurse/);
});

test('generated fighters draw from broad independently mixed name pools', () => {
  const firstPool = script.match(/const firstNames=\[([^\]]+)\]/)?.[1] || '';
  const lastPool = script.match(/const lastNames=\[([^\]]+)\]/)?.[1] || '';
  const firstNames = [...firstPool.matchAll(/'([^']+)'/g)].map(match => match[1]);
  const lastNames = [...lastPool.matchAll(/'([^']+)'/g)].map(match => match[1]);
  assert.ok(firstNames.length >= 50);
  assert.ok(lastNames.length >= 50);
  for (const name of ['GARCIA', 'JONES', 'IVANOV', 'PETROV', 'SMIRNOV', 'VOLKOV', 'KUZNETSOV']) assert.ok(lastNames.includes(name));
  assert.match(script, /rosterPick\(firstNames,hashSeed\(`first\|\$\{seed\}`\)\)/);
  assert.match(script, /rosterPick\(lastNames,hashSeed\(`last\|\$\{seed\}`\)\)/);
  assert.doesNotMatch(script, /rosterPick\(lastNames,seed\*5\+11\)/);
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
  assert.match(script, /titleWon=awardTitle\(o\)/);
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

test('career identity shows followers and fighter renaming unlocks from the top bar', () => {
  assert.match(html, /<small>Followers<\/small><b id="careerFollowersText">0<\/b>/);
  assert.doesNotMatch(html, /id="homeFighterNameText"|career-name-display/);
  assert.match(html, /class="identity-name-row"[\s\S]*id="editFighterNameBtn"[^>]*aria-disabled="true"/);
  assert.match(html, /data-icon-name="edit-fighter-name"/);
  assert.match(html, /id="fighterNameModal"[^>]*aria-hidden="true"/);
  assert.match(html, /id="fighterNameInput"[^>]*minlength="2"[^>]*maxlength="24"/);
  assert.match(script, /function normalizeFighterName\(value\)/);
  assert.match(script, /s\.name=normalizeFighterName\(s\.name\)\|\|defaultState\.name/);
  assert.match(script, /function openFighterNameModal\(\)\{if\(state\.level<2\)/);
  assert.match(script, /NAME EDITING UNLOCKS AT LVL 2/);
  assert.match(script, /state\.name=name;closeFighterNameModal\(\)/);
  assert.match(script, /nameButton\.classList\.toggle\('locked',!nameUnlocked\)/);
  assert.match(script, /\$\('#careerFollowersText'\)\.textContent=fmt\(state\.fans\)/);
  assert.match(readme, /naming modal\s+unlocks at level 2/);
});

test('career opponent roster uses proportional two-across collectible fighter cards', () => {
  assert.match(html, /\.opponent-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(html, /\.opponent\{[^}]*aspect-ratio:2\/3/);
  assert.match(html, /\.opp-sprite\{[^}]*width:100%;height:100%;object-fit:contain;object-position:center bottom/);
  assert.match(script, /const fighterSilhouettes=Array\.from\(\{length:14\},\(_,i\)=>`assets\/fighter-silhouette-\$\{i\+1\}\.png`\)/);
  assert.match(script, /function silhouetteForOpponent\(o\)/);
  assert.match(script, /<img class="opp-sprite" src="\$\{silhouette\}"/);
  assert.match(script, /\$\('#tapeOppSprite'\)\.src=silhouetteForOpponent\(f\.o\)/);
  assert.doesNotMatch(script, /background-image:url\(\$\{silhouetteSheet\}\)/);
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
  assert.match(script, /rivals=state\.roster\.filter\(o=>opponentGroup\(o\)==='rival'\)/);
  assert.match(script, /\['rival','PAST RIVALS','TAUNT THEM INTO A REMATCH'\]/);
  assert.match(script, /active=state\.roster\.filter\(o=>o\.tier===tier&&!o\.championship&&\(o\.lossesToPlayer\|\|0\)===0\)/);
  assert.match(script, /if\(!o\.championship\)ensureRoster\(\)/);
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
  assert.match(html, /class="tape-energy">15 ENERGY REQUIRED/);
  assert.match(html, /id="tapeBackBtn"[^>]*>GO BACK</);
  assert.match(html, /id="tapeFightBtn"[^>]*>FIGHT!<\/button>/);
  assert.match(script, /function openTaleOfTape\(o\)/);
  assert.match(script, /function closeFightPreview\(\)/);
  assert.match(script, /function commitFight\(o=fight\?\.o\)/);
  const preview = script.match(/function openTaleOfTape\(o\)\{([\s\S]*?)\n\s*\}/)?.[1] || '';
  assert.doesNotMatch(preview, /spendEnergy|pendingFight/);
  assert.match(html, /data-opening-approach="aggressive"/);
  assert.match(html, /data-opening-approach="feel"/);
  assert.match(html, /\.opening-choice\{min-height:158px/);
  assert.match(html, /\.opening-choice \.opening-icon\{[^}]*font-size:52px/);
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
  for (const id of ['careerIdentityCard', 'citySetup', 'fighterSetup', 'archetypeSetup', 'careerGameContent']) {
    const position = html.indexOf(`id="${id}"`);
    assert.ok(position > homeStart && position < trainStart, `${id} should be on the Home screen`);
  }
  assert.match(html, /#app\.career-setup #careerGameContent,#app\.career-setup \.career-after-setup\{display:none\}/);
  assert.match(html, /#app\.career-setup \.resource-hud,#app\.career-setup \.bottomnav\{display:none\}/);
  assert.match(script, /\$\('#app'\)\.classList\.toggle\('career-setup',!ready\)/);
  assert.match(script, /\$\('#fighterSetup'\)\.hidden=!city\|\|!!avatar/);
  assert.match(script, /\$\('#archetypeSetup'\)\.hidden=!city\|\|!avatar\|\|!!style/);
  assert.match(script, /\$\('#citySetup'\)\.hidden=!!city/);
  assert.match(script, /\$\('#buildChoices'\)\.innerHTML=style\?'':fighterStyles\.map/);
  assert.match(script, /\$\('#cityChoices'\)\.innerHTML=city\?'':fighterCities\.map/);
  assert.match(script, /function chooseAvatar\(id\)/);
  assert.match(script, /if\(!\(state\.fighterStyle&&state\.fighterCity&&state\.fighterAvatar&&validFighterAllocation\(state\.fighterBaseStats\)\)\)screen='home'/);
});

test('fighter avatar cards enforce a valid permanent 20-point allocation', () => {
  const avatarSource = script.match(/const fighterAvatars = (\[[\s\S]*?\n\s*\]);/)?.[1];
  assert.ok(avatarSource, 'fighter avatar definitions should be present');
  const avatars = new Function(`return ${avatarSource}`)();
  assert.equal(avatars.length, 20);
  assert.equal(new Set(avatars.map(avatar => avatar.asset)).size, 20);
  for (const avatar of avatars) {
    const values = ['power', 'speed', 'chin', 'cardio'].map(key => avatar.stats[key]);
    assert.ok(values.every(value => Number.isInteger(value) && value >= 2 && value <= 8));
    assert.equal(values.reduce((sum, value) => sum + value, 0), 20);
    assert.ok(fs.existsSync(avatar.asset), `${avatar.asset} should exist`);
  }
  assert.match(html, /\.avatar-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(html, /\.avatar-card\{[^}]*aspect-ratio:2\/3/);
  assert.match(script, /function validFighterAllocation\(stats\)/);
  assert.match(script, /every\(k=>Number\.isInteger\(stats\[k\]\)&&stats\[k\]>=2&&stats\[k\]<=8\)/);
  assert.match(script, /===20/);
  assert.equal(fs.readdirSync('assets').filter(name => /^fighter-avatar-\d{2}\.jpg$/.test(name)).length, 20);
  assert.equal(fs.readdirSync('assets').filter(name => /^fighter-silhouette-\d+\.png$/.test(name)).length, 14);
  assert.equal(fs.readdirSync('assets').filter(name => /^grok_image_/i.test(name)).length, 0);
  assert.match(script, /<span class="avatar-total">SELECT<\/span>/);
  assert.doesNotMatch(script, /SELECT · 20 POINTS/);
});

test('home career choices use artwork cards with explicit bottom actions', () => {
  assert.ok(fs.existsSync('assets/home-fight.png'));
  assert.ok(fs.existsSync('assets/home-training.png'));
  assert.ok(fs.existsSync('assets/home-hustle.png'));
  assert.ok(fs.existsSync('assets/home-gear.png'));
  assert.match(html, /<article class="choice red"><h3>BIG WIN POTENTIAL<\/h3>[\s\S]*?src="assets\/home-fight\.png"[\s\S]*?<button class="choice-action" data-go="fight">TAKE A FIGHT<\/button><\/article>/);
  assert.match(html, /<article class="choice"><h3>GUARANTEED GROWTH<\/h3>[\s\S]*?src="assets\/home-training\.png"[\s\S]*?<button class="choice-action" data-go="train">HIT THE GYM<\/button><\/article>/);
  assert.match(html, /<article class="choice hustle"><h3>FUND THE DREAM<\/h3>[\s\S]*?src="assets\/home-hustle\.png"[\s\S]*?<button class="choice-action" data-go="hustle">HUSTLE<\/button><\/article>/);
  assert.match(html, /<article class="choice gear"><h3>BUILD YOUR LEGACY<\/h3>[\s\S]*?src="assets\/home-gear\.png"[\s\S]*?<button class="choice-action" data-go="gear">VIEW GEAR<\/button><\/article>/);
  assert.doesNotMatch(html, /<button class="choice(?:\s|")/);
  assert.doesNotMatch(html, /class="bigicon"/);
  assert.match(html, /\.choice-action\{[^}]*margin-top:auto/);
});

test('rendered icons support stable per-file PNG overrides with fallbacks', () => {
  assert.ok(fs.existsSync('assets/icons/README.md'));
  assert.match(script, /const ICON_ASSET_PATH = 'assets\/icons\/'/);
  assert.match(script, /function gameIcon\(name,fallback\)/);
  assert.match(script, /src="\$\{ICON_ASSET_PATH\}\$\{name\}\.png"/);
  assert.match(script, /classList\.add\('asset-ready'\)/);
  assert.match(script, /onerror="this\.remove\(\)"/);
  assert.match(script, /gameIcon\(a\.id,a\.icon\)/);
  assert.match(script, /gameIcon\(d\.id,d\.icon\)/);
  assert.match(script, /gameIcon\(g\.id,g\.icon\)/);
  assert.match(script, /gameIcon\(item\.id,item\.icon\)/);
  const catalog = fs.readFileSync('assets/icons/README.md', 'utf8');
  for (const name of ['nav-home', 'fight-aggressive', 'rematch', 'corner-towel', 'daily-collectible', 'title-world', 'heavy-bag-rounds', 'call-out-rival', 'tv-spot', 'titan-global', 'champ-gloves', 'ice-ring', 'home-gym', 'mansion']) {
    assert.match(catalog, new RegExp('`' + name + '\\.png`'));
  }
  assert.doesNotMatch(html, /data-icon-name="hud-(?:energy|health)"/);
  assert.doesNotMatch(catalog, /`hud-(?:energy|health)\.png`/);
});

test('home ticker teaches current mechanics in a shady promoter voice', () => {
  const homeStart = html.indexOf('<section class="screen active" data-screen="home">');
  const tickerPosition = html.indexOf('id="tickerText"');
  const identityPosition = html.indexOf('id="careerIdentityCard"');
  const heroPosition = html.indexOf('<div class="hero">', homeStart);
  assert.ok(tickerPosition > homeStart && tickerPosition < identityPosition && tickerPosition < heroPosition, 'ticker should lead the unlocked Home screen');
  assert.match(html.slice(homeStart, identityPosition), /class="card career-after-setup"/);
  const ticker = script.match(/const tickerLines=\[([\s\S]*?)\];let ti=0/)?.[1] || '';
  assert.match(ticker, /fight burns 15 energy/);
  assert.match(ticker, /20 health before a bout/);
  assert.match(ticker, /Old names pay half/);
  assert.match(ticker, /Taunt a past rival/);
  assert.match(ticker, /Fourth win without a gear drop/);
  assert.match(ticker, /perk still only counts once/);
  assert.match(ticker, /\$35 plus \$20 per level/);
  assert.match(ticker, /Nobody mails you a belt/);
  assert.ok((ticker.match(/'/g) || []).length >= 30, 'expected at least 15 rotating promoter tips');
  assert.doesNotMatch(ticker, /Rumor: the main event pays double under the table/);
});

test('archetype presentation uses clean text labels without decorative icons', () => {
  assert.match(script, /<b>\$\{s\.name\}<\/b>/);
  assert.match(script, /\$\('#homeStyleText'\)\.textContent=style\?style\.name:'NOT SELECTED'/);
  assert.match(script, /toast\(`\$\{style\.name\} IDENTITY LOCKED IN`/);
  assert.match(script, /\$\{isSignature\?'YOUR STYLE':'THEIR STYLE'\} · \$\{plan\.name\}/);
  assert.doesNotMatch(script, /\$\{(?:s|style|plan)\.icon\}/);
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
  assert.match(html, /id="fansText"[^>]*>0<\/span> FOLLOWERS<\/small><div class="top-progress"><span>HYPE<\/span><b id="hypeText"/);
  assert.doesNotMatch(html, /card bars|id="energyBar"|id="healthBar"|id="xpBar"|id="hypeBar"/);
  assert.doesNotMatch(script, /\$\('#(?:energy|health|xp|hype)Bar'\)/);
});

test('Cage Feed turns career events into one strategic player post per news cycle', () => {
  assert.match(html, /id="homeFeedPreview"/);
  assert.match(html, /data-screen="feed"/);
  assert.match(html, /id="socialTimeline"/);
  assert.match(html, /data-nav="feed"[\s\S]*data-icon-name="nav-feed"[\s\S]*id="feedNavBadge"/);
  assert.match(html, /class="card feed-page-card"[\s\S]*class="feed-page-note"[\s\S]*id="socialTimeline"/);
  assert.match(html, /class="social-composer"[\s\S]*id="feedCycleStatus"[\s\S]*id="socialActions"/);
  assert.doesNotMatch(html, /Make Your Post|feed-compose-head/);
  assert.match(html, /\.screen\[data-screen="feed"\]\.active\{display:flex/);
  assert.match(html, /\.social-composer\{position:sticky/);
  assert.doesNotMatch(html, /class="feed-back"/);
  assert.match(script, /socialAccountCreated:false,socialFeed:\[\],socialCycle:0,socialPostedCycle:0,socialSerial:0,socialLastReadSerial:0/);
  assert.match(script, /function socialUnreadCount\(\)/);
  assert.match(script, /currentScreen==='feed'\)state\.socialLastReadSerial=state\.socialSerial/);
  assert.match(script, /navBadge\.textContent=unread>99\?'99\+':String\(unread\)/);
  assert.match(script, /function createSocialAccount\(\)/);
  assert.match(script, /Hello, fight fans! Stay tuned—the climb starts now/);
  assert.match(script, /if\(!state\.socialAccountCreated\)return 0/);
  assert.match(script, /if\(screen==='feed'&&!ensureSocialFeed\(\)\)createSocialAccount\(\)/);
  assert.match(script, /\(Number\(s\.fans\)\|\|0\)>0/);
  assert.match(script, /function openSocialCycle\(type,data=\{\}\)/);
  assert.match(script, /openSocialCycle\('fight'/);
  assert.match(script, /openSocialCycle\('appearance'/);
  assert.match(script, /openSocialCycle\('autograph'/);
  assert.match(script, /openSocialCycle\('sponsor'/);
  assert.match(script, /state\.socialPostedCycle>=state\.socialCycle/);
  assert.match(script, /id:'thank'.*Thank the Followers/);
  assert.match(script, /id:'callout'.*Post a Rival Callout/);
  assert.match(script, /id:'brand'.*Influencer Brand Post/);
  assert.match(script, /rival\.rematchAccepted=true/);
  assert.match(script, /state\.socialPostedCycle=state\.socialCycle/);
  assert.match(script, /WIN STREAK:.*won \$\{data\.winStreak\} straight fights/);
  for (const name of ['FightFan99', 'MMA4Life', 'ScorecardBandit', 'FlukeWinPolice']) assert.match(script, new RegExp(name));
  const riskDefs = script.match(/const riskDefs = (\[[\s\S]*?\n\s*\]);/)?.[1] || '';
  const publicityDefs = script.match(/const publicityDefs = (\[[\s\S]*?\n\s*\]);/)?.[1] || '';
  assert.doesNotMatch(riskDefs, /call-out-rival|Post a Rival Callout/);
  assert.doesNotMatch(publicityDefs, /social-post|Influencer Brand Post/);
  assert.match(script, /THE COMMENTS COOKED YOU/);
  assert.doesNotMatch(html, />FANS<|>Fans</);
  assert.match(readme, /one player post per news cycle/);
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

test('active sponsor appears beneath Cage Rank in the Home hero', () => {
  const rankPosition = html.indexOf('class="rank-chip"');
  const sponsorPosition = html.indexOf('id="heroSponsor"');
  const dailyPosition = html.indexOf('id="dailyBtn"');
  assert.ok(rankPosition >= 0 && sponsorPosition > rankPosition && sponsorPosition < dailyPosition);
  assert.match(html, /\.hero-sponsor\{position:absolute;top:48px;left:10px/);
  assert.match(html, /\.hero-sponsor\[hidden\]\{display:none\}/);
  assert.match(script, /sponsorBadge\.hidden=!sponsor/);
  assert.match(script, /gameIcon\(sponsor\.id,sponsor\.icon\)/);
  assert.match(script, /SPONSORED BY/);
  assert.match(script, /state\.activeEndorsement\.fightsLeft\} FIGHTS LEFT/);
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
  assert.match(script, /chance=Math\.min\(\.75,\.25\+\(upset\?\.10:0\)\+\(rivalry\?\.10:0\)\+\(ko\?\.05:0\)\)/);
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

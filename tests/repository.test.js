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
  assert.match(script, /hasHistory\?`REMATCH/);
  assert.match(script, /limited&&unlocked\?'gig-unavailable'/);
  assert.match(script, /availability=!unlocked\?requirementText\(a\):limited\?'NO GIGS LEFT'/);
  assert.doesNotMatch(html, /\.action\.future\.gig-unavailable:after/);
});

test('opponents have pro records, conditional H2H, and consent-aware rematches', () => {
  assert.match(script, /function payoutForOpponent\(o\).*o\.tier>=state\.level\?1:\.5/);
  assert.match(script, /recordInitialized:true/);
  assert.match(script, /<span class="opp-record">PRO \$\{o\.wins\}-\$\{o\.losses\}<\/span>/);
  assert.match(script, /hasHistory\?`<div class="opp-history">H2H YOU \$\{o\.lossesToPlayer\|\|0\}-\$\{o\.winsVsPlayer\|\|0\}<\/div>`:''/);
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
  assert.match(html, /Fighter Attributes/);
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

test('living roster uses two-across collectible fighter cards', () => {
  assert.match(html, /\.opponent-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(html, /\.opponent\{[^}]*aspect-ratio:2\/3/);
  assert.match(script, /<article class="opponent \$\{status\} \$\{o\.championship\?'champion':''\}">/);
  assert.match(script, /\['title','TITLE FIGHTS','BEAT THE CHAMPION · WIN THE BELT'\]/);
});

test('gear collection shows owned quantities and rarity above icons', () => {
  assert.match(script, /owned=gearItems\.filter\(g=>gearCount\(g\.id\)>0\)/);
  assert.match(html, /\.gear\.collectible-card\{[^}]*aspect-ratio:2\/3[^}]*grid-template-rows:/);
  assert.match(html, /\.gear-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(script, /rarity-card-\$\{rarity\.toLowerCase\(\)\}/);
  assert.match(script, /<div class="gear-hero"><span class="gear-flair"><\/span><span class="equip-burst"><\/span><div class="gear-icon">/);
  for (const rarity of ['common', 'rare', 'epic', 'legendary']) assert.match(html, new RegExp(`\\.rarity-${rarity}\\{`));
  assert.match(html, /\.build-choice\.locked-choice\{[^}]*opacity:\.3!important[^}]*filter:grayscale\(1\) saturate\(0\)!important/);
  assert.match(script, /locked\?'locked-choice':''/);
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
  const dailyCollectible = script.match(/function awardDailyCollectible\(date\)\{([\s\S]*?)\n\s*\}\n\s*function ensureDailyCounters/)?.[1] || '';
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
  assert.match(script, /\$\('#skipBtn'\)\.disabled=true/);
  assert.match(html, /\.corner-panel\.crisis-panel\{/);
  assert.match(readme, /Throwing in the towel gives the opponent a TKO win/);
});

const fs = require('node:fs');
const test = require('node:test');
const assert = require('node:assert/strict');

const html = fs.readFileSync('index.html', 'utf8');
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
  assert.match(script, /declined=available&&\(o\.lossesToPlayer\|\|0\)>0/);
  assert.match(script, /DECLINED<br><small>YOU WON<\/small>/);
  assert.match(script, /cash=Math\.round\(basePurse/);
});

test('gear collection shows owned quantities and rarity above icons', () => {
  assert.match(html, /\.gear\{[^}]*padding:9px 9px 54px[^}]*min-height:206px/);
  assert.match(script, /owned=gearItems\.filter\(g=>gearCount\(g\.id\)>0\)/);
  assert.match(script, /<div class="gear-top"><span class="rarity-tag rarity-\$\{rarity\.toLowerCase\(\)\}">\$\{rarity\}<\/span><span class="gear-count">×\$\{gearCount\(g\.id\)\}<\/span><\/div><div class="gear-icon">/);
  for (const rarity of ['common', 'rare', 'epic', 'legendary']) assert.match(html, new RegExp(`\\.rarity-${rarity}\\{`));
  assert.match(html, /\.build-choice\.locked-choice\{[^}]*opacity:\.3!important[^}]*filter:grayscale\(1\) saturate\(0\)!important/);
  assert.match(script, /locked\?'locked-choice':''/);
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

test('fight result action celebrates wins without labeling losses as reward claims', () => {
  assert.match(script, /\$\('#continueBtn'\)\.textContent=win\?'CLAIM REWARDS':'CONTINUE'/);
  assert.match(script, /function handleResultAction\(\)\{if\(revealGearDrop\(\)\)return;closeResult\(\)\}/);
  assert.match(script, /BONUS GEAR DROP READY/);
  assert.match(script, /drop-icon/);
});

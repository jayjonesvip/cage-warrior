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

test('gear metadata stays above buttons and permanent identities remain readable', () => {
  assert.match(html, /\.gear\{[^}]*padding:9px 9px 54px[^}]*min-height:196px/);
  assert.match(html, /\.build-choice:disabled\{[^}]*opacity:1[^}]*filter:none/);
});

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

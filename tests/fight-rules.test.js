const fs = require('node:fs');
const test = require('node:test');
const assert = require('node:assert/strict');

const configuration = JSON.parse(fs.readFileSync('fight-rules.json', 'utf8'));
const rules = require('../js/fight-rules.js');

test('editable fight rules reproduce the built-in safe defaults', () => {
  assert.equal(configuration.schemaVersion, 1);
  assert.deepEqual(rules.normalize(configuration), rules.defaults);
});

test('fight rule validation accepts safe edits and rejects unsafe values', () => {
  const edited = structuredClone(configuration);
  edited.fatigue.powerOrSpeedToCardioRatioThreshold = 2;
  edited.energyEconomy.restDurationSeconds = 12;
  edited.recoveryEconomy.dollarsPerHealthPointPerFighterLevel = 4;
  edited.energyEconomy.trainingEnergyCost = 40;
  edited.fightStructure.scheduledRounds = 5;
  edited.focus.startingMinimum = 99;
  edited.focus.startingMaximum = 70;

  const normalized = rules.normalize(edited);
  assert.equal(normalized.fatigue.powerOrSpeedToCardioRatioThreshold, 2);
  assert.equal(normalized.energyEconomy.restDurationSeconds, 12);
  assert.equal(normalized.recoveryEconomy.dollarsPerHealthPointPerFighterLevel, 4);
  assert.equal(normalized.energyEconomy.trainingEnergyCost, 25);
  assert.equal(normalized.fightStructure.scheduledRounds, 3);
  assert.equal(normalized.focus.startingMinimum, rules.defaults.focus.startingMinimum);
  assert.equal(normalized.focus.startingMaximum, rules.defaults.focus.startingMaximum);
});

test('the static app loads and caches the editable fight configuration', () => {
  const page = fs.readFileSync('index.html', 'utf8');
  const serviceWorker = fs.readFileSync('service-worker.js', 'utf8');
  assert.ok(page.indexOf('js/fight-rules.js') < page.indexOf('js/game-logic.js'));
  assert.match(serviceWorker, /'\.\/fight-rules\.json'/);
  assert.match(serviceWorker, /'\.\/js\/fight-rules\.js\?v=2\.5\.212'/);
  assert.match(serviceWorker, /url\.pathname\.endsWith\('\/fight-rules\.json'\)[\s\S]*networkFirst\(request\)/);
});

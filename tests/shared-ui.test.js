const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const context = {};
vm.runInNewContext(fs.readFileSync('js/shared-ui.js', 'utf8'), context);
const { championshipCardModel, isCurrentChampion } = context.CAGE_SHARED_UI;

test('shared championship card presents contenders consistently everywhere', () => {
  const model = championshipCardModel({
    championship: { champion_handle: 'JayJonesVIP', champion_level: 5, challenge_eligible: true },
    state: { level: 6 },
    loaded: true
  });

  assert.equal(model.eyebrow, 'CAGE GRIND · ONE BELT');
  assert.equal(model.title, 'WORLD CHAMPIONSHIP');
  assert.equal(model.kicker, 'TITLE CONTENDER');
  assert.equal(model.headline, '@JayJonesVIP');
  assert.equal(model.meta, "YOU'RE ELIGIBLE · CHAMPION LVL 5 · YOU LVL 6");
});

test('shared championship card covers champion, vacant, and offline states', () => {
  assert.equal(championshipCardModel({championship:{is_champion:true,defenses:1}}).headline, 'YOU HOLD THE BELT');
  assert.equal(championshipCardModel({championship:{champion_handle:'JayJonesVIP',defenses:2},state:{name:'@jayjonesvip'}}).headline, 'YOU HOLD THE BELT');
  assert.equal(isCurrentChampion({champion_handle:'JayJonesVIP'},{name:'DifferentFighter'}), false);
  assert.equal(championshipCardModel({loaded:true}).headline, 'THE WORLD TITLE IS OPEN');
  assert.equal(championshipCardModel({unavailable:true}).headline, 'TITLE UPDATE UNAVAILABLE');
});

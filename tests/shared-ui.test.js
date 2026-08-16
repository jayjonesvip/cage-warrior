const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const context = {};
vm.runInNewContext(fs.readFileSync('js/shared-ui.js', 'utf8'), context);
const { championshipCardModel, isCurrentChampion, resolveChampionshipIdentity } = context.CAGE_SHARED_UI;

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
  assert.equal(model.meta, 'TITLE SHOT AVAILABLE · CHAMPION LEVEL 5');
});

test('shared championship card covers champion, vacant, and offline states', () => {
  assert.equal(championshipCardModel({championship:{is_champion:true,defenses:1}}).headline, 'YOU ARE THE WORLD CHAMPION');
  assert.equal(championshipCardModel({championship:{champion_handle:'JayJonesVIP',defenses:2},state:{name:'@jayjonesvip'}}).headline, 'YOU ARE THE WORLD CHAMPION');
  assert.equal(isCurrentChampion({champion_handle:'JayJonesVIP'},{name:'DifferentFighter'}), false);
  assert.deepEqual(
    JSON.parse(JSON.stringify(resolveChampionshipIdentity({champion_handle:'JayJonesVIP',is_champion:false,eligibility_status:'level_locked'},{name:'jayjonesvip'}))),
    {champion_handle:'JayJonesVIP',is_champion:true,eligibility_status:'champion',challenge_eligible:false,rematch_blocked:false,level_eligible:true,daily_bout_used:false,former_champion:false,former_champion_rematch:false}
  );
  assert.equal(championshipCardModel({loaded:true}).headline, 'THE WORLD TITLE IS OPEN');
  assert.equal(championshipCardModel({unavailable:true}).headline, 'CHAMPIONSHIP UPDATE UNAVAILABLE');
});

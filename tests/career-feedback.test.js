'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),feedback=require('../js/career-feedback.js');
test('spotlights persist until details and ranks require successful remote data',()=>{
  const fs=require('node:fs'),path=require('node:path'),read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8'),game=read('js/game.js');
  assert.match(game,/if\(item&&!state.unseenGear.includes\(item.id\)\)state.unseenGear.push\(item.id\)/);
  assert.match(game,/if\(flipped&&item\)\{state.unseenGear=state.unseenGear.filter/);
  assert.match(game,/if\(profilesLoaded&&seedsLoaded&&championshipResult.status==='fulfilled'\)/);
  assert.match(read('index.html'),/js\/career-feedback.js/);
  assert.match(read('service-worker.js'),/js\/career-feedback.js/);
});
test('rank changes establish a baseline then use positive up and negative down',()=>{
  const baseline=feedback.rankSnapshot(null,12,100);
  assert.equal(baseline.delta,0);
  const up=feedback.rankSnapshot(baseline,9,200);assert.equal(up.delta,3);
  assert.deepEqual(feedback.rankSnapshot(up,9,300),up);
  const down=feedback.rankSnapshot(up,11,400);assert.equal(down.delta,-2);
  assert.deepEqual(feedback.rankSnapshot(down,0,500),down);
});
test('drop spotlight describes stat, Aura, and recovery bonuses accurately',()=>{
  assert.equal(feedback.perkLabel({stat:'power',bonus:2}),'+2 POWER');
  assert.equal(feedback.perkLabel({auraBonus:3}),'+3 AURA');
  assert.equal(feedback.perkLabel({healthRecoverySpeed:2500}),'HEALTH RECOVERY −2.5 SEC');
  assert.equal(feedback.perkLabel({energyRecoverySpeed:100}),'ENERGY RECOVERY −0.1 SEC');
});

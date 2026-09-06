const test=require('node:test'),assert=require('node:assert/strict');
const logic=require('../js/game-logic.js');
test('health names follow percentage tiers with absolute medical clearance',()=>{
  for(const [health,max,label] of [[100,100,'FRESH'],[90,100,'FRESH'],[89,100,'BRUISED'],[70,100,'BRUISED'],[69,100,'BATTERED'],[50,100,'BATTERED'],[49,100,'BANGED UP'],[20,130,'BANGED UP'],[19,130,'NOT CLEARED'],[117,130,'FRESH']])assert.equal(logic.healthTierName(health,max),label);
});

'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const rules=require('../js/fight-rules.js');

const root=path.resolve(__dirname,'..');

test('fight-rules.json is valid and uses the current schema',()=>{
  const document=JSON.parse(fs.readFileSync(path.join(root,'fight-rules.json'),'utf8'));
  assert.equal(document.schemaVersion,3);
  assert.equal(document.energyEconomy.energyRecoveryIntervalMilliseconds,5000);
  assert.equal(document.energyEconomy.healthRecoveryIntervalMilliseconds,60000);
  assert.equal(document.energyEconomy.maximumEnergy,100);
  assert.equal(document.energyEconomy.fightEnergyCost,25);
  assert.equal(document.computerGeneratedOpponentDifficulty.linearAttributeRatingGainPerLevel,1.1);
  assert.equal(document.computerGeneratedOpponentDifficulty.compoundingGrowthStartsAtLevel,7);
  assert.equal(document.computerGeneratedOpponentDifficulty.attributeGrowthMultiplierPerLevel,1.01);
});

test('rule loader keeps safe edits and rejects out-of-range values',()=>{
  const normalized=rules.normalize({
    energyEconomy:{energyRecoveryIntervalMilliseconds:4000,maximumEnergy:999},
    experienceRewards:{sameDayRunbackExperienceMultiplier:.9},
    fightStructure:{dailyFightLimit:12}
  });
  assert.equal(normalized.energyEconomy.energyRecoveryIntervalMilliseconds,4000);
  assert.equal(normalized.energyEconomy.maximumEnergy,100);
  assert.equal(normalized.experienceRewards.sameDayRunbackExperienceMultiplier,.5);
  assert.equal(normalized.fightStructure.dailyFightLimit,12);
});

test('removed activity and economy sections are absent from rules',()=>{
  const source=fs.readFileSync(path.join(root,'fight-rules.json'),'utf8');
  for(const key of ['training','sparring','hustle','recoveryPrices','fightPurse','cashReward']){
    assert.equal(source.includes(`"${key}"`),false,key);
  }
});

const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const rules=require('../js/fight-rules.js'),logic=require('../js/game-logic.js');
test('damage-based stoppages require a significant strike below the condition threshold',()=>{
 const hit={significant:true,targetCondition:60,damage:10};
 assert.equal(logic.knockoutFinishChance({...hit,targetCondition:70}),0);
 assert.equal(logic.knockoutFinishChance({...hit,targetCondition:100}),0);
 assert.equal(logic.knockoutFinishChance({...hit,significant:false}),0);
 assert.ok(logic.knockoutFinishChance({...hit,targetCondition:69})>0);
 assert.ok(logic.knockoutFinishChance({...hit,targetCondition:40})>logic.knockoutFinishChance(hit));
 assert.ok(logic.knockoutFinishChance({...hit,damage:18})>logic.knockoutFinishChance(hit));
 assert.ok(logic.knockoutFinishChance({...hit,knockdown:true})>logic.knockoutFinishChance(hit));
 assert.equal(logic.knockoutFinishChance({...hit,damage:100,knockdown:true}),.35);
 assert.equal(logic.knockoutFinishChance({...hit,targetCondition:0}),1);
});
test('existing rocked and late-condition finishes remain available for both fighters',()=>{
 assert.equal(logic.knockoutFinishChance({targetCondition:9}),.3);
 assert.equal(logic.knockoutFinishChance({targetCondition:20,knockdown:true}),.48);
 assert.ok(logic.knockoutFinishChance({targetCondition:80,rocked:true,damage:10})>0);
 const source=fs.readFileSync(require.resolve('../js/game.js'),'utf8');
 assert.match(source,/const targetCondition=side==='player'\?sim\.oppCondition:sim\.playerCondition,koChance=landed\?LOGIC\.knockoutFinishChance\(\{[^}]*significant:type!=='jab'&&type!=='takedown'\}\):0/);
});
test('editable finish settings and offline defaults agree, with invalid edits rejected',()=>{
 const document=JSON.parse(fs.readFileSync(require.resolve('../fight-rules.json'),'utf8'));
 assert.deepEqual(rules.normalize(document).fightFinishes,rules.defaults.fightFinishes);
 const normalized=rules.normalize({fightFinishes:{strikeStoppageConditionThreshold:101,strikeStoppageBaseChance:-1,maximumStrikeStoppageChance:2,strikeStoppageDamageChancePerPoint:.007}});
 assert.equal(normalized.fightFinishes.strikeStoppageConditionThreshold,70);
 assert.equal(normalized.fightFinishes.strikeStoppageBaseChance,.04);
 assert.equal(normalized.fightFinishes.maximumStrikeStoppageChance,.35);
 assert.equal(normalized.fightFinishes.strikeStoppageDamageChancePerPoint,.007);
});
test('submission tuning retains advantages from signature, skill and accumulated damage',()=>{
 const base=logic.submissionFinishChance({targetCondition:100});
 assert.equal(base,.05);
 assert.equal(logic.submissionFinishChance({signature:true,targetCondition:100}),.085);
 assert.ok(logic.submissionFinishChance({signature:true,targetCondition:40})>.085);
 assert.ok(logic.submissionFinishChance({speed:12,opponentSpeed:8,cardio:12,opponentCardio:8})>base);
 assert.equal(logic.submissionFinishChance({speed:100,cardio:100}),.38);
});

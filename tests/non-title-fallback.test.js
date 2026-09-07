const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../js/game.js'),'utf8');
const helper=source.slice(source.indexOf('  function nonTitleOpponent('),source.indexOf('  async function commitFight('));
test('non-title fallback preserves opponent build and removes every title flag',()=>{
  const ctx={};vm.createContext(ctx);vm.runInContext(helper,ctx);
  const original={key:'opponent',power:17,globalChampionship:true,championDefense:true,titleCooldown:true,titleMode:'defense',formerChampionRematch:true,defenses:8};
  const result=ctx.nonTitleOpponent(original);
  assert.equal(result.key,'opponent');assert.equal(result.power,17);
  for(const flag of ['globalChampionship','championDefense','titleCooldown','formerChampionRematch'])assert.equal(result[flag],false);
  assert.equal(result.titleMode,'ranked');assert.equal(original.globalChampionship,true);
});
test('seeds never request a title booking and fallback is limited to explicit defense rejection',()=>{
  assert.match(source,/if\(opponent.seeded\)return nonTitleOpponent\(\{\.\.\.opponent,worldRank\}\)/);
  assert.match(source,/if\(o.championDefense&&String\(error\?\.message\|\|error\).includes\('That ranked fighter is not available for a title defense'\)\)/);
  assert.match(source,/o=nonTitleOpponent\(o\);championshipBout=null;fight.o=o/);
});

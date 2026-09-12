const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const logic=require('../js/game-logic.js'),source=fs.readFileSync(require.resolve('../js/game.js'),'utf8'),copy={};
vm.runInNewContext(fs.readFileSync(require.resolve('../js/strings.js'),'utf8'),copy);
function report(data,currentHealth=100){
  const local=[],shared=[];
  const context={state:{name:'TestFighter',health:currentHealth,socialCycle:0,level:8},STRINGS:copy.CAGE_STRINGS,ensureSocialFeed:()=>true,drawSocialHeadline:(_,entries)=>entries.find(entry=>entry.profile==='media'),
    copyPosts:(entries,values)=>entries.map(entry=>({...entry,text:entry.text.replace(/\{(\w+)\}/g,(_,key)=>values[key]??'')})),fmt:String,addSocialPosts:posts=>local.push(...posts),saveState(){},renderSocial(){},queueSharedPosts:posts=>shared.push(...posts)};
  vm.createContext(context);vm.runInContext(source.slice(source.indexOf('  function openSocialCycle('),source.indexOf('  function feedAge(')),context);
  context.openSocialCycle('fight',{opponent:'Opponent',method:'DECISION',win:true,winStreak:1,...data});
  assert.equal(local.length,1);assert.equal(shared.length,1);assert.equal(local[0].text,shared[0].body);
  return local[0].text;
}
test('reporter calls out only starting conditions below Bruised',()=>{
  for(const [health,maxHealth,hurt] of [[90,100,false],[70,100,false],[69,100,true],[50,100,true],[49,100,true],[140,200,false],[139,200,true]]){
    const text=report({startingHealthTier:logic.healthTierName(health,maxHealth)});
    assert.equal(text.toLowerCase().includes('fighting hurt'),hurt,`${health}/${maxHealth}`);
  }
  assert.doesNotMatch(report({},20),/fighting hurt/i);
  assert.doesNotMatch(report({startingHealthTier:'FRESH'},20),/fighting hurt/i);
  assert.match(report({startingHealthTier:'BATTERED'},100),/^Fighting hurt, still finding a way to win/);
  assert.match(source,/startingHealthTier:LOGIC\.healthTierName\(state\.health,state\.maxHealth\)/);
  assert.match(source,/openSocialCycle\('fight',\{[^\n]*startingHealthTier:fight\.startingHealthTier/);
});
test('hurt context preserves win, loss, streak, and backlash result coverage',()=>{
  for(const patch of [{win:true},{win:false},{win:true,winStreak:5},{win:true,lowerLevelWin:true,followersLost:500}]){
    const text=report({...patch,startingHealthTier:'BANGED UP'});
    assert.match(text,/TestFighter/);assert.match(text,/^Fighting hurt/);
    if(patch.lowerLevelWin)assert.match(text,/500 followers/);
  }
});
test('all reporter templates with injury notes fit the shared-feed post limit',()=>{
  const values={name:'@'+'A'.repeat(32),opponent:'B'.repeat(32),finish:'SUBMISSION (REAR-NAKED CHOKE)',titleSuffix:'',winStreak:999999,followersLost:'999,999,999',fighterLevel:99,opponentLevel:98};
  assert.equal(copy.CAGE_STRINGS.social.cycles.fightingHurt.win.length,5);assert.equal(copy.CAGE_STRINGS.social.cycles.fightingHurt.loss.length,5);
  for(const prefix of [...copy.CAGE_STRINGS.social.cycles.fightingHurt.win,...copy.CAGE_STRINGS.social.cycles.fightingHurt.loss])for(const key of ['fightWin','fightLoss','fightStreakHeadline','lowerLevelWin'])for(const entry of copy.CAGE_STRINGS.social.cycles[key].filter(entry=>entry.profile==='media')){
    const text=prefix.text+entry.text.replace(/\{(\w+)\}/g,(_,key)=>values[key]??'');
    assert.ok(text.length<=280,`${key}: ${text.length} characters`);
  }
});

test('hurt win and loss prefixes each rotate through five distinct messages',()=>{
  const context={state:{name:'TestFighter'}};
  vm.createContext(context);
  for(const name of ['hashSeed','seededRandom'])vm.runInContext(source.split('\n').find(line=>line.includes(`function ${name}(`)),context);
  vm.runInContext(source.slice(source.indexOf('  function drawSocialHeadline('),source.indexOf('  function openSocialCycle(')),context);
  for(const [key,outcome] of [['hurtWin','win'],['hurtLoss','loss']]){
    const pool=copy.CAGE_STRINGS.social.cycles.fightingHurt[outcome];
    for(let batch=0;batch<2;batch++){
      const messages=Array.from({length:5},()=>context.drawSocialHeadline(key,pool).text);
      assert.equal(new Set(messages).size,5);
      assert.ok(messages.every(text=>pool.some(entry=>entry.text===text)));
    }
    assert.equal(context.state.socialHeadlineCounts[key],10);
  }
});

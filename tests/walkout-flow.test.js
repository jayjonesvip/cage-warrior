const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/game.js'),'utf8');
function harness(enabled){
  const nodes=new Map(),jobs=[],calls=[];
  const $=key=>{if(!nodes.has(key))nodes.set(key,{style:{setProperty(key,value){this[key]=value}},classList:{add(){},remove(){}},setAttribute(){},focus(){}});return nodes.get(key)};
  const context={$, $$:()=>[],fight:{},walkoutPending:false,walkoutMusic:{enabled,supported:true,setScene:scene=>calls.push(scene),stop:()=>calls.push('stop')},renderLockerMusic(){},effectiveAura:()=>60,scheduleFight:(fn,ms)=>jobs.push({fn,ms}),fightPlanFeature:{confirm:()=>calls.push('fight')}};
  vm.createContext(context);vm.runInContext(source.slice(source.indexOf('  function walkoutCrowdMessage('),source.indexOf('  function offerRookieShowcase(')),context);
  return {context,jobs,calls,$};
}
test('silent and musical entrances both wait three seconds and prevent double starts',()=>{
  for(const enabled of [true,false]){
    const h=harness(enabled);h.context.confirmFightPlan();h.context.confirmFightPlan();assert.equal(h.jobs.length,5);assert.equal(h.$('#walkoutModal').style['--walkout-duration'],'3000ms');
    h.jobs.find(j=>j.ms===750).fn();assert.match(h.$('#walkoutMessage').textContent,enabled?/music hits/:/silently/);
    h.jobs.filter(j=>j.ms<3000).forEach(j=>j.fn());assert.ok(!h.calls.includes('fight'));
    h.jobs.find(j=>j.ms===3000).fn();assert.equal(h.calls.at(-1),'fight');assert.equal(h.context.walkoutPending,false);
  }
});
test('a cancelled entrance cannot start combat and all crowd tiers have copy',()=>{
  const h=harness(false);h.context.confirmFightPlan();h.context.fight=null;h.context.walkoutPending=false;h.jobs.find(j=>j.ms===3000).fn();assert.ok(!h.calls.includes('fight'));
  const messages=[0,40,60,80,99].map(a=>h.context.walkoutCrowdMessage(a));assert.equal(new Set(messages).size,5);assert.ok(messages.every(s=>!s.includes('Aura')));
});

test('opening showcase has one 1.5-second beat and stops music before combat',()=>{
 const h=harness(true);h.context.fight={o:{rookieShowcase:true}};h.context.confirmFightPlan();h.context.confirmFightPlan();
 assert.deepEqual(h.jobs.map(job=>job.ms),[1300,1500]);
 assert.equal(h.$('#walkoutTitle').textContent,'YOUR FIRST WALKOUT');assert.equal(h.$('#walkoutModal').style['--walkout-duration'],'1500ms');
 h.jobs[0].fn();assert.equal(h.calls.at(-1),'stop');assert.ok(!h.calls.includes('fight'));
 h.jobs[1].fn();assert.equal(h.calls.at(-1),'fight');assert.equal(h.context.walkoutPending,false);
});

const test=require('node:test'),assert=require('node:assert/strict');
const news=require('../js/daily-news.js');
test('Daily Cage skips day one and seen editions; tomorrow is eligible',()=>{
  const now=new Date(2026,8,7,12);
  assert.equal(news.eligible(new Date(2026,8,7,0),null,now),false);
  assert.equal(news.eligible(new Date(2026,8,6,23),null,now),true);
  assert.equal(news.eligible(new Date(2026,8,6),'2026-09-07',now),false);
  assert.equal(news.eligible(new Date(2026,8,6),'2026-09-06',now),true);
  assert.equal(news.eligible('invalid',null,now),false);
});
test('edition uses previous local calendar day, not rolling 24 hours',()=>{
  const result=news.edition(new Date(2026,8,7,19));
  assert.equal(result.key,'2026-09-07');
  assert.equal(new Date(result.start).getDate(),6);
  assert.equal(new Date(result.end).getHours(),0);
});
test('only real events produce stories, with distinct title outcomes',()=>{
  assert.deepEqual(news.stories({}),[]);
  const items=news.stories({newFighters:3,fights:47,titles:[{action:'transfer',handle:'Winner'},{action:'defense',handle:'Champion'}],upset:{winner:'Underdog',opponent:'Favorite'}});
  assert.equal(items.length,5);assert.equal(items[0].tag,'AND NEW');assert.equal(items[1].tag,'AND STILL');
  assert.match(items[2].title,/3 new fighters/);assert.match(items[3].body,/@Underdog/);
});
function harness(client,options={}){
  const nodes=new Map();const node=()=>({hidden:true,children:[],textContent:'',setAttribute(k,v){this[k]=v},replaceChildren(){this.children=[]},append(x){this.children.push(x)},addEventListener(){}});
  const element={...node(),querySelector(key){if(!nodes.has(key))nodes.set(key,node());return nodes.get(key)}};
  const entries=new Map(),storage={getItem:k=>entries.get(k),setItem:(k,v)=>entries.set(k,v)};
  global.document={createElement:node};
  const controller=news.create({element,client,storage,now:()=>new Date(2026,8,7,12),...options});
  controller.visit(true);
  return {controller,element,entries};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const profile={id:'player',created_at:new Date(2026,8,5).toISOString()};
test('repeated defenses collapse and aggregated counts remain accurate',()=>{
  const duplicate={action:'defense',handle:'Champ'};
  assert.equal(news.stories({titles:[duplicate,duplicate,duplicate]}).length,1);
  assert.match(news.stories({titles:[duplicate,duplicate,duplicate]})[0].body,/3 times/);
  assert.match(news.stories({titles:[{...duplicate,count:7}]})[0].body,/7 times/);
});
test('rotation advances at six seconds, pauses on interaction, resumes, and stops on close',async()=>{
  const timers=new Map();let serial=0;
  const h=harness({loadDailyNews:async()=>({newFighters:3,fights:12}),recordNewsResult:async()=>{}},{schedule(fn,ms){assert.equal(ms,6000);timers.set(++serial,fn);return serial},cancel(id){timers.delete(id)}});
  h.controller.profile(profile);await tick();assert.equal(timers.size,1);
  const [id,callback]=[...timers][0];timers.delete(id);callback();assert.match(h.element.querySelector('[data-news-title]').textContent,/12 fights/);
  h.element.querySelector('[data-news-next]').onclick();assert.equal(timers.size,0);
  h.element.querySelector('[data-news-pause]').onclick();assert.equal(timers.size,1);
  h.element.querySelector('[data-news-close]').onclick();assert.equal(timers.size,0);
});
test('display once, carousel changes, dismissal and Home return do not repeat',async()=>{
  let calls=0;const h=harness({loadDailyNews:async()=>{calls++;return {newFighters:3,fights:12}},recordNewsResult:async()=>{}});
  h.controller.profile(profile);await tick();assert.equal(h.element.hidden,false);assert.equal(calls,1);
  h.element.querySelector('[data-news-next]').onclick();assert.match(h.element.querySelector('[data-news-title]').textContent,/12 fights/);
  h.element.querySelector('[data-news-close]').onclick();assert.equal(h.element.hidden,true);
  h.controller.visit(false);h.controller.visit(true);await tick();assert.equal(h.element.hidden,true);assert.equal(calls,1);
});
test('failed request does not consume edition; returning can retry',async()=>{
  let fail=true;const h=harness({loadDailyNews:async()=>{if(fail)throw Error('offline');return {fights:2}},recordNewsResult:async()=>{}});
  h.controller.profile(profile);await tick();assert.equal(h.entries.size,0);assert.equal(h.element.hidden,true);
  fail=false;h.controller.visit(true);await tick();assert.equal(h.element.hidden,false);
});
test('new careers never request news and pending result retries are idempotent',async()=>{
  let loads=0,records=0;const h=harness({loadDailyNews:async()=>{loads++;return {}},recordNewsResult:async()=>{records++}});
  const fresh={...profile,created_at:new Date(2026,8,7).toISOString()};h.controller.profile(fresh);await tick();assert.equal(loads,0);
  const result={bout:1,at:new Date(2026,8,7,10).toISOString(),won:true};h.controller.record(result);h.controller.record(result);
  h.controller.profile(fresh);await tick();h.controller.profile(fresh);await tick();assert.equal(records,1);
});
test('seed metadata survives an offline result retry and flush can be awaited',async()=>{
  let fail=true,attempts=0,saved=null;const h=harness({loadDailyNews:async()=>({}),recordNewsResult:async result=>{attempts++;if(fail)throw Error('offline');saved=result}});
  await h.controller.profile(profile);
  const result={bout:2,at:new Date(2026,8,7,10).toISOString(),won:false,seedId:'seed-1',playerLevel:8};
  h.controller.record(result);await h.controller.profile(profile);assert.equal(attempts,1);
  fail=false;await h.controller.profile(profile);assert.equal(attempts,2);assert.equal(saved.seedId,'seed-1');assert.equal(saved.won,false);assert.equal(saved.playerLevel,8);
  await h.controller.profile(profile);assert.equal(attempts,2);
});

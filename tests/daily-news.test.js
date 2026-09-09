const test=require('node:test'),assert=require('node:assert/strict');
const news=require('../js/daily-news.js');
test('Daily Cage hides for exactly 24 hours after dismissal, across midnight',()=>{
  const now=new Date(2026,8,7,12),career=new Date(2026,8,5);
  assert.equal(news.eligible(career,now.getTime()-86400000+1,now),false);
  assert.equal(news.eligible(career,now.getTime()-86400000,now),true);
  assert.equal(news.eligible(career,0,now),true);
  assert.equal(news.eligible(new Date(2026,8,7),0,now),false);
  assert.equal(news.eligible('invalid',0,now),false);
});
test('edition queries a rolling 24 hours including today',()=>{
  for(const now of [new Date(2026,8,7,19),new Date('2026-11-01T07:30:00Z')]){
    const result=news.edition(now);
    assert.equal(result.end,now.toISOString());assert.equal(Date.parse(result.end)-Date.parse(result.start),86400000);
  }
});
test('CEO paragraph covers event categories without names or a long fight list',()=>{
  assert.match(news.roundup({}),/quiet 24 hours/);
  const copy=news.roundup({newFighters:3,fights:47,titles:[{action:'transfer',handle:'Winner'},{action:'defense',handle:'Champion',count:2}],upsets:[{winner:'Underdog',opponent:'Favorite'},{winner:'Other',opponent:'Second',count:3}]});
  for(const expected of ['3 new fighters joined the roster','47 fights took place','world title changed hands once','2 successful title defenses','4 upsets across the roster'])assert.ok(copy.includes(expected),expected);
  assert.equal(copy.includes('\n'),false);assert.doesNotMatch(copy,/yesterday/i);
  assert.doesNotMatch(copy,/@|Winner|Champion|Underdog beat/);assert.ok(copy.split(/\s+/).length<70);
  assert.match(news.roundup({upset:{winner:'Legacy',opponent:'Opponent'}}),/1 upset across the roster/);
});
function harness(client,options={}){
  const nodes=new Map();const node=()=>({hidden:true,children:[],textContent:'',setAttribute(k,v){this[k]=v},replaceChildren(){this.children=[]},append(x){this.children.push(x)},addEventListener(){}});
  const element={...node(),querySelector(key){if(!nodes.has(key))nodes.set(key,node());return nodes.get(key)}};
  const entries=options.entries||new Map(),storage={getItem:k=>entries.get(k),setItem:(k,v)=>entries.set(k,v)};
  global.document={createElement:node};
  const controller=news.create({element,client,storage,now:()=>new Date(2026,8,7,12),...options});
  controller.visit(true);
  return {controller,element,entries};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const profile={id:'player',created_at:new Date(2026,8,5).toISOString()};
test('same fight count does not merge separate results; conflicts stay queued without blocking others',async()=>{
  const saved=[],warnings=[];const h=harness({loadDailyNews:async()=>({}),recordNewsResult:async result=>{if(result.resultId==='first')throw Error('Conflicting fight result ID');saved.push(result.resultId)}},{onSyncError:error=>warnings.push(error.message)});
  await h.controller.profile(profile);
  const common={bout:15,at:new Date(2026,8,7,10).toISOString(),opponent:'Seed',won:false};
  h.controller.record({...common,resultId:'first'});h.controller.record({...common,resultId:'second'});h.controller.record({...common,resultId:'second'});
  await h.controller.profile(profile);
  assert.deepEqual(saved,['second']);assert.deepEqual(warnings,['Conflicting fight result ID']);
  const queue=JSON.parse([...h.entries].find(([key])=>key.endsWith(':results'))[1]);
  assert.equal(queue.length,1);assert.equal(queue[0].resultId,'first');
});
test('many defenses become one broad sentence',()=>{
 const duplicate={action:'defense',handle:'Champ'};
 assert.match(news.roundup({titles:[duplicate,duplicate,duplicate]}),/3 successful title defenses/);
});
test('dismissal survives reload and a new note is fetched exactly 24 hours later',async()=>{
 let clock=new Date(2026,8,7,23),calls=0,randoms=0;
 const timers=new Map();let serial=0;
 const client={loadDailyNews:async()=>{calls++;return {fights:12}},recordNewsResult:async()=>{}};
 const options={now:()=>clock,tips:['First tip','Second tip'],random:()=>{randoms++;return .9},schedule(fn,ms){timers.set(++serial,{fn,ms});return serial},cancel(id){timers.delete(id)}};
 const h=harness(client,options);await h.controller.profile(profile);await tick();
 assert.equal(h.element.hidden,false);assert.equal(h.element.querySelector('[data-news-tip]').textContent,'Second tip');assert.equal(randoms,1);
 h.controller.visit(false);h.controller.visit(true);await tick();assert.equal(calls,1);assert.equal(randoms,1);
 h.element.querySelector('[data-news-close]').onclick();assert.equal(h.element.hidden,true);assert.equal([...timers.values()][0].ms,86400000);
 h.controller.visit(false);assert.equal(timers.size,0);
 clock=new Date(2026,8,8,0);
 const reloaded=harness(client,{...options,entries:h.entries});await reloaded.controller.profile(profile);await tick();assert.equal(reloaded.element.hidden,true);assert.equal(calls,1);
 clock=new Date(2026,8,8,22,59,59,999);reloaded.controller.visit(true);await tick();assert.equal(reloaded.element.hidden,true);assert.equal(calls,1);
 clock=new Date(2026,8,8,23);const timer=[...timers.values()][0];timers.clear();timer.fn();await tick();assert.equal(reloaded.element.hidden,false);assert.equal(calls,2);assert.equal(randoms,2);
});
test('quiet day still presents a CEO note and a tip',async()=>{
 const h=harness({loadDailyNews:async()=>({}),recordNewsResult:async()=>{}},{tips:['Rest and plan.'],random:()=>0});
 await h.controller.profile(profile);await tick();assert.equal(h.element.hidden,false);assert.match(h.element.querySelector('[data-news-body]').textContent,/quiet 24 hours/);assert.equal(h.element.querySelector('[data-news-tip]').textContent,'Rest and plan.');
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

test('CEO modal waits for other popups and the career button starts the cooldown',async()=>{
 let busy=true,calls=0,dismissals=0;const timers=new Map();let serial=0;
 const h=harness({loadDailyNews:async()=>{calls++;return {fights:2}},recordNewsResult:async()=>{}},{canShow:()=>!busy,onDismiss:()=>dismissals++,schedule(fn,ms){timers.set(++serial,{fn,ms});return serial},cancel(id){timers.delete(id)}});
 await h.controller.profile(profile);await tick();assert.equal(calls,0);assert.equal(h.element.hidden,true);
 busy=false;const wake=[...timers.values()][0];assert.equal(wake.ms,1000);timers.clear();wake.fn();await tick();assert.equal(calls,1);assert.equal(h.element.hidden,false);assert.equal(h.element['aria-hidden'],'false');
 h.element.querySelector('[data-news-continue]').onclick();assert.equal(dismissals,1);assert.equal(h.element.hidden,true);assert.equal(h.element['aria-hidden'],'true');assert.equal([...timers.values()][0].ms,86400000);
});

test('CEO counts use singular wording and sum all grouped results',()=>{
 const copy=news.roundup({newFighters:1,fights:1,titles:[{action:'transfer',count:2},{action:'transfer',count:1},{action:'defense',count:1}],upsets:[{count:4},{count:2}]});
 for(const text of ['1 new fighter joined','1 fight took place','changed hands 3 times','1 successful title defense and 6 upsets'])assert.ok(copy.includes(text),text);
 assert.match(news.roundup({upsets:[{}]}),/There was 1 upset/);
 assert.match(news.roundup({titles:[{action:'defense'}]}),/There was 1 successful title defense/);
});

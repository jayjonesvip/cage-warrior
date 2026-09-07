'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),history=require('../js/fight-history.js');
const fight={winner:'player',o:{name:'Test Opponent',tendency:'grappler'},method:'SUBMISSION',submissionMove:{name:'Rear-Naked Choke'},finishRound:2,finishClock:'1:23'};
test('charts use saved results and handle empty, all loss, and unknown finishes',()=>{
  assert.doesNotMatch(history.charts([]),/NaN|Infinity|conic-gradient/);
  const loss=history.append([],{...fight,winner:'opp'},123456);
  assert.match(history.charts(loss),/>0%<\/b>/);
  assert.match(history.charts(loss),/WIN METHODS: 0 KO, 0 SUB, 0 DEC/);
  const mixed=history.append(loss,{...fight,method:'FORFEIT'},123457);
  assert.match(history.charts(mixed),/>50%<\/b>/);
  assert.match(history.charts(mixed),/1 OTHER/);
  assert.match(history.charts(history.append([],fight,123456)),/>100%<\/b>/);
});
test('finish breakdown counts only saved wins and groups TKO with KO',()=>{
  let entries=[];
  for(const method of ['KO','TKO','SUBMISSION','UNANIMOUS DECISION','SPLIT DECISION','FORFEIT'])entries=history.append(entries,{...fight,method},123456);
  entries=history.append(entries,{...fight,winner:'opp',method:'KO'},123457);
  assert.deepEqual(history.breakdown(entries),{ko:2,sub:1,dec:2,other:1});
  assert.deepEqual(history.breakdown([]),{ko:0,sub:0,dec:0,other:0});
});
test('completed fights retain opponent, result, date, style, and named submission',()=>{
  const entries=history.append([],fight,123456,'striker');
  assert.equal(entries[0].opponent,'Test Opponent');assert.equal(entries[0].won,true);
  assert.equal(entries[0].date,123456);assert.equal(entries[0].submission,'Rear-Naked Choke');
  assert.equal(entries[0].style,'grappler');assert.equal(entries[0].playerStyle,'striker');
  assert.deepEqual(history.normalize(JSON.parse(JSON.stringify(entries))),entries);
});
test('KO losses and forfeits retain the actual method without submission names',()=>{
  for(const method of ['KO','TKO','DECISION','FORFEIT']){
    const [entry]=history.append([],{...fight,winner:'opp',method},123456);
    assert.equal(entry.won,false);assert.equal(entry.method,method);assert.equal(entry.submission,'');
  }
});
test('old or malformed saves normalize safely and history is bounded',()=>{
  assert.deepEqual(history.normalize(null),[]);
  assert.deepEqual(history.normalize([null,{}, {date:Infinity,won:true}]),[]);
  const entries=Array.from({length:210},(_,i)=>({...history.append([],fight,i+1)[0]}));
  const saved=history.normalize(entries);assert.equal(saved.length,200);assert.equal(saved[0].date,11);
});
test('recent results shows up to five saved fights, newest first',()=>{
  let entries=[];
  for(const winner of ['player','opp','player','player','opp','opp'])entries=history.append(entries,{...fight,winner},123456);
  assert.deepEqual(history.recentResults(entries),['L','L','W','W','L']);
  assert.deepEqual(history.recentResults(entries.slice(0,2)),['L','W']);
  assert.deepEqual(history.recentResults([]),[]);
});

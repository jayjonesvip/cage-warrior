'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),history=require('../js/fight-history.js');
const fight={winner:'player',o:{name:'Test Opponent',tendency:'grappler'},method:'SUBMISSION',submissionMove:{name:'Rear-Naked Choke'},finishRound:2,finishClock:'1:23'};
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

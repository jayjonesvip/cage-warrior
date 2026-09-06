'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../js/walkout-music.js'),'utf8');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function harness(saved=null){
  const listeners={},jobs=new Set(),nodes=[];let made=0;
  const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){},cancelScheduledValues(){}});
  const node=()=>{const value={gain:param(),frequency:param(),connect(){},disconnect(){},start(){},stop(){this.stopped=true}};nodes.push(value);return value};
  class Context{
    constructor(){made++;this.currentTime=0;this.state='running';this.sampleRate=100;this.destination={}}
    createGain(){return node()}createDynamicsCompressor(){return node()}createOscillator(){return node()}createBufferSource(){return node()}createBiquadFilter(){return node()}
    createBuffer(){return {getChannelData:()=>new Float32Array(200)}}resume(){return Promise.resolve()}
  }
  const box={AudioContext:Context,localStorage:{getItem:()=>JSON.stringify(saved),setItem:(key,value)=>{saved=JSON.parse(value)}},document:{hidden:false,addEventListener:(name,fn)=>listeners[name]=fn},addEventListener:(name,fn)=>listeners[name]=fn,setInterval:fn=>{jobs.add(fn);return fn},clearInterval:fn=>jobs.delete(fn)};
  vm.runInNewContext(source,box);
  return {box,listeners,jobs,nodes,get made(){return made},api:box.CAGE_MUSIC};
}
test('music follows the five effective Aura thresholds',()=>{
  const {api}=harness();
  assert.deepEqual([0,39,40,59,60,79,80,98,99,100].map(api.tierFor),[0,0,1,1,2,2,3,3,4,4]);
  assert.deepEqual([0,40,60,80,99].map(api.trackNameFor),['The Quiet Before','Word Gets Around','Bad Intentions','No Introduction','Heavy Is the Crown']);
});
test('music respects saved mute and stops scheduling on mute, exit, and background',async()=>{
  const h=harness({enabled:false}),music=h.api.create();
  music.setScene('locker',80);await Promise.resolve();assert.equal(h.made,0);
  music.setEnabled(true);await flush();assert.equal(h.jobs.size,1);
  music.setScene('walkout',99);await flush();assert.equal(h.jobs.size,1);
  h.box.document.hidden=true;h.listeners.visibilitychange();assert.equal(h.jobs.size,0);
  h.box.document.hidden=false;h.listeners.visibilitychange();await flush();assert.equal(h.jobs.size,1);
  music.stop();assert.equal(h.jobs.size,0);
  music.setScene('locker',40);music.setEnabled(false);await Promise.resolve();assert.equal(h.jobs.size,0);
});
test('saved preference and volume survive, unavailable audio is nonfatal',async()=>{
  const h=harness({enabled:true,volume:.2}),music=h.api.create();assert.equal(music.enabled,true);assert.equal(music.volume,.2);
  music.setVolume(5);assert.equal(music.volume,1);
  h.box.AudioContext=null;const unsupported=h.api.create();assert.equal(unsupported.supported,false);unsupported.setScene('locker');await Promise.resolve();
});
test('Home preview plays while music is off without changing the saved toggle',async()=>{
  const h=harness({enabled:false}),music=h.api.create();
  music.preview(99);await flush();assert.equal(h.jobs.size,1);assert.equal(music.enabled,false);
  music.stop();assert.equal(h.jobs.size,0);
  music.setScene('locker',99);await flush();assert.equal(h.jobs.size,0);
});
test('music defaults on without starting playback and preserves saved off',()=>{
  const h=harness(),music=h.api.create();assert.equal(music.enabled,true);assert.equal(h.made,0);assert.equal(h.jobs.size,0);
  assert.equal(harness({enabled:false}).api.create().enabled,false);
});

test('locker music is wired before the game and walkout ends before combat',()=>{
  const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
  const html=read('index.html'),game=read('js/game.js');
  assert.ok(html.indexOf('src="js/walkout-music.js')<html.indexOf('src="js/game.js'));
  assert.match(read('service-worker.js'),/walkout-music.js/);
  assert.match(html,/id="homeMusicMeter" role="progressbar"/);
  assert.match(html,/aria-label="Play entrance music">▶ PLAY/);
  assert.match(game,/clearInterval\(homeMusicMeterTimer\)/);
  assert.match(html,/<details class="entrance-music">\s*<summary>/);
  assert.match(html,/ENTRANCE MUSIC<small id="entranceMusicTrackName">The Quiet Before<\/small>/);
  assert.match(game,/\$\('#entranceMusicState'\)\.textContent=/);
  assert.match(game,/scheduleFight\(\(\)=>walkoutMusic.stop\(\),8800\)/);
  assert.match(game,/fightPlanFeature.confirm\(\)\},9000\)/);
  assert.doesNotMatch(game,/setScene\(stage==='planStage'\?'locker'/);
  assert.ok(html.indexOf('id="lockerMusicToggle"')<html.indexOf('id="planStage"'));
  assert.match(html,/id="walkoutProgress" role="progressbar"/);
  assert.match(game,/if\(!fight\|\|walkoutPending\)return/);
});

'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/game.js'),'utf8');
function shareContext(navigator){
  const timers=new Map(),fallbacks=[],button={disabled:false,isConnected:true,textContent:'SHARE'},events=[];
  let timerId=0;
  const context={navigator,openShareFallback:value=>fallbacks.push(value),setTimeout:fn=>{timers.set(++timerId,fn);return timerId},clearTimeout:id=>timers.delete(id)};
  vm.createContext(context);vm.runInContext(source.slice(source.indexOf('  async function shareContent('),source.indexOf('  async function shareFightWin(')),context);
  const options={button,data:{title:'Invite',text:'Join me',url:'https://example.test/invite'},text:'Join me https://example.test/invite',labels:{idle:'SHARE',pending:'SHARING',shared:'SENT',copied:'COPIED',fallback:'SELECT'},fallback:{title:'Copy invite'},onShared:()=>events.push('shared')};
  return {context,options,button,timers,fallbacks,events};
}
test('sharing preserves native payload and blocks overlapping requests',async()=>{
  let resolve,calls=0,payload;
  const h=shareContext({share:data=>{calls++;payload=data;return new Promise(done=>resolve=done)}});
  const pending=h.context.shareContent(h.options);
  assert.equal(h.button.disabled,true);assert.equal(h.button.textContent,'SHARING');
  await h.context.shareContent(h.options);assert.equal(calls,1);
  resolve();await pending;
  assert.equal(payload,h.options.data);assert.equal(h.button.textContent,'SENT');assert.equal(h.button.disabled,false);assert.equal(h.events.length,1);
  [...h.timers.values()][0]();assert.equal(h.button.textContent,'SHARE');
});
test('clipboard fallback includes the invite URL and replaces an old reset timer',async()=>{
  const copied=[],h=shareContext({clipboard:{writeText:async text=>copied.push(text)}});
  await h.context.shareContent(h.options);await h.context.shareContent(h.options);
  assert.deepEqual(copied,[h.options.text,h.options.text]);assert.equal(h.button.textContent,'COPIED');assert.equal(h.timers.size,1);
});
test('cancelled native sharing restores the button without fallback or success event',async()=>{
  const h=shareContext({share:async()=>{throw {name:'AbortError'}}});
  await h.context.shareContent(h.options);
  assert.equal(h.button.textContent,'SHARE');assert.equal(h.button.disabled,false);assert.equal(h.fallbacks.length,0);assert.equal(h.events.length,0);
});
test('blocked clipboard or native sharing opens the manual copy fallback',async()=>{
  for(const navigator of [{},{share:async()=>{throw Error('blocked')}}]){
    const h=shareContext(navigator);await h.context.shareContent(h.options);
    assert.equal(h.fallbacks[0].text,h.options.text);assert.equal(h.fallbacks[0].title,'Copy invite');
    assert.equal(h.button.textContent,'SELECT');assert.equal(h.button.disabled,false);assert.equal(h.events.length,0);
  }
});
function bioContext(){
  const elements=new Map();
  function element(){const classes=new Set(),properties=new Map();return {classes,properties,classList:{add:(...values)=>values.forEach(v=>classes.add(v)),remove:(...values)=>values.forEach(v=>classes.delete(v))},style:{setProperty:(k,v)=>properties.set(k,v),removeProperty:k=>properties.delete(k)},setAttribute(k,v){this[k]=v}}}
  const profile={avatar:'official.png',author:'Official',handle:'@official',bio:'Official bio'},details=[];
  const context={activeBioProfileId:'',$:id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id)},escapeHtml:value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'),sfx:{tap(){}},STRINGS:{social:{profiles:{ceo:profile,media:profile}}},sponsorFeedProfile:id=>id==='missing'?null:{...profile,id},fighterAvatars:[{id:'one',asset:'fighter.png'}],fighterCityCode:()=> 'CHI',fighterAccent:()=> '#abcdef',fighterBioSentence:()=> 'Fighter bio',applyPortraitStyle:el=>el.style.setProperty('--portrait-brightness','1.02'),renderCeoBioDetails:()=>details.push('ceo'),renderReporterBioDetails:()=>details.push('reporter'),renderSponsorBioDetails:()=>details.push('sponsor'),renderFighterBioInteractions:()=>details.push('fighter')};
  vm.createContext(context);vm.runInContext(source.slice(source.indexOf('  function openProfileBio('),source.indexOf('  function rankingProfiles(')),context);
  return {context,elements,details};
}
test('all bio variants render their content and clear previous theme and portrait state',()=>{
  const h=bioContext(),c=h.context,modal=c.$('#fighterBioModal');
  c.openSponsorBio('brand');assert.equal(c.activeBioProfileId,'official-sponsor:brand');assert.ok(modal.classes.has('sponsor-profile'));
  c.openFighterBio({id:'fighter',handle:'Name',city:'chicago',fighter_avatar:'one'});
  assert.equal(modal.classes.has('sponsor-profile'),false);assert.equal(modal.properties.get('--fighter-accent'),'#abcdef');assert.equal(c.$('#fighterBioHandle').textContent,'@Name');assert.match(c.$('#fighterBioAvatar').innerHTML,/fighter.png/);
  c.openCeoBio();assert.ok(modal.classes.has('ceo-profile'));assert.equal(modal.properties.size,0);assert.equal(c.$('#fighterBioText').textContent,'Official bio');
  c.openReporterBio();assert.ok(modal.classes.has('reporter-profile'));assert.equal(modal.classes.has('ceo-profile'),false);assert.equal(modal['aria-hidden'],'false');
  assert.deepEqual(h.details,['sponsor','fighter','ceo','reporter']);
  c.closeFighterBio();assert.equal(modal.classes.size,0);assert.equal(modal['aria-hidden'],'true');
});
test('bio rendering escapes avatar markup, supports missing portraits, and ignores absent profiles',()=>{
  const h=bioContext(),c=h.context;
  c.openFighterBio({id:'fighter',handle:'<Name>',city:'chicago'});assert.equal(c.$('#fighterBioAvatar').innerHTML,'<span>CG</span>');
  c.openFighterBio(null);c.openSponsorBio('missing');assert.equal(c.activeBioProfileId,'fighter');
  c.openProfileBio({id:'safe',name:'<Name>',avatar:'bad"<.png',handle:'@name',bio:'bio',details(){}});
  assert.equal(c.$('#fighterBioAvatar').innerHTML,'<img src="bad&quot;&lt;.png" alt="&lt;Name>">');
});

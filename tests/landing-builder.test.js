const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const LOGIC=require('../js/game-logic.js'),social=require('../js/cage-social.js');
const source=fs.readFileSync(require.resolve('../js/game.js'),'utf8'),landingSource=fs.readFileSync(require.resolve('../js/landing.js'),'utf8');
function landingHarness(state={},sharedFeed={configured:()=>true,loadChampionship:async()=>null,loadFeed:async()=>[]}){
 const nodes=new Map(),$=key=>{if(!nodes.has(key))nodes.set(key,{dataset:{},style:{},classList:{add(){},remove(){}},removeAttribute(){}});return nodes.get(key)};
 const intervals=new Set(),entries=[];let champ=null;
 const ctx={document:{hidden:false,body:{classList:{remove(){}}}},setTimeout,clearTimeout,setInterval:fn=>{intervals.add(fn);return fn},clearInterval:fn=>intervals.delete(fn)};
 vm.createContext(ctx);vm.runInContext(landingSource,ctx);
 const feature=ctx.CAGE_LANDING.createLandingFeature({$,logic:LOGIC,getState:()=>state,getChampionship:()=>champ,setChampionship:value=>champ=value,sharedFeed,sharedUi:{isCurrentChampion:()=>false},trackEvent(){},tap(){},onEntered:mode=>entries.push(mode)});
 return {feature,$,ctx,state,intervals,entries};
}
test('landing displays dated actual feed text and rejects stale, future and malformed posts',async()=>{
 const now=Date.now(),post={author_handle:'CageReporter',created_at:new Date(now-120000).toISOString(),body:'@Rookie signed with Cage Grind.'};
 const h=landingHarness({}, {configured:()=>true,loadChampionship:async()=>({champion_handle:'Champion',defenses:3}),loadFeed:async()=>[post]});
 h.feature.render();await Promise.all([h.feature.loadChampionship(),h.feature.loadActivity()]);
 assert.equal(h.$('#landingChampionName').textContent,'@Champion');assert.match(h.$('#landingChampionMeta').textContent,/3 successful/);
 assert.equal(h.$('#landingActivityBody').textContent,post.body);assert.match(h.$('#landingActivityMeta').textContent,/@CageReporter · 2 MIN AGO/);
 for(const patch of [{created_at:new Date(now-86400000).toISOString()},{created_at:new Date(now+1).toISOString()},{created_at:'bad'},{author_handle:'<script>'},{body:''}])assert.equal(h.ctx.CAGE_LANDING.recentLandingActivity([{...post,...patch}],now),null);
 const literal={...post,body:'<img src=x onerror=alert(1)>'};assert.equal(h.ctx.CAGE_LANDING.recentLandingActivity([literal],now).body,literal.body);
});
test('landing handles vacant, quiet and offline states without disabling career entry',async()=>{
 const h=landingHarness();h.feature.render();await Promise.all([h.feature.loadChampionship(),h.feature.loadActivity()]);
 assert.equal(h.$('#landingChampionName').textContent,'THE BELT IS VACANT');assert.match(h.$('#landingActivityBody').textContent,/No posts in the last 24 hours/);
 const offline=landingHarness({}, {configured:()=>true,loadChampionship:async()=>{throw Error('offline')},loadFeed:async()=>{throw Error('offline')}});
 offline.feature.render();await Promise.all([offline.feature.loadChampionship(),offline.feature.loadActivity()]);
 assert.equal(offline.$('#landingChampionName').textContent,'TITLE UPDATE OFFLINE');assert.match(offline.$('#landingActivityBody').textContent,/unavailable/);assert.notEqual(offline.$('#landingEnterBtn').disabled,true);
});
test('unfinished builds resume once and stop landing refresh; new and completed careers retain landing',()=>{
 const h=landingHarness({fighterCity:'phoenix'});h.feature.render();h.feature.observeFeatures();assert.equal(h.intervals.size,1);
 assert.equal(h.feature.resumeBuild(),true);h.feature.resumeBuild();assert.equal(h.$('#landingPage').hidden,true);assert.deepEqual(h.entries,['building']);assert.equal(h.intervals.size,0);
 for(const state of [{},{fighterCity:'phoenix',fighterAvatar:'fighter-01',fighterStyle:'striker',nameLocked:true}]){
  const other=landingHarness(state);other.feature.render();assert.equal(other.feature.resumeBuild(),false);assert.deepEqual(other.entries,[]);
 }
});
function builderHarness(state){
 const ctx={state,LOGIC,fighterCities:[{id:'phoenix',name:'PHOENIX'},{id:'boston',name:'BOSTON'}],fighterAvatars:[{id:'fighter-01'},{id:'fighter-02'}],rint:(a,b)=>b,validFighterAllocation:LOGIC.validFighterAllocation,trackEvent(){},sfx:{win(){},tap(){}},confettiBurst(){},toast(){},updateUI(){},requestAnimationFrame:fn=>fn(),$:()=>({focus(){},setAttribute(){}})};
 ctx.currentCity=()=>ctx.fighterCities.find(c=>c.id===state.fighterCity);
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function prepareCareerBuilder('),source.indexOf('  function stepFighterAvatar(')),ctx);
 return ctx;
}
test('ready-made build is editable before acceptance and preserves saved drafts',()=>{
 const state={nameLocked:false,fighterCity:'',fighterAvatar:''},h=builderHarness(state);h.prepareCareerBuilder();
 assert.equal(state.fighterCity,'boston');assert.equal(state.fighterDraftAvatar,'fighter-02');assert.equal(LOGIC.validFighterAllocation(state.fighterDraftStats),true);
 const stats=JSON.stringify(state.fighterDraftStats);h.chooseCity('phoenix');assert.equal(state.fighterCity,'phoenix');assert.equal(JSON.stringify(state.fighterDraftStats),stats);assert.equal(state.fighterDraftAvatar,'fighter-02');
 h.prepareCareerBuilder();assert.equal(state.fighterCity,'phoenix');assert.equal(JSON.stringify(state.fighterDraftStats),stats);
 state.fighterAvatar='fighter-02';state.fighterNameDraft='SavedName';state.fighterNameDraftManual=true;h.prepareCareerBuilder();h.chooseCity('boston');
 assert.equal(state.fighterCity,'phoenix');assert.equal(h.identityManualValue,'SavedName');assert.equal(h.identityManualMode,true);
});
test('name claim returns the reserved identity and leaves optional updates to career sync',async()=>{
 const profile={id:'profile',handle:'ReservedName'};let updates=0;
 const client=social.createClient({databaseClient:{claimCageIdentity:async()=>profile,saveCombatStats:()=>{updates++;throw Error('offline')},syncCageFightSkin:()=>new Promise(()=>{}),syncCageRanking:async()=>{updates++;throw Error('offline')}}});
 assert.equal(await client.claimIdentity({candidates:['ReservedName'],combatStats:{power:5}}),profile);await Promise.resolve();assert.equal(updates,0);
});
function identityHarness(){
 const calls=[],state={nameLocked:false,fighterAvatar:'fighter-01'},ctx={state,identityPending:false,identityManualMode:true,identityManualValue:'ChosenName',identitySuggestion:'',identityRetryable:false,identityStatusMessage:'',manualIdentityName:v=>v,normalizeIdentityName:v=>v,sharedProfilePayload:()=>({}),saveState(){},renderCareer(){},currentStyle:()=>true,currentCity:()=>true,currentAvatar:()=>true,SHARED_FEED:{configured:()=>true,claimIdentity:async profile=>{calls.push(profile);throw Error('offline')}},setTimeout,clearTimeout,console:{warn(){}},$:()=>({focus(){}}),toast(){},ensureRookieShowcaseOpponent(){},trackEvent(){},createSocialAccount(){},registerPendingReferral:async()=>{},sfx:{win(){}},confettiBurst(){},updateUI(){},offerRookieShowcase(){},connectSharedSocial(){}};
 vm.createContext(ctx);
 vm.runInContext(source.slice(source.indexOf('  function clearIdentityRetry('),source.indexOf('  function rerollFighterIdentity('))+source.slice(source.indexOf('  async function claimFighterName('),source.indexOf('  function openRetirementDialog(')),ctx);
 return {ctx,calls,state};
}
test('failed name checks preserve the exact request and retry successfully without duplicate concurrent claims',async()=>{
 const {ctx,calls,state}=identityHarness();await ctx.lockFighterIdentity();assert.equal(ctx.identityPending,false);assert.equal(ctx.identityRetryable,true);assert.equal(state.fighterNameDraft,'ChosenName');assert.match(ctx.identityStatusMessage,/saved/);
 let resolve;ctx.SHARED_FEED.claimIdentity=profile=>{calls.push(profile);return new Promise(done=>resolve=done)};
 const retry=ctx.lockFighterIdentity();await ctx.lockFighterIdentity();assert.equal(calls.length,2);assert.deepEqual(calls[0].candidates,calls[1].candidates);
 resolve({id:'id',handle:'ChosenName'});await retry;assert.equal(state.nameLocked,true);assert.equal(state.name,'ChosenName');assert.equal(state.fighterNameDraft,'');assert.equal(ctx.identityRetryable,false);
});
test('a taken manual name asks for a different name rather than retrying automatically',async()=>{
 const {ctx,state}=identityHarness();ctx.SHARED_FEED.claimIdentity=async()=>{throw Error('No unique Cage Grind name available')};await ctx.lockFighterIdentity();
 assert.equal(state.nameLocked,false);assert.equal(ctx.identityRetryable,false);assert.match(ctx.identityStatusMessage,/already on the roster/);
});

test('a stalled name request releases the form for retry without applying a late response',async()=>{
 const {ctx,state}=identityHarness();let expire,resolve,cleared=false;
 ctx.setTimeout=fn=>{expire=fn;return 1};ctx.clearTimeout=()=>cleared=true;
 ctx.SHARED_FEED.claimIdentity=()=>new Promise(done=>resolve=done);
 const attempt=ctx.lockFighterIdentity();expire();await attempt;
 assert.equal(ctx.identityPending,false);assert.equal(ctx.identityRetryable,true);assert.equal(state.nameLocked,false);assert.equal(cleared,true);
 resolve({id:'late',handle:'ChosenName'});await Promise.resolve();assert.equal(state.nameLocked,false);
});

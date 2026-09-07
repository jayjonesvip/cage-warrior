const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const game=fs.readFileSync(path.join(__dirname,'../js/game.js'),'utf8');
const block=game.slice(game.indexOf('      const establishedCareer='),game.indexOf('      sharedSocialProfiles=[profile,'));
test('feed pagination cannot reintroduce existing careers',async()=>{
  for(const [wins,losses,initialized,expectedPosts] of [[11,4,false,0],[0,1,false,0],[0,0,true,0],[0,0,false,1]]){
    let published=0;const context={state:{wins,losses,socialRemoteInitialized:initialized,socialAccountCreated:true},postsLoaded:true,hasOwnRemotePost:false,posts:[],profile:{id:'fighter'},saveState(){},SHARED_FEED:{publishPost:async()=>published++,loadFeed:async()=>[]}};
    vm.createContext(context);await vm.runInContext('(async()=>{'+block+'})()',context);
    assert.equal(published,expectedPosts);assert.equal(context.state.socialRemoteInitialized,true);
    await vm.runInContext('(async()=>{'+block+'})()',context);assert.equal(published,expectedPosts);
  }
});

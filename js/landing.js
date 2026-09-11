(function(root){
  'use strict';

  function recentLandingActivity(posts,now=Date.now()){
    return (Array.isArray(posts)?posts:[]).filter(post=>{
      const at=Date.parse(post?.created_at);
      return Number.isFinite(at)&&at<=now&&now-at<86400000&&/^[A-Za-z][A-Za-z0-9_]{2,31}$/.test(String(post.author_handle||'').replace(/^@/,''))&&typeof post.body==='string'&&post.body.trim();
    }).sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at))[0]||null;
  }
  function createLandingFeature(options){
    const {$,logic,getState,getRank,getChampionship,setChampionship,sharedFeed,sharedUi,trackEvent,tap,onEntered,onChampionshipChange}=options;
    let mode='new',entered=false,championshipLoaded=false,championshipUnavailable=false,championshipPending=false,activityPending=false,activityLoaded=false,activityUnavailable=false,activityPosts=[],refreshTimer=null;
    function renderChampionship(){
      const proof=logic.landingChampionshipProof(championshipUnavailable?null:getChampionship(),championshipLoaded,championshipUnavailable);
      $('#landingChampionName').textContent=proof.heading;$('#landingChampionMeta').textContent=proof.state==='offline'?'You can still build your fighter.':proof.meta;
      $('#landingChampion').dataset.state=proof.state;
    }
    function renderActivity(){
      const post=recentLandingActivity(activityPosts),body=$('#landingActivityBody'),meta=$('#landingActivityMeta');
      if(activityUnavailable){body.textContent='Cage feed updates are unavailable right now.';meta.textContent='FEED UPDATE OFFLINE';return}
      if(!post){body.textContent=activityLoaded?'No posts in the last 24 hours. Your story could be next.':'Checking the latest cage activity…';meta.textContent='FROM THE CAGE FEED';return}
      const minutes=Math.floor((Date.now()-Date.parse(post.created_at))/60000),age=minutes<1?'JUST NOW':minutes<60?`${minutes} MIN AGO`:`${Math.floor(minutes/60)} HR AGO`,text=post.body.trim().replace(/\s+/g,' ');
      body.textContent=text.length>180?text.slice(0,177)+'…':text;meta.textContent=`@${String(post.author_handle).replace(/^@/,'')} · ${age}`;
    }
    function render(){
      const state=getState();mode=logic.careerLandingMode(state);const returning=mode==='returning',building=mode==='building',champion=returning&&sharedUi.isCurrentChampion(getChampionship(),state),page=$('#landingPage');page.dataset.mode=mode;
      $('#landingEyebrow').textContent=champion?'THE CHAMP IS BACK':returning?'YOUR CAREER CONTINUES':building?'FIGHTER BUILD IN PROGRESS':'YOUR NAME. YOUR FIGHT. YOUR LEGACY.';
      $('#landingTitleLead').textContent=returning?'WELCOME BACK,':building?'FINISH YOUR':'BUILD. FIGHT.';
      const titleAccent=$('#landingTitleAccent');titleAccent.textContent=returning?state.name:building?'FIGHTER BUILD.':'BECOME.';titleAccent.style.fontSize=returning?`${Math.max(.32,Math.min(.88,10.5/String(state.name||'').length))}em`:'';
      $('#landingDescription').textContent=returning?'Your next opponent is waiting. Step back into the cage.':building?'Your choices are saved. Pick up your fighter build where you left off.':'Create your fighter. Claim your name on the shared roster. Step into your first fight.';
      $('#landingEnterBtn').textContent=returning?'CONTINUE CAREER →':building?'CONTINUE YOUR BUILD →':'START YOUR CAREER →';
      $('#landingDetailOne').textContent=returning?`LEVEL ${state.level}`:building?'PROGRESS SAVED':'FREE TO PLAY';
      $('#landingDetailTwo').textContent=returning?`${state.wins}-${state.losses} PRO`:building?'FINISH YOUR FIGHTER':'NO DOWNLOAD';
      $('#landingDetailThree').textContent=returning?(champion?'WORLD CHAMPION':getRank?.()||'CAREER ACTIVE'):building?'SAVES AUTOMATICALLY':'PLAY INSTANTLY';
      renderChampionship();renderActivity();
    }
    async function withDeadline(load){
      let timer;try{return await Promise.race([Promise.resolve().then(load),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Landing update timed out')),8000)})])}finally{clearTimeout(timer)}
    }
    async function loadChampionship(force=false){
      if(championshipPending||(championshipLoaded&&!force))return;
      if(!sharedFeed?.configured?.()){setAvailability(null,true,true);return}
      championshipPending=true;
      try{setAvailability(await withDeadline(()=>sharedFeed.loadChampionship())||null,true,false)}catch{championshipLoaded=true;championshipUnavailable=true;renderChampionship()}finally{championshipPending=false}
    }
    async function loadActivity(){
      if(activityPending||entered)return;
      if(!sharedFeed?.configured?.()){activityLoaded=true;activityUnavailable=true;renderActivity();return}
      activityPending=true;
      try{activityPosts=await withDeadline(()=>sharedFeed.loadFeed(20));activityLoaded=true;activityUnavailable=false}catch{activityLoaded=true;activityUnavailable=true}finally{activityPending=false;renderActivity()}
    }
    function setAvailability(championship,loaded=true,unavailable=false){
      setChampionship(championship);championshipLoaded=loaded;championshipUnavailable=unavailable;render();onChampionshipChange?.();
    }
    function observeFeatures(){
      if(entered||refreshTimer)return;
      loadChampionship();loadActivity();
      refreshTimer=setInterval(()=>{if(!document.hidden&&!entered){loadChampionship(true);loadActivity()}},60000);
    }
    function enter({automatic=false}={}){
      if(entered)return;entered=true;if(refreshTimer){clearInterval(refreshTimer);refreshTimer=null}
      const page=$('#landingPage'),button=$('#landingEnterBtn'),entryMode=mode;button.disabled=true;trackEvent('landing_enter',{career_state:entryMode,automatic});if(!automatic)tap();page.classList.add('leaving');
      const finish=()=>{page.hidden=true;page.classList.remove('leaving');document.body.classList.remove('landing-active');$('#app').removeAttribute('aria-hidden');$('.screen[data-screen="home"]').scrollTop=0;trackEvent('game_screen_view',{screen_name:'home',entry_point:automatic?'build_resume':'landing'});onEntered(entryMode)};
      if(automatic)finish();else setTimeout(finish,230);
    }
    function resumeBuild(){if(logic.careerLandingMode(getState())!=='building')return false;enter({automatic:true});return true}
    function status(){return {mode,championshipLoaded,championshipUnavailable}}
    return {render,renderChampionship,loadChampionship,loadActivity,observeFeatures,enter,resumeBuild,setAvailability,status};
  }
  root.CAGE_LANDING={createLandingFeature,recentLandingActivity};
})(globalThis);

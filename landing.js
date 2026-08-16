(function(root){
  'use strict';

  function createLandingFeature(options){
    const {$,logic,getState,getChampionship,setChampionship,sharedFeed,trackEvent,tap,onEntered}=options;
    let mode='new',entered=false,championshipLoaded=false,championshipUnavailable=false,featureViewed=false;

    function renderChampionship(){
      const heading=$('#landingChampionHeading'),meta=$('#landingChampionMeta');if(!heading||!meta)return;
      const proof=logic.landingChampionshipProof(getChampionship(),championshipLoaded,championshipUnavailable);heading.textContent=proof.heading;meta.textContent=proof.meta;
    }
    function render(){
      const state=getState();mode=logic.careerLandingMode(state);const returning=mode==='returning',building=mode==='building',page=$('#landingPage');page.dataset.mode=mode;
      $('#landingEyebrow').textContent=returning?'YOUR CAREER IS WAITING':building?'FIGHTER BUILD IN PROGRESS':'YOUR FIGHT STARTS HERE';
      $('#landingTitleLead').textContent=returning?'WELCOME BACK,':building?'FINISH YOUR':'BUILD YOUR MMA FIGHTER.';
      $('#landingTitleAccent').textContent=returning?state.name:building?'FIGHTER BUILD':'BECOME WORLD CHAMPION.';
      $('#landingDescription').textContent=returning?'Your fight plan and your rivals are waiting. Pick up the climb exactly where you left it.':building?'Your fighter is saved on this device. Finish the permanent choices, lock in a unique name, and start the climb.':'Train, hustle, choose fight strategies, earn sponsors, and climb a shared world ranking.';
      $('#landingEnterBtn').textContent=returning?'CONTINUE CAREER':building?'CONTINUE YOUR BUILD':'PLAY FREE NOW';
      const stats=$('#landingCareerStats');stats.hidden=!returning;if(returning){$('#landingRank').textContent=`LVL ${state.level}`;$('#landingRecord').textContent=`${state.wins}-${state.losses}`;$('#landingFollowers').textContent=Number(state.fans||0).toLocaleString()}
      renderChampionship();
    }
    async function loadChampionship(){
      if(championshipLoaded)return;
      if(!sharedFeed?.configured?.()){setAvailability(null,true,true);return}
      try{setAvailability(await sharedFeed.loadChampionship()||null,true,false)}catch{setAvailability(null,true,true)}
    }
    function setAvailability(championship,loaded=true,unavailable=false){
      setChampionship(championship);championshipLoaded=loaded;championshipUnavailable=unavailable;renderChampionship();
    }
    function observeFeatures(){
      const features=$('#landingFeatures');if(!features||mode!=='new'||typeof IntersectionObserver!=='function')return;
      const observer=new IntersectionObserver(entries=>{if(featureViewed||!entries.some(entry=>entry.isIntersecting))return;featureViewed=true;trackEvent('landing_feature_view',{career_state:'new'});observer.disconnect()},{threshold:.35});observer.observe(features);
    }
    function enter(){
      if(entered)return;entered=true;const page=$('#landingPage'),button=$('#landingEnterBtn'),entryMode=mode;button.disabled=true;trackEvent('landing_enter',{career_state:entryMode});tap();page.classList.add('leaving');
      setTimeout(()=>{page.hidden=true;page.classList.remove('leaving');document.body.classList.remove('landing-active');$('#app').removeAttribute('aria-hidden');$('.screen[data-screen="home"]').scrollTop=0;trackEvent('game_screen_view',{screen_name:'home',entry_point:'landing'});onEntered()},230);
    }
    function status(){return {mode,championshipLoaded,championshipUnavailable}}
    return {render,renderChampionship,loadChampionship,observeFeatures,enter,setAvailability,status};
  }

  root.CAGE_LANDING={createLandingFeature};
})(globalThis);

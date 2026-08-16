(function(root){
  'use strict';

  function createLandingFeature(options){
    const {$,logic,getState,getAvatar,getChampionship,setChampionship,sharedFeed,sharedUi,trackEvent,tap,onEntered}=options;
    let mode='new',entered=false,championshipLoaded=false,championshipUnavailable=false,featureViewed=false;

    function renderChampionship(){
      sharedUi.renderChampionshipCard($('#landingChampionPanel'),{championship:getChampionship(),state:getState(),loaded:championshipLoaded,unavailable:championshipUnavailable,headingId:'landingChampionHeading'});
    }
    function render(){
      const state=getState();mode=logic.careerLandingMode(state);const returning=mode==='returning',building=mode==='building',champion=returning&&getChampionship()?.is_champion===true,page=$('#landingPage');page.dataset.mode=mode;
      $('#landingEyebrow').textContent=champion?'THE CHAMP IS BACK':returning?'YOUR CAREER IS WAITING':building?'FIGHTER BUILD IN PROGRESS':'YOUR FIGHT STARTS HERE';
      $('#landingTitleLead').textContent=champion?'WELCOME BACK, CHAMP!':returning?'WELCOME BACK,':building?'FINISH YOUR':'BUILD YOUR MMA FIGHTER.';
      $('#landingTitleAccent').textContent=returning?state.name:building?'FIGHTER BUILD':'BECOME WORLD CHAMPION.';
      $('#landingDescription').textContent=returning?'Your fight plan and your rivals are waiting. Pick up the climb exactly where you left it.':building?'Your fighter is saved on this device. Finish the permanent choices, lock in a unique name, and start the climb.':'Train, hustle, choose fight strategies, earn sponsors, and climb a shared world ranking.';
      $('#landingEnterBtn').textContent=returning?'CONTINUE CAREER':building?'CONTINUE YOUR BUILD':'PLAY FREE NOW';
      const fighterVisual=$('#landingFighterVisual'),portrait=$('#landingFighterAvatar'),record=$('#landingProRecord'),avatar=returning?getAvatar?.():null,newCareer=mode==='new';fighterVisual.hidden=building||(returning&&!avatar);record.hidden=!returning;fighterVisual.classList.toggle('is-silhouette',newCareer);fighterVisual.setAttribute('aria-label',returning?`${state.wins}-${state.losses} pro record`:'Unselected fighter');if(returning&&avatar){$('#landingRecord').textContent=`${state.wins}-${state.losses}`;portrait.src=avatar.asset;portrait.alt=`${state.name} fighter portrait`}else if(newCareer){portrait.src='assets/fighter-silhouette-1.png';portrait.alt='Fighter silhouette'}
      renderChampionship();
    }
    async function loadChampionship(){
      if(championshipLoaded)return;
      if(!sharedFeed?.configured?.()){setAvailability(null,true,true);return}
      try{setAvailability(await sharedFeed.loadChampionship()||null,true,false)}catch{setAvailability(null,true,true)}
    }
    function setAvailability(championship,loaded=true,unavailable=false){
      setChampionship(championship);championshipLoaded=loaded;championshipUnavailable=unavailable;render();
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

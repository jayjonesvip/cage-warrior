(function(root){
  'use strict';

  function createLandingFeature(options){
    const {$,logic,getState,getRank,getChampionship,setChampionship,sharedFeed,sharedUi,trackEvent,tap,onEntered,onChampionshipChange}=options;
    let mode='new',entered=false,championshipLoaded=false,championshipUnavailable=false;

    function renderChampionship(){return null}
    function render(){
      const state=getState();mode=logic.careerLandingMode(state);const returning=mode==='returning',building=mode==='building',champion=returning&&sharedUi.isCurrentChampion(getChampionship(),state),page=$('#landingPage');page.dataset.mode=mode;
      $('#landingEyebrow').textContent=champion?'THE CHAMP IS BACK':returning?'YOUR CAREER CONTINUES':building?'FIGHTER BUILD IN PROGRESS':'THE FIGHT STARTS NOW';
      $('#landingTitleLead').textContent=returning?'WELCOME BACK,':building?'FINISH YOUR':'BUILD. FIGHT.';
      const titleAccent=$('#landingTitleAccent');titleAccent.textContent=returning?state.name:building?'FIGHTER BUILD.':'BECOME.';titleAccent.style.fontSize=returning?`${Math.max(.32,Math.min(.88,10.5/String(state.name||'').length))}em`:'';
      $('#landingDescription').textContent=returning?'Your next opponent is ready, and there’s still a championship to win.':building?'Your fighter is saved on this device. Finish the permanent choices, lock in a unique name, and start the climb.':'Start with nothing. Fight, improve, and grind your way from unknown rookie to cage champion.';
      $('#landingEnterBtn').textContent=returning?'CONTINUE CAREER →':building?'CONTINUE YOUR BUILD →':'START YOUR CAREER →';
      $('#landingDetailOne').textContent=returning?`LEVEL ${state.level}`:building?'PROGRESS SAVED':'FREE TO PLAY';
      $('#landingDetailTwo').textContent=returning?`${state.wins}-${state.losses} PRO`:building?'FINISH YOUR FIGHTER':'NO DOWNLOAD';
      $('#landingDetailThree').textContent=returning?(champion?'WORLD CHAMPION':getRank?.()||'CAREER ACTIVE'):building?'SAVES AUTOMATICALLY':'PLAY INSTANTLY';
    }
    async function loadChampionship(){
      if(championshipLoaded)return;
      if(!sharedFeed?.configured?.()){setAvailability(null,true,true);return}
      try{setAvailability(await sharedFeed.loadChampionship()||null,true,false)}catch{setAvailability(null,true,true)}
    }
    function setAvailability(championship,loaded=true,unavailable=false){
      setChampionship(championship);championshipLoaded=loaded;championshipUnavailable=unavailable;render();onChampionshipChange?.();
    }
    function observeFeatures(){return null}
    function enter(){
      if(entered)return;entered=true;const page=$('#landingPage'),button=$('#landingEnterBtn'),entryMode=mode;button.disabled=true;trackEvent('landing_enter',{career_state:entryMode});tap();page.classList.add('leaving');
      setTimeout(()=>{page.hidden=true;page.classList.remove('leaving');document.body.classList.remove('landing-active');$('#app').removeAttribute('aria-hidden');$('.screen[data-screen="home"]').scrollTop=0;trackEvent('game_screen_view',{screen_name:'home',entry_point:'landing'});onEntered()},230);
    }
    function status(){return {mode,championshipLoaded,championshipUnavailable}}
    return {render,renderChampionship,loadChampionship,observeFeatures,enter,setAvailability,status};
  }

  root.CAGE_LANDING={createLandingFeature};
})(globalThis);

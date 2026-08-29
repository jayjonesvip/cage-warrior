(function(root){
  'use strict';

  function resetCopy(championship){
    const reset=new Date(championship?.cooldown_until||'');
    if(!Number.isFinite(reset.getTime()))return 'AVAILABLE AT MIDNIGHT';
    return `AVAILABLE IN ${formatDuration(Math.max(0,reset.getTime()-Date.now()))}`;
  }

  function formatDuration(milliseconds){
    const seconds=Math.max(0,Math.ceil(Number(milliseconds)/1000)||0),hours=Math.floor(seconds/3600),minutes=Math.floor(seconds%3600/60),remaining=seconds%60;
    return [hours,minutes,remaining].map(value=>String(value).padStart(2,'0')).join(':');
  }

  function normalizedFighterHandle(value){
    return String(value||'').trim().replace(/^@/,'').toLowerCase();
  }

  function isCurrentChampion(championship,state={}){
    if(championship?.is_champion===true)return true;
    const championHandle=normalizedFighterHandle(championship?.champion_handle),fighterHandle=normalizedFighterHandle(state.name);
    return !!championHandle&&championHandle===fighterHandle;
  }

  function resolveChampionshipIdentity(value,state={}){
    const championship=value&&typeof value==='object'?value:null;
    if(!championship)return championship;
    if(championship.is_champion===true||isCurrentChampion(championship,state))return Object.assign({},championship,{is_champion:true,challenge_eligible:false,rematch_blocked:false,level_eligible:true,daily_bout_used:false,eligibility_status:'champion',former_champion:false,former_champion_rematch:false});
    if(!championship.champion_id)return championship;
    const blocked=championship.daily_bout_used===true||championship.rematch_blocked===true;
    return Object.assign({},championship,{level_eligible:true,challenge_eligible:!blocked,eligibility_status:blocked?championship.eligibility_status:'eligible'});
  }

  function championshipCardModel({championship,state={},loaded=false,unavailable=false}={}){
    const champ=resolveChampionshipIdentity(championship,state);
    const defenses=Math.max(0,Math.floor(Number(champ?.defenses))||0);
    const status=String(champ?.eligibility_status||'');
    const model={eyebrow:'CAGE GRIND · ONE BELT',title:'WORLD CHAMPIONSHIP',kicker:'TITLE STATUS',headline:'CHECKING THE WORLD CHAMPION',meta:'Loading the current champion and title requirements.'};
    if(champ?.is_champion){
      model.kicker='REIGNING WORLD CHAMPION';model.headline='YOU ARE THE WORLD CHAMPION';model.meta=`${defenses} SUCCESSFUL DEFENSE${defenses===1?'':'S'}`;
    }else if(champ?.champion_handle){
      const championHandle=`@${champ.champion_handle}`;
      if(champ.former_champion){
        model.kicker='FORMER WORLD CHAMPION';model.headline=champ.last_title_loss_opponent_handle?`LOST THE BELT TO @${champ.last_title_loss_opponent_handle}`:championHandle;model.meta=status==='daily_bout_used'?resetCopy(champ):champ.former_champion_rematch?`TITLE REMATCH AVAILABLE AGAINST ${championHandle}`:'ONE TITLE ATTEMPT AVAILABLE';
      }else{
        model.kicker='CURRENT WORLD CHAMPION';model.headline=championHandle;model.meta=status==='daily_bout_used'?resetCopy(champ):'ONE TITLE ATTEMPT AVAILABLE';
      }
    }else if(loaded&&!unavailable){
      model.kicker='BELT VACANT';model.headline='THE WORLD TITLE IS OPEN';model.meta='ONE BELT · RANKED FIGHTERS ONLY';
    }else if(unavailable){
      model.kicker='CAGE NETWORK OFFLINE';model.headline='CHAMPIONSHIP UPDATE UNAVAILABLE';model.meta='Regular fights are still available.';
    }
    return model;
  }

  function renderChampionshipCard(card,options={}){
    if(!card)return null;
    const model=championshipCardModel(options),headingId=options.headingId||'',assetVersion=options.assetVersion||document.querySelector('meta[name="app-version"]')?.content||'';
    if(!card.querySelector('[data-world-title-role="title"]'))card.innerHTML='<div class="world-title-emblem"><img data-world-title-role="icon" alt="" width="92" height="92"></div><div class="world-title-copy"><small data-world-title-role="eyebrow"></small><h2 data-world-title-role="title"></h2><span data-world-title-role="kicker"></span><b data-world-title-role="headline"></b><p data-world-title-role="meta"></p></div>';
    card.classList.add('world-title-card');
    const icon=card.querySelector('[data-world-title-role="icon"]');icon.src=`assets/icons/title-world.png${assetVersion?`?v=${assetVersion}`:''}`;
    const title=card.querySelector('[data-world-title-role="title"]');if(headingId)title.id=headingId;
    for(const key of ['eyebrow','title','kicker','headline','meta'])card.querySelector(`[data-world-title-role="${key}"]`).textContent=model[key];
    return model;
  }

  root.CAGE_SHARED_UI={championshipCardModel,renderChampionshipCard,championshipResetCopy:resetCopy,isCurrentChampion,resolveChampionshipIdentity};
})(globalThis);

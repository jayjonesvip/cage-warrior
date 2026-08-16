(function(root){
  'use strict';

  function resetCopy(championship){
    const reset=new Date(championship?.cooldown_until||'');
    if(!Number.isFinite(reset.getTime()))return 'THE TITLE WINDOW REOPENS AT UTC MIDNIGHT';
    return `TITLE WINDOW REOPENS ${reset.toLocaleString([],{weekday:'short',hour:'numeric',minute:'2-digit'})}`.toUpperCase();
  }

  function normalizedFighterHandle(value){
    return String(value||'').trim().replace(/^@/,'').toLowerCase();
  }

  function isCurrentChampion(championship,state={}){
    if(championship?.is_champion===true)return true;
    const championHandle=normalizedFighterHandle(championship?.champion_handle),fighterHandle=normalizedFighterHandle(state.name);
    return !!championHandle&&championHandle===fighterHandle;
  }

  function championshipCardModel({championship,state={},loaded=false,unavailable=false}={}){
    const champ=championship&&typeof championship==='object'?championship:null;
    const level=Math.max(1,Math.floor(Number(state.level))||1);
    const defenses=Math.max(0,Math.floor(Number(champ?.defenses))||0);
    const status=String(champ?.eligibility_status||'');
    const model={eyebrow:'CAGE GRIND · ONE BELT',title:'WORLD CHAMPIONSHIP',kicker:'TITLE STATUS',headline:'CONNECTING TO WORLD TITLE',meta:'Loading the current champion and title requirements.'};
    if(isCurrentChampion(champ,state)){
      model.kicker='REIGNING WORLD CHAMPION';model.headline='YOU HOLD THE BELT';model.meta=`${defenses} SUCCESSFUL DEFENSE${defenses===1?'':'S'} · EVERY REAL-USER FIGHT PUTS IT ON THE LINE`;
    }else if(champ?.champion_handle){
      const championHandle=`@${champ.champion_handle}`,requiredLevel=Math.max(1,Math.floor(Number(champ.champion_level))||1);
      if(champ.former_champion){
        model.kicker='FORMER WORLD CHAMPION';model.headline=champ.last_title_loss_opponent_handle?`LOST THE BELT TO @${champ.last_title_loss_opponent_handle}`:championHandle;model.meta=status==='daily_bout_used'?resetCopy(champ):champ.former_champion_rematch?`TITLE REMATCH AVAILABLE AGAINST ${championHandle}`:level>=requiredLevel?`YOU REMAIN A TITLE CONTENDER · FIND ${championHandle} ON THE FIGHT PAGE`:`REACH LEVEL ${requiredLevel} TO CONTEND AGAIN`;
      }else{
        model.kicker=level>=requiredLevel?'TITLE CONTENDER':'CURRENT WORLD CHAMPION';model.headline=championHandle;model.meta=status==='daily_bout_used'?resetCopy(champ):champ.challenge_eligible?`YOU'RE ELIGIBLE · CHAMPION LVL ${requiredLevel} · YOU LVL ${level}`:`REACH LEVEL ${requiredLevel} TO CHALLENGE FOR THE BELT`;
      }
    }else if(loaded&&!unavailable){
      model.kicker='BELT VACANT';model.headline='THE WORLD TITLE IS OPEN';model.meta='ONE BELT · REAL FIGHTERS ONLY';
    }else if(unavailable){
      model.kicker='CAGE NETWORK OFFLINE';model.headline='TITLE UPDATE UNAVAILABLE';model.meta='Reconnect to load the current champion.';
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

  root.CAGE_SHARED_UI={championshipCardModel,renderChampionshipCard,championshipResetCopy:resetCopy,isCurrentChampion};
})(globalThis);

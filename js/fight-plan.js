(function(root){
  'use strict';

  function createFightPlanFeature(options){
    const {$,$$,getFight,getState,isCombatLocked,currentStyle,escapeHtml,showFightStage,saveState,trackEvent,tap,beginFight}=options;
    function label(plan=getFight()?.gamePlan){return `${plan?.pace==='fast'?'Fast':'Slow'} · ${plan?.offense==='aggressive'?'Aggressive':'Conservative'} · ${plan?.tactics==='adapt'?'Adapt':'Stick to Style'}`}
    function render(){
      const fight=getFight();if(!fight)return;
      const plan=fight.gamePlan,fast=plan.pace==='fast',aggressive=plan.offense==='aggressive',adapt=plan.tactics==='adapt',cardioEdge=fight.player.cardio-fight.opp.cardio,signature=getState().fighterStyle||'striker',responseStyle=fight.o.tendency==='grappler'?'striker':'grappler',signatureAnswers=signature===responseStyle,opponentStyle=String(fight.o.tag||'UNKNOWN STYLE').toUpperCase(),signatureLabel=String(currentStyle()?.name||signature).toUpperCase(),responseLabel=responseStyle.toUpperCase();
      const outputReason=fast&&aggressive?(cardioEdge>0?'Your cardio edge funds high output; power entries add damage and counter risk.':'High output chases damage, but taxes cardio and opens counters.'):fast?'Fast volume spends cardio while safer shots limit counter risk.':aggressive?'Measured output saves cardio for selective power attacks.':'Low-risk output preserves cardio, trading away damage and knockdowns.';
      const tacticReason=adapt?(signatureAnswers?`Adapt adds flexibility, though ${signatureLabel} already answers this ${opponentStyle}.`:`Adapt targets this ${opponentStyle} by shifting toward ${responseLabel} after Round 1.`):(signatureAnswers?`${signatureLabel} directly answers this ${opponentStyle}; sticking keeps full familiarity.`:`Sticking preserves ${signatureLabel} familiarity, but gives this ${opponentStyle} the style edge.`);
      $$('[data-plan-setting]').forEach(button=>button.setAttribute('aria-pressed',String(plan[button.dataset.planSetting]===button.dataset.planValue)));$('#fightPlanSummary').innerHTML=`<b>${label(plan)}</b><strong>OPPONENT STYLE · ${escapeHtml(opponentStyle)}</strong><span class="fight-plan-reason"><i aria-hidden="true">↯</i><span>${escapeHtml(outputReason)}</span></span><span class="fight-plan-reason"><i aria-hidden="true">✥</i><span>${escapeHtml(tacticReason)}</span></span>`;
    }
    function begin(){const fight=getFight();if(!fight)return;fight.gamePlan=Object.assign({},getState().fightPlanPreference);showFightStage('planStage');render();trackEvent('fight_plan_presented',{pace:fight.gamePlan.pace,offense:fight.gamePlan.offense,tactics:fight.gamePlan.tactics})}
    function select(setting,value){const fight=getFight();if(!fight||!isCombatLocked())return;const valid={pace:['slow','fast'],offense:['conservative','aggressive'],tactics:['stick','adapt']};if(!valid[setting]?.includes(value))return;fight.gamePlan[setting]=value;render();tap()}
    function confirm(){const fight=getFight();if(!fight)return;getState().fightPlanPreference=Object.assign({},fight.gamePlan);saveState();trackEvent('fight_plan_locked',{pace:fight.gamePlan.pace,offense:fight.gamePlan.offense,tactics:fight.gamePlan.tactics,cardio_edge:Number((fight.player.cardio-fight.opp.cardio).toFixed(2))});beginFight();tap()}
    return {label,render,begin,select,confirm};
  }

  root.CAGE_FIGHT_PLAN={createFightPlanFeature};
})(globalThis);

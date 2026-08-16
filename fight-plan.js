(function(root){
  'use strict';

  function createFightPlanFeature(options){
    const {$,$$,getFight,getState,isCombatLocked,currentStyle,escapeHtml,showFightStage,saveState,trackEvent,tap,beginFocus}=options;
    function label(plan=getFight()?.gamePlan){return `${plan?.pace==='fast'?'Fast':'Slow'} · ${plan?.offense==='aggressive'?'Aggressive':'Conservative'} · ${plan?.tactics==='adapt'?'Adapt':'Stick to Style'}`}
    function render(){
      const fight=getFight();if(!fight)return;const plan=fight.gamePlan,fast=plan.pace==='fast',aggressive=plan.offense==='aggressive',adapt=plan.tactics==='adapt',cardioEdge=fight.player.cardio-fight.opp.cardio,paceText=fast?(cardioEdge>0?'Your cardio edge supports a higher-output fight.':'Fast pace raises fatigue risk without a cardio edge.'):'Fewer exchanges conserve cardio for the later rounds.',offenseText=aggressive?'Power shots raise damage and knockout chances, but lower accuracy and expose counters.':'Jabs and safer attacks improve accuracy and defense at the cost of damage and knockdowns.',tacticsText=adapt?'Use your natural style in Round 1, partially adjust in Round 2, and fully adapt in Round 3. Focus controls execution.':`Trust your ${currentStyle()?.name||'signature'} style with full familiarity all fight.`;$$('[data-plan-setting]').forEach(button=>button.setAttribute('aria-pressed',String(plan[button.dataset.planSetting]===button.dataset.planValue)));$('#fightPlanSummary').innerHTML=`<b>${label(plan)}</b><strong>OPPONENT STYLE · ${escapeHtml(fight.o.tag||'UNKNOWN STYLE')}</strong>${paceText} ${offenseText} ${tacticsText}`;
    }
    function begin(){const fight=getFight();if(!fight)return;fight.gamePlan=Object.assign({},getState().fightPlanPreference);showFightStage('planStage');$('#fightControls').classList.add('hidden');render();trackEvent('fight_plan_presented',{pace:fight.gamePlan.pace,offense:fight.gamePlan.offense,tactics:fight.gamePlan.tactics})}
    function select(setting,value){const fight=getFight();if(!fight||!isCombatLocked())return;const valid={pace:['slow','fast'],offense:['conservative','aggressive'],tactics:['stick','adapt']};if(!valid[setting]?.includes(value))return;fight.gamePlan[setting]=value;render();tap()}
    function confirm(){const fight=getFight();if(!fight)return;getState().fightPlanPreference=Object.assign({},fight.gamePlan);saveState();trackEvent('fight_plan_locked',{pace:fight.gamePlan.pace,offense:fight.gamePlan.offense,tactics:fight.gamePlan.tactics,cardio_edge:Number((fight.player.cardio-fight.opp.cardio).toFixed(2))});beginFocus();tap()}
    return {label,render,begin,select,confirm};
  }

  root.CAGE_FIGHT_PLAN={createFightPlanFeature};
})(globalThis);

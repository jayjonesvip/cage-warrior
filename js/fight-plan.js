(function(root){
  'use strict';

  function createFightPlanFeature(options){
    const {$,$$,getFight,getState,isCombatLocked,currentStyle,escapeHtml,showFightStage,saveState,trackEvent,tap,beginFight}=options;
    function label(plan=getFight()?.gamePlan){return `${plan?.pace==='fast'?'Fast':'Slow'} · ${plan?.offense==='aggressive'?'Aggressive':'Conservative'} · ${plan?.tactics==='adapt'?'Adapt':'Stick to Style'}`}
    function render(){
      const fight=getFight();if(!fight)return;
      const plan=fight.gamePlan,fast=plan.pace==='fast',aggressive=plan.offense==='aggressive',adapt=plan.tactics==='adapt',cardioEdge=fight.player.cardio-fight.opp.cardio,speedEdge=fight.player.speed-fight.opp.speed,powerTest=fight.player.power-fight.opp.chin,counterRisk=fight.opp.power-fight.player.chin,signature=getState().fighterStyle||'striker',responseStyle=fight.o.tendency==='grappler'?'striker':'grappler',signatureAnswers=signature===responseStyle;
      const paceText=fast?(cardioEdge>0?'Your cardio edge supports a higher-output fight.':'Fast pace raises fatigue risk without a cardio edge.'):cardioEdge>1?'A measured pace saves energy, but leaves part of your cardio edge unused.':'Fewer exchanges conserve cardio for the later rounds.';
      const offenseText=aggressive?(powerTest>=2?'Your Power can test their Chin, but committed attacks expose counters.':counterRisk>=2?'Their Power threatens your Chin; aggressive entries increase that danger.':'Power shots raise damage and knockout chances, but lower accuracy and expose counters.'):(speedEdge>=2?'Your Speed edge supports accurate, lower-risk offense.':speedEdge<0?'Without a Speed edge, safer offense may surrender initiative.':'Jabs and safer attacks improve accuracy and defense at the cost of damage and knockdowns.');
      const tacticsText=adapt?(signatureAnswers?'Your signature style already answers this matchup. Adapting trades familiarity for an unnecessary switch.':'This matchup calls for a style response. You will adjust in Rounds 2 and 3 as the fight develops.'):(signatureAnswers?`Your ${currentStyle()?.name||'signature'} style already answers this opponent and keeps full familiarity.`:`Sticking with ${currentStyle()?.name||'your signature style'} preserves familiarity, but does not directly answer their style.`);
      $$('[data-plan-setting]').forEach(button=>button.setAttribute('aria-pressed',String(plan[button.dataset.planSetting]===button.dataset.planValue)));$('#fightPlanSummary').innerHTML=`<b>${label(plan)}</b><strong>OPPONENT STYLE · ${escapeHtml(fight.o.tag||'UNKNOWN STYLE')}</strong>${paceText} ${offenseText} ${tacticsText}`;
    }
    function begin(){const fight=getFight();if(!fight)return;fight.gamePlan=Object.assign({},getState().fightPlanPreference);showFightStage('planStage');render();trackEvent('fight_plan_presented',{pace:fight.gamePlan.pace,offense:fight.gamePlan.offense,tactics:fight.gamePlan.tactics})}
    function select(setting,value){const fight=getFight();if(!fight||!isCombatLocked())return;const valid={pace:['slow','fast'],offense:['conservative','aggressive'],tactics:['stick','adapt']};if(!valid[setting]?.includes(value))return;fight.gamePlan[setting]=value;render();tap()}
    function confirm(){const fight=getFight();if(!fight)return;getState().fightPlanPreference=Object.assign({},fight.gamePlan);saveState();trackEvent('fight_plan_locked',{pace:fight.gamePlan.pace,offense:fight.gamePlan.offense,tactics:fight.gamePlan.tactics,cardio_edge:Number((fight.player.cardio-fight.opp.cardio).toFixed(2))});beginFight();tap()}
    return {label,render,begin,select,confirm};
  }

  root.CAGE_FIGHT_PLAN={createFightPlanFeature};
})(globalThis);

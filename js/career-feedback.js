(function(root){
  'use strict';
  function rankSnapshot(previous,rank,now=Date.now()){
    const current=Math.floor(Number(rank)||0),old=Math.floor(Number(previous?.rank)||0);
    if(current<1)return previous||null;
    if(!old)return {rank:current,delta:0,changedAt:0};
    if(current===old)return {rank:current,delta:Number(previous.delta)||0,changedAt:Number(previous.changedAt)||0};
    return {rank:current,delta:old-current,changedAt:now};
  }
  function perkLabel(item){
    const parts=[];
    if(item.stat&&Number(item.bonus)>0)parts.push('+'+item.bonus+' '+item.stat.toUpperCase());
    if(Number(item.auraBonus)>0)parts.push('+'+item.auraBonus+' AURA');
    if(Number(item.healthRecoverySpeed)>0)parts.push('HEALTH RECOVERY −'+(item.healthRecoverySpeed/1000)+' SEC');
    if(Number(item.energyRecoverySpeed)>0)parts.push('ENERGY RECOVERY −'+(item.energyRecoverySpeed/1000)+' SEC');
    return parts.join(' · ')||item.desc||'';
  }
  const api={rankSnapshot,perkLabel};root.CAGE_CAREER_FEEDBACK=api;if(typeof module==='object')module.exports=api;
})(globalThis);

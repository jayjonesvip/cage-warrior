(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.CAGE_FIGHT_RULES=api;
  api.ready=typeof document==='undefined'||typeof fetch!=='function'?Promise.resolve(api.current):api.load('fight-rules.json');
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const defaults={
    fightStructure:{scheduledRounds:3,dailyFightLimit:10,minimumHealthForMedicalClearance:20},
    dailyDevelopmentLimits:{ordinaryAttributeTrainingSessionLimit:3,sparringSessionLimit:2},
    energyCosts:{levelsOneThroughTwoPerStartedRound:6,levelsThreeThroughFourPerStartedRound:7,levelsFiveThroughSixPerStartedRound:8,levelsSevenThroughEightPerStartedRound:9,levelNineAndHigherPerStartedRound:10,desperationHaymakerExtraEnergy:5},
    exchangeCounts:{slowPaceMinimum:6,slowPaceMaximum:7,fastPaceMinimum:9,fastPaceMaximum:11},
    computerGeneratedOpponentDifficulty:{baseAttributeRatingAtLevelOne:4,linearAttributeRatingGainPerLevel:1.9,compoundingGrowthStartsAtLevel:4,attributeGrowthMultiplierPerLevel:1.04,opponentCardDifficultyStep:.7,individualAttributeVariationStep:.45},
    fatigue:{laterRoundPenalty:.025,lowCardioTarget:10,lowCardioPenaltyPerExchange:.0018,powerOrSpeedToCardioRatioThreshold:1.75,imbalancePenaltyPerRatioPoint:.012,maximumImbalancePenaltyPerExchange:.018,slowPaceMultiplier:.7,fastPaceMultiplier:1.35,conservativeOffenseMultiplier:.9,aggressiveOffenseMultiplier:1.12},
    focus:{startingMinimum:75,startingMaximum:90,absoluteMinimum:50,absoluteMaximum:100,musicMinimumGain:4,musicMaximumGain:10,musicPerfectFocusProbability:.2,meditationMinimumFocus:92},
    startingCondition:{fullConditionMinimumHealthPercent:90,slightlyReducedConditionMinimumHealthPercent:70,reducedConditionMinimumHealthPercent:50,fullCondition:100,slightlyReducedCondition:95,reducedCondition:88,badlyReducedCondition:78},
    persistentHealthDamage:{landedAttack:1,knockdown:4,knockoutOrTechnicalKnockoutLoss:12,submissionLoss:8,injuryConditionMultiplier:.5},
    roundScoring:{damageWeight:1.35,landedAttackWeight:1,takedownWeight:5,controlSecondsDivisor:12,knockdownWeight:14,dominantRoundMargin:20},
    cashAndExperienceRewards:{lossPurseMultiplier:.08,victoryBaseExperiencePoints:26,victoryExperiencePointsPerOpponentLevel:9,earlyCareerExperienceBonusMaximum:20,earlyCareerExperienceBonusReductionPerOpponentLevel:5,lossExperienceMultiplier:.375,rankedFightExperienceMultiplier:1.2,championshipFightExperienceMultiplier:1.3,upsetVictoryExperienceMultiplier:1.25,pastLevelOrRivalExperienceMultiplier:.5,worldTitleVictoryExperienceBonus:25,secondWinAgainstSameOpponentExperienceMultiplier:.25,winHypeGain:8,exhaustedOpponentHypeChange:-7,maximumWinStreakPurseBonus:.25,winStreakPurseBonusPerAdditionalWin:.05,upsetVictoryPurseBonus:.25,rivalryPurseBonus:.15,hypePurseDivisor:130}
  };
  const specifications={
    'fightStructure.scheduledRounds':[3,3,true],'fightStructure.dailyFightLimit':[1,50,true],'fightStructure.minimumHealthForMedicalClearance':[1,100],
    'dailyDevelopmentLimits.ordinaryAttributeTrainingSessionLimit':[1,10,true],'dailyDevelopmentLimits.sparringSessionLimit':[0,10,true],
    'energyCosts.levelsOneThroughTwoPerStartedRound':[1,30],'energyCosts.levelsThreeThroughFourPerStartedRound':[1,30],'energyCosts.levelsFiveThroughSixPerStartedRound':[1,30],'energyCosts.levelsSevenThroughEightPerStartedRound':[1,30],'energyCosts.levelNineAndHigherPerStartedRound':[1,30],'energyCosts.desperationHaymakerExtraEnergy':[0,30],
    'exchangeCounts.slowPaceMinimum':[1,30,true],'exchangeCounts.slowPaceMaximum':[1,30,true],'exchangeCounts.fastPaceMinimum':[1,30,true],'exchangeCounts.fastPaceMaximum':[1,30,true],
    'computerGeneratedOpponentDifficulty.baseAttributeRatingAtLevelOne':[1,20],'computerGeneratedOpponentDifficulty.linearAttributeRatingGainPerLevel':[.1,10],'computerGeneratedOpponentDifficulty.compoundingGrowthStartsAtLevel':[2,20,true],'computerGeneratedOpponentDifficulty.attributeGrowthMultiplierPerLevel':[1,1.25],'computerGeneratedOpponentDifficulty.opponentCardDifficultyStep':[0,5],'computerGeneratedOpponentDifficulty.individualAttributeVariationStep':[0,3],
    'fatigue.laterRoundPenalty':[0,.2],'fatigue.lowCardioTarget':[1,50],'fatigue.lowCardioPenaltyPerExchange':[0,.05],'fatigue.powerOrSpeedToCardioRatioThreshold':[1,5],'fatigue.imbalancePenaltyPerRatioPoint':[0,.1],'fatigue.maximumImbalancePenaltyPerExchange':[0,.1],'fatigue.slowPaceMultiplier':[.25,3],'fatigue.fastPaceMultiplier':[.25,3],'fatigue.conservativeOffenseMultiplier':[.25,3],'fatigue.aggressiveOffenseMultiplier':[.25,3],
    'focus.startingMinimum':[0,100],'focus.startingMaximum':[0,100],'focus.absoluteMinimum':[0,100],'focus.absoluteMaximum':[0,100],'focus.musicMinimumGain':[0,50],'focus.musicMaximumGain':[0,50],'focus.musicPerfectFocusProbability':[0,1],'focus.meditationMinimumFocus':[0,100],
    'startingCondition.fullConditionMinimumHealthPercent':[0,100],'startingCondition.slightlyReducedConditionMinimumHealthPercent':[0,100],'startingCondition.reducedConditionMinimumHealthPercent':[0,100],'startingCondition.fullCondition':[0,100],'startingCondition.slightlyReducedCondition':[0,100],'startingCondition.reducedCondition':[0,100],'startingCondition.badlyReducedCondition':[0,100],
    'persistentHealthDamage.landedAttack':[0,100],'persistentHealthDamage.knockdown':[0,100],'persistentHealthDamage.knockoutOrTechnicalKnockoutLoss':[0,100],'persistentHealthDamage.submissionLoss':[0,100],'persistentHealthDamage.injuryConditionMultiplier':[0,1],
    'roundScoring.damageWeight':[0,10],'roundScoring.landedAttackWeight':[0,20],'roundScoring.takedownWeight':[0,30],'roundScoring.controlSecondsDivisor':[1,120],'roundScoring.knockdownWeight':[0,50],'roundScoring.dominantRoundMargin':[0,100],
    'cashAndExperienceRewards.lossPurseMultiplier':[0,1],'cashAndExperienceRewards.victoryBaseExperiencePoints':[0,1000],'cashAndExperienceRewards.victoryExperiencePointsPerOpponentLevel':[0,100],'cashAndExperienceRewards.earlyCareerExperienceBonusMaximum':[0,500],'cashAndExperienceRewards.earlyCareerExperienceBonusReductionPerOpponentLevel':[0,100],'cashAndExperienceRewards.lossExperienceMultiplier':[0,1],'cashAndExperienceRewards.rankedFightExperienceMultiplier':[0,3],'cashAndExperienceRewards.championshipFightExperienceMultiplier':[0,3],'cashAndExperienceRewards.upsetVictoryExperienceMultiplier':[0,3],'cashAndExperienceRewards.pastLevelOrRivalExperienceMultiplier':[0,1],'cashAndExperienceRewards.worldTitleVictoryExperienceBonus':[0,500],'cashAndExperienceRewards.secondWinAgainstSameOpponentExperienceMultiplier':[0,1],'cashAndExperienceRewards.winHypeGain':[-100,100],'cashAndExperienceRewards.exhaustedOpponentHypeChange':[-100,100],'cashAndExperienceRewards.maximumWinStreakPurseBonus':[0,2],'cashAndExperienceRewards.winStreakPurseBonusPerAdditionalWin':[0,1],'cashAndExperienceRewards.upsetVictoryPurseBonus':[0,2],'cashAndExperienceRewards.rivalryPurseBonus':[0,2],'cashAndExperienceRewards.hypePurseDivisor':[1,1000]
  };
  const clone=value=>JSON.parse(JSON.stringify(value));
  const read=(source,path)=>path.split('.').reduce((value,key)=>value&&typeof value==='object'?value[key]:undefined,source);
  const write=(target,path,value)=>{const keys=path.split('.');let node=target;for(const key of keys.slice(0,-1))node=node[key];node[keys.at(-1)]=value};
  function normalize(candidate){
    const result=clone(defaults),source=candidate&&typeof candidate==='object'?candidate:{};
    for(const [path,[minimum,maximum,integer]] of Object.entries(specifications)){
      const value=read(source,path);
      if(Number.isFinite(value)&&value>=minimum&&value<=maximum)write(result,path,integer?Math.round(value):value);
    }
    const validPair=(minimumPath,maximumPath)=>{if(read(result,minimumPath)<=read(result,maximumPath))return;write(result,minimumPath,read(defaults,minimumPath));write(result,maximumPath,read(defaults,maximumPath))};
    validPair('exchangeCounts.slowPaceMinimum','exchangeCounts.slowPaceMaximum');validPair('exchangeCounts.fastPaceMinimum','exchangeCounts.fastPaceMaximum');validPair('focus.startingMinimum','focus.startingMaximum');validPair('focus.absoluteMinimum','focus.absoluteMaximum');validPair('focus.musicMinimumGain','focus.musicMaximumGain');
    const healthThresholds=['startingCondition.fullConditionMinimumHealthPercent','startingCondition.slightlyReducedConditionMinimumHealthPercent','startingCondition.reducedConditionMinimumHealthPercent'];
    if(healthThresholds.some((path,index)=>index&&read(result,healthThresholds[index-1])<read(result,path)))for(const path of healthThresholds)write(result,path,read(defaults,path));
    const conditionValues=['startingCondition.fullCondition','startingCondition.slightlyReducedCondition','startingCondition.reducedCondition','startingCondition.badlyReducedCondition'];
    if(conditionValues.some((path,index)=>index&&read(result,conditionValues[index-1])<read(result,path)))for(const path of conditionValues)write(result,path,read(defaults,path));
    const focusPaths=['focus.absoluteMinimum','focus.startingMinimum','focus.startingMaximum','focus.absoluteMaximum'];
    if(focusPaths.some((path,index)=>index&&read(result,focusPaths[index-1])>read(result,path)))for(const path of focusPaths)write(result,path,read(defaults,path));
    return result;
  }
  const api={defaults:clone(defaults),current:normalize(),normalize,number(path,fallback){const value=read(api.current,path);return Number.isFinite(value)?value:fallback},async load(url){try{const response=await fetch(url,{cache:'no-store',headers:{Accept:'application/json'}});if(!response.ok)throw new Error(`Fight rules request failed with ${response.status}`);api.current=normalize(await response.json())}catch(error){if(typeof console!=='undefined'&&console.warn)console.warn('Using built-in fight rules.',error)}return api.current}};
  return api;
});

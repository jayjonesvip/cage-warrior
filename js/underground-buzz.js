(function(root){
  'use strict';

  function createUndergroundBuzzFeature(options){
    const {$,$$,getState,ensureDailyCounters,sessionsLeft,LOGIC,fmt,initAudio,sfx,trackEvent,saveState,updateUI,confettiBurst,toast,shake,rint,todayKey,clamp,hashSeed,horseRaceProfiles,escapeHtml}=options;
    let cageDiceChoice='';
    let horseRaceChoice='';
    let horseRaceTimer=null;
    let horseRaceAnimating=false;

    function shuffledBlackjackDeck(){
      const deck=[];for(const suit of ['S','H','D','C'])for(const rank of ['A','2','3','4','5','6','7','8','9','T','J','Q','K'])deck.push(rank+suit);
      for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}return deck;
    }
    function blackjackCard(card,hidden=false){
      if(hidden)return '<span class="playing-card card-back" aria-label="Hidden dealer card">CG</span>';
      const rank=card[0]==='T'?'10':card[0],suit={S:'♠',H:'♥',D:'♦',C:'♣'}[card[1]],red=card[1]==='H'||card[1]==='D';return `<span class="playing-card ${red?'red':''}" aria-label="${rank} of ${suit}"><b>${rank}</b><i>${suit}</i></span>`;
    }
    function blackjackResultText(hand){
      const profit=(hand.payout||0)-hand.bet;if(hand.result==='blackjack')return `BLACKJACK · YOU WIN $${fmt(profit)}`;if(hand.result==='win')return `YOU BEAT THE DEALER · +$${fmt(profit)}`;if(hand.result==='push')return `PUSH · YOUR $${fmt(hand.bet)} BET WAS RETURNED`;return `THE HOUSE WINS · -$${fmt(hand.bet)}`;
    }
    function renderBlackjackDialog(){
      const state=getState(),hand=state.blackjackHand,maxBet=LOGIC.blackjackBetLimit(state.cash),active=hand?.status==='playing',settled=hand?.status==='settled';
      $('#blackjackCash').textContent='$'+fmt(state.cash);$('#blackjackMaxBet').textContent=hand?`$${fmt(hand.bet)} WAGER`:'$'+fmt(maxBet);$('#blackjackBetPanel').hidden=!!hand;$('#blackjackTable').hidden=!hand;
      const bet=$('#blackjackBet');bet.max=String(maxBet);if(!hand){const suggested=Math.max(1,Math.min(50,maxBet));bet.value=String(suggested);bet.disabled=maxBet<1}
      $('#blackjackDeal').hidden=!!hand;$('#blackjackDeal').disabled=maxBet<1;$('#blackjackHit').hidden=!active;$('#blackjackStand').hidden=!active;
      if(!hand){$('#blackjackResult').textContent='';return}
      const revealDealer=settled,dealerValue=LOGIC.blackjackHandValue(revealDealer?hand.dealer:[hand.dealer[0]]),playerValue=LOGIC.blackjackHandValue(hand.player);
      $('#dealerCards').innerHTML=hand.dealer.map((card,index)=>blackjackCard(card,!revealDealer&&index===1)).join('');$('#playerCards').innerHTML=hand.player.map(card=>blackjackCard(card)).join('');$('#dealerTotal').textContent=revealDealer?dealerValue.total:`${dealerValue.total} + ?`;$('#playerTotal').textContent=playerValue.total;
      const result=$('#blackjackResult');result.textContent=settled?blackjackResultText(hand):`$${fmt(hand.bet)} ON THE TABLE`;result.className=`blackjack-result${settled?` ${hand.result}`:''}`;
    }
    function openBlackjack(){
      const state=getState();ensureDailyCounters();if(state.level<2){toast('BACKROOM BLACKJACK UNLOCKS AT LEVEL 2','#78dfff');return}if(state.blackjackHand?.status==='settled'||(!state.blackjackHand&&sessionsLeft('blackjack',1)<1)){toast('You already played today’s blackjack hand.','#ff766d');return}if(!state.blackjackHand&&LOGIC.blackjackBetLimit(state.cash)<1){toast('You need at least $4 to make a legal wager.','#ffcf78');return}
      initAudio();const modal=$('#blackjackModal');modal.classList.add('open');modal.setAttribute('aria-hidden','false');renderBlackjackDialog();sfx.tap();requestAnimationFrame(()=>(state.blackjackHand?$('#blackjackHit'):$('#blackjackBet')).focus());
    }
    function closeBlackjack(){const modal=$('#blackjackModal');if(!modal.classList.contains('open'))return;modal.classList.remove('open');modal.setAttribute('aria-hidden','true');sfx.tap()}
    function settleBlackjack(){
      const state=getState(),hand=state.blackjackHand;if(!hand||hand.status!=='playing')return;const outcome=LOGIC.blackjackOutcome(hand.player,hand.dealer,hand.bet);hand.status='settled';hand.result=outcome.result;hand.payout=outcome.payout;state.cash+=outcome.payout;trackEvent('blackjack_completed',{outcome:outcome.result,bet:hand.bet,payout:outcome.payout,profit:outcome.payout-hand.bet,player_cards:hand.player.length});saveState();
      if(outcome.result==='blackjack'||outcome.result==='win'){sfx.coin();confettiBurst()}else if(outcome.result==='loss'){sfx.lose();shake()}else sfx.tap();updateUI();renderBlackjackDialog();
    }
    function playBlackjackDealer(){
      const hand=getState().blackjackHand;if(!hand||hand.status!=='playing')return;while(LOGIC.blackjackHandValue(hand.dealer).total<17&&hand.deck.length)hand.dealer.push(hand.deck.pop());settleBlackjack();
    }
    function dealBlackjack(){
      const state=getState();ensureDailyCounters();if(state.level<2||state.blackjackHand||sessionsLeft('blackjack',1)<1)return;const maxBet=LOGIC.blackjackBetLimit(state.cash),bet=Math.floor(Number($('#blackjackBet').value));if(!Number.isFinite(bet)||bet<1||bet>maxBet){toast(`Choose a whole-dollar bet from $1 to $${fmt(maxBet)}.`,'#ff766d');return}
      initAudio();const deck=shuffledBlackjackDeck(),player=[deck.pop()],dealer=[deck.pop()];player.push(deck.pop());dealer.push(deck.pop());state.cash-=bet;state.dailyCounters.blackjack=1;state.blackjackHand={date:todayKey(),bet,deck,player,dealer,status:'playing',result:'',payout:0};trackEvent('blackjack_started',{bet,max_bet:maxBet});saveState();sfx.tap();
      const playerValue=LOGIC.blackjackHandValue(player),dealerValue=LOGIC.blackjackHandValue(dealer);if(playerValue.blackjack||dealerValue.blackjack)settleBlackjack();else{updateUI();renderBlackjackDialog()}
    }
    function hitBlackjack(){
      const hand=getState().blackjackHand;if(!hand||hand.status!=='playing'||!hand.deck.length)return;hand.player.push(hand.deck.pop());saveState();sfx.tap();const value=LOGIC.blackjackHandValue(hand.player);if(value.bust)settleBlackjack();else if(value.total===21)playBlackjackDealer();else renderBlackjackDialog();
    }

    function cageDieFace(value){return ['⚀','⚁','⚂','⚃','⚄','⚅'][clamp(Math.floor(Number(value))||1,1,6)-1]}
    function cageDiceResultText(result){const label={under:'UNDER 7',over:'OVER 7',seven:'EXACTLY 7',doubles:'DOUBLES'}[result.choice];return result.won?`${label} HITS · YOU WIN $${fmt(result.profit)}`:`${label} MISSES · THE HOUSE TAKES $${fmt(result.bet)}`}
    function renderCageDiceDialog(){const state=getState(),result=state.cageDiceResult,maxBet=LOGIC.cageDiceBetLimit(state.cash),stage=$('#cageDiceStage'),hasChoice=['under','over','seven','doubles'].includes(cageDiceChoice);$('#cageDiceCash').textContent='$'+fmt(state.cash);$('#cageDiceMaxBet').textContent=result?`$${fmt(result.bet)} WAGER`:'$'+fmt(maxBet);$('#cageDiceSetup').hidden=!!result;stage.hidden=!result;$('#cageDiceRoll').hidden=!!result;$('#cageDiceRoll').parentElement.classList.toggle('result-only',!!result);const input=$('#cageDiceBet');input.max=String(maxBet);if(!result){input.value=String(Math.max(1,Math.min(50,maxBet)));input.disabled=maxBet<1||!hasChoice;$('#cageDiceRoll').disabled=maxBet<1||!hasChoice;$$('[data-dice-choice]').forEach(button=>{const active=button.dataset.diceChoice===cageDiceChoice;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});return}$('#cageDieOne').textContent=cageDieFace(result.die1);$('#cageDieTwo').textContent=cageDieFace(result.die2);$('#cageDiceTotal').textContent=`TOTAL ${result.total}${result.doubles?' · DOUBLES':''}`;const output=$('#cageDiceResult');output.textContent=cageDiceResultText(result);output.className=`blackjack-result ${result.won?'win':'loss'}`;stage.classList.remove('rolling');void stage.offsetWidth;stage.classList.add('rolling');setTimeout(()=>stage.classList.remove('rolling'),560)}
    function openCageDice(){const state=getState();ensureDailyCounters();if(state.level<4){toast('CAGE DICE UNLOCKS AT LEVEL 4','#78dfff');return}if(state.cageDiceResult||sessionsLeft('cageDice',1)<1){toast('You already rolled Cage Dice today.','#ff766d');return}if(LOGIC.cageDiceBetLimit(state.cash)<1){toast('You need at least $4 to make a legal wager.','#ffcf78');return}initAudio();cageDiceChoice='';const modal=$('#cageDiceModal');modal.classList.add('open');modal.setAttribute('aria-hidden','false');renderCageDiceDialog();sfx.tap();requestAnimationFrame(()=>$('[data-dice-choice]')?.focus())}
    function closeCageDice(){const modal=$('#cageDiceModal');if(!modal.classList.contains('open'))return;modal.classList.remove('open');modal.setAttribute('aria-hidden','true');sfx.tap()}
    function chooseCageDiceBet(choice){if(!['under','over','seven','doubles'].includes(choice)||getState().cageDiceResult)return;cageDiceChoice=choice;renderCageDiceDialog();sfx.tap()}
    function rollCageDice(){const state=getState();ensureDailyCounters();if(state.level<4||state.cageDiceResult||sessionsLeft('cageDice',1)<1)return;if(!['under','over','seven','doubles'].includes(cageDiceChoice)){toast('Choose a Cage Dice outcome before entering your bet.','#ffcf78');return}const maxBet=LOGIC.cageDiceBetLimit(state.cash),bet=Math.floor(Number($('#cageDiceBet').value));if(!Number.isFinite(bet)||bet<1||bet>maxBet){toast(`Choose a whole-dollar bet from $1 to $${fmt(maxBet)}.`,'#ff766d');return}initAudio();const outcome=LOGIC.cageDiceOutcome(rint(1,6),rint(1,6),cageDiceChoice,bet);state.cash-=bet;state.cash+=outcome.payout;state.dailyCounters.cageDice=1;state.cageDiceResult={date:todayKey(),bet,...outcome};trackEvent('cage_dice_completed',{bet,choice:outcome.choice,total:outcome.total,doubles:outcome.doubles,won:outcome.won,payout:outcome.payout,profit:outcome.profit});saveState();if(outcome.won){sfx.coin();confettiBurst()}else{sfx.lose();shake()}updateUI();renderCageDiceDialog()}

    function dailyHorseRaceField(){const state=getState();return LOGIC.horseRaceField(hashSeed(`underground-racing|${todayKey()}|${state.name}`),horseRaceProfiles)}
    function horseRaceReturnText(horse,bet){if(!horse||bet<1)return 'CHOOSE A HORSE TO SEE YOUR RETURN';return `$${fmt(bet)} BET · RETURNS $${fmt(bet*(horse.odds+1))}`}
    function horseRaceLane(horse,progress=4,selectedHorseId=''){const selected=horse.id===selectedHorseId;return `<div class="horse-race-lane ${selected?'selected':''}" data-race-lane="${escapeHtml(horse.id)}" style="--horse-color:${escapeHtml(horse.color)}"${selected?' aria-label="Your horse"':''}><span class="horse-lane-number">${horse.lane}</span><div class="horse-race-rail"><img class="horse-marker" src="assets/racehorse-right.png?v=2.5.223" style="--race-progress:${progress}" alt="${escapeHtml(horse.name)}"><span class="horse-finish-line" aria-hidden="true"></span></div></div>`}
    function setHorseRacePositions(result,final=false,step=0,totalSteps=10){
      const fraction=totalSteps?step/totalSteps:1;
      result.field.forEach(horse=>{const marker=$(`[data-race-lane="${horse.id}"] .horse-marker`);if(!marker)return;const place=result.finishOrder.indexOf(horse.id),finishProgress=96-place*4,previous=Number(marker.style.getPropertyValue('--race-progress'))||4;let progress;if(final)progress=Math.max(previous,finishProgress);else{const remaining=1-fraction,styleOffset=horse.style==='front'?remaining*6:horse.style==='closer'?-remaining*5:horse.style==='volatile'?Math.sin((step+horse.lane)*1.7)*remaining*3:0,jitter=((hashSeed(`${horse.id}|${step}|${result.date}`)%700)/100-3.5)*remaining,candidate=5+fraction*(finishProgress-5)+styleOffset+jitter,forwardLimit=finishProgress-Math.max(.8,(totalSteps-step)*.7);progress=clamp(Math.max(previous,candidate),4,forwardLimit)}marker.style.setProperty('--race-progress',String(progress))});
    }
    function renderHorseRaceFinish(result){
      const selected=result.field.find(horse=>horse.id===result.selectedHorseId),place=result.finishOrder.indexOf(result.selectedHorseId)+1,winner=result.field.find(horse=>horse.id===result.finishOrder[0]),output=$('#horseRaceResult');$('#horseRaceFinish').innerHTML=result.finishOrder.map((id,index)=>{const horse=result.field.find(item=>item.id===id);return `<div class="horse-finish-row ${id===result.selectedHorseId?'selected':''}"><b>${index+1}</b><span>${escapeHtml(horse.name)}</span><small>${horse.odds}/1</small></div>`}).join('');$('#horseRaceFinish').hidden=false;output.textContent=result.won?`${selected.name} WINS · +$${fmt(result.profit)} PROFIT`:`${selected.name} FINISHES #${place} · ${winner.name} WINS`;output.className=`blackjack-result ${result.won?'win':'loss'}`;
    }
    function renderHorseRaceDialog(){
      const state=getState(),result=state.horseRaceResult,field=result?.field||dailyHorseRaceField(),maxBet=LOGIC.horseRaceBetLimit(state.cash),setup=$('#horseRaceSetup'),stage=$('#horseRaceStage'),input=$('#horseRaceBet'),actions=$('#horseRaceRun').parentElement;$('#horseRaceCash').textContent='$'+fmt(state.cash);$('#horseRaceMaxBet').textContent=result?`$${fmt(result.bet)} WAGER`:'$'+fmt(maxBet);setup.hidden=!!result;stage.hidden=!result;$('#horseRaceRun').hidden=!!result;actions.classList.toggle('result-only',!!result);$('#horseRaceClose').textContent=result?'BACK TO HUSTLE':'CLOSE';
      if(result){$('#horseRaceTrack').innerHTML=result.field.map(horse=>horseRaceLane(horse,4,result.selectedHorseId)).join('');setHorseRacePositions(result,true);renderHorseRaceFinish(result);return}
      horseRaceChoice=field.some(horse=>horse.id===horseRaceChoice)?horseRaceChoice:'';input.max=String(maxBet);input.value=String(Math.max(1,Math.min(50,maxBet)));input.disabled=maxBet<1||!horseRaceChoice;$('#horseRaceField').innerHTML=field.map(horse=>`<button type="button" class="horse-pick ${horse.id===horseRaceChoice?'active':''}" data-horse-pick="${escapeHtml(horse.id)}" aria-pressed="${horse.id===horseRaceChoice}"><span class="horse-silk" style="--horse-color:${escapeHtml(horse.color)}">${horse.lane}</span><span><b>${escapeHtml(horse.name)}</b><small>${escapeHtml(horse.clue)}</small></span><strong>${horse.odds}/1<small>RACING ODDS</small></strong></button>`).join('');updateHorseRacePreview();
    }
    function updateHorseRacePreview(){
      const state=getState();if(state.horseRaceResult)return;const field=dailyHorseRaceField(),horse=field.find(item=>item.id===horseRaceChoice),input=$('#horseRaceBet'),bet=Math.floor(Number(input.value))||0,maxBet=LOGIC.horseRaceBetLimit(state.cash);input.disabled=!horse||maxBet<1;$('#horseRaceReturn').textContent=horseRaceReturnText(horse,bet);$('#horseRaceRun').disabled=!horse||bet<1||bet>maxBet;
    }
    function chooseHorseRace(id){if(getState().horseRaceResult||horseRaceAnimating)return;const horse=dailyHorseRaceField().find(item=>item.id===id);if(!horse)return;horseRaceChoice=id;$$('[data-horse-pick]').forEach(button=>{const active=button.dataset.horsePick===id;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});updateHorseRacePreview();sfx.tap()}
    function openHorseRace(){
      const state=getState();ensureDailyCounters();if(state.level<6){toast('UNDERGROUND RACING UNLOCKS AT LEVEL 6','#78dfff');return}if(!state.horseRaceResult&&sessionsLeft('horseRace',1)<1){toast('You already placed today’s race bet.','#ff766d');return}if(!state.horseRaceResult&&LOGIC.horseRaceBetLimit(state.cash)<1){toast('You need at least $4 to make a legal wager.','#ffcf78');return}initAudio();horseRaceChoice='';const modal=$('#horseRaceModal');modal.classList.add('open');modal.setAttribute('aria-hidden','false');renderHorseRaceDialog();sfx.tap();requestAnimationFrame(()=>(state.horseRaceResult?$('#horseRaceClose'):$('[data-horse-pick]'))?.focus());
    }
    function closeHorseRace(){if(horseRaceAnimating)return;const modal=$('#horseRaceModal');if(!modal.classList.contains('open'))return;modal.classList.remove('open');modal.setAttribute('aria-hidden','true');horseRaceChoice='';sfx.tap()}
    function finishHorseRaceAnimation(){
      if(horseRaceTimer){clearInterval(horseRaceTimer);horseRaceTimer=null}const state=getState(),result=state.horseRaceResult;if(!result)return;horseRaceAnimating=false;setHorseRacePositions(result,true);renderHorseRaceFinish(result);$('#horseRaceClose').hidden=false;if(result.won){sfx.coin();confettiBurst();toast(`WINNER! +$${fmt(result.profit)} PROFIT`,'#ffd56a')}else{sfx.lose();shake();toast(`RACE LOST · -$${fmt(result.bet)}`,'#ff8d82')}requestAnimationFrame(()=>$('#horseRaceClose').focus());
    }
    function animateHorseRace(){
      const result=getState().horseRaceResult;if(!result)return;horseRaceAnimating=true;$('#horseRaceFinish').hidden=true;$('#horseRaceClose').hidden=true;$('#horseRaceRun').hidden=true;$('#horseRaceRun').parentElement.classList.add('result-only');const output=$('#horseRaceResult');output.textContent='THEY ARE OFF!';output.className='blackjack-result';setHorseRacePositions(result,false,0,10);const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,totalSteps=reduced?1:10,interval=reduced?240:800;let step=0;horseRaceTimer=setInterval(()=>{step++;setHorseRacePositions(result,step===totalSteps,step,totalSteps);if(step>=totalSteps){clearInterval(horseRaceTimer);horseRaceTimer=setTimeout(finishHorseRaceAnimation,reduced?0:720)}},interval);
    }
    function runHorseRace(){
      const state=getState();ensureDailyCounters();if(state.level<6||state.horseRaceResult||sessionsLeft('horseRace',1)<1)return;const field=dailyHorseRaceField(),selected=field.find(horse=>horse.id===horseRaceChoice),maxBet=LOGIC.horseRaceBetLimit(state.cash),bet=Math.floor(Number($('#horseRaceBet').value));if(!selected){toast('Choose a horse before placing your bet.','#ffcf78');return}if(!Number.isFinite(bet)||bet<1||bet>maxBet){toast(`Choose a whole-dollar bet from $1 to $${fmt(maxBet)}.`,'#ff766d');return}
      const finishOrder=LOGIC.horseRaceFinish(field,field.map(()=>Math.random())),outcome=LOGIC.horseRacePayout(bet,selected.odds,finishOrder[0]===selected.id);state.cash-=bet;state.cash+=outcome.payout;state.dailyCounters.horseRace=1;state.horseRaceResult={date:todayKey(),bet,field,selectedHorseId:selected.id,finishOrder,...outcome};trackEvent('horse_race_completed',{bet,horse_id:selected.id,odds:selected.odds,finish_position:finishOrder.indexOf(selected.id)+1,payout:outcome.payout,profit:outcome.profit});saveState();updateUI();$('#horseRaceSetup').hidden=true;$('#horseRaceStage').hidden=false;$('#horseRaceTrack').innerHTML=field.map(horse=>horseRaceLane(horse,4,selected.id)).join('');animateHorseRace();
    }

    function handleActionClick(event){
      const blackjack=event.target.closest('[data-blackjack-open]');if(blackjack){openBlackjack();return true}
      const cageDice=event.target.closest('[data-cage-dice-open]');if(cageDice){openCageDice();return true}
      const diceChoice=event.target.closest('[data-dice-choice]');if(diceChoice){chooseCageDiceBet(diceChoice.dataset.diceChoice);return true}
      const horseRace=event.target.closest('[data-horse-race-open]');if(horseRace){openHorseRace();return true}
      const horsePick=event.target.closest('[data-horse-pick]');if(horsePick){chooseHorseRace(horsePick.dataset.horsePick);return true}
      return false;
    }
    function bind(){
      $('#blackjackDeal').addEventListener('click',dealBlackjack);$('#blackjackHit').addEventListener('click',hitBlackjack);$('#blackjackStand').addEventListener('click',playBlackjackDealer);$('#blackjackClose').addEventListener('click',closeBlackjack);
      $('#blackjackModal').addEventListener('click',event=>{if(event.target===$('#blackjackModal'))closeBlackjack()});$('#blackjackModal').addEventListener('keydown',event=>{if(event.key==='Escape')closeBlackjack()});
      $('#cageDiceRoll').addEventListener('click',rollCageDice);$('#cageDiceClose').addEventListener('click',closeCageDice);$('#cageDiceModal').addEventListener('click',event=>{if(event.target===$('#cageDiceModal'))closeCageDice()});$('#cageDiceModal').addEventListener('keydown',event=>{if(event.key==='Escape')closeCageDice()});
      $('#horseRaceBet').addEventListener('input',updateHorseRacePreview);$('#horseRaceRun').addEventListener('click',runHorseRace);$('#horseRaceClose').addEventListener('click',closeHorseRace);$('#horseRaceModal').addEventListener('click',event=>{if(event.target===$('#horseRaceModal'))closeHorseRace()});$('#horseRaceModal').addEventListener('keydown',event=>{if(event.key==='Escape')closeHorseRace()});
    }

    return {bind,handleActionClick};
  }

  root.CAGE_UNDERGROUND_BUZZ={createUndergroundBuzzFeature};
})(globalThis);

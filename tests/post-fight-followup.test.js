const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const game=fs.readFileSync(require('node:path').join(__dirname,'../js/game.js'),'utf8');
test('victory pack opens immediately and Mom is the final follow-up',()=>{
  const nodes=new Map(),frames=[],shown=[];
  const $=key=>{
    if(!nodes.has(key)){const classes=new Set();nodes.set(key,{style:{},setAttribute(){},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)}});}
    return nodes.get(key);
  };
  const pending=new Set(['sponsor','contract','referral','title','ceo','mom']);
  const present=name=>()=>{if(!pending.delete(name))return false;shown.push(name);$('#followup').classList.add('open');return true;};
  const drop={item:{id:'ladder'}};
  const context={$,state:{postFightTutorialSeen:true},fight:{},combatLocked:true,pendingResultDrop:drop,pendingDropContext:null,resultDropRevealed:false,levelUpSummary:{toLevel:2},
    firstWinUpgradePending:()=>false,stopConfetti(){},clearFightTimers(){},updateUI(){},navTo(){},requestAnimationFrame:fn=>frames.push(fn),
    document:{querySelector:()=>[...nodes.values()].find(n=>n.classList.contains('open'))},
    openDropClaim(value,options){assert.equal(value,drop);context.pendingDropContext=options;$('#dropClaimModal').classList.add('open');shown.push('victory');},
    showPendingSponsor:present('sponsor'),showLevelUp(){shown.push('level');$('#levelUpModal').classList.add('active');},offerFirstContractOpponent:present('contract'),showPendingReferralDrop:present('referral'),showPendingTitleLoss:present('title'),showPendingCeoOffice:present('ceo'),showPendingPostFightText:present('mom')};
  vm.createContext(context);
  vm.runInContext(game.slice(game.indexOf('  function postFightPresentationBusy()'),game.indexOf('  function showPendingReferralDrop()'))+'\n'+game.split('\n').find(l=>l.startsWith('  function showPostFightFollowup()'))+'\n'+game.slice(game.indexOf('  function closeResult()'),game.indexOf('  function stopConfetti()')),context);
  context.closeResult();
  assert.deepEqual(shown,['victory']);
  assert.equal(context.showPostFightFollowup(),false);
  assert.equal(pending.has('mom'),true);
  context.closeDropClaim();
  frames.shift()();
  assert.deepEqual(shown,['victory','sponsor']);
  assert.equal(context.showPostFightFollowup(),false);
  for(const expected of ['level','contract','referral','title','ceo','mom']){
    $('#followup').classList.remove('open');
    if($('#levelUpModal').classList.contains('active')){ $('#levelUpModal').classList.remove('active');context.levelUpSummary=null; }
    assert.equal(context.showPostFightFollowup(),true);
    assert.equal(shown.at(-1),expected);
  }
  $('#followup').classList.remove('open');
  assert.equal(context.showPostFightFollowup(),false);
  assert.deepEqual(shown,['victory','sponsor','level','contract','referral','title','ceo','mom']);
});

test('sponsor announcement waits for overlays and persists until acknowledgement',()=>{
  const nodes=new Map();
  const $=key=>{
    if(!nodes.has(key)){const classes=new Set();nodes.set(key,{style:{},dataset:{},setAttribute(){},focus(){},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)}});}
    return nodes.get(key);
  };
  let saves=0;
  const context={$,state:{sponsorAnnouncementPending:'brand'},endorsementDefs:[{id:'brand',brand:'Sponsor',followersRequired:100}],sponsorLogo:()=> 'logo.png',fmt:String,saveState:()=>saves++,sfx:{win(){}},confettiBurst(){},stopConfetti(){},updateUI(){},requestAnimationFrame(){},fight:null,combatLocked:false,pendingResultDrop:null,document:{querySelector:()=>[...nodes.values()].find(n=>n.classList.contains('open'))}};
  vm.createContext(context);
  const busy=game.slice(game.indexOf('  function postFightPresentationBusy()'),game.indexOf('  function showPendingReferralDrop()'));
  const sponsor=game.split('\n').filter(l=>l.startsWith('  function showPendingSponsor()')||l.startsWith('  function closeSponsorAnnouncement()')).join('\n');
  vm.runInContext(busy+'\n'+sponsor+'\nfunction showPostFightFollowup(){}',context);
  $('#postFightMessageModal').classList.add('open');
  assert.equal(context.showPendingSponsor(),false);
  assert.equal(context.state.sponsorAnnouncementPending,'brand');
  $('#postFightMessageModal').classList.remove('open');
  context.pendingResultDrop={};
  assert.equal(context.showPendingSponsor(),false);
  context.pendingResultDrop=null;
  assert.equal(context.showPendingSponsor(),true);
  assert.equal(context.state.sponsorAnnouncementPending,'brand');
  assert.equal(saves,0);
  assert.equal(context.showPendingSponsor(),false);
  context.closeSponsorAnnouncement();
  assert.equal(context.state.sponsorAnnouncementPending,'');
  assert.equal(saves,1);
  assert.equal($('#sponsorAnnouncementModal').classList.contains('open'),false);
});

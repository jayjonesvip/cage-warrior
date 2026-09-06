const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const game=fs.readFileSync(require('node:path').join(__dirname,'../js/game.js'),'utf8');
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

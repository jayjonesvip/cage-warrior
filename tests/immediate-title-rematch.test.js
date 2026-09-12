const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const logic=require('../js/game-logic.js'),history=require('../js/fight-history.js');
const game=fs.readFileSync(require.resolve('../js/game.js'),'utf8');
const shared={};vm.runInNewContext(fs.readFileSync(require.resolve('../js/shared-ui.js'),'utf8'),shared);

test('an unused title-loss rematch overrides midnight but ordinary title shots still wait',()=>{
  const champ={champion_id:'new-champ',champion_handle:'NewChamp',champion_level:20,former_champion:true,former_champion_rematch:true,daily_bout_used:true,rematch_blocked:true,eligibility_status:'daily_bout_used'};
  const resolved=shared.CAGE_SHARED_UI.resolveChampionshipIdentity(champ,{name:'FormerChamp'});
  assert.equal(resolved.challenge_eligible,true);assert.equal(resolved.rematch_blocked,false);
  assert.equal(resolved.eligibility_status,'former_champion_rematch');
  const experience=logic.championshipExperience(champ,{level:1});
  assert.equal(experience.disabled,false);assert.equal(experience.status,'rematch');
  assert.match(shared.CAGE_SHARED_UI.championshipCardModel({championship:champ,state:{name:'FormerChamp'},loaded:true}).meta,/TITLE REMATCH AVAILABLE/);
  const used={...champ,former_champion_rematch:false};
  assert.equal(shared.CAGE_SHARED_UI.resolveChampionshipIdentity(used).challenge_eligible,false);
  assert.equal(logic.championshipExperience(used).disabled,true);
  assert.equal(logic.championshipExperience({...champ,is_champion:true,defense_used_today:true}).disabled,true);
});

test('24-hour exception only applies to the current champion and a live rematch entitlement',()=>{
  const now=Date.now(),opponent={globalChampionship:true,titleMode:'rematch',sourceProfileId:'new-champ',name:'NewChamp'};
  const context={state:{fightHistory:[{opponentId:'new-champ',opponent:'NewChamp',date:now-1000,won:false}]},sharedChampionship:{champion_id:'new-champ',former_champion_rematch:true},CAGE_FIGHT_HISTORY:history};
  vm.createContext(context);vm.runInContext(game.split('\n').find(line=>line.startsWith('  function opponentRematchRemaining(')),context);
  assert.equal(context.opponentRematchRemaining(opponent),0);
  assert.ok(context.opponentRematchRemaining({...opponent,globalChampionship:false})>0);
  assert.ok(context.opponentRematchRemaining({...opponent,titleMode:'challenge'})>0);
  context.sharedChampionship.champion_id='different-champ';assert.ok(context.opponentRematchRemaining(opponent)>0);
  context.sharedChampionship.champion_id='new-champ';context.sharedChampionship.former_champion_rematch=false;
  assert.ok(context.opponentRematchRemaining(opponent)>0);
});

test('title loss copy advertises immediate rematch rather than midnight',()=>{
  const presentation=logic.championshipSettlementPresentation({status:'new_champion',mode:'defense',championHandle:'NewChamp'});
  assert.match(presentation.message,/TITLE REMATCH AVAILABLE NOW/);
  assert.doesNotMatch(presentation.message,/TOMORROW|MIDNIGHT/);
  assert.match(game,/titleCooldown=playerIsChampion\?sharedChampionship\?\.defense_used_today===true:!rematch&&sharedChampionship\?\.daily_bout_used===true/);
});

test('migration limits the exception to one verified current-reign loss and preserves ordinary daily uniqueness',()=>{
  const sql=fs.readFileSync(require('node:path').join(__dirname,'../supabase/migrations/20260911130000_immediate_title_loss_rematch.sql'),'utf8');
  assert.match(sql,/unique index cage_championship_one_attempt_per_challenger_day_idx[\s\S]*?where immediate_rematch_loss_id is null/);
  assert.match(sql,/unique index if not exists cage_championship_one_immediate_rematch_per_loss_idx[\s\S]*?\(immediate_rematch_loss_id\)/);
  assert.match(sql,/history\.former_champion_id=v_player\.id[\s\S]*?history\.created_at>=v_title\.won_at[\s\S]*?not exists[\s\S]*?rematch\.started_at>=history\.created_at/);
  assert.match(sql,/if not v_player_is_champion and not v_rematch_right and exists/);
  assert.match(sql,/for update/);assert.match(sql,/pg_advisory_xact_lock/);
  assert.match(sql,/v_user_id,v_today,v_rematch_loss_id/);
  assert.match(sql,/career\.rematch_right or not daily\.used/);
  assert.doesNotMatch(sql,/rematch_available|title rematch is available at midnight/);
  assert.match(sql,/revoke all on function public\.begin_cage_championship_challenge\(uuid\) from public,anon/);
});

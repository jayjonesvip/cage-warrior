'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),logic=require('../js/game-logic.js'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
test('five wins grant fights; ten grants flat Aura only once per day',()=>{
  const state={aura:90,dailyCounters:logic.dailyCountersFor({},'2026-09-06')};
  for(let i=1;i<=12;i++){
    const reward=logic.applyDailyFightStreak(state.dailyCounters,{won:true,playerLevel:5,opponentLevel:5});
    assert.equal(reward.awarded,i===5);assert.equal(logic.claimDailyHeatAura(state),i===10);
  }
  assert.equal(state.aura,95);assert.equal(state.dailyCounters.bonusFightAwarded,true);
  state.dailyCounters=logic.dailyCountersFor(state.dailyCounters,'2026-09-06');
  assert.equal(logic.claimDailyHeatAura(state),false);
  state.dailyCounters=logic.dailyCountersFor(state.dailyCounters,'2026-09-07');
  assert.equal(state.dailyCounters.heatAuraAwarded,false);assert.equal(state.dailyCounters.qualifyingWinStreak,0);
});
test('ineligible wins/losses reset ten-win progress but preserve earned fights',()=>{
  for(const match of [{won:false,opponentLevel:5},{won:true,opponentLevel:4}]){
    const state={aura:20,dailyCounters:{qualifyingWinStreak:9,bonusFightAwarded:true}};
    logic.applyDailyFightStreak(state.dailyCounters,{playerLevel:5,...match});
    assert.equal(logic.claimDailyHeatAura(state),false);assert.equal(state.dailyCounters.qualifyingWinStreak,0);assert.equal(state.dailyCounters.bonusFightAwarded,true);
  }
  const state={aura:98,dailyCounters:{qualifyingWinStreak:10}};
  assert.equal(logic.claimDailyHeatAura(state),true);assert.equal(state.aura,100);
});
test('ten distinct CEO messages match the public migration pool',()=>{
  const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8'),box={};
  vm.runInNewContext(read('js/strings.js'),box);
  const pool=box.CAGE_STRINGS.social.ceo.dailyHeat;
  assert.equal(pool.length,10);assert.equal(new Set(pool).size,10);
  const sql=read('supabase/migrations/20260908180000_level_grouped_fighter_roster.sql');
  for(const message of pool)assert.ok(sql.includes(message.replaceAll("'","''")));
  assert.match(sql,/for update/);assert.match(sql,/official_event_key=v_key/);
  assert.match(sql,/auth.uid\(\)/);assert.match(sql,/owner_id=v_user/);
});

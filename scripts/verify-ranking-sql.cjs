// Run with PGLITE_MODULE_PATH pointing to an installed @electric-sql/pglite package.
const {PGlite}=require(process.env.PGLITE_MODULE_PATH||'@electric-sql/pglite');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),logic=require('../js/game-logic.js');
(async()=>{
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create schema auth;
 create function auth.uid() returns uuid language sql as $$select '11111111-1111-4111-8111-111111111111'::uuid$$;
 create table cage_profiles(id uuid primary key,handle text,created_at timestamptz default now(),retired_at timestamptz,level int default 10,wins int default 0,losses int default 0,attribute_total int default 40,ranking_history jsonb default '[]',combat_stats jsonb,updated_at timestamptz);
 create table cage_seed_fighters(id uuid primary key,handle text,active boolean default true,level int default 10,wins int default 0,losses int default 0,ranking_history jsonb default '[]',updated_at timestamptz);
 create table cage_championship_challenges(championship_key text,challenger_id uuid,challenge_day date);
 create table cage_news_results(result_id uuid primary key,profile_id uuid,career_started_at timestamptz,bout_number int,fighter_handle text,opponent_handle text,won boolean,player_rank int,opponent_rank int,occurred_at timestamptz,seed_id uuid,seed_opposition_quality int);
 insert into cage_profiles(id,wins,losses,ranking_history,combat_stats) values(auth.uid(),3,1,'[{"won":true,"quality":88}]','{"power":30,"speed":30,"chin":30,"cardio":30}');`);
 const migration=fs.readFileSync(path.join(__dirname,'../supabase/migrations/20260908130000_ranking_scorer_v2.sql'),'utf8');
 await db.exec(migration);await db.exec(migration);
 const snapshot=logic.rankingFightSnapshot({opponentRank:5,opponentLevel:12,playerLevel:10,ranked:true});
 const rows=logic.appendRankingResult([],snapshot,'event-id','win');
 await db.query('select public.sync_cage_ranking($1,$2::jsonb,$3)',[40,JSON.stringify(rows),2]);
 const saved=(await db.query('select attribute_total,ranking_history,score_with_perks,draws from cage_profiles')).rows[0];
 assert.equal(saved.attribute_total,40);assert.equal(saved.draws,2);assert.deepEqual(saved.ranking_history,rows);assert.ok(saved.score_with_perks>0);
 let cases=0;
 for(let count=0;count<=40;count++)for(const draws of [0,2]){
 const history=Array.from({length:count},(_,i)=>({...logic.rankingFightEntry({won:i%3!==0,ranked:i%4!==0,opponentRank:i%4?i*4+1:0,playerLevel:10,opponentLevel:8+i%5}),resultId:'r'+i,...(i%11===0?{outcome:'draw'}:{}),...(i%13===0?{outcome:'dq'}:{})}));
 const profile={wins:count+3,losses:8,draws,attributeTotal:20+count*5,rankingHistory:history};
 const js=logic.rankingComponents(profile),sql=(await db.query('select public.cage_ranking_breakdown($1,$2,$3,$4,$5::jsonb) value',[profile.wins,profile.losses,draws,profile.attributeTotal,JSON.stringify(history)])).rows[0].value;
 assert.ok(Math.abs(js.score-sql.score)<.000002,JSON.stringify({count,draws,js:js.score,sql:sql.score}));
 for(const [key,value] of Object.entries(js.debug.pillars))assert.ok(Math.abs(value-sql.pillars[key])<1e-8,key);cases++;
 }
 // The live server selection must use base attributes; a larger shadow cannot win a tie.
 await db.exec(`insert into cage_profiles(id,handle,wins,losses,draws,ranking_history,combat_stats) select '22222222-2222-4222-8222-222222222222','AAA',wins,losses,draws,ranking_history,'{"power":90,"speed":90,"chin":90,"cardio":90}' from cage_profiles limit 1;`);
 const selected=(await db.query("select public.select_cage_championship_defense_challenger('99999999-9999-4999-8999-999999999999',current_date) id")).rows[0].id;
 assert.equal(selected,'11111111-1111-4111-8111-111111111111');
 // Seed and player result rows preserve booked values even after levels change.
 await db.exec("update cage_profiles set handle='Player',level=99 where id=auth.uid();insert into cage_seed_fighters(id,handle,level) values('33333333-3333-4333-8333-333333333333','Seed',99)");
 const career=(await db.query('select created_at from cage_profiles where id=auth.uid()')).rows[0].created_at;
 const seedSnapshot=logic.rankingFightSnapshot({opponentRank:25,playerLevel:10,opponentLevel:12,ranked:true});
 const event={resultId:'44444444-4444-4444-8444-444444444444',bout:4,at:new Date().toISOString(),career,won:true,opponent:'Seed',playerRank:25,opponentRank:5,seedId:'33333333-3333-4333-8333-333333333333',rankingSnapshot:snapshot,seedRankingSnapshot:seedSnapshot};
 await db.query('select public.record_cage_news_result($1::jsonb)',[JSON.stringify(event)]);await db.query('select public.record_cage_news_result($1::jsonb)',[JSON.stringify(event)]);
 const seed=(await db.query('select losses,ranking_history from cage_seed_fighters')).rows[0];assert.equal(seed.losses,1);assert.equal(seed.ranking_history[0].quality_points,seedSnapshot.quality_points);assert.equal(seed.ranking_history[0].opponent_level_at_booking,12);
 const durable=(await db.query('select quality_points,opponent_level_at_booking from cage_news_results')).rows[0];assert.equal(Number(durable.quality_points),snapshot.quality_points);assert.equal(durable.opponent_level_at_booking,12);
 console.log(`Migration applied twice; snapshot sync, shadow isolation, and ${cases} JavaScript/PostgreSQL parity cases passed.`);await db.close();
})().catch(error=>{console.error(error);process.exit(1)});

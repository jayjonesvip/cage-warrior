// Run with PGLITE_MODULE_PATH pointing to an external @electric-sql/pglite install.
const {PGlite}=require(process.env.PGLITE_MODULE_PATH||'@electric-sql/pglite');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),logic=require('../js/game-logic.js');
(async()=>{
 const db=new PGlite(),stats=n=>({power:n,speed:n,chin:n,cardio:n}),id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`,migration=name=>fs.readFileSync(path.join(__dirname,'../supabase/migrations/'+name+'.sql'),'utf8');
 await db.exec(`create role anon;create role authenticated;create schema auth;
 create function auth.uid() returns uuid language sql as $$select '${id(1)}'::uuid$$;
 create table cage_profiles(id uuid primary key,handle text,created_at timestamptz default now()-interval '3 days',retired_at timestamptz,level int,wins int default 0,losses int default 0,attribute_total int default 20,ranking_history jsonb default '[]',combat_stats jsonb,updated_at timestamptz);
 create table cage_seed_fighters(id uuid primary key,handle text,active boolean default true,level int,wins int default 0,losses int default 0,ranking_history jsonb default '[]',updated_at timestamptz);
 create table cage_news_results(result_id uuid primary key,profile_id uuid,career_started_at timestamptz,bout_number int,fighter_handle text,opponent_handle text,won boolean,player_rank int,opponent_rank int,occurred_at timestamptz,seed_id uuid,seed_opposition_quality int);
 create table cage_championship(championship_key text primary key,champion_id uuid,champion_level_at_win int,won_at timestamptz,defenses int default 0,updated_at timestamptz);
 create table cage_championship_history(id bigint generated always as identity primary key,championship_key text,action text,champion_id uuid,former_champion_id uuid,champion_level int,defenses int);
 create table cage_championship_challenges(championship_key text,challenger_id uuid,challenge_day date);
 create table cage_feed_posts(id bigint generated always as identity,author_id uuid,author_handle text,post_kind text,body text,official_event_key text,created_at timestamptz);
 create table cage_career_saves(owner_id uuid,state jsonb);
 insert into cage_championship values('world','${id(1)}',3,now(),4,now());`);
 await db.exec(migration('20260908130000_ranking_scorer_v2'));
 await db.exec(migration('20260908140000_protect_ranking_score_on_wins'));
 const profiles=[[1,3,1,0],[2,40,8,2],[3,40,4,1],[4,40,8,2],[5,20,100,0],[6,40,9,1],[7,40,18,2],[8,40,18,2]].map(([n,level,wins,losses])=>({id:id(n),handle:'Fighter'+n,level,wins,losses,combat_stats:stats(n)}));
 for(const p of profiles)await db.query('insert into cage_profiles(id,handle,level,wins,losses,combat_stats) values($1,$2,$3,$4,$5,$6)',[p.id,p.handle,p.level,p.wins,p.losses,JSON.stringify(p.combat_stats)]);
 // Historical ranked human bouts must backfill, while an identically named Circuit bout must not.
 await db.exec(`insert into cage_news_results(result_id,profile_id,career_started_at,opponent_handle,opponent_rank,occurred_at,won) select '${id(101)}',id,created_at,'Fighter7',5,now()-interval '1 day',true from cage_profiles where id='${id(8)}';
 insert into cage_news_results(result_id,profile_id,career_started_at,opponent_handle,opponent_rank,occurred_at,won) select '${id(102)}',id,created_at,'Fighter8',0,now()-interval '1 day',true from cage_profiles where id='${id(7)}';`);
 const before=(await db.query('select * from cage_championship')).rows;
 for(const name of ['20260908180000_level_grouped_fighter_roster','20260908190000_fighter_record_tiebreakers']){await db.exec(migration(name));await db.exec(migration(name))}
 assert.deepEqual((await db.query('select * from cage_championship')).rows,before,'migration must not transfer the belt');
 assert.equal((await db.query('select opponent_profile_id from cage_news_results where result_id=$1',[id(101)])).rows[0].opponent_profile_id,id(7));
 assert.equal((await db.query('select opponent_profile_id from cage_news_results where result_id=$1',[id(102)])).rows[0].opponent_profile_id,null);
 let cases=0;
 for(const combat_stats of [null,{},stats(1),stats(10000),{...stats(5),speed:0},{...stats(5),speed:1.5},{...stats(5),speed:'5'},{power:6},stats(99)]){
  assert.equal((await db.query('select cage_fighter_attribute_total(35,$1) value',[JSON.stringify(combat_stats)])).rows[0].value,logic.fighterAttributeTotal({attribute_total:35,combat_stats}));cases++;
 }
 const ids=profiles.map(p=>p.id),headToHead=async()=> (await db.query('select * from get_cage_head_to_head($1)',[ids])).rows.map(p=>({...p,wins:Number(p.wins),losses:Number(p.losses)}));
 const h2h=await headToHead();assert.equal(h2h.length,2);assert.equal(h2h.find(p=>p.fighter_id===id(8)).wins,1);
 const sorted=(await db.query('select fighter_id from cage_fighter_order($1) order by list_order',[ids])).rows.map(p=>p.fighter_id);
 assert.deepEqual(sorted,logic.orderFighters(profiles,null,1000,h2h).map(p=>p.id));assert.deepEqual(sorted,[8,7,6,2,4,3,5,1].map(id));
 const challenger=async()=> (await db.query("select select_cage_championship_defense_challenger($1,'2026-09-08') id",[id(1)])).rows[0].id;
 assert.equal(await challenger(),id(8),'head-to-head breaks an exact record tie');
 await db.exec(`insert into cage_championship_challenges values('world','${id(8)}','2026-09-08');`);
 assert.equal(await challenger(),id(7),'already challenged fighters remain excluded');
 await db.exec(`update cage_profiles set retired_at=now() where id='${id(7)}';`);
 assert.equal(await challenger(),id(6),'retired fighters remain excluded');
 await db.exec(`update cage_profiles set wins=0,losses=0 where id='${id(6)}';`);
 assert.equal(await challenger(),id(2),'unproven fighters remain excluded');
 // Fresh human results persist an immutable opponent ID and remain idempotent.
 const career=(await db.query('select created_at from cage_profiles where id=$1',[id(1)])).rows[0].created_at;
 const event={resultId:id(201),bout:2,at:new Date().toISOString(),career,won:true,opponent:'Fighter5',opponentId:id(5),playerRank:0,opponentRank:0};
 for(let i=0;i<2;i++)await db.query('select record_cage_news_result($1)',[event]);
 assert.equal((await db.query('select count(*)::int n from cage_news_results where result_id=$1',[event.resultId])).rows[0].n,1);
 assert.equal((await headToHead()).find(p=>p.fighter_id===id(1)&&p.opponent_id===id(5)).wins,1);
 await assert.rejects(()=>db.query('select record_cage_news_result($1)',[{...event,resultId:id(202),opponentId:id(4)}]),/Invalid opponent identity/);
 await assert.rejects(()=>db.query('select record_cage_news_result($1)',[{...event,won:false}]),/Conflicting fight result ID/);
 // Seeded opponents contribute their inverse result to the same head-to-head mini-table.
 await db.exec(`insert into cage_seed_fighters(id,handle,level) values('${id(9)}','SeedNine',40);`);
 await db.query('select record_cage_news_result($1)',[{...event,resultId:id(203),bout:3,opponent:'SeedNine',opponentId:null,seedId:id(9),seedRankingSnapshot:{opponent_level_at_booking:3,quality_points:35}}]);
 const seedH2h=(await db.query('select * from get_cage_head_to_head($1)',[[id(1),id(9)]])).rows;
 assert.equal(Number(seedH2h.find(p=>p.fighter_id===id(9)).losses),1);
 // Equal-record cycles and draws have exactly the same outcome in SQL and JavaScript.
 await db.exec(`update cage_profiles set wins=8,losses=2 where id in ('${id(2)}','${id(3)}','${id(4)}');`);
 for(const [winner,loser,n] of [[2,3,302],[3,4,303],[4,2,304]])await db.query(`insert into cage_news_results(result_id,profile_id,career_started_at,opponent_profile_id,opponent_handle,occurred_at,won) select $1,id,created_at,$2,$3,now(),true from cage_profiles where id=$4`,[id(n),id(loser),'Fighter'+loser,id(winner)]);
 const tiedIds=[id(2),id(3),id(4)];
 for(const draws of [0,1]){
  await db.query('update cage_profiles set draws=$1 where id=$2',[draws,id(3)]);
  const rows=(await db.query('select * from cage_profiles where id=any($1)',[tiedIds])).rows,meetings=(await db.query('select * from get_cage_head_to_head($1)',[tiedIds])).rows;
  assert.deepEqual((await db.query('select fighter_id from cage_fighter_order($1) order by list_order',[tiedIds])).rows.map(p=>p.fighter_id),logic.orderFighters(rows,null,1000,meetings).map(p=>p.id));
 }
 const ensure=async former=>(await db.query('select ensure_cage_champion($1) id',[former])).rows[0].id;
 assert.equal(await ensure(null),id(1),'active champion remains champion');
 await db.exec(`update cage_profiles set retired_at=now() where id='${id(1)}';`);
 assert.equal(await ensure(id(1)),id(8),'succession uses the same record ordering');
 await ensure(null);assert.equal((await db.query('select count(*)::int n from cage_championship_history')).rows[0].n,1);
 for(const role of ['anon','authenticated'])for(const fn of ['cage_fighter_order(uuid[])','cage_head_to_head(uuid[])','ensure_cage_champion(uuid)','select_cage_championship_defense_challenger(uuid,date)'])assert.equal((await db.query('select has_function_privilege($1,$2,\'EXECUTE\') allowed',[role,fn])).rows[0].allowed,false);
 for(const [role,allowed] of [['anon',false],['authenticated',true]])assert.equal((await db.query("select has_function_privilege($1,'get_cage_head_to_head(uuid[])','EXECUTE') allowed",[role])).rows[0].allowed,allowed);
 await db.close();console.log(`Verified ${cases} attribute fixtures; SQL/JS record and H2H ordering; human/seed results, retry validation, historical backfill, title selection and permissions.`);
})().catch(error=>{console.error(error.message);process.exit(1)});

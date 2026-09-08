// Run with PGLITE_MODULE_PATH pointing to an external @electric-sql/pglite install.
const {PGlite}=require(process.env.PGLITE_MODULE_PATH||'@electric-sql/pglite');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'../supabase/migrations',name),'utf8');
(async()=>{
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create schema auth;
 create function auth.uid() returns uuid language sql as $$select '11111111-1111-4111-8111-111111111111'::uuid$$;
 create table cage_profiles(id uuid primary key,handle text,city text,archetype text,fighter_avatar text,level int,wins int,losses int,created_at timestamptz,updated_at timestamptz,retired_at timestamptz);
 create table cage_name_registry(name text primary key,owner_id uuid,retired_at timestamptz);`);
 const original=read('20260903120000_seed_circuit_fighters.sql');
 await db.exec(original.slice(0,original.indexOf('-- Keep the six newest')));
 await db.exec(read('20260908150000_expand_fighter_avatars_to_65.sql'));
 const before=(await db.query('select * from cage_seed_fighters order by id')).rows;
 const tablesBefore=(await db.query("select schemaname,tablename from pg_tables where schemaname not in ('pg_catalog','information_schema') order by schemaname,tablename")).rows;
 assert.equal(before.length,28);
 const migration=read('20260908160000_add_fifteen_seeded_fighters.sql');
 // Reserved names fail atomically, including a retired player's registry entry.
 await db.exec("insert into cage_name_registry values('ironcometphx',auth.uid(),now())");
 await assert.rejects(db.exec(migration),/reserved player name/);await db.exec('rollback');
 assert.deepEqual((await db.query('select * from cage_seed_fighters order by id')).rows,before);
 await db.exec('delete from cage_name_registry');
 await db.exec("insert into cage_profiles(id,handle) values(auth.uid(),'ATLANTICONYXATL')");
 await assert.rejects(db.exec(migration),/reserved player name/);await db.exec('rollback');
 assert.deepEqual((await db.query('select * from cage_seed_fighters order by id')).rows,before);
 await db.exec('delete from cage_profiles');
 await db.exec(migration);
 assert.equal((await db.query('select count(*) count from cage_seed_fighters')).rows[0].count,43);
 assert.deepEqual((await db.query("select schemaname,tablename from pg_tables where schemaname not in ('pg_catalog','information_schema') order by schemaname,tablename")).rows,tablesBefore);
 const access=(await db.query("select relrowsecurity rls,has_table_privilege('anon','public.cage_seed_fighters','SELECT') anon_read,has_table_privilege('authenticated','public.cage_seed_fighters','SELECT') authenticated_read from pg_class where oid='public.cage_seed_fighters'::regclass")).rows[0];
 assert.deepEqual(access,{rls:true,anon_read:false,authenticated_read:true});
 const originalIds=before.map(row=>row.id);
 assert.deepEqual((await db.query('select * from cage_seed_fighters where id=any($1::uuid[]) order by id',[originalIds])).rows,before);
 // A rerun must not revive fighters or erase any gameplay progress.
 await db.exec(`update cage_seed_fighters set wins=wins+1,losses=losses+1,active=false,
 ranking_history='[{"won":false,"quality":20}]' where fighter_avatar='fighter-51'`);
 const played=(await db.query('select * from cage_seed_fighters order by id')).rows;
 await db.exec(migration);
 assert.deepEqual((await db.query('select * from cage_seed_fighters order by id')).rows,played);
 // The existing roster RPC makes the added fighters available without browser changes.
 const roster=original.match(/create or replace function public\.get_cage_seed_fighter_roster\([\s\S]*?\n\$\$;/)[0];
 await db.exec(roster);
 const available=(await db.query('select * from public.get_cage_seed_fighter_roster()')).rows;
 assert.equal(available.length,42);assert.equal(available.filter(row=>Number(row.fighter_avatar.slice(-2))>=51).length,14);
 console.log('43 seeded fighters validated; repeat application preserves records and inactive status, player-name collisions roll back, and the roster RPC exposes the new fighters.');
 await db.close();
})().catch(error=>{console.error(error);process.exitCode=1});

const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const sql=read('supabase/migrations/20260908160000_add_fifteen_seeded_fighters.sql');
const rows=[...sql.matchAll(/\('([^']+)'::uuid,'([^']+)','([^']+)','([^']+)','([^']+)',([\d,]+),'([^']+)'::jsonb\)/g)].map(([,id,handle,city,archetype,avatar,numbers,history])=>({id,handle,city,archetype,avatar,numbers:numbers.split(',').map(Number),history:JSON.parse(history)}));

test('additional seeded roster supplies fifteen unique balanced fighters using avatars 51-65',()=>{
 const definitions=read('js/definitions.js'),avatars=vm.runInNewContext(definitions.slice(definitions.indexOf('const fighterAvatars = ['),definitions.indexOf('const auraFightSkins'))+';fighterAvatars');
 assert.equal(rows.length,15);assert.equal(new Set(rows.map(row=>row.id)).size,15);assert.equal(new Set(rows.map(row=>row.handle.toLowerCase())).size,15);
 assert.equal(rows.filter(row=>row.archetype==='striker').length,8);assert.equal(rows.filter(row=>row.archetype==='grappler').length,7);
 for(const [i,row] of rows.entries()){
  const [level,wins,losses,...stats]=row.numbers,base=stats.slice(0,4),current=stats.slice(4),avatar=avatars.find(item=>item.id===row.avatar);
  assert.equal(level,i+2);assert.equal(row.avatar,`fighter-${51+i}`);assert.match(row.handle,/^[A-Za-z][A-Za-z0-9_]{2,31}$/);
  assert.deepEqual(base,Object.values(avatar.stats));assert.equal(base.reduce((sum,n)=>sum+n,0),20);
  assert.ok(current.every((n,j)=>n>=base[j]));assert.ok(current.reduce((sum,n)=>sum+n,0)-20<=wins);
  assert.ok(row.history.length<=Math.min(10,wins+losses));
  assert.ok(row.history.filter(bout=>bout.won).length<=wins);assert.ok(row.history.filter(bout=>!bout.won).length<=losses);
  assert.ok(row.history.every(bout=>bout.quality_points>=30&&bout.quality_points<=40&&bout.opponent_rank_at_booking===null));
 }
});

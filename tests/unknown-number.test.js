const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
test('Unknown Number has ten distinct outcome-neutral one-message threads',()=>{
  const root=path.join(__dirname,'..'),context={};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'js/strings.js'),'utf8'),context);
  const config=context.CAGE_STRINGS.postFightTexts,contact=config.contacts.find(c=>c.id==='unknown-number');
  assert.equal(config.chance,.32);assert.equal(contact.name,'Unknown Number');assert.equal(contact.messages.length,10);
  assert.equal(new Set(contact.messages.map(thread=>thread[0])).size,10);
  assert.ok(contact.messages.every(thread=>thread.length===1));assert.ok(fs.existsSync(path.join(root,contact.avatar)));
  assert.match(fs.readFileSync(path.join(root,'js/game.js'),'utf8'),/threads=contact.messages\|\|contact\[threadKey\]/);
});

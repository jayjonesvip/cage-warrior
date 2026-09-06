'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
test('all landing and information pages link to the official Facebook page',()=>{
  for(const file of ['index.html','origins.html','how-to-play.html','privacy.html']){
    assert.match(read(file),/href="https:\/\/facebook.com\/CageGrind" target="_blank" rel="noopener noreferrer"/);
  }
});
test('landing information pages are linked, discoverable, and cached',()=>{
  for(const file of ['how-to-play.html','privacy.html']){
    const page=read(file);
    assert.ok(read('index.html').includes('href="'+file+'"'));
    assert.ok(read('sitemap.xml').includes('https://cagegrind.com/'+file));
    assert.ok(read('service-worker.js').includes("'./"+file+"'"));
    assert.match(page,/<main>/);
    assert.match(page,/aria-current="page"/);
    assert.match(page,/css\/info-pages.css\?v=/);
    for(const match of page.matchAll(/(?:href|src)="([^"]+)"/g)){
      if(!/^https?:/.test(match[1]))assert.ok(fs.existsSync(path.join(root,match[1].split('?')[0])),match[1]);
    }
  }
});
test('guide covers daily fights and privacy distinguishes local and online data',()=>{
  assert.match(read('how-to-play.html'),/12 fights/);
  assert.match(read('how-to-play.html'),/three extra fights/);
  assert.match(read('privacy.html'),/Google Analytics/);
  assert.match(read('privacy.html'),/Supabase/);
  assert.match(read('privacy.html'),/does not automatically erase/);
});

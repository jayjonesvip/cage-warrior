'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),pilot=require('../js/pilot-sponsor.js');
const defs=()=>[{id:'ironhide',brand:'Ironhide Athletics',product:'Gloves',followersRequired:10000}];
const config={replaces:'ironhide',brand:'Test Fightwear',logoAsset:'assets/partners/test.png',website:'https://example.com/shop'};
test('empty or incomplete pilot leaves existing progression untouched',()=>{
  for(const value of [null,{}, {...config,brand:''},{...config,replaces:'missing'},{...config,logoAsset:'../private.png'}]){
    const original=defs(),before=structuredClone(original);assert.equal(pilot.apply(original,value),false);assert.deepEqual(original,before);
  }
});
test('pilot preserves ID and progression threshold while adding approved branding',()=>{
  const original=defs();assert.equal(pilot.apply(original,config),true);
  assert.equal(original[0].id,'ironhide');assert.equal(original[0].followersRequired,10000);
  assert.equal(original[0].brand,'Test Fightwear');assert.equal(original[0].originalBrand,'Ironhide Athletics');
  assert.equal(original[0].website,'https://example.com/shop');assert.equal(original[0].highlightMessages.length,5);
});
test('unsafe or missing external links are omitted, not rendered as sponsor CTAs',()=>{
  for(const url of ['',undefined,'javascript:alert(1)','data:text/html,test','http://example.com','https://user:pass@example.com']){
    assert.equal(pilot.website(url),'');
  }
  assert.equal(pilot.website('https://example.com'),'https://example.com/');
  assert.equal(pilot.logo('assets/../../test.png'),'');
  assert.equal(pilot.logo('assets/partners/test.png'),'assets/partners/test.png');
});

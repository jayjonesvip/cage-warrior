(function(root){
  'use strict';
  // Set to a sponsor object to activate; null leaves all progression sponsors unchanged.
  // See docs/pilot-sponsor.md. This does not affect collectible/drop sponsors.
  const CONFIG=null;
  function website(value){
    try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:''}catch{return ''}
  }
  function logo(value){return typeof value==='string'&&/^assets\/[A-Za-z0-9_/-]+\.(png|jpg|jpeg|webp|svg)$/.test(value)?value:''}
  function apply(definitions,config=CONFIG){
    if(!config||typeof config!=='object')return false;
    const slot=definitions.find(item=>item.id===config.replaces),brand=typeof config.brand==='string'?config.brand.trim().slice(0,80):'',asset=logo(config.logoAsset);
    if(!slot||!brand||!asset)return false;
    const clean=value=>typeof value==='string'?value.trim().slice(0,500):'';
    Object.assign(slot,{
      pilot:true,originalBrand:slot.brand,brand,logoAsset:asset,website:website(config.website),
      handle:/^@[A-Za-z][A-Za-z0-9_]{2,31}$/.test(config.handle)?config.handle:'@'+brand.replace(/[^A-Za-z0-9]/g,'').slice(0,31),
      product:clean(config.product)||'Fight apparel and equipment',
      bio:clean(config.bio)||brand+' is a pilot progression sponsor in Cage Grind.',
      highlightMessages:Array.isArray(config.messages)&&config.messages.length===5&&config.messages.every(message=>typeof message==='string'&&message.trim())?config.messages.map(clean):[
        '@{name} just delivered {moment}. Proud to stand behind that work.',
        'Hard work gets noticed. Congratulations to @{name} on {moment}.',
        'Another reason we back @{name}: {moment}. Keep building.',
        'From the gym to the cage, commitment counts. @{name} earned {moment}.',
        'Our corner is cheering for @{name} after {moment}. On to the next challenge.'
      ]
    });
    return true;
  }
  const api={apply,website,logo};root.CAGE_PILOT_SPONSOR=api;if(typeof module==='object')module.exports=api;
})(globalThis);

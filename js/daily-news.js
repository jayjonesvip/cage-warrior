(function(root,factory){
  const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.CAGE_DAILY_NEWS=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function dayKey(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
  function edition(now=new Date()){
    const end=new Date(now.getFullYear(),now.getMonth(),now.getDate()),start=new Date(end);
    start.setDate(start.getDate()-1);
    return {key:dayKey(end),start:start.toISOString(),end:end.toISOString(),label:start.toLocaleDateString(undefined,{month:'short',day:'numeric'})};
  }
  function eligible(career,seen,now=new Date()){
    const born=new Date(career);return Number.isFinite(born.getTime())&&dayKey(born)<dayKey(now)&&seen!==dayKey(now);
  }
  function stories(data){
    const items=[];const count=Math.max(0,Number(data?.newFighters)||0),fights=Math.max(0,Number(data?.fights)||0);
    for(const title of data?.titles||[])items.push(title.action==='transfer'
      ?{tag:'AND NEW',title:'A new king of the cage.',body:`@${title.handle} took the world title. The chase starts all over again.`}
      :{tag:'AND STILL',title:'The crown stays put.',body:`@${title.handle} defended the world title. Another challenger sent back to the drawing board.`});
    if(count)items.push({tag:'FRESH BLOOD',title:`${count} new fighter${count===1?'':'s'}. Zero fear.`,body:`The roster got a little hungrier. ${count===1?'A new career began':`${count} new careers began`} yesterday.`});
    if(data?.upset)items.push({tag:'UPSET WATCH',title:'The rankings didn’t see it coming.',body:`@${data.upset.winner} beat higher-ranked @${data.upset.opponent}. The climb just got interesting.`});
    if(fights)items.push({tag:'AROUND THE CAGE',title:`${fights} fight${fights===1?'':'s'}. One wild day.`,body:'Recorded yesterday across Cage Grind. Every result left somebody with something to prove.'});
    return items;
  }
  function create({element,client,storage,now=()=>new Date()}){
    let profile=null,home=false,loading=false,attempt='',slides=[],index=0,visible=false,editionKey='';
    const read=(key,fallback)=>{try{return JSON.parse(storage.getItem(key))??fallback}catch{return fallback}};
    const write=(key,value)=>{try{storage.setItem(key,JSON.stringify(value));return true}catch{return false}};
    const key=()=>`cage-daily-news:${profile.id}:${profile.created_at}`;
    const hide=()=>{visible=false;element.hidden=true};
    function draw(){
      const story=slides[index];if(!story)return;
      element.querySelector('[data-news-tag]').textContent=story.tag;
      element.querySelector('[data-news-title]').textContent=story.title;
      element.querySelector('[data-news-body]').textContent=story.body;
      const dots=element.querySelector('[data-news-dots]');dots.replaceChildren();
      slides.forEach((_,i)=>{const button=document.createElement('button');button.type='button';button.className='daily-news-dot';button.setAttribute('aria-label',`Headline ${i+1} of ${slides.length}`);button.setAttribute('aria-current',String(i===index));button.onclick=()=>{index=i;draw()};dots.append(button)});
      element.querySelector('[data-news-controls]').hidden=slides.length<2;
    }
    function move(delta){if(slides.length){index=(index+delta+slides.length)%slides.length;draw()}}
    element.querySelector('[data-news-close]').onclick=hide;
    element.querySelector('[data-news-prev]').onclick=()=>move(-1);
    element.querySelector('[data-news-next]').onclick=()=>move(1);
    let touchX=0;const body=element.querySelector('[data-news-story]');
    body.addEventListener('touchstart',event=>{touchX=event.changedTouches[0].clientX},{passive:true});
    body.addEventListener('touchend',event=>{const delta=event.changedTouches[0].clientX-touchX;if(Math.abs(delta)>40)move(delta<0?1:-1)},{passive:true});
    async function load(){
      if(!home||!profile||loading)return;
      const current=edition(now()),owner=key();
      if(visible&&editionKey===current.key)return;
      if(visible)hide();
      if(!eligible(profile.created_at,read(owner,''),now()))return;
      if(attempt===owner+current.key)return;
      attempt=owner+current.key;loading=true;
      try{
        const data=await client.loadDailyNews({p_start:current.start,p_end:current.end});
        if(!home||owner!==key()||current.key!==edition(now()).key){attempt='';return}
        slides=stories(data);if(!slides.length)return;
        // Mark on first display, not close: navigation/reload must not repeat it.
        write(owner,current.key);editionKey=current.key;index=0;draw();
        element.querySelector('[data-news-date]').textContent=`${current.label.toUpperCase()} · YESTERDAY’S ROUNDUP`;
        visible=true;element.hidden=false;
      }catch{attempt='';/* Missing migration/network: don't block Home or mark seen. */}
      finally{loading=false}
    }
    let flushing=false;
    async function flush(){
      if(!profile||flushing)return;flushing=true;const owner=key(),outbox=owner+':results';
      try{for(const result of read(outbox,[])){
        if(owner!==key())break;
        if(now().getTime()-Date.parse(result.at)>7*86400000){write(outbox,read(outbox,[]).filter(item=>item.bout!==result.bout));continue}
        await client.recordNewsResult(result);
        write(outbox,read(outbox,[]).filter(item=>item.bout!==result.bout));
      }}catch{/* Retry after the next successful career sync. */}finally{flushing=false}
    }
    return {
      profile(value){if(!value?.id||!value.created_at)return;if(profile&&(profile.id!==value.id||profile.created_at!==value.created_at)){hide();attempt=''}profile=value;void flush();void load()},
      visit(isHome){home=isHome;if(!home){hide();return}void load()},
      record(result){if(!profile)return;const outbox=key()+':results',queue=read(outbox,[]);if(!queue.some(item=>item.bout===result.bout))write(outbox,[...queue,{...result,career:profile.created_at}].slice(-100))}
    };
  }
  return {dayKey,edition,eligible,stories,create};
});

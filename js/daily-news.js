(function(root,factory){
  const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.CAGE_DAILY_NEWS=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function dayKey(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
  function edition(now=new Date()){
    const end=new Date(now),start=new Date(end.getTime()-86400000);
    return {key:dayKey(end),start:start.toISOString(),end:end.toISOString(),label:end.toLocaleDateString(undefined,{month:'short',day:'numeric'})};
  }
  function eligible(career,dismissedAt,now=new Date()){
    const born=new Date(career);return Number.isFinite(born.getTime())&&dayKey(born)<dayKey(now)&&!(Number(dismissedAt)>0&&now.getTime()-Number(dismissedAt)<86400000);
  }
  function roundup(data={}){
    const lines=[],count=Math.max(0,Number(data.newFighters)||0),fights=Math.max(0,Number(data.fights)||0);
    if(count)lines.push(`We welcomed ${count} new fighter${count===1?'':'s'}.`);
    if(fights)lines.push(`We recorded ${fights} fight${fights===1?'':'s'} across Cage Grind.`);
    const titles=new Map();
    for(const title of data.titles||[]){
      if(!['transfer','defense'].includes(title.action))continue;
      const key=title.action+':'+title.handle,entry=titles.get(key),count=Math.max(1,Number(title.count)||1);
      if(entry)entry.count+=count;else titles.set(key,{...title,count});
    }
    for(const title of titles.values())lines.push(title.action==='transfer'
      ?`@${title.handle} ${title.count>1?'won the world title '+title.count+' times':'took the world title'}.`
      :`@${title.handle} defended the world title${title.count>1?' '+title.count+' times':''}.`);
    const upsets=Array.isArray(data.upsets)?data.upsets:data.upset?[data.upset]:[];
    for(const upset of upsets)lines.push(`@${upset.winner} beat higher-ranked @${upset.opponent}${Number(upset.count)>1?' '+upset.count+' times':''}.`);
    return lines.length?`Fighters, here’s the past 24 hours. ${lines.join(' ')} The next card is yours to make.`:'Fighters, it’s been a quiet 24 hours. No newsworthy events were recorded. Scout your next opponent and make the next card count.';
  }
  function create({element,client,storage,tips=[],random=Math.random,now=()=>new Date(),schedule=setTimeout,cancel=clearTimeout,onSyncError=()=>{}}){
    let profile=null,home=false,loading=false,attempt='',visible=false,wakeTimer=null;const dismissed=new Map();
    const read=(key,fallback)=>{try{return JSON.parse(storage.getItem(key))??fallback}catch{return fallback}};
    const write=(key,value)=>{try{storage.setItem(key,JSON.stringify(value));return true}catch{return false}};
    const key=()=>`cage-daily-news:${profile.id}:${profile.created_at}`;
    const hide=()=>{visible=false;element.hidden=true};
    const stopWake=()=>{if(wakeTimer!==null)cancel(wakeTimer);wakeTimer=null};
    function wakeAfter(delay){stopWake();wakeTimer=schedule(()=>{wakeTimer=null;void load()},Math.max(1,delay));wakeTimer?.unref?.()}
    element.querySelector('[data-news-close]').onclick=()=>{if(!visible||!profile)return;const at=now().getTime();dismissed.set(key(),at);write(key()+':dismissed',at);hide();attempt='';if(home)wakeAfter(86400000)};
    function draw(note){element.querySelector('[data-news-body]').textContent=note.body;element.querySelector('[data-news-tip]').textContent=note.tip;element.querySelector('[data-news-date]').textContent=note.date;visible=true;element.hidden=false}
    async function load(){
      if(!home||!profile||loading)return;
      const current=edition(now()),owner=key();
      if(visible)return;

      const dismissedAt=Math.max(Number(read(owner+':dismissed',0))||0,dismissed.get(owner)||0);
      if(!eligible(profile.created_at,dismissedAt,now())){if(dismissedAt)wakeAfter(86400000-(now().getTime()-dismissedAt));return}
      const cached=read(owner+':note',null);
      if(cached&&now().getTime()-cached.createdAt<86400000){draw(cached);return}
      if(attempt===owner+current.key)return;
      attempt=owner+current.key;loading=true;
      try{
        const data=await client.loadDailyNews({p_start:current.start,p_end:current.end});
        if(!home||owner!==key()||current.key!==edition(now()).key){attempt='';return}
        const pool=tips.filter(tip=>typeof tip==='string'&&tip.trim());
        const tip=pool[Math.min(pool.length-1,Math.max(0,Math.floor(random()*pool.length)))]||'Scout your next opponent. Build your fight plan.';
        const note={createdAt:now().getTime(),body:roundup(data),tip,date:current.label.toUpperCase()+' · PAST 24 HOURS'};
        write(owner+':note',note);draw(note);
      }catch{attempt='';/* Network failures do not consume the daily note. */}
      finally{loading=false}
    }
    let flushing=false,syncWarningShown=false;
    const resultKey=result=>result.resultId||`${result.at}|${result.opponent}|${result.won}`;
    async function flush(){
      if(!profile||flushing)return;flushing=true;const owner=key(),outbox=owner+':results';
      try{for(const result of read(outbox,[])){
        if(owner!==key())break;
        if(now().getTime()-Date.parse(result.at)>7*86400000){if(!syncWarningShown){syncWarningShown=true;onSyncError(new Error('Result needs manual recovery'))}continue}
        try{
          await client.recordNewsResult(result);
          write(outbox,read(outbox,[]).filter(item=>resultKey(item)!==resultKey(result)));
        }catch(error){if(!syncWarningShown){syncWarningShown=true;onSyncError(error)}}
      }if(!read(outbox,[]).length)syncWarningShown=false;}catch(error){if(!syncWarningShown){syncWarningShown=true;onSyncError(error)}}finally{flushing=false}
    }
    return {
      async profile(value){if(!value?.id||!value.created_at)return;if(profile&&(profile.id!==value.id||profile.created_at!==value.created_at)){hide();stopWake();attempt=''}profile=value;await flush();void load()},
      visit(isHome){home=isHome;if(!home){hide();stopWake();return}void load()},
      record(result){if(!profile){onSyncError(new Error('Fighter profile has not synced'));return}const outbox=key()+':results',queue=read(outbox,[]);if(!queue.some(item=>resultKey(item)===resultKey(result)))write(outbox,[...queue,{...result,career:profile.created_at}])}
    };
  }
  return {dayKey,edition,eligible,roundup,create};
});

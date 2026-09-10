(function(root){
  'use strict';
  const LIMIT=200;
  const text=value=>typeof value==='string'?value.slice(0,120):'';
  function normalize(entries){
    return (Array.isArray(entries)?entries:[]).filter(entry=>entry&&typeof entry.won==='boolean'&&Number.isFinite(entry.date)&&entry.date>0&&entry.date<=8640000000000000).slice(-LIMIT).map(entry=>({
      ...(typeof entry.resultId==='string'&&/^[0-9a-f-]{36}$/i.test(entry.resultId)?{resultId:entry.resultId}:{}),...(Number.isFinite(entry.quality_points)?{quality_points:entry.quality_points,opponent_rank_at_booking:entry.opponent_rank_at_booking??null,opponent_level_at_booking:entry.opponent_level_at_booking??null}:{}),...(text(entry.opponentId)?{opponentId:text(entry.opponentId)}:{}),date:entry.date,won:entry.won,opponent:text(entry.opponent)||'Unknown opponent',style:text(entry.style)||'Unknown',
      method:text(entry.method)||'Unknown',submission:text(entry.submission),round:Math.max(0,Math.min(3,Math.floor(Number(entry.round)||0))),
      clock:/^\d{1,2}:\d{2}$/.test(entry.clock)?entry.clock:'',playerStyle:text(entry.playerStyle),title:entry.title===true
    }));
  }
  function append(entries,fight,date=Date.now(),playerStyle=''){
    return normalize([...normalize(entries),{
      ...fight.rankingSnapshot,resultId:fight.resultId,date,won:fight.winner==='player',opponent:fight.o?.networkHandle||fight.o?.name,opponentId:fight.o?.sourceProfileId||fight.o?.key,
      style:fight.o?.tendency||fight.o?.tag,method:fight.method,submission:fight.method==='SUBMISSION'?fight.submissionMove?.name:'',
      round:fight.finishRound,clock:fight.finishClock,playerStyle,title:!!fight.o?.globalChampionship
    }]);
  }
  function breakdown(entries){
    const counts={ko:0,sub:0,dec:0,other:0};
    for(const entry of normalize(entries)){
      if(!entry.won)continue;
      const method=entry.method.toUpperCase();
      if(/\b(?:KO|TKO)\b/.test(method))counts.ko++;
      else if(method.startsWith('SUBMISSION'))counts.sub++;
      else if(method.includes('DECISION'))counts.dec++;
      else counts.other++;
    }
    return counts;
  }
  function finishCategory(method){
    const value=String(method||'').trim().toUpperCase();
    if(/\b(?:KO|TKO)\b/.test(value))return 'ko';
    if(value.startsWith('SUBMISSION')||value==='SUB')return 'sub';
    if(value.includes('DECISION'))return 'dec';
    if(['FORFEIT','DQ','DISQUALIFICATION','NO CONTEST','OTHER'].includes(value))return 'other';
    return null;
  }
  function finishStats(entries,{opponent='',opponentId=''}={}){
    const result={ko:0,sub:0,dec:0,other:0,wins:0};
    for(const entry of normalize(entries)){
      const observingOpponent=!!(opponent||opponentId);
      if(observingOpponent&&(entry.opponentId?entry.opponentId!==opponentId:entry.opponent.toLowerCase()!==opponent.toLowerCase()))continue;
      if(observingOpponent?entry.won:!entry.won)continue;
      const category=finishCategory(entry.method);if(category){result[category]++;result.wins++}
    }
    return result;
  }
  function rematchRemaining(entries,opponent={},now=Date.now()){
    const id=String(opponent.sourceProfileId||opponent.key||''),key=String(opponent.key||''),name=String(opponent.networkHandle||opponent.name||'').replace(/^@/,'').toLowerCase();
    if(!id&&!name)return 0;
    let latest=0;
    for(const entry of (Array.isArray(entries)?entries:[]).slice(-LIMIT)){
      if(!entry||typeof entry.won!=='boolean'||!Number.isFinite(entry.date)||entry.date<=0||entry.date>now)continue;
      const matches=entry.opponentId?entry.opponentId===id||entry.opponentId===key:name&&String(entry.opponent||'').replace(/^@/,'').toLowerCase()===name;
      if(matches)latest=Math.max(latest,entry.date);
    }
    return latest?Math.max(0,latest+24*60*60*1000-now):0;
  }
  function recentResults(entries){return normalize(entries).slice(-5).reverse().map(entry=>entry.won?'W':'L')}
  function charts(entries){
    const saved=normalize(entries),total=saved.length,wins=saved.filter(entry=>entry.won).length,finishes=breakdown(saved);
    function donut(title,value,caption,segments){
      const sum=segments.reduce((n,item)=>n+item[1],0);let start=0;
      const stops=segments.filter(item=>item[1]).map(([label,count,color])=>{const end=start+count/sum*100,stop=`${color} ${start}% ${end}%`;start=end;return stop});
      const legend=segments.map(([label,count,color])=>`<span><i style="background:${color}"></i>${count} ${label}</span>`).join('');
      return `<section class="history-chart"><h3>${title}</h3><div class="history-donut" role="img" aria-label="${title}: ${segments.map(([label,count])=>count+' '+label).join(', ')}" style="background:${sum?'conic-gradient('+stops.join(',')+')':'#253644'}"><div><b>${value}</b><small>${caption}</small></div></div><div class="history-chart-legend">${legend}</div></section>`;
    }
    return donut('WIN / LOSS',total?Math.round(wins/total*100)+'%':'—','WIN RATE',[['W',wins,'#70bf99'],['L',total-wins,'#bb6878']])+donut('WIN METHODS',wins,'WINS',[['KO',finishes.ko,'#62cbea'],['SUB',finishes.sub,'#ad93d2'],['DEC',finishes.dec,'#c5a25c'],...(finishes.other?[['OTHER',finishes.other,'#a5b2bf']]:[])]);
  }
  const api={rematchRemaining,finishCategory,finishStats,normalize,append,breakdown,recentResults,charts,LIMIT};root.CAGE_FIGHT_HISTORY=api;if(typeof module==='object')module.exports=api;
})(globalThis);

(function(root){
  'use strict';
  const LIMIT=200;
  const text=value=>typeof value==='string'?value.slice(0,120):'';
  function normalize(entries){
    return (Array.isArray(entries)?entries:[]).filter(entry=>entry&&typeof entry.won==='boolean'&&Number.isFinite(entry.date)&&entry.date>0&&entry.date<=8640000000000000).slice(-LIMIT).map(entry=>({
      date:entry.date,won:entry.won,opponent:text(entry.opponent)||'Unknown opponent',style:text(entry.style)||'Unknown',
      method:text(entry.method)||'Unknown',submission:text(entry.submission),round:Math.max(0,Math.min(3,Math.floor(Number(entry.round)||0))),
      clock:/^\d{1,2}:\d{2}$/.test(entry.clock)?entry.clock:'',playerStyle:text(entry.playerStyle),title:entry.title===true
    }));
  }
  function append(entries,fight,date=Date.now(),playerStyle=''){
    return normalize([...normalize(entries),{
      date,won:fight.winner==='player',opponent:fight.o?.networkHandle||fight.o?.name,
      style:fight.o?.tendency||fight.o?.tag,method:fight.method,submission:fight.method==='SUBMISSION'?fight.submissionMove?.name:'',
      round:fight.finishRound,clock:fight.finishClock,playerStyle,title:!!fight.o?.globalChampionship
    }]);
  }
  const api={normalize,append,LIMIT};root.CAGE_FIGHT_HISTORY=api;if(typeof module==='object')module.exports=api;
})(globalThis);

(function(root){
  'use strict';
  const KEY='cage-grind-music-v1';
  const tierFor=aura=>[40,60,80,99].filter(limit=>Number(aura)>=limit).length;
  function create(options={}){
    const Context=options.AudioContext||root.AudioContext||root.webkitAudioContext;
    let enabled=false,volume=.35,ctx,master,noise,timer=null,scene='off',tier=0,step=0,next=0,generation=0;
    const voices=new Set();
    try{const saved=JSON.parse(root.localStorage.getItem(KEY));enabled=saved?.enabled===true;volume=Math.max(0,Math.min(1,Number(saved?.volume??.35)))}catch{}
    if(!Number.isFinite(volume))volume=.35;
    function save(){try{root.localStorage.setItem(KEY,JSON.stringify({enabled,volume}))}catch{}}
    function halt(){
      generation++;clearInterval(timer);timer=null;
      if(master){master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(0,ctx.currentTime,.025)}
      for(const voice of voices){try{voice.stop(ctx.currentTime+.08)}catch{}}
      voices.clear();
    }
    function voice(time,freq,duration,gain,type='sine',endFreq=0){
      const source=type==='noise'?ctx.createBufferSource():ctx.createOscillator(),env=ctx.createGain();
      if(type==='noise')source.buffer=noise;
      else{source.type=type;source.frequency.setValueAtTime(freq,time);if(endFreq)source.frequency.exponentialRampToValueAtTime(endFreq,time+duration)}
      const filter=ctx.createBiquadFilter();filter.type=type==='noise'?'highpass':'lowpass';filter.frequency.value=type==='noise'?freq:1800;
      env.gain.setValueAtTime(.0001,time);env.gain.exponentialRampToValueAtTime(gain,time+.008);env.gain.exponentialRampToValueAtTime(.0001,time+duration);
      source.connect(filter);filter.connect(env);env.connect(master);voices.add(source);
      source.onended=()=>{voices.delete(source);source.disconnect();filter.disconnect();env.disconnect()};
      source.start(time);source.stop(time+duration+.02);
    }
    function tick(){
      if(ctx.state!=='running')return;
      if(next<ctx.currentTime)next=ctx.currentTime+.03;
      const beat=60/92/4;
      while(next<ctx.currentTime+.15){
        const s=step%16,bar=Math.floor(step/16)%4,walk=scene==='walkout',rootNote=[55,55,43.654,48.999][bar];
        if(s===0||s===8||(tier>=2&&s===11))voice(next,110,.24,.5,'sine',38);
        if(s===4||s===12)voice(next,1100,.14,.13,'noise');
        if(s%(tier>=1?2:4)===0)voice(next,6500,.04,.04,'noise');
        if(s%4===0)voice(next,rootNote,.29,.18,'triangle');
        if(tier>=1&&s%4===2)voice(next,rootNote*2,.16,.045,'triangle');
        if(tier>=2&&s%4===0){const ratio=[1,1.5,1.1892,1.3348][s/4];voice(next,220*ratio,.35,.04,'triangle')}
        if(tier>=3&&s===0){voice(next,rootNote*4,1.6,.035,'sine');voice(next,rootNote*6,1.6,.025,'sine')}
        if(tier===4&&s%4===0)voice(next,440*[1,1.1892,1.5,2][s/4],.45,.025,'triangle');
        if(walk&&s%2===0)voice(next,2400,.09,.055,'noise');
        next+=beat;step++;
      }
    }
    async function play(){
      halt();const token=generation;
      if(!enabled||scene==='off'||!Context||root.document?.hidden)return;
      try{
        if(!ctx){
          ctx=new Context();master=ctx.createGain();master.gain.value=0;
          const compressor=ctx.createDynamicsCompressor();master.connect(compressor);compressor.connect(ctx.destination);
          noise=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);
          const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
        }
        await ctx.resume();
        if(token!==generation||!enabled||scene==='off'||root.document?.hidden)return;
        master.gain.setTargetAtTime(volume*(scene==='walkout'?.65:.3),ctx.currentTime,.12);
        next=ctx.currentTime+.1;step=0;tick();timer=setInterval(tick,25);
      }catch{halt()}
    }
    function setScene(value,aura=0){scene=['locker','walkout'].includes(value)?value:'off';tier=tierFor(aura);void play()}
    function setEnabled(value){enabled=!!value;save();void play()}
    function setVolume(value){const number=Number(value);if(!Number.isFinite(number))return;volume=Math.max(0,Math.min(1,number));save();if(master)master.gain.setTargetAtTime(enabled&&scene!=='off'&&!root.document?.hidden?volume*(scene==='walkout'?.65:.3):0,ctx.currentTime,.05)}
    root.document?.addEventListener('visibilitychange',()=>{if(root.document.hidden)halt();else void play()});
    root.addEventListener?.('pagehide',()=>{scene='off';halt()});
    return {setScene,setEnabled,setVolume,stop:()=>setScene('off'),get enabled(){return enabled},get volume(){return volume},get supported(){return !!Context}};
  }
  const api={create,tierFor};root.CAGE_MUSIC=api;if(typeof module==='object')module.exports=api;
})(globalThis);

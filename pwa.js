(function(root){
  'use strict';

  const VERSION_PATTERN=/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;
  function versionParts(version){return String(version||'').split(/[.+-]/,3).map(part=>Number.parseInt(part,10)||0)}
  function compareVersions(left,right){
    const a=versionParts(left),b=versionParts(right);
    for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]>b[i]?1:-1}
    return 0;
  }

  let deferredInstallPrompt=null;
  function isInstalled(){return typeof window!=='undefined'&&((window.matchMedia?.('(display-mode: standalone)').matches)||window.navigator?.standalone===true)}
  function installAvailable(){return !!deferredInstallPrompt}
  async function requestInstall(){
    if(isInstalled())return {status:'installed'};
    const prompt=deferredInstallPrompt;if(!prompt)return {status:'unavailable'};
    try{
      await prompt.prompt();const choice=await prompt.userChoice;deferredInstallPrompt=null;
      if(typeof document!=='undefined')document.dispatchEvent(new CustomEvent('cagegrind:installchange',{detail:{available:false}}));
      return {status:choice?.outcome==='accepted'?'accepted':'dismissed'};
    }catch{return {status:'unavailable'}}
  }

  root.CAGE_PWA=Object.freeze({compareVersions,validVersion:version=>VERSION_PATTERN.test(String(version||'')),isInstalled,installAvailable,requestInstall});
  if(typeof window==='undefined'||typeof document==='undefined'||typeof navigator==='undefined')return;
  if(!('serviceWorker' in navigator)||!/^https?:$/.test(window.location.protocol))return;

  const currentVersion=document.querySelector('meta[name="app-version"]')?.content||'0.0.0';
  const versionUrl=new URL('app-version.json',document.baseURI).href;
  const checkInterval=15*60*1000;
  const dismissedKey='cage-grind-dismissed-update';
  const modal=document.getElementById('appUpdateModal');
  const installedText=document.getElementById('installedAppVersion');
  const availableText=document.getElementById('availableAppVersion');
  const laterButton=document.getElementById('appUpdateLater');
  const updateButton=document.getElementById('appUpdateNow');
  let registration=null,lastCheck=0,checking=false,reloadRequested=false,returnFocus=null;

  function dispatchInstallEvent(name,detail={}){document.dispatchEvent(new CustomEvent(name,{detail}))}

  function dismissedVersion(){try{return sessionStorage.getItem(dismissedKey)||''}catch{return ''}}
  function rememberDismissal(version){try{sessionStorage.setItem(dismissedKey,version)}catch{}}
  function closeUpdate(){
    if(!modal?.classList.contains('open'))return;
    modal.classList.remove('open');modal.setAttribute('aria-hidden','true');
    const focusTarget=returnFocus;returnFocus=null;
    if(focusTarget?.isConnected)requestAnimationFrame(()=>focusTarget.focus());
  }
  function showUpdate(version){
    if(!modal||!root.CAGE_PWA.validVersion(version)||compareVersions(version,currentVersion)<=0||dismissedVersion()===version)return;
    returnFocus=document.activeElement;installedText.textContent=currentVersion;availableText.textContent=version;
    modal.classList.add('open');modal.setAttribute('aria-hidden','false');
    updateButton.disabled=false;updateButton.textContent='UPDATE NOW';
    requestAnimationFrame(()=>updateButton.focus());
  }
  async function checkVersion(force=false){
    const now=Date.now();if(checking||(!force&&now-lastCheck<checkInterval))return;
    checking=true;lastCheck=now;
    try{
      const response=await fetch(versionUrl,{cache:'no-store',headers:{Accept:'application/json'}});
      if(!response.ok)return;
      const data=await response.json();
      if(root.CAGE_PWA.validVersion(data.version)&&compareVersions(data.version,currentVersion)>0)showUpdate(data.version);
    }catch{}finally{checking=false}
  }
  async function applyUpdate(){
    if(!updateButton)return;reloadRequested=true;updateButton.disabled=true;updateButton.textContent='UPDATING…';
    try{
      await registration?.update();
      if(registration?.waiting){registration.waiting.postMessage({type:'SKIP_WAITING'});return}
    }catch{}
    window.location.reload();
  }

  laterButton?.addEventListener('click',()=>{rememberDismissal(availableText.textContent);closeUpdate()});
  updateButton?.addEventListener('click',applyUpdate);
  modal?.addEventListener('click',event=>{if(event.target===modal){rememberDismissal(availableText.textContent);closeUpdate()}});
  modal?.addEventListener('keydown',event=>{if(event.key==='Escape'){rememberDismissal(availableText.textContent);closeUpdate()}});
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloadRequested)window.location.reload()});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkVersion()});
  window.addEventListener('online',()=>checkVersion(true));
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;dispatchInstallEvent('cagegrind:installchange',{available:true})});
  window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;dispatchInstallEvent('cagegrind:installed');dispatchInstallEvent('cagegrind:installchange',{available:false})});
  window.addEventListener('load',async()=>{
    try{
      registration=await navigator.serviceWorker.register('service-worker.js',{scope:'./',updateViaCache:'none'});
      registration.addEventListener('updatefound',()=>{
        const worker=registration.installing;if(!worker)return;
        worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)checkVersion(true)});
      });
      await registration.update();
      await checkVersion(true);
    }catch{}
  });
  queueMicrotask(()=>{if(isInstalled())dispatchInstallEvent('cagegrind:installed');else dispatchInstallEvent('cagegrind:installchange',{available:installAvailable()})});
})(globalThis);

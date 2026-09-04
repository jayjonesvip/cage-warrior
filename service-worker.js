'use strict';

const APP_VERSION='2.7.123';
const CACHE_PREFIX='cage-grind-app-';
const CACHE_NAME=`${CACHE_PREFIX}${APP_VERSION}`;
const ROOT_URL=new URL('./',self.location.href);
const OFFLINE_URL=new URL('index.html',ROOT_URL).href;
const CORE_ASSETS=[
  './',
  './index.html',
  './origins.html',
  './fight-rules.json',
  './css/shared.css?v=2.7.123',
  './css/styles.css?v=2.7.123',
  './css/landing.css?v=2.7.123',
  './css/github-steel.css?v=2.7.123',
  './css/origins.css?v=2.7.123',
  './js/fight-rules.js?v=2.7.123',
  './js/game-logic.js?v=2.7.123',
  './js/shared-ui.js?v=2.7.123',
  './js/strings.js?v=2.7.123',
  './js/analytics.js?v=2.7.123',
  './js/supabase-client.js?v=2.7.123',
  './js/cage-social.js?v=2.7.123',
  './js/landing.js?v=2.7.123',
  './js/fight-plan.js?v=2.7.123',
  './js/definitions.js?v=2.7.123',
  './js/game.js?v=2.7.123',
  './js/pwa.js?v=2.7.123',
  './manifest.webmanifest',
  './app-version.json',
  './assets/cage-grind-logo.png',
  './assets/flags/us.svg?v=2.7.123',
  './assets/flags/mx.svg?v=2.7.123',
  './assets/flags/ru.svg?v=2.7.123',
  './assets/flags/br.svg?v=2.7.123',
  './assets/flags/ca.svg?v=2.7.123',
  './assets/flags/ie.svg?v=2.7.123',
  './assets/flags/gb.svg?v=2.7.123',
  './assets/flags/jp.svg?v=2.7.123',
  './assets/flags/kr.svg?v=2.7.123',
  './assets/flags/ng.svg?v=2.7.123',
  './assets/flags/th.svg?v=2.7.123',
  './assets/flags/ph.svg?v=2.7.123',
  './assets/flags/cu.svg?v=2.7.123',
  './assets/flags/pr.svg?v=2.7.123',
  './assets/flags/au.svg?v=2.7.123',
  './assets/flags/pl.svg?v=2.7.123',
  './assets/flags/ge.svg?v=2.7.123',
  './assets/flags/am.svg?v=2.7.123',
  './assets/flags/co.svg?v=2.7.123',
  './assets/flags/ar.svg?v=2.7.123',
  './assets/flags/nl.svg?v=2.7.123',
  './assets/flags/ws.svg?v=2.7.123',
  './assets/silhouettes/fighter-silhouette-1.png',
  './assets/focus-locker-room.jpg?v=2.7.123',
  './assets/cage-grind-ceo.jpg?v=2.7.123',
  './assets/cage-reporter.jpg?v=2.7.123',
  './assets/cage-grind-drop-pack.png?v=2.7.123',
  './assets/opponents/vaso-jose.png?v=2.7.123',
  './assets/opponents/diego-ramos-br.png?v=2.7.123',
  './assets/fonts/BebasNeue-Regular.ttf?v=2.7.123',
  './assets/fonts/BebasNeue-OFL.txt',
  './assets/fonts/Oswald-Variable.ttf?v=2.7.123',
  './assets/fonts/Oswald-OFL.txt',
  './assets/fonts/BarlowCondensed-SemiBold.ttf?v=2.7.123',
  './assets/fonts/BarlowCondensed-Bold.ttf?v=2.7.123',
  './assets/fonts/BarlowCondensed-OFL.txt',
  './assets/cage-grind-octagon-transparent.png',
  './assets/cage-overlay.png',
  './assets/app-icon-192.png',
  './assets/app-icon-512.png?v=2.7.123',
  './assets/origins/cagewars-dashboard.jpg',
  './assets/origins/cagewars-fighter-profile.jpg',
  './assets/origins/cagewars-store.jpg',
  './assets/origins/online-cage-fighting-logo.png',
  './assets/icons/nav-home.png',
  './assets/icons/nav-fight.png',
  './assets/icons/nav-gear.png',
  './assets/icons/nav-feed.png',
  './assets/icons/performance-treadmill.jpg?v=2.7.123',
  './assets/icons/speed-bag.jpg?v=2.7.123',
  './assets/icons/heavy-bag.jpg?v=2.7.123',
  './assets/icons/headgear.jpg?v=2.7.123',
  './assets/skins/aura-unknown-gloves.png?v=2.7.123',
  './assets/skins/aura-unknown-wraps.png?v=2.7.123',
  './assets/skins/aura-unknown-mouthguard.png?v=2.7.123',
  './assets/skins/aura-unknown-shorts.png?v=2.7.123',
  './assets/skins/aura-noticed-gloves.png?v=2.7.123',
  './assets/skins/aura-noticed-wraps.png?v=2.7.123',
  './assets/skins/aura-noticed-mouthguard.png?v=2.7.123',
  './assets/skins/aura-noticed-shorts.png?v=2.7.123',
  './assets/skins/aura-magnetic-gloves.png?v=2.7.123',
  './assets/skins/aura-magnetic-wraps.png?v=2.7.123',
  './assets/skins/aura-magnetic-mouthguard.png?v=2.7.123',
  './assets/skins/aura-magnetic-shorts.png?v=2.7.123',
  './assets/skins/aura-superstar-gloves.png?v=2.7.123',
  './assets/skins/aura-superstar-wraps.png?v=2.7.123',
  './assets/skins/aura-superstar-mouthguard.png?v=2.7.123',
  './assets/skins/aura-superstar-shorts.png?v=2.7.123',
  './assets/skins/aura-iconic-gloves.png?v=2.7.123',
  './assets/skins/aura-iconic-wraps.png?v=2.7.123',
  './assets/skins/aura-iconic-mouthguard.png?v=2.7.123',
  './assets/skins/aura-iconic-shorts.png?v=2.7.123',
  './assets/icons/energy-drink.png?v=2.7.123',
  './assets/icons/fight-fuel-protein.png?v=2.7.123',
  './assets/icons/fight-fuel-protein-qr.png?v=2.7.123',
  './assets/icons/bobs-auto.png?v=2.7.123',
  './assets/icons/garys-bar-grill.png?v=2.7.123',
  './assets/icons/volt.png?v=2.7.123',
  './assets/icons/ironhide.png?v=2.7.123',
  './assets/icons/apex-wireless.png?v=2.7.123',
  './assets/icons/northline-auto.png?v=2.7.123',
  './assets/icons/titan-global.png?v=2.7.123',
  './assets/icons/title-world.png?v=2.7.123',
  './assets/icons/round-intro-1.png?v=2.7.123',
  './assets/icons/round-intro-2.png?v=2.7.123',
  './assets/icons/round-intro-3.png?v=2.7.123'
].map(path=>new URL(path,self.location.href).href);

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE_ASSETS)));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});

async function networkFirst(request){
  const cache=await caches.open(CACHE_NAME);
  try{
    const response=await fetch(request);
    if(response.ok)await cache.put(request,response.clone());
    return response;
  }catch{
    return (await cache.match(request))||(request.mode==='navigate'?cache.match(OFFLINE_URL):undefined);
  }
}

async function cacheFirst(request){
  const cached=await caches.match(request);if(cached)return cached;
  const response=await fetch(request);
  if(response.ok){const cache=await caches.open(CACHE_NAME);await cache.put(request,response.clone())}
  return response;
}

self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;
  const url=new URL(request.url);if(url.origin!==self.location.origin)return;
  if(url.pathname.endsWith('/app-version.json')){
    event.respondWith(fetch(request,{cache:'no-store'}).catch(()=>caches.match(request)));
    return;
  }
  if(url.pathname.endsWith('/fight-rules.json')){
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(request.mode==='navigate'?networkFirst(request):cacheFirst(request));
});

'use strict';

const APP_VERSION='2.5.55';
const CACHE_PREFIX='cage-grind-app-';
const CACHE_NAME=`${CACHE_PREFIX}${APP_VERSION}`;
const ROOT_URL=new URL('./',self.location.href);
const OFFLINE_URL=new URL('index.html',ROOT_URL).href;
const CORE_ASSETS=[
  './',
  './index.html',
  './styles.css?v=2.5.55',
  './game-logic.js?v=2.5.55',
  './strings.js?v=2.5.55',
  './analytics.js?v=2.5.55',
  './supabase-client.js?v=2.5.55',
  './cage-social.js?v=2.5.55',
  './game.js?v=2.5.55',
  './pwa.js?v=2.5.55',
  './manifest.webmanifest',
  './app-version.json',
  './assets/cage-grind-logo.png',
  './assets/focus-locker-room.jpg?v=2.5.55',
  './assets/contact-mom.jpg?v=2.5.55',
  './assets/contact-wife.jpg?v=2.5.55',
  './assets/contact-brother-tommy.png?v=2.5.55',
  './assets/contact-agent-carl.png?v=2.5.55',
  './assets/cage-grind-ceo.jpg?v=2.5.55',
  './assets/cage-dice.jpg?v=2.5.55',
  './assets/cage-grind-octagon-transparent.png',
  './assets/cage-overlay.png',
  './assets/home-fight.png',
  './assets/home-training.png',
  './assets/home-hustle.png',
  './assets/home-gear.png',
  './assets/app-icon-192.png',
  './assets/app-icon-512.png',
  './assets/icons/nav-home.png',
  './assets/icons/nav-train.png',
  './assets/icons/nav-fight.png',
  './assets/icons/nav-hustle.png',
  './assets/icons/nav-gear.png',
  './assets/icons/nav-feed.png',
  './assets/icons/round-intro-1.png?v=2.5.55',
  './assets/icons/round-intro-2.png?v=2.5.55',
  './assets/icons/round-intro-3.png?v=2.5.55'
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
  event.respondWith(request.mode==='navigate'?networkFirst(request):cacheFirst(request));
});

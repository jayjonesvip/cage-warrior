(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.document)root.CAGE_SUPABASE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const SESSION_KEY='cage-grind-supabase-session-v1';

  function safeRead(storage,key){
    try{
      const value=storage?.getItem?.(key);
      if(!value)return null;
      const parsed=JSON.parse(value);
      return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:null;
    }catch{return null}
  }

  function safeWrite(storage,key,value){
    try{storage?.setItem?.(key,JSON.stringify(value));return true}catch{return false}
  }

  function safeRemove(storage,key){try{storage?.removeItem?.(key)}catch{/* optional cache */}}

  function normalizeSession(value){
    if(!value||typeof value!=='object')return null;
    const accessToken=typeof value.access_token==='string'?value.access_token:'';
    const refreshToken=typeof value.refresh_token==='string'?value.refresh_token:'';
    const userId=typeof value.user?.id==='string'?value.user.id:typeof value.user_id==='string'?value.user_id:'';
    const expiresAt=Math.max(0,Math.floor(Number(value.expires_at))||0);
    if(!accessToken||!refreshToken||!userId)return null;
    return {access_token:accessToken,refresh_token:refreshToken,expires_at:expiresAt,user:{id:userId}};
  }

  function createClient(options={}){
    const url=String(options.url||'').replace(/\/+$/,'');
    const key=String(options.key||'');
    const fetchImpl=options.fetchImpl||globalThis.fetch?.bind(globalThis);
    const storage=options.storage===undefined?globalThis.localStorage:options.storage;
    const now=options.now||(()=>Date.now());
    let session=normalizeSession(safeRead(storage,SESSION_KEY));
    let sessionPromise=null;

    function storedSession(){return normalizeSession(safeRead(storage,SESSION_KEY))}
    function adoptNewerStoredSession(){
      const stored=storedSession();
      if(!stored)return session;
      if(!session||stored.user.id===session.user.id&&stored.refresh_token!==session.refresh_token)session=stored;
      return session;
    }

    function configured(){return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)&&/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)&&typeof fetchImpl==='function'}

    async function request(path,{method='GET',body,token,headers={}}={}){
      if(!configured())throw new Error('Supabase is not configured.');
      const response=await fetchImpl(`${url}${path}`,{
        method,
        headers:Object.assign({apikey:key,Authorization:`Bearer ${token||key}`,Accept:'application/json'},body===undefined?{}:{'Content-Type':'application/json'},headers),
        body:body===undefined?undefined:JSON.stringify(body)
      });
      const text=await response.text();
      let data=null;
      if(text){try{data=JSON.parse(text)}catch{data=text}}
      if(!response.ok){
        const message=data?.msg||data?.message||data?.error_description||data?.error||`Supabase request failed (${response.status}).`;
        const error=new Error(String(message));error.status=response.status;throw error;
      }
      return data;
    }

    function rememberSession(value){
      session=normalizeSession(value);
      if(session)safeWrite(storage,SESSION_KEY,session);else safeRemove(storage,SESSION_KEY);
      return session;
    }

    async function refreshSession(){
      if(!session?.refresh_token)return null;
      const attempted=session;
      try{
        const data=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token}});
        return rememberSession(data);
      }catch(error){
        if(error?.status===400||error?.status===401){
          const stored=storedSession();
          if(stored&&stored.user.id===attempted.user.id&&stored.refresh_token!==attempted.refresh_token){session=stored;return refreshSession()}
          throw new Error('Fighter session expired. Reopen the browser profile that created this fighter.');
        }
        throw error;
      }
    }

    async function establishSession(){
      adoptNewerStoredSession();
      const currentTime=Math.floor(now()/1000);
      if(session&&session.expires_at>currentTime+60)return session;
      if(session&&await refreshSession())return session;
      const data=await request('/auth/v1/signup',{method:'POST',body:{data:{game:'cage-grind'},gotrue_meta_security:{captcha_token:null}}});
      const created=rememberSession(data);
      if(!created)throw new Error('Supabase did not return an anonymous session.');
      return created;
    }

    function ensureSession(){
      const currentTime=Math.floor(now()/1000);
      if(session&&session.expires_at>currentTime+60)return Promise.resolve(session);
      if(sessionPromise)return sessionPromise;
      sessionPromise=establishSession().finally(()=>{sessionPromise=null});
      return sessionPromise;
    }

    async function authenticatedRequest(path,options={}){
      let active=await ensureSession();
      try{return await request(path,Object.assign({},options,{token:active.access_token}))}
      catch(error){
        if(error.status!==401)throw error;
        session=active;active=await refreshSession();
        return request(path,Object.assign({},options,{token:active.access_token}));
      }
    }

    async function rpc(name,args){return authenticatedRequest(`/rest/v1/rpc/${encodeURIComponent(name)}`,{method:'POST',body:args})}

    async function registerCageProfile(values){return rpc('sync_cage_profile',values)}
    async function claimCageIdentity(values){return rpc('claim_cage_identity',values)}
    async function retireCageProfile(){return rpc('retire_cage_profile',{})}
    async function getCageChampionship(){return rpc('get_cage_championship',{})}
    async function beginCageChampionshipChallenge(opponentId=null){return rpc('begin_cage_championship_challenge',{p_opponent_id:opponentId||null})}
    async function settleCageChampionshipChallenge(values){return authenticatedRequest('/functions/v1/settle-cage-championship',{method:'POST',body:values})}

    async function selectCageFeed(limit){
      return authenticatedRequest(`/rest/v1/cage_feed_posts?select=id,author_id,author_handle,post_kind,body,target_profile_id,target_handle,created_at&order=created_at.desc&limit=${limit}`);
    }

    async function selectCageProfiles(limit){
      return authenticatedRequest(`/rest/v1/cage_profiles?select=id,handle,city,archetype,fighter_avatar,level,wins,losses,updated_at&retired_at=is.null&order=updated_at.desc&limit=${limit}`);
    }

    async function countCageProfiles(){return rpc('get_cage_profile_count',{})}
    async function selectCageOpponentCandidates(level,limit){return rpc('get_cage_opponent_candidates',{p_level:level,p_limit:limit})}
    async function getCageInteractionsRemaining(){return rpc('get_cage_interactions_remaining',{})}
    async function insertCagePost(values){return rpc('publish_cage_post',values)}
    async function insertCageCeoPost(eventKey){return rpc('publish_cage_ceo_post',{p_event_key:eventKey})}

    return {configured,ensureSession,registerCageProfile,claimCageIdentity,retireCageProfile,getCageChampionship,beginCageChampionshipChallenge,settleCageChampionshipChallenge,selectCageFeed,selectCageProfiles,countCageProfiles,selectCageOpponentCandidates,getCageInteractionsRemaining,insertCagePost,insertCageCeoPost,sessionUserId:()=>session?.user?.id||''};
  }

  return {SESSION_KEY,createClient,normalizeSession};
});

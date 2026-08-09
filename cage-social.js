(function(root,factory){
  'use strict';
  const databaseApi=typeof module==='object'&&module.exports?require('./supabase-client.js'):root?.CAGE_SUPABASE;
  const api=factory(databaseApi);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.document){
    root.CAGE_SOCIAL=api.createClient({
      url:'https://oucstmfyfuoxyqcgqsqm.supabase.co',
      key:'sb_publishable_nnChWpOFM9giwSpW7Eoq7w_pGVmkIZE'
    });
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(DATABASE){
  'use strict';

  function createClient(options={}){
    if(!DATABASE?.createClient)throw new Error('supabase-client.js must load before cage-social.js');
    const database=options.databaseClient||DATABASE.createClient(options);

    async function registerProfile(profile){
      const data=await database.registerCageProfile({
        p_fighter_name:profile.fighterName,
        p_city:profile.city,
        p_archetype:profile.archetype,
        p_level:profile.level,
        p_wins:profile.wins,
        p_losses:profile.losses,
        p_fighter_avatar:profile.fighterAvatar
      });
      return Array.isArray(data)?data[0]||null:data;
    }

    async function loadFeed(limit=50){
      const count=Math.max(1,Math.min(100,Math.floor(Number(limit))||50));
      return database.selectCageFeed(count);
    }

    async function loadProfiles(limit=100){
      const count=Math.max(1,Math.min(200,Math.floor(Number(limit))||100));
      const rows=await database.selectCageProfiles(count);
      const active=await database.ensureSession();
      return Array.isArray(rows)?rows.filter(row=>row.id!==active.user.id):[];
    }

    async function loadProfileCount(){
      const data=await database.countCageProfiles();
      const value=Array.isArray(data)?data[0]:data;
      return Math.max(0,Math.floor(Number(value))||0);
    }

    async function loadInteractionAllowance(){
      const data=await database.getCageInteractionsRemaining();
      const value=Array.isArray(data)?data[0]:data;
      return Math.max(0,Math.min(5,Math.floor(Number(value))||0));
    }

    async function publishPost({kind,body,targetProfileId=null}){
      return database.insertCagePost({p_post_kind:kind,p_body:body,p_target_profile_id:targetProfileId||null});
    }

    return {configured:database.configured,ensureSession:database.ensureSession,registerProfile,loadFeed,loadProfiles,loadProfileCount,loadInteractionAllowance,publishPost,sessionUserId:database.sessionUserId};
  }

  return {createClient};
});

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
        p_level:profile.level,
        p_wins:profile.wins,
        p_losses:profile.losses,
        p_fighter_avatar:profile.fighterAvatar
      });
      const base=Array.isArray(data)?data[0]||null:data;
      if(database.syncCageFightSkin)try{await database.syncCageFightSkin(profile.fightSkinAura||0)}catch(error){/* Cosmetic sync must not block career updates. */}
      const ranked=await database.syncCageRanking({p_attribute_total:profile.attributeTotal,p_ranking_history:profile.rankingHistory});
      return Array.isArray(ranked)?ranked[0]||base:ranked||base;
    }

    async function claimIdentity(profile){
      const data=await database.claimCageIdentity({
        p_candidates:Array.isArray(profile.candidates)?profile.candidates:[],
        p_city:profile.city,
        p_archetype:profile.archetype,
        p_fighter_avatar:profile.fighterAvatar,
        p_level:profile.level,
        p_wins:profile.wins,
        p_losses:profile.losses
      });
      const base=Array.isArray(data)?data[0]||null:data;
      if(database.syncCageFightSkin)try{await database.syncCageFightSkin(profile.fightSkinAura||0)}catch(error){/* Cosmetic sync must not block career updates. */}
      const ranked=await database.syncCageRanking({p_attribute_total:profile.attributeTotal,p_ranking_history:profile.rankingHistory});
      return Array.isArray(ranked)?ranked[0]||base:ranked||base;
    }

    async function retireProfile(){
      const data=await database.retireCageProfile();
      return Array.isArray(data)?data[0]||null:data;
    }

    async function loadFeed(limit=50){
      const count=Math.max(1,Math.min(100,Math.floor(Number(limit))||50));
      return database.selectCageFeed(count);
    }

    async function loadProfiles(limit=100){
      const count=Math.max(1,Math.min(1000,Math.floor(Number(limit))||100));
      const rows=await database.selectCageProfiles(count);
      const active=await database.ensureSession();
      return Array.isArray(rows)?rows.filter(row=>row.id!==active.user.id).map(normalizeRankingProfile):[];
    }

    function normalizeRankingProfile(row){
      if(!row||typeof row!=='object')return row;
      return {...row,attributeTotal:Number(row.attribute_total??row.attributeTotal),rankingHistory:Array.isArray(row.ranking_history)?row.ranking_history:Array.isArray(row.rankingHistory)?row.rankingHistory:[]};
    }

    async function loadOwnProfile(expectedProfileId=''){return database.selectOwnCageProfile(expectedProfileId)}

    async function loadCareer(expectedProfileId=''){
      const data=await database.loadCageCareer(expectedProfileId);
      return Array.isArray(data)?data[0]||null:data;
    }

    async function saveCareer(state,expectedProfileId=''){
      return database.saveCageCareer(state,expectedProfileId);
    }

    async function loadProfileCount(){
      const data=await database.countCageProfiles();
      const value=Array.isArray(data)?data[0]:data;
      return Math.max(0,Math.floor(Number(value))||0);
    }

    async function loadOpponentCandidates(level,limit=12){
      const tier=Math.max(1,Math.min(99,Math.floor(Number(level))||1));
      const count=Math.max(1,Math.min(20,Math.floor(Number(limit))||12));
      const rows=await database.selectCageOpponentCandidates(tier,count);
      return Array.isArray(rows)?rows:[];
    }

    async function loadSeedFighterRoster(){
      const rows=await database.selectCageSeedFighterRoster();
      return Array.isArray(rows)?rows.map(row=>({...normalizeRankingProfile(row),seeded:true})):[];
    }

    async function loadInteractionAllowance(){
      const data=await database.getCageInteractionsRemaining();
      const value=Array.isArray(data)?data[0]:data;
      return Math.max(0,Math.min(5,Math.floor(Number(value))||0));
    }

    async function publishPost({kind,body,targetProfileId=null}){
      return database.insertCagePost({p_post_kind:kind,p_body:body,p_target_profile_id:targetProfileId||null});
    }

    async function loadChampionship(){
      const data=await database.getCageChampionship();
      return Array.isArray(data)?data[0]||null:data;
    }

    async function beginChampionshipBout(opponentId=null){
      const data=await database.beginCageChampionshipChallenge(opponentId);
      return Array.isArray(data)?data[0]||null:data;
    }

    async function settleChampionshipBout({challengeId,challengerId,challengerWon}){
      return database.settleCageChampionshipChallenge({challenge_id:challengeId,challenger_id:challengerId,challenger_won:challengerWon});
    }
    async function publishCeoPost(eventKey){return database.insertCageCeoPost(eventKey)}
    async function publishSponsorPost(sponsorId){return database.insertCageSponsorPost(sponsorId)}
    async function registerReferral(inviterId){return database.registerCageFighterReferral(inviterId)}
    async function qualifyReferral(){return database.qualifyCageFighterReferral()}
    async function claimReferralReward(){
      const data=await database.claimCageFighterReferralReward();
      const reward=Array.isArray(data)?data[0]||null:data;
      return reward?{referralId:String(reward.referral_id||''),inviteeHandle:String(reward.invitee_handle||'')}:null;
    }

    return {configured:database.configured,ensureSession:database.ensureSession,registerProfile,claimIdentity,retireProfile,loadChampionship,beginChampionshipBout,settleChampionshipBout,loadFeed,loadProfiles,loadOwnProfile,loadCareer,saveCareer,loadProfileCount,loadOpponentCandidates,loadSeedFighterRoster,loadInteractionAllowance,publishPost,publishCeoPost,publishSponsorPost,registerReferral,qualifyReferral,claimReferralReward,sessionUserId:database.sessionUserId};
  }

  return {createClient};
});

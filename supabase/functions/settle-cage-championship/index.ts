const cors={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS'
};

function json(body:unknown,status=200){
  return new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
}

Deno.serve(async request=>{
  if(request.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(request.method!=='POST')return json({error:'Method not allowed'},405);

  const supabaseUrl=Deno.env.get('SUPABASE_URL')||'';
  const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  const authorization=request.headers.get('Authorization')||'';
  if(!supabaseUrl||!serviceKey)return json({error:'Function configuration is incomplete'},500);
  if(!authorization.startsWith('Bearer '))return json({error:'Authentication required'},401);

  try{
    const input=await request.json();
    const challengeId=Number(input.challenge_id);
    const challengerId=String(input.challenger_id||'');
    const challengerWon=input.challenger_won;
    if(!Number.isSafeInteger(challengeId)||challengeId<1||!/^[0-9a-f-]{36}$/i.test(challengerId)||typeof challengerWon!=='boolean')return json({error:'Invalid championship result'},400);

    const userResponse=await fetch(`${supabaseUrl}/auth/v1/user`,{headers:{apikey:serviceKey,Authorization:authorization}});
    if(!userResponse.ok)return json({error:'Authentication required'},401);
    const user=await userResponse.json();

    const challengeResponse=await fetch(`${supabaseUrl}/rest/v1/cage_championship_challenges?select=id,challenger_id,initiated_by,status&id=eq.${challengeId}`,{headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,Accept:'application/json'}});
    const challenges=await challengeResponse.json();
    const challenge=Array.isArray(challenges)?challenges[0]:null;
    if(!challenge||challenge.status!=='pending'||challenge.challenger_id!==challengerId)return json({error:'Pending championship bout not found'},404);
    if(challenge.initiated_by!==user.id)return json({error:'Only the fighter who started this bout can submit its result'},403);

    const resultResponse=await fetch(`${supabaseUrl}/rest/v1/rpc/resolve_cage_championship_challenge`,{
      method:'POST',
      headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'Content-Type':'application/json',Accept:'application/json'},
      body:JSON.stringify({p_challenge_id:challengeId,p_challenger_id:challengerId,p_challenger_won:challengerWon})
    });
    const result=await resultResponse.json();
    if(!resultResponse.ok)return json({error:result?.message||'Championship settlement failed'},resultResponse.status);
    return json(Array.isArray(result)?result[0]||null:result);
  }catch(error){
    return json({error:error instanceof Error?error.message:'Championship settlement failed'},500);
  }
});

// Run: node scripts/fight-outcome-distribution.cjs [fights-per-scenario] [output-directory] [seed]
// Uses production simulation and loaded rules without modifying game balance or saves.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=name=>fs.readFileSync(path.join(root,name),'utf8');
const count=Number(process.argv[2]||10000),out=path.resolve(process.argv[3]||path.join(root,'output/fight-distribution'));
assert(Number.isInteger(count)&&count>=100&&count<=1000000,'Use 100–1,000,000 fights per scenario');
const source=read('js/game.js'),rulesSource=read('js/fight-rules.js'),logicSource=read('js/game-logic.js'),rulesDocument=read('fight-rules.json');
const initialSeed=Number(process.argv[4]||20260908);assert(Number.isInteger(initialSeed)&&initialSeed>=0&&initialSeed<=4294967295,'Use a 32-bit unsigned seed');let seed=initialSeed;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const random=(a,b)=>a+math.random()*(b-a),pick=items=>items[Math.floor(math.random()*items.length)];
const ctx={Math:math,state:{fighterStyle:'striker'},planDefs:[{id:'striker',name:'Striker'},{id:'grappler',name:'Grappler'}],rand:random,rint:(a,b)=>Math.floor(random(a,b+1)),fightPlanFeedback:()=>'',
 // Cosmetic helpers retain their production random-draw count; prose is discarded.
 commentaryFor:()=>{math.random();return ''},selectSubmissionFinish:()=>{math.random();return {name:'Submission',call:'gets the tap'}}};
vm.createContext(ctx);vm.runInContext(rulesSource,ctx);ctx.CAGE_FIGHT_RULES.current=ctx.CAGE_FIGHT_RULES.normalize(JSON.parse(rulesDocument));
vm.runInContext(logicSource,ctx);ctx.LOGIC=ctx.CAGE_LOGIC;ctx.clamp=ctx.LOGIC.clamp;ctx.fightRule=(key,fallback)=>ctx.CAGE_FIGHT_RULES.number(key,fallback);ctx.FIGHT_ROUNDS=ctx.fightRule('fightStructure.scheduledRounds',3);
function extract(start,end){const a=source.indexOf(start),b=source.indexOf(end,a);assert(a>=0&&b>a,`Simulation source boundaries changed: ${start}`);vm.runInContext(source.slice(a,b),ctx)}
extract('  function emptyFightStats(','  function scheduleFight(');
extract('  function fightClock(','  function commentaryFor(');
extract('  function planFamiliarity(','  function matchupEdge(');
extract('  function plannedTechnique(','  function renderTapeBreakdown(');
const styles=['striker','grappler'],plans=[];
for(const pace of ['slow','fast'])for(const offense of ['conservative','aggressive'])for(const tactics of ['stick','adapt'])plans.push({pace,offense,tactics});
const defaultPlan={pace:'slow',offense:'conservative',tactics:'stick'},aggressivePlan={pace:'fast',offense:'aggressive',tactics:'stick'};
const stats=n=>({power:n,speed:n,chin:n,cardio:n}),fighter=(n,style=pick(styles),plan=pick(plans))=>({stats:stats(n),style,plan});
function simulate(a,b,condition=100){
 ctx.state.fighterStyle=a.style;ctx.state.fightPlanPreference=a.plan;
 const sim={o:{tendency:b.style},player:{name:'A',...a.stats},opp:{name:'B',...b.stats},gamePlan:a.plan,opponentPlan:b.plan,playerCondition:condition,oppCondition:100,playerAura:0,opponentAura:0,rounds:[],plans:[],timeline:[],totals:{player:ctx.emptyFightStats(),opp:ctx.emptyFightStats()},mode:'planned'};
 for(let round=1;round<=ctx.FIGHT_ROUNDS&&!sim.winner;round++)ctx.simulateRound(sim,round,a.style);
 assert(['player','opp'].includes(sim.winner),'Every simulation must settle');
 assert(sim.rounds.length>=1&&sim.rounds.length<=3,'Invalid round count');
 assert(Number.isFinite(sim.playerCondition)&&Number.isFinite(sim.oppCondition),'Invalid condition');
 const method=sim.method.includes('DECISION')?'decision':['KO','TKO'].includes(sim.method)?'ko':sim.method==='SUBMISSION'?'submission':'other';
 return {method,winner:sim.winner,round:sim.finishRound};
}
const scenarios=[... [5,12,25,50].map(n=>({name:`Matched ${n} per attribute`,baseline:true,make:()=>[fighter(n),fighter(n)]})),
 {name:'12 each: default plans',make:()=>[fighter(12,pick(styles),defaultPlan),fighter(12,pick(styles),defaultPlan)]},
 {name:'12 each: fast/aggressive plans',make:()=>[fighter(12,pick(styles),aggressivePlan),fighter(12,pick(styles),aggressivePlan)]},
 {name:'12 each: striker vs striker',make:()=>[fighter(12,'striker'),fighter(12,'striker')]},
 {name:'12 each: striker vs grappler',make:()=>[fighter(12,'striker'),fighter(12,'grappler')]},
 {name:'12 each: grappler vs grappler',make:()=>[fighter(12,'grappler'),fighter(12,'grappler')]},
 {name:'Attribute gap: 12 vs 16',make:()=>[fighter(12),fighter(16)]},
 {name:'12 each: player starts at 78% condition',make:()=>[fighter(12),fighter(12),78]}
];
const empty=()=>({fights:0,decision:0,ko:0,submission:0,other:0,playerWins:0,rounds:{1:0,2:0,3:0}}),baseline=empty();
const results=scenarios.map(scenario=>{const result={name:scenario.name,...empty()};for(let i=0;i<count;i++){
 const outcome=simulate(...scenario.make());result.fights++;result[outcome.method]++;result.playerWins+=outcome.winner==='player'?1:0;result.rounds[outcome.round]++;
 }assert.equal(result.decision+result.ko+result.submission+result.other,result.fights);
 if(scenario.baseline){for(const key of ['fights','decision','ko','submission','other','playerWins'])baseline[key]+=result[key];for(const round of [1,2,3])baseline.rounds[round]+=result.rounds[round]}
 console.log(JSON.stringify(result));return result;
});
const pct=(n,total)=>(100*n/total).toFixed(2)+'%',benchmark={decision:46,ko:33,submission:20};
const report={seed:initialSeed,fightsPerScenario:count,totalFights:count*scenarios.length,sourceSha256:crypto.createHash('sha256').update(source+logicSource+rulesSource+rulesDocument).digest('hex'),benchmark,baseline,scenarios:results};
const markdown=`# Fight outcome distribution\n\n${report.totalFights.toLocaleString()} fights using the production three-round simulator and current fight-rules.json. Seed: ${report.seed}.\n\nThe baseline equally weights 5, 12, 25 and 50 points per attribute. Both fighters have equal attributes and full condition, zero aura, independently uniform striker/grappler styles and all eight fight-plan combinations. Diagnostic rows vary one factor. These are controlled synthetic matchups, not a sample of live player activity. Attribute values are not fighter levels.\n\n| Outcome | User-supplied benchmark | Baseline (${baseline.fights.toLocaleString()} fights) | Difference |\n|---|---:|---:|---:|\n`+
 Object.entries(benchmark).map(([key,target])=>`| ${key} | ~${target}% | ${pct(baseline[key],baseline.fights)} | ${(100*baseline[key]/baseline.fights-target).toFixed(2)} percentage points |`).join('\n')+
 `\n| Other | <1% | ${pct(baseline.other,baseline.fights)} | — |\n\n| Scenario | Fights | Decision | KO/TKO | Submission | Player win |\n|---|---:|---:|---:|---:|---:|\n`+
 results.map(r=>`| ${r.name} | ${r.fights} | ${pct(r.decision,r.fights)} | ${pct(r.ko,r.fights)} | ${pct(r.submission,r.fights)} | ${pct(r.playerWins,r.fights)} |`).join('\n')+
 `\n\nAt ${count.toLocaleString()} fights per scenario, approximate 95% sampling uncertainty is at most ±${(98/Math.sqrt(count)).toFixed(2)} percentage points per outcome; at ${baseline.fights.toLocaleString()} baseline fights it is ±${(98/Math.sqrt(baseline.fights)).toFixed(2)} points. This does not include uncertainty from choosing a different matchup population.\n\nOnly planned full simulations are included. Protected tutorial wins, player forfeits and legacy interactive interventions are excluded. The normal simulator has no random DQ/no-contest mechanism, so Other is expected to be zero. The supplied benchmark is used as a reference without independently verifying its population or dates; its rounded categories need not total exactly 100%.\n\nProduction combat, scoring and finish logic execute unchanged. Cosmetic commentary and submission names consume the same number of random draws and discard text. No game balance, save data or database records are changed.\n\nReproduce: \`node scripts/fight-outcome-distribution.cjs ${count} output/fight-distribution ${initialSeed}\`\n\nSource/rules SHA-256: \`${report.sourceSha256}\`\n`;
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');fs.writeFileSync(path.join(out,'report.md'),markdown);console.log('BASELINE '+JSON.stringify(baseline));console.log('Report: '+path.join(out,'report.md'));

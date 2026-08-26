const fs = require('node:fs');
const zlib = require('node:zlib');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const page = fs.readFileSync('index.html', 'utf8');
const originsPage = fs.readFileSync('origins.html', 'utf8');
const gameCss = fs.readFileSync('css/styles.css', 'utf8');
const sharedCss = fs.readFileSync('css/shared.css', 'utf8');
const landingCss = fs.readFileSync('css/landing.css', 'utf8');
const originsCss = fs.readFileSync('css/origins.css', 'utf8');
const css = `${gameCss}\n${sharedCss}\n${landingCss}`;
const html = `${page}\n<style>${css}</style>`;
const readme = fs.readFileSync('README.md', 'utf8');
const focusContacts = fs.readFileSync('js/fight-focus-contacts.js', 'utf8');
const strings = fs.readFileSync('js/strings.js', 'utf8');
const logic = fs.readFileSync('js/game-logic.js', 'utf8');
const analytics = fs.readFileSync('js/analytics.js', 'utf8');
const supabaseClient = fs.readFileSync('js/supabase-client.js', 'utf8');
const cageSocial = fs.readFileSync('js/cage-social.js', 'utf8');
const definitionsScript = fs.readFileSync('js/definitions.js', 'utf8');
const gameScript = fs.readFileSync('js/game.js', 'utf8');
const sharedUi = fs.readFileSync('js/shared-ui.js', 'utf8');
const landingScript = fs.readFileSync('js/landing.js', 'utf8');
const fightFocusScript = fs.readFileSync('js/fight-focus.js', 'utf8');
const fightPlanScript = fs.readFileSync('js/fight-plan.js', 'utf8');
const undergroundBuzzScript = fs.readFileSync('js/underground-buzz.js', 'utf8');
const script = `${definitionsScript}\n${gameScript}\n${landingScript}\n${fightFocusScript}\n${fightPlanScript}\n${undergroundBuzzScript}`;
const pwaScript = fs.readFileSync('js/pwa.js', 'utf8');
const serviceWorker = fs.readFileSync('service-worker.js', 'utf8');
const cageFeedMigration = fs.readFileSync('supabase/migrations/20260809130000_shared_cage_feed.sql', 'utf8');
const cageAvatarMigration = fs.readFileSync('supabase/migrations/20260809150000_cage_profile_avatars.sql', 'utf8');
const cageInteractionMigration = fs.readFileSync('supabase/migrations/20260809200000_fighter_interactions.sql', 'utf8');
const cageProfileCountMigration = fs.readFileSync('supabase/migrations/20260809210000_cage_profile_count.sql', 'utf8');
const cageOpponentMigration = fs.readFileSync('supabase/migrations/20260809220000_cage_opponent_candidates.sql', 'utf8');
const cageIdentityMigration = fs.readFileSync('supabase/migrations/20260810120000_permanent_fighter_identity.sql', 'utf8');
const capitalIdentityMigration = fs.readFileSync('supabase/migrations/20260810150000_capitalcase_fighter_identity.sql', 'utf8');
const expandedAvatarMigration = fs.readFileSync('supabase/migrations/20260810170000_expand_fighter_avatars.sql', 'utf8');
const cageCeoMigration = fs.readFileSync('supabase/migrations/20260812120000_cage_grind_ceo.sql', 'utf8');
const cageChampionshipMigration = fs.readFileSync('supabase/migrations/20260814120000_global_cage_championship.sql', 'utf8');
const sanctionedChampionshipMigration = fs.readFileSync('supabase/migrations/20260814143000_daily_sanctioned_championship_bouts.sql', 'utf8');
const rematchVisibilityMigration = fs.readFileSync('supabase/migrations/20260815160000_title_rematch_visibility_and_ceo_results.sql', 'utf8');
const careerScopedTitleMigration = fs.readFileSync('supabase/migrations/20260816120000_scope_title_history_to_active_careers.sql', 'utf8');
const dailyTitleRematchMigration = fs.readFileSync('supabase/migrations/20260816180000_daily_title_rematches_and_career_ranks.sql', 'utf8');
const simplifiedChampionshipMigration = fs.readFileSync('supabase/migrations/20260816193000_simplified_world_championship.sql', 'utf8');
const manualIdentityMigration = fs.readFileSync('supabase/migrations/20260815143000_manual_fighter_handles.sql', 'utf8');
const twoArchetypeMigration = fs.readFileSync('supabase/migrations/20260815200000_two_major_archetypes.sql', 'utf8');
const resumeOwnedIdentityMigration = fs.readFileSync('supabase/migrations/20260817153000_resume_owned_fighter_identity.sql', 'utf8');
const fortyFourAvatarMigration = fs.readFileSync('supabase/migrations/20260817190000_expand_fighter_avatars_to_44.sql', 'utf8');
const expandedHometownsMigration = fs.readFileSync('supabase/migrations/20260818120000_expand_fighter_hometowns.sql', 'utf8');
const themedHometownsMigration = fs.readFileSync('supabase/migrations/20260819120000_expand_fighter_hometowns.sql', 'utf8');
const feedActionsMigration = fs.readFileSync('supabase/migrations/20260819130000_feed_actions_and_sponsors.sql', 'utf8');
const surgeCoreMigration = fs.readFileSync('supabase/migrations/20260824100000_rename_volt_sponsor_to_surge_core.sql', 'utf8');
const rankedDefenseChallengerMigration = fs.readFileSync('supabase/migrations/20260825120000_rank_championship_defense_challengers.sql', 'utf8');
const rankedChampionRetirementSuccessionMigration = fs.readFileSync('supabase/migrations/20260825193000_ranked_champion_retirement_succession.sql', 'utf8');
const championshipSettlementFunction = fs.readFileSync('supabase/functions/settle-cage-championship/index.ts', 'utf8');
const manifest = JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));
const appVersion = JSON.parse(fs.readFileSync('app-version.json', 'utf8')).version;
const packageVersion = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
const contentContext = {};
vm.runInNewContext(focusContacts, contentContext);
vm.runInNewContext(strings, contentContext);
const stringsData = contentContext.CAGE_STRINGS;

function pngTopLeftAlpha(file) {
  const png = fs.readFileSync(file);
  assert.equal(png.readUInt8(24), 8, `${file} should use 8-bit PNG channels`);
  assert.equal(png.readUInt8(25), 6, `${file} should use RGBA PNG color`);
  const idat = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') idat.push(png.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const firstScanline = zlib.inflateSync(Buffer.concat(idat));
  return firstScanline.readUInt8(4);
}

test('external game assets are linked and the game script parses', () => {
  const releaseVersionPattern = appVersion.replaceAll('.', '\\.');
  assert.match(page, new RegExp(`<link rel="stylesheet" href="css/styles\\.css\\?v=${releaseVersionPattern}">`));
  for (const asset of ['css/shared.css','css/landing.css','js/shared-ui.js','js/fight-focus-contacts.js','js/landing.js','js/fight-focus.js','js/fight-plan.js','js/underground-buzz.js','js/definitions.js']) assert.match(page,new RegExp(`${asset.replace('.','\\.')}\\?v=${releaseVersionPattern}`));
  assert.ok(page.indexOf('fight-focus-contacts.js')<page.indexOf('strings.js'), 'contact data must load before strings');
  assert.ok(page.indexOf('landing.js')<page.indexOf('game.js'), 'feature modules must load before the coordinator');
  assert.ok(page.indexOf('underground-buzz.js')<page.indexOf('game.js'), 'Underground Buzz must load before the coordinator');
  assert.ok(page.indexOf('definitions.js')<page.indexOf('game.js'), 'definitions must load before the coordinator');
  const pageWithoutAllowedInlineScripts = page
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '')
    .replace(/<script>\s*window\.dataLayer[\s\S]*?gtag\('config', 'G-LMT6RLVT5L'\);\s*<\/script>/, '');
  assert.doesNotMatch(pageWithoutAllowedInlineScripts, /<style>|<script>(?!<\/script>)/);
  assert.doesNotThrow(() => new Function(strings));
  assert.doesNotThrow(() => new Function(focusContacts));
  assert.doesNotThrow(() => new Function(logic));
  assert.doesNotThrow(() => new Function(analytics));
  assert.doesNotThrow(() => new Function(supabaseClient));
  assert.doesNotThrow(() => new Function(cageSocial));
  assert.doesNotThrow(() => new Function(sharedUi));
  assert.doesNotThrow(() => new Function(undergroundBuzzScript));
  assert.doesNotThrow(() => new Function(script));
  assert.doesNotThrow(() => new Function(pwaScript));
  assert.doesNotThrow(() => new Function(serviceWorker));
  assert.match(script, /const LOGIC=globalThis\.CAGE_LOGIC/);
  assert.match(script, /const STRINGS=globalThis\.CAGE_STRINGS/);
  assert.match(script, /const SHARED_FEED=globalThis\.CAGE_SOCIAL/);
  assert.match(serviceWorker, /'\.\/js\/cage-social\.js\?v=/);
  for (const asset of ['css/shared.css','css/landing.css','js/shared-ui.js','js/fight-focus-contacts.js','js/landing.js','js/fight-focus.js','js/fight-plan.js','js/underground-buzz.js','js/definitions.js']) assert.match(serviceWorker,new RegExp(`'\\./${asset.replace('.','\\.')}\\?v=`));
});

test('data-only game catalogs live in definitions.js', () => {
  for (const name of ['planDefs','fighterAvatars','gearItems','trainDefs','sparringDefs','trainingInjuryDefs','hustleDefs','horseRaceProfiles','recoveryDefs','publicityDefs','endorsementDefs','fightMomentDefs']) {
    const declaration = new RegExp(`const ${name}\\s*=`);
    assert.match(definitionsScript, declaration);
    assert.doesNotMatch(gameScript, declaration);
  }
});

test('landing, fight planning, focus flow, Underground Buzz, and contact data stay in ordinary feature files', () => {
  assert.doesNotMatch(gameCss, /\.landing-page|\.landing-content|\.landing-feature/);
  assert.match(landingCss, /\.landing-page\{/);
  assert.match(landingScript, /root\.CAGE_LANDING=\{createLandingFeature\}/);
  assert.match(fightPlanScript, /root\.CAGE_FIGHT_PLAN=\{createFightPlanFeature\}/);
  assert.match(fightFocusScript, /root\.CAGE_FIGHT_FOCUS=\{createFightFocusFeature\}/);
  assert.match(undergroundBuzzScript, /root\.CAGE_UNDERGROUND_BUZZ=\{createUndergroundBuzzFeature\}/);
  assert.match(focusContacts, /root\.CAGE_FIGHT_FOCUS_CONTACTS=/);
  assert.doesNotMatch(strings, /id:'mom'|id:'wife'|id:'grandma'/);
  assert.doesNotMatch(gameScript, /THE LOCKER ROOM IS YOURS|HOW DO YOU PREPARE\?|Power shots raise damage/);
  assert.match(gameScript, /CAGE_LANDING\.createLandingFeature/);
  assert.match(gameScript, /CAGE_FIGHT_FOCUS\.createFightFocusFeature/);
  assert.match(gameScript, /CAGE_FIGHT_PLAN\.createFightPlanFeature/);
  assert.match(gameScript, /CAGE_UNDERGROUND_BUZZ\.createUndergroundBuzzFeature/);
  assert.doesNotMatch(gameScript, /function (?:openBlackjack|rollCageDice|runHorseRace)\(/);
});

test('Google Analytics is configured and gameplay tracking is validated and non-fatal', () => {
  assert.match(page, /googletagmanager\.com\/gtag\/js\?id=G-LMT6RLVT5L/);
  assert.match(page, /gtag\('config', 'G-LMT6RLVT5L'\)/);
  assert.match(serviceWorker, /'\.\/js\/analytics\.js\?v=/);

  const calls = [];
  const context = { gtag: (...args) => calls.push(args) };
  vm.runInNewContext(analytics, context);
  const accepted = context.CAGE_ANALYTICS.track('training_completed', {
    training_id: 'heavy-bag-rounds',
    stat_gain: 2,
    coach_used: true,
    ignored: { save: 'data' },
    'Bad Key': 'nope',
    long_value: 'x'.repeat(150),
  });
  assert.equal(accepted, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'event');
  assert.equal(calls[0][1], 'training_completed');
  const sent = JSON.parse(JSON.stringify(calls[0][2]));
  assert.deepEqual(sent, {
    training_id: 'heavy-bag-rounds',
    stat_gain: 2,
    coach_used: true,
    long_value: 'x'.repeat(100),
  });
  assert.equal(context.CAGE_ANALYTICS.track('Invalid Event', {}), false);
  assert.equal(calls.length, 1);

  const failingContext = { gtag: () => { throw new Error('blocked'); } };
  vm.runInNewContext(analytics, failingContext);
  assert.equal(failingContext.CAGE_ANALYTICS.track('game_open'), false);

  for (const eventName of [
    'career_started', 'game_screen_view', 'training_completed', 'recovery_completed',
    'hustle_completed', 'publicity_completed', 'blackjack_completed', 'cage_dice_completed', 'horse_race_completed',
    'daily_reward_claimed', 'fight_started', 'fight_completed',
    'gear_drop_revealed', 'social_post', 'endorsement_signed', 'level_up',
  ]) assert.match(script, new RegExp(`trackEvent\\('${eventName}'`), `missing ${eventName} tracking`);
  assert.doesNotMatch(script, /\b(?:fighter_name|opponent_name|post_text)\s*:/);
});

test('generated Cage Grind branding and navigation icons are wired into the interface', () => {
  assert.match(page, /<title>Cage Grind: Free MMA Career Browser Game<\/title>/);
  assert.match(page, /<img class="logo" src="assets\/cage-grind-logo\.png" alt="Cage Grind">/);
  assert.match(css, /\.logo\{[^}]*object-fit:contain/);
  const brandedAssets = [
    'assets/cage-grind-logo.png',
    ...['home', 'train', 'fight', 'hustle', 'gear', 'feed'].map(name => `assets/icons/nav-${name}.png`),
  ];
  for (const asset of brandedAssets) {
    const png = fs.readFileSync(asset);
    assert.ok(png.length > 0, `missing ${asset}`);
    assert.equal(png.subarray(1, 4).toString(), 'PNG', `${asset} must remain a PNG`);
    assert.equal(png[25], 6, `${asset} must remain RGBA so its background stays transparent`);
  }
});

test('the branded landing page gates the game and offers the correct career entry paths', () => {
  assert.match(page, /<body class="landing-active">/);
  assert.match(page, /<section class="landing-page" id="landingPage"/);
  assert.equal((page.match(/<h1\b/g) || []).length, 1, 'the document should expose one clear primary heading');
  assert.match(page, /<h1 id="landingTitle"><span id="landingTitleLead">BUILD\. FIGHT\.<\/span><br><span class="accent" id="landingTitleAccent">BECOME\.<\/span><\/h1>/);
  assert.match(page, /Start with nothing\. Train your fighter, earn your shot, and grind your way from unknown rookie to cage champion\./);
  assert.match(page, /<div class="hero-copy"><div class="record"><b id="recordText">0-0<\/b><small>PRO RECORD<\/small><\/div><\/div>/);
  assert.doesNotMatch(page, /class="hero-social"|id="fansText"/);
  assert.match(page, /id="landingEnterBtn"[^>]*>START YOUR CAREER →<\/button>/);
  assert.match(page, /FREE TO PLAY[\s\S]*NO DOWNLOAD[\s\S]*PLAY INSTANTLY/);
  assert.match(page, /<a class="landing-origin" href="origins\.html">THE ORIGINS OF CAGE GRIND<\/a>/);
  assert.match(page, /<main class="landing-card">[\s\S]*class="landing-watermark" src="assets\/app-icon-512\.png\?v=2\.5\.223" alt="" aria-hidden="true"/);
  assert.match(page, /class="landing-logo" src="assets\/cage-grind-logo\.png" alt="Cage Grind"/);
  assert.match(css, /\.landing-logo\{display:block;[^}]*width:min\(72%,360px\);[^}]*drop-shadow/);
  assert.match(css, /body\.landing-active #app\{visibility:hidden;pointer-events:none\}/);
  assert.match(landingScript, /logic\.careerLandingMode\(state\)/);
  assert.match(script, /CONTINUE CAREER/);
  assert.match(landingScript, /sharedUi\.isCurrentChampion\(getChampionship\(\),state\)/);
  assert.match(landingScript, /champion\?'THE CHAMP IS BACK'/);
  assert.match(landingScript, /champion\?'WORLD CHAMPION':getRank\?\.\(\)\|\|'CAREER ACTIVE'/);
  assert.match(landingScript, /setChampionship\(championship\);championshipLoaded=loaded;championshipUnavailable=unavailable;render\(\);onChampionshipChange\?\.\(\)/);
  assert.match(gameScript, /onChampionshipChange:renderFightChampionship/);
  assert.match(gameScript, /getRank:\(\)=>rankName\(\)/);
  assert.match(landingScript, /`LEVEL \$\{state\.level\}`/);
  assert.match(landingScript, /`\$\{state\.wins\}-\$\{state\.losses\} PRO`/);
  assert.match(landingScript, /Math\.max\(\.32,Math\.min\(\.88,10\.5\/String\(state\.name\|\|''\)\.length\)\)/);
  assert.doesNotMatch(script, /KEEP GRINDING/);
  assert.match(script, /CONTINUE YOUR BUILD/);
  assert.match(script, /START YOUR CAREER/);
  assert.match(script, /trackEvent\('landing_view'/);
  assert.match(script, /trackEvent\('landing_enter'/);
  assert.match(css, /\.landing-page\{position:fixed;[^}]*height:100dvh;[^}]*min-height:100vh;[^}]*overflow-y:auto/);
  assert.match(css, /\.landing-watermark\{position:absolute;[^}]*left:50%;top:50%;[^}]*opacity:\.1;[^}]*translate\(-50%,-50%\)/);
  assert.match(css, /\.landing-card\{position:relative;[^}]*width:min\(100%,720px\);[^}]*text-align:center/);
  assert.match(css, /@media \(max-width:500px\)/);
  assert.match(css, /\.tape-purse strong,\.tape-breakdown-total strong\{font-family:Impact,Haettenschweiler,"Arial Narrow Bold","Roboto Condensed",sans-serif;[^}]*font-weight:900/);
});

test('minimal landing remains championship-aware without blocking entry', () => {
  assert.doesNotMatch(page, /id="landingChampionPanel"/);
  assert.match(script, /function loadLandingChampionship\(\)/);
  assert.match(script, /SHARED_FEED\.loadChampionship\(\)/);
  assert.match(landingScript, /champion=returning&&sharedUi\.isCurrentChampion/);
  assert.match(landingScript, /champion\?'THE CHAMP IS BACK'/);
  assert.match(landingScript, /catch\{setAvailability\(null,true,true\)\}/);
  assert.match(gameScript, /unavailable=landingStatus\.championshipUnavailable===true\|\|\(sharedSocialStatus==='error'&&!sharedChampionship&&!landingStatus\.championshipLoaded\)/);
  assert.doesNotMatch(gameScript, /const unavailable=sharedSocialStatus==='error'/);
  assert.match(script, /loadLandingChampionship\(\);[\s\S]*observeLandingFeatures\(\);[\s\S]*writeHistory/);
  assert.doesNotMatch(script, /await loadLandingChampionship\(\)/);
  assert.match(script, /button\.disabled=true;trackEvent\('landing_enter'/, 'CTA remains independent of championship loading');
});

test('canonical SEO metadata consistently points crawlers and social previews to cagegrind.com', () => {
  assert.match(page, /<link rel="canonical" href="https:\/\/cagegrind\.com\/" \/>/);
  assert.match(page, /<meta name="description" content="[^"]*MMA fighter[^"]*" \/>/);
  assert.match(page, /<meta property="og:url" content="https:\/\/cagegrind\.com\/" \/>/);
  assert.match(page, /<meta property="og:image" content="https:\/\/cagegrind\.com\/assets\/cage-grind-social-card\.png" \/>/);
  assert.match(page, /<meta property="og:image:type" content="image\/png" \/>/);
  assert.match(page, /<meta name="twitter:card" content="summary_large_image" \/>/);
  assert.match(page, /<meta name="twitter:image:alt" content="Cage Grind: Build the fighter\. Live the career\." \/>/);
  const structuredBlocks = [...page.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
  const structuredData = structuredBlocks.find(block => block['@type'] === 'SoftwareApplication') || {};
  const websiteData = structuredBlocks.find(block => block['@type'] === 'WebSite') || {};
  assert.equal(structuredData['@type'], 'SoftwareApplication');
  assert.equal(structuredData.additionalType, 'https://schema.org/VideoGame');
  assert.equal(structuredData.url, 'https://cagegrind.com/');
  assert.equal(structuredData.applicationCategory, 'GameApplication');
  assert.equal(structuredData.isAccessibleForFree, true);
  assert.equal(structuredData.offers.price, '0');
  assert.equal(websiteData.name, 'Cage Grind');
  assert.equal(websiteData.url, 'https://cagegrind.com/');
  assert.equal(fs.readFileSync('CNAME', 'utf8').trim(), 'cagegrind.com');
  assert.match(fs.readFileSync('robots.txt', 'utf8'), /Sitemap: https:\/\/cagegrind\.com\/sitemap\.xml/);
  assert.match(fs.readFileSync('sitemap.xml', 'utf8'), /<loc>https:\/\/cagegrind\.com\/<\/loc>/);
});

test('install manifest uses valid branded icons and a stable in-scope launch URL', () => {
  assert.match(page, /<link rel="manifest" href="manifest\.webmanifest" \/>/);
  assert.equal(manifest.id, './');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.orientation, 'portrait');
  assert.deepEqual(manifest.categories, ['games', 'sports']);
  for (const icon of manifest.icons) {
    const png = fs.readFileSync(icon.src);
    const [expectedWidth, expectedHeight] = icon.sizes.split('x').map(Number);
    assert.equal(png.readUInt32BE(16), expectedWidth, `${icon.src} width must match its manifest declaration`);
    assert.equal(png.readUInt32BE(20), expectedHeight, `${icon.src} height must match its manifest declaration`);
  }
  assert.equal(fs.readFileSync('assets/app-icon-192.png')[25], 6, 'standard install icon should preserve transparency');
  assert.equal(fs.readFileSync('assets/app-icon-512.png')[25], 6, 'large install icon should preserve transparency');
});

test('shared Cage Feed uses a public Supabase client with RLS-protected schema', () => {
  assert.match(cageSocial, /https:\/\/oucstmfyfuoxyqcgqsqm\.supabase\.co/);
  assert.match(cageSocial, /sb_publishable_/);
  assert.doesNotMatch(`${supabaseClient}\n${cageSocial}`, /sb_secret_|service_role/);
  assert.match(supabaseClient, /async function authenticatedRequest\(path,options=\{\},expectedUserId=''\)/);
  assert.match(supabaseClient, /stored\.user\.id===attempted\.user\.id&&stored\.refresh_token!==attempted\.refresh_token/);
  assert.doesNotMatch(supabaseClient, /error\.status!==401[\s\S]{0,120}rememberSession\(null\)/);
  assert.match(supabaseClient, /async function rpc\(name,args\)/);
  assert.match(supabaseClient, /\/rest\/v1\/cage_feed_posts\?select=/);
  assert.match(supabaseClient, /registerCageProfile/);
  assert.match(cageSocial, /DATABASE\.createClient\(options\)/);
  assert.doesNotMatch(cageSocial, /\/auth\/v1\/|\/rest\/v1\/|Authorization:`Bearer|function rememberSession|database\.rpc|authenticatedRequest/);
  assert.match(cageFeedMigration, /alter table public\.cage_profiles enable row level security/i);
  assert.match(cageFeedMigration, /alter table public\.cage_feed_posts enable row level security/i);
  assert.match(cageFeedMigration, /security definer\s+set search_path = ''/i);
  assert.match(cageFeedMigration, /revoke execute on function public\.register_cage_profile[\s\S]*from public, anon/i);
  assert.match(cageFeedMigration, /grant execute on function public\.publish_cage_post[\s\S]*to authenticated/i);
  assert.match(cageFeedMigration, /when 'new-york' then 'NYC'/);
  assert.match(cageFeedMigration, /when 'brawler' then 'Brawler'/);
  assert.match(cageFeedMigration, /lpad\(v_suffix::text,2,'0'\)/);
  assert.match(page, /id="fighterBioModal"/);
  assert.match(script, /SHARED_FEED\.loadFeed\(50\)/);
  assert.match(script, /SHARED_FEED\.loadProfiles\(1000\)/);
  assert.match(cageProfileCountMigration, /select count\(\*\)::integer\s+from public\.cage_profiles/i);
  assert.match(cageProfileCountMigration, /grant execute on function public\.get_cage_profile_count\(\) to authenticated/i);
  assert.match(cageSocial, /async function loadProfileCount\(\)/);
  assert.match(script, /state\.socialFollowingCount=await SHARED_FEED\.loadProfileCount\(\)/);
  assert.match(script, /socialRemoteInitialized:false/);
  assert.match(script, /const hasOwnRemotePost=/);
  assert.match(script, /publishPost\(\{kind:'player',body:'Hello, fight fans!/);
});

test('real Cage Feed fighters expose validated avatars and public bios', () => {
  assert.match(cageAvatarMigration, /add column if not exists fighter_avatar text/i);
  assert.match(cageAvatarMigration, /fighter-\(0\[1-9\]\|1\[0-9\]\|20\)/);
  assert.match(cageAvatarMigration, /register_cage_profile\([\s\S]*p_fighter_avatar text/i);
  assert.match(cageAvatarMigration, /revoke execute on function public\.register_cage_profile\(text,text,text,integer,integer,integer,text\) from public, anon/i);
  assert.match(cageSocial, /p_fighter_avatar:profile\.fighterAvatar/);
  assert.match(supabaseClient, /select=id,handle,city,archetype,fighter_avatar,level,wins,losses,updated_at&retired_at=is.null/);
  assert.match(page, /id="fighterBioModal"/);
  assert.match(script, /data-feed-profile=/);
  assert.match(script, /function fighterBioSentence\(profile\)/);
  assert.match(script, /profile\?\.id===state\.socialProfileId/);
  assert.match(script, /USE THE FEED ACTIONS TO POST TO THIS FIGHTER/);
  assert.doesNotMatch(script, /data-fighter-interaction/);
  assert.match(script, /REAL CAGE GRIND FIGHTER|fighterBioAvatar/);
  assert.match(css, /\.feed-avatar\.fighter-photo/);
});

test('Supabase accepts all forty-four permanent fighter avatars', () => {
  assert.match(fortyFourAvatarMigration, /add constraint cage_profiles_fighter_avatar/i);
  assert.match(fortyFourAvatarMigration, /fighter-\(0\[1-9\]\|\[123\]\[0-9\]\|4\[0-4\]\)/);
  assert.match(fortyFourAvatarMigration, /create or replace function public\.claim_cage_identity/i);
  assert.match(fortyFourAvatarMigration, /create or replace function public\.sync_cage_profile/i);
  assert.match(fortyFourAvatarMigration, /fighter-01 through fighter-44/i);
});

test('daily and install drops share one prioritized home offer and one verified install reward', async () => {
  assert.match(page, /id="homeDropOffer" hidden/);
  assert.match(script, /homeDropTitle'\)\.textContent='TAKE CAGE GRIND WITH YOU'/);
  assert.match(page, /id="installGameBtn"[^>]*hidden>INSTALL GAME · FREE DROP<\/button>/);
  assert.match(page, /id="dailyBtn"[^>]*>[\s\S]*id="dailyBtnLabel">CLAIM DAILY DROP<\/span>[\s\S]*id="dailyDropCountdown"[^>]*data-daily-reset-clock[^>]*hidden/);
  assert.match(script, /installDetected:false,installRewardClaimed:false/);
  assert.match(script, /dailyAvailable=ready&&state\.lastDaily!==todayKey\(\),installAvailable=ready&&!dailyAvailable/);
  assert.match(script, /dailyClaimed=ready&&!dailyAvailable&&!installAvailable/);
  assert.match(script, /homeDropOffer\.hidden=!ready;homeDropOffer\.classList\.toggle\('claimed',dailyClaimed\)/);
  assert.match(script, /dailyCountdown\.hidden=!dailyClaimed/);
  assert.match(script, /Next free pack at your local midnight/);
  assert.match(css, /\.daily-drop-card\.claimed\{[^}]*border-color:#3d4853/);
  assert.match(css, /\.daily-drop-card\.claimed:after,\.daily-drop-card\.claimed \.daily-drop-pack,\.daily-drop-card\.claimed \.daily-drop-copy,\.daily-drop-card\.claimed #dailyBtnLabel\{display:none\}/);
  assert.match(css, /\.daily-drop-card\.claimed \.daily\{[^}]*background:transparent;[^}]*box-shadow:none;[^}]*opacity:1/);
  assert.match(script, /state\.lastDaily!==todayKey\(\).*state\.installDetected/s);
  assert.match(script, /function awardInstallCollectible\(\)/);
  assert.match(script, /drop\.reason='INSTALL DROP'/);
  assert.match(script, /state\.installRewardClaimed=true/);
  assert.match(script, /document\.addEventListener\('cagegrind:installed'/);
  assert.match(script, /trackEvent\('install_reward_claimed'/);

  const windowListeners = {};
  const documentEvents = [];
  const fakeNavigator = {
    standalone: false,
    serviceWorker: { addEventListener() {}, register: async () => ({ addEventListener() {}, update: async () => {} }) },
  };
  const fakeWindow = {
    location: { protocol: 'https:' },
    navigator: fakeNavigator,
    matchMedia: () => ({ matches: false }),
    addEventListener: (name, handler) => { windowListeners[name] = handler; },
  };
  const context = {
    window: fakeWindow,
    navigator: fakeNavigator,
    document: {
      baseURI: 'https://cagegrind.com/',
      visibilityState: 'visible',
      activeElement: null,
      querySelector: () => ({ content: '2.2.3' }),
      getElementById: () => null,
      addEventListener() {},
      dispatchEvent: event => documentEvents.push(event),
    },
    CustomEvent: class CustomEvent { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } },
    URL,
    queueMicrotask: callback => callback(),
    sessionStorage: { getItem: () => '', setItem() {} },
  };
  vm.runInNewContext(pwaScript, context);
  let prevented = false;
  let prompted = false;
  windowListeners.beforeinstallprompt({
    preventDefault: () => { prevented = true; },
    prompt: async () => { prompted = true; },
    userChoice: Promise.resolve({ outcome: 'accepted' }),
  });
  assert.equal(prevented, true);
  assert.equal(context.CAGE_PWA.installAvailable(), true);
  assert.deepEqual(JSON.parse(JSON.stringify(await context.CAGE_PWA.requestInstall())), { status: 'accepted' });
  assert.equal(prompted, true);
  assert.equal(context.CAGE_PWA.installAvailable(), false);
  windowListeners.appinstalled();
  assert.ok(documentEvents.some(event => event.type === 'cagegrind:installed'));
});

test('the database owns one real-player championship with transactional level-gated challenges', () => {
  assert.match(cageChampionshipMigration, /create table if not exists public\.cage_championship \(/i);
  assert.match(cageChampionshipMigration, /constraint cage_championship_singleton check \(championship_key='world'\)/i);
  assert.match(cageChampionshipMigration, /champion_id uuid references public\.cage_profiles\(id\) on delete set null/i);
  assert.match(cageChampionshipMigration, /create table if not exists public\.cage_championship_challenges/i);
  assert.match(cageChampionshipMigration, /create table if not exists public\.cage_championship_history/i);
  assert.match(cageChampionshipMigration, /alter table public\.cage_championship enable row level security/i);
  assert.match(cageChampionshipMigration, /revoke all on table public\.cage_championship from public, anon, authenticated/i);
  assert.match(cageChampionshipMigration, /create or replace function public\.get_cage_championship\(\)/i);
  assert.match(cageChampionshipMigration, /viewer\.level>=champion\.level/i);
  assert.match(cageChampionshipMigration, /create or replace function public\.begin_cage_championship_challenge\(\)/i);
  assert.match(cageChampionshipMigration, /v_challenger\.level<v_champion\.level/i);
  assert.match(cageChampionshipMigration, /started_at<=now\(\)-interval '2 hours'/i);
  assert.match(cageChampionshipMigration, /create or replace function public\.resolve_cage_championship_challenge\(/i);
  assert.match(cageChampionshipMigration, /revoke execute on function public\.resolve_cage_championship_challenge\(bigint,uuid,boolean\) from public, anon, authenticated/i);
  assert.match(cageChampionshipMigration, /grant execute on function public\.resolve_cage_championship_challenge\(bigint,uuid,boolean\) to service_role/i);
  assert.match(cageChampionshipMigration, /where championship_key='world'\s+for update/i);
  assert.match(cageChampionshipMigration, /v_title\.champion_id is distinct from v_challenge\.champion_id/i);
  assert.match(cageChampionshipMigration, /set champion_id=v_challenger\.id,/i);
  assert.match(cageChampionshipMigration, /'global_title_' \|\| v_challenge\.id::text/i);
  assert.match(cageChampionshipMigration, /defended the Cage Grind World Championship against/i);
  assert.match(cageChampionshipMigration, /v_event_key not in \('debut','performance_bonus'\)/i);
  assert.match(cageChampionshipMigration, /Championship announcements are managed by the global belt/i);
  assert.match(cageChampionshipMigration, /after update of retired_at on public\.cage_profiles/i);
  assert.match(cageChampionshipMigration, /before delete on public\.cage_profiles/i);
  assert.match(cageChampionshipMigration, /order by level desc,wins desc,losses asc,updated_at asc,id asc/i);
  assert.doesNotMatch(cageChampionshipMigration, /city_title|regional_title|us_title/);
});

test('PWA version checks compare releases without touching career save storage', () => {
  const context = {};
  vm.runInNewContext(pwaScript, context);
  assert.equal(context.CAGE_PWA.compareVersions('2.1.0', '2.0.9'), 1);
  assert.equal(context.CAGE_PWA.compareVersions('2.1.0', '2.1.0'), 0);
  assert.equal(context.CAGE_PWA.compareVersions('2.0.9', '2.1.0'), -1);
  assert.equal(context.CAGE_PWA.validVersion('2.1.0'), true);
  assert.equal(context.CAGE_PWA.validVersion('latest'), false);
  assert.equal(appVersion, packageVersion);
  assert.match(page, new RegExp(`<meta name="app-version" content="${appVersion.replaceAll('.', '\\.')}" \\/>`));
  assert.match(serviceWorker, new RegExp(`const APP_VERSION='${appVersion.replaceAll('.', '\\.')}';`));
  assert.match(pwaScript, /fetch\(versionUrl,\{cache:'no-store'/);
  assert.match(pwaScript, /navigator\.serviceWorker\.register\('service-worker\.js'/);
  assert.match(serviceWorker, /event\.data\?\.type==='SKIP_WAITING'/);
  assert.doesNotMatch(pwaScript, /localStorage|cage-warrior-save/);
});

test('DOM ids are unique', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
});

test('mobile viewport permits accessibility zoom', () => {
  assert.match(page, /<meta name="mobile-web-app-capable" content="yes" \/>/);
  assert.match(page, /<meta name="apple-mobile-web-app-capable" content="yes" \/>/);
  const viewport = html.match(/<meta name="viewport" content="([^"]+)"/i)?.[1] || '';
  assert.doesNotMatch(viewport, /user-scalable\s*=\s*no/i);
  assert.doesNotMatch(viewport, /maximum-scale\s*=\s*1/i);
});

test('desktop breakpoint expands the same game into a persistent workspace', () => {
  assert.match(html, /@media \(min-width:1100px\)\{/);
  assert.match(html, /#app\{width:min\(100vw,1440px\);height:100dvh/);
  assert.match(html, /\.bottomnav\{[^}]*width:132px[^}]*grid-template-rows:repeat\(6,74px\)/);
  assert.match(html, /\.resource-hud\{width:calc\(100% - 132px\);margin-left:132px;height:66px[^}]*flex-direction:row/);
  assert.match(html, /#careerGameContent\{display:grid;grid-template-columns:minmax\(420px,1\.15fr\) minmax\(440px,1fr\)/);
  assert.match(page, /class="hustle-columns"[\s\S]*class="hustle-column hustle-column-primary"[\s\S]*class="hustle-column hustle-column-secondary"/);
  assert.match(html, /\.opponent-grid\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(html, /\.screen\[data-screen="gear"\] \.gear-grid\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(html, /\.live-card\{display:grid;grid-template-columns:minmax\(0,1\.5fr\) minmax\(340px,\.8fr\)/);
  assert.match(html, /\.screen\[data-screen="hustle"\] \.hustle-columns\{[^}]*grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);
  assert.match(html, /\.screen\[data-screen="hustle"\] \.hustle-column\{[^}]*flex-direction:column[^}]*gap:16px/);
  assert.match(html, /\.screen\[data-screen="hustle"\] \.card\{[^}]*min-height:max-content/);
  assert.match(readme, /Responsive desktop interface/);
});

test('matchup and hustle cards keep consistent full-bleed surfaces', () => {
  assert.match(css, /\.tape-player-art\{height:100%;object-fit:cover;object-position:center top\}/);
  assert.match(css, /\.career-card \.card-title\{background:linear-gradient\(#17283f,#0a111d\);border-bottom-color:#203a5d\}/);
  assert.match(css, /\.screen\{[^}]*min-height:inherit[^}]*overflow:visible/);
  assert.match(css, /\.screen\[data-screen="hustle"\] \.card,\.screen\[data-screen="hustle"\] \.daily-reset-clock,\.screen\[data-screen="hustle"\] \.section-note\{flex-shrink:0\}/);
});

test('interface text never renders below 8.5px', () => {
  const fontSizes = [...html.matchAll(/font-size:\s*([\d.]+)px/g)].map(match => Number(match[1]));
  assert.ok(fontSizes.length > 0, 'expected pixel font sizes in the interface');
  assert.ok(fontSizes.every(size => size >= 8.5), `found undersized text: ${fontSizes.filter(size => size < 8.5).join(', ')}`);
});

test('daily contract and seeded challenge are removed while the daily drop remains', () => {
  assert.doesNotMatch(html, /Daily Contract|Daily Seeded Challenge/i);
  assert.doesNotMatch(script, /generateDailyOpponent|ensureDailyChallenge|dailyChallenge|dailyObjective|updateObjectiveFromFight/);
  assert.match(html, /Daily Drop/);
});

test('save recovery and current-level unranked roster cleanup remain enabled', () => {
  assert.match(script, /cage-warrior-save-backup-v1/);
  assert.doesNotMatch(script, /bootstrapPast/);
  assert.match(script, /o\.network\|\|\(o\.tier===state\.level&&\(o\.lossesToPlayer\|\|0\)===0\)/);
  assert.match(script, /state\.leagueInitialized=true/);
  const avatarsReady = script.indexOf("const fighterAvatars = [");
  const injuryMigrationReady = script.indexOf('const TRAINING_INJURY_IDS=');
  const stateLoaded = script.indexOf('state = loadState();');
  assert.ok(avatarsReady >= 0 && stateLoaded > avatarsReady, 'saved state must load only after avatar migration data is initialized');
  assert.ok(injuryMigrationReady >= 0 && stateLoaded > injuryMigrationReady, 'saved state must load only after injury migration data is initialized');
  assert.doesNotMatch(script, /let state = loadState\(\)/);
  assert.match(script, /LOGIC\.selectStoredState/);
  assert.match(script, /LOGIC\.shouldBackupRaw/);
});

test('rival fights, taunts, and exhausted-gig states reflect actual state without masking locks', () => {
  assert.match(script, /const hasHistory=opponentHasHistory\(o\)/);
  assert.match(script, /matchup=hasHistory\?`\$\{rivalry\?'RIVAL · ':''\}YOU/);
  assert.match(script, /:'VIEW MATCHUP'/);
  assert.match(script, /rivalFight=available&&\(o\.winsVsPlayer\|\|0\)>0/);
  assert.match(script, /gameIcon\('rematch','⚡'\).*RIVAL FIGHT/);
  assert.match(script, /rival fight available':tauntable\?', taunt available'/);
  assert.match(script, /data-taunt-key="\$\{o\.key\}"/);
  assert.match(script, /function tauntOpponent\(key\)/);
  assert.match(html, /\.rematch-banner\{[^}]*left:7px;right:7px;bottom:8px[^}]*font-size:8\.5px/);
  assert.match(script, /limited&&unlocked\?'gig-unavailable'/);
  assert.match(script, /availability=!unlocked\?requirementText\(a\):limited\?'NO GIGS LEFT'/);
  assert.doesNotMatch(html, /\.action\.future\.gig-unavailable:after/);
});

test('opponents have pro records, persistent rival history, and consent-aware rematches', () => {
  assert.match(script, /function payoutForOpponent\(o\)\{return LOGIC\.opponentFightPurse\(LOGIC\.payoutForOpponent\(o,state\.level\),opponentWinsToday\(o\)\)\}/);
  assert.match(script, /recordInitialized:true/);
  assert.match(script, /<span class="opp-record">PRO \$\{o\.wins\}-\$\{o\.losses\}<\/span>/);
  assert.match(script, /matchup=hasHistory\?.*:'FIRST MEETING'/);
  assert.doesNotMatch(script, /<h3>\$\{o\.name\}<\/h3><p>\$\{o\.tag\}<\/p>/);
  assert.match(script, /function opponentGroup\(o\)\{return LOGIC\.opponentGroup/);
  assert.match(script, /function opponentAvailable\(o\)/);
  assert.match(script, /data-taunt-key="\$\{o\.key\}">TAUNT<\/button>/);
  assert.match(script, /hasHistory\?'RUN IT BACK':'VIEW MATCHUP'/);
  assert.match(script, /o\.rematchAccepted=false/);
  assert.match(script, /o\.rematchAccepted=true/);
  assert.doesNotMatch(script, /lossesToPlayer>=o\.retireAt/);
  assert.doesNotMatch(script, /RETIRES AFTER/);
  assert.match(script, /cash=LOGIC\.winFightCash/);
});

test('generated fighters use country-aware CapitalCase identities', () => {
  const countries = stringsData.opponentNames.countries;
  assert.ok(countries.length >= 16);
  for (const country of countries) {
    assert.match(country.code, /^[A-Z]{2,3}$/);
    assert.ok(country.first.length >= 10);
    assert.ok(country.last.length >= 10);
    for (const first of country.first) assert.match(first, /^[A-Z][A-Za-z]+$/);
    for (const last of country.last) assert.match(last, /^[A-Z][A-Za-z]+$/);
  }
  const mexico = countries.find(country => country.code === 'MX');
  const russia = countries.find(country => country.code === 'RUS');
  const usa = countries.find(country => country.code === 'USA');
  assert.ok(mexico.first.includes('Mario') && mexico.last.includes('Lopez'));
  assert.ok(usa.first.includes('Randy') && usa.last.includes('Jones'));
  for (const name of ['Ivanov','Petrov','Smirnov','Volkov','Kuznetsov']) assert.ok(russia.last.includes(name));
  for (const name of ['Lopez','Garcia','Hernandez','Martinez','Rodriguez']) assert.ok(!russia.last.includes(name));
  assert.match(script, /const opponentNameCountries=STRINGS\.opponentNames\.countries/);
  assert.match(script, /function generatedOpponentIdentity\(seed\)/);
  assert.match(script, /name:`\$\{first\}\$\{last\}\$\{country\.code\}`/);
  assert.match(script, /country:identity\.country/);
  assert.doesNotMatch(script, /STRINGS\.opponentNames\.(?:first|last)/);
});

test('scalable copy pools are separated from gameplay logic', () => {
  assert.ok(stringsData.fightCommentary.hit.jab.length >= 3);
  assert.ok(stringsData.fightCommentary.miss.takedown.length >= 2);
  assert.ok(stringsData.social.account.length >= 3);
  assert.ok(stringsData.social.cycles.fightWin.length >= 3);
  assert.ok(stringsData.social.interactions.callout.messages.length >= 5);
  assert.ok(stringsData.social.interactions.respect.messages.length >= 5);
  assert.match(script, /STRINGS\.fightCommentary\[landed\?'hit':'miss'\]\[type\]/);
  assert.match(script, /STRINGS\.social\.account\[0\]/);
  assert.match(script, /definition=STRINGS\.social\.interactions\[kind\]/);
  assert.doesNotMatch(script, /snaps a jab through the guard|First follow\. Let’s see where this goes/);
});

test('career identity keeps hometown informational and uses one shared real-player championship', () => {
  for (const city of ['PHOENIX', 'LOS ANGELES', 'CHICAGO', 'NEW YORK', 'MIAMI', 'HOUSTON', 'CLEVELAND', 'SEATTLE', 'NEW ORLEANS', 'HAWAII', 'BOSTON', 'ATLANTA', 'SAN FRANCISCO', 'DENVER']) {
    assert.match(script, new RegExp(`name:'${city}'`));
  }
  for (const region of ['SOUTHWEST', 'WEST COAST', 'MIDWEST', 'NORTHEAST', 'SOUTHEAST', 'GULF COAST', 'GREAT LAKES', 'PACIFIC NORTHWEST', 'DEEP SOUTH', 'PACIFIC ISLANDS', 'MOUNTAIN WEST']) {
    assert.match(script, new RegExp(`region:'${region}'`));
  }
  assert.match(html, /Fighting Out Of/);
  assert.match(script, /function chooseCity\(id\)/);
  assert.match(script, /function championshipOpponent\(\)/);
  assert.match(script, /globalChampionship:true[^\n]*titleName:'CAGE GRIND WORLD CHAMPIONSHIP'/);
  assert.match(script, /delete s\.milestones/);
  assert.doesNotMatch(script, /const milestoneDefs=/);
  assert.doesNotMatch(script, /function awardTitle\(/);
  assert.match(cageSocial, /loadChampionship/);
  assert.match(supabaseClient, /get_cage_championship/);
  const normalize = script.match(/function normalizeState\(parsed\)\{([\s\S]*?)\n\s*\}/)?.[1] || '';
  assert.doesNotMatch(normalize, /fighterCities/);
  assert.match(script, /function renderFightChampionship\(\)/);
  assert.match(sharedUi, /requiredLevel=Math\.max\(1,Math\.floor\(Number\(champ\.champion_level\)\)\|\|1\)/);
  assert.match(sharedUi, /TITLE SHOT AVAILABLE · CHAMPION LEVEL \$\{requiredLevel\}/);
  assert.match(sharedUi, /REACH LEVEL \$\{requiredLevel\} TO CHALLENGE/);
  assert.match(serviceWorker, /\.\/assets\/icons\/title-world\.png\?v=2\.5\.223/);
  assert.match(cageChampionshipMigration, /viewer\.level>=champion\.level/);
  for (const city of ['boston','atlanta','san-francisco','denver']) assert.match(expandedHometownsMigration,new RegExp(`'${city}'`));
  assert.match(expandedHometownsMigration, /drop constraint if exists cage_profiles_city[\s\S]*add constraint cage_profiles_city/);
  assert.match(expandedHometownsMigration, /create or replace function public\.claim_cage_identity/);
  for (const city of ['tampa-bay','philadelphia','san-antonio','las-vegas','portland','baltimore']) assert.match(themedHometownsMigration,new RegExp(`'${city}'`));
  assert.match(themedHometownsMigration, /drop constraint if exists cage_profiles_city[\s\S]*add constraint cage_profiles_city/);
  assert.match(themedHometownsMigration, /create or replace function public\.claim_cage_identity/);
});

test('the simplified World Championship is a daily server-authoritative flow', () => {
  for (const copy of ['WORLD TITLE SHOT LOCKED','TITLE SHOT AVAILABLE','TITLE SHOT USED TODAY','YOU ARE THE WORLD CHAMPION','TITLE DEFENDED','TITLE REMATCH AVAILABLE TOMORROW','TITLE REMATCH AVAILABLE','RECLAIM YOUR TITLE','CHAMPIONSHIP UPDATE UNAVAILABLE']) assert.match(script,new RegExp(copy));
  assert.match(script, /action=`UNLOCKS AT LEVEL \$\{championLevel\}`/);
  assert.match(script, /\$\{message\?`<p>\$\{message\}<\/p>`:''\}/);
  assert.match(script, /status='locked';headline='WORLD TITLE SHOT LOCKED';message=''/);
  assert.match(css, /\.championship-hub\.locked \.championship-heading\{min-height:88px/);
  assert.match(css, /\.championship-hub\.locked \.championship-icon\{width:min\(48%,176px\);height:112%;opacity:\.08\}/);
  for (const action of ['CHALLENGE FOR THE BELT','DEFEND YOUR TITLE','FIGHT FOR THE TITLE','DEFEND THE TITLE','RECLAIM THE TITLE']) assert.match(script,new RegExp(action));
  assert.match(page, /id="fightResetClock" hidden><span>DAILY FIGHT LIMIT REACHED[\s\S]*id="worldTitleCard"[\s\S]*>Opponents/);
  assert.match(page, /WORLD CHAMPIONSHIP BOUT/);
  assert.match(script, /function championshipOpponent\(\)/);
  assert.match(script, /selected_challenger/);
  assert.match(script, /titleMode:champion\?'defense':rematch\?'rematch':'challenge'/);
  assert.match(script, /opponents=state\.roster\.filter/);
  assert.doesNotMatch(script.match(/function refreshOpponents\(\)[\s\S]*?\n  \}/)?.[0]||'',/globalChampionship:true/);
  assert.match(script, /function resolveChampionshipIdentity\(value\)/);
  assert.match(script, /SHARED_UI\.resolveChampionshipIdentity\(value,state\)/);
  assert.match(script, /beginChampionshipBout\(o\.sourceProfileId\)/);
  assert.match(script, /championship_card_viewed/);
  const fightChampionshipRenderer=script.match(/function renderFightChampionship\(\)\{[\s\S]*?\n  \}/)?.[0]||'';
  assert.doesNotMatch(fightChampionshipRenderer, /championship-champion|CURRENT CHAMPION/);
  assert.match(script, /title_challenge_started/);
  assert.match(script, /title_defense_started/);
  assert.match(script, /title_rematch_started/);
  assert.match(script, /championship_result_settled/);
  assert.match(script, /pendingChampionshipResult/);
  assert.match(script, /CONFIRMING TITLE RESULT · SAVED FOR RETRY/);
  assert.match(championshipSettlementFunction, /Only the fighter who started this bout can submit its result/);
  assert.match(championshipSettlementFunction, /challenge\.status==='challenger_won'\?'new_champion'/);
  assert.match(simplifiedChampionshipMigration, /defense_used_today boolean/);
  assert.match(simplifiedChampionshipMigration, /selected_challenger_id uuid/);
  assert.match(simplifiedChampionshipMigration, /order by md5\(candidate\.id::text \|\| '\|' \|\| v_today::text\),candidate\.id/);
  assert.match(simplifiedChampionshipMigration, /Your next World Championship defense is available at midnight/);
  assert.match(simplifiedChampionshipMigration, /for update/);
  assert.match(simplifiedChampionshipMigration, /not exists \([\s\S]*rematch\.started_at>=history\.created_at/);
  assert.match(simplifiedChampionshipMigration, /history\.created_at at time zone 'utc'\)::date<v_today/);
  assert.match(simplifiedChampionshipMigration, /v_rematch_right and not v_rematch_available[\s\S]*title rematch is available at midnight/);
  assert.match(page, /id="titleLossModal"[\s\S]*YOU LOST THE WORLD TITLE[\s\S]*id="titleLossOpponent"[\s\S]*VIEW CHAMPIONSHIP/);
  assert.match(script, /function queueTitleLossPresentation\(champ\)/);
  assert.match(script, /state\.lastTitleLossSeenId=Math\.max\(state\.lastTitleLossSeenId,notice\.id\)/);
  assert.match(simplifiedChampionshipMigration, /Existing belts, challenges, history, profiles, and career saves remain intact/);
});

test('retired title history does not block a newly claimed fighter career', () => {
  assert.match(twoArchetypeMigration, /on conflict \(id\) do update set[\s\S]*created_at=now\(\)[\s\S]*retired_at=null/);
  assert.match(careerScopedTitleMigration, /create or replace function public\.get_cage_championship\(\)/);
  assert.match(careerScopedTitleMigration, /create or replace function public\.begin_cage_championship_challenge\(p_opponent_id uuid default null\)/);
  const careerBoundaries=careerScopedTitleMigration.match(/prior\.started_at>=greatest\((?:champion\.created_at,viewer\.created_at|v_champion\.created_at,v_challenger\.created_at)\)/g)||[];
  assert.equal(careerBoundaries.length,3,'both status branches and server authorization must use the active-career boundary');
  assert.doesNotMatch(careerScopedTitleMigration, /delete from public\.cage_championship_challenges/);
  assert.match(careerScopedTitleMigration, /Historical bouts remain preserved/);
});

test('fighter identity is globally unique, permanent, and locked before the career starts', () => {
  assert.match(html, /<small>Followers<\/small><b id="careerFollowersText">0<\/b>/);
  assert.doesNotMatch(html, /homeAvatarText|<small>Fighter Avatar<\/small>/);
  assert.match(html, /<div class="money"><b id="cashText">\$0<\/b><div class="top-progress"><span>HYPE<\/span><b id="hypeText">0%<\/b><\/div><\/div>/);
  assert.doesNotMatch(html, /id="followingText"|class="audience-counts"/);
  assert.doesNotMatch(html, /<small>CASH ·/);
  assert.doesNotMatch(html, /id="homeFighterNameText"|career-name-display/);
  assert.doesNotMatch(html, /editFighterNameBtn|fighterNameModal|fighterNameInput|edit-fighter-name/);
  assert.match(html, /id="fighterNameSetup"[^>]*hidden/);
  assert.match(html, /id="newFighterNameBtn"[^>]*>[\s\S]*data-icon-name="shuffle-name"[\s\S]*<span>SHUFFLE NAME<\/span><\/button>[\s\S]*id="manualFighterNameBtn"[^>]*>MANUAL ENTRY<\/button>[\s\S]*id="lockFighterNameBtn"[^>]*>READY<\/button>/);
  assert.match(html, /Shuffle until it feels right\. Ready checks the global roster/);
  assert.match(css, /\.fighter-name-shuffle\{display:flex;width:calc\(100% - 20px\);min-height:46px/);
  assert.match(css, /\.fighter-name-ready\{border-color:#3987cf;color:#9bd7ff;background:#0a2034\}/);
  assert.match(html, /id="manualFighterNameInput"[^>]*minlength="3"[^>]*maxlength="32"[^>]*pattern="\[A-Za-z\]\[A-Za-z0-9_\]\{2,31\}"[^>]*hidden/);
  assert.match(html, /cannot be edited after you press Ready/i);
  assert.match(script, /version:23,name:'ROOKIE',nameLocked:false,rookieShowcasePending:false/);
  assert.match(script, /function randomIdentitySuggestion\(\)/);
  assert.match(script, /LOGIC\.randomFighterIdentity\(pools\.openers,pools\.descriptors,pools\.cityCode\)/);
  assert.match(script, /if\(coreReady&&!state\.nameLocked&&!identitySuggestion\)identitySuggestion=randomIdentitySuggestion\(\)/);
  assert.match(script, /state\.fighterStyle=id;identitySuggestion=randomIdentitySuggestion\(\)/);
  assert.match(script, /function identityClaimCandidates\(preferred\)/);
  assert.match(script, /function manualIdentityName\(value\)[\s\S]*\^\[A-Za-z\]\[A-Za-z0-9_\]\{2,31\}\$/);
  assert.match(script, /const candidates=manualRequested\?\[requested\]:identityClaimCandidates\(requested\)/);
  assert.match(script, /state\.nameLocked=true;state\.rookieShowcasePending=true;state\.socialProfileId=profile\.id/);
  assert.match(cageIdentityMigration, /create table if not exists public\.cage_name_registry/i);
  assert.match(cageIdentityMigration, /on conflict \(name\) do nothing/i);
  assert.match(cageIdentityMigration, /create or replace function public\.claim_cage_identity/i);
  assert.match(cageIdentityMigration, /retired_at timestamptz/i);
  assert.match(capitalIdentityMigration, /create unique index[^;]+lower\(name\)/i);
  assert.match(capitalIdentityMigration, /v_candidate := trim\(v_candidate\)/i);
  assert.doesNotMatch(capitalIdentityMigration, /v_candidate := lower\(trim\(v_candidate\)\)/i);
  assert.match(capitalIdentityMigration, /PHX\|LAX\|CHI\|NYC\|MIA\|HOU\|CLE\|SEA\|NOLA\|HNL/);
  assert.match(capitalIdentityMigration, /v_city_code := case p_city[\s\S]*when 'los-angeles' then 'LAX'/i);
  assert.match(capitalIdentityMigration, /right\(v_candidate,length\(v_city_code\)\)<>v_city_code/i);
  assert.match(capitalIdentityMigration, /name ~ '\^\[a-z\]\[a-z0-9_\]\{2,31\}\$'/i);
  assert.match(manualIdentityMigration, /name ~ '\^\[A-Za-z\]\[A-Za-z0-9_\]\{2,31\}\$'/);
  assert.match(manualIdentityMigration, /v_candidate !~ '\^\[A-Za-z\]\[A-Za-z0-9_\]\{2,31\}\$'/);
  assert.doesNotMatch(manualIdentityMigration, /v_city_code|right\(v_candidate/);
  assert.match(resumeOwnedIdentityMigration, /update public\.cage_name_registry[\s\S]*set retired_at=null[\s\S]*lower\(name\)=lower\(v_candidate\)[\s\S]*owner_id=v_user_id/i);
  assert.match(resumeOwnedIdentityMigration, /if found then[\s\S]*insert into public\.cage_profiles[\s\S]*retired_at=null/i);
  assert.match(resumeOwnedIdentityMigration, /raise exception 'No unique Cage Grind name was available'/i);
  assert.doesNotMatch(supabaseClient, /fighter_name|author_name|target_name/);
  assert.match(script, /handle=normalizeIdentityName\(profile\?\.handle\)[\s\S]{0,700}\|\|!handle\|\|!name\|\|!avatar\|\|!arch/);
  assert.doesNotMatch(script, /\[A-Za-z0-9\]\{2,31\}_\[0-9\]/);
  assert.match(script, /\$\('#careerFollowersText'\)\.textContent=fmt\(state\.fans\)/);
});

test('identity names share substantial CapitalCase color and descriptor pools', () => {
  const pools = stringsData.fighterIdentity;
  assert.equal(pools.colors.length, 48);
  assert.equal(pools.origins.length, 34);
  assert.equal(pools.weather.length, 29);
  assert.equal(pools.animals.length, 37);
  assert.equal(pools.combat.length, 37);
  assert.ok(pools.colors.includes('Obsidian'));
  assert.ok(pools.colors.includes('Chrome'));
  assert.ok(pools.colors.includes('Turbo'));
  assert.ok(pools.colors.includes('Rebel'));
  assert.ok(pools.origins.includes('American'));
  assert.ok(pools.origins.includes('Mexican'));
  assert.ok(pools.origins.includes('Russian'));
  assert.ok(pools.origins.includes('Georgian'));
  assert.ok(pools.origins.includes('Samoan'));
  assert.ok(pools.weather.includes('Wind'));
  assert.ok(pools.weather.includes('Pressure'));
  assert.ok(pools.weather.includes('Aftershock'));
  assert.ok(pools.animals.includes('Hyena'));
  assert.ok(pools.animals.includes('Phoenix'));
  assert.ok(pools.animals.includes('Dragon'));
  assert.ok(pools.combat.includes('Hammer'));
  assert.ok(pools.combat.includes('Bomber'));
  assert.ok(pools.combat.includes('Fist'));
  assert.ok(pools.combat.includes('Claw'));
  assert.ok(pools.combat.includes('Monster'));
  assert.ok(pools.combat.includes('Demon'));
  assert.ok(pools.combat.includes('Devil'));
  assert.ok(pools.combat.includes('Destroyer'));
  assert.ok(pools.combat.includes('Assassin'));
  assert.ok(pools.combat.includes('Warpath'));
  assert.ok(!pools.weather.includes('Gale'));
  assert.deepEqual(
    JSON.parse(JSON.stringify(pools.cityCodes)),
    {phoenix:'PHX','los-angeles':'LAX',chicago:'CHI','new-york':'NYC',miami:'MIA',houston:'HOU',cleveland:'CLE',seattle:'SEA','new-orleans':'NOLA',hawaii:'HNL',boston:'BOS',atlanta:'ATL','san-francisco':'SFO',denver:'DEN','tampa-bay':'TPA',philadelphia:'PHL','san-antonio':'SAT','las-vegas':'LAS',portland:'PDX',baltimore:'BWI'}
  );
  const openers = [...pools.colors, ...pools.origins];
  const descriptors = [...pools.weather, ...pools.animals, ...pools.combat];
  assert.equal(openers.reduce((total, opener) => total + descriptors.filter(descriptor => descriptor !== opener).length, 0), 8443);
  assert.match(logic, /second\.filter\(word=>word!==opener\)/);
  assert.match(script, /LOGIC\.buildFighterIdentity\(pools\.openers\[0\]\|\|'White',pools\.descriptors\[0\]\|\|'Drizzle',pools\.cityCode\|\|'PHX'\)/);
  assert.match(script, /return names\.slice\(0,300\)/);
  assert.match(script, /identityShufflePending=true[\s\S]*classList\.add\('shuffling'\)[\s\S]*setTimeout\([\s\S]*classList\.remove\('shuffling'\)/);
  assert.match(css, /#newFighterNameBtn\.shuffling \.name-shuffle-icon\{animation:nameShuffleSpin/);
});

test('retirement is warned, reported, and clears only Cage Grind career saves', () => {
  assert.match(page, /id="retireCareerBtn"[^>]*>RETIRE FIGHTER<\/button>/);
  assert.match(page, /id="retireCareerModal"[^>]*aria-hidden="true"/);
  assert.match(page, /THIS CANNOT BE UNDONE/);
  assert.match(script, /await SHARED_FEED\.retireProfile\(\)/);
  assert.match(script, /if\(!LOGIC\.shouldPersistCareer\(retirementPending,careerSaveKnown,current\)\)return/);
  assert.match(script, /window\.removeEventListener\('beforeunload',saveState\)/);
  assert.match(script, /LOGIC\.clearCareerStorage\(localStorage,\[SAVE_KEY,SAVE_BACKUP_KEY,'fytr-save-v1'\]\)/);
  assert.doesNotMatch(script, /localStorage\.clear\(/);
  assert.match(cageIdentityMigration, /'cagereporter','reporter',[\s\S]*has officially retired from competition/i);
  assert.match(cageIdentityMigration, /update public\.cage_name_registry\s+set retired_at=now\(\)/i);
  assert.match(readme, /newly claimed fighter starts\s+with fresh title-shot eligibility/i);
});

test('career opponent roster uses proportional two-across collectible fighter cards', () => {
  assert.match(html, /\.opponent-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(html, /\.opponent\{[^}]*aspect-ratio:2\/3/);
  assert.match(html, /\.opp-sprite\{[^}]*width:100%;height:100%;object-fit:contain;object-position:center bottom/);
  assert.match(html, /\.opp-face\{[^}]*color-mix\(in srgb,var\(--fighter-accent\) 32%,#314354\)/);
  assert.match(html, /\.opp-sprite\{[^}]*filter:invert\(\.1\)[^}]*drop-shadow/);
  assert.match(html, /\.opponent-card \.tape-card-portrait\{background:radial-gradient\(ellipse at 50% 42%,#ffad9d/);
  assert.match(script, /const fighterSilhouettes=Array\.from\(\{length:24\},\(_,i\)=>`assets\/silhouettes\/fighter-silhouette-\$\{i\+1\}\.png`\)/);
  assert.match(script, /function silhouetteForOpponent\(o\)/);
  assert.match(script, /<img class="opp-sprite" src="\$\{silhouette\}"/);
  assert.match(script, /\$\('#tapeOppSprite'\)\.src=silhouetteForOpponent\(f\.o\)/);
  assert.doesNotMatch(gameScript, /const silhouetteSheet\s*=/);
  assert.doesNotMatch(script, /background-image:url\(\$\{silhouetteSheet\}\)/);
  assert.match(html, />Opponents </);
  assert.doesNotMatch(html, /The Living Roster/);
  assert.match(script, /<article class="opponent \$\{status\} \$\{o\.network\?'network':''\} \$\{o\.portraitAsset\?'portrait':''\} \$\{rivalFight\?'rematch':''\} \$\{dailyExhausted\?'daily-exhausted':''\}"\$\{o\.network\?` style="--hometown-accent:\$\{fighterAccent\(o\.networkCity\)\};\$\{fighterPortraitStyle\(o\.networkHandle\)\}"`:''\} data-card-flip="true"/);
  assert.match(html, /\.opponent-flip\{[^}]*transform-style:preserve-3d/);
  assert.match(html, /\.opponent\.flipped \.opponent-flip\{transform:rotateY\(180deg\)\}/);
  assert.match(script, /class="opponent-side opponent-front"/);
  assert.match(script, /class="opponent-side opponent-back"/);
  assert.match(script, /class="opp-identity"/);
  assert.match(script, /class="opp-identity">LVL \$\{o\.tier\}<i>•<\/i><b>\$\{safeStyle\}<\/b>/);
  assert.doesNotMatch(script, /class="opp-identity">\$\{o\.network\?`@/);
  assert.match(script, /class="opp-back-kicker">FIGHTER DETAILS/);
  assert.match(script, /<dl class="opp-back-info">/);
  assert.match(script, /<dt>REGION<\/dt>/);
  assert.match(script, /<dt>PURSE<\/dt>/);
  assert.match(script, /<dt>MATCHUP<\/dt>/);
  assert.doesNotMatch(script, /RANKED · LVL/);
  assert.doesNotMatch(script, /<span class="sil-label">RANKED ·/);
  assert.doesNotMatch(script.match(/function renderOpponents\(\)[\s\S]*?function toggleOpponentCard/)?.[0]||'', /TAP FOR DETAILS/);
  assert.match(script, /TAP CARD TO RETURN/);
  assert.match(script, /function toggleOpponentCard\(card\)/);
  assert.match(script, /front\.setAttribute\('aria-hidden',String\(flipped\)\)/);
  assert.match(script, /button\.tabIndex=flipped\?-1:0/);
  assert.match(script, /flip&&!e\.target\.closest\('button'\)/);
  assert.match(script, /e\.target\.matches\('\[data-card-flip\]'\)/);
  assert.match(script, /:'VIEW MATCHUP'/);
  assert.doesNotMatch(script, /data-roster-section|data-roster-toggle|rosterToggle|toggleRosterGroup|openRosterGroups/);
  assert.match(script, /active=state\.roster\.filter\(o=>o\.tier===state\.level&&!o\.network&&\(o\.lossesToPlayer\|\|0\)===0\)/);
  assert.match(script, /for\(let i=active;i<4;i\+\+\)state\.roster\.push\(generateOpponent\(state\.level\)\)/);
  assert.match(script, /opponents=state\.roster\.filter/);
  assert.match(script, /function fighterLevelOrder\(a,b\)\{return b\.tier-a\.tier/);
  assert.match(script, /filter==='recommended'\?opponents\.filter\(o=>o\.tier===state\.level\):filter==='ranked'\?opponents\.filter\(o=>o\.network\)/);
  assert.match(readme, /four\s+locally generated contenders in \*\*Recommended\*\*/);
  assert.match(readme, /\*\*Ranked\*\* filter shows\s+the complete real-fighter ladder from highest level to lowest/);
  assert.match(script, /if\(o\.globalChampionship\)settleChampionshipResult\(\)/);
  assert.match(script, /<div class="opponent-grid career-opponent-grid">\$\{visibleOpponents\.map\(renderCard\)\.join\(''\)\}<\/div>/);
});

test('career fights use a reversible tale-of-the-tape preview before locker-room planning', () => {
  assert.match(html, /id="tapePurse"/);
  assert.match(html, /class="tape-fighter-card player-card"/);
  assert.match(html, /class="tape-fighter-card opponent-card"/);
  assert.match(html, /id="tapePurseToggle"[^>]*aria-controls="tapeBreakdown"/);
  assert.match(html, /id="tapePurse">\$0<\/strong><small class="tape-purse-hint">TAP FOR BREAKDOWN/);
  assert.match(html, /id="tapeBreakdown" hidden/);
  assert.match(html, /role="dialog" aria-modal="true"/);
  assert.match(html, /class="tape-energy" id="tapeEnergy">ABOVE 0% REQUIRED · UP TO ONE CELL USED/);
  assert.match(html, /YOUR LOCKER-ROOM PLAN CONTROLS THE ENTIRE FIGHT/);
  assert.match(html, /id="tapeBackBtn"[^>]*>GO BACK</);
  assert.match(html, /id="tapeFightBtn"[^>]*>SET FIGHT PLAN<\/button>/);
  assert.match(html, /id="tapeRecoveryBtn"[^>]*hidden><b>VISIT RECOVERY ROOM<\/b><small>FREE REST · 10 SECONDS · \+25% ENERGY<\/small>/);
  assert.match(script, /needsEnergy=fightsLeft>0&&!hasActionEnergy\(\)/);
  assert.match(script, /0% ENERGY · VISIT THE RECOVERY ROOM TO REST BEFORE FIGHTING/);
  assert.match(script, /function visitRecoveryRoom\(\)\{closeFightPreview\(true\);navTo\('train'\);requestAnimationFrame/);
  assert.match(script, /\$\('#tapeRecoveryBtn'\)\.addEventListener\('click',visitRecoveryRoom\)/);
  assert.match(css, /\.tape-recovery-btn\{[^}]*background:linear-gradient\(#d84d40,#7b1718\)/);
  assert.match(css, /\.tape-clearance\.recovery-needed\{[^}]*background:#3b0c0dcc/);
  assert.match(html, /id="tapeTitleBout" hidden>[\s\S]*WORLD CHAMPIONSHIP BOUT/);
  assert.match(html, /id="tapeTitleBout" hidden>[\s\S]*data-icon-name="title-world"/);
  assert.match(html, /id="tapeAttributes" aria-label="Fighter attribute comparison"/);
  assert.match(script, /WORLD CHAMPIONSHIP BOUT · 3 ROUNDS/);
  assert.match(script, /function renderTapeAttributes\(f\)/);
  assert.match(script, /classList\.toggle\('advantage',playerAdvantage\)/);
  assert.match(css, /\.tape-attribute-meter\.advantage i\{[^}]*#23a75e/);
  assert.match(html, /class="tape-attribute-meter opponent-meter"/);
  assert.doesNotMatch(html, /class="tape-attribute-meter opponent"/);
  assert.match(css, /#tapeStage\{[^}]*overflow-y:auto;[^}]*overscroll-behavior:contain/);
  assert.match(css, /\.tape-card\{flex:0 0 auto;/);
  assert.match(script, /function openTaleOfTape\(o\)/);
  assert.match(script, /function closeFightPreview\(\)/);
  assert.match(script, /function commitFight\(o=fight\?\.o\)/);
  const preview = script.match(/function openTaleOfTape\(o\)\{([\s\S]*?)\n\s*\}/)?.[1] || '';
  assert.doesNotMatch(preview, /spendEnergy|pendingFight/);
  assert.match(html, /id="planStage"/);
  assert.match(html, /id="fightPlanSummary"/);
  assert.match(html, /id="fightPlanConfirm"[^>]*>LOCK IN FIGHT PLAN/);
  assert.doesNotMatch(html, /data-opening-approach/);
  assert.match(html, /id="tapeOppTag">UNKNOWN STYLE/);
  assert.match(script, /\$\('#tapeOppTag'\)\.textContent=titleBout&&!playerIsChampion\?'REIGNING WORLD CHAMPION':f\.o\.tag\|\|'UNKNOWN STYLE'/);
  assert.doesNotMatch(script, /\$\{rivalry\?'🔥 RIVAL · ':''\}\$\{o\.tag\}/);
  assert.doesNotMatch(script, /\$\{o\.tag\} · PRO \$\{o\.wins\}-\$\{o\.losses\}/);
  assert.match(script, /function beginFightPlan\(\)/);
  assert.match(script, /function confirmFightPlan\(\)/);
  assert.match(script, /beginFightPlan\(\)/);
  assert.match(css, /\.live-card\{[^}]*background-image:url\("\.\.\/assets\/cage-grind-octagon-transparent\.png\?v=2\.5\.223"\)[^}]*background-position:center 62%/);
  assert.match(css, /\.live-card\.decision-active\{[^}]*background-image:linear-gradient\(#030914f6,#030914f6\),url\("\.\.\/assets\/cage-grind-octagon-transparent\.png\?v=2\.5\.223"\)[^}]*background-position:center,center 62%/);
  assert.match(css, /\.action-feed\{[^}]*background:#030914e0/);
  assert.doesNotMatch(css, /\.card,\.tape-card,\.live-card,\.result-card\{[^}]*background:/);
  assert.match(css, /\.card,\.tape-card,\.result-card\{[^}]*background:linear-gradient\(160deg,#101b2b,#05080e 76%\)\}\.live-card\{border-color:#233d61\}/);
  assert.match(css, /\.fight-plan-locker-room\{/);
  assert.match(css, /\.fight-plan-toggle button\[aria-pressed="true"\]/);
  assert.doesNotMatch(html, /id="skipBtn"/);
  assert.doesNotMatch(script, /function skipFight\(\)/);
  assert.doesNotMatch(script, /fight\.rounds\.length<3\)simulateRound/);
});

test('fight launch remembers the last locked pace, offense, and tactics plan', () => {
  assert.doesNotMatch(page, /data-fight-mode-toggle|10% COACH/);
  assert.match(page, /data-plan-setting="pace" data-plan-value="slow"/);
  assert.match(page, /data-plan-setting="pace" data-plan-value="fast"/);
  assert.match(page, /data-plan-setting="offense" data-plan-value="conservative"/);
  assert.match(page, /data-plan-setting="offense" data-plan-value="aggressive"/);
  assert.match(page, /data-plan-setting="tactics" data-plan-value="stick"/);
  assert.match(page, /data-plan-setting="tactics" data-plan-value="adapt"/);
  assert.match(script, /<span class="opp-identity">LVL \$\{o\.tier\}<i>•<\/i><b>\$\{safeStyle\}<\/b><\/span>/);
  assert.match(script, /OPPONENT STYLE · \$\{escapeHtml\(fight\.o\.tag\|\|'UNKNOWN STYLE'\)\}/);
  assert.match(page, /id="liveOppStyle">UNKNOWN STYLE/);
  assert.match(script, /\$\('#liveOppStyle'\)\.textContent=fight\.o\.tag\|\|'UNKNOWN STYLE'/);
  assert.match(script, /tendencyRevealed:true/);
  assert.match(script, /function openTapeBreakdown\(\)/);
  assert.match(script, /function closeTapeBreakdown\(restoreFocus=true\)/);
  assert.match(css, /\.tape-fighter-card\{aspect-ratio:4\/5\}/);
  assert.match(css, /\.tape-breakdown-sheet\{/);
  assert.doesNotMatch(`${page}\n${script}`, /FIGHT WITH COACH|START QUICK SIM|coach_cut:coachCut|COACH SHARE/);
  assert.match(script, /fightPlanPreference:\{pace:'slow',offense:'conservative',tactics:'stick'\}/);
  assert.match(script, /s\.fightPlanPreference=\{pace:/);
  assert.match(fightPlanScript, /getState\(\)\.fightPlanPreference=Object\.assign\(\{\},fight\.gamePlan\);saveState\(\)/);
  assert.match(fightPlanScript, /fight\.gamePlan=Object\.assign\(\{\},getState\(\)\.fightPlanPreference\)/);
  assert.match(script, /function beginPlannedFight\(\)/);
  assert.match(script, /fight\.timeline=fight\.timeline\.filter\(item=>item\.type!=='fightMoment'&&item\.type!=='lastChance'\)/);
  assert.match(script, /fight_mode:'planned'/);
  assert.match(script, /plan_pace:fight\.gamePlan\.pace/);
  assert.match(script, /plan_offense:fight\.gamePlan\.offense/);
  assert.match(script, /plan_tactics:fight\.gamePlan\.tactics/);
});

test('booked fights resolve a 50-50 locker-room Focus encounter after planning', () => {
  const focusContacts = contentContext.CAGE_STRINGS.fightFocus.contacts;
  assert.deepEqual(Array.from(focusContacts, contact => contact.id), ['mom', 'wife', 'brother-tommy', 'agent-carl', 'grandma']);
  for (const contact of focusContacts) {
    assert.ok(contact.avatar && contact.ignoreDelta < 0 && contact.ignoreText);
  }
  const expectedFocusBalance = {mom:[8,8],wife:[8,8],'brother-tommy':[5,5],'agent-carl':[2,2],grandma:[2,2]};
  for (const contact of focusContacts) {
    const positive=contact.messages.filter(message => message.delta > 0 || message.focus >= 95 || message.minimum >= 95).length;
    const negative=contact.messages.filter(message => message.delta < 0 || message.focus <= 50).length;
    assert.deepEqual([positive,negative],expectedFocusBalance[contact.id]);
  }
  const focusMessages = focusContacts.flatMap(contact => Array.from(contact.messages));
  assert.equal(new Set(Array.from(focusMessages, message => message.id)).size, 50);
  assert.ok(fs.existsSync('assets/contact-mom.jpg'));
  assert.ok(fs.existsSync('assets/contact-wife.jpg'));
  assert.ok(fs.existsSync('assets/contact-brother-tommy.png'));
  assert.ok(fs.existsSync('assets/contact-agent-carl.png'));
  assert.ok(fs.existsSync('assets/contact-grandma.jpg'));
  const grandma=focusContacts.find(contact=>contact.id==='grandma');
  assert.match(grandma.messages[0].text, /Grandpa saw you on TV/);
  assert.match(grandma.messages[0].text, /can’t find the remote/);
  assert.match(page, /id="focusStage"/);
  assert.doesNotMatch(page, /focusMeterFill|focusTier|focus-hud|focus-meter/);
  assert.match(page, /id="liveFocusText"/);
  assert.match(script, /fight\.focusBase=rint\(fightRule\('focus\.startingMinimum',75\),fightRule\('focus\.startingMaximum',90\)\)/);
  assert.match(script, /quiet=Math\.random\(\)<\.5/);
  assert.match(fightFocusScript, /function messages\(\)/);
  assert.match(fightFocusScript, /function draw\(all\)/);
  assert.match(script, /state\.focusTextDeck=deck/);
  assert.match(script, /state\.lastFocusTextId=id/);
  assert.match(fightFocusScript, /message:draw\(all\)/);
  assert.match(script, /data-focus-choice="read"/);
  assert.match(script, /data-focus-choice="ignore"/);
  assert.match(script, /class="focus-choice safe" data-focus-choice="read"/);
  assert.match(script, /class="focus-choice risk" data-focus-choice="ignore"/);
  assert.match(script, /class="focus-kicker">TEXT FROM \$\{contact\.name\}<\/span><h2>INCOMING TEXT<\/h2>/);
  assert.match(script, /choice==='read'\?'MESSAGE OPENED':'MESSAGE LEFT UNREAD'/);
  assert.match(script, /<span class="focus-kicker">LOCKER ROOM · FINAL PREPARATION<\/span><h2>\$\{resultTitle\}<\/h2>/);
  assert.match(script, /class="focus-option-hint">Open the message/);
  assert.match(script, /class="focus-option-hint">Leave it unread/);
  assert.match(script, /data-focus-choice="music"/);
  assert.match(script, /Math\.random\(\)<fightRule\('focus\.musicPerfectFocusProbability',\.2\)/);
  assert.match(script, /fight\.focus\+=rint\(fightRule\('focus\.musicMinimumGain',4\),fightRule\('focus\.musicMaximumGain',10\)\)/);
  assert.match(script, /fight\.focus=Math\.max\(fight\.focus,fightRule\('focus\.meditationMinimumFocus',92\)\)/);
  assert.match(script, /fight\.focus=clamp\(Math\.round\(fight\.focus\),fightRule\('focus\.absoluteMinimum',50\),fightRule\('focus\.absoluteMaximum',100\)\)/);
  assert.match(script, /function fightFocusModifier\(sim=fight\)/);
  assert.match(script, /chance\+=edge\*\.72\+focusMod/);
  assert.match(script, /fightFocusModifier\(fight\)/);
  assert.match(gameScript, /beginFocus:\(\)=>fightFocusFeature\.begin\(\)/);
  assert.match(script, /showFightStage\('liveStage'\).*beginPlannedFight\(\)/);
  assert.match(page, /FINAL MOMENTS BEFORE THE WALKOUT · FOCUS <b id="focusValue">82%<\/b>/);
  assert.doesNotMatch(page, /FIGHT-ONLY STAT/);
  assert.match(page, /id="focusStage"[\s\S]*class="fight-plan-locker-room"[\s\S]*class="fight-plan-locker-art" src="assets\/focus-locker-room\.jpg\?v=2\.5\.223"/);
  assert.match(page, /<span>LOCKER ROOM<\/span>/);
  assert.match(page, /class="fight-plan-card focus-encounter" id="focusEncounter"/);
  assert.match(script, /box\.className='fight-plan-card focus-encounter'/);
  assert.match(css, /\.focus-locker-label small b\{color:#8edcff\}/);
  assert.match(css, /\.focus-choice\.risk\{[^}]*#ff766d[^}]*#d84d46/);
  assert.match(css, /\.focus-choice\.safe\{[^}]*#69d8ff[^}]*#268ed8/);
  assert.match(css, /\.focus-phone,\.focus-thread\{/);
  assert.match(css, /\.focus-text-bubble\{/);
  assert.match(css, /\.focus-contact img\{width:48px;height:48px;flex:0 0 48px/);
  assert.match(css, /\.focus-text-bubble\{[^}]*font-size:14px/);
  assert.match(fightFocusScript, /resultCopy=encounter\.type==='text'&&choice==='read'\?/);
  assert.match(fightFocusScript, /class="focus-thread focus-opened-thread"[\s\S]*class="focus-contact"[\s\S]*src="\$\{contact\.avatar\}"[\s\S]*class="focus-text-bubble">\$\{text\}/);
  assert.match(css, /\.focus-opened-thread\{[^}]*border-color:#3d607c/);
  assert.match(css, /\.focus-option \.focus-choice\{[^}]*width:100%;[^}]*min-height:43px/);
  assert.match(css, /\.focus-option-hint\{[^}]*color:#8795a2/);
  assert.match(script, /class="focus-result-description">\$\{text\}<\/p>/);
  assert.match(script, /class="focus-result-tier">\$\{focusTier\(fight\.focus\)\}<\/strong>/);
  assert.match(script, /class="focus-final-score"><b>\$\{fight\.focus\}% FOCUS<\/b>/);
  assert.match(script, /class="focus-delta \$\{delta<0\?'loss':delta===0\?'steady':''\}">\$\{deltaText\}<\/span>/);
  assert.doesNotMatch(script, /\$\{before\}% → \$\{fight\.focus\}%/);
  assert.match(css, /\.focus-result-tier\{[^}]*font-size:21px[^}]*letter-spacing:2px/);
  assert.match(css, /\.focus-final-score>b\{[^}]*font-size:34px[^}]*text-shadow:0 0 13px #58d8e85c/);
  assert.match(css, /\.focus-delta\{[^}]*border-radius:999px[^}]*color:#73dda8/);
  assert.match(serviceWorker, /\.\/assets\/focus-locker-room\.jpg\?v=2\.5\.223/);
  assert.match(serviceWorker, /\.\/assets\/contact-mom\.jpg\?v=2\.5\.223/);
  assert.match(serviceWorker, /\.\/assets\/contact-wife\.jpg\?v=2\.5\.223/);
  assert.match(serviceWorker, /\.\/assets\/contact-brother-tommy\.png\?v=2\.5\.223/);
  assert.match(serviceWorker, /\.\/assets\/contact-agent-carl\.png\?v=2\.5\.223/);
  assert.match(serviceWorker, /\.\/assets\/contact-grandma\.jpg\?v=2\.5\.223/);
  assert.match(readme, /fight-only \*\*Focus\*\* rating from 75–90%/);
});

test('gear collection shows owned quantities and rarity above icons', () => {
  assert.match(script, /owned=gearItems\.filter\(g=>gearCount\(g\.id\)>0\)/);
  assert.match(html, /\.gear\.collectible-card\{aspect-ratio:5\/7/);
  assert.match(html, /\.gear-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(script, /rarity-card-\$\{rarity\.toLowerCase\(\)\}/);
  assert.match(script, /<div class="gear-hero"><span class="gear-flair"><\/span><span class="equip-burst"><\/span><div class="gear-icon">/);
  assert.match(html, /\.collectible-card \.gear-icon\{width:92%[^}]*background:transparent[^}]*font-size:clamp\(52px,17vw,82px\)/);
  for (const rarity of ['common', 'rare', 'epic', 'legendary']) assert.match(html, new RegExp(`\\.rarity-${rarity}\\{`));
});

test('the landing page preserves Cage Grind history without treating the old game as a technical blueprint', () => {
  assert.equal((originsPage.match(/<h1\b/g) || []).length, 1, 'the origins document should expose one primary heading');
  assert.match(originsPage, /CageWars\.net was renamed OnlineCageFighting\.com in 2010/);
  assert.match(originsPage, /HISTORICAL MECHANICS/);
  assert.match(originsPage, /CURRENT CAGE GRIND SYSTEMS/);
  assert.match(originsPage, /product history—not the original PHP source or a specification for rebuilding it/);
  assert.match(originsPage, /COMMERCIAL MILESTONE · AUGUST 2009/);
  assert.match(originsPage, /CageWars earned its only paid product placement when AdapTx Labs paid \$150/);
  assert.match(originsPage, /THE LINEAGE, NOT THE BLUEPRINT/);
  assert.match(originsPage, /BUILD A FIGHTER\. LIVE THE CAREER\./);
  assert.match(originsPage, /https:\/\/web\.archive\.org\/web\/20111007174242\/http:\/\/www\.cagewars\.net\//);
  assert.match(fs.readFileSync('sitemap.xml', 'utf8'), /<loc>https:\/\/cagegrind\.com\/origins\.html<\/loc>/);
  assert.match(originsPage, /css\/origins\.css\?v=2\.5\.223/);
  assert.match(originsCss, /\.lineage-grid\{display:grid;grid-template-columns:1fr 1fr/);
  assert.match(originsCss, /body\{[^}]*overflow-x:hidden/);
  assert.match(originsCss, /h2\{[^}]*overflow-wrap:anywhere/);
  assert.match(originsCss, /\.origin-story>\*\{min-width:0\}/);
  assert.match(originsCss, /width:min\(calc\(100% - 28px\),1120px\)/);
  for (const asset of [
    'assets/origins/cagewars-dashboard.jpg',
    'assets/origins/cagewars-fighter-profile.jpg',
    'assets/origins/cagewars-store.jpg',
    'assets/origins/online-cage-fighting-logo.png'
  ]) {
    assert.match(originsPage, new RegExp(asset.replaceAll('/', '\\/').replaceAll('.', '\\.')));
    assert.ok(fs.statSync(asset).size > 1000, `${asset} should contain a recovered archive image`);
    assert.match(serviceWorker, new RegExp(`'\\./${asset.replaceAll('/', '\\/').replaceAll('.', '\\.')}'`));
  }
  assert.match(serviceWorker, /'\.\/origins\.html'/);
  assert.match(serviceWorker, /'\.\/css\/origins\.css\?v=2\.5\.223'/);
});

test('collectible cards flip to optional sponsored details without empty QR space', () => {
  assert.match(script, /function collectibleBackHtml\(item,rarity\)/);
  assert.match(script, /qr=item\.qrAsset\?/);
  assert.match(script, /class="collectible-qr"/);
  assert.match(script, /data-collectible-flip data-collectible-id=/);
  assert.match(script, /function toggleCollectibleCard\(card\)/);
  assert.match(script, /collectible_details_viewed/);
  assert.match(script, /collectibleFlip&&!e\.target\.closest\('button'\)/);
  assert.match(script, /e\.target\.matches\('\[data-collectible-flip\]'\)/);
  assert.match(css, /\.gear\.collectible-card\.flipped \.collectible-flip\{[^}]*rotateY\(180deg\)/);
  assert.match(css, /\.collectible-back\{[^}]*rotateY\(180deg\)/);
  assert.match(css, /\.collectible-qr img\{[^}]*width:84px/);
  assert.match(css, /\.gear\.collectible-card \.collectible-back-copy>p\{[^}]*font-size:11px/);
  const gearCatalog = definitionsScript.match(/const gearItems = \[([\s\S]*?)\n\];/)?.[1] || '';
  assert.match(gearCatalog, /id:'fight-fuel-protein'.*sponsored:true.*brand:'ALLMAX ISOFLEX'.*sponsorDisclosure:'.*Affiliate.*'.*qrAsset:'assets\/icons\/fight-fuel-protein-qr\.png\?v=/i);
  assert.equal((gearCatalog.match(/sponsored:true/g)||[]).length, 1);
  assert.doesNotMatch(gearCatalog, /https?:\/\//);
});

test('permanent identity onboarding gates the career and removes completed selectors', () => {
  const homeStart = html.indexOf('<section class="screen active" data-screen="home">');
  const trainStart = html.indexOf('<section class="screen" data-screen="train">');
  for (const id of ['fighterBuilderIntro', 'careerIdentityCard', 'citySetup', 'fighterSetup', 'archetypeSetup', 'fighterNameSetup', 'careerGameContent']) {
    const position = html.indexOf(`id="${id}"`);
    assert.ok(position > homeStart && position < trainStart, `${id} should be on the Home screen`);
  }
  assert.match(html, /#app\.career-setup #careerGameContent,#app\.career-setup \.career-after-setup\{display:none\}/);
  assert.match(html, /id="fighterBuilderIntro"[\s\S]*Build Your Fighter[\s\S]*NO ACTIVE FIGHTER FOUND/);
  assert.match(html, /class="card build-card career-after-setup" id="careerIdentityCard"/);
  assert.match(html, /id="builderProgressTrack"[^>]*role="progressbar"[^>]*aria-valuenow="0"/);
  assert.match(html, /\.builder-progress-track i\{[^}]*transition:width \.35s ease/);
  assert.match(html, /class="resource-hud"[^>]*hidden/);
  assert.match(html, /class="bottomnav"[^>]*hidden/);
  assert.match(html, /\.resource-hud\[hidden\],\.bottomnav\[hidden\]\{display:none\}/);
  assert.match(script, /\$\('\.resource-hud'\)\.hidden=!ready;\$\('\.bottomnav'\)\.hidden=!ready/);
  assert.match(script, /\$\('#app'\)\.classList\.toggle\('career-setup',!ready\)/);
  assert.match(script, /completed=Number\(!!city\)\+Number\(!!avatar&&allocationValid\)\+Number\(!!style\)\+Number\(state\.nameLocked\),progress=completed\*25/);
  assert.match(script, /\$\('#fighterBuilderIntro'\)\.hidden=ready/);
  assert.match(script, /\$\('#builderProgressFill'\)\.style\.width=`\$\{progress\}%`/);
  assert.match(script, /\$\('#fighterSetup'\)\.hidden=!city\|\|!!avatar/);
  assert.match(script, /\$\('#archetypeSetup'\)\.hidden=!city\|\|!avatar\|\|!!style/);
  assert.match(script, /\$\('#fighterNameSetup'\)\.hidden=!coreReady\|\|state\.nameLocked/);
  assert.match(script, /\$\('#citySetup'\)\.hidden=!!city/);
  assert.match(script, /\$\('#buildChoices'\)\.innerHTML=style\?'':fighterStyles\.map/);
  assert.match(script, /\$\('#cityChoices'\)\.innerHTML=city\?'':fighterCities\.map/);
  assert.match(script, /function chooseAvatar\(id\)/);
  assert.match(script, /if\(!\(state\.fighterStyle&&state\.fighterCity&&state\.fighterAvatar&&validFighterAllocation\(state\.fighterBaseStats\)\)\)screen='home'/);
});

test('fighter avatar cards enforce a valid permanent 20-point allocation', () => {
  const avatarSource = script.match(/const fighterAvatars = (\[[\s\S]*?\n\s*\]);/)?.[1];
  assert.ok(avatarSource, 'fighter avatar definitions should be present');
  const avatars = new Function(`return ${avatarSource}`)();
  assert.equal(avatars.length, 44);
  assert.equal(new Set(avatars.map(avatar => avatar.asset)).size, 44);
  assert.equal(new Set(avatars.map(avatar => JSON.stringify(avatar.stats))).size, 44);
  for (const avatar of avatars) {
    const values = ['power', 'speed', 'chin', 'cardio'].map(key => avatar.stats[key]);
    assert.ok(values.every(value => Number.isInteger(value) && value >= 2 && value <= 8));
    assert.equal(values.reduce((sum, value) => sum + value, 0), 20);
    assert.ok(fs.existsSync(avatar.asset), `${avatar.asset} should exist`);
    assert.match(avatar.asset, /^assets\/avatars\/fighter-avatar-\d{2}\.png$/);
    const png = fs.readFileSync(avatar.asset);
    assert.equal(png.subarray(1, 4).toString(), 'PNG', `${avatar.asset} must be a PNG`);
    assert.equal(png[25], 6, `${avatar.asset} must retain an RGBA alpha channel`);
  }
  for (const avatar of avatars.slice(-4)) {
    const png = fs.readFileSync(avatar.asset);
    assert.ok(png.length < 1_000_000, `${avatar.asset} should remain compressed below 1 MB`);
    assert.equal(png.readUInt32BE(16), 768, `${avatar.asset} should be 768px wide`);
    assert.equal(png.readUInt32BE(20), 768, `${avatar.asset} should be 768px tall`);
  }
  assert.match(html, /\.avatar-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(html, /\.avatar-card\{[^}]*aspect-ratio:2\/3/);
  assert.match(css, /\.avatar-card img\{[^}]*background:radial-gradient/);
  assert.match(css, /\.avatar-card:hover,\.avatar-card:focus-visible\{/);
  assert.match(script, /function validFighterAllocation\(stats\)/);
  assert.match(script, /every\(k=>Number\.isInteger\(stats\[k\]\)&&stats\[k\]>=2&&stats\[k\]<=8\)/);
  assert.match(script, /===20/);
  assert.equal(fs.readdirSync('assets/avatars').filter(name => /^fighter-avatar-\d{2}\.png$/.test(name)).length, 44);
  assert.equal(fs.readdirSync('assets/avatars').filter(name => /^fighter-avatar-\d{2}\.jpe?g$/.test(name)).length, 0);
  const silhouetteAssets = fs.readdirSync('assets/silhouettes').filter(name => /^fighter-silhouette-\d+\.png$/.test(name));
  assert.equal(silhouetteAssets.length, 24);
  for (let index = 1; index <= 24; index += 1) {
    assert.ok(fs.existsSync(`assets/silhouettes/fighter-silhouette-${index}.png`), `fighter silhouette ${index} should exist`);
  }
  assert.equal(fs.readdirSync('assets').filter(name => /^grok_image_/i.test(name)).length, 0);
  assert.match(script, /<span class="avatar-total">SELECT<\/span>/);
  assert.doesNotMatch(script, /SELECT · 20 POINTS/);
});

test('home career guide teaches the four-step loop with compact artwork cards', () => {
  assert.ok(fs.existsSync('assets/home-fight.png'));
  assert.ok(fs.existsSync('assets/home-training.png'));
  assert.ok(fs.existsSync('assets/home-hustle.png'));
  assert.ok(fs.existsSync('assets/home-gear.png'));
  assert.match(html, /<section class="career-guide"[^>]*>[\s\S]*?<h2 id="careerGuideTitle">BUILD YOUR CAREER<\/h2>[\s\S]*?Train <i>•<\/i> Fight <i>•<\/i> Earn <i>•<\/i> Upgrade <i>•<\/i> Repeat/);
  assert.match(html, /<article class="choice training">[\s\S]*?class="choice-step">1<\/span><h3>TRAIN<\/h3>[\s\S]*?Spend energy to improve your stats\.[\s\S]*?src="assets\/home-training\.png"[\s\S]*?<button class="choice-action" data-go="train">HIT THE GYM<\/button><\/article>/);
  assert.match(html, /<article class="choice red">[\s\S]*?class="choice-step">2<\/span><h3>FIGHT<\/h3>[\s\S]*?Choose an opponent and earn cash, XP and rank\.[\s\S]*?src="assets\/home-fight\.png"[\s\S]*?<button class="choice-action" data-go="fight">TAKE A FIGHT<\/button><\/article>/);
  assert.match(html, /<article class="choice hustle">[\s\S]*?class="choice-step">3<\/span><h3>HUSTLE<\/h3>[\s\S]*?Earn money and gain fans between fights\.[\s\S]*?src="assets\/home-hustle\.png"[\s\S]*?<button class="choice-action" data-go="hustle">FIND WORK<\/button><\/article>/);
  assert.match(html, /<article class="choice legacy">[\s\S]*?class="choice-step">4<\/span><h3>GEAR UP<\/h3>[\s\S]*?Equip items and display your achievements\.[\s\S]*?src="assets\/home-gear\.png"[\s\S]*?<button class="choice-action" data-go="gear">VIEW GEAR<\/button><\/article>/);
  assert.doesNotMatch(html, /GUARANTEED GROWTH|BIG WIN POTENTIAL|FUND THE DREAM|BUILD YOUR LEGACY/);
  assert.match(html, /\.choice-grid\{display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr/);
  assert.ok(html.indexOf('data-go="train"') < html.indexOf('data-go="fight"'), 'Hit the Gym should be the first home choice');
  assert.doesNotMatch(html, /class="hero-cage"/);
  assert.doesNotMatch(css, /\.hero-cage/);
  assert.doesNotMatch(html, /<button class="choice(?:\s|")/);
  assert.doesNotMatch(html, /class="bigicon"/);
  assert.match(html, /\.choice-action\{[^}]*margin-top:auto/);
  assert.match(css, /--cta-text:#fff/);
  assert.match(css, /--cta-weight:950/);
  assert.match(css, /--button-primary:linear-gradient\(#49bfff,#1761b8\)/);
  assert.match(css, /--button-secondary:linear-gradient\(#3b4856,#18212b\)/);
  assert.match(css, /--button-special:linear-gradient\(#e8b83f,#955508\)/);
  assert.match(css, /\.choice-action\{[^}]*color:var\(--cta-text\)[^}]*font-weight:var\(--cta-weight\)/);
  assert.match(css, /\.install-offer button:not\(:disabled\),\.choice-action,\.feed-open,\.fight-btn:not\(:disabled\):not\(\.locked\),\.daily:not\(:disabled\),\.gear button:not\(:disabled\),\.tape-action\.fight:not\(:disabled\),\.continue-btn,\.level-up-continue,\.modal-run:not\(:disabled\),\.fighter-message-send:not\(:disabled\)\{[^}]*color:var\(--cta-text\)!important;[^}]*font-weight:var\(--cta-weight\)!important/);
  assert.match(css, /\.choice\.red \.choice-action,[^}]*\.choice\.legacy \.choice-action[^}]*background:var\(--button-primary\)/);
  assert.match(css, /\.opening-choice\.aggressive,\.opening-choice\.feel,[^}]*background:var\(--button-secondary\)!important/);
  assert.match(css, /\.daily:not\(:disabled\),\.fight-btn\.title:not\(:disabled\),\.fight-btn\.taunt:not\(:disabled\),\.level-up-continue\{[^}]*background:var\(--button-special\)/);
  assert.match(css, /\.gear\.collectible-card\.equipped \.gear-footer \.equip-btn\{[^}]*background:var\(--button-secondary\)!important/);
  assert.match(css, /\.install-offer button:disabled\{[^}]*color:#879bad;[^}]*text-shadow:none/);
  assert.match(html, /\.choice p\{[^}]*font-size:9px;line-height:1\.28/);
  assert.doesNotMatch(page, /<article class="choice gear">/, 'home card must not inherit collectible gear-card typography');
});

test('rendered icons support stable per-file image overrides with fallbacks', () => {
  assert.ok(fs.existsSync('assets/icons/README.md'));
  assert.match(script, /const ICON_ASSET_PATH = 'assets\/icons\/'/);
  assert.match(script, /const ICON_ASSET_VERSION = '2\.5\.223'/);
  assert.match(script, /function gameIcon\(name,fallback,extension='png'\)/);
  assert.match(script, /src="\$\{ICON_ASSET_PATH\}\$\{name\}\.\$\{extension\}\?v=\$\{ICON_ASSET_VERSION\}"/);
  assert.match(script, /classList\.add\('asset-ready'\)/);
  assert.match(script, /onerror="this\.remove\(\)"/);
  assert.match(script, /gameIcon\(a\.id,a\.icon\)/);
  assert.match(script, /gameIcon\(d\.id,d\.icon\)/);
  assert.match(script, /gameIcon\(item\.iconName\|\|item\.id,item\.icon,item\.assetExt\)/);
  assert.match(script, /items\.map\(g=>collectibleCardHtml\(g\)\)/);
  const catalog = fs.readFileSync('assets/icons/README.md', 'utf8');
  for (const name of ['nav-home', 'fight-aggressive', 'rematch', 'corner-towel', 'daily-collectible', 'title-world', 'heavy-bag-rounds', 'call-out-rival', 'tv-spot', 'titan-global', 'champ-gloves', 'ice-ring', 'home-gym', 'mansion']) {
    assert.match(catalog, new RegExp('`' + name + '\\.png`'));
  }
  assert.doesNotMatch(html, /data-icon-name="hud-(?:energy|health)"/);
  assert.doesNotMatch(catalog, /`hud-(?:energy|health)\.png`/);
});

test('home ticker teaches current mechanics in a shady promoter voice', () => {
  const homeStart = html.indexOf('<section class="screen active" data-screen="home">');
  const tickerPosition = html.indexOf('id="tickerText"');
  const identityPosition = html.indexOf('id="careerIdentityCard"');
  const dailyDropPosition = html.indexOf('class="card daily-drop-card');
  const heroPosition = html.indexOf('<div class="hero">', homeStart);
  assert.ok(tickerPosition > homeStart && tickerPosition < identityPosition && tickerPosition < heroPosition, 'ticker should lead the unlocked Home screen');
  assert.ok(dailyDropPosition > tickerPosition && dailyDropPosition < identityPosition, 'the prioritized Home drop should sit above Career Identity');
  assert.match(html, /class="daily-drop-pack" src="assets\/cage-grind-drop-pack\.png\?v=2\.5\.223"/);
  assert.match(html.slice(homeStart, identityPosition), /class="card career-after-setup"/);
  assert.ok(stringsData.ticker.some(line => /gym drills take a full battery cell.*sparring charges extra/i.test(line)));
  assert.ok(stringsData.ticker.some(line => /20 health before a bout/.test(line)));
  assert.match(script, /const tickerLines=STRINGS\.ticker/);
  const ticker = stringsData.ticker.join('\n');
  assert.match(ticker, /Old names pay half/);
  assert.match(ticker, /Taunt a past rival/);
  assert.match(ticker, /Fourth win without a collectible drop/);
  assert.match(ticker, /perk still only counts once/);
  assert.match(ticker, /\$250 plus \$75 per level/);
  assert.match(ticker, /Nobody mails you a belt/);
  assert.ok(stringsData.ticker.length >= 15, 'expected at least 15 rotating promoter tips');
  assert.doesNotMatch(ticker, /Rumor: the main event pays double under the table/);
});

test('archetype presentation uses clean text labels without decorative icons', () => {
  assert.match(script, /<b>\$\{s\.name\}<\/b>/);
  assert.match(script, /\$\('#homeStyleText'\)\.textContent=style\?style\.name:'NOT SELECTED'/);
  assert.match(script, /toast\(`\$\{style\.name\} IDENTITY LOCKED IN`/);
  assert.match(script, /class="corner-readline">\$\{readLabel\} · \$\{style\?\.name\|\|fight\.o\.tag\}/);
  assert.doesNotMatch(script, /\$\{(?:s|style|plan)\.icon\}/);
});

test('fighter attributes share the persistent condition HUD across game screens', () => {
  assert.match(html, /\.hud-attributes-row\{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(html, /<section class="resource-hud" aria-label="Current fighter condition and attributes" hidden>[\s\S]*class="hud-condition-row"[\s\S]*class="hud-attributes-row"/);
  assert.equal((html.match(/<section class="resource-hud"/g) || []).length, 1, 'the interface should contain one shared dashboard');
  const topbarStart = html.indexOf('<header class="topbar">');
  const hudStart = html.indexOf('<section class="resource-hud"');
  const mainStart = html.indexOf('<main class="main">');
  assert.ok(topbarStart >= 0 && topbarStart < hudStart, 'the identity row should scroll before the sticky dashboard');
  for (const id of ['powerStat', 'speedStat', 'chinStat', 'cardioStat']) {
    const position = html.indexOf(`id="${id}"`);
    assert.ok(position > hudStart && position < mainStart, `${id} should live in the persistent HUD`);
  }
  assert.match(html, /\.app-scroll\{[^}]*overflow-x:hidden[^}]*overflow-y:auto/);
  assert.match(html, /\.topbar\{\s*position:relative/);
  assert.match(html, /\.resource-hud\{\s*position:sticky;z-index:40;top:0/);
  assert.match(html, /\.resource-hud\.is-stuck\{box-shadow:0 4px 10px rgba\(0,0,0,\.38\),0 1px 0 rgba\(64,154,255,\.12\)\}/);
  assert.match(script, /new IntersectionObserver/);
  assert.match(script, /dashboard\.classList\.toggle\('is-stuck',!entry\.isIntersecting&&root\.scrollTop>0\)/);
  assert.match(script, /initStickyDashboard\(\)/);
  assert.doesNotMatch(script, /addEventListener\(['"]scroll['"]/);
  assert.match(html, /\.resource-hud\[hidden\],\.bottomnav\[hidden\]\{display:none\}/);
  assert.doesNotMatch(html, /homeAttributes|trainStatGrid/);
});

test('Energy uses four battery cells and turns red at twenty-five percent or empty', () => {
  assert.match(page, /class="energy-battery" id="energyBattery"[\s\S]*?<i class="charged"><\/i><i class="charged"><\/i><i class="charged"><\/i><i class="charged"><\/i>/);
  assert.match(script, /\$\('#energyHud'\)\.classList\.toggle\('critical',state\.energy<=ENERGY_SEGMENT\)/);
  assert.match(css, /\.hud-resource\.critical \.energy-battery i\.charged\{[^}]*#ff6973/);
  assert.match(css, /\.energy-hud\.critical \.energy-battery\{[^}]*border-color:#ff4c59[^}]*0 0 11px #ff3344a8/);
  assert.match(css, /\.energy-hud\.critical \.energy-battery::after\{[^}]*background:#ff4c59/);
  assert.match(logic, /if\(available<=0\|\|amount<=0\)return 0/);
  assert.match(logic, /if\(state\.energy<energyCost\)return \{ok:false,reason:'energy'/);
  assert.match(script, /state\.energy<=0\|\|hustleLeft<1/);
  assert.match(script, /energyLow=state\.energy<=0/);
  assert.match(script, /\$\('#autographRun'\)\.disabled=state\.energy<=0/);
});

test('fighter attributes always display as whole numbers', () => {
  assert.match(script, /const formatStat = value => Number\.isFinite\(Number\(value\)\)\?String\(Math\.round\(Number\(value\)\)\):'0'/);
  assert.match(script, /\$\('#'\+k\+'Stat'\)\.textContent=formatStat\(value\)/);
  assert.match(script, /Power \$\{formatStat\(a\.stats\.power\)\}/);
  assert.match(script, /<small>PWR<\/small><b>\$\{formatStat\(o\.power\)\}<\/b>/);
  assert.match(script, /playerValueEl\.textContent=formatStat\(playerValue\)/);
  assert.match(script, /\$\{formatStat\(f\.player\.power\)\}\/\$\{formatStat\(f\.player\.speed\)\}/);
  for (const id of ['powerStat', 'speedStat', 'chinStat', 'cardioStat']) {
    assert.match(html, new RegExp(`id="${id}">5<`));
  }
  for (const id of ['tapePPower', 'tapePSpeed', 'tapePChin', 'tapePCardio', 'tapeOPower', 'tapeOSpeed', 'tapeOChin', 'tapeOCardio']) {
    assert.match(html, new RegExp(`id="${id}">5<`));
  }
});

test('XP and Hype live in the top bar without a duplicate Home resource card', () => {
  const headerStart = html.indexOf('<header class="topbar">');
  const headerEnd = html.indexOf('</header>', headerStart);
  for (const id of ['xpText', 'hypeText']) {
    const position = html.indexOf(`id="${id}"`);
    assert.ok(position > headerStart && position < headerEnd, `${id} should live in the top bar`);
  }
  assert.match(html, /id="rankText"[^>]*>ROOKIE<\/span><\/div><div class="top-progress"><span>XP<\/span><b id="xpText"/);
  assert.match(html, /class="rank-chip"[\s\S]*id="cageStatus">ROOKIE<\/strong><small id="heroLevel">LVL 1<\/small>/);
  assert.doesNotMatch(html, /class="hero-social"|id="fansText"/);
  assert.doesNotMatch(html.slice(headerStart,headerEnd), /FOLLOWERS|FOLLOWING|fansText|followingText/);
  assert.doesNotMatch(html, /card bars|id="energyBar"|id="healthBar"|id="xpBar"|id="hypeBar"/);
  assert.doesNotMatch(script, /\$\('#(?:energy|health|xp|hype)Bar'\)/);
});

test('the active World Champion rank is gold in the top identity line', () => {
  assert.match(script, /rankText\.classList\.toggle\('world-champion',careerRank==='WORLD CHAMPION'\)/);
  assert.match(gameCss, /\.identity \.sub #rankText\.world-champion\{color:#ffd66e;font-weight:950/);
});

test('top-bar identity, money, XP, and Hype rows share matching alignment', () => {
  assert.match(css, /\.identity,\.money\{align-self:stretch;display:flex;flex-direction:column;justify-content:center\}/);
  assert.match(css, /\.identity \.sub\{[^}]*margin-top:2px/);
  assert.match(css, /\.money> b\{[^}]*font-size:13px/);
  assert.match(css, /\.rank-chip small\{[^}]*border-left:[^}]*font-size:8\.5px/);
  assert.match(css, /\.money\{margin-left:auto\}\.money>b\{font-size:18px\}/);
});

test('Cage Feed combines one-per-fight reports with dock-driven fighter interactions', () => {
  assert.doesNotMatch(html, /Latest Buzz|homeFeedPreview|homeFeedStatus/);
  assert.match(html, /data-screen="feed"/);
  assert.match(html, /id="socialTimeline"/);
  assert.match(html, /data-feed-filter="all"[\s\S]*data-feed-filter="mentions"[\s\S]*id="feedMentionCount"/);
  assert.match(html, /data-nav="feed"[\s\S]*data-icon-name="nav-feed"[\s\S]*id="feedNavBadge"/);
  assert.match(html, /class="card feed-page-card"[\s\S]*class="feed-page-note"[\s\S]*id="socialTimeline"/);
  assert.match(html, /\.feed-post p\{[^}]*font-size:10\.5px/);
  assert.match(html, /\.feed-post-head b\{[^}]*font-size:11px/);
  assert.match(html, /\.feed-post-head span\{[^}]*font-size:9\.5px/);
  assert.match(html, /\.feed-page-note\{[^}]*font-size:9\.5px/);
  assert.match(page, /class="feed-action-dock"[\s\S]*data-feed-intent="callout"[\s\S]*data-feed-intent="respect"/);
  assert.doesNotMatch(page, /data-feed-intent="(?:props|watching|welcome)"/);
  assert.match(page, /id="fighterPostModal"[\s\S]*id="fighterPostSearch"[\s\S]*id="fighterPostDraft"[\s\S]*id="fighterPostSend"/);
  assert.match(css, /\.modal-cancel,\.modal-run\{min-height:42px;border:1px solid transparent;border-radius:10px;padding:10px 12px;font-size:13px\}/);
  assert.match(html, /\.fighter-bio-dialog \.loadout-dialog-kicker\{font-size:9\.5px\}/);
  assert.match(html, /\.fighter-bio-dialog \.modal-run\{font-size:14px\}/);
  assert.doesNotMatch(page, /social-composer|socialActions|Make Your Post|feed-compose-head/);
  assert.match(html, /\.screen\[data-screen="feed"\]\.active\{display:flex/);
  assert.match(css, /\.screen\[data-screen="feed"\]\.active\{padding-bottom:8px\}/);
  assert.doesNotMatch(html, /class="feed-back"/);
  assert.match(script, /socialLastMentionSerial:0[\s\S]*socialLastRemoteMentionPostId:0/);
  assert.match(script, /function socialUnreadCount\(\)/);
  assert.match(script, /feedPostMentionsPlayer\(post\)[\s\S]*state\.socialLastMentionSerial/);
  assert.match(script, /currentScreen==='feed'&&feedFilter==='mentions'/);
  assert.match(script, /navBadge\.textContent=unread>99\?'99\+':String\(unread\)/);
  assert.match(script, /function feedPostMentionsPlayer\(post\)/);
  assert.match(script, /targetProfileId&&targetProfileId===state\.socialProfileId/);
  assert.match(script, /part\.slice\(1\)\.toLowerCase\(\)===ownHandle/);
  assert.match(script, /function renderFeedText\(post\)/);
  assert.match(script, /split\(\/\(@\[A-Za-z\]\[A-Za-z0-9_\]\{2,31\}\)\/g\)/);
  assert.match(script, /mentions=posts\.filter\(feedPostMentionsPlayer\)/);
  assert.match(script, /visiblePosts=feedFilter==='mentions'\?mentions:posts/);
  assert.match(script, /data-feed-filter/);
  assert.match(css, /\.feed-post\.mentioned-post\{[^}]*box-shadow:inset 3px 0 #e7a839/);
  assert.match(css, /\.feed-mention\.self\{[^}]*color:#ffc85f/);
  assert.match(css, /\.feed-page-card \.feed-list\{flex:1 1 auto;align-content:start;grid-auto-rows:max-content\}/);
  assert.match(css, /@media \(min-width:1100px\)\{\.screen\[data-screen="feed"\]\.active\{align-items:stretch\}[\s\S]*?\.feed-page-card\{width:100%;max-width:none/);
  assert.match(script, /requestAnimationFrame\(\(\)=>\$\('#socialTimeline'\)\.scrollTo\(\{top:0,behavior:'smooth'\}\)\)/);
  assert.match(script, /function createSocialAccount\(\)/);
  assert.match(strings, /Hello, fight fans! Stay tuned—the climb starts now/);
  assert.match(script, /trackEvent\('career_started',[^;]+;createSocialAccount\(\);saveState\(\)/);
  assert.match(strings, /contractSigning:\{profile:'media',text:'SIGNED: @\{name\} has put pen to paper on a Cage Grind contract\./);
  assert.match(script, /contractPosts=firstAccount\?copyPosts\(\[STRINGS\.social\.contractSigning\]/);
  assert.match(script, /queueSharedPosts\(contractPosts\.map\(post=>\(\{kind:'reporter',body:post\.text\}\)\)\)/);
  assert.match(script, /if\(!state\.socialAccountCreated\)return 0/);
  assert.match(script, /if\(screen==='feed'&&!ensureSocialFeed\(\)\)createSocialAccount\(\)/);
  assert.match(script, /\(Number\(s\.fans\)\|\|0\)>0/);
  assert.match(script, /function openSocialCycle\(type,data=\{\}\)/);
  assert.match(script, /socialHeadlineCounts:\{\}/);
  assert.match(script, /function drawSocialHeadline\(key,entries\)/);
  assert.match(script, /reporter-posts\|\$\{state\.socialProfileId\|\|state\.name\}\|\$\{key\}\|\$\{batch\}/);
  assert.match(script, /return deck\[count%deck\.length\]/);
  for (const key of ['fightWin','fightInjuredWin','fightLoss']) {
    assert.ok(stringsData.social.cycles[key].filter(entry=>entry.profile==='media').length>=3,`${key} should have a reporter headline deck`);
  }
  assert.ok(stringsData.social.cycles.fightStreakHeadline.length>=3);
  assert.match(script, /const key=data\.injury\?'fightInjuredWin':data\.winStreak>=2\?'fightStreak':'fightWin'/);
  assert.match(script, /injury:win\?currentTrainingInjury\(\)\?\.name\|\|'':''/);
  assert.match(strings, /FIGHTING HURT: \{name\} battled through a \{injury\}/);
  assert.match(script, /openSocialCycle\('fight'/);
  assert.doesNotMatch(script, /if\(!o\.network\)openSocialCycle\('fight'/);
  assert.match(script, /openSocialCycle\('fight',\{win,opponent:o\.name/);
  assert.doesNotMatch(script, /openSocialCycle\('appearance'|openSocialCycle\('autograph'|openSocialCycle\('sponsor'/);
  assert.match(page, /id="fighterBioInteractions"/);
  assert.match(script, /function fighterInteractionDraft\(kind,profile,offset=0\)/);
  assert.match(script, /function renderFighterPostResults\(\)/);
  assert.match(script, /function openFighterPostComposer\(kind\)/);
  assert.match(script, /sharedSocialInteractionsRemaining/);
  assert.match(script, /data-fighter-post-target/);
  assert.match(script, /function handleFighterInteraction\(choice,target\)/);
  assert.match(script, /loadInteractionAllowance\(\)/);
  assert.match(strings, /interactions:\s*\{/);
  for (const kind of ['CALL THEM OUT','SHOW RESPECT']) assert.match(strings, new RegExp(kind));
  assert.doesNotMatch(strings, /label:'(?:WELCOME THEM|GIVE THEM PROPS|PUT THEM ON NOTICE)'/);
  const interactionMessages=Object.values(stringsData.social.interactions).flatMap(definition=>definition.messages);
  assert.equal(interactionMessages.length,28);
  assert.match(script, /USE THE FEED ACTIONS TO POST TO THIS FIGHTER/);
  assert.doesNotMatch(script, /data-fighter-interaction/);
  assert.match(script, /LOGIC\.socialInteractionReward/);
  assert.match(script, /followers_gained:followersGained,hype_gained:hypeGained/);
  assert.match(script, /closeFighterPostComposer\(\);await connectSharedSocial\(true\);updateUI\(\)/);
  assert.match(cageInteractionMigration, /get_cage_interactions_remaining/);
  assert.match(cageInteractionMigration, /return greatest\(0, 5 - v_used\)/);
  assert.match(cageInteractionMigration, /post_kind in \('callout','props','welcome','respect','watching'\)/);
  assert.match(cageInteractionMigration, /if public\.get_cage_interactions_remaining\(\) < 1/);
  assert.doesNotMatch(page, /id="rivalCalloutModal"/);
  assert.match(strings, /WIN STREAK: \{name\} has now won \{winStreak\} straight/);
  for (const name of ['FightFan99', 'MMA4Life', 'ScorecardBandit', 'FlukeWinPolice']) assert.match(strings, new RegExp(name));
  const riskDefs = script.match(/const riskDefs = (\[[\s\S]*?\n\s*\]);/)?.[1] || '';
  const publicityDefs = script.match(/const publicityDefs = (\[[\s\S]*?\n\s*\]);/)?.[1] || '';
  assert.doesNotMatch(riskDefs, /call-out-rival|Post a Rival Callout/);
  assert.doesNotMatch(publicityDefs, /social-post|Influencer Brand Post/);
  assert.doesNotMatch(html, />FANS<|>Fans</);
  assert.match(readme, /five direct\s+fighter interactions per UTC day/i);
});

test('fighter post drafts shuffle without repetition inside the selected intent', () => {
  const choices=script.match(/function fighterInteractionDraft\(kind,profile,offset=0\)\{[^\n]+/)?.[0]||'';
  assert.match(choices, /definition=STRINGS\.social\.interactions\[kind\]/);
  assert.match(choices, /profile\.id\}\|\$\{kind\}\|\$\{todayKey\(\)\}/);
  assert.match(choices, /seededRandom/);
  assert.match(choices, /offset\)%order\.length/);
});

test('Cage Grind CEO is verified while championship announcements stay database-owned', () => {
  assert.ok(fs.existsSync('assets/cage-grind-ceo.jpg'));
  assert.match(strings, /author:'Cage Grind CEO',handle:'@CageGrindCEO',tone:'ceo'/);
  for (const key of ['debut','performanceBonus']) assert.ok(stringsData.social.ceo[key]);
  for (const key of ['cityOffer','cityTitle','regionalOffer','regionalTitle','usOffer','usTitle','worldOffer','worldTitle']) assert.equal(stringsData.social.ceo[key],undefined);
  assert.match(page, /id="ceoOfficeModal"/);
  assert.match(page, /id="ceoResultSpotlight"/);
  assert.match(page, /class="card championship-hub career-after-setup" id="worldTitleCard"[^>]*aria-live="polite"/);
  assert.ok(page.indexOf('id="worldTitleCard"') > page.indexOf('data-screen="fight"'));
  assert.ok(page.indexOf('id="worldTitleCard"') > page.indexOf('DAILY FIGHTS RESET IN'));
  assert.ok(page.indexOf('id="worldTitleCard"') > page.indexOf('class="card retirement-card"'));
  assert.doesNotMatch(page, /id="careerIdentityCard"[^\n]*World Championship/);
  assert.match(sharedUi, /model\.kicker='REIGNING WORLD CHAMPION';model\.headline='YOU ARE THE WORLD CHAMPION'/);
  assert.match(sharedUi, /model\.kicker=level>=requiredLevel\?'TITLE CONTENDER':'CURRENT WORLD CHAMPION'/);
  assert.match(sharedUi, /assets\/icons\/title-world\.png/);
  assert.match(sharedCss, /\.world-title-card\{/);
  assert.match(landingScript, /sharedUi\.isCurrentChampion\(getChampionship\(\),state\)/);
  assert.match(gameScript, /function renderFightChampionship\(\)/);
  assert.match(gameScript, /opponent&&!unavailable&&status!=='locked'/);
  assert.match(gameScript, /rulesHtml=status==='locked'\?'':/);
  assert.match(gameScript, /status='locked';headline='WORLD TITLE SHOT LOCKED';message=''/);
  assert.match(gameScript, /gameIcon\('title-world','👑'\)/);
  assert.doesNotMatch(script, /titleIcon=/);
  assert.match(script, /class="championship-icon">\$\{gameIcon\('title-world','👑'\)\}/);
  assert.doesNotMatch(page, /landing-champion:after\{content:"♛"/);
  assert.doesNotMatch(script, /'👑 YOU HOLD THE BELT'/);
  assert.match(page, /assets\/cage-grind-ceo\.jpg\?v=2\.5\.223/g);
  assert.match(css, /\.feed-post\.ceo\{/);
  assert.match(css, /\.feed-verified\{/);
  assert.match(css, /\.ceo-office-photo\{/);
  assert.match(css, /\.ceo-result-spotlight\{/);
  assert.doesNotMatch(strings, /followers:2000000|following:38|role:'FOUNDER & CEO'|location:'CAGE GRIND HQ'/);
  assert.match(page, /id="fighterBioKicker"/);
  assert.match(script, /data-ceo-profile/);
  assert.match(script, /function openCeoBio\(\)/);
  assert.match(script, /function renderCeoBioDetails\(\)/);
  assert.match(script, /activeBioProfileId==='official-ceo'\?renderCeoBioDetails\(\)/);
  assert.match(css, /\.ceo-profile \.fighter-bio-dialog\{/);
  assert.doesNotMatch(css, /\.ceo-bio-stats\{|\.ceo-bio-role/);
  assert.match(script, /function publishCeoEvent\(eventKey/);
  assert.match(script, /function syncCeoCareerEvents\(\)/);
  assert.match(script, /ensureRoster\(\);syncCeoCareerEvents\(\)/);
  assert.doesNotMatch(script, /publishCeoEvent\(`\$\{title\.id\}_offer`\)/);
  assert.doesNotMatch(script, /publishCeoEvent\(`\$\{m\.id\}_title`\)/);
  assert.match(script, /function awardCeoPerformanceBonus/);
  assert.match(script, /qualifies=!titleWon&&\(upset\|\|ko\)/);
  assert.match(script, /state\.ceoBonusDate===date\|\|roll>=10/);
  assert.doesNotMatch(script, /upset\|\|ko\|\|streak>=3/);
  assert.match(sanctionedChampionshipMigration, /global_title_shot_/);
  assert.match(sanctionedChampionshipMigration, /The title shot is official/);
  assert.match(sanctionedChampionshipMigration, /The champion called for this one/);
  assert.match(cageChampionshipMigration, /Championship announcements are managed by the global belt/);
  assert.match(supabaseClient, /publish_cage_ceo_post/);
  assert.match(cageSocial, /publishCeoPost/);
  assert.match(cageCeoMigration, /add column if not exists official_event_key text/i);
  assert.match(cageCeoMigration, /post_kind in \('player','reporter','ceo'/);
  assert.match(cageCeoMigration, /create or replace function public\.publish_cage_ceo_post\(p_event_key text\)/i);
  assert.match(cageCeoMigration, /if v_event_key not in \(/i);
  assert.match(cageCeoMigration, /v_profile\.level < v_min_level/i);
  assert.match(cageCeoMigration, /'cagegrindceo','ceo',v_body,v_event_key/i);
  assert.match(cageCeoMigration, /post_kind not in \('reporter','ceo'\)/i);
  assert.match(cageCeoMigration, /grant execute on function public\.publish_cage_ceo_post\(text\) to authenticated/i);
  assert.match(serviceWorker, /\.\/assets\/cage-grind-ceo\.jpg\?v=2\.5\.223/);
});

test('hometown colors persist with fighters across the game presentation', () => {
  const citySource = script.match(/const fighterCities = (\[[\s\S]*?\n\s*\]);/)?.[1];
  assert.ok(citySource, 'fighter hometown definitions should be present');
  const cities = new Function(`return ${citySource}`)();
  assert.equal(cities.length, 20);
  assert.equal(new Set(cities.map(city => city.id)).size, 20);
  assert.equal(new Set(cities.map(city => city.accent)).size, 20);
  for (const city of cities) assert.match(city.accent, /^#[0-9a-f]{6}$/i);
  assert.match(script, /function fighterAccent\(cityId\)/);
  assert.match(script, /\$\('#app'\)\.style\.setProperty\('--fighter-accent',city\?\.accent\|\|DEFAULT_FIGHTER_ACCENT\)/);
  assert.match(script, /themeAccent:fighterAccent\(state\.fighterCity\)/);
  assert.match(script, /style="--hometown-accent:\$\{fighterAccent\(o\.networkCity\)\};\$\{fighterPortraitStyle\(o\.networkHandle\)\}"/);
  assert.match(script, /championship-matchup" style="\$\{fighterThemeStyle\(opponent\.networkCity\)\};\$\{fighterPortraitStyle\(opponent\.networkHandle\)\}"/);
  assert.match(script, /playerCard\.style\.setProperty\('--fighter-accent',playerAccent\)/);
  assert.match(script, /opponentCard\.style\.setProperty\('--fighter-accent',opponentAccent\)/);
  assert.match(script, /liveCard\.style\.setProperty\('--player-accent',fighterAccent\(state\.fighterCity\)\)/);
  assert.match(script, /resultTape\.style\.setProperty\('--opponent-accent'/);
  assert.match(gameCss, /\.hero\{[^}]*var\(--fighter-accent\)/);
  assert.match(gameCss, /\.opponent\.network:not\(\.daily-exhausted\)\{--fighter-accent:var\(--hometown-accent/);
  assert.match(gameCss, /\.tape-fighter-card\{[^}]*var\(--fighter-accent\)/);
  assert.match(gameCss, /\.live-fighter:first-child b\{color:var\(--player-accent\)\}/);
  assert.match(gameCss, /\.live-fighter\.right b\{color:var\(--opponent-accent\)\}/);
  assert.match(gameCss, /\.result-tape \.rt-name\.player[^}]*var\(--player-accent\)/);
  assert.match(gameCss, /\.result-tape \.rt-name\.opponent[^}]*var\(--opponent-accent\)/);
  assert.match(script, /function fighterPortraitStyle\(identity\)/);
  assert.match(script, /function applyPortraitStyle\(element,identity\)/);
  assert.match(script, /class="fighter-city-badge">\$\{o\.network\?fighterCityCode\(o\.networkCity\):escapeHtml\(o\.country\|\|'CAGE'\)\}/);
  assert.match(page, /class="fighter-city-badge" id="tapePlayerCity"/);
  assert.match(page, /class="fighter-city-badge" id="tapeOppCity"/);
  assert.match(gameCss, /Mobile-safe fighter differentiation: glow the surface, not the bitmap/);
  assert.match(gameCss, /\.opponent\.network:not\(\.daily-exhausted\) \.opp-sprite\{[^}]*filter:brightness\(var\(--portrait-brightness,1\)\) contrast\(var\(--portrait-contrast,1\)\) saturate\(var\(--portrait-saturation,1\)\)/);
  assert.doesNotMatch(gameCss, /\.opponent\.network:not\(\.daily-exhausted\) \.opp-sprite\{[^}]*drop-shadow/);
});

test('CageReporter has a verified clickable read-only profile', () => {
  assert.ok(fs.existsSync('assets/cage-reporter.jpg'));
  assert.match(strings, /author:'CageReporter',handle:'@CageReporter',tone:'media',avatar:'assets\/cage-reporter\.jpg\?v=2\.5\.223',verified:true,bio:/);
  assert.match(script, /reporterProfile=STRINGS\.social\.profiles\.media/);
  assert.match(script, /verified:Boolean\(officialProfile\?\.verified\)/);
  assert.match(script, /data-reporter-profile/);
  assert.match(script, /function openReporterBio\(\)/);
  assert.match(script, /function renderReporterBioDetails\(\)/);
  assert.match(script, /activeBioProfileId==='official-reporter'\?renderReporterBioDetails\(\)/);
  assert.match(script, /VERIFIED OFFICIAL ACCOUNT · READ ONLY/);
  assert.doesNotMatch(script, /profile:'media',text:'@\{name\} has joined the global fight conversation\.'/);
  assert.match(script, /reporterValues=Object\.assign\(\{\},values,\{name:`@\$\{String\(values\.name\|\|name\)\.replace\(\/\^@\//);
  assert.match(script, /kind:'reporter',body:post\.text/);
  assert.doesNotMatch(script, /kind:'reporter',body:post\.text,targetProfileId/);
  assert.match(script, /reporterValues=Object\.assign\(\{\},values,\{name:`@/);
  assert.match(cageIdentityMigration, /elsif p_target_profile_id is not null then\s+raise exception 'Only fighter interactions may target another fighter'/i);
  assert.match(css, /\.feed-avatar\.reporter-photo\{/);
  assert.match(css, /\.reporter-profile \.fighter-bio-dialog\{/);
  assert.match(css, /\.reporter-bio-official\{/);
  assert.match(serviceWorker, /\.\/assets\/cage-reporter\.jpg\?v=2\.5\.223/);
  assert.match(readme, /CageReporter uses a dedicated newsroom portrait and verified read-only/);
});

test('championship action spans the championship card on desktop', () => {
  assert.match(css, /\.championship-action\{width:100%;/);
  assert.match(css, /@media \(min-width:700px\)\{[^}]*[\s\S]*?\.championship-action\{max-width:none\}/);
  assert.match(css, /\.championship-action-wrap\{grid-template-columns:minmax\(260px,420px\) minmax\(0,1fr\);align-items:stretch;gap:12px;margin-top:7px\}/);
  assert.match(css, /\.championship-action-wrap>small\{display:flex;align-items:center;min-height:36px;padding-left:12px;border-left:1px solid #31506b/);
});

test('a new fighter is sent directly into an easy rookie showcase through the normal fight flow', () => {
  assert.match(script, /key:'rookie-showcase-vaso-jose-mx',name:'VasoJoseMX',country:'MX'/);
  assert.match(script, /tier:1,min:1,max:99,power:2,speed:2,chin:1,cardio:2/);
  assert.match(script, /wins:0,losses:8,[\s\S]*recordInitialized:true,rookieShowcase:true/);
  assert.match(script, /portraitAsset:`assets\/opponents\/vaso-jose\.png\?v=\$\{ICON_ASSET_VERSION\}`/);
  assert.match(script, /o\?\.portraitAsset\|\|o\?\.networkPortrait\|\|fighterSilhouettes/);
  assert.match(script, /classList\.toggle\('real-portrait',!!f\.o\.portraitAsset\)/);
  assert.match(css, /\.opponent\.portrait \.opp-sprite\{object-fit:contain;object-position:center bottom;filter:drop-shadow/);
  assert.match(css, /img\.tape-opp-sprite\.real-portrait\{object-fit:contain;object-position:center bottom;filter:drop-shadow/);
  assert.ok(fs.existsSync('assets/opponents/vaso-jose.png'));
  assert.match(serviceWorker, /assets\/opponents\/vaso-jose\.png\?v=/);
  assert.match(script, /headline:"LET'S SEE WHAT YOU GOT, KID"/);
  assert.match(script, /boutLabel:'ROOKIE SHOWCASE · 3 ROUNDS'/);
  assert.match(script, /function offerRookieShowcase\(\)[\s\S]*state\.rookieShowcasePending=false;saveState\(\);navTo\('fight'\);requestAnimationFrame\(\(\)=>openTaleOfTape\(opponent\)\)/);
  assert.match(script, /offerRookieShowcase\(\);connectSharedSocial\(true\)/);
  assert.match(script, /rookieShowcase\?ROOKIE_SHOWCASE\.boutLabel/);
  assert.match(script, /rookieShowcase\?ROOKIE_SHOWCASE\.headline:matchup/);
  assert.match(script, /rookieShowcase\?ROOKIE_SHOWCASE\.actionLabel:'SET FIGHT PLAN'/);
  assert.match(script, /firstCareerWin=win&&state\.wins===0/);
  assert.match(script, /guaranteed:firstCareerWin/);
  assert.match(script, /reason:guaranteed\?'FIRST WIN DROP'/);
  assert.doesNotMatch(script, /if\(o\.rookieShowcase\)[\s\S]{0,120}LOGIC\.bookFight/);
});

test('championship defenses select the highest-ranked proven available challenger', () => {
  assert.match(rankedDefenseChallengerMigration, /create or replace function public\.select_cage_championship_defense_challenger\(/i);
  assert.match(rankedDefenseChallengerMigration, /coalesce\(candidate\.wins,0\)\+coalesce\(candidate\.losses,0\)>0/i);
  assert.match(rankedDefenseChallengerMigration, /order by\s+candidate\.level desc,\s+coalesce\(candidate\.wins,0\)::numeric\s*\/\s*greatest\(coalesce\(candidate\.wins,0\)\+coalesce\(candidate\.losses,0\),1\) desc,\s+coalesce\(candidate\.wins,0\)\+coalesce\(candidate\.losses,0\) desc,\s+lower\(candidate\.handle\)/i);
  assert.equal((rankedDefenseChallengerMigration.match(/public\.select_cage_championship_defense_challenger\(champion\.id,v_today\)|public\.select_cage_championship_defense_challenger\(v_champion\.id,v_today\)/g)||[]).length,2);
  assert.doesNotMatch(rankedDefenseChallengerMigration, /order by md5\(/i);
});

test('a retiring champion passes the belt to the highest-ranked active fighter', () => {
  assert.match(rankedChampionRetirementSuccessionMigration, /create or replace function public\.ensure_cage_champion\(p_former_champion_id uuid default null\)/i);
  assert.match(rankedChampionRetirementSuccessionMigration, /candidate\.retired_at is null\s+and candidate\.id is distinct from p_former_champion_id/i);
  assert.match(rankedChampionRetirementSuccessionMigration, /order by\s+candidate\.level desc,\s+coalesce\(candidate\.wins,0\)::numeric\s*\/\s*greatest\(coalesce\(candidate\.wins,0\)\+coalesce\(candidate\.losses,0\),1\) desc,\s+coalesce\(candidate\.wins,0\)\+coalesce\(candidate\.losses,0\) desc,\s+lower\(candidate\.handle\),\s+candidate\.id/i);
  assert.match(rankedChampionRetirementSuccessionMigration, /set champion_id=v_profile\.id,[\s\S]*defenses=0/i);
  assert.match(rankedChampionRetirementSuccessionMigration, /v_action := case when p_former_champion_id is null then 'bootstrap' else 'succession' end/i);
  assert.match(rankedChampionRetirementSuccessionMigration, /'global_title_succession_' \|\| v_history_id::text/i);
  assert.match(rankedChampionRetirementSuccessionMigration, /inherits the vacant title as the highest-ranked active fighter/i);
  assert.match(rankedChampionRetirementSuccessionMigration, /create or replace function public\.retire_cage_profile\(\)/i);
  assert.match(rankedChampionRetirementSuccessionMigration, /championship_key='world' and champion_id=v_user_id/i);
  assert.match(rankedChampionRetirementSuccessionMigration, /has retired as Cage Grind World Champion/i);
  assert.match(rankedChampionRetirementSuccessionMigration, /update public\.cage_profiles\s+set retired_at=now\(\),updated_at=now\(\)/i);
  assert.match(rankedChampionRetirementSuccessionMigration, /revoke execute on function public\.ensure_cage_champion\(uuid\) from public, anon, authenticated/i);
  assert.match(rankedChampionRetirementSuccessionMigration, /grant execute on function public\.retire_cage_profile\(\) to authenticated/i);
});

test('bottom navigation opens every destination at the top', () => {
  const navTo = script.match(/function navTo\(screen\)\{([\s\S]*?)\r?\n\s*\}/)?.[1] || '';
  assert.match(navTo, /const appScroll=\$\('\.app-scroll'\);if\(appScroll\)appScroll\.scrollTop=0/);
  assert.match(navTo, /screen==='feed'.*socialTimeline.*scrollTop=0/);
});

test('all Cage Network profiles become level-sorted ranked opponent snapshots', () => {
  assert.match(cageOpponentMigration, /get_cage_opponent_candidates/);
  assert.match(cageOpponentMigration, /profile\.id <> v_user_id/);
  assert.match(cageOpponentMigration, /profile\.level = v_level/);
  assert.match(cageOpponentMigration, /interval '30 days'/);
  assert.match(cageOpponentMigration, /grant execute .* to authenticated/);
  assert.match(supabaseClient, /selectCageOpponentCandidates/);
  assert.match(cageSocial, /loadOpponentCandidates/);
  assert.match(cageSocial, /async function loadOwnProfile\(expectedProfileId=''\)\{return database\.selectOwnCageProfile\(expectedProfileId\)\}/);
  assert.match(supabaseClient, /async function selectOwnCageProfile\(expectedUserId=''\)/);
  assert.match(script, /function networkOpponentFromProfile\(profile,tier\)/);
  assert.match(script, /function networkOpponentDisplayName\(value\)/);
  assert.match(script, /name=networkOpponentDisplayName\(handle\)/);
  assert.match(script, /o\.network&&o\.networkHandle\)o\.name=networkOpponentDisplayName\(o\.networkHandle\)/);
  assert.doesNotMatch(script, /name=handle\.toUpperCase\(\)/);
  assert.match(script, /network:true,sourceProfileId:id/);
  assert.match(script, /function networkOpponentLocation\(o\)/);
  assert.match(script, /region=networkLocation\?`\$\{networkLocation\.name\} \$\{networkLocation\.region\}`/);
  assert.match(script, /<dt>REGION<\/dt><dd>\$\{escapeHtml\(region\)\}<\/dd>/);
  assert.match(script, /<dt>PURSE<\/dt><dd>\$\$\{fmt\(purse\)\}<\/dd>/);
  assert.match(script, /LOGIC\.networkOpponentRatings/);
  assert.match(script, /function syncRankedOpponents\(profiles\)/);
  assert.match(script, /if\(profile\?\.id===state\.socialProfileId\)continue/);
  assert.match(script, /SHARED_FEED\.loadProfiles\(1000\)/);
  assert.match(script, /syncRankedOpponents\(profiles\)/);
  assert.match(script, /function sharedProfileMatchesCareer\(profile\)/);
  assert.match(script, /normalizeIdentityName\(profile\.handle\)===state\.name/);
  assert.match(script, /function syncSharedProfile\(\)\{const existing=await SHARED_FEED\.loadOwnProfile\(state\.socialProfileId\)/);
  assert.match(script, /if\(existing\)\{if\(!sharedProfileMatchesCareer\(existing\)\)throw new Error\('Fighter network identity does not match/);
  assert.match(script, /SHARED_FEED\.claimIdentity\(Object\.assign\(sharedProfilePayload\(\),\{candidates:\[state\.name\]\}\)\)/);
  assert.match(script, /profile\.id!==state\.socialProfileId\)throw new Error\('Fighter network identity does not match/);
  assert.match(script, /FIGHTER NETWORK IDENTITY DOES NOT MATCH THIS CAREER · RECOVERY REQUIRED/);
  assert.match(script, /FIGHTER REGISTRATION MISSING · RECOVERY REQUIRED/);
  assert.match(script, /if\(screen==='fight'&&state\.nameLocked\)queueMicrotask\(\(\)=>connectSharedSocial\(true\)\)/);
  assert.match(script, /if\(!state\.nameLocked\)loadLandingChampionship\(\)/);
  assert.match(script, /state\.roster=\[\.\.\.state\.roster\.filter\(o=>!o\.network\),\.\.\.ranked\]/);
  assert.match(script, /o\.sourceProfileId!==state\.socialProfileId/);
  assert.match(script, /if\(!await connectSharedSocial\(true\)\)throw new Error\(sharedSocialError/);
  assert.match(script, /o\?\.portraitAsset\|\|o\?\.networkPortrait\|\|fighterSilhouettes/);
  assert.match(page, /AI-CONTROLLED SNAPSHOT/);
  assert.doesNotMatch(script, /if\(!o\.network\)openSocialCycle\('fight'/);
  assert.match(script, /openSocialCycle\('fight',\{win,opponent:o\.name/);
  assert.doesNotMatch(script, /update_cage_opponent|registerOpponent|sourceProfileId.*publish/);
  assert.match(readme, /Cage Network/i);
});

test('equipping fight gear triggers the collectible-card burst before rerendering', () => {
  assert.match(html, /\.gear\.equip-bursting\{animation:equipCardBurst/);
  assert.match(html, /@keyframes equipRays/);
  assert.match(script, /toggleEquip\(eq\.dataset\.equip,eq\)/);
  assert.match(script, /card\.classList\.add\('equip-bursting'\)/);
  assert.match(script, /setTimeout\(updateUI,680\)/);
});

test('a full fight-gear loadout opens an accessible styled dialog', () => {
  assert.match(page, /id="loadoutFullModal" aria-hidden="true"/);
  assert.match(page, /role="dialog" aria-modal="true" aria-labelledby="loadoutFullTitle" aria-describedby="loadoutFullDescription"/);
  assert.match(page, /id="loadoutFullOk" type="button">OK<\/button>/);
  assert.match(css, /\.loadout-dialog\{text-align:center/);
  assert.match(css, /\.loadout-dialog \.modal-actions\.single-action\{grid-template-columns:1fr\}/);
  assert.match(script, /if\(state\.equippedGear\.length>=LOGIC\.gearLoadoutLimit\(state\.level\)\)\{openLoadoutFullDialog\(trigger\);return\}/);
  assert.match(script, /4 SLOTS AT LVL 8/);
  assert.match(script, /Four-slot Fight Gear loadout unlocked/);
  assert.doesNotMatch(script, /toast\('Loadout full\./);
  assert.match(script, /function openLoadoutFullDialog\(trigger\)/);
  assert.match(script, /requestAnimationFrame\(\(\)=>\$\('#loadoutFullOk'\)\.focus\(\)\)/);
  assert.match(script, /function closeLoadoutFullDialog\(\)/);
  assert.match(script, /\$\('#loadoutFullOk'\)\.addEventListener\('click',closeLoadoutFullDialog\)/);
  assert.match(script, /e\.key==='Escape'/);
});

test('Hype bonuses are visible on the matchup and publicity is limited to one daily gig', () => {
  assert.match(page, /id="tapeHypeBonus">0% HYPE · \+0% WINNINGS<\/b>/);
  assert.match(page, /id="tapeBreakdownFollowers">\+0% ON A WIN<\/b>/);
  assert.match(script, /\$\('#tapeHypeBonus'\)\.textContent=`\$\{hype\}% HYPE · \+\$\{hypePurse\}% WINNINGS`/);
  assert.match(script, /\$\('#tapeBreakdownFollowers'\)\.textContent=`\+\$\{hype\}% FOLLOWERS ON A WIN`/);
  assert.match(page, /id="publicityLimitText">1 GIG LEFT<\/span>/);
  assert.doesNotMatch(script, /sessionsLeft\('publicity',2\)/);
  assert.match(page, /id="publicitySessionModal"[\s\S]*modal-meter--cyan[\s\S]*id="publicitySessionMeter"[\s\S]*id="publicitySessionResult"[\s\S]*COLLECT RESULTS/);
  assert.match(script, /id:'podcast'.*meterSeconds:2/);
  assert.match(script, /id:'autographs'.*meterSeconds:3/);
  assert.match(script, /id:'trade-show'.*meterSeconds:3/);
  assert.match(script, /id:'commercial'.*meterSeconds:4/);
  assert.match(script, /id:'expo'.*meterSeconds:5/);
  assert.match(script, /id:'tv-spot'.*meterSeconds:6/);
  assert.match(script, /publicitySessionTimer=setTimeout\(resolvePublicitySession,duration\)/);
  assert.match(script, /activePublicitySession=\{action:a,energySpent,rewardText:/);
  assert.match(script, /modalMeterSummary\('COST',`-\$\{energySpent\} ENERGY`/);
  assert.match(script, /modalMeterSummary\('REWARD',rewardText,detail\)/);
});

test('Odd Jobs are limited to two daily and retire when a fighter reaches Level 5', () => {
  assert.match(page, /id="makeEndsMeetCard"/);
  assert.match(page, /Odd Jobs <span class="limit-pill" id="hustleLimitText">2 JOBS LEFT/);
  assert.match(page, /id="fullTimeFighterNote" hidden/);
  assert.match(page, /YOU'RE A FULL-TIME FIGHTER/);
  assert.match(script, /const fullTimeFighter=state\.level>=5/);
  assert.match(script, /\$\('#makeEndsMeetCard'\)\.hidden=fullTimeFighter/);
  assert.match(script, /if\(state\.level>=5\)\{toast\('ODD JOBS END AT LEVEL 5/);
  assert.match(script, /sessionsLeft\('hustle',2\)/);
  assert.match(page, /id="hustleShiftModal"[\s\S]*id="hustleShiftKicker"[\s\S]*id="hustleShiftMeter"[\s\S]*COLLECT PAY/);
  assert.doesNotMatch(page, /id="(?:hustleShift|sparringSession|recoverySession|publicitySession)Icon"/);
  assert.match(script, /hustleShiftTimer=setTimeout\(resolveHustleShift,duration\)/);
  assert.match(script, /LOGIC\.hustleBonus\(a\.id,Math\.random\(\),Math\.random\(\)\)/);
  assert.match(script, /LUCKY FIND · \+\$\$\{bonusCash\} SPARE CHANGE/);
  assert.match(script, /EXTRA-HEAVY FREIGHT · \+1 POWER/);
  assert.match(script, /RECOGNIZED AT THE DOOR · \+\$\{hypeBonus\}% HYPE/);
  assert.match(script, /id:'rideshare-driver',asset:'rideshare-driver',extension:'jpg'.*title:'Rideshare Driver'.*miles:\[12,32\],ratePerMile:3/);
  assert.ok(fs.existsSync('assets/icons/rideshare-driver.jpg'));
  assert.match(serviceWorker, /assets\/icons\/rideshare-driver\.jpg\?v=/);
  assert.match(script, /cash=miles\?miles\*a\.ratePerMile:rint\(\.\.\.a\.cash\)/);
  assert.match(script, /RESTED BETWEEN FARES · \+\$\{energyBonus\} ENERGY/);
  assert.match(script, /MILES × \$\$\{a\.ratePerMile\} PER MILE/);
  assert.match(script, /id:'rideshare-driver'.*meterSeconds:2/);
  assert.match(css, /\.modal-meter\.working>i\{width:100%\}/);
  assert.match(css, /\.full-time-fighter-note\{/);
  assert.match(readme, /Odd Jobs[\s\S]*Level 5/);
});

test('cash starts empty and pays the premium scaling coach fee while career earnings remain cumulative', () => {
  assert.doesNotMatch(html, /Coach's Board|id="coachTip"/);
  assert.doesNotMatch(script, /\$\('#coachTip'\)/);
  assert.match(html, /id="careerEarningsText"/);
  assert.match(script, /version:23,name:'ROOKIE',nameLocked:false,rookieShowcasePending:false,cash:0,careerEarnings:0/);
  assert.match(script, /function coachFee\(\)\{return 250\+state\.level\*75\}/);
  assert.match(script, /LOGIC\.trainingQuote/);
  assert.match(script, /state\.cash-=quote\.cashCost/);
  assert.match(script, /function receiveMoney\(amount,career=false\)/);
  assert.match(script, /receiveMoney\(cash,true\)/);
  assert.match(script, /receiveMoney\(cash\)/);
  assert.match(script, /trackEvent\('hustle_completed',\{hustle_id:a\.id/);
  assert.match(script, /LOGIC\.normalizeCoreState/);
});

test('career status reflects the shared world championship and the active sponsor appears beneath it', () => {
  const rankPosition = html.indexOf('class="rank-chip"');
  const sponsorPosition = html.indexOf('id="heroSponsor"');
  const dailyPosition = html.indexOf('id="dailyBtn"');
  assert.ok(dailyPosition >= 0 && dailyPosition < rankPosition && sponsorPosition > rankPosition);
  assert.match(html, /<div class="rank-chip"><strong id="cageStatus">ROOKIE<\/strong><small id="heroLevel">LVL 1<\/small><\/div>/);
  assert.doesNotMatch(html, /CAGE STATUS/);
  assert.doesNotMatch(html, /CAGE RANK|id="cageRank"/);
  assert.doesNotMatch(script, /function cageRank\(/);
  assert.match(script, /function cageStatus\(\)/);
  assert.match(logic, /function championshipCareerRank\(level,championship\)/);
  assert.match(logic, /if\(title\?\.former_champion\)return 'FORMER WORLD CHAMPION'/);
  assert.match(logic, /fighterLevel>=Math\.max\(1,whole\(title\.champion_level,1\)\)\)return 'TITLE CONTENDER'/);
  assert.match(script, /return rankName\(\)/);
  assert.match(html, /\.hero-sponsor\{position:absolute;bottom:9px;left:10px/);
  assert.match(html, /\.hero-sponsor\[hidden\]\{display:none\}/);
  assert.match(page, /id="heroSponsorWallpaper"[^>]*hidden/);
  assert.match(css, /\.hero-sponsor-wallpaper\{[^}]*background-repeat:repeat[^}]*background-size:76px 76px/);
  assert.match(script, /hero\.classList\.toggle\('sponsored',!!sponsor\)/);
  assert.match(script, /sponsorWallpaper\.style\.backgroundImage=sponsor\?`url\("assets\/icons\/\$\{sponsor\.id\}\.png\?v=\$\{ICON_ASSET_VERSION\}"\)`:''/);
  assert.match(script, /sponsorBadge\.hidden=!sponsor/);
  assert.match(script, /gameIcon\(sponsor\.id,sponsor\.icon\)/);
  assert.match(script, /SPONSORED BY/);
  assert.match(css, /\.hero-sponsor\{top:58px;bottom:auto;left:18px\}/);
  assert.match(script, /state\.activeEndorsement\.fightsLeft\} FIGHTS LEFT/);
  assert.match(css, /\.hustle-endorsements \.active-deal\{margin:0;border-left:0;border-right:0;border-radius:0\}/);
});

test('training separates daily sparring from post-fight recovery opportunities', () => {
  assert.match(css, /@media \(min-width:1100px\)\{[\s\S]*?\.screen\[data-screen="train"\]\.active\{[^}]*grid-auto-rows:max-content/);
  assert.match(css, /\.screen\[data-screen="train"\] \.daily-reset-clock\{grid-column:1\/-1;align-self:start\}/);
  assert.match(css, /@media \(min-width:1100px\)\{[\s\S]*?\.screen\[data-screen="train"\] \.card\{align-self:start;min-height:max-content\}/);
  assert.doesNotMatch(css, /\.screen\[data-screen="train"\] \.trainer-card,[^}]*\{grid-column:1\/-1\}/);
  assert.match(page, /id="trainRestCard" hidden[\s\S]*id="restActions"/);
  assert.ok(page.indexOf('id="trainRestCard"')<page.indexOf('id="trainerToggle"'),'Rest & Recharge should lead every Train section');
  assert.match(page, /class="card iron-district-card"[\s\S]*id="trainerToggle"[\s\S]*id="trainActions"/);
  assert.match(page, /class="trainer-card" id="trainerCard"[\s\S]*<h3>Personal Trainer<\/h3><p>Boosts gym gains and perfect-session odds\./);
  assert.doesNotMatch(page, /trainer-portrait|coach-vega|Coach Scrapps/);
  assert.doesNotMatch(serviceWorker, /coach-vega/);
  assert.match(script, /coachAvailable=left>0,coach=state\.trainerOn&&coachAvailable/);
  assert.match(script, /trainerCard\.hidden=!coachAvailable/);
  assert.match(script, /trainerToggle\.disabled=!coachAvailable/);
  assert.match(script, /if\(tt\)\{if\(tt\.disabled\)return;state\.trainerOn=!state\.trainerOn/);
  assert.match(css, /\.trainer-card\[hidden\]\{display:none\}/);
  assert.match(css, /\.screen\[data-screen="train"\] \.train-rest-card,[^}]*grid-column:1\/-1/);
  assert.match(page, /<div class="card sparring-card">/);
  assert.match(page, /id="sparringLimitText">1 SESSION LEFT/);
  assert.match(page, /id="sparringActions"/);
  assert.match(script, /id:'light-sparring'.*tier:'light'.*title:'Technical Sparring'.*cost:25,gain:1,skills:1/);
  assert.match(script, /id:'medium-sparring'.*tier:'medium'.*asset:'hard-sparring'.*title:'Live Sparring'.*cost:50,gain:2,skills:1,damage:\[1,25\]/);
  assert.match(script, /id:'heavy-sparring'.*tier:'heavy'.*title:'Hard Sparring'.*cost:75,gain:1,skills:4,damage:\[25,50\]/);
  assert.match(script, /id:'light-sparring'.*meterSeconds:2/);
  assert.match(script, /id:'medium-sparring'.*meterSeconds:4/);
  assert.match(script, /id:'heavy-sparring'.*meterSeconds:6/);
  for (const asset of ['light-sparring', 'hard-sparring', 'heavy-sparring']) {
    const file = `assets/icons/${asset}.png`;
    assert.equal(fs.existsSync(file), true);
    assert.equal(pngTopLeftAlpha(file), 0, `${asset} artwork should have a transparent background`);
  }
  assert.match(script, /DAILY_TRAINING_LIMIT=fightRule\('dailyDevelopmentLimits\.ordinaryAttributeTrainingSessionLimit',3\)/);
  assert.match(script, /DAILY_SPARRING_LIMIT=fightRule\('dailyDevelopmentLimits\.sparringSessionLimit',1\)/);
  assert.match(script, /sessionsLeft\('sparring',DAILY_SPARRING_LIMIT\)/);
  assert.match(script, /sparring-\$\{a\.tier\}/);
  assert.match(script, /gameIcon\(a\.asset\|\|a\.id,a\.icon\)/);
  assert.match(page, /id="sparringSessionModal"[\s\S]*id="sparringSessionMeter"[\s\S]*id="sparringSessionResult"[\s\S]*BACK TO TRAINING/);
  assert.match(script, /sparringSessionTimer=setTimeout\(resolveSparringSession,duration\)/);
  assert.match(script, /RANDOM SKILL REWARD/);
  assert.match(script, /function flashTrainingStats\(skills,gain=1,perfect=false\)/);
  assert.match(script, /card\.dataset\.statPunch=punch/);
  assert.match(script, /flashTrainingStats\(\[a\.stat\],gain,perfect\)/);
  assert.match(script, /flashTrainingStats\(skills,Number\(gainText\)\|\|1\)/);
  assert.match(css, /\.modal-meter>i\{[^}]*transition:width var\(--modal-meter-duration\) linear/);
  assert.match(css, /\.modal-meter\[aria-valuenow="100"\]\{display:none\}/);
  assert.doesNotMatch(css, /\.modal-meter>span/);
  assert.match(css, /\.hud-attribute\.stat-rewarded\{[^}]*animation:statRewarded/);
  assert.match(css, /\.hud-attribute\.stat-rewarded:after\{content:attr\(data-stat-punch\)/);
  assert.match(css, /\.hud-attribute\.stat-rewarded\.perfect-session:before\{content:"PERFECT SESSION"/);
  assert.match(script, /state\.dailyCounters\.sparring\+=quote\.sessions/);
  assert.match(script, /const sparring=e\.target\.closest\('\[data-sparring\]'\)/);
  assert.doesNotMatch(script, /id:'hard-sparring'/);
  assert.doesNotMatch(script, /trainingCooldown|TrainingCooldown|COOL DOWN/);
  assert.doesNotMatch(page, /trainingCooldownModal|RECOVERY WARNING/);
  assert.doesNotMatch(script, /function applyRepeatTrainingRisk\(repeatCount=0,coach=false\)/);
  assert.doesNotMatch(script, /LOGIC\.trainingInjuryChance/);
  assert.match(script, /LOGIC\.injuredStat\(v,!!state\.trainingInjury\)/);
  assert.match(script, /locked=!!injury\|\|state\.energy<cost/);
  assert.match(css, /\.iron-district-card \.trainer-card\{margin:0;border-left:0;border-right:0;border-radius:0\}/);
  assert.match(script, /TRAINING CLOSED UNTIL MIDNIGHT/);
  assert.match(script, /SPARRING CLOSED UNTIL MIDNIGHT/);
  assert.match(page, /id="recoverySessionModal"[\s\S]*id="recoverySessionMeter"[\s\S]*id="recoverySessionResult"[\s\S]*BACK TO TRAINING/);
  assert.match(page, /id="recoverySessionActions"[\s\S]*id="exitRecoveryResult"[^>]*>EXIT<[\s\S]*id="collectRecoveryResult"/);
  assert.match(script, /treatment\.freeRest\?'FULL BATTERY'/);
  assert.match(script, /exitRecoveryResult'\)\.addEventListener\('click',closeRecoverySession\)/);
  assert.match(script, /id:'ice-bath'.*meterSeconds:2/);
  assert.doesNotMatch(script, /id:'sauna'/);
  assert.match(script, /id:'massage'.*meterSeconds:4/);
  assert.match(script, /id:'cryotherapy'.*meterSeconds:5/);
  assert.match(script, /recoverySessionTimer=setTimeout\(resolveRecoverySession,duration\)/);
  assert.match(script, /RECOVERY REWARD/);
  assert.match(script, /flashRecoveryResources\(restored\)/);
  assert.match(css, /\.modal-meter-result\{[^}]*width:100%[^}]*box-sizing:border-box/);
  assert.match(css, /\.modal-meter-result \.cost-reward\{[^}]*width:100%[^}]*background:transparent/);
  assert.doesNotMatch(css, /\.modal-meter-result\{[^}]*border:/);
  assert.doesNotMatch(css, /\.modal-meter-result \.cost-reward\{[^}]*border:/);
  assert.match(script, /function modalMeterSummary\(label,value,detail=''\)/);
  assert.match(script, /class="cost-reward"><small>\$\{label\}<\/small><b>\$\{value\}<\/b>/);
  assert.match(script, /modalMeterSummary\('COST',costText,'SESSION IN PROGRESS'\)/);
  assert.match(script, /modalMeterSummary\('REWARD',rewards,details\)/);
  assert.match(script, /energyRecovery=treatment\.energy>0/);
  assert.match(script, /energyRecovery\?'RECHARGING':'RECOVERY IN PROGRESS'/);
  assert.match(script, /energyRecovery\?'ENERGY DRINK IN PROGRESS':'TREATMENT IN PROGRESS'/);
  assert.match(script, /modalMeterSummary\('REWARD',rewardText,energyRecovery\?'BATTERY RECHARGED':'HEALTH RESTORED'\)/);
  assert.match(page, /id="recoverySessionKicker">RECOVERY IN PROGRESS<\/small>[\s\S]*id="recoverySessionTitle">TREATMENT/);
  assert.match(script, /\$\('#recoverySessionKicker'\)\.textContent=treatment\.freeRest\?'REST COMPLETE':energyRecovery\?'RECHARGE COMPLETE':'RECOVERY COMPLETE'/);
  assert.match(script, /\$\('#recoverySessionTitle'\)\.textContent=`\$\{treatment\.title\.toUpperCase\(\)\} FINISHED\.`/);
  assert.match(script, /treatment\.freeRest\?'Battery fully charged\.':energyRecovery\?'One segment restored\.'/);
  assert.match(css, /\.hud-resource\.resource-restored\{animation:resourceRestored/);
  assert.match(script, /class="meter-reward-tile"><em>\$\{rewardLabel\(item\)\}<\/em><strong>\$\{item\}<\/strong>/);
  assert.match(css, /\.meter-reward-grid\{display:grid;grid-template-columns:repeat\(auto-fit,minmax\(120px,260px\)\);justify-content:center/);
  assert.match(css, /\.meter-reward-tile\{[^}]*text-align:center/);
  assert.match(css, /\.modal-meter-dialog:has\(\.modal-meter\[aria-valuenow="100"\]\):before\{content:"✓"/);
  assert.match(script, /if\(currentTrainingInjury\(\)\)\{toast\('Training is closed until your injury heals at midnight\.'/);
  assert.match(script, /if\(currentTrainingInjury\(\)\)\{toast\('Sparring is closed until your injury heals at midnight\.'/);
  assert.match(page, /id="trainingInjuryBanner" hidden/);
  assert.match(page, /All sparring choices share one daily session/);
  assert.match(script, /LOGIC\.sparringQuote\(state,a,sparringLeft\)/);
  assert.match(script, /state\.energy=clamp\(state\.energy-quote\.energyCost,0,state\.maxEnergy\)/);
  assert.match(script, /a\.skills===4\?\['power','speed','chin','cardio'\]/);
  assert.doesNotMatch(script, /LOGIC\.trainingRiskBonus/);
  assert.doesNotMatch(script, /NO PAIN BONUS \+0\.25/);
  assert.doesNotMatch(page, /33%/);
  assert.doesNotMatch(css, /training-cooldown/);
  assert.match(css, /\.action\.injury-locked:disabled\{[^}]*opacity:\.72/);
  assert.match(css, /\.hud-attributes-row\.injured \.hud-attribute\{[^}]*border-color:#852b38/);
  assert.match(css, /\.action h3\{[^}]*white-space:nowrap;overflow:hidden;text-overflow:ellipsis/);
  assert.match(css, /\.action \.cost small\{[^}]*white-space:normal;overflow-wrap:anywhere/);
  assert.match(page, /Recovery Room/);
  assert.match(page, /class="card recovery-card" id="recoveryRoomCard"/);
  assert.match(page, /id="recoveryLimitText"/);
  assert.match(page, /id="recoveryActions"/);
  assert.match(script, /class="recovery-gain">\$\{gain\}<\/span>/);
  assert.match(script, /class="recovery-gains">\$\{gains\}<\/b>/);
  assert.match(css, /\.recovery-gains\{[^}]*display:flex!important;[^}]*flex-wrap:wrap;[^}]*justify-content:flex-end/);
  assert.match(css, /\.recovery-gain\{white-space:nowrap\}/);
  assert.match(script, /energyOptions=recoveryOptions\.filter\(\(\{a\}\)=>a\.energy>0\),treatmentOptions=recoveryOptions\.filter\(\(\{a\}\)=>a\.health>0\)/);
  assert.match(script, /trainRestCard'\)\.hidden=!restAvailable/);
  assert.match(script, /restActions'\)\.innerHTML=restAvailable\?energyOptions\.map\(recoveryActionHtml\)\.join\(''\):''/);
  assert.match(script, /recoveryActions'\)\.innerHTML=treatmentOptions\.map\(recoveryActionHtml\)\.join\(''\)/);
  assert.match(page, /id="recoveryLimitText">\$30-\$150<\/span>/);
  assert.match(script, /setLimitBadge\('#recoveryLimitText',`\$\$\{Math\.min\(\.\.\.treatmentFees\)\}-\$\$\{Math\.max\(\.\.\.treatmentFees\)\}`\)/);
  assert.match(script, /id:'rest'.*energy:100,health:0,feeBase:0,feePerLevel:0,meterSeconds:3,freeRest:true/);
  assert.match(script, /id:'surgecore-energy-drink'.*energy:25,health:0,flatFee:25,meterSeconds:2/);
  assert.match(script, /function recoveryTreatmentForCurrentEnergy\(treatment\)[\s\S]*missingEnergy=clamp\(state\.maxEnergy-state\.energy,0,state\.maxEnergy\),missingSegments=Math\.ceil\(missingEnergy\/ENERGY_SEGMENT\)[\s\S]*energy:missingEnergy,meterSeconds:missingSegments\*REST_SECONDS_PER_ENERGY_SEGMENT/);
  assert.match(script, /restSecondsPerMissingEnergySegment',3/);
  assert.match(script, /energyDrinkDurationSeconds',2/);
  assert.match(script, /id:'ice-bath'.*energy:0,health:10,meterSeconds:2/);
  assert.match(script, /id:'massage'.*energy:0,health:25,meterSeconds:4/);
  assert.match(script, /id:'cryotherapy'.*energy:0,health:50,meterSeconds:5/);
  assert.match(script, /RECOVERY_DOLLARS_PER_HEALTH_POINT_PER_FIGHTER_LEVEL=fightRule\('recoveryEconomy\.dollarsPerHealthPointPerFighterLevel',3\)/);
  assert.match(script, /function recoveryFee\(treatment\)\{if\(treatment\?\.freeRest\)return 0;if\(Number\.isFinite\(Number\(treatment\?\.flatFee\)\)\)return Math\.max\(0,Math\.floor\(Number\(treatment\.flatFee\)\)\)/);
  assert.match(script, /LOGIC\.recoveryQuote/);
  assert.match(script, /LOGIC\.applyRecovery/);
  assert.doesNotMatch(script, /state\.treatmentAvailable|treatmentReady|FIGHT TO UNLOCK.*recoveryLimitText/);
  assert.doesNotMatch(logic, /if\(used\)return \{ok:false,reason:'limit'/);
  assert.match(page, /free Rest fills the battery and takes three seconds per missing 25% segment\. A \$25 Surge Core energy drink takes two seconds and restores one 25% segment/);
  assert.match(page, /Recovery Room treatments restore 10, 25, or 50 Health at \$3 per point times fighter level/);
  for (const asset of ['rest', 'surgecore-energy-drink']) {
    const file = `assets/icons/${asset}.png`;
    assert.equal(fs.existsSync(file), true);
    assert.ok(fs.statSync(file).size > 100000, `${asset} should use the supplied high-resolution artwork`);
    assert.match(serviceWorker, new RegExp(`assets/icons/${asset}\\.png\\?v=`));
  }
});

test('Underground Buzz keeps persistent once-daily blackjack, Cage Dice, and horse racing', () => {
  assert.doesNotMatch(script, /id:'backroom-spar'|function handleRisk\(|data-risk|underground_spar_completed/);
  assert.match(page, /id="undergroundLimitText">2 PLAYS LEFT/);
  assert.match(page, /id="undergroundActions"/);
  assert.match(page, /id="blackjackModal"/);
  assert.match(page, /blackjack pays 3:2/);
  assert.match(page, /id="blackjackHit"[^>]*>HIT<\/button>/);
  assert.match(page, /id="blackjackStand"[^>]*>STAND<\/button>/);
  assert.match(script, /sessionsLeft\('blackjack',1\)/);
  assert.match(script, /state\.dailyCounters\.blackjack=1/);
  assert.match(script, /blackjackHand:\s*null/);
  assert.match(script, /s\.blackjackHand=normalizeBlackjackHand\(source\.blackjackHand\)/);
  assert.match(script, /MAX BET \$\$\{fmt\(maxBlackjackBet\)\}/);
  assert.match(script, /LOGIC\.blackjackBetLimit\(state\.cash\)/);
  const deal = script.match(/function dealBlackjack\(\)\{([\s\S]*?)\n\s*\}/)?.[1] || '';
  assert.doesNotMatch(deal, /spendEnergy/);
  assert.match(deal, /state\.cash-=bet/);
  assert.ok(fs.existsSync('assets/cage-dice.jpg'));
  assert.match(page, /id="cageDiceModal"/);
  assert.match(page, /assets\/cage-dice\.jpg\?v=2\.5\.223/);
  assert.match(page, /data-dice-choice="under"[\s\S]*data-dice-choice="over"[\s\S]*data-dice-choice="seven"[\s\S]*data-dice-choice="doubles"/);
  assert.match(page, /id="cageDiceBet"[^>]*disabled/);
  assert.match(script, /let cageDiceChoice=''/);
  assert.match(script, /input\.disabled=maxBet<1\|\|!hasChoice/);
  assert.match(script, /requestAnimationFrame\(\(\)=>\$\('\[data-dice-choice\]'\)\?\.focus\(\)\)/);
  assert.match(script, /function cageDiceIcon\(\)[\s\S]*icon-fallback">🎲/);
  assert.match(script, /sessionsLeft\('cageDice',1\)/);
  assert.match(script, /state\.dailyCounters\.cageDice=1/);
  assert.match(script, /blackjackUnlocked=state\.level>=2,diceUnlocked=state\.level>=4/);
  assert.match(script, /BACKROOM BLACKJACK UNLOCKS AT LEVEL 2/);
  assert.match(script, /CAGE DICE UNLOCKS AT LEVEL 4/);
  assert.match(script, /action future blackjack-action \$\{blackjackUnlocked\?'':'locked-opportunity'\}/);
  assert.match(script, /action future cage-dice-action \$\{diceUnlocked\?'':'locked-opportunity'\}/);
  assert.match(script, /blackjackPlayed=blackjackUnlocked&&!blackjackActive&&blackjackLeft<1,dicePlayed=diceUnlocked&&diceLeft<1/);
  assert.match(script, /\$\{blackjackPlayed\?'gig-unavailable':''\}/);
  assert.match(script, /\$\{dicePlayed\?'gig-unavailable':''\}/);
  assert.match(script, /blackjackPlayed\?'PLAYED TODAY':'HIT OR STAND'/);
  assert.match(script, /dicePlayed\?'PLAYED TODAY':'PICK YOUR BET'/);
  assert.doesNotMatch(script, /REVIEW ROLL/);
  assert.match(script, /state\.blackjackHand\?\.status==='settled'/);
  assert.match(script, /if\(state\.cageDiceResult\|\|sessionsLeft\('cageDice',1\)<1\)/);
  assert.match(serviceWorker, /\.\/assets\/cage-dice\.jpg\?v=2\.5\.223/);
  assert.match(page, /id="horseRaceModal"[\s\S]*UNDERGROUND BUZZ · ONE RACE DAILY/);
  assert.match(page, /id="horseRaceField"[\s\S]*id="horseRaceBet"[\s\S]*id="horseRaceTrack"[\s\S]*id="horseRaceFinish"/);
  assert.match(page, /id="horseRaceBet"[^>]*disabled/);
  assert.match(script, /input\.disabled=!horse\|\|maxBet<1/);
  assert.match(script, /requestAnimationFrame\(\(\)=>\(state\.horseRaceResult\?\$\('#horseRaceClose'\):\$\('\[data-horse-pick\]'\)\)\?\.focus\(\)\)/);
  assert.match(script, /racingUnlocked=state\.level>=6/);
  assert.match(script, /sessionsLeft\('horseRace',1\)/);
  assert.match(script, /state\.dailyCounters\.horseRace=1/);
  assert.match(script, /horseRaceResult:null/);
  assert.match(script, /s\.horseRaceResult=normalizeHorseRaceResult\(source\.horseRaceResult\)/);
  assert.match(script, /LOGIC\.horseRaceBetLimit\(state\.cash\)/);
  assert.match(script, /LOGIC\.horseRaceFinish\(field,field\.map\(\(\)=>Math\.random\(\)\)\)/);
  assert.match(script, /trackEvent\('horse_race_completed'/);
  assert.match(script, /RACING ODDS/);
  assert.match(script, /RETURNS \$\$\{fmt\(bet\*\(horse\.odds\+1\)\)\}/);
  assert.match(script, /horse-race-complete gig-unavailable/);
  assert.match(script, /class="horse-review-link" type="button" data-horse-race-open>REVIEW FINISH/);
  assert.match(css, /\.horse-review-link\{[^}]*color:#6ed7ff/);
  assert.match(css, /\.horse-race-track\{/);
  assert.match(script, /class="horse-race-lane \$\{selected\?'selected':''\}"/);
  assert.match(script, /horseRaceLane\(horse,4,result\.selectedHorseId\)/);
  assert.match(script, /horseRaceLane\(horse,4,selected\.id\)/);
  assert.match(css, /\.horse-race-lane\.selected\{[^}]*border-color:#f2c65a/);
  assert.match(script, /finishProgress=96-place\*4,previous=Number\(marker\.style\.getPropertyValue\('--race-progress'\)\)\|\|4/);
  assert.match(script, /progress=clamp\(Math\.max\(previous,candidate\),4,forwardLimit\)/);
  assert.match(css, /\.horse-marker\{[^}]*transition:left \.7s ease-in-out/);
  assert.match(script, /class="horse-marker" src="assets\/racehorse-right\.png\?v=2\.5\.223"/);
  assert.match(serviceWorker, /\.\/assets\/racehorse-right\.png\?v=2\.5\.223/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test('zero remaining limit badges use the red exhausted state', () => {
  assert.match(script, /function setLimitBadge\(selector,text\)/);
  assert.match(script, /classList\.toggle\('exhausted',\/\^0\\b\.\*\\bLEFT\$\/\.test\(text\)\|\|text==='FIGHT TO UNLOCK'/);
  for (const id of ['trainLimitText','sparringLimitText','hustleLimitText','undergroundLimitText','publicityLimitText','fightLimitText']) {
    assert.match(script,new RegExp(`setLimitBadge\\('#${id}'`));
  }
  assert.match(css, /\.limit-pill\.exhausted\{[^}]*border-color:#c94d56;[^}]*background:#401319;[^}]*color:#ff9aa2/);
});

test('daily drops, fights, training, and hustle share one live local-midnight reset timer', () => {
  assert.equal((page.match(/data-daily-reset-clock/g)||[]).length,4);
  assert.match(page, /id="dailyDropCountdown"[^>]*data-daily-reset-clock[^>]*hidden/);
  assert.match(page, /DAILY LIMITS RESET IN/);
  assert.match(page, /YOUR LOCAL MIDNIGHT/);
  assert.match(page, /class="daily-reset-clock" id="trainingResetClock" hidden/);
  assert.match(page, /class="daily-reset-clock" id="fightResetClock" hidden><span>DAILY FIGHT LIMIT REACHED/);
  assert.match(page, /class="daily-reset-clock" id="hustleResetClock" hidden/);
  assert.match(script, /function updateDailyResetClocks\(\)/);
  assert.equal((script.match(/setInterval\(updateDailyResetClocks,1000\)/g)||[]).length,1);
  assert.match(script, /date!==dailyResetDate/);
  assert.match(script, /\$\('#trainingResetClock'\)\.hidden=!injury&&\(left>0\|\|sparringLeft>0\)/);
  assert.match(script, /\$\('#fightResetClock'\)\.hidden=fightsLeft>0/);
  assert.match(script, /\$\('#hustleResetClock'\)\.hidden=!activeDailyLimits\.length\|\|activeDailyLimits\.some\(remaining=>remaining>0\)/);
  assert.match(css, /\.daily-reset-clock\{/);
  assert.match(css, /\.daily-reset-clock\[hidden\]\{display:none\}/);
});

test('career fights have a ten-fight daily cap', () => {
  assert.match(page, /DAILY FIGHT LIMIT REACHED/);
  assert.match(page, /NEW FIGHTS AT YOUR LOCAL MIDNIGHT/);
  assert.match(page, /id="fightLimitText">10 FIGHTS LEFT/);
  assert.ok(page.indexOf('id="rosterSummary"') < page.indexOf('id="fightLimitText"'));
  assert.match(script, /DAILY_FIGHT_LIMIT=fightRule\('fightStructure\.dailyFightLimit',10\)/);
  assert.match(script, /sessionsLeft\('fight',DAILY_FIGHT_LIMIT\)/);
  assert.match(script, /state\.dailyCounters\.fight\+\+/);
});

test('endorsements unlock as one crash-safe sequential offer', () => {
  assert.match(script, /id:'bobs-auto'.*brand:"Bob's Auto Shop".*minLevel:2,minFans:0,signing:100,perFight:40,fansPerFight:5,fights:3/);
  assert.match(script, /id:'garys-bar-grill'.*brand:"Gary's Bar & Grill".*minLevel:3,minFans:500,signing:300,perFight:90,fansPerFight:12,fights:3/);
  assert.match(script, /id:'volt'.*brand:'Surge Core'.*product:'Performance energy drink'.*minLevel:4,minFans:2500,signing:1200,perFight:350,fansPerFight:35,fights:4/);
  assert.doesNotMatch(script, /Volt Energy/);
  assert.match(script, /const ENDORSEMENT_FIGHTS = \{'bobs-auto':3,'garys-bar-grill':3,volt:4/);
  for (const threshold of [500, 2500, 10000, 30000, 80000, 200000]) assert.match(script, new RegExp(`minFans:${threshold}`));
  assert.ok(fs.existsSync('assets/icons/garys-bar-grill.png'));
  assert.ok(fs.statSync('assets/icons/volt.png').size > 500000, 'Surge Core logo should replace the prior Volt artwork');
  assert.match(css, /\.hero-sponsor \.game-icon\[data-game-icon="volt"\]\{[^}]*flex-basis:52px[^}]*width:52px/);
  assert.match(css, /\.hero-sponsor \.game-icon\[data-game-icon="volt"\]\{position:relative;[^}]*width:52px;height:26px\}/);
  assert.match(css, /\.hero-sponsor \.game-icon\[data-game-icon="volt"\] \.icon-asset\{position:absolute;top:50%;left:0;width:52px;height:52px;max-width:none;object-fit:contain;transform:translateY\(-50%\)\}/);
  assert.match(css, /\.active-deal \.game-icon\[data-game-icon="volt"\]\{width:62px;height:24px/);
  assert.match(script, /function nextEndorsementOffer\(\)/);
  assert.match(script, /LOGIC\.nextEndorsementId/);
  assert.match(script, /isNext=!!nextOffer&&nextOffer\.id===d\.id,unlocked=!active&&isNext&&qualified/);
  assert.match(script, /ONLY OFFER AVAILABLE/);
  assert.match(script, /PREVIOUS PARTNER/);
  assert.match(script, /const furthestEndorsement=Math\.max\(-1/);
  assert.match(script, /s\.activeEndorsement=savedActiveId\?\{id:savedActiveId,fightsLeft:clamp/);
  assert.ok(script.indexOf('const ENDORSEMENT_IDS') < script.indexOf('state = loadState()'), 'endorsement migration data must exist before saved state loads');
  assert.match(script, /state\.endorsementHistory=\[\.\.\.new Set\(\[\.\.\.history,d\.id\]\)\]/);
  assert.match(script, /changeFollowers\(Math\.round\(d\.fansPerFight\*\.5\)\);trackEvent\('endorsement_signed'/);
  assert.match(script, /saveState\(\);publishSponsorSigning\(d\)/);
  assert.match(script, /function sponsorFeedProfile\(sponsorId\)/);
  assert.match(script, /function openSponsorBio\(sponsorId\)/);
  assert.match(script, /data-sponsor-profile/);
  assert.match(supabaseClient, /publish_cage_sponsor_post/);
  assert.match(cageSocial, /publishSponsorPost/);
  assert.match(feedActionsMigration, /add column if not exists sponsor_id text/i);
  assert.match(feedActionsMigration, /create or replace function public\.publish_cage_sponsor_post\(p_sponsor_id text\)/i);
  assert.match(feedActionsMigration, /post_kind not in \('reporter','ceo','sponsor'\)/i);
  assert.match(feedActionsMigration, /when 'volt' then 'Surge Core'/);
  assert.match(surgeCoreMigration, /create or replace function public\.publish_cage_sponsor_post/);
  assert.match(surgeCoreMigration, /when 'volt' then 'Surge Core'/);
  assert.match(surgeCoreMigration, /grant execute .* to authenticated/);
});

test('level ups receive a dedicated promotion celebration', () => {
  assert.match(html, /id="levelUpModal"/);
  assert.match(html, /CAREER BREAKTHROUGH/);
  assert.match(html, /id="levelUpEnergy"/);
  assert.match(html, /id="levelUpHealth"/);
  assert.match(html, /id="levelUpCash"/);
  assert.match(html, /\.level-up-overlay\.active\{display:flex\}/);
  assert.match(script, /function showLevelUp\(summary\)/);
  assert.equal((script.match(/gainXp\(/g)||[]).length,2,'only the XP helper and fight completion may reference gainXp');
  assert.doesNotMatch(script.match(/function gainXp\(amount\)\{([\s\S]*?)\n\s*\}\n\s*function showLevelUp/)?.[1]||'',/showLevelUp/);
  assert.match(script, /requestAnimationFrame\(\(\)=>levelUpSummary\?showLevelUp\(levelUpSummary\)/);
  assert.match(script, /levelUpSummary=\{fromLevel:previous\?\.fromLevel\|\|startingLevel,toLevel:state\.level,earningsBonus:/);
  assert.doesNotMatch(script, /newTitles=milestoneDefs\.filter/);
  assert.doesNotMatch(script, /fullRestore=milestoneDefs\.some/);
  assert.match(script, /LOGIC\.applyLevelUpResources\(state,false\)/);
  assert.match(script, /one Energy segment and up to 25 Health per level/);
  assert.doesNotMatch(script, /state\.energy=state\.maxEnergy;state\.maxHealth\+=5;state\.health=state\.maxHealth/);
  assert.match(script, /modal\._burstTimer=setTimeout\(confettiBurst,620\)/);
  assert.match(script, /function closeLevelUp\(\).*clearTimeout\(modal\._burstTimer\).*stopConfetti\(\)/);
  assert.match(script, /function stopConfetti\(\).*cancelAnimationFrame\(confettiFrameId\)/s);
  assert.match(script, /const count=r\.width<700\?48:64/);
  assert.match(script, /Math\.min\(1\.25,devicePixelRatio\|\|1\)/);
  assert.doesNotMatch(script, /if\(n\+\+<105\)requestAnimationFrame\(frame\)/);
  assert.match(script, /\$\('#levelUpContinue'\)\.addEventListener\('click',closeLevelUp\)/);
});

test('XP is fight-only across definitions, handlers, results, and analytics', () => {
  for(const name of ['trainDefs','sparringDefs','hustleDefs','publicityDefs']){
    const definitions=script.match(new RegExp(`const ${name} = (\\[[\\s\\S]*?\\n\\s*\\]);`))?.[1]||'';
    assert.ok(definitions,`${name} should be present`);
    assert.doesNotMatch(definitions,/\bxp\s*:/i);
  }
  for(const handler of ['handleTrain','handleSparring','handleHustle','handlePublicity','runAutographSigning']){
    const start=script.indexOf(`function ${handler}(`),end=script.indexOf('\n  function ',start+1),body=start>=0?script.slice(start,end>=0?end:undefined):'';
    assert.ok(body,`${handler} should be present`);
    assert.doesNotMatch(body,/gainXp\(/);
  }
  assert.match(script,/xpResult=LOGIC\.fightXp\(/);
  assert.match(script,/if\(xp\)gainXp\(xp\)/);
  assert.match(script,/xp_earned:xp,xp_category:xpResult\.category/);
  for(const copy of ['LOWER-LEVEL OPPONENT · NO XP','SAME-DAY RUNBACK · 50% XP','FORFEIT · NO XP'])assert.match(logic,new RegExp(copy.replace(/[+]/g,'\\+')));
  for(const path of ['rankedFightExperienceMultiplier','championshipFightExperienceMultiplier','worldTitleVictoryExperienceBonus'])assert.match(logic,new RegExp(`cashAndExperienceRewards\\.${path}`));
  assert.match(readme,/XP is earned through fights\. Training improves attributes, hustles earn[\s\S]*cash, and publicity builds Followers and Hype\./);
});

test('gear is deterministic win loot with pity, title rarity, and non-stacking duplicates', () => {
  assert.match(script, /function awardDeterministicGearDrop/);
  assert.match(script, /seededRandom\(hashSeed\(`\$\{state\.gearSeed\}\|\$\{state\.wins\}\|\$\{opponent\.key\}\|\$\{state\.level\}\|gear-v1`\)\)/);
  assert.match(script, /if\(level<=3\)return \[80,18,2,0\]/);
  assert.match(script, /if\(level<=6\)return \[62,29,8,1\]/);
  assert.match(script, /if\(level<=10\)return \[45,36,16,3\]/);
  assert.match(script, /return \[30,40,23,7\]/);
  assert.match(script, /chance=Math\.min\(\.75,\.33\+\(upset\?\.10:0\)\+\(rivalry\?\.10:0\)\+\(ko\?\.05:0\)\)/);
  assert.match(script, /LOGIC\.isGearPity\(state\.gearWinsSinceDrop\)/);
  assert.doesNotMatch(script, /reason:[^\n]*PITY DROP/);
  assert.match(script, /minRarity=titleWon\?'RARE':'COMMON'/);
  assert.match(script, /reason:guaranteed\?'FIRST WIN DROP':titleWon\?'CHAMPIONSHIP DROP':'FIGHT WIN DROP'/);
  assert.match(script, /state\.gearCounts\[item\.id\]=gearCount\(item\.id\)\+1/);
  assert.match(logic, /function fightDropEligible\(winsToday=0\)\{return opponentXpTier\(winsToday\)\.tier!==\'exhausted\'\}/);
  assert.match(script, /dropEligible=LOGIC\.fightDropEligible\(winsToday\)/);
  assert.match(script, /if\(dropEligible\)gearDrop=awardDeterministicGearDrop/);
  assert.match(script, /STALE MATCHUP · \$\{xpTier\.hypeChange\} HYPE · NO COLLECTIBLE DROP/);
  assert.match(script, /function ownedBonus\(prop\)\{return state\.gear\.reduce/);
  const gearCatalog = definitionsScript.match(/const gearItems = \[([\s\S]*?)\n\];/)?.[1] || '';
  assert.doesNotMatch(gearCatalog, /energyRegen|energy every|Energy every/i);
  assert.match(gameScript, /ownedBonus\('healthRegen'\)/);
  assert.match(gameScript, /ownedBonus\('cashBonus'\)/);
  assert.match(gameScript, /ownedBonus\('prestige'\)/);
  assert.doesNotMatch(script, /data-buy|function buyGear|function openCrate|Mystery Gear Crate/);
  assert.doesNotMatch(script, /price:\d/);
});

test('the collectible drop pool includes early-career and status cards', () => {
  for (const item of [
    ['used-car', 'Used Car'],
    ['bourbon', 'Small-Batch Bourbon'],
    ['small-gym-dog', 'Small Gym Dog'],
    ['dog', 'Gym Dog'],
    ['cuban-cigars', 'Cuban Cigars'],
    ['tennis-shoes', 'Fresh Tennis Shoes'],
    ['mma-shorts', 'MMA Shorts'],
    ['energy-drink', 'Energy Drink'],
    ['fur-coat', 'Full-Length Fur Coat'],
    ['victory-bucket', 'Victory Chicken Bucket'],
    ['fight-fuel-protein', 'ALLMAX ISOFLEX'],
    ['flagship-phone', 'Flagship Phone'],
    ['concert-grand', 'Concert Grand Piano'],
    ['sky-blue-scooter', 'Sky Blue Scooter'],
    ['midnight-cruiser', 'Midnight Cruiser'],
    ['redline-superbike', 'Redline Superbike'],
    ['diamond-grill', 'Diamond Grill']
  ]) {
    assert.match(script, new RegExp(`id:'${item[0]}'.*name:'${item[1]}'`));
  }
  assert.match(script, /id:'used-car'.*rarity:'COMMON'.*minLevel:1/);
  assert.match(script, /id:'mma-shorts'.*category:'Fight Gear'.*assetExt:'jpg'.*rarity:'COMMON'.*minLevel:1.*stat:'speed',bonus:1/);
  assert.match(script, /id:'energy-drink'.*category:'Lifestyle'.*assetExt:'jpg'.*rarity:'COMMON'.*minLevel:1.*healthRegen:\.02/);
  for (const id of ['mma-shorts', 'energy-drink']) {
    assert.equal(fs.existsSync(`assets/icons/${id}.jpg`), true, `${id} artwork should exist`);
    assert.match(serviceWorker, new RegExp(`assets/icons/${id}\\.jpg\\?v=`));
  }
  assert.match(script, /id:'fur-coat'.*rarity:'EPIC'.*minLevel:7/);
  assert.match(script, /id:'small-gym-dog'.*name:'Small Gym Dog'.*rarity:'COMMON'.*minLevel:1/);
  assert.match(script, /id:'dog'.*name:'Gym Dog'.*rarity:'RARE'.*minLevel:3/);
  assert.match(script, /id:'victory-bucket'.*category:'Lifestyle'.*rarity:'COMMON'.*minLevel:1/);
  assert.match(script, /id:'fight-fuel-protein'.*category:'Lifestyle'.*rarity:'COMMON'.*minLevel:2/);
  assert.equal(fs.existsSync('assets/icons/fight-fuel-protein-qr.png'), true, 'sponsored protein QR artwork should exist');
  assert.match(serviceWorker, /assets\/icons\/fight-fuel-protein-qr\.png\?v=/);
  assert.match(script, /id:'flagship-phone'.*category:'Lifestyle'.*rarity:'RARE'.*minLevel:3/);
  assert.match(script, /id:'concert-grand'.*category:'Lifestyle'.*rarity:'LEGENDARY'.*minLevel:10/);
  assert.match(script, /id:'sky-blue-scooter'.*category:'Property & Rides'.*rarity:'COMMON'.*minLevel:2/);
  assert.match(script, /id:'midnight-cruiser'.*category:'Property & Rides'.*rarity:'RARE'.*minLevel:4/);
  assert.match(script, /id:'redline-superbike'.*category:'Property & Rides'.*rarity:'EPIC'.*minLevel:7/);
  assert.match(script, /id:'diamond-grill'.*category:'Bling'.*rarity:'EPIC'.*minLevel:6/);
  assert.match(script, /id:'designer-sunglasses'.*category:'Bling'.*rarity:'RARE'.*minLevel:3/);
  assert.match(script, /id:'diamond-cluster-ring'.*category:'Bling'.*rarity:'EPIC'.*minLevel:8/);
  assert.match(script, /id:'shrimp-cocktail'.*category:'Lifestyle'.*rarity:'RARE'.*minLevel:3/);
  assert.match(script, /id:'performance-jet-ski'.*category:'Property & Rides'.*rarity:'RARE'.*minLevel:4/);
  assert.match(script, /id:'coastal-speedboat'.*category:'Property & Rides'.*rarity:'EPIC'.*minLevel:7/);
  assert.match(script, /id:'luxury-yacht'.*category:'Property & Rides'.*rarity:'LEGENDARY'.*minLevel:14/);
  assert.match(script, /id:'private-jet'.*category:'Property & Rides'.*rarity:'LEGENDARY'.*minLevel:15/);
  for (const id of ['designer-sunglasses', 'diamond-cluster-ring', 'shrimp-cocktail', 'performance-jet-ski', 'coastal-speedboat', 'luxury-yacht', 'private-jet']) {
    const file = `assets/icons/${id}.png`;
    assert.equal(fs.existsSync(file), true, `${id} artwork should exist`);
    assert.equal(pngTopLeftAlpha(file), 0, `${id} artwork should have a transparent background`);
  }
  for (const asset of ['victory-bucket','fight-fuel-protein','flagship-phone','concert-grand','sky-blue-scooter','midnight-cruiser','redline-superbike','diamond-grill']) {
    const file = `assets/icons/${asset}.png`;
    assert.equal(fs.existsSync(file), true, `${asset} artwork should exist`);
    assert.equal(pngTopLeftAlpha(file), 0, `${asset} artwork should have a transparent background`);
  }
  assert.ok(fs.existsSync('assets/icons/small-gym-dog.png'));
  assert.ok(fs.existsSync('assets/icons/dog.png'));
  assert.match(readme, /used car, small-batch bourbon, a small gym dog, Cuban cigars/);
});

test('daily drop guarantees a deterministic collectible without resetting fight pity', () => {
  assert.ok(fs.existsSync('assets/cage-grind-drop-pack.png'));
  assert.match(serviceWorker, /\.\/assets\/cage-grind-drop-pack\.png\?v=2\.5\.223/);
  const dailyCollectible = script.match(/function awardDailyCollectible\(date\)\{([\s\S]*?)\r?\n\s*\}\r?\n\s*function ensureDailyCounters/)?.[1] || '';
  assert.match(dailyCollectible, /daily-collectible-v1/);
  assert.match(dailyCollectible, /state\.gearCounts\[item\.id\]=gearCount\(item\.id\)\+1/);
  assert.doesNotMatch(dailyCollectible, /gearWinsSinceDrop/);
  assert.match(script, /gearDrop=awardDailyCollectible\(today\)/);
  assert.match(script, /openDropClaim\(gearDrop,\{kind:'daily'/);
  assert.match(page, /id="dropClaimModal"/);
  assert.match(page, /id="dropRevealBtn"[^>]*>REVEAL DROP<\/button>/);
  assert.match(page, /id="dropCloseBtn"[^>]*hidden>CLOSE<\/button>/);
  assert.match(readme, /Daily Drop awards Cash, one 25% Energy segment, and one deterministic/);
});

test('fight result action celebrates wins without labeling losses as reward claims', () => {
  assert.match(script, /armResultAction\(win\?'CLAIM REWARDS':'CONTINUE'\)/);
  assert.match(script, /function handleResultAction\(\)/);
  assert.match(script, /navTo\('fight','replace'\);if\(victoryDrop\)/);
  assert.match(script, /if\(resultActionTimer\)return/);
  assert.match(script, /LOGIC\.normalizeGearDrop\(pendingResultDrop,gearRarityOrder\)/);
  assert.match(script, /DROP SAVED · OPEN GEAR TO VIEW IT/);
  assert.match(script, /setTimeout\(\(\)=>openDropClaim\(victoryDrop,\{kind:'victory'/);
  assert.match(script, /WAIT — ONE MORE THING/);
  assert.match(script, /A surprise collectible pack landed after your win/);
  assert.match(script, /lootBox\.style\.display='none'/);
  assert.doesNotMatch(script, /COLLECTIBLE DROP READY|Claim your sealed Cage Grind pack/);
  assert.match(script, /collectibleCardHtml\(item,\{dropStatus:status\}\)/);
  assert.doesNotMatch(script, /GIFT FROM THE CEO|CEO TITLE GIFT|CEO GIFT/);
  assert.match(page, /class="drop-claim-pack" src="assets\/cage-grind-drop-pack\.png\?v=2\.5\.223"/);
  assert.match(page, /class="result-bonuses" id="resultBonuses" hidden/);
  assert.match(script, /function renderResultBonuses\(notes=\[\]\)/);
  assert.match(script, /renderResultBonuses\(lootNotes\)/);
  assert.match(script, /pendingResultDrop=gearDrop;resultDropRevealed=false/);
  assert.doesNotMatch(script, /pendingResultDrop=Object\.assign\(\{extras:/);
  assert.doesNotMatch(script, /drop\.extras/);
  assert.match(css, /\.result-bonuses\{[^}]*border-top:1px solid #725c2d/);
  assert.match(page, /id="resultTitle"[\s\S]*id="resultMethod"[\s\S]*id="resultLine"[\s\S]*id="resultDamage"[\s\S]*class="rewards"[\s\S]*id="resultBonuses"[\s\S]*class="result-actions"/);
  assert.match(page, /id="detailsToggle"[^>]*>VIEW SCORECARD<\/button>/);
  assert.ok(page.indexOf('id="officialJudges"')>page.indexOf('id="resultDetails"'),'Detailed judge scores should live inside View Scorecard');
  assert.match(script, /\$\('#resultMethod'\)\.textContent=`\$\{f\.method\} · ROUND \$\{f\.finishRound\} · \$\{f\.finishClock\}`/);
  assert.match(script, /resultDamage\.textContent=healthLoss\?`♥ HEALTH −\$\{healthLoss\}`:''/);
  assert.match(script, /kind:'streak',text:`\$\{state\.winStreak\}-FIGHT WIN STREAK`/);
  assert.match(script, /kind:'sponsor',brand:deal\.brand,cash:deal\.perFight,followers:sponsorFollowers,contractDone/);
  assert.match(script, /class="contract-complete">CONTRACT COMPLETE/);
  assert.match(script, /note\.kind==='streak'\?'🔥 ':''/);
  assert.doesNotMatch(script.match(/function renderResultBonuses\(notes=\[\]\)\{([\s\S]*?)\r?\n\s*\}/)?.[1]||'', /gameIcon/);
  assert.match(css, /\.result-card h2\{font-size:36px/);
  assert.match(css, /\.result-method\{[^}]*font-size:11px/);
  assert.match(css, /\.rewards\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /\.rewardbox\{[^}]*background:transparent/);
  assert.match(css, /\.rewardbox:not\(:last-child\):after\{[^}]*width:1px/);
  assert.match(css, /\.result-actions\{display:grid;grid-template-columns:1fr/);
  assert.match(css, /#resultModal\{[^}]*env\(safe-area-inset-top\)/);
  assert.match(script, /resultTitle'\)\.textContent='YOU WIN'/);
  assert.match(script, /resultTitle'\)\.textContent='YOU LOST'/);
  assert.match(script, /card\.classList\.add\(win\?'fight-win':'fight-loss'\)/);
  assert.match(css, /\.result-card\.fight-loss\{[^}]*border-color:#c84a4a/);
  assert.match(script, /detailsToggle\.textContent='VIEW SCORECARD'/);
  assert.match(script, /open\?'HIDE SCORECARD':'VIEW SCORECARD'/);
});

test('Home exposes an accessible top-25 world rankings modal',()=>{
  assert.match(page,/id="openRankingsBtn"[^>]*>.*TOP 25 RANKINGS/s);
  assert.match(page,/id="rankingsModal"[^>]*aria-hidden="true"/);
  assert.match(page,/role="dialog"[^>]*aria-modal="true"[^>]*aria-labelledby="rankingsTitle"/);
  assert.match(page,/id="rankingsCurrentPosition">—<\/b>/);
  assert.match(page,/id="homeRankText">VIEW RANKINGS<\/span>/);
  assert.match(script,/LOGIC\.rankFighters\(rankingProfiles\(\),sharedChampionship,1000\)/);
  assert.match(script,/YOUR RANK #\$\{homeRanking\.position\}/);
  assert.match(script,/state\.roster\.filter\(opponent=>opponent\.network\)/);
  assert.match(script,/WORLD CHAMPION/);
  assert.doesNotMatch(script,/rankings-you">YOU/);
  assert.match(css,/\.rankings-row\.player\{[^}]*box-shadow:inset 3px 0 #55c8ff/);
  assert.match(script,/closeRankingsBtn/);
});

test('exhausted daily fights hide matchup actions behind a reset state', () => {
  assert.match(script, /const dailyExhausted=fightsLeft<1&&available/);
  assert.match(script, /dailyExhausted\?'NEW FIGHTS AT LOCAL MIDNIGHT'/);
  assert.match(script, /class="fight-btn locked daily-limit" type="button" disabled>UNAVAILABLE/);
  assert.match(script, /\$\{dailyExhausted\?'daily-exhausted':''\}/);
  assert.match(css, /\.opponent\.daily-exhausted\{--fighter-accent:#63778e;--fighter-deep:#172332\}/);
});

test('opponent cards, matchup preview, and results disclose daily repeat XP', () => {
  assert.match(html, /id="tapeXpStatus">FULL XP · FIRST WIN TODAY/);
  assert.match(script, /dailyOpponentWins:\{date:'',wins:\{\}\}/);
  assert.match(script, /state\.dailyOpponentWins\.wins\[o\.key\]=LOGIC\.nextOpponentXpStage\(winsToday,win\)/);
  assert.match(script, /matchupAction=o\.rookieShowcase\?'VIEW SHOWCASE':hasHistory\?'RUN IT BACK':'VIEW MATCHUP'/);
  assert.match(script, /xpSupport=xpTier\.tier==='repeat'\?'50% XP · SAME-DAY RUNBACK'/);
  assert.match(script, /xpStatus\.textContent=xpTier\.tapeLabel/);
  assert.match(script, /rewardXpLabel\.textContent='XP'/);
  assert.match(script, /rewardXpLabel\.title=xpResultLabel/);
  assert.match(script, /opponentFightPurse\(LOGIC\.payoutForOpponent\(o,state\.level\),opponentWinsToday\(o\)\)/);
  assert.match(script, /state\.hype=clamp\(state\.hype\+xpTier\.hypeChange,0,100\)/);
});

test('browser history follows tabs and protects committed fights', () => {
  assert.match(script, /history\.pushState\(entry,''\)/);
  assert.match(script, /window\.addEventListener\('popstate',handleHistoryNavigation\)/);
  assert.match(script, /if\(fightExitGuarded\(\)\)\{writeHistory\('fight','push'\);openForfeitFightDialog\(\);return\}/);
  assert.match(script, /function closeFightPreview\(\)[\s\S]*history\.back\(\)/);
  assert.match(page, /id="forfeitFightModal"[\s\S]*FORFEIT · TAKE THE LOSS/);
});

test('forfeiting a committed fight records a loss without rewards', () => {
  assert.match(script, /fight\.forfeited=true;fight\.winner='opp';fight\.method='FORFEIT'/);
  assert.match(script, /state\.losses\+\+;state\.winStreak=0;if\(!fight\.forfeited\)/);
  assert.match(script, /if\(state\.activeEndorsement&&!fight\.forfeited\)/);
  assert.match(script, /fight\.forfeited\)\{\$\('#resultTitle'\)\.textContent='FIGHT FORFEITED'/);
});

test('fight presentation identifies the favorite and shows unofficial and official scorecards', () => {
  assert.match(page, /class="tape-favorite" id="tapePlayerFavorite" hidden>FAVORITE/);
  assert.match(page, /class="tape-favorite" id="tapeOppFavorite" hidden>FAVORITE/);
  assert.match(script, /playerFavorite=edge>=4,oppFavorite=edge<=-4/);
  assert.match(script, /tapePlayerFavorite'\)\.hidden=!playerFavorite/);
  assert.match(script, /function unofficialScoreLine\(round\)/);
  assert.match(script, /UNOFFICIAL SCORECARD · AFTER ROUND \$\{round\}/);
  assert.match(script, /if\(item\.type==='roundEnd'\)unofficialScoreLine\(item\.round\)/);
  assert.match(page, /<div class="result-section-title">Official Scorecard<\/div>/);
  assert.match(page, /class="official-judges" id="officialJudges" hidden/);
  assert.match(script, /const official=LOGIC\.fightScore\(f\.rounds\)/);
  assert.match(script, /function officialJudgeScores\(f,official=LOGIC\.fightScore\(f\.rounds\)\)/);
  assert.match(script, /f\.method==='SPLIT DECISION'\?\[winningCard,dissent,winningCard\]/);
  assert.match(script, /OFFICIAL JUDGE SCORES/);
  assert.match(script, /judgeScores\.map\(\(card,index\)=>`J\$\{index\+1\} \$\{card\.player\}-\$\{card\.opponent\}`\)/);
  assert.match(script, /class="score-total"/);
  assert.match(script, /<b>OFFICIAL RESULT<\/b>/);
  assert.match(css, /\.tape-favorite\{[^}]*position:absolute/);
  assert.match(css, /\.action-line\.unofficial-score\{[^}]*border-left:3px solid #e6bc56/);
  assert.match(css, /\.round-table \.score-total td\{[^}]*border-top:2px solid #806a35/);
  assert.match(css, /\.official-judge-cards\{[^}]*grid-template-columns:repeat\(3,1fr\)/);
});

test('each round starts behind a timed fallback interstitial', () => {
  assert.match(page, /id="roundInterstitial" aria-hidden="true"/);
  assert.match(page, /class="round-interstitial-icon" id="roundInterstitialIcon">🔔/);
  assert.match(page, /id="roundInterstitialNumber">ROUND 1/);
  assert.match(page, /id="roundInterstitialScore">THE FIGHT STARTS NOW/);
  assert.match(script, /roundIntros:\[\]/);
  assert.match(script, /function showRoundInterstitial\(round,resume\)/);
  assert.match(script, /gameIcon\(`round-intro-\$\{round\}`,'🔔'\)/);
  assert.match(script, /showRoundInterstitial\(item\.round,\(\)=>playFightTimeline\(index\)\)/);
  assert.match(script, /CORNER SCORE/);
  assert.match(script, /2000\*fightSpeed/);
  assert.match(script, /300\*fightSpeed/);
  assert.match(css, /\.round-interstitial\{[^}]*position:absolute;[^}]*z-index:20;[^}]*inset:0/);
  assert.match(css, /\.round-interstitial\.active\{[^}]*opacity:1;[^}]*visibility:visible/);
  assert.match(css, /\.round-interstitial\.leaving\{[^}]*opacity:0/);
  assert.match(css, /\.round-interstitial-icon \.icon-asset\{[^}]*width:100%;[^}]*height:100%;[^}]*object-fit:contain;object-position:center bottom/);
  assert.match(css, /\.round-interstitial-card:has\(\.round-interstitial-icon \.asset-ready\)\{align-self:end\}/);
  assert.match(css, /\.round-interstitial-card:has\(\.round-interstitial-icon \.asset-ready\)>small/);
  assert.match(css, />\.round-interstitial-score\{[^}]*position:absolute/);
  for (const round of [1, 2, 3]) {
    assert.ok(fs.existsSync(`assets/icons/round-intro-${round}.png`), `round ${round} artwork should exist`);
    assert.match(serviceWorker, new RegExp(`\\./assets/icons/round-intro-${round}\\.png\\?v=${appVersion.replaceAll('.', '\\.')}`));
  }
});

test('fighters, opponents, and round plans use Striker and Grappler archetypes', () => {
  assert.match(html, /Fighter Archetype/);
  assert.match(html, /Choose Your Fighter Archetype/);
  for (const id of ['striker', 'grappler']) {
    assert.match(script, new RegExp(`id:'${id}'`));
  }
  for (const name of ['STRIKER', 'GRAPPLER']) {
    assert.match(script, new RegExp(name));
  }
  const opponentArchetypeBlock=script.match(/const opponentArchetypes=\[([\s\S]*?)\];/);
  assert.ok(opponentArchetypeBlock, 'generated-opponent archetypes should be declared');
  assert.deepEqual(
    [...opponentArchetypeBlock[1].matchAll(/id:'([^']+)'/g)].map(match=>match[1]),
    ['striker','grappler']
  );
  assert.match(script, /arch=rosterPick\(opponentArchetypes,seed\)/);
  assert.match(script, /archetype:arch\.id,tendency:arch\.tendency/);
  assert.match(script, /function normalizeOpponentArchetype\(o\)/);
  assert.match(script, /function normalizeMajorArchetype\(value\)/);
  assert.match(script, /\['control','submission','wrestleBox','wrestle','wrestler','grappler'\]\.includes\(value\)\?'grappler'/);
  assert.match(script, /\['pressure','counter','brawler','trickster','technician','endurance','tank','cardio','striker'\]\.includes\(value\)\?'striker'/);
  assert.match(script, /\['striker','grappler'\]\.includes\(s\.fighterStyle\)/);
  assert.match(css, /\.build-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(readme, /two permanent MMA archetypes/);
  assert.match(twoArchetypeMigration, /update public\.cage_profiles[\s\S]*when archetype in \('control','submission','wrestleBox','wrestle','wrestler','grappler'\) then 'grappler'/i);
  assert.match(twoArchetypeMigration, /cage_profiles_archetype check \(archetype in \('striker','grappler'\)\)/i);
  assert.match(twoArchetypeMigration, /if p_archetype not in \('striker','grappler'\)/i);
});

test('round strategy combines matchup and player proficiency', () => {
  assert.match(script, /function planFamiliarity\(styleId,planId\)/);
  assert.match(script, /return styleId===planId\?\.08:-\.06/);
  assert.match(script, /function matchupEdge\(planId,opponentId\)/);
  assert.match(script, /striker:\{striker:0,grappler:\.14\},grappler:\{striker:\.14,grappler:0\}/);
  assert.match(script, /matchupEdge\(planId,tendency\)\+planFamiliarity\(state\.fighterStyle,planId\)/);
  const counterPlans=Object.values(stringsData.corner.matchups);
  assert.equal(counterPlans.length,2);
  assert.equal(new Set(counterPlans.map(choice=>choice.action)).size,2);
  assert.ok(counterPlans.every(choice=>choice.plan&&choice.action&&choice.advice&&choice.description));
  assert.match(script, /responsePlan=planDefs\.find\(plan=>plan\.id===matchup\.plan\)/);
  assert.match(script, /edge=strategyEdge\(responsePlan\.id,opponentStyle\)/);
  assert.match(script, /Your corner sees a strong tactical edge/);
  assert.match(script, /risky switch outside your natural game/);
  assert.match(script, /function techniqueFor\(archetype,roll\)/);
  assert.match(script, /archetype==='grappler'.*roll<\.41\?'takedown'.*roll<\.59\?'jab'.*roll<\.77\?'cross'.*roll<\.90\?'hook':'kick'/);
  assert.match(script, /roll<\.20\?'jab':roll<\.47\?'cross':roll<\.70\?'hook':roll<\.91\?'kick':'takedown'/);
});

test('grapplers can produce tap-out finishes', () => {
  assert.match(script, /landed&&type==='takedown'&&attackingStyle==='grappler'/);
  assert.match(script, /signatureBoost=side==='player'&&state\.fighterStyle==='grappler'\?\.05:0/);
  assert.match(script, /sim\.method='SUBMISSION'/);
  assert.match(script, /TAP!/);
  assert.match(script, /fight\.method==='SUBMISSION'\?`\$\{o\.name\} taps out/);
  assert.match(script, /fight\.method==='SUBMISSION'\?`\$\{o\.name\} forced the tap/);
  assert.match(readme, /finish a fight by tap/);
});

test('persistent health determines starting fight condition and is disclosed before booking', () => {
  assert.match(script, /playerCondition:LOGIC\.startingFightCondition\(state\.health,state\.maxHealth\)/);
  assert.match(script, /LIMITED CLEARANCE.*STARTING CONDITION/);
  assert.match(script, /livePlayerConditionText.*playerCondition/);
  assert.match(logic, /function startingFightCondition\(health,maxHealth\)/);
  assert.match(readme, /Persistent Health determines starting fight Condition/);
});

test('confirmed opponent offense deducts persistent health during the live fight', () => {
  assert.match(script, /healthDamage:side==='opp'\?LOGIC\.liveFightHealthDamage\(\{landed,knockdown:kd\}\):0/);
  assert.match(script, /function applyLiveFightHealthDamage\(item\)/);
  assert.match(script, /state\.health=clamp\(state\.health-requested,1,state\.maxHealth\)/);
  assert.match(script, /fight\.healthLost=Number\(\(\(fight\.healthLost\|\|0\)\+lost\)\.toFixed\(2\)\)/);
  assert.match(script, /resultDamage\.hidden=!healthLoss/);
  assert.match(script, /♥ HEALTH −\$\{healthLoss\}/);
  assert.match(logic, /function liveFightHealthDamage\(\{landed=false,knockdown=false,finish=''\}=\{\}\)/);
  assert.match(readme, /directly removes 1 persistent\s+Health/);
});

test('fighting below full health can cause one visible daily injury', () => {
  assert.match(html, /id="fightInjuryWarning"[^>]*hidden[\s\S]*Fighting when you are not at full strength incurs a small chance of injury\./);
  assert.doesNotMatch(html, /data-recovery-route|GO TO RECOVERY/);
  assert.match(css, /\.fight-injury-warning\{[^}]*border:1px solid #b98624[^}]*background:linear-gradient\(135deg,#3a2b0c,#161006\)/);
  assert.match(css, /\.fight-injury-warning>span\{[^}]*place-items:center[^}]*padding-bottom:2px[^}]*color:#ffc44d[^}]*line-height:1/);
  assert.match(css, /\.action-line\.fight-injury\{[^}]*border-left:4px solid #ff6574/);
  assert.match(script, /fightInjuryWarning'\)\.hidden=state\.health>=state\.maxHealth/);
  assert.doesNotMatch(script, /goToRecovery|data-recovery-route/);
  assert.match(script, /injuryEligible:state\.health<state\.maxHealth&&!currentTrainingInjury\(\)/);
  assert.match(script, /LOGIC\.liveFightInjuryChance\(\{eligible:!!sim\?\.injuryEligible,landed,injured:!!sim\?\.fightInjury\}\)/);
  assert.match(script, /sim\.playerCondition=LOGIC\.fightInjuryCondition\(sim\.playerCondition\)/);
  assert.match(script, /for\(const key of \['power','speed','chin','cardio'\]\)sim\.player\[key\]=LOGIC\.injuredStat\(sim\.player\[key\],true\)/);
  assert.match(script, /state\.trainingInjury=\{id:injury\.id,date:todayKey\(\)\}/);
  assert.match(script, /className='action-line fight-injury'/);
  assert.match(script, /toast\(`INJURY · \$\{injury\.name\.toUpperCase\(\)\} · CONDITION CUT IN HALF`/);
  assert.match(logic, /return eligible&&landed&&!injured\?\.02:0/);
  assert.match(logic, /return injured\?Math\.max\(1,rating-1\):rating/);
  assert.match(readme, /At most one injury can occur per fight; it immediately halves\s+current Condition/);
});

test('major incoming damage triggers the blood-sport particle burst', () => {
  assert.match(html, /id="bloodSportBurst"/);
  assert.match(html, /\.blood-sport-burst\{[^}]*pointer-events:none/);
  assert.match(html, /@keyframes bloodSportParticle/);
  assert.match(script, /function showBloodSportBurst\(item\)/);
  assert.match(script, /majorDamage=LOGIC\.liveFightHealthDamage\(\{landed:true,knockdown:true\}\)/);
  assert.match(script, /Number\(item\?\.healthDamage\)<majorDamage/);
  assert.match(script, /showBloodSportBurst\(item\)/);
  assert.match(readme, /Major incoming damage.*blood-sport particle burst/s);
});

test('planned fights allow nonzero Energy, spend up to one cell, and run without routine pauses', () => {
  assert.match(script, /FIGHT_ROUNDS=fightRule\('fightStructure\.scheduledRounds',3\)/);
  assert.match(script, /FIGHT_ENERGY_COST=fightRule\('energyEconomy\.fightEnergyCost',25\)/);
  assert.match(script, /MINIMUM_ACTION_ENERGY_EXCLUSIVE=fightRule\('energyEconomy\.minimumEnergyToStartConsumingActionExclusive',0\)/);
  assert.match(script, /hasActionEnergy=\(\)=>state\.energy>MINIMUM_ACTION_ENERGY_EXCLUSIVE/);
  assert.match(script, /LOGIC\.bookFight\(state,o\.key,FIGHT_ENERGY_COST,Date\.now\(\),MINIMUM_ACTION_ENERGY_EXCLUSIVE\)/);
  assert.match(script, /\$\('#tapeEnergy'\)\.textContent='ABOVE 0% REQUIRED · UP TO ONE CELL USED'/);
  assert.match(script, /energy_spent:booking\.energySpent/);
  assert.match(readme, /book a fight with any Energy above 0%/i);
  assert.doesNotMatch(script, /chargeFightEnergy|energy_per_round/);
  assert.match(script, /for\(let round=1;round<=FIGHT_ROUNDS&&!fight\.winner;round\+\+\)simulateRound/);
  assert.match(script, /fight\.timeline=fight\.timeline\.filter\(item=>item\.type!=='fightMoment'&&item\.type!=='lastChance'\)/);
  assert.match(readme, /one uninterrupted\s+full simulation/);
});

test('pace and offense settings change exchanges, fatigue, accuracy, damage, and knockdowns', () => {
  assert.match(script, /exchangeCounts\.fastPaceMinimum/);
  assert.match(script, /exchangeCounts\.slowPaceMaximum/);
  assert.match(script, /paceInitiative=fastPace\?clamp\(\(P\.cardio-O\.cardio\)\*\.018\+\(P\.cardio-8\)\*\.008,-\.12,\.14\):0/);
  assert.match(script, /cardioTax=LOGIC\.cardioImbalanceFatigue\(A\)/);
  assert.match(script, /fatigue\.fastPaceMultiplier/);
  assert.match(script, /fatigue\.slowPaceMultiplier/);
  assert.match(script, /offense==='conservative'.*type='jab'/);
  assert.match(script, /aggressiveOffense\?-\.045:\.05/);
  assert.match(script, /aggressiveOffense\?1\.16:\.86/);
  assert.match(script, /aggressiveOffense\?\.045:-\.02/);
});

test('adapt starts in the signature style and progressively uses the matchup response with Focus execution', () => {
  assert.match(script, /function responsePlanId\(tendency\)/);
  assert.match(script, /sim\.gamePlan\?\.tactics==='adapt'&&round>1\?responsePlanId\(sim\.o\.tendency\):signature/);
  assert.match(script, /adaptScale=adapting\?\(round===2\?\.5:1\):1/);
  assert.match(script, /function adaptationModifier\(sim,round\)/);
  assert.match(script, /focus>=95\?\.04:focus>=85\?\.02:focus>=70\?0:focus>=60\?-\.04:-\.08/);
  assert.match(readme, /partial matchup adjustment in Round 2/);
});

test('fight-plan quality depends on scouting and has its greatest impact in evenly matched fights', () => {
  assert.match(logic, /function fightPlanAssessment\(/);
  assert.match(logic, /paceSignal=clamp\(cardioEdge\/4\+\(p\.cardio-8\)\/12,-1,1\)/);
  assert.match(logic, /aggressionSignal=clamp\(\(p\.power-o\.chin\)\/4-\(o\.power-p\.chin\)\/6\+cardioEdge\/10-speedEdge\/10,-1,1\)/);
  assert.match(logic, /closeness=clamp\(1-Math\.abs\(playerAverage-opponentAverage\)\/10,\.35,1\)/);
  assert.match(logic, /grade=score>=\.2\?'EDGE':score<=-\.2\?'EXPOSED':'EVEN'/);
  assert.match(script, /function assessFightPlan\(sim=fight,adaptationScale=\.5\)/);
  assert.match(script, /planAssessment\.modifier,-\.28,\.34/);
  assert.match(script, /FIGHT PLAN EDGE/);
  assert.match(script, /FIGHT PLAN EXPOSED/);
  assert.match(script, /PLAN GRADE · <b class="plan-grade/);
  assert.match(script, /plan_grade:planAssessment\.grade\.toLowerCase\(\)/);
  assert.match(fightPlanScript, /powerTest=fight\.player\.power-fight\.opp\.chin/);
  assert.match(fightPlanScript, /Your Power can test their Chin/);
  assert.match(fightPlanScript, /Your signature style already answers this matchup/);
  assert.match(fightPlanScript, /does not directly answer their style/);
  assert.match(css, /\.action-line\.plan-edge\{/);
  assert.match(css, /\.action-line\.plan-even\{/);
  assert.match(css, /\.action-line\.plan-exposed\{/);
  assert.match(css, /\.result-tape \.plan-grade\.edge\{/);
  assert.match(readme, /Its influence is strongest when[\s\S]*evenly rated/);
});

test('opponent fight actions use a distinct red commentary treatment', () => {
  assert.match(html, /\.action-line\.opp\{[^}]*border-color:#f06a62;[^}]*background:linear-gradient\(90deg,#351418e8,#211116d9\);[^}]*color:#ffd9d5/);
  assert.match(html, /\.action-line\.opp \.stamp\{color:#e68c86\}/);
});

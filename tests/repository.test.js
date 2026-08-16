const fs = require('node:fs');
const zlib = require('node:zlib');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const page = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const html = `${page}\n<style>${css}</style>`;
const readme = fs.readFileSync('README.md', 'utf8');
const strings = fs.readFileSync('strings.js', 'utf8');
const logic = fs.readFileSync('game-logic.js', 'utf8');
const analytics = fs.readFileSync('analytics.js', 'utf8');
const supabaseClient = fs.readFileSync('supabase-client.js', 'utf8');
const cageSocial = fs.readFileSync('cage-social.js', 'utf8');
const script = fs.readFileSync('game.js', 'utf8');
const pwaScript = fs.readFileSync('pwa.js', 'utf8');
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
const manualIdentityMigration = fs.readFileSync('supabase/migrations/20260815143000_manual_fighter_handles.sql', 'utf8');
const twoArchetypeMigration = fs.readFileSync('supabase/migrations/20260815200000_two_major_archetypes.sql', 'utf8');
const championshipSettlementFunction = fs.readFileSync('supabase/functions/settle-cage-championship/index.ts', 'utf8');
const manifest = JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));
const appVersion = JSON.parse(fs.readFileSync('app-version.json', 'utf8')).version;
const packageVersion = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
const contentContext = {};
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
  assert.match(page, new RegExp(`<link rel="stylesheet" href="styles\\.css\\?v=${releaseVersionPattern}">`));
  assert.match(page, new RegExp(`<script src="game-logic\\.js\\?v=${releaseVersionPattern}"><\\/script>\\s*<script src="strings\\.js\\?v=${releaseVersionPattern}"><\\/script>\\s*<script src="analytics\\.js\\?v=${releaseVersionPattern}"><\\/script>\\s*<script src="supabase-client\\.js\\?v=${releaseVersionPattern}"><\\/script>\\s*<script src="cage-social\\.js\\?v=${releaseVersionPattern}"><\\/script>\\s*<script src="game\\.js\\?v=${releaseVersionPattern}"><\\/script>\\s*<script src="pwa\\.js\\?v=${releaseVersionPattern}"><\\/script>`));
  const pageWithoutAllowedInlineScripts = page
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '')
    .replace(/<script>\s*window\.dataLayer[\s\S]*?gtag\('config', 'G-LMT6RLVT5L'\);\s*<\/script>/, '');
  assert.doesNotMatch(pageWithoutAllowedInlineScripts, /<style>|<script>(?!<\/script>)/);
  assert.doesNotThrow(() => new Function(strings));
  assert.doesNotThrow(() => new Function(logic));
  assert.doesNotThrow(() => new Function(analytics));
  assert.doesNotThrow(() => new Function(supabaseClient));
  assert.doesNotThrow(() => new Function(cageSocial));
  assert.doesNotThrow(() => new Function(script));
  assert.doesNotThrow(() => new Function(pwaScript));
  assert.doesNotThrow(() => new Function(serviceWorker));
  assert.match(script, /const LOGIC=globalThis\.CAGE_LOGIC/);
  assert.match(script, /const STRINGS=globalThis\.CAGE_STRINGS/);
  assert.match(script, /const SHARED_FEED=globalThis\.CAGE_SOCIAL/);
  assert.match(serviceWorker, /'\.\/cage-social\.js\?v=/);
});

test('Google Analytics is configured and gameplay tracking is validated and non-fatal', () => {
  assert.match(page, /googletagmanager\.com\/gtag\/js\?id=G-LMT6RLVT5L/);
  assert.match(page, /gtag\('config', 'G-LMT6RLVT5L'\)/);
  assert.match(serviceWorker, /'\.\/analytics\.js\?v=/);

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
    'hustle_completed', 'publicity_completed', 'blackjack_completed', 'cage_dice_completed',
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
  assert.match(page, /<h1 id="landingTitle"><span id="landingTitleLead">BUILD YOUR MMA FIGHTER\.<\/span><br><span class="accent" id="landingTitleAccent">BECOME WORLD CHAMPION\.<\/span><\/h1>/);
  assert.match(page, /Train, hustle, choose fight strategies, earn sponsors, and climb a shared world ranking\./);
  assert.match(page, /<div class="hero-copy"><div class="hero-social"><button type="button" data-go="feed">SOCIAL<\/button><span>FOLLOWERS: <b id="fansText">0<\/b><\/span><\/div>/);
  assert.match(page, /id="landingEnterBtn"[^>]*>PLAY FREE NOW<\/button>/);
  assert.match(page, /NO SIGNUP[\s\S]*NO DOWNLOAD[\s\S]*SAVES AUTOMATICALLY/);
  assert.doesNotMatch(page, /landing-preview|THE PHENOM|PRO RECORD&nbsp;|LOCK IN YOUR FIGHT PLAN/);
  assert.doesNotMatch(page, /class="landing-octagon"/);
  assert.doesNotMatch(serviceWorker, /'\.\/assets\/fighter-silhouette-18\.png'/);
  assert.match(css, /body\.landing-active #app\{visibility:hidden;pointer-events:none\}/);
  assert.match(script, /LOGIC\.careerLandingMode\(state\)/);
  assert.match(script, /CONTINUE CAREER/);
  assert.doesNotMatch(script, /KEEP GRINDING/);
  assert.match(script, /CONTINUE YOUR BUILD/);
  assert.match(script, /'PLAY FREE NOW'/);
  assert.match(script, /trackEvent\('landing_view'/);
  assert.match(script, /trackEvent\('landing_enter'/);
  assert.match(script, /trackEvent\('landing_feature_view',\{career_state:'new'\}\)/);
  assert.match(page, /id="landingFeatures"[\s\S]*BUILD YOUR FIGHTER[\s\S]*PLAN EVERY FIGHT[\s\S]*CHASE THE WORLD TITLE/);
  assert.match(css, /\.landing-page:not\(\[data-mode="new"\]\) \.landing-features\{display:none\}/);
  assert.match(css, /@media \(max-width:699px\)/);
  assert.match(css, /\.landing-page\{position:fixed;[^}]*height:100dvh;[^}]*min-height:100vh;[^}]*overflow-y:auto/);
  assert.match(css, /\.landing-shell\{position:relative;[^}]*min-height:calc\(100dvh - 20px\)/);
  assert.doesNotMatch(css, /\.landing-preview/);
  assert.match(css, /\.landing-content\{grid-column:1;grid-row:2;[^}]*max-width:720px;[^}]*align-items:center;text-align:center/);
  assert.match(css, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /@media \(max-width:767px\) and \(max-height:860px\)/);
  assert.match(css, /\.tape-purse strong,\.tape-breakdown-total strong\{font-family:Impact,Haettenschweiler,"Arial Narrow Bold","Roboto Condensed",sans-serif;[^}]*font-weight:900/);
});

test('landing championship proof is non-blocking across loaded, vacant, and offline states', () => {
  assert.match(page, /id="landingChampionPanel"[^>]*aria-live="polite"/);
  assert.match(page, /One shared world championship/);
  assert.match(script, /function loadLandingChampionship\(\)/);
  assert.match(script, /SHARED_FEED\.loadChampionship\(\)/);
  assert.match(script, /LOGIC\.landingChampionshipProof\(sharedChampionship,landingChampionshipLoaded,landingChampionshipUnavailable\)/);
  assert.match(logic, /successful title defense/);
  assert.match(logic, /heading:'THE BELT IS VACANT'/);
  assert.match(logic, /heading:'TITLE UPDATE OFFLINE'/);
  assert.match(script, /catch\{landingChampionshipLoaded=true;landingChampionshipUnavailable=true\}/);
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
  assert.match(supabaseClient, /async function authenticatedRequest\(path,options=\{\}\)/);
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
  assert.match(script, /SHARED_FEED\.loadProfiles\(100\)/);
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
  assert.match(script, /profile\.id===state\.socialProfileId/);
  assert.match(script, /REAL CAGE GRIND FIGHTER|fighterBioAvatar/);
  assert.match(css, /\.feed-avatar\.fighter-photo/);
});

test('Supabase accepts all forty permanent fighter avatars', () => {
  assert.match(expandedAvatarMigration, /add constraint cage_profiles_fighter_avatar/i);
  assert.match(expandedAvatarMigration, /fighter-\(0\[1-9\]\|\[123\]\[0-9\]\|40\)/);
  assert.match(expandedAvatarMigration, /create or replace function public\.claim_cage_identity/i);
  assert.match(expandedAvatarMigration, /create or replace function public\.sync_cage_profile/i);
  assert.equal((expandedAvatarMigration.match(/\[123\]\[0-9\]/g)||[]).length,3);
});

test('completed careers receive a native install offer and one verified collectible reward', async () => {
  assert.match(page, /id="installOffer" hidden/);
  assert.match(page, /TAKE CAGE GRIND WITH YOU/);
  assert.match(page, /id="installGameBtn"[^>]*>INSTALL GAME · FREE DROP<\/button>/);
  assert.match(css, /\.install-offer\[hidden\]\{display:none\}/);
  assert.match(css, /\.install-offer\{width:100%;max-width:none;grid-template-columns:58px minmax\(0,1fr\) minmax\(240px,32%\)/);
  assert.match(css, /\.install-offer button\{grid-column:3;grid-row:1/);
  assert.match(script, /installDetected:false,installRewardClaimed:false/);
  assert.match(script, /installOffer\.hidden=!ready\|\|state\.installDetected\|\|state\.installRewardClaimed/);
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
  const viewport = html.match(/<meta name="viewport" content="([^"]+)"/i)?.[1] || '';
  assert.doesNotMatch(viewport, /user-scalable\s*=\s*no/i);
  assert.doesNotMatch(viewport, /maximum-scale\s*=\s*1/i);
});

test('desktop breakpoint expands the same game into a persistent workspace', () => {
  assert.match(html, /@media \(min-width:1100px\)\{/);
  assert.match(html, /#app\{width:min\(100vw,1440px\);height:100dvh/);
  assert.match(html, /\.bottomnav\{[^}]*width:132px[^}]*grid-template-rows:repeat\(6,74px\)/);
  assert.match(html, /\.resource-hud\{left:132px;top:84px;height:66px[^}]*flex-direction:row/);
  assert.match(html, /#careerGameContent\{display:grid;grid-template-columns:minmax\(420px,1\.15fr\) minmax\(440px,1fr\)/);
  assert.match(html, /\.screen\[data-screen="hustle"\] \.daily-reset-clock,\.screen\[data-screen="hustle"\] \.full-time-fighter-note\{grid-column:1\/-1\}/);
  assert.match(html, /\.opponent-grid\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(html, /\.screen\[data-screen="gear"\] \.gear-grid\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(html, /\.live-card\{display:grid;grid-template-columns:minmax\(0,1\.5fr\) minmax\(340px,\.8fr\)/);
  assert.match(html, /\.screen\[data-screen="hustle"\]\.active\{[^}]*grid-auto-rows:max-content/);
  assert.match(html, /\.screen\[data-screen="hustle"\] \.card\{[^}]*min-height:max-content/);
  assert.match(readme, /Responsive desktop interface/);
});

test('matchup and hustle cards keep consistent full-bleed surfaces', () => {
  assert.match(css, /\.tape-player-art\{height:100%;object-fit:cover;object-position:center top\}/);
  assert.match(css, /\.career-card \.card-title\{background:linear-gradient\(#17283f,#0a111d\);border-bottom-color:#203a5d\}/);
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

test('save recovery and one-time league migration remain enabled', () => {
  assert.match(script, /cage-warrior-save-backup-v1/);
  assert.match(script, /const bootstrapPast=!state\.leagueInitialized&&state\.roster\.length===0/);
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

test('rematch, taunt, and exhausted-gig states reflect actual state without masking locks', () => {
  assert.match(script, /const hasHistory=\(o\.meetings\|\|0\)>0/);
  assert.match(script, /hasHistory\?`Current level \$\{o\.tier\} · rematch payout/);
  assert.match(script, /:'SEE MATCHUP'/);
  assert.match(script, /rematch=available&&\(o\.winsVsPlayer\|\|0\)>0/);
  assert.match(script, /gameIcon\('rematch','⚡'\).*REMATCH/);
  assert.match(script, /rematch available':tauntable\?', taunt available'/);
  assert.match(script, /data-taunt-key="\$\{o\.key\}"/);
  assert.match(script, /function tauntOpponent\(key\)/);
  assert.match(html, /\.rematch-banner\{[^}]*left:7px;right:7px;bottom:8px[^}]*font-size:8\.5px/);
  assert.match(script, /limited&&unlocked\?'gig-unavailable'/);
  assert.match(script, /availability=!unlocked\?requirementText\(a\):limited\?'NO GIGS LEFT'/);
  assert.doesNotMatch(html, /\.action\.future\.gig-unavailable:after/);
});

test('opponents have pro records, persistent rival history, and consent-aware rematches', () => {
  assert.match(script, /function payoutForOpponent\(o\)\{return LOGIC\.payoutForOpponent\(o,state\.level\)\}/);
  assert.match(script, /recordInitialized:true/);
  assert.match(script, /<span class="opp-record">PRO \$\{o\.wins\}-\$\{o\.losses\}<\/span>/);
  assert.match(script, /hasHistory\?`<div class="opp-history">H2H YOU \$\{o\.lossesToPlayer\|\|0\}-\$\{o\.winsVsPlayer\|\|0\}<\/div>`:'<div class="opp-history">FIRST MEETING<\/div>'/);
  assert.doesNotMatch(script, /<h3>\$\{o\.name\}<\/h3><p>\$\{o\.tag\}<\/p>/);
  assert.match(script, /function opponentGroup\(o\)\{return LOGIC\.opponentGroup/);
  assert.match(script, /function opponentAvailable\(o\)/);
  assert.match(script, /TAUNT<br><small>FOR REMATCH<\/small>/);
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
  assert.ok(stringsData.social.interactions.props.messages.length >= 5);
  assert.match(script, /STRINGS\.fightCommentary\[landed\?'hit':'miss'\]\[type\]/);
  assert.match(script, /STRINGS\.social\.account\[0\]/);
  assert.match(script, /definitions=STRINGS\.social\.interactions/);
  assert.doesNotMatch(script, /snaps a jab through the guard|First follow\. Let’s see where this goes/);
});

test('career identity keeps hometown informational and uses one shared real-player championship', () => {
  for (const city of ['PHOENIX', 'LOS ANGELES', 'CHICAGO', 'NEW YORK', 'MIAMI', 'HOUSTON', 'CLEVELAND', 'SEATTLE', 'NEW ORLEANS', 'HAWAII']) {
    assert.match(script, new RegExp(`name:'${city}'`));
  }
  for (const region of ['SOUTHWEST', 'WEST COAST', 'MIDWEST', 'NORTHEAST', 'SOUTHEAST', 'GULF COAST', 'GREAT LAKES', 'PACIFIC NORTHWEST', 'DEEP SOUTH', 'PACIFIC ISLANDS']) {
    assert.match(script, new RegExp(`region:'${region}'`));
  }
  assert.match(html, /Fighting Out Of/);
  assert.match(script, /function chooseCity\(id\)/);
  assert.match(script, /function championshipOpponent\(\)/);
  assert.match(script, /globalChampionship:true,titleName:'CAGE GRIND WORLD CHAMPIONSHIP'/);
  assert.match(script, /delete s\.milestones/);
  assert.doesNotMatch(script, /const milestoneDefs=/);
  assert.doesNotMatch(script, /function awardTitle\(/);
  assert.match(cageSocial, /loadChampionship/);
  assert.match(supabaseClient, /get_cage_championship/);
  const normalize = script.match(/function normalizeState\(parsed\)\{([\s\S]*?)\n\s*\}/)?.[1] || '';
  assert.doesNotMatch(normalize, /fighterCities/);
  const careerRender = script.match(/function renderCareer\(\)\{([\s\S]*?)\n\s*\}/)?.[1] || '';
  assert.match(careerRender, /requiredLevel=Math\.max\(5,Number\(champ\.champion_level\)\|\|5\)/);
  assert.match(careerRender, /YOU'LL NEED TO REACH LEVEL \$\{requiredLevel\} TO CHALLENGE FOR THE BELT/);
  assert.match(careerRender, /FIND \$\{championHandle\} ON THE FIGHT SELECTIONS PAGE/);
  assert.match(serviceWorker, /\.\/assets\/icons\/title-world\.png\?v=2\.5\.90/);
  assert.match(cageChampionshipMigration, /viewer\.level>=champion\.level/);
});

test('sanctioned championship bouts are daily, non-repeatable, and automatic for the champion', () => {
  assert.match(sanctionedChampionshipMigration, /one_world_bout_per_day/);
  assert.match(sanctionedChampionshipMigration, /World Championship already had its sanctioned bout today/);
  assert.match(sanctionedChampionshipMigration, /No championship rematches are allowed between these fighters/);
  assert.match(sanctionedChampionshipMigration, /v_player_is_champion/);
  assert.match(script, /sharedChampionship\?\.is_champion&&o\.network/);
  assert.match(script, /beginChampionshipBout\(sharedChampionship\?\.is_champion\?o\.sourceProfileId:null\)/);
  assert.match(championshipSettlementFunction, /Only the fighter who started this bout can submit its result/);
  assert.match(rematchVisibilityMigration, /rematch_blocked boolean/);
  assert.match(rematchVisibilityMigration, /prior\.champion_id=champion\.id[\s\S]*prior\.challenger_id=viewer\.id[\s\S]*prior\.status in \('challenger_won','champion_defended'\)/);
  assert.match(script, /rematchBlocked:sharedChampionship\.rematch_blocked===true/);
  assert.match(script, /status==='blocked'\?'NO REMATCH<br><small>TITLE SHOT USED<\/small>'/);
  assert.match(script, /TITLE SHOT USED · NO CHAMPIONSHIP REMATCHES/);
  assert.match(script, /No championship rematches are allowed against this champion\./);
  assert.match(rematchVisibilityMigration, /update public\.cage_feed_posts[\s\S]*author_handle='cagegrindceo',post_kind='ceo'[\s\S]*defended the Cage Grind World Championship against/);
  assert.match(rematchVisibilityMigration, /create trigger cage_title_defense_ceo_voice[\s\S]*before insert on public\.cage_feed_posts/);
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
  assert.match(html, /id="lockFighterNameBtn"[^>]*>READY<\/button>[\s\S]*id="newFighterNameBtn"/);
  assert.match(html, /id="newFighterNameBtn"[^>]*>[\s\S]*data-icon-name="shuffle-name"[\s\S]*<span>SHUFFLE<\/span><\/button>/);
  assert.match(html, /id="manualFighterNameBtn"[^>]*>MANUAL ENTRY<\/button>/);
  assert.match(html, /id="manualFighterNameInput"[^>]*minlength="3"[^>]*maxlength="32"[^>]*pattern="\[A-Za-z\]\[A-Za-z0-9_\]\{2,31\}"[^>]*hidden/);
  assert.match(html, /cannot be edited after you press Ready/i);
  assert.match(script, /version:22,name:'ROOKIE',nameLocked:false/);
  assert.match(script, /function randomIdentitySuggestion\(\)/);
  assert.match(script, /LOGIC\.randomFighterIdentity\(pools\.openers,pools\.descriptors,pools\.cityCode\)/);
  assert.match(script, /if\(coreReady&&!state\.nameLocked&&!identitySuggestion\)identitySuggestion=randomIdentitySuggestion\(\)/);
  assert.match(script, /state\.fighterStyle=id;identitySuggestion=randomIdentitySuggestion\(\)/);
  assert.match(script, /function identityClaimCandidates\(preferred\)/);
  assert.match(script, /function manualIdentityName\(value\)[\s\S]*\^\[A-Za-z\]\[A-Za-z0-9_\]\{2,31\}\$/);
  assert.match(script, /const candidates=manualRequested\?\[requested\]:identityClaimCandidates\(requested\)/);
  assert.match(script, /state\.nameLocked=true;state\.socialProfileId=profile\.id/);
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
  assert.doesNotMatch(supabaseClient, /fighter_name|author_name|target_name/);
  assert.match(script, /handle=normalizeIdentityName\(profile\?\.handle\)[\s\S]{0,700}\|\|!handle\|\|!name\|\|!avatar\|\|!arch/);
  assert.doesNotMatch(script, /\[A-Za-z0-9\]\{2,31\}_\[0-9\]/);
  assert.match(script, /\$\('#careerFollowersText'\)\.textContent=fmt\(state\.fans\)/);
});

test('identity names share substantial CapitalCase color and descriptor pools', () => {
  const pools = stringsData.fighterIdentity;
  assert.equal(pools.colors.length, 52);
  assert.equal(pools.origins.length, 24);
  assert.equal(pools.weather.length, 23);
  assert.equal(pools.animals.length, 35);
  assert.equal(pools.combat.length, 28);
  assert.ok(pools.colors.includes('Dark'));
  assert.ok(pools.colors.includes('Light'));
  assert.ok(pools.colors.includes('Turbo'));
  assert.ok(pools.colors.includes('Rebel'));
  assert.ok(pools.origins.includes('American'));
  assert.ok(pools.origins.includes('Mexican'));
  assert.ok(pools.origins.includes('Russian'));
  assert.ok(pools.weather.includes('Wind'));
  assert.ok(pools.weather.includes('Pressure'));
  assert.ok(pools.animals.includes('Mastodon'));
  assert.ok(pools.animals.includes('Raccoon'));
  assert.ok(pools.animals.includes('Dragon'));
  assert.ok(pools.animals.includes('Goat'));
  assert.ok(pools.combat.includes('Hammer'));
  assert.ok(pools.combat.includes('Bomber'));
  assert.ok(pools.combat.includes('Fist'));
  assert.ok(pools.combat.includes('Claw'));
  assert.ok(pools.combat.includes('Monster'));
  assert.ok(pools.combat.includes('Demon'));
  assert.ok(pools.combat.includes('Devil'));
  assert.ok(pools.combat.includes('Destroyer'));
  assert.ok(!pools.weather.includes('Gale'));
  assert.deepEqual(
    JSON.parse(JSON.stringify(pools.cityCodes)),
    {phoenix:'PHX','los-angeles':'LAX',chicago:'CHI','new-york':'NYC',miami:'MIA',houston:'HOU',cleveland:'CLE',seattle:'SEA','new-orleans':'NOLA',hawaii:'HNL'}
  );
  const openers = [...pools.colors, ...pools.origins];
  const descriptors = [...pools.weather, ...pools.animals, ...pools.combat];
  assert.equal(openers.reduce((total, opener) => total + descriptors.filter(descriptor => descriptor !== opener).length, 0), 6534);
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
});

test('career opponent roster uses proportional two-across collectible fighter cards', () => {
  assert.match(html, /\.opponent-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(html, /\.opponent\{[^}]*aspect-ratio:2\/3/);
  assert.match(html, /\.opp-sprite\{[^}]*width:100%;height:100%;object-fit:contain;object-position:center bottom/);
  assert.match(html, /\.opp-face\{[^}]*color-mix\(in srgb,var\(--fighter-accent\) 72%,#d9f4ff\)/);
  assert.match(html, /\.opp-sprite\{[^}]*filter:invert\(\.1\)[^}]*drop-shadow/);
  assert.match(html, /\.opponent-card \.tape-card-portrait\{background:radial-gradient\(ellipse at 50% 42%,#ffad9d/);
  assert.match(script, /const fighterSilhouettes=Array\.from\(\{length:24\},\(_,i\)=>`assets\/fighter-silhouette-\$\{i\+1\}\.png`\)/);
  assert.match(script, /function silhouetteForOpponent\(o\)/);
  assert.match(script, /<img class="opp-sprite" src="\$\{silhouette\}"/);
  assert.match(script, /\$\('#tapeOppSprite'\)\.src=silhouetteForOpponent\(f\.o\)/);
  assert.doesNotMatch(script, /background-image:url\(\$\{silhouetteSheet\}\)/);
  assert.match(html, /Career Opponents/);
  assert.doesNotMatch(html, /The Living Roster/);
  assert.match(script, /<article class="opponent \$\{status\} \$\{status==='blocked'\?'locked':''\} \$\{o\.globalChampionship\?'champion':''\} \$\{o\.network\?'network':''\} \$\{rematch\?'rematch':''\} \$\{dailyExhausted\?'daily-exhausted':''\}" data-card-flip="true"/);
  assert.match(html, /\.opponent-flip\{[^}]*transform-style:preserve-3d/);
  assert.match(html, /\.opponent\.flipped \.opponent-flip\{transform:rotateY\(180deg\)\}/);
  assert.match(script, /class="opponent-side opponent-front"/);
  assert.match(script, /class="opponent-side opponent-back"/);
  assert.match(script, /TAP CARD FOR DETAILS/);
  assert.match(script, /TAP CARD TO RETURN/);
  assert.match(script, /function toggleOpponentCard\(card\)/);
  assert.match(script, /front\.setAttribute\('aria-hidden',String\(flipped\)\)/);
  assert.match(script, /button\.tabIndex=flipped\?-1:0/);
  assert.match(script, /flip&&!e\.target\.closest\('button'\)/);
  assert.match(script, /data-card-flip.*e\.key==='Enter'/s);
  assert.match(script, /\['title','WORLD CHAMPIONSHIP','ONE SANCTIONED BOUT DAILY · NO REMATCHES'\]/);
  assert.match(script, /:'SEE MATCHUP'/);
  assert.match(script, /rivals=all\.filter\(o=>opponentGroup\(o\)==='rival'\)/);
  assert.match(script, /\['rival','PAST RIVALS','TAUNT THEM INTO A REMATCH'\]/);
  assert.match(script, /active=state\.roster\.filter\(o=>o\.tier===tier&&!o\.network&&\(o\.lossesToPlayer\|\|0\)===0\)/);
  assert.match(script, /if\(o\.globalChampionship\)settleChampionshipResult/);
  assert.match(script, /const openRosterGroups = new Set\(\['title','current'\]\)/);
  assert.match(script, /data-roster-toggle="\$\{status\}" aria-expanded="\$\{expanded\}"/);
  assert.match(script, /function toggleRosterGroup\(button\)/);
  assert.match(script, /grid\.hidden=!next/);
  assert.match(script, /rosterToggle=e\.target\.closest\('\[data-roster-toggle\]'\)/);
  assert.match(html, /\.opponent-grid\[hidden\]\{display:none\}/);
});

test('career fights use a reversible tale-of-the-tape preview before locker-room planning', () => {
  assert.match(html, /id="tapePurse"/);
  assert.match(html, /class="tape-fighter-card player-card"/);
  assert.match(html, /class="tape-fighter-card opponent-card"/);
  assert.match(html, /id="tapePurseToggle"[^>]*aria-controls="tapeBreakdown"/);
  assert.match(html, /id="tapePurse">\$0<\/strong><small class="tape-purse-hint">TAP FOR BREAKDOWN/);
  assert.match(html, /id="tapeBreakdown" hidden/);
  assert.match(html, /role="dialog" aria-modal="true"/);
  assert.match(html, /class="tape-energy" id="tapeEnergy">18 REQUIRED · 6 PER STARTED ROUND/);
  assert.match(html, /YOUR LOCKER-ROOM PLAN CONTROLS THE ENTIRE FIGHT/);
  assert.match(html, /id="tapeBackBtn"[^>]*>GO BACK</);
  assert.match(html, /id="tapeFightBtn"[^>]*>SET FIGHT PLAN<\/button>/);
  assert.match(html, /id="tapeTitleBout" hidden>[\s\S]*WORLD TITLE BOUT/);
  assert.match(html, /id="tapeTitleBout" hidden>[\s\S]*data-icon-name="title-world"/);
  assert.match(html, /id="tapeAttributes" aria-label="Fighter attribute comparison"/);
  assert.match(script, /WORLD TITLE BOUT · 3 ROUNDS/);
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
  assert.match(script, /\$\('#tapeOppTag'\)\.textContent=f\.o\.tag\|\|'UNKNOWN STYLE'/);
  assert.doesNotMatch(script, /\$\{rivalry\?'🔥 RIVAL · ':''\}\$\{o\.tag\}/);
  assert.doesNotMatch(script, /\$\{o\.tag\} · PRO \$\{o\.wins\}-\$\{o\.losses\}/);
  assert.match(script, /function beginFightPlan\(\)/);
  assert.match(script, /function confirmFightPlan\(\)/);
  assert.match(script, /beginFightPlan\(\)/);
  assert.match(css, /\.live-card\{[^}]*background-image:url\("assets\/cage-grind-octagon-transparent\.png\?v=2\.5\.90"\)[^}]*background-position:center 62%/);
  assert.match(css, /\.live-card\.decision-active\{[^}]*background-image:linear-gradient\(#030914f6,#030914f6\),url\("assets\/cage-grind-octagon-transparent\.png\?v=2\.5\.90"\)[^}]*background-position:center,center 62%/);
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
  assert.match(script, /<span class="tendency opp-style">\$\{safeStyle\}<\/span>/);
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
  assert.match(script, /state\.fightPlanPreference=Object\.assign\(\{\},fight\.gamePlan\);saveState\(\)/);
  assert.match(script, /fight\.gamePlan=Object\.assign\(\{\},state\.fightPlanPreference\)/);
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
  assert.match(script, /fight\.focusBase=rint\(75,90\)/);
  assert.match(script, /quiet=Math\.random\(\)<\.5/);
  assert.match(script, /function focusTextMessages\(\)/);
  assert.match(script, /function drawFocusText\(messages\)/);
  assert.match(script, /state\.focusTextDeck=deck/);
  assert.match(script, /state\.lastFocusTextId=id/);
  assert.match(script, /message:drawFocusText\(messages\)/);
  assert.match(script, /data-focus-choice="read"/);
  assert.match(script, /data-focus-choice="ignore"/);
  assert.match(script, /class="focus-choice safe" data-focus-choice="read"/);
  assert.match(script, /class="focus-choice risk" data-focus-choice="ignore"/);
  assert.match(script, /class="focus-kicker">TEXT FROM \$\{contact\.name\}<\/span><h2>INCOMING TEXT<\/h2>/);
  assert.match(script, /choice==='read'\?'MESSAGE OPENED':'MESSAGE LEFT UNREAD'/);
  assert.match(script, /<span class="focus-kicker">\$\{resultKicker\}<\/span><h2>\$\{resultTitle\}<\/h2>/);
  assert.match(script, /class="focus-option-hint">Open the message/);
  assert.match(script, /class="focus-option-hint">Leave it unread/);
  assert.match(script, /data-focus-choice="music"/);
  assert.match(script, /Math\.random\(\)<\.20/);
  assert.match(script, /fight\.focus\+=rint\(4,10\)/);
  assert.match(script, /fight\.focus=Math\.max\(fight\.focus,92\)/);
  assert.match(script, /fight\.focus=clamp\(Math\.round\(fight\.focus\),50,100\)/);
  assert.match(script, /function fightFocusModifier\(sim=fight\)/);
  assert.match(script, /chance\+=edge\*\.72\+focusMod/);
  assert.match(script, /fightFocusModifier\(fight\)/);
  assert.match(script, /beginFocusSequence\(\)/);
  assert.match(script, /showFightStage\('liveStage'\).*beginPlannedFight\(\)/);
  assert.match(page, /FINAL MOMENTS BEFORE THE WALKOUT · FOCUS <b id="focusValue">82%<\/b>/);
  assert.doesNotMatch(page, /FIGHT-ONLY STAT/);
  assert.match(page, /id="focusStage"[\s\S]*class="fight-plan-locker-room"[\s\S]*class="fight-plan-locker-art" src="assets\/focus-locker-room\.jpg\?v=2\.5\.90"/);
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
  assert.match(css, /\.focus-option \.focus-choice\{[^}]*width:100%;[^}]*min-height:43px/);
  assert.match(css, /\.focus-option-hint\{[^}]*color:#8795a2/);
  assert.match(script, /resultKicker=isQuiet\?'LOCKER ROOM · FINAL PREPARATION'/);
  assert.match(script, /\$\{before\}% → \$\{fight\.focus\}% · \$\{change\}/);
  assert.match(serviceWorker, /\.\/assets\/focus-locker-room\.jpg\?v=2\.5\.90/);
  assert.match(serviceWorker, /\.\/assets\/contact-mom\.jpg\?v=2\.5\.90/);
  assert.match(serviceWorker, /\.\/assets\/contact-wife\.jpg\?v=2\.5\.90/);
  assert.match(serviceWorker, /\.\/assets\/contact-brother-tommy\.png\?v=2\.5\.90/);
  assert.match(serviceWorker, /\.\/assets\/contact-agent-carl\.png\?v=2\.5\.90/);
  assert.match(serviceWorker, /\.\/assets\/contact-grandma\.jpg\?v=2\.5\.90/);
  assert.match(readme, /fight-only \*\*Focus\*\* rating from 75–90%/);
});

test('gear collection shows owned quantities and rarity above icons', () => {
  assert.match(script, /owned=gearItems\.filter\(g=>gearCount\(g\.id\)>0\)/);
  assert.match(html, /\.gear\.collectible-card\{[^}]*aspect-ratio:2\/3[^}]*grid-template-rows:/);
  assert.match(html, /\.gear-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(script, /rarity-card-\$\{rarity\.toLowerCase\(\)\}/);
  assert.match(script, /<div class="gear-hero"><span class="gear-flair"><\/span><span class="equip-burst"><\/span><div class="gear-icon">/);
  assert.match(html, /\.collectible-card \.gear-icon\{[^}]*width:82%[^}]*font-size:clamp\(48px,15vw,74px\)/);
  for (const rarity of ['common', 'rare', 'epic', 'legendary']) assert.match(html, new RegExp(`\\.rarity-${rarity}\\{`));
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
  assert.equal(avatars.length, 40);
  assert.equal(new Set(avatars.map(avatar => avatar.asset)).size, 40);
  assert.equal(new Set(avatars.map(avatar => JSON.stringify(avatar.stats))).size, 40);
  for (const avatar of avatars) {
    const values = ['power', 'speed', 'chin', 'cardio'].map(key => avatar.stats[key]);
    assert.ok(values.every(value => Number.isInteger(value) && value >= 2 && value <= 8));
    assert.equal(values.reduce((sum, value) => sum + value, 0), 20);
    assert.ok(fs.existsSync(avatar.asset), `${avatar.asset} should exist`);
    assert.match(avatar.asset, /^assets\/fighter-avatar-\d{2}\.png$/);
    const png = fs.readFileSync(avatar.asset);
    assert.equal(png.subarray(1, 4).toString(), 'PNG', `${avatar.asset} must be a PNG`);
    assert.equal(png[25], 6, `${avatar.asset} must retain an RGBA alpha channel`);
  }
  assert.match(html, /\.avatar-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(html, /\.avatar-card\{[^}]*aspect-ratio:2\/3/);
  assert.match(css, /\.avatar-card img\{[^}]*background:radial-gradient/);
  assert.match(css, /\.avatar-card:hover,\.avatar-card:focus-visible\{/);
  assert.match(script, /function validFighterAllocation\(stats\)/);
  assert.match(script, /every\(k=>Number\.isInteger\(stats\[k\]\)&&stats\[k\]>=2&&stats\[k\]<=8\)/);
  assert.match(script, /===20/);
  assert.equal(fs.readdirSync('assets').filter(name => /^fighter-avatar-\d{2}\.png$/.test(name)).length, 40);
  assert.equal(fs.readdirSync('assets').filter(name => /^fighter-avatar-\d{2}\.jpe?g$/.test(name)).length, 0);
  const silhouetteAssets = fs.readdirSync('assets').filter(name => /^fighter-silhouette-\d+\.png$/.test(name));
  assert.equal(silhouetteAssets.length, 24);
  for (let index = 1; index <= 24; index += 1) {
    assert.ok(fs.existsSync(`assets/fighter-silhouette-${index}.png`), `fighter silhouette ${index} should exist`);
  }
  assert.equal(fs.readdirSync('assets').filter(name => /^grok_image_/i.test(name)).length, 0);
  assert.match(script, /<span class="avatar-total">SELECT<\/span>/);
  assert.doesNotMatch(script, /SELECT · 20 POINTS/);
});

test('home career choices use artwork cards with explicit bottom actions', () => {
  assert.ok(fs.existsSync('assets/home-fight.png'));
  assert.ok(fs.existsSync('assets/home-training.png'));
  assert.ok(fs.existsSync('assets/home-hustle.png'));
  assert.ok(fs.existsSync('assets/home-gear.png'));
  assert.match(html, /<article class="choice red"><h3>BIG WIN POTENTIAL<\/h3>[\s\S]*?src="assets\/home-fight\.png"[\s\S]*?<button class="choice-action" data-go="fight">TAKE A FIGHT<\/button><\/article>/);
  assert.match(html, /<article class="choice"><h3>GUARANTEED GROWTH<\/h3>[\s\S]*?src="assets\/home-training\.png"[\s\S]*?<button class="choice-action" data-go="train">HIT THE GYM<\/button><\/article>/);
  assert.match(html, /<article class="choice hustle"><h3>FUND THE DREAM<\/h3>[\s\S]*?src="assets\/home-hustle\.png"[\s\S]*?<button class="choice-action" data-go="hustle">HUSTLE<\/button><\/article>/);
  assert.match(html, /<article class="choice legacy"><h3>BUILD YOUR LEGACY<\/h3>[\s\S]*?src="assets\/home-gear\.png"[\s\S]*?<button class="choice-action" data-go="gear">VIEW GEAR<\/button><\/article>/);
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
  assert.match(html, /\.choice p\{[^}]*font-size:11\.5px;line-height:1\.35/);
  assert.doesNotMatch(page, /<article class="choice gear">/, 'home card must not inherit collectible gear-card typography');
});

test('rendered icons support stable per-file image overrides with fallbacks', () => {
  assert.ok(fs.existsSync('assets/icons/README.md'));
  assert.match(script, /const ICON_ASSET_PATH = 'assets\/icons\/'/);
  assert.match(script, /const ICON_ASSET_VERSION = '2\.5\.90'/);
  assert.match(script, /function gameIcon\(name,fallback,extension='png'\)/);
  assert.match(script, /src="\$\{ICON_ASSET_PATH\}\$\{name\}\.\$\{extension\}\?v=\$\{ICON_ASSET_VERSION\}"/);
  assert.match(script, /classList\.add\('asset-ready'\)/);
  assert.match(script, /onerror="this\.remove\(\)"/);
  assert.match(script, /gameIcon\(a\.id,a\.icon\)/);
  assert.match(script, /gameIcon\(d\.id,d\.icon\)/);
  assert.match(script, /gameIcon\(g\.iconName\|\|g\.id,g\.icon,g\.assetExt\)/);
  assert.match(script, /gameIcon\(item\.iconName\|\|item\.id,item\.icon,item\.assetExt\)/);
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
  const heroPosition = html.indexOf('<div class="hero">', homeStart);
  assert.ok(tickerPosition > homeStart && tickerPosition < identityPosition && tickerPosition < heroPosition, 'ticker should lead the unlocked Home screen');
  assert.match(html.slice(homeStart, identityPosition), /class="card career-after-setup"/);
  assert.ok(stringsData.ticker.some(line => /round costs climb with your career/i.test(line)));
  assert.ok(stringsData.ticker.some(line => /20 health before a bout/.test(line)));
  assert.match(script, /const tickerLines=STRINGS\.ticker/);
  const ticker = stringsData.ticker.join('\n');
  assert.match(ticker, /Old names pay half/);
  assert.match(ticker, /Taunt a past rival/);
  assert.match(ticker, /Fourth win without a CEO gift/);
  assert.match(ticker, /perk still only counts once/);
  assert.match(ticker, /\$35 plus \$20 per level/);
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
  const hudStart = html.indexOf('<section class="resource-hud"');
  const mainStart = html.indexOf('<main class="main">');
  for (const id of ['powerStat', 'speedStat', 'chinStat', 'cardioStat']) {
    const position = html.indexOf(`id="${id}"`);
    assert.ok(position > hudStart && position < mainStart, `${id} should live in the persistent HUD`);
  }
  assert.match(html, /\.main\{[^}]*top:calc\(150px \+ var\(--safe-top\)\)/);
  assert.match(html, /\.resource-hud\[hidden\],\.bottomnav\[hidden\]\{display:none\}/);
  assert.doesNotMatch(html, /homeAttributes|trainStatGrid/);
});

test('fighter stats always display with two decimal places', () => {
  assert.match(script, /const formatStat = value => Number\.isFinite\(Number\(value\)\)\?Number\(value\)\.toFixed\(2\):'0\.00'/);
  assert.match(script, /\$\('#'\+k\+'Stat'\)\.textContent=formatStat\(value\)/);
  assert.match(script, /Power \$\{formatStat\(a\.stats\.power\)\}/);
  assert.match(script, /<small>PWR<\/small><b>\$\{formatStat\(o\.power\)\}<\/b>/);
  assert.match(script, /playerValueEl\.textContent=formatStat\(playerValue\)/);
  assert.match(script, /\$\{formatStat\(f\.player\.power\)\}\/\$\{formatStat\(f\.player\.speed\)\}/);
  for (const id of ['powerStat', 'speedStat', 'chinStat', 'cardioStat']) {
    assert.match(html, new RegExp(`id="${id}">5\\.00`));
  }
  for (const id of ['tapePPower', 'tapePSpeed', 'tapePChin', 'tapePCardio', 'tapeOPower', 'tapeOSpeed', 'tapeOChin', 'tapeOCardio']) {
    assert.match(html, new RegExp(`id="${id}">5\\.00`));
  }
});

test('XP and Hype live in the top bar without a duplicate Home resource card', () => {
  const headerStart = html.indexOf('<header class="topbar">');
  const headerEnd = html.indexOf('</header>', headerStart);
  for (const id of ['xpText', 'hypeText']) {
    const position = html.indexOf(`id="${id}"`);
    assert.ok(position > headerStart && position < headerEnd, `${id} should live in the top bar`);
  }
  assert.match(html, /id="rankText"[^>]*>UNRANKED<\/span><\/div><div class="top-progress"><span>XP<\/span><b id="xpText"/);
  assert.match(html, /class="hero-social"[\s\S]*>SOCIAL<\/button><span>FOLLOWERS: <b id="fansText">0<\/b>/);
  assert.doesNotMatch(html.slice(headerStart,headerEnd), /FOLLOWERS|FOLLOWING|fansText|followingText/);
  assert.doesNotMatch(html, /card bars|id="energyBar"|id="healthBar"|id="xpBar"|id="hypeBar"/);
  assert.doesNotMatch(script, /\$\('#(?:energy|health|xp|hype)Bar'\)/);
});

test('top-bar identity, money, XP, and Hype rows share matching alignment', () => {
  assert.match(css, /\.identity,\.money\{align-self:stretch;display:flex;flex-direction:column;justify-content:center\}/);
  assert.match(css, /\.identity \.sub\{[^}]*margin-top:2px/);
  assert.match(css, /\.money> b\{[^}]*font-size:13px/);
  assert.match(css, /\.hero-social button\{[^}]*font-size:9px[^}]*text-decoration:underline/);
  assert.match(css, /\.money\{margin-left:auto\}\.money>b\{font-size:18px\}/);
});

test('Cage Feed combines career reports with avatar-driven fighter interactions', () => {
  assert.doesNotMatch(html, /Latest Buzz|homeFeedPreview|homeFeedStatus/);
  assert.match(html, /data-screen="feed"/);
  assert.match(html, /id="socialTimeline"/);
  assert.match(html, /data-nav="feed"[\s\S]*data-icon-name="nav-feed"[\s\S]*id="feedNavBadge"/);
  assert.match(html, /class="card feed-page-card"[\s\S]*class="feed-page-note"[\s\S]*id="socialTimeline"/);
  assert.match(html, /\.feed-post p\{[^}]*font-size:10\.5px/);
  assert.match(html, /\.feed-post-head b\{[^}]*font-size:11px/);
  assert.match(html, /\.feed-post-head span\{[^}]*font-size:9\.5px/);
  assert.match(html, /\.feed-page-note\{[^}]*font-size:9\.5px/);
  assert.match(html, /\.fighter-message-text\{[^}]*font-size:12px/);
  assert.match(html, /\.fighter-bio-dialog \.loadout-dialog-kicker\{font-size:9\.5px\}/);
  assert.match(html, /\.fighter-bio-dialog \.modal-run\{font-size:14px\}/);
  assert.doesNotMatch(page, /social-composer|socialActions|Make Your Post|feed-compose-head/);
  assert.match(html, /\.screen\[data-screen="feed"\]\.active\{display:flex/);
  assert.match(css, /\.screen\[data-screen="feed"\]\.active\{padding-bottom:8px\}/);
  assert.doesNotMatch(html, /class="feed-back"/);
  assert.match(script, /socialAccountCreated:false,socialFeed:\[\],socialCycle:0,socialPostedCycle:0,socialSerial:0,socialLastReadSerial:0/);
  assert.match(script, /function socialUnreadCount\(\)/);
  assert.match(script, /currentScreen==='feed'\)\{state\.socialLastReadSerial=state\.socialSerial/);
  assert.match(script, /navBadge\.textContent=unread>99\?'99\+':String\(unread\)/);
  assert.match(script, /requestAnimationFrame\(\(\)=>\$\('#socialTimeline'\)\.scrollTo\(\{top:0,behavior:'smooth'\}\)\)/);
  assert.match(script, /function createSocialAccount\(\)/);
  assert.match(strings, /Hello, fight fans! Stay tuned—the climb starts now/);
  assert.match(script, /if\(!state\.socialAccountCreated\)return 0/);
  assert.match(script, /if\(screen==='feed'&&!ensureSocialFeed\(\)\)createSocialAccount\(\)/);
  assert.match(script, /\(Number\(s\.fans\)\|\|0\)>0/);
  assert.match(script, /function openSocialCycle\(type,data=\{\}\)/);
  assert.match(script, /socialHeadlineCounts:\{\}/);
  assert.match(script, /function drawSocialHeadline\(key,entries\)/);
  assert.match(script, /reporter-posts\|\$\{state\.socialProfileId\|\|state\.name\}\|\$\{key\}\|\$\{batch\}/);
  assert.match(script, /return deck\[count%deck\.length\]/);
  for (const key of ['fightWin','fightInjuredWin','fightLoss','appearance','viralAppearance','autographFree','autographStandard','autographExpensive','sponsor']) {
    assert.ok(stringsData.social.cycles[key].filter(entry=>entry.profile==='media').length>=3,`${key} should have a reporter headline deck`);
  }
  assert.ok(stringsData.social.cycles.fightStreakHeadline.length>=3);
  assert.match(script, /data\.injury\?addHeadline\('fightInjuredWin',cycles\.fightInjuredWin,values\):addHeadline\('fightWin',cycles\.fightWin,values\)/);
  assert.match(script, /injury:win\?currentTrainingInjury\(\)\?\.name\|\|'':''/);
  assert.match(strings, /COURAGEOUS OR STUPID\? \{name\} fought through a \{injury\}/);
  assert.match(script, /openSocialCycle\('fight'/);
  assert.match(script, /openSocialCycle\('appearance'/);
  assert.match(script, /openSocialCycle\('autograph'/);
  assert.match(script, /openSocialCycle\('sponsor'/);
  assert.match(page, /Tap a fighter or the CEO's avatar/);
  assert.match(page, /id="fighterBioInteractions"/);
  assert.match(script, /function fighterInteractionChoices\(profile\)/);
  assert.match(script, /pool\.slice\(dealt,dealt\+3\)/);
  assert.match(script, /sharedSocialInteractionsRemaining/);
  assert.match(script, /data-fighter-interaction/);
  assert.match(script, /function handleFighterInteraction\(choiceId,target\)/);
  assert.match(script, /loadInteractionAllowance\(\)/);
  assert.match(strings, /interactions:\s*\{/);
  for (const kind of ['CALL THEM OUT','GIVE THEM PROPS','WELCOME THEM','SHOW RESPECT','PUT THEM ON NOTICE']) assert.match(strings, new RegExp(kind));
  const interactionMessages=Object.values(stringsData.social.interactions).flatMap(definition=>definition.messages);
  assert.equal(interactionMessages.length,50);
  assert.match(script, /class="fighter-message-text" role="textbox" aria-readonly="true"/);
  assert.match(script, /class="fighter-message-send"/);
  assert.match(script, />SEND<\/button>/);
  assert.match(css, /\.fighter-message-composer\{display:grid;grid-template-columns:minmax\(0,1fr\) 58px/);
  assert.match(script, /LOGIC\.socialInteractionReward/);
  assert.match(script, /followers_gained:followersGained,hype_gained:hypeGained/);
  assert.match(script, /saveState\(\);closeFighterBio\(\);await connectSharedSocial\(true\);updateUI\(\)/);
  assert.match(cageInteractionMigration, /get_cage_interactions_remaining/);
  assert.match(cageInteractionMigration, /return greatest\(0, 5 - v_used\)/);
  assert.match(cageInteractionMigration, /post_kind in \('callout','props','welcome','respect','watching'\)/);
  assert.match(cageInteractionMigration, /if public\.get_cage_interactions_remaining\(\) < 1/);
  assert.doesNotMatch(page, /id="rivalCalloutModal"/);
  assert.match(strings, /WIN STREAK: \{name\} has now won \{winStreak\} straight fights/);
  for (const name of ['FightFan99', 'MMA4Life', 'ScorecardBandit', 'FlukeWinPolice']) assert.match(strings, new RegExp(name));
  const riskDefs = script.match(/const riskDefs = (\[[\s\S]*?\n\s*\]);/)?.[1] || '';
  const publicityDefs = script.match(/const publicityDefs = (\[[\s\S]*?\n\s*\]);/)?.[1] || '';
  assert.doesNotMatch(riskDefs, /call-out-rival|Post a Rival Callout/);
  assert.doesNotMatch(publicityDefs, /social-post|Influencer Brand Post/);
  assert.doesNotMatch(html, />FANS<|>Fans</);
  assert.match(readme, /five direct\s+fighter interactions per UTC day/i);
});

test('canned fighter posts use one non-repeating shuffled daily deck', () => {
  const choices=script.match(/function fighterInteractionChoices\(profile\)\{[\s\S]*?\n  \}/)?.[0]||'';
  assert.match(choices, /dailyDeckSeed=hashSeed\(`fighter-posts\|\$\{state\.socialProfileId\|\|state\.name\}\|\$\{todayKey\(\)\}`\)/);
  assert.match(choices, /seededRandom\(dailyDeckSeed\)/);
  assert.match(choices, /dealt=Math\.max\(0,5-sharedSocialInteractionsRemaining\)\*3/);
  assert.match(choices, /pool\.slice\(dealt,dealt\+3\)/);
  assert.doesNotMatch(choices, /profile\.id.*dailyDeckSeed|dailyDeckSeed.*profile\.id/);
});

test('Cage Grind CEO is verified while championship announcements stay database-owned', () => {
  assert.ok(fs.existsSync('assets/cage-grind-ceo.jpg'));
  assert.match(strings, /author:'Cage Grind CEO',handle:'@CageGrindCEO',tone:'ceo'/);
  for (const key of ['debut','performanceBonus']) assert.ok(stringsData.social.ceo[key]);
  for (const key of ['cityOffer','cityTitle','regionalOffer','regionalTitle','usOffer','usTitle','worldOffer','worldTitle']) assert.equal(stringsData.social.ceo[key],undefined);
  assert.match(page, /id="ceoOfficeModal"/);
  assert.match(page, /id="ceoResultSpotlight"/);
  assert.match(page, /id="worldTitleCard"[^>]*aria-live="polite"[\s\S]*world-title-emblem title-world-mark" data-icon-name="title-world"[\s\S]*id="nextMilestoneText"/);
  assert.ok(page.indexOf('id="worldTitleCard"') > page.indexOf('data-screen="fight"'));
  assert.ok(page.indexOf('id="worldTitleCard"') < page.indexOf('DAILY FIGHTS RESET IN'));
  assert.ok(page.indexOf('id="worldTitleCard"') > page.indexOf('class="card retirement-card"'));
  assert.match(page, /id="worldTitleKicker">TITLE STATUS/);
  assert.match(page, /id="worldTitleMeta">Loading the current champion and title requirements/);
  assert.doesNotMatch(page, /id="careerIdentityCard"[^\n]*World Championship/);
  assert.match(script, /titleKicker='REIGNING WORLD CHAMPION';championshipText='YOU HOLD THE BELT'/);
  assert.match(script, /titleKicker='CURRENT WORLD CHAMPION';championshipText=championHandle/);
  assert.match(script, /badgeIcon=o\.globalChampionship\?gameIcon\('title-world','👑'\):''/);
  assert.match(script, /titleIcon=status==='title'\?gameIcon\('title-world','👑'\):''/);
  assert.match(script, /class="sil-label title-label">\$\{gameIcon\('title-world','👑'\)\}/);
  assert.doesNotMatch(page, /landing-champion:after\{content:"♛"/);
  assert.doesNotMatch(script, /'👑 YOU HOLD THE BELT'/);
  assert.match(page, /assets\/cage-grind-ceo\.jpg\?v=2\.5\.90/g);
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
  assert.match(serviceWorker, /\.\/assets\/cage-grind-ceo\.jpg\?v=2\.5\.90/);
});

test('bottom navigation opens every destination at the top', () => {
  const navTo = script.match(/function navTo\(screen\)\{([\s\S]*?)\r?\n\s*\}/)?.[1] || '';
  assert.match(navTo, /page\.scrollTop=0/);
  assert.match(navTo, /screen==='feed'.*socialTimeline.*scrollTop=0/);
});

test('Cage Network profiles become safe local AI opponent snapshots', () => {
  assert.match(cageOpponentMigration, /get_cage_opponent_candidates/);
  assert.match(cageOpponentMigration, /profile\.id <> v_user_id/);
  assert.match(cageOpponentMigration, /profile\.level = v_level/);
  assert.match(cageOpponentMigration, /interval '30 days'/);
  assert.match(cageOpponentMigration, /grant execute .* to authenticated/);
  assert.match(supabaseClient, /selectCageOpponentCandidates/);
  assert.match(cageSocial, /loadOpponentCandidates/);
  assert.match(script, /function networkOpponentFromProfile\(profile,tier\)/);
  assert.match(script, /function networkOpponentDisplayName\(value\)/);
  assert.match(script, /name=networkOpponentDisplayName\(handle\)/);
  assert.match(script, /o\.network&&o\.networkHandle\)o\.name=networkOpponentDisplayName\(o\.networkHandle\)/);
  assert.doesNotMatch(script, /name=handle\.toUpperCase\(\)/);
  assert.match(script, /network:true,sourceProfileId:id/);
  assert.match(script, /function networkOpponentLocation\(o\)/);
  assert.match(script, /class="opp-note network-card-meta"><small>\$\{o\.globalChampionship\?'SANCTIONED WORLD TITLE':'FIGHTING OUT OF'\}<\/small>/);
  assert.match(script, /\$\{networkLocation\.name\} · \$\{networkLocation\.region\}/);
  assert.match(script, /FULL PURSE · \$\$\{fmt\(purse\)\}/);
  assert.match(css, /\.network-card-meta\{display:grid;justify-items:center/);
  assert.match(script, /LOGIC\.networkOpponentRatings/);
  assert.match(script, /if\(screen==='fight'\)queueMicrotask\(syncNetworkOpponents\)/);
  assert.match(script, /existing\.length>=2/);
  assert.match(script, /o=>o\.tier===tier&&!o\.network/);
  assert.match(script, /o\?\.networkPortrait\|\|fighterSilhouettes/);
  assert.match(page, /AI-CONTROLLED SNAPSHOT/);
  assert.match(script, /if\(!o\.network\)openSocialCycle\('fight'/);
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
  assert.match(script, /4 SLOTS UNLOCK AT LVL 8/);
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
});

test('Make Ends Meet side jobs retire when a fighter reaches Level 5', () => {
  assert.match(page, /id="makeEndsMeetCard"/);
  assert.match(page, /id="fullTimeFighterNote" hidden/);
  assert.match(page, /YOU'RE A FULL-TIME FIGHTER/);
  assert.match(script, /const fullTimeFighter=state\.level>=5/);
  assert.match(script, /\$\('#makeEndsMeetCard'\)\.hidden=fullTimeFighter/);
  assert.match(script, /if\(state\.level>=5\)\{toast\('SIDE JOBS END AT LEVEL 5/);
  assert.match(css, /\.full-time-fighter-note\{/);
  assert.match(readme, /Make Ends Meet[\s\S]*Level 5/);
});

test('cash starts empty and pays the premium scaling coach fee while career earnings remain cumulative', () => {
  assert.doesNotMatch(html, /Coach's Board|id="coachTip"/);
  assert.doesNotMatch(script, /\$\('#coachTip'\)/);
  assert.match(html, /id="careerEarningsText"/);
  assert.match(script, /version:22,name:'ROOKIE',nameLocked:false,cash:0,careerEarnings:0/);
  assert.match(script, /function coachFee\(\)\{return 250\+state\.level\*75\}/);
  assert.match(script, /LOGIC\.trainingQuote/);
  assert.match(script, /state\.cash-=quote\.cashCost/);
  assert.match(script, /function receiveMoney\(amount,career=false\)/);
  assert.match(script, /receiveMoney\(cash,true\)/);
  assert.match(script, /receiveMoney\(cash\);gainXp\(a\.xp\).*shifts left/);
  assert.match(script, /LOGIC\.normalizeCoreState/);
});

test('career status reflects the shared world championship and the active sponsor appears beneath it', () => {
  const rankPosition = html.indexOf('class="rank-chip"');
  const sponsorPosition = html.indexOf('id="heroSponsor"');
  const dailyPosition = html.indexOf('id="dailyBtn"');
  assert.ok(rankPosition >= 0 && sponsorPosition > rankPosition && sponsorPosition < dailyPosition);
  assert.match(html, /<div class="rank-chip"><strong id="cageStatus">PROSPECT<\/strong><\/div>/);
  assert.doesNotMatch(html, /CAGE STATUS/);
  assert.doesNotMatch(html, /CAGE RANK|id="cageRank"/);
  assert.doesNotMatch(script, /function cageRank\(/);
  assert.match(script, /function cageStatus\(\)/);
  assert.match(script, /if\(sharedChampionship\?\.is_champion\)return 'WORLD CHAMPION'/);
  assert.match(script, /return 'TITLE CHALLENGER'/);
  assert.match(script, /return rankName\(\)/);
  assert.match(html, /\.hero-sponsor\{position:absolute;top:48px;left:10px/);
  assert.match(html, /\.hero-sponsor\[hidden\]\{display:none\}/);
  assert.match(script, /sponsorBadge\.hidden=!sponsor/);
  assert.match(script, /gameIcon\(sponsor\.id,sponsor\.icon\)/);
  assert.match(script, /SPONSORED BY/);
  assert.match(script, /state\.activeEndorsement\.fightsLeft\} FIGHTS LEFT/);
});

test('training separates daily sparring from post-fight recovery opportunities', () => {
  assert.match(css, /@media \(min-width:1100px\)\{[\s\S]*?\.screen\[data-screen="train"\]\.active\{[^}]*grid-auto-rows:max-content/);
  assert.match(css, /@media \(min-width:1100px\)\{[\s\S]*?\.screen\[data-screen="train"\] \.card\{align-self:start;min-height:max-content\}/);
  assert.match(page, /<div class="card sparring-card">/);
  assert.match(page, /id="sparringLimitText">2 SESSIONS LEFT/);
  assert.match(page, /id="sparringActions"/);
  assert.match(script, /id:'light-sparring'.*cost:10,gain:1,xp:14,skills:1/);
  assert.match(script, /id:'heavy-sparring'.*cost:20,gain:1,xp:28,skills:2,damage:\[3,9\]/);
  for (const asset of ['light-sparring', 'heavy-sparring']) {
    const file = `assets/icons/${asset}.png`;
    assert.equal(fs.existsSync(file), true);
    assert.equal(pngTopLeftAlpha(file), 0, `${asset} artwork should have a transparent background`);
  }
  assert.match(script, /sessionsLeft\('sparring',2\)/);
  assert.match(script, /state\.dailyCounters\.sparring\+=quote\.sessions/);
  assert.match(script, /const sparring=e\.target\.closest\('\[data-sparring\]'\)/);
  assert.doesNotMatch(script, /id:'hard-sparring'/);
  assert.match(script, /TRAINING_COOLDOWN_MS=60000/);
  assert.match(script, /function applyTrainingCooldown\(\)/);
  assert.match(script, /state\.trainingCooldownUntil=\(overtraining\?Math\.max\(now,state\.trainingCooldownUntil\):now\)\+TRAINING_COOLDOWN_MS/);
  assert.match(script, /if\(overtraining&&!state\.trainingInjury&&Math\.random\(\)<\.33\)/);
  assert.match(script, /LOGIC\.injuredStat\(v,!!state\.trainingInjury\)/);
  assert.match(script, /locked=!!injury\|\|state\.energy<cost/);
  assert.match(script, /TRAINING CLOSED UNTIL MIDNIGHT/);
  assert.match(script, /SPARRING CLOSED UNTIL MIDNIGHT/);
  assert.match(script, /if\(currentTrainingInjury\(\)\)\{toast\('Training is closed until your injury heals at midnight\.'/);
  assert.match(script, /if\(currentTrainingInjury\(\)\)\{toast\('Sparring is closed until your injury heals at midnight\.'/);
  assert.match(page, /id="trainingInjuryBanner" hidden/);
  assert.match(page, /Every gym or sparring session starts a one-minute cooldown/);
  assert.doesNotMatch(page, /33%/);
  assert.match(css, /\.action\.training-cooldown\{[^}]*border-color:#9a5428/);
  assert.match(css, /\.action \.cost \.training-cooldown-clock\[hidden\]\{display:none!important\}/);
  assert.match(css, /\.action\.injury-locked:disabled\{[^}]*opacity:\.72/);
  assert.match(css, /\.hud-attributes-row\.injured \.hud-attribute\{[^}]*border-color:#852b38/);
  assert.match(css, /\.action h3\{[^}]*white-space:nowrap;overflow:hidden;text-overflow:ellipsis/);
  assert.match(css, /\.action \.cost small\{[^}]*white-space:normal;overflow-wrap:anywhere/);
  assert.match(page, /Recovery Room/);
  assert.match(page, /id="recoveryLimitText"/);
  assert.match(page, /id="recoveryActions"/);
  assert.match(script, /id:'ice-bath'.*energy:25,health:0/);
  assert.match(script, /id:'sauna'.*energy:15,health:12/);
  assert.match(script, /id:'massage'.*energy:5,health:25/);
  assert.match(script, /id:'cryotherapy'.*energy:20,health:35,feeBase:250,feePerLevel:25/);
  assert.match(script, /function recoveryFee\(treatment\)/);
  assert.match(script, /LOGIC\.recoveryQuote/);
  assert.match(script, /LOGIC\.applyRecovery/);
  assert.match(script, /treatmentAvailable:true/);
  assert.match(script, /state\.treatmentAvailable=false/);
  assert.match(script, /state\.dailyCounters\.fight\+\+;state\.treatmentAvailable=true/);
  assert.match(page, /One paid treatment is available after each completed fight and treatment opportunities never accumulate/);
});

test('Underground Buzz keeps persistent once-daily blackjack and Cage Dice', () => {
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
  assert.match(page, /assets\/cage-dice\.jpg\?v=2\.5\.90/);
  assert.match(page, /data-dice-choice="under"[\s\S]*data-dice-choice="over"[\s\S]*data-dice-choice="seven"[\s\S]*data-dice-choice="doubles"/);
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
  assert.match(serviceWorker, /\.\/assets\/cage-dice\.jpg\?v=2\.5\.90/);
});

test('fight, training, and hustle share one live local-midnight reset timer', () => {
  assert.equal((page.match(/data-daily-reset-clock/g)||[]).length,3);
  assert.match(page, /DAILY LIMITS RESET IN/);
  assert.match(page, /YOUR LOCAL MIDNIGHT/);
  assert.match(script, /function updateDailyResetClocks\(\)/);
  assert.equal((script.match(/setInterval\(updateDailyResetClocks,1000\)/g)||[]).length,1);
  assert.match(script, /date!==dailyResetDate/);
  assert.match(css, /\.daily-reset-clock\{/);
});

test('career fights have a ten-fight daily cap', () => {
  assert.match(page, /DAILY FIGHTS RESET IN/);
  assert.match(page, /id="fightLimitText">10 FIGHTS LEFT/);
  assert.match(script, /DAILY_FIGHT_LIMIT=10/);
  assert.match(script, /sessionsLeft\('fight',DAILY_FIGHT_LIMIT\)/);
  assert.match(script, /state\.dailyCounters\.fight\+\+/);
});

test('endorsements unlock as one crash-safe sequential offer', () => {
  assert.match(script, /id:'bobs-auto'.*brand:"Bob's Auto Shop".*minLevel:2,minFans:0,signing:100,perFight:40,fansPerFight:5,fights:3/);
  assert.match(script, /const ENDORSEMENT_FIGHTS = \{'bobs-auto':3,volt:4/);
  for (const threshold of [2500, 10000, 30000, 80000, 200000]) assert.match(script, new RegExp(`minFans:${threshold}`));
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
  assert.match(script, /saveState\(\);openSocialCycle\('sponsor'/);
});

test('level ups receive a dedicated promotion celebration', () => {
  assert.match(html, /id="levelUpModal"/);
  assert.match(html, /CAREER BREAKTHROUGH/);
  assert.match(html, /id="levelUpEnergy"/);
  assert.match(html, /id="levelUpHealth"/);
  assert.match(html, /id="levelUpCash"/);
  assert.match(html, /\.level-up-overlay\.active\{display:flex\}/);
  assert.match(script, /function showLevelUp\(summary\)/);
  assert.match(script, /levelUpSummary=\{fromLevel:previous\?\.fromLevel\|\|startingLevel,toLevel:state\.level,earningsBonus:/);
  assert.doesNotMatch(script, /newTitles=milestoneDefs\.filter/);
  assert.doesNotMatch(script, /fullRestore=milestoneDefs\.some/);
  assert.match(script, /LOGIC\.applyLevelUpResources\(state,false\)/);
  assert.match(script, /up to 30 energy and 25 health per level/);
  assert.doesNotMatch(script, /state\.energy=state\.maxEnergy;state\.maxHealth\+=5;state\.health=state\.maxHealth/);
  assert.match(script, /modal\._burstTimer=setTimeout\(confettiBurst,620\)/);
  assert.match(script, /function closeLevelUp\(\).*clearTimeout\(modal\._burstTimer\).*stopConfetti\(\)/);
  assert.match(script, /function stopConfetti\(\).*cancelAnimationFrame\(confettiFrameId\)/s);
  assert.match(script, /const count=r\.width<700\?48:64/);
  assert.match(script, /Math\.min\(1\.25,devicePixelRatio\|\|1\)/);
  assert.doesNotMatch(script, /if\(n\+\+<105\)requestAnimationFrame\(frame\)/);
  assert.match(script, /\$\('#levelUpContinue'\)\.addEventListener\('click',closeLevelUp\)/);
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
  assert.match(script, /reason:titleWon\?'CEO TITLE GIFT':'CEO GIFT'/);
  assert.match(script, /state\.gearCounts\[item\.id\]=gearCount\(item\.id\)\+1/);
  assert.match(script, /function ownedBonus\(prop\)\{return state\.gear\.reduce/);
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
    ['fur-coat', 'Full-Length Fur Coat'],
    ['victory-bucket', 'Victory Chicken Bucket'],
    ['fight-fuel-protein', 'Fight Fuel Protein'],
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
  assert.match(script, /id:'fur-coat'.*rarity:'EPIC'.*minLevel:7/);
  assert.match(script, /id:'small-gym-dog'.*name:'Small Gym Dog'.*rarity:'COMMON'.*minLevel:1/);
  assert.match(script, /id:'dog'.*name:'Gym Dog'.*rarity:'RARE'.*minLevel:3/);
  assert.match(script, /id:'victory-bucket'.*category:'Lifestyle'.*rarity:'COMMON'.*minLevel:1/);
  assert.match(script, /id:'fight-fuel-protein'.*category:'Lifestyle'.*rarity:'COMMON'.*minLevel:2/);
  assert.match(script, /id:'flagship-phone'.*category:'Lifestyle'.*rarity:'RARE'.*minLevel:3/);
  assert.match(script, /id:'concert-grand'.*category:'Lifestyle'.*rarity:'LEGENDARY'.*minLevel:10/);
  assert.match(script, /id:'sky-blue-scooter'.*category:'Property & Rides'.*rarity:'COMMON'.*minLevel:2/);
  assert.match(script, /id:'midnight-cruiser'.*category:'Property & Rides'.*rarity:'RARE'.*minLevel:4/);
  assert.match(script, /id:'redline-superbike'.*category:'Property & Rides'.*rarity:'EPIC'.*minLevel:7/);
  assert.match(script, /id:'diamond-grill'.*category:'Bling'.*rarity:'EPIC'.*minLevel:6/);
  assert.match(script, /id:'designer-sunglasses'.*category:'Bling'.*assetExt:'jpg'.*rarity:'RARE'.*minLevel:3/);
  assert.match(script, /id:'diamond-cluster-ring'.*category:'Bling'.*assetExt:'jpg'.*rarity:'EPIC'.*minLevel:8/);
  assert.match(script, /id:'shrimp-cocktail'.*category:'Lifestyle'.*assetExt:'jpg'.*rarity:'RARE'.*minLevel:3/);
  assert.match(script, /id:'performance-jet-ski'.*category:'Property & Rides'.*assetExt:'jpg'.*rarity:'RARE'.*minLevel:4/);
  assert.match(script, /id:'coastal-speedboat'.*category:'Property & Rides'.*assetExt:'jpg'.*rarity:'EPIC'.*minLevel:7/);
  assert.match(script, /id:'luxury-yacht'.*category:'Property & Rides'.*assetExt:'jpg'.*rarity:'LEGENDARY'.*minLevel:14/);
  assert.match(script, /id:'private-jet'.*category:'Property & Rides'.*assetExt:'jpg'.*rarity:'LEGENDARY'.*minLevel:15/);
  for (const id of ['designer-sunglasses', 'diamond-cluster-ring', 'shrimp-cocktail', 'performance-jet-ski', 'coastal-speedboat', 'luxury-yacht', 'private-jet']) {
    assert.equal(fs.existsSync(`assets/icons/${id}.jpg`), true, `${id} artwork should exist`);
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
  const dailyCollectible = script.match(/function awardDailyCollectible\(date\)\{([\s\S]*?)\r?\n\s*\}\r?\n\s*function ensureDailyCounters/)?.[1] || '';
  assert.match(dailyCollectible, /daily-collectible-v1/);
  assert.match(dailyCollectible, /state\.gearCounts\[item\.id\]=gearCount\(item\.id\)\+1/);
  assert.doesNotMatch(dailyCollectible, /gearWinsSinceDrop/);
  assert.match(script, /gearDrop=awardDailyCollectible\(today\)/);
  assert.match(script, /COLLECTIBLE CARD READY/);
  assert.match(script, /rewardXpLabel'\)\.textContent='Collectible'/);
  assert.match(readme, /Daily Drop awards Cash, energy, and one deterministic/);
});

test('fight result action celebrates wins without labeling losses as reward claims', () => {
  assert.match(script, /armResultAction\(win\?'CLAIM REWARDS':'CONTINUE'\)/);
  assert.match(script, /function handleResultAction\(\)/);
  assert.match(script, /if\(resultActionTimer\)return/);
  assert.match(script, /LOGIC\.normalizeGearDrop\(pendingResultDrop,gearRarityOrder\)/);
  assert.match(script, /DROP SAVED · OPEN GEAR TO VIEW IT/);
  assert.match(script, /GIFT FROM THE CEO/);
  assert.match(script, /You caught his attention/);
  assert.match(script, /dropLabel=ceoGift\?`\$\{drop\.rarity\} GIFT FROM THE CEO`/);
  assert.match(script, /drop-icon/);
  assert.match(page, /class="result-bonuses" id="resultBonuses" hidden/);
  assert.match(script, /function renderResultBonuses\(notes=\[\]\)/);
  assert.match(script, /renderResultBonuses\(lootNotes\)/);
  assert.match(script, /pendingResultDrop=gearDrop;resultDropRevealed=false/);
  assert.doesNotMatch(script, /pendingResultDrop=Object\.assign\(\{extras:/);
  assert.doesNotMatch(script, /drop\.extras/);
  assert.match(css, /\.result-bonuses\{[^}]*color:#ffe092/);
  assert.match(script, /resultTitle'\)\.textContent='YOU WIN'/);
  assert.match(script, /resultTitle'\)\.textContent='YOU LOST'/);
  assert.match(script, /card\.classList\.add\(win\?'fight-win':'fight-loss'\)/);
  assert.match(css, /\.result-card\.fight-loss\{[^}]*border-color:#c84a4a/);
  assert.match(css, /\.result-method\{[^}]*font-size:13px/);
});

test('exhausted daily fights hide matchup actions behind a reset state', () => {
  assert.match(script, /const dailyExhausted=fightsLeft<1&&available/);
  assert.match(script, /DAILY LIMIT REACHED<br><small>NEW FIGHTS AT LOCAL MIDNIGHT<\/small>/);
  assert.match(script, /class="fight-btn locked daily-limit" disabled/);
  assert.match(script, /\$\{dailyExhausted\?'daily-exhausted':''\}/);
  assert.match(css, /\.opponent\.daily-exhausted\{--fighter-accent:#63778e;--fighter-deep:#172332\}/);
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
  assert.match(script, /Fight damage: -\$\{healthLoss\} Health/);
  assert.match(logic, /function liveFightHealthDamage\(\{landed=false,knockdown=false,finish=''\}=\{\}\)/);
  assert.match(readme, /directly removes 1 persistent\s+Health/);
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

test('planned fights charge a level-based rate per started round and run without routine pauses', () => {
  assert.match(script, /FIGHT_ROUNDS=3/);
  assert.match(script, /currentFightRoundCost=\(\)=>LOGIC\.fightRoundCost\(state\.level\)/);
  assert.match(script, /currentFightClearance=\(\)=>currentFightRoundCost\(\)\*FIGHT_ROUNDS/);
  assert.match(script, /LOGIC\.bookFight\(state,o\.key,roundCost,Date\.now\(\),clearance\)/);
  assert.match(script, /fight\.roundCost=roundCost/);
  assert.match(script, /\$\('#tapeEnergy'\)\.textContent=`\$\{clearance\} REQUIRED · \$\{roundCost\} PER STARTED ROUND`/);
  assert.match(readme, /Levels 1–2 cost\s+6 energy per started round, Levels 3–4 cost 7/);
  assert.match(script, /LOGIC\.chargePendingFightEnergy/);
  assert.match(script, /for\(let round=1;round<=FIGHT_ROUNDS&&!fight\.winner;round\+\+\)/);
  assert.match(script, /if\(round>1&&!chargeFightEnergy/);
  assert.match(script, /fight\.timeline=fight\.timeline\.filter\(item=>item\.type!=='fightMoment'&&item\.type!=='lastChance'\)/);
  assert.match(readme, /one uninterrupted\s+full simulation/);
});

test('pace and offense settings change exchanges, fatigue, accuracy, damage, and knockdowns', () => {
  assert.match(script, /const exchanges=fastPace\?rint\(9,11\):rint\(6,7\)/);
  assert.match(script, /paceInitiative=fastPace\?clamp\(\(P\.cardio-O\.cardio\)\*\.018\+\(P\.cardio-8\)\*\.008,-\.12,\.14\):0/);
  assert.match(script, /fastPace\?1\.35:\.7/);
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

test('opponent fight actions use a distinct red commentary treatment', () => {
  assert.match(html, /\.action-line\.opp\{[^}]*border-color:#f06a62;[^}]*background:linear-gradient\(90deg,#351418e8,#211116d9\);[^}]*color:#ffd9d5/);
  assert.match(html, /\.action-line\.opp \.stamp\{color:#e68c86\}/);
});

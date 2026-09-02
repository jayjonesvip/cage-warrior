const test = require('node:test');
const assert = require('node:assert/strict');
const { SESSION_KEY, normalizeSession } = require('../js/supabase-client.js');
const { createClient } = require('../js/cage-social.js');

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => data === null ? '' : JSON.stringify(data),
  };
}

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    value: key => values.get(key),
  };
}

const session = {
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  expires_at: 5000,
  user: { id: '11111111-1111-4111-8111-111111111111' },
};

test('invalid shared-feed session data recovers through one anonymous sign-in', async () => {
  const storage = memoryStorage({ [SESSION_KEY]: '{broken-json' });
  const calls = [];
  const client = createClient({
    url: 'https://test.supabase.co',
    key: 'sb_publishable_test-key',
    storage,
    now: () => 1_000_000,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return jsonResponse(session);
    },
  });

  const first = await client.ensureSession();
  const second = await client.ensureSession();
  assert.equal(first.user.id, session.user.id);
  assert.equal(second.user.id, session.user.id);
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /\/auth\/v1\/signup$/);
  assert.deepEqual(JSON.parse(calls[0].options.body).data, { game: 'cage-grind' });
  assert.equal(normalizeSession(JSON.parse(storage.value(SESSION_KEY))).access_token, 'access-token');
});

test('expired anonymous sessions refresh without creating a second player identity', async () => {
  const oldSession = { ...session, access_token: 'expired', expires_at: 10 };
  const refreshed = { ...session, access_token: 'refreshed', expires_at: 9000 };
  const storage = memoryStorage({ [SESSION_KEY]: JSON.stringify(oldSession) });
  const calls = [];
  const client = createClient({
    url: 'https://test.supabase.co',
    key: 'sb_publishable_test-key',
    storage,
    now: () => 100_000,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return jsonResponse(refreshed);
    },
  });

  const active = await client.ensureSession();
  assert.equal(active.access_token, 'refreshed');
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /\/auth\/v1\/token\?grant_type=refresh_token$/);
  assert.deepEqual(JSON.parse(calls[0].options.body), { refresh_token: 'refresh-token' });
});

test('an invalid refresh token never replaces an established fighter with a new anonymous identity', async () => {
  const oldSession = { ...session, access_token: 'expired', expires_at: 10 };
  const storage = memoryStorage({ [SESSION_KEY]: JSON.stringify(oldSession) });
  const calls = [];
  const client = createClient({
    url: 'https://test.supabase.co',
    key: 'sb_publishable_test-key',
    storage,
    now: () => 100_000,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return jsonResponse({ message: 'Invalid Refresh Token' }, 400);
    },
  });

  await assert.rejects(client.ensureSession(), /Fighter network session expired/);
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /\/auth\/v1\/token\?grant_type=refresh_token$/);
  assert.equal(normalizeSession(JSON.parse(storage.value(SESSION_KEY))).user.id, session.user.id);
});

test('a tab adopts a rotated same-fighter refresh token instead of creating a new identity', async () => {
  const oldSession = { ...session, access_token: 'expired', refresh_token: 'old-refresh', expires_at: 10 };
  const rotated = { ...session, access_token: 'rotated-expired', refresh_token: 'rotated-refresh', expires_at: 10 };
  const refreshed = { ...session, access_token: 'refreshed', refresh_token: 'latest-refresh', expires_at: 9000 };
  const storage = memoryStorage({ [SESSION_KEY]: JSON.stringify(oldSession) });
  const calls = [];
  const client = createClient({
    url: 'https://test.supabase.co',
    key: 'sb_publishable_test-key',
    storage,
    now: () => 100_000,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      const token = JSON.parse(options.body).refresh_token;
      if(token === 'old-refresh'){
        storage.setItem(SESSION_KEY, JSON.stringify(rotated));
        return jsonResponse({ message: 'Already Used' }, 400);
      }
      return jsonResponse(refreshed);
    },
  });

  const active = await client.ensureSession();
  assert.equal(active.access_token, 'refreshed');
  assert.deepEqual(calls.map(call => JSON.parse(call.options.body).refresh_token), ['old-refresh','rotated-refresh']);
  assert.ok(calls.every(call => call.url.includes('/auth/v1/token?grant_type=refresh_token')));
});

test('concurrent startup requests share one session refresh', async () => {
  const oldSession = { ...session, access_token: 'expired', expires_at: 10 };
  const refreshed = { ...session, access_token: 'refreshed', expires_at: 9000 };
  const storage = memoryStorage({ [SESSION_KEY]: JSON.stringify(oldSession) });
  const calls = [];
  const client = createClient({
    url: 'https://test.supabase.co',
    key: 'sb_publishable_test-key',
    storage,
    now: () => 100_000,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      await new Promise(resolve => setImmediate(resolve));
      return jsonResponse(refreshed);
    },
  });

  const sessions = await Promise.all([client.ensureSession(), client.ensureSession(), client.ensureSession()]);
  assert.deepEqual(sessions.map(active => active.access_token), ['refreshed','refreshed','refreshed']);
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /\/auth\/v1\/token\?grant_type=refresh_token$/);
});

test('identity claiming, profile sync, retirement, feed reads, roster filtering, and posting use authenticated REST requests', async () => {
  const storage = memoryStorage();
  const otherId = '22222222-2222-4222-8222-222222222222';
  const requests = [];
  const client = createClient({
    url: 'https://test.supabase.co',
    key: 'sb_publishable_test-key',
    storage,
    now: () => 1_000_000,
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      if (url.endsWith('/auth/v1/signup')) return jsonResponse(session);
      if (url.endsWith('/rest/v1/rpc/claim_cage_identity')) return jsonResponse({ id: session.user.id, handle: 'WhiteDrizzlePHX' });
      if (url.endsWith('/rest/v1/rpc/sync_cage_profile')) return jsonResponse({ id: session.user.id, handle: 'WhiteDrizzlePHX' });
      if (url.endsWith('/rest/v1/rpc/sync_cage_ranking')) return jsonResponse({ id: session.user.id, handle: 'WhiteDrizzlePHX', attribute_total: 24, ranking_history: [] });
      if (url.endsWith('/rest/v1/rpc/retire_cage_profile')) return jsonResponse({ id: session.user.id, handle: 'WhiteDrizzlePHX', retired_at: '2026-08-10T12:00:00Z' });
      if (url.includes('/rest/v1/cage_feed_posts?')) return jsonResponse([{ id: 7, post_kind: 'player', body: 'Back to work.' }]);
      if (url.includes('/rest/v1/cage_profiles?')) return jsonResponse([
        { id: session.user.id, handle: 'WhiteDrizzlePHX' },
        { id: otherId, handle: 'GoldenTornadoNYC' },
      ]);
      if (url.endsWith('/rest/v1/rpc/get_cage_opponent_candidates')) return jsonResponse([
        { id: otherId, handle: 'GoldenTornadoNYC', level: 4, fighter_avatar: 'fighter-08', archetype: 'counter' },
      ]);
      if (url.endsWith('/rest/v1/rpc/get_cage_profile_count')) return jsonResponse(27);
      if (url.endsWith('/rest/v1/rpc/get_cage_interactions_remaining')) return jsonResponse(3);
      if (url.endsWith('/rest/v1/rpc/load_cage_career')) return jsonResponse({ version: 31, name: 'WhiteDrizzlePHX', nameLocked: true });
      if (url.endsWith('/rest/v1/rpc/save_cage_career')) return jsonResponse('2026-09-02T16:00:00Z');
      if (url.endsWith('/rest/v1/rpc/publish_cage_post')) return jsonResponse({ id: 8 });
      if (url.endsWith('/rest/v1/rpc/publish_cage_ceo_post')) return jsonResponse({ id: 9, post_kind: 'ceo' });
      return jsonResponse({ message: 'unexpected request' }, 500);
    },
  });

  const claimed = await client.claimIdentity({ candidates: ['WhiteDrizzlePHX','BlueViperPHX'], city: 'phoenix', archetype: 'brawler', fighterAvatar: 'fighter-07', level: 1, wins: 0, losses: 0, attributeTotal: 20, rankingHistory: [] });
  const profile = await client.registerProfile({ fighterAvatar: 'fighter-07', level: 4, wins: 7, losses: 2, attributeTotal: 24, rankingHistory: [{won:true,quality:65}] });
  const feed = await client.loadFeed(50);
  const roster = await client.loadProfiles(100);
  const ownProfile = await client.loadOwnProfile();
  const profileCount = await client.loadProfileCount();
  const opponents = await client.loadOpponentCandidates(4, 12);
  const remaining = await client.loadInteractionAllowance();
  const career = await client.loadCareer();
  const careerSavedAt = await client.saveCareer({ version: 31, name: 'WhiteDrizzlePHX', nameLocked: true }, session.user.id);
  await client.publishPost({ kind: 'callout', body: '@CHICounter_01, keep winning.', targetProfileId: otherId });
  await client.publishCeoPost('city_offer');
  const retired = await client.retireProfile();

  assert.equal(claimed.handle, 'WhiteDrizzlePHX');
  assert.equal(profile.handle, 'WhiteDrizzlePHX');
  assert.equal(retired.retired_at, '2026-08-10T12:00:00Z');
  assert.equal(feed[0].id, 7);
  assert.deepEqual(roster.map(row => row.id), [otherId]);
  assert.equal(ownProfile.id, session.user.id);
  assert.equal(profileCount, 27);
  assert.equal(opponents[0].handle, 'GoldenTornadoNYC');
  assert.equal(remaining, 3);
  assert.equal(career.name, 'WhiteDrizzlePHX');
  assert.equal(careerSavedAt, '2026-09-02T16:00:00Z');
  const authenticated = requests.filter(request => request.url.includes('/rest/v1/'));
  assert.ok(authenticated.every(request => request.options.headers.Authorization === 'Bearer access-token'));
  const claimBody = JSON.parse(authenticated.find(request => request.url.endsWith('claim_cage_identity')).options.body);
  assert.deepEqual(claimBody, { p_candidates: ['WhiteDrizzlePHX','BlueViperPHX'], p_city: 'phoenix', p_archetype: 'brawler', p_fighter_avatar: 'fighter-07', p_level: 1, p_wins: 0, p_losses: 0 });
  const syncBody = JSON.parse(authenticated.find(request => request.url.endsWith('sync_cage_profile')).options.body);
  assert.deepEqual(syncBody, { p_level: 4, p_wins: 7, p_losses: 2, p_fighter_avatar: 'fighter-07' });
  const rankBodies = authenticated.filter(request => request.url.endsWith('sync_cage_ranking')).map(request=>JSON.parse(request.options.body));
  assert.deepEqual(rankBodies,[{p_attribute_total:20,p_ranking_history:[]},{p_attribute_total:24,p_ranking_history:[{won:true,quality:65}]}]);
  const postBody = JSON.parse(authenticated.find(request => request.url.endsWith('publish_cage_post')).options.body);
  assert.equal(postBody.p_target_profile_id, otherId);
  assert.equal(postBody.p_post_kind, 'callout');
  const ceoPostBody = JSON.parse(authenticated.find(request => request.url.endsWith('publish_cage_ceo_post')).options.body);
  assert.deepEqual(ceoPostBody, { p_event_key: 'city_offer' });
  const opponentBody = JSON.parse(authenticated.find(request => request.url.endsWith('get_cage_opponent_candidates')).options.body);
  assert.deepEqual(opponentBody, { p_level: 4, p_limit: 12 });
  const careerSaveBody = JSON.parse(authenticated.find(request => request.url.endsWith('save_cage_career')).options.body);
  assert.deepEqual(careerSaveBody, { p_state: { version: 31, name: 'WhiteDrizzlePHX', nameLocked: true } });
  assert.ok(authenticated.some(request => request.url.includes(`id=eq.${session.user.id}`)));
});

test('an existing career never creates a replacement identity when its network session is missing', async () => {
  const calls = [];
  const client = createClient({
    url: 'https://test.supabase.co',
    key: 'sb_publishable_test-key',
    storage: memoryStorage(),
    now: () => 1_000_000,
    fetchImpl: async (url, options) => { calls.push({ url, options }); return jsonResponse(session); },
  });

  await assert.rejects(client.loadOwnProfile(session.user.id), /network session missing/i);
  await assert.rejects(client.loadCareer(session.user.id), /network session missing/i);
  await assert.rejects(client.saveCareer({ version: 31 }, session.user.id), /network session missing/i);
  assert.equal(calls.length, 0);
});

test('an existing career rejects a different valid browser identity before any profile request', async () => {
  const otherSession = { ...session, user: { id: '22222222-2222-4222-8222-222222222222' } };
  const calls = [];
  const client = createClient({
    url: 'https://test.supabase.co',
    key: 'sb_publishable_test-key',
    storage: memoryStorage({ [SESSION_KEY]: JSON.stringify(otherSession) }),
    now: () => 1_000_000,
    fetchImpl: async (url, options) => { calls.push({ url, options }); return jsonResponse([]); },
  });

  await assert.rejects(client.loadOwnProfile(session.user.id), /identity does not match/i);
  assert.equal(calls.length, 0);
});

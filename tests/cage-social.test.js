const test = require('node:test');
const assert = require('node:assert/strict');
const { SESSION_KEY, normalizeSession } = require('../supabase-client.js');
const { createClient } = require('../cage-social.js');

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

test('profile registration, global feed reads, roster filtering, and callout publishing use authenticated REST requests', async () => {
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
      if (url.endsWith('/rest/v1/rpc/register_cage_profile')) return jsonResponse({ id: session.user.id, handle: 'NYCBrawler_01' });
      if (url.includes('/rest/v1/cage_feed_posts?')) return jsonResponse([{ id: 7, post_kind: 'player', body: 'Back to work.' }]);
      if (url.includes('/rest/v1/cage_profiles?')) return jsonResponse([
        { id: session.user.id, handle: 'NYCBrawler_01' },
        { id: otherId, handle: 'CHICounter_01', fighter_name: 'ALEX KING' },
      ]);
      if (url.endsWith('/rest/v1/rpc/get_cage_opponent_candidates')) return jsonResponse([
        { id: otherId, handle: 'CHICounter_01', fighter_name: 'ALEX KING', level: 4, fighter_avatar: 'fighter-08', archetype: 'counter' },
      ]);
      if (url.endsWith('/rest/v1/rpc/get_cage_profile_count')) return jsonResponse(27);
      if (url.endsWith('/rest/v1/rpc/get_cage_interactions_remaining')) return jsonResponse(3);
      if (url.endsWith('/rest/v1/rpc/publish_cage_post')) return jsonResponse({ id: 8 });
      return jsonResponse({ message: 'unexpected request' }, 500);
    },
  });

  const profile = await client.registerProfile({ fighterName: 'JAY JONES', city: 'new-york', archetype: 'brawler', fighterAvatar: 'fighter-07', level: 4, wins: 7, losses: 2 });
  const feed = await client.loadFeed(50);
  const roster = await client.loadProfiles(100);
  const profileCount = await client.loadProfileCount();
  const opponents = await client.loadOpponentCandidates(4, 12);
  const remaining = await client.loadInteractionAllowance();
  await client.publishPost({ kind: 'callout', body: '@CHICounter_01, keep winning.', targetProfileId: otherId });

  assert.equal(profile.handle, 'NYCBrawler_01');
  assert.equal(feed[0].id, 7);
  assert.deepEqual(roster.map(row => row.id), [otherId]);
  assert.equal(profileCount, 27);
  assert.equal(opponents[0].handle, 'CHICounter_01');
  assert.equal(remaining, 3);
  const authenticated = requests.filter(request => request.url.includes('/rest/v1/'));
  assert.ok(authenticated.every(request => request.options.headers.Authorization === 'Bearer access-token'));
  const registerBody = JSON.parse(authenticated.find(request => request.url.endsWith('register_cage_profile')).options.body);
  assert.deepEqual(registerBody, { p_fighter_name: 'JAY JONES', p_city: 'new-york', p_archetype: 'brawler', p_level: 4, p_wins: 7, p_losses: 2, p_fighter_avatar: 'fighter-07' });
  const postBody = JSON.parse(authenticated.find(request => request.url.endsWith('publish_cage_post')).options.body);
  assert.equal(postBody.p_target_profile_id, otherId);
  assert.equal(postBody.p_post_kind, 'callout');
  const opponentBody = JSON.parse(authenticated.find(request => request.url.endsWith('get_cage_opponent_candidates')).options.body);
  assert.deepEqual(opponentBody, { p_level: 4, p_limit: 12 });
});

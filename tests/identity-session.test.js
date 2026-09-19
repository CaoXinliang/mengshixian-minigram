const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { createIdentitySession } = require('../miniapp/modules/identity-session');

function createHarness(overrides = {}) {
  const storage = new Map();
  const calls = [];
  const session = createIdentitySession({
    cloudMode: true,
    auth: {
      login: async () => ({ ok: true, data: { user: { _id: 'customer-1', userType: 'c', status: 'active' } } }),
      getMe: async () => ({ ok: true, data: { user: { _id: 'customer-1', userType: 'c', status: 'active' } } }),
      ...(overrides.auth || {})
    },
    storage: {
      get: key => storage.get(key),
      set: (key, value) => storage.set(key, value),
      remove: key => storage.delete(key)
    },
    invalidatePriceCache: () => calls.push('invalidate-prices'),
    refreshProtectedData: async context => { calls.push('refresh-protected'); return context.isCurrent(); },
    buildLogoutPatch: page => ({ loggedIn: false, page: page || 'mine', cartItems: [], orderRows: [] }),
    ...overrides
  });
  return { calls, session, storage };
}

test('begin keeps only an allow-listed continuation and returns the stable login-sheet patch', () => {
  const { session } = createHarness();
  const result = session.begin({
    type: 'addProduct', id: 'product-1', spec: '一盒', quantity: 3,
    returnPage: 'detail', activeTab: 'category', injected: 'secret'
  });

  assert.deepEqual(result, {
    status: 'login_required',
    continuation: {
      type: 'addProduct', id: 'product-1', spec: '一盒', quantity: 3,
      returnPage: 'detail', activeTab: 'category'
    },
    pagePatch: {
      showLogin: true,
      loginMounted: true,
      loginVisible: false,
      agreed: false,
      loginStatus: 'idle',
      loginErrorText: ''
    }
  });
  assert.equal(session.begin({ type: 'admin', token: 'secret' }).continuation, null);
});

test('complete authenticates through injected adapters and returns a stable identity and continuation result', async () => {
  let loginPayload;
  const { calls, session, storage } = createHarness({
    auth: {
      login: async payload => {
        loginPayload = payload;
        return { ok: true, data: { user: { _id: 'customer-1', userType: 'c', businessStatus: '', organizationId: '', status: 'active' } } };
      }
    }
  });
  session.begin({ type: 'addProduct', id: 'product-1', spec: '一盒', quantity: 2, returnPage: 'detail', activeTab: 'category' });

  const result = await session.complete({
    authPayload: { phoneCode: 'phone-code-1' },
    pageState: { page: 'detail', activeTab: 'category', detailReturnPage: 'mealIdeas' }
  });

  assert.deepEqual(loginPayload, { phoneCode: 'phone-code-1' });
  assert.equal(result.status, 'success');
  assert.equal(result.pagePatch.loggedIn, true);
  assert.equal(result.pagePatch.userType, 'c');
  assert.equal(result.pagePatch.profileTitle, '梦食鲜顾客');
  assert.equal(result.pagePatch.page, 'detail');
  assert.equal(result.pagePatch.detailReturnPage, 'mealIdeas');
  assert.deepEqual(result.continuation, {
    type: 'addProduct', id: 'product-1', spec: '一盒', quantity: 2,
    returnPage: 'detail', activeTab: 'category', returnActiveTab: 'category',
    detailReturnPage: 'mealIdeas', approvedBusiness: false
  });
  assert.deepEqual(calls, ['invalidate-prices', 'refresh-protected']);
  assert.equal(storage.get('mengshixian_login_agreed'), '1');
  assert.equal(session.hasUser(), true);
});

test('refresh coalesces concurrent identity reads and applies the approved-business safe return page', async () => {
  let reads = 0;
  let release;
  const response = new Promise(resolve => { release = resolve; });
  const { session } = createHarness({
    auth: {
      getMe: async () => {
        reads += 1;
        return response;
      }
    }
  });
  const pageState = { page: 'mealIdea', activeTab: 'frequent', detailReturnPage: 'mealIdeas' };
  const first = session.refresh({ pageState });
  const second = session.refresh({ pageState });
  release({ ok: true, data: { user: { _id: 'business-1', userType: 'b', businessStatus: 'approved', organizationId: 'org-1', status: 'active' } } });
  const [firstResult, secondResult] = await Promise.all([first, second]);

  assert.equal(reads, 1);
  assert.deepEqual(secondResult, firstResult);
  assert.equal(firstResult.status, 'success');
  assert.equal(firstResult.pagePatch.isApprovedBusiness, true);
  assert.equal(firstResult.pagePatch.page, 'home');
  assert.equal(firstResult.pagePatch.activeTab, 'home');
  assert.equal(firstResult.pagePatch.detailReturnPage, 'home');
  assert.equal(firstResult.pagePatch.selectedMealIdea, null);
});

test('a coalesced restore upgrades an earlier identity-only refresh without duplicating protected-data work', async () => {
  let reads = 0;
  let protectedRefreshes = 0;
  let releaseIdentity;
  const identityResponse = new Promise(resolve => { releaseIdentity = resolve; });
  const { session } = createHarness({
    auth: {
      getMe: async () => {
        reads += 1;
        return identityResponse;
      }
    },
    refreshProtectedData: async () => { protectedRefreshes += 1; }
  });

  const identityOnly = session.refresh({ pageState: { page: 'home' }, refreshProtectedData: false });
  const restoring = session.refresh({ pageState: { page: 'home' }, refreshProtectedData: true });
  releaseIdentity({ ok: true, data: { user: { _id: 'customer-1', userType: 'c', status: 'active' } } });
  const [identityResult, restoreResult] = await Promise.all([identityOnly, restoring]);

  assert.equal(reads, 1, 'coalesced refreshes must share one auth read');
  assert.equal(protectedRefreshes, 1, 'the stronger restore request must upgrade the shared refresh exactly once');
  assert.equal(identityResult.status, 'success');
  assert.equal(restoreResult.status, 'success');
});

test('a stronger refresh arriving after the shared identity result is ready still runs protected-data recovery', async () => {
  let reads = 0;
  let protectedRefreshes = 0;
  const { session } = createHarness({
    auth: {
      getMe: async () => {
        reads += 1;
        return { ok: true, data: { user: { _id: 'customer-1', userType: 'c', status: 'active' } } };
      }
    },
    refreshProtectedData: async () => { protectedRefreshes += 1; }
  });

  const identityOnly = session.refresh({ pageState: { page: 'home' }, refreshProtectedData: false });
  await Promise.resolve();
  const restoring = session.refresh({ pageState: { page: 'home' }, refreshProtectedData: true });
  const [identityResult, restoreResult] = await Promise.all([identityOnly, restoring]);

  assert.equal(reads, 1, 'the ready identity result must remain shared during the active refresh window');
  assert.equal(protectedRefreshes, 1, 'the late stronger caller must run protected recovery exactly once');
  assert.equal(identityResult.status, 'success');
  assert.equal(restoreResult.status, 'success');
});

test('logout while an upgraded protected refresh is pending keeps every coalesced caller stale', async () => {
  let releaseIdentity;
  let releaseProtected;
  let protectedStarted;
  const identityResponse = new Promise(resolve => { releaseIdentity = resolve; });
  const protectedReached = new Promise(resolve => { protectedStarted = resolve; });
  const protectedGate = new Promise(resolve => { releaseProtected = resolve; });
  const { session } = createHarness({
    auth: { getMe: async () => identityResponse },
    refreshProtectedData: async () => {
      protectedStarted();
      await protectedGate;
    }
  });

  const identityOnly = session.refresh({ pageState: { page: 'home' }, refreshProtectedData: false });
  const restoring = session.refresh({ pageState: { page: 'home' }, refreshProtectedData: true });
  releaseIdentity({ ok: true, data: { user: { _id: 'customer-1', userType: 'c', status: 'active' } } });
  await protectedReached;
  session.logout({ page: 'home' });
  releaseProtected();
  const [identityResult, restoreResult] = await Promise.all([identityOnly, restoring]);

  assert.equal(identityResult.status, 'stale');
  assert.equal(restoreResult.status, 'stale');
  assert.equal(session.hasUser(), false);
});

test('logout invalidates pending identity work, clears storage and returns the protected-data cleanup patch', async () => {
  let releaseRefresh;
  const delayedRefresh = new Promise(resolve => { releaseRefresh = resolve; });
  const { session, storage } = createHarness({ auth: { getMe: async () => delayedRefresh } });
  await session.complete({ authPayload: {}, pageState: { page: 'mine', activeTab: 'mine', detailReturnPage: 'home' } });
  const authenticatedScope = session.scope();
  const pending = session.refresh({ pageState: { page: 'mine', activeTab: 'mine', detailReturnPage: 'home' } });

  const logout = session.logout({ page: 'mine' });
  releaseRefresh({ ok: true, data: { user: { _id: 'late-business', userType: 'b', businessStatus: 'approved', organizationId: 'late-org', status: 'active' } } });
  const lateResult = await pending;

  assert.equal(logout.status, 'logged_out');
  assert.deepEqual(logout.pagePatch, { loggedIn: false, page: 'mine', cartItems: [], orderRows: [] });
  assert.equal(session.hasUser(), false);
  assert.notEqual(session.scope(), authenticatedScope);
  assert.equal(storage.has('mengshixian_login_agreed'), false);
  assert.equal(lateResult.status, 'stale');
});

test('an expired refresh clears protected state and exposes one allow-listed recovery continuation', async () => {
  const { session, storage } = createHarness({
    auth: {
      getMe: async () => ({ ok: false, error: { code: 'AUTH_SESSION_EXPIRED', message: '登录已过期' } })
    }
  });
  await session.complete({ authPayload: {}, pageState: { page: 'mine', activeTab: 'mine', detailReturnPage: 'home' } });

  const result = await session.refresh({
    pageState: { page: 'utility', utilityType: 'orders', orderFilter: '待收货', activeTab: 'mine', detailReturnPage: 'home' }
  });

  assert.equal(result.status, 'expired');
  assert.equal(result.pagePatch.loggedIn, false);
  assert.equal(result.pagePatch.page, 'home');
  assert.equal(result.pagePatch.sessionExpiredVisible, true);
  assert.equal(session.hasUser(), false);
  assert.equal(storage.has('mengshixian_login_agreed'), false);
  assert.deepEqual(session.retry(), { type: 'orders', filter: '待收货', returnPage: 'home', activeTab: 'home' });
  assert.equal(session.retry(), null);
});

test('business application completion exposes only the pending semantic transition', () => {
  const { session } = createHarness();
  session.accept({ _id: 'customer-1', userType: 'c', businessStatus: '', organizationId: '', status: 'active' }, { page: 'mine' });

  const result = session.markBusinessPending({ page: 'utility', activeTab: 'mine', detailReturnPage: 'home' });

  assert.equal(result.status, 'success');
  assert.equal(result.pagePatch.businessStatus, 'pending');
  assert.equal(result.pagePatch.userType, 'c');
  assert.equal(session.update, undefined, 'callers must not receive an arbitrary identity patch API');
});

test('the index page composes the identity session instead of retaining session-private facts', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../miniapp/pages/index/index.js'), 'utf8');
  assert.match(source, /createIdentitySession/);
  for (const privateFact of ['_remoteUser', '_identityGeneration', '_remoteIdentityRequest', '_loginContinuation', '_sessionRecoveryContinuation']) {
    assert.equal(source.includes(privateFact), false, `${privateFact} must be owned by identity-session`);
  }
});

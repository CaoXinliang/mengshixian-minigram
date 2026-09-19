const { continuationFor, identityView, isApprovedBusiness, safeReturnPage } = require('./identity-state');
const { deriveMemberHomeModel } = require('./member-presentation');
const { isSessionExpired } = require('./login-flow');

const DEFAULT_STORAGE_KEY = 'mengshixian_login_agreed';

function createIdentitySession(options = {}) {
  const auth = options.auth || {};
  const storage = options.storage || {};
  const cloudMode = options.cloudMode === true;
  const storageKey = options.storageKey || DEFAULT_STORAGE_KEY;
  let continuation = null;
  let user = null;
  let revision = 0;
  let activeRefresh = null;
  let recoveryContinuation = null;

  function hasUser() { return Boolean(user); }
  function hasStoredSession() { return Boolean(typeof storage.get === 'function' && storage.get(storageKey)); }

  function identityFacts(value) {
    const identity = value || {};
    return [
      identity._id || identity.id || identity.userId || identity.openid || '',
      identity.userType || '', identity.businessStatus || '', identity.organizationId || '',
      identity.status || '', identity.priceLevel || ''
    ];
  }

  function identityFingerprint(value) { return JSON.stringify(identityFacts(value)); }

  function pagePatchFor(nextUser, pageState = {}) {
    const page = safeReturnPage(pageState.page, nextUser) || 'home';
    const detailReturnPage = safeReturnPage(pageState.detailReturnPage, nextUser) || 'home';
    const identityPatch = typeof options.identityPatch === 'function'
      ? options.identityPatch(nextUser)
      : { ...identityView(nextUser), memberHomeModel: deriveMemberHomeModel(nextUser) };
    return {
      loggedIn: true,
      priceFallback: '暂不可购买',
      page,
      activeTab: page === 'home' ? 'home' : pageState.activeTab,
      detailReturnPage,
      ...(page !== pageState.page ? {
        selectedMealIdea: null,
        quantityPickerVisible: false,
        quantityPickerProduct: null,
        quantityPickerSpec: '',
        quantityPickerQty: 1
      } : {}),
      ...identityPatch
    };
  }

  function continuationResult(value, nextUser, pageState = {}) {
    if (!value) return null;
    const returnPage = safeReturnPage(value.returnPage || pageState.page, nextUser) || 'home';
    const returnActiveTab = returnPage === 'home' ? 'home' : (value.activeTab || pageState.activeTab);
    return {
      ...value,
      returnPage,
      activeTab: value.activeTab,
      returnActiveTab,
      detailReturnPage: safeReturnPage(pageState.detailReturnPage, nextUser) || 'home',
      approvedBusiness: isApprovedBusiness(nextUser)
    };
  }

  function begin(value) {
    continuation = continuationFor(value);
    return {
      status: 'login_required',
      continuation,
      pagePatch: {
        showLogin: true,
        loginMounted: true,
        loginVisible: false,
        agreed: false,
        loginStatus: 'idle',
        loginErrorText: ''
      }
    };
  }

  async function complete(input = {}) {
    const token = ++revision;
    let nextUser = input.localUser || null;
    if (cloudMode) {
      let result;
      try {
        result = await auth.login(input.authPayload || {});
      } catch (_) {
        result = null;
      }
      if (token !== revision) return { status: 'stale' };
      if (!result || !result.ok) {
        return {
          status: 'failed',
          pagePatch: {
            loginStatus: 'failed',
            loginErrorText: result && result.error && result.error.message || '微信登录失败，请稍后重试'
          }
        };
      }
      nextUser = result.data && result.data.user;
      if (!nextUser) {
        return { status: 'failed', pagePatch: { loginStatus: 'failed', loginErrorText: '微信登录返回异常，请稍后重试' } };
      }
    }
    nextUser = nextUser || { userType: 'c', status: 'active' };
    if (typeof options.invalidatePriceCache === 'function') options.invalidatePriceCache();
    user = nextUser;
    if (typeof options.refreshProtectedData === 'function') {
      await options.refreshProtectedData({ scope: scope(), isCurrent: () => token === revision });
    }
    if (token !== revision) return { status: 'stale' };
    if (cloudMode && typeof storage.set === 'function') storage.set(storageKey, '1');
    const resumed = continuationResult(continuation, nextUser, input.pageState);
    continuation = null;
    return {
      status: 'success',
      pagePatch: {
        ...pagePatchFor(nextUser, input.pageState),
        loginStatus: 'success',
        loginErrorText: '',
        sessionExpiredVisible: false
      },
      continuation: resumed,
      scope: scope()
    };
  }

  async function refreshProtectedData(cycle) {
    if (cycle.token !== revision) return false;
    if (typeof options.refreshProtectedData !== 'function') return true;
    if (!cycle.protectedPromise) {
      cycle.protectedPromise = (async () => {
        await options.refreshProtectedData({ scope: scope(), isCurrent: () => cycle.token === revision });
        return cycle.token === revision;
      })();
    }
    return cycle.protectedPromise;
  }

  function refresh(input = {}) {
    if (!cloudMode) {
      return Promise.resolve(user
        ? { status: 'success', pagePatch: pagePatchFor(user, input.pageState) }
        : { status: 'anonymous' });
    }
    if (activeRefresh) {
      const cycle = activeRefresh;
      if (!input.refreshProtectedData) return cycle.promise;
      cycle.refreshProtectedData = true;
      return cycle.promise.then(async result => {
        if (!result || result.status !== 'success') return result;
        return await refreshProtectedData(cycle) ? result : { status: 'stale' };
      });
    }
    const token = revision;
    const cycle = { token, refreshProtectedData: Boolean(input.refreshProtectedData), protectedPromise: null, promise: null };
    const request = (async () => {
      let result;
      try {
        result = await auth.getMe();
      } catch (_) {
        return { status: 'unavailable' };
      }
      if (token !== revision) return { status: 'stale' };
      if (!result || !result.ok || !result.data || !result.data.user) {
        if (isSessionExpired(result)) return expire(input.pageState);
        return { status: 'anonymous', result };
      }
      const nextUser = result.data.user;
      if (identityFingerprint(user) !== identityFingerprint(nextUser) && typeof options.invalidatePriceCache === 'function') {
        options.invalidatePriceCache();
      }
      user = nextUser;
      if (cycle.refreshProtectedData) {
        const current = await refreshProtectedData(cycle);
        if (!current) return { status: 'stale' };
      }
      return { status: 'success', pagePatch: pagePatchFor(nextUser, input.pageState), scope: scope() };
    })();
    cycle.promise = request.finally(() => {
      if (activeRefresh === cycle) activeRefresh = null;
    });
    activeRefresh = cycle;
    return cycle.promise;
  }

  function scope() {
    return JSON.stringify([revision, ...identityFacts(user)]);
  }

  function isCurrent(value) { return value === scope(); }

  function accept(nextUser, pageState = {}) {
    if (!nextUser) return { status: 'anonymous' };
    if (identityFingerprint(user) !== identityFingerprint(nextUser) && typeof options.invalidatePriceCache === 'function') {
      options.invalidatePriceCache();
    }
    user = nextUser;
    return { status: 'success', pagePatch: pagePatchFor(nextUser, pageState), scope: scope() };
  }

  function markBusinessPending(pageState = {}) {
    if (!user) return { status: 'anonymous' };
    return accept({ ...user, businessStatus: 'pending' }, pageState);
  }

  function logout(input = {}) {
    revision += 1;
    user = null;
    continuation = null;
    recoveryContinuation = null;
    activeRefresh = null;
    if (typeof options.invalidatePriceCache === 'function') options.invalidatePriceCache();
    if (cloudMode && typeof storage.remove === 'function') storage.remove(storageKey);
    return {
      status: 'logged_out',
      pagePatch: typeof options.buildLogoutPatch === 'function'
        ? options.buildLogoutPatch(input.page)
        : { loggedIn: false, page: input.page || 'mine' }
    };
  }

  function expire(pageState = {}) {
    const recovery = pageState.page === 'utility'
      ? continuationFor({ type: pageState.utilityType, filter: pageState.orderFilter, returnPage: 'home', activeTab: 'home' })
      : continuationFor({ type: pageState.page === 'mine' ? 'mine' : '', returnPage: 'home', activeTab: 'home' });
    const result = logout({ page: 'home' });
    recoveryContinuation = recovery;
    return { ...result, status: 'expired', pagePatch: { ...result.pagePatch, sessionExpiredVisible: true } };
  }

  function retry() {
    const recovery = recoveryContinuation;
    recoveryContinuation = null;
    return recovery;
  }

  function cancelRecovery() { recoveryContinuation = null; }

  return { accept, begin, cancelRecovery, complete, expire, hasStoredSession, hasUser, isCurrent, logout, markBusinessPending, refresh, retry, scope };
}

module.exports = { createIdentitySession };

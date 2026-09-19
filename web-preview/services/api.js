const runtimeConfig = typeof window !== 'undefined' ? (window.MENGSHIXIAN_WEB_CONFIG || {}) : {};
const config = {
  provider: runtimeConfig.provider || 'mock',
  cloudFunctionUrl: runtimeConfig.cloudFunctionUrl || '',
  envId: runtimeConfig.envId || '',
  functionName: runtimeConfig.functionName || 'api',
  timeoutMs: 8000,
  priceFieldsNeverFallback: true
};
let cloudApp;
let cloudAuth;
let cloudSigningIn;

async function ensureCloudApp() {
  if (!config.envId || !config.functionName) throw new Error('网页版尚未配置 CloudBase 环境或云函数。');
  if (typeof window === 'undefined' || !window.cloudbase) throw new Error('CloudBase Web SDK 未加载。');
  if (!cloudApp) cloudApp = window.cloudbase.init({ env: config.envId, region: 'ap-shanghai' });
  if (!cloudAuth) cloudAuth = typeof cloudApp.auth === 'function' ? cloudApp.auth() : cloudApp.auth;
  if (!cloudAuth || typeof cloudAuth.signInAnonymously !== 'function') throw new Error('CloudBase 匿名认证不可用。');
  if (!cloudSigningIn) cloudSigningIn = Promise.resolve(cloudAuth.signInAnonymously()).finally(() => { cloudSigningIn = null; });
  await cloudSigningIn;
  return cloudApp;
}
const WEB_SESSION_KEY = 'mengshixian.webSessionToken';
const authErrors = new Set(['AUTH_SESSION_EXPIRED', 'AUTH_ACCOUNT_DISABLED', 'AUTH_EXPIRED']);
function sessionStore() { try { return typeof sessionStorage !== 'undefined' ? sessionStorage : null; } catch (_) { return null; } }
function getSessionToken() { return sessionStore()?.getItem(WEB_SESSION_KEY) || ''; }
function setSessionToken(token) { const store = sessionStore(); if (!store) return; if (token) store.setItem(WEB_SESSION_KEY, String(token)); else store.removeItem(WEB_SESSION_KEY); }
function clearSession() { setSessionToken(''); }
function notifyAuthExpired(error) {
  clearSession();
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') window.dispatchEvent(new CustomEvent('mengshixian:auth-expired', { detail: error || {} }));
}

function makeResult(ok, data, error, requestId) {
  return { ok, data: data === undefined ? null : data, error: error || null, requestId: requestId || '' };
}

function request(action, payload) {
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  if (config.provider === 'mock') {
    return Promise.resolve(makeResult(false, null, {
      code: 'MOCK_PROVIDER',
      message: '当前使用演示数据适配器，尚未连接生产 API。'
    }, requestId));
  }
  const canUseHttp = Boolean(config.cloudFunctionUrl && typeof fetch === 'function');
  const canUseSdk = Boolean(config.envId && config.functionName && typeof window !== 'undefined' && window.cloudbase);
  if (!canUseHttp && !canUseSdk) {
    return Promise.resolve(makeResult(false, null, {
      code: 'WEB_API_NOT_CONFIGURED',
      message: '网页版尚未配置统一 API 地址。'
    }, requestId));
  }
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timeoutMs = Number(config.timeoutMs) > 0 ? Number(config.timeoutMs) : 8000;
  let timedOut = false;
  let timer;
  const timeoutResult = new Promise((resolve) => {
    timer = setTimeout(() => {
      timedOut = true;
      if (controller) controller.abort();
      resolve(makeResult(false, null, {
        code: 'REQUEST_TIMEOUT',
        message: '请求超时，请检查网络后重试。'
      }, requestId));
    }, timeoutMs);
  });
  const token = getSessionToken();
  const requestPayload = { ...(payload || {}), ...(token && action !== 'auth.web.login' ? { sessionToken: token } : {}) };
  const transportRequest = canUseHttp
    ? fetch(config.cloudFunctionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload: requestPayload, requestId }),
      ...(controller ? { signal: controller.signal } : {})
    }).then((response) => response.json())
    : ensureCloudApp().then((app) => app.callFunction({
      name: config.functionName,
      data: { action, payload: requestPayload, requestId },
      parse: true
    })).then((response) => response && response.result);
  const remoteRequest = transportRequest.then((result) => (
    result && typeof result.ok === 'boolean' ? result : makeResult(true, result, null, requestId)
  )).then((result) => { if (!result?.ok && authErrors.has(result.error?.code)) notifyAuthExpired(result.error); return result; }).catch((error) => makeResult(false, null, timedOut ? {
    code: 'REQUEST_TIMEOUT',
    message: '请求超时，请检查网络后重试。'
  } : {
    code: 'REQUEST_FAILED',
    message: error && error.message ? error.message : '请求失败'
  }, requestId)).finally(() => clearTimeout(timer));
  return Promise.race([remoteRequest, timeoutResult]);
}

const api = {
  config,
  getSessionToken,
  setSessionToken,
  clearSession,
  auth: {
    login: (payload) => request('auth.web.login', payload),
    getMe: () => request('auth.web.me'),
    logout: () => request('auth.web.logout'),
    changePassword: (payload) => request('auth.web.password.change', payload)
  },
  catalog: {
    getHome: (payload) => request('content.home', payload),
    listCategories: (payload) => request('catalog.categories', payload),
    listProducts: (payload) => request('catalog.products', payload),
    getProduct: (productId) => request('catalog.product', { productId }),
    listPrices: (skuIds) => request('catalog.prices', { skuIds, channel: 'web' })
  },
  pricing: { quote: (payload) => request('checkout.quote', payload) },
  cart: {
    get: (payload) => request('cart.list', payload),
    addItem: (payload) => request('cart.upsert', payload),
    updateItem: (payload) => request('cart.upsert', payload),
    removeItem: (id) => request('cart.remove', { id })
  },
  checkout: {
    quote: (payload) => request('checkout.quote', payload),
    createOrder: (payload) => request('orders.create', payload)
  },
  delivery: { options: () => request('delivery.options') },
  orders: {
    list: (payload) => request('orders.list', payload),
    get: (id) => request('orders.get', { id }),
    cancel: (payload) => request('orders.cancel', payload),
    confirm: (payload) => request('orders.complete', payload)
  },
  favorites: {
    list: (payload) => request('favorites.list', payload),
    save: (payload) => request('favorites.upsert', payload),
    remove: (id) => request('favorites.remove', { id }),
    batchAddToCart: (payload) => request('favorites.batchAddToCart', payload)
  },
  frequent: {
    list: (payload) => request('frequent.list', payload),
    save: (payload) => request('frequent.upsert', payload),
    remove: (id) => request('frequent.remove', { id }),
    batchAddToCart: (payload) => request('frequent.batchAddToCart', payload)
  },
  repurchase: {
    preview: (orderId) => request('orders.repurchase.preview', { orderId }),
    commit: (payload) => request('orders.repurchase.commit', payload)
  },
  procurement: {
    getAccount: () => request('procurement.account.get'),
    listReceivables: (payload) => request('procurement.receivables.list', payload),
    listStatements: (payload) => request('procurement.statements.list', payload)
  },
  inquiries: {
    create: (payload) => request('inquiries.create', payload),
    list: (payload) => request('inquiries.list', payload),
    get: (id) => request('inquiries.get', { id }),
    accept: (payload) => request('inquiries.accept', payload)
  },
  bundles: {
    list: (payload) => request('bundles.list', payload),
    get: (id) => request('bundles.get', { id }),
    quote: (payload) => request('bundles.quote', payload)
  },
  groups: {
    campaigns: (payload) => request('groups.campaigns', payload),
    mine: (payload) => request('groups.mine', payload),
    get: (groupId) => request('groups.get', { groupId }),
    create: (payload) => request('groups.create', payload),
    join: (payload) => request('groups.join', payload)
  },
  coupons: {
    templates: (payload) => request('coupons.templates', payload),
    claim: (payload) => request('coupons.claim', payload),
    list: (payload) => request('coupons.list', payload)
  },
  points: {
    account: () => request('points.account'),
    signIn: (payload) => request('points.signIn', payload),
    ledger: (payload) => request('points.ledger', payload)
  },
  membership: { profile: () => request('membership.profile') },
  reviews: {
    list: (payload) => request('reviews.list', payload),
    eligible: (payload) => request('reviews.eligible', payload),
    create: (payload) => request('reviews.create', payload),
    mine: (payload) => request('reviews.mine', payload)
  },
  invoiceTitles: {
    list: (payload) => request('invoiceTitles.list', payload),
    save: (payload) => request('invoiceTitles.upsert', payload),
    remove: (id) => request('invoiceTitles.delete', { id })
  },
  invoices: {
    request: (payload) => request('invoices.request', payload),
    list: (payload) => request('invoices.list', payload),
    get: (id) => request('invoices.get', { id })
  },
  storedValue: {
    account: () => request('storedValue.account'),
    ledger: (payload) => request('storedValue.ledger', payload),
    topupIntent: (payload) => request('storedValue.topupIntent', payload)
  },
  refunds: {
    list: (payload) => request('refunds.list', payload),
    get: (id) => request('refunds.get', { id }),
    uploadMedia: (payload) => request('refunds.media.upload', payload),
    request: (payload) => request('refunds.request', payload)
  },
  content: {
    getBanners: (payload) => request('content.banners', payload),
    getHomeSections: (payload) => request('content.homeSections', payload),
    resolveMedia: (ids) => request('content.media.resolve', { ids, platform: 'web' })
  },
  address: {
    list: (payload) => request('address.list', payload),
    save: (payload) => request('address.upsert', payload),
    setDefault: (id) => request('address.setDefault', { id }),
    remove: (id) => request('address.delete', { id })
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.MengshixianApi = api;

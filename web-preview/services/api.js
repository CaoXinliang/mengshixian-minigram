const config = {
  provider: 'mock',
  cloudFunctionUrl: '',
  timeoutMs: 8000,
  priceFieldsNeverFallback: true
};

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
  if (!config.cloudFunctionUrl || typeof fetch !== 'function') {
    return Promise.resolve(makeResult(false, null, {
      code: 'WEB_API_NOT_CONFIGURED',
      message: '网页版尚未配置统一 API 地址。'
    }, requestId));
  }
  return fetch(config.cloudFunctionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload: payload || {}, requestId })
  }).then((response) => response.json()).then((result) => (
    result && typeof result.ok === 'boolean' ? result : makeResult(true, result, null, requestId)
  )).catch((error) => makeResult(false, null, {
    code: 'REQUEST_FAILED',
    message: error && error.message ? error.message : '请求失败'
  }, requestId));
}

const api = {
  config,
  auth: {
    login: () => request('auth.webLogin'),
    getMe: () => request('auth.me')
  },
  catalog: {
    getHome: (payload) => request('content.home', payload),
    listCategories: (payload) => request('catalog.categories', payload),
    listProducts: (payload) => request('catalog.products', payload),
    getProduct: (productId) => request('catalog.product', { productId })
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
    createOrder: (payload) => request('checkout.createOrder', payload)
  },
  orders: {
    list: (payload) => request('orders.list', payload),
    get: (id) => request('orders.get', { id }),
    cancel: (payload) => request('orders.cancel', payload),
    confirm: (payload) => request('orders.complete', payload)
  },
  content: {
    getBanners: (payload) => request('content.banners', payload),
    getHomeSections: (payload) => request('content.homeSections', payload),
    resolveMedia: (ids) => request('content.media.resolve', { ids, platform: 'web' })
  },
  address: {
    list: () => request('address.list'),
    save: (payload) => request('address.upsert', payload),
    remove: (id) => request('address.delete', { id })
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.MengshixianApi = api;

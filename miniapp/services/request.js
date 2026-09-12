const config = require('./config');

function makeResult(ok, data, error, requestId) {
  return { ok, data: data === undefined ? null : data, error: error || null, requestId: requestId || '' };
}

function request(action, payload) {
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (config.provider === 'mock') {
    return Promise.resolve(makeResult(false, null, {
      code: 'MOCK_PROVIDER',
      message: '当前数据服务暂不可用，请稍后重试。'
    }, requestId));
  }

  if (typeof wx === 'undefined' || !wx.cloud || typeof wx.cloud.callFunction !== 'function') {
    return Promise.resolve(makeResult(false, null, {
      code: 'CLOUD_NOT_READY',
      message: 'CloudBase 尚未初始化。'
    }, requestId));
  }

  if (!config.cloudEnvId) {
    return Promise.resolve(makeResult(false, null, {
      code: 'CLOUD_ENV_NOT_CONFIGURED',
      message: '尚未配置已确认的 CloudBase 环境 ID。'
    }, requestId));
  }

  const timeoutMs = Number(config.timeoutMs) > 0 ? Number(config.timeoutMs) : 15000;
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(() => finish(makeResult(false, null, {
      code: 'REQUEST_TIMEOUT',
      message: '请求超时，请检查网络后重试。'
    }, requestId)), timeoutMs);
    let cloudCall;
    try {
      cloudCall = wx.cloud.callFunction({
        name: config.cloudFunctionName,
        data: { action, payload: payload || {}, requestId }
      });
    } catch (err) {
      finish(makeResult(false, null, { code: 'REQUEST_FAILED', message: err && err.errMsg ? err.errMsg : '请求失败' }, requestId));
      return;
    }
    Promise.resolve(cloudCall).then((res) => {
      const result = res && res.result ? res.result : null;
      finish(result && typeof result.ok === 'boolean'
        ? result
        : makeResult(true, result, null, requestId));
    }).catch((err) => finish(makeResult(false, null, {
      code: 'REQUEST_FAILED',
      message: err && err.errMsg ? err.errMsg : '请求失败'
    }, requestId)));
  });
}

module.exports = { request, makeResult };

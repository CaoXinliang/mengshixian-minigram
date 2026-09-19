const config = require('./config');

const DEFAULT_PUBLIC_ERROR_MESSAGE = '服务暂时不可用，请稍后重试。';
const TECHNICAL_ERROR_PATTERN = /(?:cloudbase|cloud\.callFunction|云函数|functions? execute fail|functions_execute_fail|err(?:code|msg)|cannot find module|require stack|\/var\/user|wa(?:service|worker)|provider|环境\s*id|服务端返回格式异常|trace:|https?:\/\/[^\s]*error-code)/i;

function sanitizePublicError(error, fallback = DEFAULT_PUBLIC_ERROR_MESSAGE) {
  if (!error) return { code: 'REQUEST_FAILED', message: fallback };
  const message = String(error.message || '').trim();
  const unsafe = !message || message.length > 80 || /[\r\n]/.test(message) || TECHNICAL_ERROR_PATTERN.test(message);
  return { ...error, message: unsafe ? fallback : message };
}

function makeResult(ok, data, error, requestId) {
  return { ok, data: data === undefined ? null : data, error: error ? sanitizePublicError(error) : null, requestId: requestId || '' };
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
      message: DEFAULT_PUBLIC_ERROR_MESSAGE
    }, requestId));
  }

  if (!config.cloudEnvId) {
    return Promise.resolve(makeResult(false, null, {
      code: 'CLOUD_ENV_NOT_CONFIGURED',
      message: DEFAULT_PUBLIC_ERROR_MESSAGE
    }, requestId));
  }

  const timeoutMs = Number(config.timeoutMs) > 0 ? Number(config.timeoutMs) : 15000;
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result && result.ok === false ? { ...result, error: sanitizePublicError(result.error) } : result);
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
      finish(makeResult(false, null, { code: 'REQUEST_FAILED', message: DEFAULT_PUBLIC_ERROR_MESSAGE }, requestId));
      return;
    }
    Promise.resolve(cloudCall).then((res) => {
      const result = res && res.result !== undefined ? res.result : null;
      if (result && typeof result.ok === 'boolean') {
        return finish(result);
      }
      if (res && typeof res.errMsg === 'string' && /^cloud\.callFunction:/.test(res.errMsg)) {
        return finish(makeResult(false, null, {
          code: 'REQUEST_FAILED',
          message: DEFAULT_PUBLIC_ERROR_MESSAGE
        }, requestId));
      }
      return finish(makeResult(false, null, {
        code: 'INVALID_API_RESPONSE',
        message: DEFAULT_PUBLIC_ERROR_MESSAGE
      }, requestId));
    }).catch((err) => finish(makeResult(false, null, {
      code: 'REQUEST_FAILED',
      message: DEFAULT_PUBLIC_ERROR_MESSAGE
    }, requestId)));
  });
}

module.exports = { request, makeResult, sanitizePublicError };

const assert = require('assert/strict');
const path = require('path');

(async () => {
  const miniConfigPath = path.resolve(__dirname, '../miniapp/services/config.js');
  const miniRequestPath = path.resolve(__dirname, '../miniapp/services/request.js');
  const miniConfig = require(miniConfigPath);
  const originalMiniTimeout = miniConfig.timeoutMs;
  const originalWx = global.wx;
  miniConfig.timeoutMs = 5;
  global.wx = { cloud: { callFunction: () => new Promise(() => {}) } };
  delete require.cache[miniRequestPath];
  const miniRequest = require(miniRequestPath);
  const miniResult = await miniRequest.request('health', {});
  assert.equal(miniResult.ok, false);
  assert.equal(miniResult.error.code, 'REQUEST_TIMEOUT');
  assert.match(miniResult.error.message, /超时/);
  miniConfig.timeoutMs = originalMiniTimeout;
  if (originalWx === undefined) delete global.wx;
  else global.wx = originalWx;

  const webApiPath = path.resolve(__dirname, '../web-preview/services/api.js');
  const originalFetch = global.fetch;
  global.fetch = () => new Promise(() => {});
  delete require.cache[webApiPath];
  const webApi = require(webApiPath);
  webApi.config.provider = 'cloudbase';
  webApi.config.cloudFunctionUrl = 'https://example.invalid/cloud-function';
  webApi.config.timeoutMs = 5;
  const webResult = await webApi.catalog.listProducts({ page: 1, pageSize: 1 });
  assert.equal(webResult.ok, false);
  assert.equal(webResult.error.code, 'REQUEST_TIMEOUT');
  assert.match(webResult.error.message, /超时/);
  if (originalFetch === undefined) delete global.fetch;
  else global.fetch = originalFetch;

  console.log('request timeout test: passed');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

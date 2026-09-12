const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'web-preview', 'services', 'api.js'), 'utf8');
const appSource = fs.readFileSync(path.resolve(__dirname, '..', 'web-preview', 'app.js'), 'utf8');
assert(!source.includes('localStorage'), 'web auth implementation must never use localStorage');
assert(!appSource.includes('data-action="one-tap-login"') && !/function switchRole\s*\(/.test(appSource), 'local B/C role switching must be removed');
assert.match(appSource, /auth\.login\(\{ loginId, password \}\)/, 'login UI must submit credentials to web auth');
assert.match(appSource, /user\.userType === 'b'[\s\S]*user\.businessStatus === 'approved'/, 'role must derive from authenticated backend user');
const sessionValues = new Map();
const requests = [];
const events = [];
let nextResponse = { ok: true, data: { rows: [] } };
const context = {
  module: { exports: {} }, exports: {}, console,
  sessionStorage: { getItem: key => sessionValues.get(key) || null, setItem: (key, value) => sessionValues.set(key, String(value)), removeItem: key => sessionValues.delete(key) },
  localStorage: { getItem() { throw new Error('localStorage must not be read'); }, setItem() { throw new Error('localStorage must not be written'); }, removeItem() { throw new Error('localStorage must not be touched'); } },
  window: { dispatchEvent: event => events.push(event) },
  CustomEvent: class CustomEvent { constructor(type, options) { this.type = type; this.detail = options && options.detail; } },
  fetch: async (_url, options) => { requests.push(JSON.parse(options.body)); return { json: async () => nextResponse }; },
  AbortController, setTimeout, clearTimeout, Promise, Date, Math
};
vm.runInNewContext(source, context, { filename: 'web-preview/services/api.js' });
const api = context.module.exports;
api.config.provider = 'cloudbase'; api.config.cloudFunctionUrl = 'https://api.invalid';

(async () => {
  api.setSessionToken('session-secret');
  assert.equal(sessionValues.get('mengshixian.webSessionToken'), 'session-secret');
  await api.orders.list({ page: 1 });
  assert.equal(requests[0].payload.sessionToken, 'session-secret', 'protected request must attach session token');
  assert.equal(requests[0].payload.webSessionToken, undefined, 'deprecated duplicate token field must not be sent');

  nextResponse = { ok: false, error: { code: 'AUTH_SESSION_EXPIRED', message: 'expired' } };
  await api.orders.list({ page: 2 });
  assert.equal(api.getSessionToken(), '', 'expired auth must clear sessionStorage token');
  assert.equal(events.at(-1).type, 'mengshixian:auth-expired', 'expired auth must notify UI once');

  nextResponse = { ok: true, data: { sessionToken: 'new-token', user: { userType: 'c' } } };
  await api.auth.login({ loginId: 'buyer', password: 'safe-password' });
  assert.equal(requests.at(-1).action, 'auth.web.login');
  assert.equal(requests.at(-1).payload.sessionToken, undefined, 'login request must not attach stale session');
  console.log('web auth session runtime: passed');
})().catch(error => { console.error(error); process.exitCode = 1; });

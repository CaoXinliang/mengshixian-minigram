const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const collection = require('../miniapp/services/collection');

const source = fs.readFileSync(path.join(__dirname, '../web-preview/app.js'), 'utf8');
const api = fs.readFileSync(path.join(__dirname, '../web-preview/services/api.js'), 'utf8');

for (const action of [
  'favorites.list', 'favorites.upsert', 'favorites.remove', 'favorites.batchAddToCart',
  'frequent.list', 'frequent.upsert', 'frequent.remove', 'frequent.batchAddToCart',
  'orders.repurchase.preview', 'orders.repurchase.commit',
  'procurement.account.get', 'procurement.receivables.list', 'procurement.statements.list',
  'inquiries.create', 'inquiries.list', 'inquiries.get', 'inquiries.accept'
]) assert(api.includes(`request('${action}'`), `web API adapter missing ${action}`);

assert.match(source, /state\.remoteUser\?\.userType === 'b' && state\.remoteUser\?\.businessStatus === 'approved'/, 'cloud B2B access must use the server-verified identity');
assert.match(source, /if \(!isVerifiedBusiness\(\)\) return;/, 'sensitive B2B loaders must stop before requests for C or logged-out users');
assert.match(source, /fetchRemotePages\(params => window\.MengshixianApi\.frequent\.list/, 'frequent list must load all pages');
assert.match(source, /frequent\.batchAddToCart\(\{ ids:[\s\S]*idempotencyKey:/, 'batch frequent add must submit selected IDs and an idempotency key');
assert.match(source, /preview\.addedItems[\s\S]*preview\.invalidItems/, 'repurchase preview must separate valid and invalid items');
assert.match(source, /repurchase\.commit\(\{ orderId: state\.repurchaseOrderId \}\)/, 'repurchase commit must target the previewed order');
assert.match(source, /procurement\.getAccount\(\)/, 'procurement page must load the credit account');
assert.match(source, /creditLimitCent[\s\S]*availableCent[\s\S]*occupiedCent[\s\S]*receivableCent/, 'procurement page must show credit, available, occupied and receivable balances');
assert.match(source, /inquiries\.accept\(\{ id: input\.inquiryId, quoteId: input\.quoteId, version: Number\(input\.version\)[\s\S]*idempotencyKey:/, 'quote acceptance must pin inquiry, quote ID, version and a stable idempotency key');
assert.match(source, /!quote\?\.temporary && quote\?\.source === 'client'/, 'temporary or AI quotes must not expose an accept action');
assert.match(source, /data-accept-destination="cart"[\s\S]*data-accept-destination="checkout"/, 'formal quotes must support cart and checkout destinations');
assert.match(source, /auth\.getMe\(\)/, 'web login must verify the real server identity before B2B access');

async function flush(turns = 8) { for (let index = 0; index < turns; index += 1) await new Promise(resolve => setImmediate(resolve)); }
(async () => {
  const nodes = new Map();
  const node = selector => {
    if (!nodes.has(selector)) nodes.set(selector, { innerHTML: '', textContent: '', dataset: {}, hidden: false, checked: true, value: '', classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } }, addEventListener() {}, setAttribute() {}, querySelector: child => node(selector + child), querySelectorAll: () => [] });
    return nodes.get(selector);
  };
  const calls = [];
  const page = rows => async payload => { calls.push(payload); return { ok: true, data: { rows } }; };
  const remoteApi = {
    config: { provider: 'cloudbase' },
    getSessionToken: () => '',
    catalog: { listProducts: page([]), listCategories: page([]), listPrices: page([]) },
    content: { getBanners: page([]), getHomeSections: page([]), resolveMedia: page([]) },
    frequent: { list: page([{ _id: 'f1', skuId: 's1', quantity: 2 }]) },
    procurement: { async getAccount() { calls.push('account'); return { ok: true, data: { account: { creditLimitCent: 10000, availableCent: 8000, occupiedCent: 1000, receivableCent: 1000, status: 'active' } } }; }, listReceivables: page([]), listStatements: page([]) },
    inquiries: { list: page([]) }
  };
  const context = vm.createContext({ document: { querySelector: node, querySelectorAll: () => [], addEventListener() {}, body: { contains() { return true; } } }, window: { MengshixianApi: remoteApi, MengshixianCollection: collection, scrollTo() {}, matchMedia: () => ({ matches: true }) }, setInterval() {}, setTimeout() {}, clearTimeout() {}, console });
  vm.runInContext(source, context); await flush(); calls.length = 0;
  await vm.runInContext('Promise.all([loadBusinessFrequent(), loadProcurement(), loadInquiries()])', context);
  assert.equal(calls.length, 0, 'logged-out users must not issue B2B data requests');
  vm.runInContext("state.user.loggedIn = true; state.remoteUser = { userType: 'c', businessStatus: 'none' }", context);
  await vm.runInContext('Promise.all([loadBusinessFrequent(), loadProcurement(), loadInquiries()])', context);
  assert.equal(calls.length, 0, 'C customers must not issue B2B data requests');
  vm.runInContext("state.remoteUser = { userType: 'b', businessStatus: 'approved', organizationId: 'org-1' }", context);
  await vm.runInContext('Promise.all([loadBusinessFrequent(), loadProcurement(), loadInquiries()])', context);
  assert(calls.length >= 5, 'verified business customers should load frequent, account, ledger, statements and inquiries');
  assert.equal(vm.runInContext('state.businessFrequentStatus', context), 'ready');
  assert.equal(vm.runInContext('state.procurementStatus', context), 'ready');
  assert.equal(vm.runInContext('state.inquiriesStatus', context), 'ready');
  console.log('web B2B procurement contract: passed (identity isolation and verified business loads)');
})().catch(error => { console.error(error); process.exitCode = 1; });

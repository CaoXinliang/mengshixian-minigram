const assert = require('assert/strict');
const Module = require('module');
const path = require('path');
const originalLoad = Module._load; const pages = []; let sensitiveCalls = 0;
const sensitive = () => { sensitiveCalls += 1; return Promise.resolve({ ok: true, data: { rows: [] } }); };
const services = { auth: { getMe: async () => ({ ok: false, error: { code: 'UNAUTHORIZED' } }) }, membership: { pointsAccount: sensitive, profile: sensitive, pointsLedger: sensitive }, favorites: { list: sensitive }, reviews: { eligible: sensitive, mine: sensitive }, invoices: { titles: sensitive, list: sensitive }, orders: { list: sensitive }, storedValue: { account: sensitive, ledger: sensitive } };
Module._load = function (request, parent, isMain) { if (request === '../../../services/index') return services; return originalLoad.call(this, request, parent, isMain); };
global.Page = definition => pages.push(definition); global.wx = { navigateBack() {} };
try { ['points', 'favorites', 'reviews', 'invoices', 'stored-value'].forEach(name => require(path.resolve(__dirname, `../miniapp/package-member/pages/${name}/index.js`))); } finally { Module._load = originalLoad; delete global.Page; }
const makePage = definition => Object.assign({}, definition, { data: JSON.parse(JSON.stringify(definition.data)), setData(patch) { Object.assign(this.data, patch); } });
(async () => { for (const definition of pages) { const page = makePage(definition); await page.load(); assert.equal(page.data.status, 'forbidden'); } assert.equal(sensitiveCalls, 0, 'logged-out users must not request member-private data'); console.log('member auth isolation test: passed'); })().catch(error => { console.error(error); process.exit(1); });

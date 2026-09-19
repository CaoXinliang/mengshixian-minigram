const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const mainPage = fs.readFileSync(path.resolve(__dirname, '../miniapp/pages/index/index.js'), 'utf8');
const checkoutPage = fs.readFileSync(path.resolve(__dirname, '../miniapp/package-trade/pages/checkout/index.js'), 'utf8');
const orderSubmission = fs.readFileSync(path.resolve(__dirname, '../miniapp/modules/order-submission.js'), 'utf8');

assert(!mainPage.includes('placeRemoteOrder'), 'the main page must not retain a second order-creation path');
assert(!mainPage.includes('loadRemoteQuote'), 'the main page must not retain a second quote path');
assert(mainPage.includes("wx.navigateTo({ url: '/package-trade/pages/checkout/index?source=cart' })"), 'the main page must delegate checkout to the trade subpackage');
assert(checkoutPage.includes('this.orderSubmission().submit(orderPayload)'), 'the trade checkout must submit through the idempotent order session');
assert(orderSubmission.includes("return { kind: 'busy', idempotencyKey }"), 'the order session must block duplicate in-flight submissions');
assert(orderSubmission.includes("return { kind: 'unknown', error, idempotencyKey: key }"), 'ambiguous create responses must preserve the original idempotency key');

console.log('cloud mode order idempotency boundary test: passed');

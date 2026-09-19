const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const calls = [];

Module._load = function (request, parent, isMain) {
  if (request === './request' && parent && /services[\\/]catalog\.js$/.test(parent.filename)) {
    return {
      request: async (action, payload) => {
        calls.push({ action, payload });
        return {
          ok: true,
          data: { rows: payload.skuIds.map((skuId) => ({ skuId, amountCent: 1000 })) },
          error: null,
          requestId: `prices-${calls.length}`
        };
      }
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

let catalog;
try {
  catalog = require(path.resolve(__dirname, '../miniapp/services/catalog.js'));
} finally {
  Module._load = originalLoad;
}

async function run() {
  const skuIds = Array.from({ length: 205 }, (_, index) => `sku-${index + 1}`);
  const result = await catalog.listPrices([...skuIds, 'sku-1']);
  assert.equal(result.ok, true);
  assert.equal(result.data.rows.length, 205, 'all unique SKU prices must be retained');
  assert.deepEqual(calls.map((item) => item.payload.skuIds.length), [100, 100, 5], 'price requests must respect the backend 100-SKU limit');
  assert(calls.every((item) => item.action === 'catalog.prices'));
  console.log('catalog price batching test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

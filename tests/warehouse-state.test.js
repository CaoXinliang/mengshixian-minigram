const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeDeliveryOptions, chooseWarehouseById, warehouseViewPatch } = require('../miniapp/modules/warehouse-state');

test('delivery options use server warehouse ids and omit disabled warehouses', () => {
  const rows = normalizeDeliveryOptions({
    warehouses: [
      { _id: 'warehouse-a', name: '赣州仓', status: 'active' },
      { _id: 'warehouse-b', name: '停用仓', status: 'disabled' }
    ],
    areas: [{ warehouseIds: ['warehouse-a'], regionCodes: ['赣州市/章贡区'] }]
  });
  assert.deepEqual(rows.map((item) => item.id), ['warehouse-a']);
  assert.deepEqual(rows[0].areas, ['赣州市/章贡区']);
});

test('unknown or unavailable id keeps the current warehouse', () => {
  const current = { id: 'warehouse-a', name: '当前仓' };
  const result = chooseWarehouseById(current, [{ id: 'warehouse-b', name: '新仓', status: 'disabled' }], 'warehouse-b');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'unavailable');
  assert.equal(result.warehouse, current);
});

test('valid id selects a stable warehouse and derives its area copy', () => {
  const target = { id: 'warehouse-b', name: '新仓', areas: ['深圳市/南山区'] };
  const result = chooseWarehouseById({ id: 'warehouse-a' }, [target], 'warehouse-b');
  assert.equal(result.ok, true);
  assert.equal(result.warehouse, target);
  assert.deepEqual(warehouseViewPatch(result.warehouse), { warehouse: target, warehouseAreaText: '深圳市/南山区' });
});

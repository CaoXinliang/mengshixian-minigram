function normalizeDeliveryOptions(data, displayName = (value) => String(value || '配送仓')) {
  const areas = Array.isArray(data && data.areas) ? data.areas : [];
  const warehouses = (Array.isArray(data && data.warehouses) ? data.warehouses : [])
    .filter((item) => item && item._id && item.status !== 'disabled')
    .map((item) => {
      const warehouseAreas = areas
        .filter((area) => !Array.isArray(area.warehouseIds) || !area.warehouseIds.length || area.warehouseIds.includes(item._id))
        .flatMap((area) => Array.isArray(area.regionCodes) ? area.regionCodes : []);
      return {
        ...item,
        id: item._id,
        name: displayName(item.name),
        eta: '预计送达时间以订单确认页为准',
        areas: warehouseAreas,
        areasText: warehouseAreas.join('、') || '以订单确认页为准'
      };
    });
  return warehouses;
}

function chooseWarehouseById(current, warehouses, targetId) {
  const id = String(targetId || '').trim();
  const rows = Array.isArray(warehouses) ? warehouses : [];
  const target = rows.find((item) => String(item && (item.id || item._id) || '') === id && item.status !== 'disabled');
  if (!target) return { ok: false, reason: rows.length ? 'unavailable' : 'empty', warehouse: current || null };
  return { ok: true, reason: '', warehouse: target };
}

function warehouseViewPatch(warehouse) {
  const areas = warehouse && Array.isArray(warehouse.areas) ? warehouse.areas : [];
  return {
    warehouse: warehouse || { id: '', name: '', eta: '' },
    warehouseAreaText: areas.join('、') || (warehouse ? '配送区域以订单确认页为准' : '')
  };
}

function deliveryAreaFor(address, warehouse, areas) {
  const regionCode = String(address && address.regionCode || '').trim();
  const warehouseId = String(warehouse && (warehouse.id || warehouse._id) || '').trim();
  if (!regionCode || !warehouseId) return null;
  return (Array.isArray(areas) ? areas : []).find((item) => {
    const regionCodes = Array.isArray(item && item.regionCodes) ? item.regionCodes.map(String) : [];
    const warehouseIds = Array.isArray(item && item.warehouseIds) ? item.warehouseIds.map(String) : [];
    return regionCodes.includes(regionCode) && (!warehouseIds.length || warehouseIds.includes(warehouseId));
  }) || null;
}

function resolveWarehouseForAddress(current, warehouses, areas, address) {
  const rows = Array.isArray(warehouses) ? warehouses : [];
  if (!rows.length) return { ok: false, reason: 'empty', warehouse: null, area: null };
  const currentArea = deliveryAreaFor(address, current, areas);
  if (currentArea) return { ok: true, reason: '', warehouse: current, area: currentArea };
  for (const warehouse of rows) {
    const area = deliveryAreaFor(address, warehouse, areas);
    if (area) return { ok: true, reason: '', warehouse, area };
  }
  return {
    ok: false,
    reason: String(address && address.regionCode || '').trim() ? 'out_of_area' : 'missing_region',
    warehouse: current || rows[0],
    area: null
  };
}

module.exports = {
  normalizeDeliveryOptions,
  chooseWarehouseById,
  warehouseViewPatch,
  deliveryAreaFor,
  resolveWarehouseForAddress
};

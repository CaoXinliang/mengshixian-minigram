function businessImageDescriptor(file, kind) {
  if (!file || !file.tempFilePath) return { ok: false, message: '没有读取到图片，请重新选择' };
  if (Number(file.size || 0) > 4 * 1024 * 1024) return { ok: false, message: '图片不能超过4MB' };
  const fileName = String(file.tempFilePath).split(/[\\/]/).pop() || '';
  const extension = String((fileName.match(/\.([^.?#]+)/) || [])[1] || '').toLowerCase();
  if (!['jpg', 'jpeg', 'png', 'webp'].includes(extension)) return { ok: false, message: '请上传 JPG、PNG 或 WebP 图片' };
  const mimeType = extension === 'png' ? 'image/png' : (extension === 'webp' ? 'image/webp' : 'image/jpeg');
  return { ok: true, fileName: fileName || `${kind}.jpg`, mimeType, sizeBytes: Number(file.size || 0) };
}

function businessApplicationPayload(value = {}, media = {}) {
  const payload = {
    companyName: String(value.companyName || '').trim(),
    storeName: String(value.storeName || '').trim(),
    storefrontMediaId: String(value.storefrontMediaId || media.storefrontMediaId || '').trim(),
    storeAddress: String(value.storeAddress || '').trim(),
    mainBusinessType: String(value.mainBusinessType || '').trim(),
    unifiedCode: String(value.unifiedCode || '').trim().toUpperCase(),
    contactName: String(value.contactName || '').trim(),
    contactPhone: String(value.contactPhone || '').trim(),
    businessLicenseMediaId: String(value.businessLicenseMediaId || media.businessLicenseMediaId || '').trim(),
    salesCode: String(value.salesCode || '').trim(),
    chainEnabled: String(value.chainEnabled || '') === 'true'
  };
  const complete = payload.companyName && payload.storeName && payload.storefrontMediaId && payload.storeAddress
    && ['restaurant', 'retail'].includes(payload.mainBusinessType) && /^[0-9A-Z]{18}$/.test(payload.unifiedCode)
    && payload.contactName && /^1\d{10}$/.test(payload.contactPhone) && payload.businessLicenseMediaId;
  return complete ? { ok: true, payload } : { ok: false, message: '请填写完整且有效的门店资料', payload };
}

module.exports = { businessImageDescriptor, businessApplicationPayload };

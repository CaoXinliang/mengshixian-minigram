const test = require('node:test');
const assert = require('node:assert/strict');
const { businessImageDescriptor, businessApplicationPayload } = require('../miniapp/modules/business-application');

test('business media accepts only supported images within four megabytes', () => {
  assert.equal(businessImageDescriptor({ tempFilePath: 'wxfile://door.jpg', size: 1024 }, 'storefront').mimeType, 'image/jpeg');
  assert.equal(businessImageDescriptor({ tempFilePath: 'wxfile://door.heic', size: 1024 }, 'storefront').ok, false);
  assert.equal(businessImageDescriptor({ tempFilePath: 'wxfile://door.png', size: 4 * 1024 * 1024 + 1 }, 'storefront').ok, false);
});

test('application form normalizes the full store payload without granting identity', () => {
  const result = businessApplicationPayload({
    companyName: ' 测试公司 ', storeName: ' 南山店 ', storeAddress: ' 测试路1号 ', mainBusinessType: 'restaurant',
    unifiedCode: '91340100test000001', contactName: ' 采购员 ', contactPhone: '13900139000', salesCode: ' S-1 ', chainEnabled: 'true'
  }, { storefrontMediaId: 'media-door', businessLicenseMediaId: 'media-license' });
  assert.equal(result.ok, true);
  assert.deepEqual(result.payload, {
    companyName: '测试公司', storeName: '南山店', storefrontMediaId: 'media-door', storeAddress: '测试路1号', mainBusinessType: 'restaurant',
    unifiedCode: '91340100TEST000001', contactName: '采购员', contactPhone: '13900139000', businessLicenseMediaId: 'media-license', salesCode: 'S-1', chainEnabled: true
  });
  assert.equal(Object.hasOwn(result.payload, 'userType'), false);
  assert.equal(Object.hasOwn(result.payload, 'businessStatus'), false);
});

test('invalid credit code or missing media is rejected before submission', () => {
  const invalid = businessApplicationPayload({ companyName: '测试公司', storeName: '南山店', storeAddress: '测试路1号', mainBusinessType: 'retail', unifiedCode: '123', contactName: '采购员', contactPhone: '13900139000' }, {});
  assert.equal(invalid.ok, false);
});

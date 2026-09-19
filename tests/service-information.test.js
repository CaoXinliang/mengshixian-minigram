const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { getServiceInformation, SERVICE_TYPES } = require('../miniapp/config/service-information');

for (const type of ['service', 'trace', 'aftersale', 'coldchain', 'about', 'faq']) {
  const model = getServiceInformation(type, { productName: '鱼丸' });
  assert.equal(model.type, type);
  assert(model.title);
  assert(Array.isArray(model.paragraphs));
  assert.equal(model.source, 'operator_review_required');
}
assert.equal(SERVICE_TYPES.includes('service'), true);
assert(getServiceInformation('trace', { productName: '鱼丸' }).title.includes('鱼丸'));
const allText = JSON.stringify(SERVICE_TYPES.map(type => getServiceInformation(type)));
assert(!/400[-\s]?\d+|24小时在线|全程实时定位|必赔|保证送达/.test(allText), 'service copy must not invent phone numbers, online promises, live tracking or compensation');

const component = fs.readFileSync(path.resolve(__dirname, '../miniapp/components/service-info-panel/index.wxml'), 'utf8');
const componentLogic = fs.readFileSync(path.resolve(__dirname, '../miniapp/components/service-info-panel/index.js'), 'utf8');
assert(component.includes('open-type="contact"'));
assert(component.includes('bindtap="contactUnavailable"'));
assert(component.includes('bindtap="navigate"'));
assert(!componentLogic.includes('getServiceInformation') && componentLogic.includes('model: { type: Object'), 'service panel must consume a prepared view model instead of reading business configuration');

const indexWxml = fs.readFileSync(path.resolve(__dirname, '../miniapp/pages/index/index.wxml'), 'utf8');
assert(indexWxml.includes('<service-info-panel'));
assert(indexWxml.includes('model="{{serviceInfoModel}}"'));
assert(!indexWxml.includes('<block wx:elif="{{utilityType == \'coldchain\'}}">'), 'service explanation blocks must leave the main page shell');

console.log('service information test: passed');

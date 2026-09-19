const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../miniapp/pages/index');
const wxml = fs.readFileSync(path.join(root, 'index.wxml'), 'utf8');
const wxss = fs.readFileSync(path.join(root, 'index.wxss'), 'utf8');

assert(wxml.includes('class="quantity-picker-summary"') && wxml.includes('bindtap="openDetailFromQuantityPicker"'), 'the whole product summary must be a clear click target for detail');
assert(wxml.includes('class="quantity-picker-current-spec"') && wxml.includes('{{quantityPickerSpec || quantityPickerProduct.specLabel || quantityPickerProduct.unit}}'), 'the product summary must expose the currently selected specification before the option list');
assert(!wxml.includes('class="quantity-picker-detail"') && !wxml.includes('class="quantity-picker-rules"'), 'the product sheet must omit duplicate detail and purchase-rule sections');
assert(wxml.includes('wx:if="{{quantityPickerProduct.skuOptions && quantityPickerProduct.skuOptions.length}}"'), 'one to three SKU options must all keep the real selected specification visible');
assert(wxml.includes("class=\"{{quantityPickerSpec == item.label ? 'is-active' : ''}} {{item.purchaseAvailable ? '' : 'is-disabled'}}\""), 'each SKU option must expose selected and unavailable states');
assert(wxml.includes('disabled="{{!item.purchaseAvailable}}"') && wxml.includes('data-spec="{{item.label}}"'), 'unavailable SKU options must be disabled without losing their real label');
assert(wxss.includes('.quantity-picker-specs button.is-disabled') && wxss.includes('overflow-wrap:anywhere'), 'long and unavailable SKU labels must remain readable and adaptive');
assert(wxss.includes('.quantity-picker-current-spec') && wxss.includes('font-size:13px'), 'the selected specification must keep a clear secondary-text treatment');

console.log('product sheet contract test: passed');

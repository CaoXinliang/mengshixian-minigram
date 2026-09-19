const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const { deriveProductPresentation } = require(path.resolve(__dirname, '../miniapp/modules/product-presentation-state'));

const base = {
  id: 'p1',
  name: '测试商品',
  img: '/assets/products/a.jpg',
  skuOptions: [
    { id: 's1', label: '500克', availability: 'sold_out', priceText: '¥12.00', purchaseRuleUnavailable: false },
    { id: 's2', label: '1千克', availability: 'available', priceText: '¥20.00', purchaseRuleUnavailable: false }
  ],
  selectedSkuId: 's1',
  availability: 'sold_out',
  priceText: '¥12.00',
  purchaseRuleUnavailable: false
};

const guest = deriveProductPresentation(base, { loggedIn: false });
assert.equal(guest.priceVisible, false);
assert.equal(guest.priceText, '');
assert.equal(guest.action, 'login', '访客购买意图只能进入登录续接');
assert.equal(guest.confirmAction, 'login');

const multi = deriveProductPresentation(base, { loggedIn: true });
assert.equal(multi.hasMultipleSkus, true);
assert.equal(multi.action, 'select', '当前SKU缺货但其他SKU可售时不能封死整件商品');
assert.equal(multi.productUnavailable, false);
assert.equal(multi.statusCode, 'selected_sku_sold_out');
assert.equal(multi.confirmAction, 'select');

const selectedAvailable = deriveProductPresentation({ ...base, selectedSkuId: 's2', availability: 'available', priceText: '¥20.00' }, { loggedIn: true });
assert.equal(selectedAvailable.action, 'select', '多SKU卡片仍提供选规格入口');
assert.equal(selectedAvailable.confirmAction, 'purchase', '已选可售SKU必须允许小窗和详情确认购买');

const allSoldOut = deriveProductPresentation({
  ...base,
  skuOptions: base.skuOptions.map((item) => ({ ...item, availability: 'sold_out' }))
}, { loggedIn: true });
assert.equal(allSoldOut.productUnavailable, true);
assert.equal(allSoldOut.action, 'disabled');
assert.equal(allSoldOut.statusCode, 'sold_out');

const noPrice = deriveProductPresentation({ ...base, skuOptions: [{ id: 's1', label: '500克', availability: 'unavailable', priceText: '' }], priceText: '', availability: 'unavailable' }, { loggedIn: true });
assert.equal(noPrice.statusCode, 'no_price');
assert.equal(noPrice.statusText, '价格暂不可用');

const offShelf = deriveProductPresentation({ ...base, status: 'off_shelf' }, { loggedIn: true });
assert.equal(offShelf.statusCode, 'off_shelf');
assert.equal(offShelf.action, 'disabled');

const brokenMedia = deriveProductPresentation({ ...base, imageUnavailable: true }, { loggedIn: true });
assert.equal(brokenMedia.mediaStatus, 'error');
assert.equal(brokenMedia.productUnavailable, false, '图片失败不能改变真实可售事实');

const invalidRule = deriveProductPresentation({ ...base, skuOptions: [{ id: 's1', label: '500克', availability: 'available', priceText: '¥12.00', purchaseRuleUnavailable: true }], availability: 'available', purchaseRuleUnavailable: true }, { loggedIn: true });
assert.equal(invalidRule.statusCode, 'rule_unavailable');
assert.equal(invalidRule.action, 'disabled');

const requestFailed = deriveProductPresentation(base, { loggedIn: true, priceRequestFailed: true });
assert.equal(requestFailed.statusCode, 'selected_sku_request_failed');
assert.equal(requestFailed.action, 'select', '一个SKU报价失败但其他SKU可售时不能封死整件商品');

const onlyRequestFailed = deriveProductPresentation({ ...base, skuOptions: [base.skuOptions[0]] }, { loggedIn: true, priceRequestFailed: true });
assert.equal(onlyRequestFailed.statusCode, 'request_failed');
assert.equal(onlyRequestFailed.action, 'disabled');

const pageSource = fs.readFileSync(path.resolve(__dirname, '../miniapp/pages/index/index.js'), 'utf8');
const pageTemplate = fs.readFileSync(path.resolve(__dirname, '../miniapp/pages/index/index.wxml'), 'utf8');
assert.match(pageSource, /require\('\.\.\/\.\.\/modules\/product-presentation-state'\)/, '主页面必须消费统一商品展示状态模块');
assert.match(pageSource, /presentation:\s*deriveProductPresentation\(pricedProduct/, '卡片、小窗和详情共用的商品加工入口必须挂载统一状态结果');
assert.match(pageSource, /purchaseRuleRequired === true/, '仅在服务端明确要求购买规则时，缺失规则才可阻止购买');
assert.match(pageSource, /_remotePriceErrorSkuIds\.add/, '报价请求失败必须进入可观察的统一状态');
assert.match(pageSource, /status:\s*item\.status \|\| ''/, '目录归一化必须保留服务端上下架状态');
assert.match(pageSource, /status:\s*remote\.status \|\| product\.status \|\| ''/, '详情合并必须保留服务端上下架状态');
assert.match(pageTemplate, /item\.presentation\.action == 'disabled'/, '商品卡必须消费统一购买状态');
assert.match(pageTemplate, /quantityPickerProduct\.presentation\.confirmAction == 'select'/, '商品小窗必须以统一状态确认当前SKU可购买');
assert.match(pageTemplate, /selectedProduct\.presentation\.confirmAction == 'select'/, '商品详情必须以统一状态确认当前SKU可购买');

console.log('product presentation state test: passed');

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const previewRoot = path.resolve(__dirname, '../web-preview');
const html = fs.readFileSync(path.join(previewRoot, 'index.html'), 'utf8');
const homeGrid = html.match(/<section class="category-grid"[\s\S]*?<\/section>/);
assert(homeGrid, 'web preview must contain a home category grid');

const homeLabels = [...homeGrid[0].matchAll(/data-category="([^"]+)"/g)].map((match) => match[1]);
assert.strictEqual(homeLabels.length, 10, 'web home shortcuts must show exactly ten categories');
assert.deepStrictEqual(homeLabels, [
  '海鲜水产', '牛肉类', '猪肉类', '羊肉类', '禽肉类',
  '丸滑类', '面点类', '预制菜熟食', '烧烤炸品', '蔬菜类'
]);

const app = fs.readFileSync(path.join(previewRoot, 'app.js'), 'utf8');
const presentation = app.match(/const categoryPresentation = \[[\s\S]*?\n\];/);
assert(presentation, 'web category presentation must remain defined for the full category page');
assert.strictEqual((presentation[0].match(/label:/g) || []).length, 14, 'web category page must keep all fourteen category mappings');
assert(app.includes('product.packageUnit = packaging'), 'web preview must split package unit from product spec');
assert(app.includes('product.specLabel = spec'), 'web preview must keep product spec in a dedicated field');
assert(app.includes('const productVariantsFor = product =>'), 'web product detail must use the dedicated spec field');
assert(app.includes('loadRemoteHomeContent'), 'web preview must have a controlled remote content loader');
assert(app.includes('async function loadRemoteCatalog'), 'web preview must have a controlled remote catalog loader');
assert(app.includes('maxPages: REMOTE_MAX_PAGES'), 'web remote catalog must continue across all bounded result pages');
assert(!app.includes('maxPages: 1'), 'web remote catalog must not stop after the first page');
assert(app.includes('async function loadRemoteCategories'), 'web preview must have a controlled remote category loader');
assert(app.includes('async function loadRemoteProductDetail'), 'web product detail must load the authoritative product detail response');
assert(app.includes('api.catalog.getProduct(productId)'), 'web product detail must call catalog.product through the API adapter');
assert(app.includes("'retry-detail'"), 'web product detail failures must offer a retry action');
assert(app.includes("'retry-catalog'"), 'web catalog failures must offer a retry action');
assert(app.includes('categoryImageSrc'), 'web category images must support remote media URLs');
assert(app.includes('item.skus'), 'web remote catalog must consume the safe SKU summary');
assert(app.includes("String(product.id) === String(id)"), 'web product lookup must support CloudBase string IDs');
assert(app.includes('webMediaUrl(media.url, fallbackImages'), 'web preview must normalize remote media paths and fall back when unavailable');
assert(!app.includes('TEACH_VIDEO') && !app.includes('mov_bbb.mp4'), 'web product detail must not inject a generic demo video');
assert(app.includes('detailVideoMarkup') && app.includes('detail-video-empty') && app.includes('该商品暂未上传视频'), 'web product detail must show an honest empty video state');
assert(app.includes('预计送达时段：${state.delivery.eta}'), 'web product detail must use normal delivery wording');
assert(!app.includes('示例配送时段'), 'web delivery choice, checkout and FAQ must not use placeholder delivery wording');
assert(html.includes('services/api.js'), 'web preview must load the browser API adapter before the page script');

console.log('web home category limit test: passed');

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const miniappRoot = path.join(projectRoot, 'miniapp');
const { DOCUMENTS } = require(path.join(miniappRoot, 'config', 'legal-documents'));

const appConfig = JSON.parse(fs.readFileSync(path.join(miniappRoot, 'app.json'), 'utf8'));
const indexWxml = fs.readFileSync(path.join(miniappRoot, 'pages', 'index', 'index.wxml'), 'utf8');
const indexSource = fs.readFileSync(path.join(miniappRoot, 'pages', 'index', 'index.js'), 'utf8');
const memberHomeWxml = fs.readFileSync(path.join(miniappRoot, 'components', 'member-home-panel', 'index.wxml'), 'utf8');
const memberPresentationSource = fs.readFileSync(path.join(miniappRoot, 'modules', 'member-presentation.js'), 'utf8');
const legalWxml = fs.readFileSync(path.join(miniappRoot, 'package-member', 'pages', 'legal', 'index.wxml'), 'utf8');
const legalSource = fs.readFileSync(path.join(miniappRoot, 'package-member', 'pages', 'legal', 'index.js'), 'utf8');
const legalPageConfig = JSON.parse(fs.readFileSync(path.join(miniappRoot, 'package-member', 'pages', 'legal', 'index.json'), 'utf8'));

assert.ok(appConfig.subpackages.find(item => item.root === 'package-member').pages.includes('pages/legal/index'), '协议页面必须注册到分包');
assert.equal(legalPageConfig.usingComponents['responsive-topbar'], '/components/responsive-topbar/index', '协议页必须显式声明顶部组件，避免按需注入出现空白页');
assert.equal(DOCUMENTS.privacy.version, DOCUMENTS.terms.version, '两份协议版本必须一致');
assert.equal(DOCUMENTS.privacy.source, 'ai_generated', '通用初始版必须保留 AI 来源标识');
assert.equal(DOCUMENTS.privacy.temporary, true, '运营主体未核验前必须标记为可替换初始版');
assert.equal(DOCUMENTS.privacy.requiresOperatorReview, true, '正式经营前必须保留运营者复核门槛');

const privacyText = JSON.stringify(DOCUMENTS.privacy);
for (const required of ['微信公众平台公示主体', '手机号授权凭证', '收货与配送信息', '企业采购信息', '发票信息', '曾同意登录', '不主动获取您的精确地理位置', '删除或匿名化', '未成年人保护', '微信客服']) {
  assert.ok(privacyText.includes(required), `隐私政策缺少：${required}`);
}
assert.ok(!privacyText.includes('赣州梦食鲜商贸'), '未核验的运营主体不得写成确定事实');

const termsText = JSON.stringify(DOCUMENTS.terms);
for (const required of ['服务内容与账号', '冷冻食品提示', '服务端核算结果', '页面不会发起扣款', '退换货与售后', '不适用无理由退货', '企业采购', '不得排除', '有管辖权的人民法院']) {
  assert.ok(termsText.includes(required), `用户服务协议缺少：${required}`);
}
assert.ok(!termsText.includes('测试页面'), '交付协议不应向用户暴露测试术语');

assert.match(indexWxml, /data-document="terms"[^>]*>《用户服务协议》/u, '登录弹窗必须可单独打开用户服务协议');
assert.match(indexWxml, /data-document="privacy"[^>]*>《隐私政策》/u, '登录弹窗必须可单独打开隐私政策');
assert.ok(memberPresentationSource.includes("{ type: 'policy', label: '协议与隐私'")
  && memberHomeWxml.includes('data-type="{{item.type}}"')
  && memberHomeWxml.includes('aria-label="{{item.label}}"'), '我的页面必须通过服务模型提供登录外的协议与隐私入口');
assert.match(indexSource, /package-member\/pages\/legal\/index\?type=\$\{type\}/u, '首页协议入口必须跳转到独立协议页');
assert.match(legalWxml, /版本 \{\{document\.version\}\}/u, '协议页必须展示版本号');
assert.match(legalWxml, /不会被记录为正式版本的接受或撤回/u, '未接入服务端法务记录时必须明确说明，不能用本地浏览冒充正式接受');
assert.match(legalWxml, /openWechatPrivacyContract/u, '隐私页必须提供微信平台隐私指引入口');
assert.match(legalSource, /wx\.openPrivacyContract/u, '协议页必须安全调用微信平台隐私指引 API');

console.log('legal documents contract test: passed');

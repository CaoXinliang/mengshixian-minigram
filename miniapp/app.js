// 微信开发者工具运行时不保证目录索引解析，必须显式引用入口文件。
const runtimeConfig = require('./services/config');

App({
  globalData: {
    brandName: "梦食鲜"
  },
  onLaunch() {
    // 默认 provider 仍是 mock，保持定稿演示可回退；切到 cloudbase 时统一在启动处初始化。
    if (runtimeConfig.provider !== 'cloudbase') return;
    if (!runtimeConfig.cloudEnvId || typeof wx === 'undefined' || !wx.cloud || typeof wx.cloud.init !== 'function') return;
    wx.cloud.init({ env: runtimeConfig.cloudEnvId, traceUser: true });
  }
});

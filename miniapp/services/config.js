// 演示环境已完成目录、价格、库存及配送数据验收。保持现有页面 UI，
// 仅将服务层切换到 CloudBase；真实支付仍不在此环境启用。
module.exports = {
  provider: 'cloudbase',
  cloudFunctionName: 'api',
  cloudEnvId: 'cloud1-d8gp843lt5454ada7',
  timeoutMs: 15000,
  priceFieldsNeverFallback: true,
  motionEnabled: true,
  // 临时产品开关：甲方若否决 C 端“吃什么”，改为 false 即恢复原“常用清单”入口。
  customerMealIdeasEnabled: true
};

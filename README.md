# mengshixian-minigram
梦食鲜小程序

## 项目结构

- `miniapp/`：微信小程序正式运行源码。
- `project.config.json`：微信开发者工具项目配置，`miniprogramRoot` 指向 `miniapp/`。
- `tests/`：小程序业务与交互回归测试。
- `web-preview/`、根目录 `assets/`：旧网页预览及其素材，仅供历史追溯，不是当前开发或验收入口。

使用微信开发者工具直接导入本仓库根目录即可。当前运行源码只在 `miniapp/`；商城价格、库存和订单以服务端返回为准。此分支是开发中的本地验证快照，不代表体验版已上传或生产功能已验收。

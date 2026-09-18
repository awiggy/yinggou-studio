# 进展

- 已确认产品名「映构」和用户已有云服务器。
- 已克隆上游并梳理项目、资产与生图 API。
- 已实现角色工作台、映构品牌、角色图片历史筛选、形象确认及云端部署配置。
- 2026-09-19 用户确认上游为 Stonewuu/ai-fusion-video，GitHub 账号为 awiggy，并授权助手将项目部署到其已有的火山引擎云服务器。
- 部署仓库：awiggy/yinggou-studio；开发分支：feat/yinggou-v1。

## 2026-09-19 发布前验证

- `corepack pnpm lint`：通过，无错误；现有其他模块有 25 条警告。
- `corepack pnpm test:profile`：3/3 通过。
- `corepack pnpm build`：通过，含 TypeScript 检查。
- `bash ./mvnw -B -Dtest=CharacterImageHistoryTests package`（JDK 21）：通过，测试 2/2，已生成后端 JAR。
- `corepack pnpm test:characters`：桌面和手机合计 12/12 通过；使用隔离的模拟 API，不代表真实模型生成已验收。
- 代码已提交并推送至 `origin/feat/yinggou-v1`，功能提交为 `90350cb`。
- GitHub Actions：[运行 35372696089](https://github.com/awiggy/yinggou-studio/actions/runs/35372696089) 全部通过，覆盖后端测试、Docker Compose 配置校验、前端检查与构建，以及桌面和手机浏览器验收。
- 火山引擎：控制台授权成功；默认北京区域未查到 ECS 实例，待用户提供服务器区域、实例名称或详情页链接后继续定位。
- 未完成：云端实际启动、Flyway validate、管理员初始化及真实模型生图验收。

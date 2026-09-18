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
- 火山引擎：控制台授权成功；用户确认华北2（北京），提供的服务为 veFaaS，且尚未部署 ECS。
- 未完成：云端实际启动、Flyway validate、管理员初始化及真实模型生图验收。

## 云端资源核对

- 区域 `cn-beijing`，用户通过控制台授权登录。
- ECS：0 个实例；veFaaS：0 个函数；RDS MySQL：0 个实例；Redis：0 个实例。
- API 网关：有 1 个运行中的 serverless 网关，尚未为映构创建或修改路由。
- veFaaS CLI 已升级并确认版本为 0.3.2。前端 inspect 识别为 Next.js；后端未被正确识别为 Java，不能直接采用默认 Node 运行配置部署。
- 现有 Compose 依赖 Java 21、FFmpeg、MySQL、Redis 及媒体/Agent 工作区持久化目录。
- 官方文档确认 veFaaS 支持容器镜像部署，但需同区域镜像仓库及启动脚本；临时磁盘随容器销毁，持久化需 NAS/TOS 等方案。
- 候选方案：ECS 4 核 8 GB + 80 GB 磁盘，运行现有 Compose；`ecs.c3a.xlarge` 在北京可用区 A 查询为可用。规格仅为候选，尚未购买。
- 价格计算器未返回有效金额，不能将未核实金额作为报价。已询问用户月度基础资源预算，后续需要核对实际报价再创建资源。
- 本次未创建收费资源，未部署函数，未修改现有网关。
- 文档依据：[镜像部署](https://www.volcengine.com/docs/6662/1206694)（更新于 2026-02-03）、[函数存储选型](https://www.volcengine.com/docs/6662/1356292)（更新于 2025-03-11）。

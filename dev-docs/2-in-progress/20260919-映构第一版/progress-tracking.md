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

## GitHub 构建与低内存运行验证

- 用户要求将构建移到 GitHub，并检查本地配置以判断可行性。
- 本机为 Apple Silicon、16 GB 内存；未安装 Docker/Podman/Colima。项目 Node 工具可用，前端包管理器锁定 pnpm 10.32.1；JDK 21 当前位于临时目录，不作为云端依赖。
- 本地开发后端指向 localhost:18080；部署仅绑定 127.0.0.1:8080，域名为空；未发现 SSH config。只核对环境变量名称和是否已设置，未输出凭据。
- 新增 `Yinggou deployment bundle` 工作流、镜像导入安装脚本和 `low-memory.yaml`。前后端及 MySQL/Redis/Nginx 打包为 Linux amd64 镜像归档，服务器运行时无需构建或拉取镜像。
- [构建运行 35375007733](https://github.com/awiggy/yinggou-studio/actions/runs/35375007733) 已成功，代码提交 `51e070d`；构建、完整服务启动、初始化接口、登录页、FFmpeg 和数据库迁移检查全部通过。
- 同提交的 [常规 CI 35375007543](https://github.com/awiggy/yinggou-studio/actions/runs/35375007543) 也已通过。
- 运行容器内存上限合计 3264 MiB（约 3.19 GiB）；这只是容器限额，不是完整服务器实测峰值。4 GB 可作为单人试用候选，尚未验证真实生图、Agent 或视频合成负载，不能据此承诺 2 GB 配置可用。
- 部署 artifact 约 869 MiB，保留 1 天，下载到本地后可长期保存。归档不含 GitHub 临时测试 `.env`，安装时在服务器生成独立密码。
- 本地已保存部署包并通过 SHA-256 校验。启动检查后的 Docker 内存快照：后端 382.2 MiB、MySQL 384.1 MiB、前端 36 MiB、Redis 10.06 MiB、Nginx 4.781 MiB，合计约 817 MiB。此为短时采样，不包含操作系统和真实生成任务的峰值。
- 尚未购买 ECS 或创建收费资源；账户余额与实际套餐价格仍需在下单前核对。GitHub 构建完成不等于云端已上线。

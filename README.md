# 映构 Yinggou

基于 [融光](https://github.com/Stonewuu/ai-fusion-video) 二次开发的综合视频创作平台。第一版从角色创作切入：**创建项目 → 设定角色 → 生成图片 → 确认角色形象**，再衔接上游已有的分镜与视频能力。

## 第一版功能

- 创作工作台：新建项目、选择角色默认风格、搜索和继续创作。
- 角色设定：姓名、性别、年龄、身份、外貌、服装、性格、背景、视觉风格和构图。
- 图片生成：接入系统配置中的真实图片模型；提示词可编辑，每次生成一张，展示生成进度与错误。
- 生成历史：按当前用户、项目和角色查询；刷新后可恢复，不依赖浏览器临时存储。
- 形象确认：将满意的图片保存为角色子资产和封面，后续可在分镜中引用。
- 保留原项目的剧本、素材、图片与视频工具和 Agent 工作区。

## 代码位置

| 路径 | 内容 |
| --- | --- |
| `ai-fusion-video-web/app/(dashboard)/studio/` | 创作首页 |
| `ai-fusion-video-web/app/(dashboard)/projects/[id]/characters/` | 角色工作台 |
| `ai-fusion-video-web/lib/character-profile.ts` | 角色设定与提示词 |
| `ai-fusion-video-web/lib/api/character.ts` | 角色保存与选图流程 |
| `ai-fusion-video/` | Java 后端 |
| `deploy/yinggou/` | 映构专用云端部署文件 |
| `ai-fusion-video-web/e2e/` | 浏览器验收测试，仅测试环境使用模拟 API |
| `dev-docs/2-in-progress/20260919-映构第一版/` | 计划、进展与交付记录 |

## 云端部署

本项目仓库属于 [awiggy](https://github.com/awiggy)，计划部署到火山引擎华北2（北京）。当前提供的是 ECS 等 Linux 服务器使用的 Docker Compose 配置；veFaaS 需要单独适配运行环境和持久化依赖。

参见 [映构部署说明](deploy/yinggou/README.md)。源码由你自己的 GitHub 仓库管理，服务运行在云服务器；无需在个人电脑常驻运行。

小规格服务器优先使用 GitHub Actions 的 `Yinggou deployment bundle`：在 GitHub 构建并检查完整服务后，下载镜像部署包，服务器仅运行 `install-bundle.sh`，无需在服务器编译。详见部署说明的“使用 GitHub 构建包”。

```bash
bash deploy/yinggou/init-env.sh
docker compose --env-file deploy/yinggou/.env -f deploy/yinggou/compose.yaml up -d --build
```

请使用以上专用配置。仓库根目录原有 `docker-compose.yml` 拉取的是上游融光镜像，不包含映构的修改。首次启动后创建管理员，再在「系统设置 → AI 配置」添加图片模型和 API Key。

## 开发与验证

环境：JDK 21、Node.js 20 或更新版本、pnpm 10.32.1；完整后端运行还需要 MySQL、Redis 和 FFmpeg。详见 [上游开发说明](README_UPSTREAM.md#源码开发)。

前端：

```bash
cd ai-fusion-video-web
corepack pnpm install --frozen-lockfile
corepack pnpm lint
corepack pnpm test:profile
corepack pnpm build
corepack pnpm exec playwright install chromium
corepack pnpm test:characters
```

后端：

```bash
cd ai-fusion-video
bash ./mvnw -Dtest=CharacterImageHistoryTests package
```

浏览器测试覆盖桌面和手机尺寸，包括完整角色流程、未配置模型、生成失败、部分保存失败重试、未保存修改保护和品牌登录页。测试模拟了模型结果，**不等于付费模型真实生成验收**。生产页面始终调用真实后端，不包含演示模式或假生成。

## 开源归属

本项目基于 Stone Wu 的融光项目，采用 [MIT License](LICENSE)，保留原版权声明。完整上游说明见 [README_UPSTREAM.md](README_UPSTREAM.md)。开源软件不包含模型服务费用，图片、视频服务需自行配置。

# 映构：云服务器部署

部署的是本仓库的映构源码。不要使用上游默认 `docker compose up`，那会拉取融光原版镜像。

服务器需要 Linux、Git、Docker Engine 和 Docker Compose；Apple Silicon Mac 可安装 Docker Desktop 进行本地验收。镜像在服务器构建时，建议至少 4 核 8GB 和 30GB 可用磁盘；内存较小的机器建议在 CI 构建镜像后部署。

## 首次部署

### 使用 GitHub 构建包（服务器无需编译）

运行 GitHub Actions 的 `Yinggou deployment bundle` 工作流。工作流分别在 Linux amd64 和 arm64 原生运行器上构建前后端镜像，实际启动 MySQL、Redis、后端、前端和 Nginx，检查数据库迁移与页面，再导出五个服务的镜像和部署配置。

成功后按机器架构下载 artifact：Intel/AMD 服务器使用 `yinggou-linux-amd64`，Apple M 系列 Mac 或 ARM Linux 使用 `yinggou-linux-arm64`。解压到独立目录，运行：

```bash
bash deploy/yinggou/install-bundle.sh
```

需已安装 Docker 和 Compose。安装脚本验证架构与镜像包校验和，导入本地镜像，以 `--no-build --pull never` 启动。密码在首次运行时生成，已有 `.env` 会保留；GitHub 测试用密码不会打入部署包。默认监听 `127.0.0.1:8080`；本机直接访问，远程服务器按下文 SSH 转发完成初始化。打包产物仅保留 1 天，过期可重新构建；下载后请自行保留已验收版本用于恢复。

macOS 若终端尚未识别 `docker`，先执行 `export PATH="$HOME/.docker/bin:$PATH"`。Docker Desktop 必须处于运行状态。停止服务使用相同的 Compose 参数执行 `stop`；不要删除数据卷。电脑休眠或关闭后，本地服务不可访问，本地验收不等于公网部署。

`low-memory.yaml` 为单人试用设置容器内存上限，合计约 3.19 GiB；4 GB 服务器仍需给操作系统和 Docker 留空间。启动检查与空闲内存数据不代表生图、Agent 或视频合成负载已经验收，不保证 2 GB 服务器能运行完整服务。模型调用仍由配置的外部服务承担。

`COMMIT` 记录源码版本，`ARCH` 记录镜像架构，`memory.txt` 和 `startup.log` 记录 GitHub 上的启动验证信息。此部署包不包含 HTTPS 代理镜像；正式公网访问需再配置入口。

### 在服务器从源码构建

```bash
git clone --branch feat/yinggou-v1 https://github.com/awiggy/yinggou-studio.git
cd yinggou-studio
bash deploy/yinggou/init-env.sh
docker compose --env-file deploy/yinggou/.env -f deploy/yinggou/compose.yaml config --quiet
docker compose --env-file deploy/yinggou/.env -f deploy/yinggou/compose.yaml up -d --build
docker compose --env-file deploy/yinggou/.env -f deploy/yinggou/compose.yaml ps
```

默认只监听服务器 127.0.0.1:8080。首次初始化可用 SSH 转发：在自己的电脑运行 `ssh -L 8080:127.0.0.1:8080 用户名@服务器地址`，访问 http://localhost:8080 完成管理员初始化。SSH 转发只用于访问，服务仍在服务器运行。

初始化后：

1. 在 **系统设置 → AI 配置** 添加服务商和图片模型（类型：图像生成），填写 API Key；在页面内保存，密钥不要放进 Git。
2. 打开 **创作 → 新建创作项目**，填写角色，保存后生成图片。
3. 生成完成后点击 **设为角色形象**。角色图会存入原资产系统，可在分镜的角色关联中选择。

### 火山方舟角色生图配置

本项目已内置 Seedream 协议和能力预设。以 Seedream 4.5 为例：

| 配置项 | 值 |
| --- | --- |
| 服务商 / 图像协议 | 火山引擎 / `volcengine` |
| API 地址 | `https://ark.cn-beijing.volces.com/api/v3` |
| API Key | 在本地管理页面保存方舟密钥，不写入源码或 Actions |
| 模型类型 | 图像生成 |
| 模型代码及能力预设 | `doubao-seedream-4-5-251128` |
| 初次验收 | 单张 2K、并发 1、纯文本生图 |

API Key 创建和模型开通是两个步骤。能获取模型列表只验证了该查询接口，不能代替真实生图验收；在方舟控制台开通对应模型后再试。第一版手工填写角色设定并生图只需图像模型，自动写剧本和生成视频时再分别配置文本、视频模型，同一方舟 Key 是否可用取决于授权范围及对应模型开通状态。

本机 `localhost` 图片地址无法被云端模型访问。纯文生图可以先验收；后续上传参考图或图生视频需要可访问的媒体地址或对象存储。官方说明：[API 鉴权](https://www.volcengine.com/docs/82379/1298459)、[图片生成 API](https://www.volcengine.com/docs/82379/1541523)。

## 域名和 HTTPS

域名 A 记录解析到服务器，并开放 80/443。修改 `deploy/yinggou/.env`：

```dotenv
DOMAIN=video.example.com
SITE_ORIGIN=https://video.example.com
```

保留 `APP_BIND=127.0.0.1`，启动自动管理证书的 Caddy：

```bash
docker compose --env-file deploy/yinggou/.env -f deploy/yinggou/compose.yaml -f deploy/yinggou/https.yaml up -d --build
```

若已有 Nginx、宝塔或其他网关占用 80/443，用现有网关代理到 `127.0.0.1:8080`，不要再启动 Caddy。

没有域名时，初始化完成后可把 `APP_BIND` 改为 `0.0.0.0`，把 `SITE_ORIGIN` 改为 `http://服务器地址:8080`，再 `up -d`。供长期使用时建议配置 HTTPS。

在 **系统设置 → 通用** 填写站点及后端资源公网地址。后续参考图、图生视频需要云端模型能访问素材，可使用公网媒体地址或 S3 兼容对象存储。

## 更新和排错

```bash
git pull --ff-only
docker compose --env-file deploy/yinggou/.env -f deploy/yinggou/compose.yaml up -d --build
docker compose --env-file deploy/yinggou/.env -f deploy/yinggou/compose.yaml logs --tail=100 backend
```

如果启用了 HTTPS，更新时也传入 `-f deploy/yinggou/https.yaml`。先备份数据库及媒体卷再升级。不要运行 `down -v`，这会删除项目和媒体数据。不要删除 `.env` 后重新生成密码；已有数据库的密码不会随环境变量自动修改。

Compose 项目名固定为 `yinggou`，数据卷为 `yinggou_mysql_data`、`yinggou_redis_data`、`yinggou_media_data` 和 `yinggou_agent_workspace_data`。没有向宿主机发布 MySQL 或 Redis 端口。

## 版本边界

第一版增强角色创作。分镜、视频、素材和 Agent 功能沿用融光；尚未新增付费、额度、模型成本统计等商业运营功能。云服务与模型 API 费用单独产生。前端自动化测试使用明确隔离的 API fixture，不代表付费模型真实生成已经验收。

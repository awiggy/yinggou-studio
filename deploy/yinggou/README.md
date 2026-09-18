# 映构：云服务器部署

部署的是本仓库的映构源码。不要使用上游默认 `docker compose up`，那会拉取融光原版镜像。

需要 Linux、Git、Docker Engine 和 Docker Compose v2。镜像在服务器构建时，建议至少 4 核 8GB 和 30GB 可用磁盘；内存较小的机器建议在 CI 构建镜像后部署。这里只部署服务，不在个人电脑上常驻运行。

## 首次部署

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

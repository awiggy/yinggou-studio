#!/usr/bin/env bash
set -euo pipefail
bundle_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$bundle_dir"
case "$(uname -m)" in
  x86_64) host_arch=amd64 ;;
  arm64|aarch64) host_arch=arm64 ;;
  *) echo '不支持的主机架构。' >&2; exit 1 ;;
esac
if [[ "$(cat ARCH)" != "$host_arch" ]]; then
  echo '部署包架构与主机不匹配，请下载对应的 amd64 或 arm64 包。' >&2
  exit 1
fi
case "$(uname -s)" in
  Darwin) shasum -a 256 --check SHA256SUMS ;;
  Linux) sha256sum --check SHA256SUMS ;;
  *) echo '仅支持 Linux 或安装了 Docker Desktop 的 macOS。' >&2; exit 1 ;;
esac
# 镜像包包含五个服务，服务器不需要编译或登录镜像仓库。
docker image load -i images.tar.gz
bash deploy/yinggou/init-env.sh
docker compose --env-file deploy/yinggou/.env --env-file images.env \
  -f deploy/yinggou/compose.yaml -f deploy/yinggou/low-memory.yaml \
  up -d --no-build --pull never --wait --wait-timeout 300
echo '服务已启动，默认仅监听 127.0.0.1:8080。本机打开 http://localhost:8080 完成管理员初始化；远程服务器请先通过 SSH 转发。'

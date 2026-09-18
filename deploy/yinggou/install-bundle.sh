#!/usr/bin/env bash
set -euo pipefail
bundle_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$bundle_dir"
if [[ "$(uname -m)" != x86_64 ]]; then
  echo '此部署包仅支持 Linux x86_64 服务器。' >&2
  exit 1
fi
sha256sum --check SHA256SUMS
# 镜像包包含五个服务，服务器不需要编译或登录镜像仓库。
docker image load -i images.tar.gz
bash deploy/yinggou/init-env.sh
docker compose --env-file deploy/yinggou/.env --env-file images.env \
  -f deploy/yinggou/compose.yaml -f deploy/yinggou/low-memory.yaml \
  up -d --no-build --pull never --wait --wait-timeout 300
echo '服务已启动，默认仅监听 127.0.0.1:8080。请先通过 SSH 转发完成管理员初始化。'

#!/usr/bin/env bash
set -euo pipefail
deploy_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
env_file="$deploy_dir/.env"
if [[ -e "$env_file" ]]; then
  echo "已有 .env，保留现有数据库凭证。"
  exit 0
fi
command -v openssl >/dev/null || { echo "需要安装 openssl。" >&2; exit 1; }
umask 077
# noclobber also protects an existing file if two setup processes run concurrently.
set -o noclobber
cat > "$env_file" <<EOF
MYSQL_ROOT_PASSWORD=$(openssl rand -hex 32)
MYSQL_PASSWORD=$(openssl rand -hex 32)
REDIS_PASSWORD=$(openssl rand -hex 32)
APP_BIND=127.0.0.1
APP_PORT=8080
SITE_ORIGIN=http://localhost:8080
DOMAIN=
JAVA_TOOL_OPTIONS=-Xms256m -Xmx1024m
EOF
echo "已创建 deploy/yinggou/.env（仅当前用户可读）。请配置域名或访问地址。"

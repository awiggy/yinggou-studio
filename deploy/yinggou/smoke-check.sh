#!/usr/bin/env bash
set -euo pipefail
repo_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_dir"
compose=(docker compose --env-file deploy/yinggou/.env -f deploy/yinggou/compose.yaml -f deploy/yinggou/low-memory.yaml)
"${compose[@]}" up -d --no-build --wait --wait-timeout 300
response="$(curl --fail --silent --show-error --retry 20 --retry-delay 2 --retry-connrefused --retry-all-errors http://127.0.0.1:8080/api/system/init/status)"
python3 -c 'import json,sys; result=json.load(sys.stdin); assert result["code"] == 0, result; assert isinstance(result["data"],dict), result; print("Backend initialization endpoint: OK")' <<< "$response"
curl --fail --silent --show-error --retry 20 --retry-delay 2 --retry-all-errors http://127.0.0.1:8080/login -o /tmp/yinggou-login.html
python3 -c 'from pathlib import Path; assert "映构" in Path("/tmp/yinggou-login.html").read_text(); print("Frontend branding: OK")'
"${compose[@]}" exec -T backend ffmpeg -version | sed -n '1p'
"${compose[@]}" exec -T mysql sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" mysql -u "$MYSQL_USER" "$MYSQL_DATABASE" --batch --skip-column-names -e "SELECT COUNT(*) FROM flyway_schema_history WHERE success = 0"' | python3 -c 'import sys; assert sys.stdin.read().strip() == "0"; print("Database migrations: OK")'

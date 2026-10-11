#!/bin/sh
set -e

export BACKEND_URL=${BACKEND_URL:-http://192.168.1.79:8102}
echo "==> BACKEND_URL: $BACKEND_URL"

envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
printf 'window.__AIR_TASK_CONFIG__ = { backendUrl: "%s" };\n' "$BACKEND_URL" > /usr/share/nginx/html/config.js

nginx -g "daemon off;"

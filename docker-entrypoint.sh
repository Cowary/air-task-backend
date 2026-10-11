#!/bin/sh
set -e

export BACKEND_URL=${BACKEND_URL:-http://192.168.1.79:8102}
export BACKEND_ORIGIN=${BACKEND_URL%/api}

echo "==> BACKEND_URL: $BACKEND_URL"
echo "==> BACKEND_ORIGIN: $BACKEND_ORIGIN"

envsubst '${BACKEND_URL} ${BACKEND_ORIGIN}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

nginx -g "daemon off;"

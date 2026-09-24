#!/usr/bin/env bash
set -euo pipefail

missing=0
for var in MONGODB_URI JWT_SECRET; do
  if [[ -z "${!var:-}" ]]; then
    echo "Missing required env: $var"
    missing=1
  fi
done

app_env="${APP_ENV:-${NODE_ENV:-development}}"
if [[ "$app_env" == "production" && -n "${JWT_SECRET:-}" && ${#JWT_SECRET} -lt 32 ]]; then
  echo "JWT_SECRET must be at least 32 characters in production"
  missing=1
fi

if [[ "$missing" -ne 0 ]]; then
  exit 1
fi

echo "Environment OK ($app_env)"

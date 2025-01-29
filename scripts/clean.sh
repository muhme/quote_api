#!/bin/bash
#
# scripts/clean.sh - delete all quote_api_* Docker containers and dir ./dist
#
# MIT License, Copyright (c) 2023 - 2025 Heiko Lübbe
# OpenAPI api.zitat-service.de, see https://github.com/muhme/quote_api

PREFIX="quote_api_"
NETWORK_NAME="${PREFIX}default"

# the following two docker commands are equal to 'docker compose down'

echo '*** Remove following Docker containers'
docker ps -a --format '{{.Names}}' | grep "^${PREFIX}" | xargs -r docker rm -f

echo '*** Remove following Docker network'
if docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
  docker network rm "$NETWORK_NAME"
fi

echo '*** Remove folder ./dist'
rm -rf dist

echo '*** Remove files'
rm -rf development.log tsconfig.tsbuildinfo

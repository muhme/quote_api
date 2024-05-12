#!/bin/bash
#
# scripts/clean.sh - delete all quote_api_* docker containers and ./dist
#
# MIT License, Copyright (c) 2023 - 2024 Heiko Lübbe
# OpenAPI api.zitat-service.de, see https://github.com/muhme/quote_api

echo '*** Removing all docker containers quote_api_*'
docker ps -a --format '{{.Names}}' | grep '^quote_api_' | xargs -r docker rm -f

echo '*** Removing ./dist'
rm -rf dist

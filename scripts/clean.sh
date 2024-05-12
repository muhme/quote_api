#!/bin/bash
#
# scripts/clean.sh - delete all quote_api_* Docker containers and dir ./dist
#
# MIT License, Copyright (c) 2023 - 2024 Heiko Lübbe
# OpenAPI api.zitat-service.de, see https://github.com/muhme/quote_api

echo '*** Removing all Docker containers quote_api_*'
docker ps -a --format '{{.Names}}' | grep '^quote_api_' | xargs -r docker rm -f

echo '*** Removing ./dist'
rm -rf dist

#!/bin/bash -e
#
# create.sh - delete all Docker containers and build them new
#
# MIT License, Copyright (c) 2023 - 2024 Heiko Lübbe
# OpenAPI api.zitat-service.de, see https://github.com/muhme/quote_api

# First delete all docker containters
scripts/clean.sh

echo "*** npm clean install"
npm ci

echo "*** npm run clean"
npm run clean

echo "*** npm run build"
npm run build

if [ $# -eq 1 ] && [ "$1" = "build" ]; then
  echo "*** Docker compose build --no-cache"
  docker compose build --no-cache
fi

echo "*** Docker compose up"
docker compose up -d

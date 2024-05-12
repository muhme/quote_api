#!/bin/bash
#
# scripts/test.sh - running end-to-end tests
#
# MIT License, Copyright (c) 2023 - 2024 Heiko Lübbe
# OpenAPI api.zitat-service.de, see https://github.com/muhme/quote_api

echo "*** quote_api_nodeapp:npm run test"
# Importand to wait that node is running. As test is doing rebuild and
#   if this runs before the node server is running it destroys the base,
#   node will fail and the container stops and is no more restartable.
node_modules/wait-on/bin/wait-on -l -t "60s" "http://localhost:3000"
docker exec -it quote_api_nodeapp /usr/local/bin/npm run test

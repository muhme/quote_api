#!/bin/bash
#
# scripts/test.sh - running end-to-end tests
#
# MIT License, Copyright (c) 2023 - 2024 Heiko Lübbe
# OpenAPI api.zitat-service.de, see https://github.com/muhme/quote_api

echo "*** quote_api_nodeapp:npm run test"
docker exec -it quote_api_nodeapp /usr/local/bin/npm run test

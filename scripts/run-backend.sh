#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/social-finance-api/java-backend"
ENV_FILE="${BACKEND_DIR}/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing ${ENV_FILE}"
  echo "Create it with:"
  echo "  cp ${BACKEND_DIR}/.env.example ${ENV_FILE}"
  echo "Then edit SPRING_DATASOURCE_PASSWORD."
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

cd "$BACKEND_DIR"

ADDRESS_ARG=""
if [ -n "${SERVER_ADDRESS:-}" ]; then
  ADDRESS_ARG="--server.address=${SERVER_ADDRESS}"
fi

./mvnw spring-boot:run -Dspring-boot.run.arguments="${ADDRESS_ARG}"

#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_NAME="${VIKICLOW_INSTALL_E2E_IMAGE:-vikiclow-install-e2e:local}"
INSTALL_URL="${VIKICLOW_INSTALL_URL:-https://vikiclow.ai/install.sh}"

OPENAI_API_KEY="${OPENAI_API_KEY:-}"
ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}"
ANTHROPIC_API_TOKEN="${ANTHROPIC_API_TOKEN:-}"
VIKICLOW_E2E_MODELS="${VIKICLOW_E2E_MODELS:-}"

echo "==> Build image: $IMAGE_NAME"
docker build \
  -t "$IMAGE_NAME" \
  -f "$ROOT_DIR/scripts/docker/install-sh-e2e/Dockerfile" \
  "$ROOT_DIR/scripts/docker/install-sh-e2e"

echo "==> Run E2E installer test"
docker run --rm \
  -e VIKICLOW_INSTALL_URL="$INSTALL_URL" \
  -e VIKICLOW_INSTALL_TAG="${VIKICLOW_INSTALL_TAG:-latest}" \
  -e VIKICLOW_E2E_MODELS="$VIKICLOW_E2E_MODELS" \
  -e VIKICLOW_INSTALL_E2E_PREVIOUS="${VIKICLOW_INSTALL_E2E_PREVIOUS:-}" \
  -e VIKICLOW_INSTALL_E2E_SKIP_PREVIOUS="${VIKICLOW_INSTALL_E2E_SKIP_PREVIOUS:-0}" \
  -e OPENAI_API_KEY="$OPENAI_API_KEY" \
  -e ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  -e ANTHROPIC_API_TOKEN="$ANTHROPIC_API_TOKEN" \
  "$IMAGE_NAME"

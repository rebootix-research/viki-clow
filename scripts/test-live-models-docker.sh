#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_NAME="${VIKICLOW_IMAGE:-${VIKICLOWBOT_IMAGE:-vikiclow:local}}"
CONFIG_DIR="${VIKICLOW_CONFIG_DIR:-${VIKICLOWBOT_CONFIG_DIR:-$HOME/.vikiclow}}"
WORKSPACE_DIR="${VIKICLOW_WORKSPACE_DIR:-${VIKICLOWBOT_WORKSPACE_DIR:-$HOME/.vikiclow/workspace}}"
PROFILE_FILE="${VIKICLOW_PROFILE_FILE:-${VIKICLOWBOT_PROFILE_FILE:-$HOME/.profile}}"

PROFILE_MOUNT=()
if [[ -f "$PROFILE_FILE" ]]; then
  PROFILE_MOUNT=(-v "$PROFILE_FILE":/home/node/.profile:ro)
fi

read -r -d '' LIVE_TEST_CMD <<'EOF' || true
set -euo pipefail
[ -f "$HOME/.profile" ] && source "$HOME/.profile" || true
tmp_dir="$(mktemp -d)"
cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT
tar -C /src \
  --exclude=.git \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=ui/dist \
  --exclude=ui/node_modules \
  -cf - . | tar -C "$tmp_dir" -xf -
ln -s /app/node_modules "$tmp_dir/node_modules"
ln -s /app/dist "$tmp_dir/dist"
cd "$tmp_dir"
pnpm test:live
EOF

echo "==> Build image: $IMAGE_NAME"
docker build -t "$IMAGE_NAME" -f "$ROOT_DIR/Dockerfile" "$ROOT_DIR"

echo "==> Run live model tests (profile keys)"
docker run --rm -t \
  --entrypoint bash \
  -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  -e HOME=/home/node \
  -e NODE_OPTIONS=--disable-warning=ExperimentalWarning \
  -e VIKICLOW_LIVE_TEST=1 \
  -e VIKICLOW_LIVE_MODELS="${VIKICLOW_LIVE_MODELS:-${VIKICLOWBOT_LIVE_MODELS:-modern}}" \
  -e VIKICLOW_LIVE_PROVIDERS="${VIKICLOW_LIVE_PROVIDERS:-${VIKICLOWBOT_LIVE_PROVIDERS:-}}" \
  -e VIKICLOW_LIVE_MAX_MODELS="${VIKICLOW_LIVE_MAX_MODELS:-${VIKICLOWBOT_LIVE_MAX_MODELS:-48}}" \
  -e VIKICLOW_LIVE_MODEL_TIMEOUT_MS="${VIKICLOW_LIVE_MODEL_TIMEOUT_MS:-${VIKICLOWBOT_LIVE_MODEL_TIMEOUT_MS:-}}" \
  -e VIKICLOW_LIVE_REQUIRE_PROFILE_KEYS="${VIKICLOW_LIVE_REQUIRE_PROFILE_KEYS:-${VIKICLOWBOT_LIVE_REQUIRE_PROFILE_KEYS:-}}" \
  -v "$ROOT_DIR":/src:ro \
  -v "$CONFIG_DIR":/home/node/.vikiclow \
  -v "$WORKSPACE_DIR":/home/node/.vikiclow/workspace \
  "${PROFILE_MOUNT[@]}" \
  "$IMAGE_NAME" \
  -lc "$LIVE_TEST_CMD"

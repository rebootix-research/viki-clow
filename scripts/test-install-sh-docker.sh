#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SMOKE_IMAGE="${VIKICLOW_INSTALL_SMOKE_IMAGE:-vikiclow-install-smoke:local}"
NONROOT_IMAGE="${VIKICLOW_INSTALL_NONROOT_IMAGE:-vikiclow-install-nonroot:local}"
INSTALL_URL="${VIKICLOW_INSTALL_URL:-https://vikiclow.ai/install.sh}"
CLI_INSTALL_URL="${VIKICLOW_INSTALL_CLI_URL:-https://vikiclow.ai/install-cli.sh}"
SKIP_NONROOT="${VIKICLOW_INSTALL_SMOKE_SKIP_NONROOT:-0}"
SKIP_SMOKE_IMAGE_BUILD="${VIKICLOW_INSTALL_SMOKE_SKIP_IMAGE_BUILD:-0}"
SKIP_NONROOT_IMAGE_BUILD="${VIKICLOW_INSTALL_NONROOT_SKIP_IMAGE_BUILD:-0}"
LATEST_DIR="$(mktemp -d)"
LATEST_FILE="${LATEST_DIR}/latest"

if [[ "$SKIP_SMOKE_IMAGE_BUILD" == "1" ]]; then
  echo "==> Reuse prebuilt smoke image: $SMOKE_IMAGE"
else
  echo "==> Build smoke image (upgrade, root): $SMOKE_IMAGE"
  docker build \
    -t "$SMOKE_IMAGE" \
    -f "$ROOT_DIR/scripts/docker/install-sh-smoke/Dockerfile" \
    "$ROOT_DIR/scripts/docker"
fi

echo "==> Run installer smoke test (root): $INSTALL_URL"
docker run --rm -t \
  -v "${LATEST_DIR}:/out" \
  -e VIKICLOW_INSTALL_URL="$INSTALL_URL" \
  -e VIKICLOW_INSTALL_METHOD=npm \
  -e VIKICLOW_INSTALL_LATEST_OUT="/out/latest" \
  -e VIKICLOW_INSTALL_SMOKE_PREVIOUS="${VIKICLOW_INSTALL_SMOKE_PREVIOUS:-}" \
  -e VIKICLOW_INSTALL_SMOKE_SKIP_PREVIOUS="${VIKICLOW_INSTALL_SMOKE_SKIP_PREVIOUS:-0}" \
  -e VIKICLOW_NO_ONBOARD=1 \
  -e DEBIAN_FRONTEND=noninteractive \
  "$SMOKE_IMAGE"

LATEST_VERSION=""
if [[ -f "$LATEST_FILE" ]]; then
  LATEST_VERSION="$(cat "$LATEST_FILE")"
fi

if [[ "$SKIP_NONROOT" == "1" ]]; then
  echo "==> Skip non-root installer smoke (VIKICLOW_INSTALL_SMOKE_SKIP_NONROOT=1)"
else
  if [[ "$SKIP_NONROOT_IMAGE_BUILD" == "1" ]]; then
    echo "==> Reuse prebuilt non-root image: $NONROOT_IMAGE"
  else
    echo "==> Build non-root image: $NONROOT_IMAGE"
    docker build \
      -t "$NONROOT_IMAGE" \
      -f "$ROOT_DIR/scripts/docker/install-sh-nonroot/Dockerfile" \
      "$ROOT_DIR/scripts/docker"
  fi

  echo "==> Run installer non-root test: $INSTALL_URL"
  docker run --rm -t \
    -e VIKICLOW_INSTALL_URL="$INSTALL_URL" \
    -e VIKICLOW_INSTALL_METHOD=npm \
    -e VIKICLOW_INSTALL_EXPECT_VERSION="$LATEST_VERSION" \
    -e VIKICLOW_NO_ONBOARD=1 \
    -e DEBIAN_FRONTEND=noninteractive \
    "$NONROOT_IMAGE"
fi

if [[ "${VIKICLOW_INSTALL_SMOKE_SKIP_CLI:-0}" == "1" ]]; then
  echo "==> Skip CLI installer smoke (VIKICLOW_INSTALL_SMOKE_SKIP_CLI=1)"
  exit 0
fi

if [[ "$SKIP_NONROOT" == "1" ]]; then
  echo "==> Skip CLI installer smoke (non-root image skipped)"
  exit 0
fi

echo "==> Run CLI installer non-root test (same image)"
docker run --rm -t \
  --entrypoint /bin/bash \
  -e VIKICLOW_INSTALL_URL="$INSTALL_URL" \
  -e VIKICLOW_INSTALL_CLI_URL="$CLI_INSTALL_URL" \
  -e VIKICLOW_NO_ONBOARD=1 \
  -e DEBIAN_FRONTEND=noninteractive \
  "$NONROOT_IMAGE" -lc "curl -fsSL \"$CLI_INSTALL_URL\" | bash -s -- --set-npm-prefix --no-onboard"

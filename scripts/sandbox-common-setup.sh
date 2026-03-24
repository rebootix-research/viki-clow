#!/usr/bin/env bash
set -euo pipefail

BASE_IMAGE="${BASE_IMAGE:-vikiclow-sandbox:bookworm-slim}"
TARGET_IMAGE="${TARGET_IMAGE:-vikiclow-sandbox-common:bookworm-slim}"
PACKAGES="${PACKAGES:-curl wget jq coreutils grep nodejs npm python3 git ca-certificates golang-go rustc cargo unzip pkg-config libasound2-dev build-essential file}"
INSTALL_PNPM="${INSTALL_PNPM:-1}"
INSTALL_BUN="${INSTALL_BUN:-1}"
BUN_INSTALL_DIR="${BUN_INSTALL_DIR:-/opt/bun}"
INSTALL_BREW="${INSTALL_BREW:-1}"
BREW_INSTALL_DIR="${BREW_INSTALL_DIR:-/home/linuxbrew/.linuxbrew}"
FINAL_USER="${FINAL_USER:-sandbox}"
VIKICLOW_DOCKER_BUILD_USE_BUILDX="${VIKICLOW_DOCKER_BUILD_USE_BUILDX:-0}"
VIKICLOW_DOCKER_BUILD_CACHE_FROM="${VIKICLOW_DOCKER_BUILD_CACHE_FROM:-}"
VIKICLOW_DOCKER_BUILD_CACHE_TO="${VIKICLOW_DOCKER_BUILD_CACHE_TO:-}"

if ! docker image inspect "${BASE_IMAGE}" >/dev/null 2>&1; then
  echo "Base image missing: ${BASE_IMAGE}"
  echo "Building base image via scripts/sandbox-setup.sh..."
  scripts/sandbox-setup.sh
fi

echo "Building ${TARGET_IMAGE} with: ${PACKAGES}"

build_cmd=(docker build)
if [ "${VIKICLOW_DOCKER_BUILD_USE_BUILDX}" = "1" ]; then
  build_cmd=(docker buildx build --load)
  if [ -n "${VIKICLOW_DOCKER_BUILD_CACHE_FROM}" ]; then
    build_cmd+=(--cache-from "${VIKICLOW_DOCKER_BUILD_CACHE_FROM}")
  fi
  if [ -n "${VIKICLOW_DOCKER_BUILD_CACHE_TO}" ]; then
    build_cmd+=(--cache-to "${VIKICLOW_DOCKER_BUILD_CACHE_TO}")
  fi
fi

"${build_cmd[@]}" \
  -t "${TARGET_IMAGE}" \
  -f Dockerfile.sandbox-common \
  --build-arg BASE_IMAGE="${BASE_IMAGE}" \
  --build-arg PACKAGES="${PACKAGES}" \
  --build-arg INSTALL_PNPM="${INSTALL_PNPM}" \
  --build-arg INSTALL_BUN="${INSTALL_BUN}" \
  --build-arg BUN_INSTALL_DIR="${BUN_INSTALL_DIR}" \
  --build-arg INSTALL_BREW="${INSTALL_BREW}" \
  --build-arg BREW_INSTALL_DIR="${BREW_INSTALL_DIR}" \
  --build-arg FINAL_USER="${FINAL_USER}" \
  .

cat <<NOTE
Built ${TARGET_IMAGE}.
To use it, set agents.defaults.sandbox.docker.image to "${TARGET_IMAGE}" and restart.
If you want a clean re-create, remove old sandbox containers:
  docker rm -f \$(docker ps -aq --filter label=vikiclow.sandbox=1)
NOTE

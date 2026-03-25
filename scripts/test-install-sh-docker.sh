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
NODE_BIN="$(command -v node || command -v node.exe || true)"
NPM_BIN="$(command -v npm || command -v npm.exe || command -v npm.cmd || true)"

if [[ -z "$NODE_BIN" ]]; then
  echo "node or node.exe is required for installer smoke packaging" >&2
  exit 1
fi

if [[ -z "$NPM_BIN" ]]; then
  echo "npm or npm.cmd is required for installer smoke packaging" >&2
  exit 1
fi

WINDOWS_HOST=0
if [[ "$NODE_BIN" == *.exe ]] || [[ "$NPM_BIN" == *.exe ]] || [[ "$NPM_BIN" == *.cmd ]]; then
  WINDOWS_HOST=1
fi

make_native_temp_dir() {
  "$NODE_BIN" -e "const fs=require('node:fs'); const os=require('node:os'); const path=require('node:path'); const dir=fs.mkdtempSync(path.join(os.tmpdir(), process.argv[1])); process.stdout.write(fs.realpathSync.native(dir));" "$1"
}

to_docker_host_path() {
  local host_path="$1"
  if [[ "$WINDOWS_HOST" == "1" ]]; then
    if command -v cygpath >/dev/null 2>&1; then
      cygpath -aw "$host_path"
      return
    fi
    if [[ "$host_path" =~ ^/mnt/([A-Za-z])/(.*)$ ]]; then
      local drive="${BASH_REMATCH[1]^^}"
      local rest="${BASH_REMATCH[2]}"
      rest="${rest//\//\\}"
      printf '%s:\\%s\n' "$drive" "$rest"
      return
    fi
    if [[ "$host_path" =~ ^/([A-Za-z])/(.*)$ ]]; then
      local drive="${BASH_REMATCH[1]^^}"
      local rest="${BASH_REMATCH[2]}"
      rest="${rest//\//\\}"
      printf '%s:\\%s\n' "$drive" "$rest"
      return
    fi
    printf '%s\n' "$host_path"
    return
  fi

  if command -v cygpath >/dev/null 2>&1; then
    cygpath -u "$host_path"
    return
  fi

  printf '%s\n' "$host_path"
}

join_native_path() {
  "$NODE_BIN" -e "const path=require('node:path'); process.stdout.write(path.join(process.argv[1], process.argv[2]));" "$1" "$2"
}

docker_cmd() {
  if [[ "$WINDOWS_HOST" == "1" ]]; then
    "$NODE_BIN" - "$@" <<'NODE'
const { spawnSync } = require('node:child_process')
const args = process.argv.slice(2)
const result = spawnSync('docker', args, {
  stdio: 'inherit',
  shell: false,
  windowsHide: true,
})
if (result.error) {
  console.error(result.error)
  process.exit(1)
}
process.exit(result.status ?? 1)
NODE
    return
  fi

  docker "$@"
}

LATEST_DIR_NATIVE="$(make_native_temp_dir 'vikiclow-latest-')"
PACK_DIR_NATIVE="$(make_native_temp_dir 'vikiclow-pack-')"
LATEST_DIR="$(to_docker_host_path "$LATEST_DIR_NATIVE")"
PACK_DIR="$(to_docker_host_path "$PACK_DIR_NATIVE")"
SCRIPTS_DIR="$(to_docker_host_path "$ROOT_DIR/scripts")"
DOCKER_CONTEXT_DIR="$(to_docker_host_path "$ROOT_DIR/scripts/docker")"
SMOKE_DOCKERFILE="$(to_docker_host_path "$ROOT_DIR/scripts/docker/install-sh-smoke/Dockerfile")"
NONROOT_DOCKERFILE="$(to_docker_host_path "$ROOT_DIR/scripts/docker/install-sh-nonroot/Dockerfile")"
LATEST_FILE="$(join_native_path "$LATEST_DIR_NATIVE" 'latest')"
PACK_FILE=""
PACK_NAME=""
if [[ "$WINDOWS_HOST" == "1" ]]; then
  export MSYS_NO_PATHCONV=1
  export MSYS2_ARG_CONV_EXCL='*'
fi

cleanup() {
  "$NODE_BIN" -e "const fs=require('node:fs'); for (const target of process.argv.slice(1)) fs.rmSync(target, { recursive: true, force: true });" "$LATEST_DIR_NATIVE" "$PACK_DIR_NATIVE"
}
trap cleanup EXIT

echo "==> Pack local Vikiclow tarball for installer smoke"
pushd "$ROOT_DIR" >/dev/null
PACK_NAME="$("$NPM_BIN" pack --ignore-scripts --pack-destination "$PACK_DIR_NATIVE" . | tail -n1 | tr -d '\r')"
PACKAGE_VERSION="$("$NODE_BIN" -p "require('./package.json').version")"
popd >/dev/null
PACK_FILE="$(join_native_path "$PACK_DIR_NATIVE" "$PACK_NAME")"

if [[ "$SKIP_SMOKE_IMAGE_BUILD" == "1" ]]; then
  echo "==> Reuse prebuilt smoke image: $SMOKE_IMAGE"
else
  echo "==> Build smoke image (upgrade, root): $SMOKE_IMAGE"
  docker_cmd build \
    -t "$SMOKE_IMAGE" \
    -f "$SMOKE_DOCKERFILE" \
    "$DOCKER_CONTEXT_DIR"
fi

echo "==> Run installer smoke test (root): $INSTALL_URL"
docker_cmd run --rm -t \
  --mount "type=bind,source=${LATEST_DIR},target=/out" \
  --mount "type=bind,source=${PACK_DIR},target=/pack" \
  --mount "type=bind,source=${SCRIPTS_DIR},target=/repo-scripts,readonly" \
  -e VIKICLOW_INSTALL_URL="$INSTALL_URL" \
  -e VIKICLOW_INSTALL_LOCAL_SCRIPT="/repo-scripts/install.sh" \
  -e VIKICLOW_INSTALL_METHOD=npm \
  -e VIKICLOW_INSTALL_PACKAGE="vikiclow" \
  -e VIKICLOW_INSTALL_SPEC="/pack/${PACK_NAME}" \
  -e VIKICLOW_INSTALL_EXPECT_VERSION="$PACKAGE_VERSION" \
  -e VIKICLOW_INSTALL_LATEST_OUT="/out/latest" \
  -e VIKICLOW_INSTALL_SMOKE_PREVIOUS="${VIKICLOW_INSTALL_SMOKE_PREVIOUS:-}" \
  -e VIKICLOW_INSTALL_SMOKE_SKIP_PREVIOUS="${VIKICLOW_INSTALL_SMOKE_SKIP_PREVIOUS:-0}" \
  -e VIKICLOW_NO_ONBOARD=1 \
  -e VIKICLOW_NO_PROMPT=1 \
  -e VIKICLOW_VERBOSE="${VIKICLOW_VERBOSE:-0}" \
  -e VIKICLOW_NPM_LOGLEVEL="${VIKICLOW_NPM_LOGLEVEL:-error}" \
  -e DEBIAN_FRONTEND=noninteractive \
  "$SMOKE_IMAGE"

LATEST_VERSION=""
if [[ -f "$LATEST_FILE" ]]; then
  LATEST_VERSION="$(cat "$LATEST_FILE")"
fi
if [[ -z "$LATEST_VERSION" && -n "$PACKAGE_VERSION" ]]; then
  LATEST_VERSION="$PACKAGE_VERSION"
fi

if [[ "$SKIP_NONROOT" == "1" ]]; then
  echo "==> Skip non-root installer smoke (VIKICLOW_INSTALL_SMOKE_SKIP_NONROOT=1)"
else
  if [[ "$SKIP_NONROOT_IMAGE_BUILD" == "1" ]]; then
    echo "==> Reuse prebuilt non-root image: $NONROOT_IMAGE"
  else
    echo "==> Build non-root image: $NONROOT_IMAGE"
    docker_cmd build \
      -t "$NONROOT_IMAGE" \
      -f "$NONROOT_DOCKERFILE" \
      "$DOCKER_CONTEXT_DIR"
  fi

  echo "==> Run installer non-root test: $INSTALL_URL"
  docker_cmd run --rm -t \
    --mount "type=bind,source=${PACK_DIR},target=/pack" \
    --mount "type=bind,source=${SCRIPTS_DIR},target=/repo-scripts,readonly" \
    -e VIKICLOW_INSTALL_URL="$INSTALL_URL" \
    -e VIKICLOW_INSTALL_LOCAL_SCRIPT="/repo-scripts/install.sh" \
    -e VIKICLOW_INSTALL_METHOD=npm \
    -e VIKICLOW_INSTALL_PACKAGE="vikiclow" \
    -e VIKICLOW_INSTALL_SPEC="/pack/${PACK_NAME}" \
    -e VIKICLOW_INSTALL_EXPECT_VERSION="$LATEST_VERSION" \
    -e VIKICLOW_NO_ONBOARD=1 \
    -e VIKICLOW_NO_PROMPT=1 \
    -e VIKICLOW_VERBOSE="${VIKICLOW_VERBOSE:-0}" \
    -e VIKICLOW_NPM_LOGLEVEL="${VIKICLOW_NPM_LOGLEVEL:-error}" \
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

if [[ ! -f "$ROOT_DIR/scripts/install-cli.sh" ]]; then
  echo "==> Skip CLI installer smoke (scripts/install-cli.sh not bundled in this repo)"
  exit 0
fi

echo "==> Run CLI installer non-root test (same image)"
docker_cmd run --rm -t \
  --mount "type=bind,source=${SCRIPTS_DIR},target=/repo-scripts,readonly" \
  --entrypoint /bin/bash \
  -e VIKICLOW_INSTALL_URL="$INSTALL_URL" \
  -e VIKICLOW_INSTALL_CLI_URL="$CLI_INSTALL_URL" \
  -e VIKICLOW_NO_ONBOARD=1 \
  -e VIKICLOW_NO_PROMPT=1 \
  -e DEBIAN_FRONTEND=noninteractive \
  "$NONROOT_IMAGE" -lc "bash /repo-scripts/install-cli.sh --set-npm-prefix --no-onboard"

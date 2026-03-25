#!/usr/bin/env bash
set -euo pipefail

INSTALL_URL="${VIKICLOW_INSTALL_URL:-https://vikiclow.ai/install.sh}"
LOCAL_INSTALL_SCRIPT="${VIKICLOW_INSTALL_LOCAL_SCRIPT:-}"
SMOKE_PREVIOUS_VERSION="${VIKICLOW_INSTALL_SMOKE_PREVIOUS:-}"
SKIP_PREVIOUS="${VIKICLOW_INSTALL_SMOKE_SKIP_PREVIOUS:-0}"
DEFAULT_PACKAGE="vikiclow"
PACKAGE_NAME="${VIKICLOW_INSTALL_PACKAGE:-$DEFAULT_PACKAGE}"
INSTALL_SPEC="${VIKICLOW_INSTALL_SPEC:-}"
EXPECTED_VERSION="${VIKICLOW_INSTALL_EXPECT_VERSION:-}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# shellcheck source=../install-sh-common/cli-verify.sh
source "$SCRIPT_DIR/../install-sh-common/cli-verify.sh"

refresh_cli_path() {
  local npm_prefix=""
  local npm_config_prefix=""
  npm_prefix="$(npm prefix -g 2>/dev/null || true)"
  npm_config_prefix="$(npm config get prefix 2>/dev/null || true)"
  export PATH="$HOME/.npm-global/bin:$HOME/.local/bin:$PATH"
  if [[ -n "$npm_prefix" ]]; then
    export PATH="${npm_prefix%/}/bin:$PATH"
  fi
  if [[ -n "$npm_config_prefix" && "$npm_config_prefix" != "undefined" && "$npm_config_prefix" != "null" ]]; then
    export PATH="${npm_config_prefix%/}/bin:$PATH"
  fi
}

echo "==> Resolve npm versions"
if [[ -n "$INSTALL_SPEC" ]]; then
  if [[ -z "$EXPECTED_VERSION" ]]; then
    echo "VIKICLOW_INSTALL_EXPECT_VERSION is required when VIKICLOW_INSTALL_SPEC is set" >&2
    exit 1
  fi
  LATEST_VERSION="$EXPECTED_VERSION"
  PREVIOUS_VERSION="$EXPECTED_VERSION"
else
  LATEST_VERSION="$(npm view "$PACKAGE_NAME" version)"
  if [[ -n "$SMOKE_PREVIOUS_VERSION" ]]; then
    PREVIOUS_VERSION="$SMOKE_PREVIOUS_VERSION"
  else
    VERSIONS_JSON="$(npm view "$PACKAGE_NAME" versions --json)"
    PREVIOUS_VERSION="$(VERSIONS_JSON="$VERSIONS_JSON" LATEST_VERSION="$LATEST_VERSION" node - <<'NODE'
const raw = process.env.VERSIONS_JSON || "[]";
const latest = process.env.LATEST_VERSION || "";
let versions;
try {
  versions = JSON.parse(raw);
} catch {
  versions = raw ? [raw] : [];
}
if (!Array.isArray(versions)) {
  versions = [versions];
}
if (versions.length === 0) {
  process.exit(1);
}
const latestIndex = latest ? versions.lastIndexOf(latest) : -1;
if (latestIndex > 0) {
  process.stdout.write(String(versions[latestIndex - 1]));
  process.exit(0);
}
process.stdout.write(String(latest || versions[versions.length - 1]));
NODE
)"
  fi
fi

echo "package=$PACKAGE_NAME latest=$LATEST_VERSION previous=$PREVIOUS_VERSION spec=${INSTALL_SPEC:-<registry>}"

if [[ -n "$INSTALL_SPEC" ]]; then
  echo "==> Skip preinstall previous (installer smoke uses local package spec)"
elif [[ "$SKIP_PREVIOUS" == "1" ]]; then
  echo "==> Skip preinstall previous (VIKICLOW_INSTALL_SMOKE_SKIP_PREVIOUS=1)"
else
  echo "==> Preinstall previous (forces installer upgrade path)"
  npm install -g "${PACKAGE_NAME}@${PREVIOUS_VERSION}"
fi

echo "==> Run official installer one-liner"
if [[ -n "$LOCAL_INSTALL_SCRIPT" ]]; then
  bash "$LOCAL_INSTALL_SCRIPT"
else
  curl -fsSL "$INSTALL_URL" | bash
fi
refresh_cli_path

echo "==> Verify installed version"
if [[ -n "${VIKICLOW_INSTALL_LATEST_OUT:-}" ]]; then
  printf "%s" "$LATEST_VERSION" > "${VIKICLOW_INSTALL_LATEST_OUT:-}"
fi
verify_installed_cli "$PACKAGE_NAME" "$LATEST_VERSION"

echo "OK"

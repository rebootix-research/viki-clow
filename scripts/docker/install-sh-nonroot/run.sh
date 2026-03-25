#!/usr/bin/env bash
set -euo pipefail

INSTALL_URL="${VIKICLOW_INSTALL_URL:-https://vikiclow.ai/install.sh}"
LOCAL_INSTALL_SCRIPT="${VIKICLOW_INSTALL_LOCAL_SCRIPT:-}"
DEFAULT_PACKAGE="vikiclow"
PACKAGE_NAME="${VIKICLOW_INSTALL_PACKAGE:-$DEFAULT_PACKAGE}"
INSTALL_SPEC="${VIKICLOW_INSTALL_SPEC:-}"
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

echo "==> Pre-flight: ensure git absent"
if command -v git >/dev/null; then
  echo "git is present unexpectedly" >&2
  exit 1
fi

echo "==> Run installer (non-root user)"
if [[ -n "$LOCAL_INSTALL_SCRIPT" ]]; then
  bash "$LOCAL_INSTALL_SCRIPT"
else
  curl -fsSL "$INSTALL_URL" | bash
fi
refresh_cli_path

# Ensure PATH picks up user npm prefix
export PATH="$HOME/.npm-global/bin:$PATH"

echo "==> Verify git installed"
command -v git >/dev/null

EXPECTED_VERSION="${VIKICLOW_INSTALL_EXPECT_VERSION:-}"
if [[ -n "$EXPECTED_VERSION" ]]; then
  LATEST_VERSION="$EXPECTED_VERSION"
elif [[ -n "$INSTALL_SPEC" ]]; then
  echo "VIKICLOW_INSTALL_EXPECT_VERSION is required when VIKICLOW_INSTALL_SPEC is set" >&2
  exit 1
else
  LATEST_VERSION="$(npm view "$PACKAGE_NAME" version)"
fi
echo "==> Verify CLI installed"
verify_installed_cli "$PACKAGE_NAME" "$LATEST_VERSION"

echo "OK"

#!/usr/bin/env bash
set -euo pipefail

cd /repo

export VIKICLOW_STATE_DIR="/tmp/vikiclow-test"
export VIKICLOW_CONFIG_PATH="${VIKICLOW_STATE_DIR}/vikiclow.json"

echo "==> Build"
pnpm build

echo "==> Seed state"
mkdir -p "${VIKICLOW_STATE_DIR}/credentials"
mkdir -p "${VIKICLOW_STATE_DIR}/agents/main/sessions"
echo '{}' >"${VIKICLOW_CONFIG_PATH}"
echo 'creds' >"${VIKICLOW_STATE_DIR}/credentials/marker.txt"
echo 'session' >"${VIKICLOW_STATE_DIR}/agents/main/sessions/sessions.json"

echo "==> Reset (config+creds+sessions)"
pnpm vikiclow reset --scope config+creds+sessions --yes --non-interactive

test ! -f "${VIKICLOW_CONFIG_PATH}"
test ! -d "${VIKICLOW_STATE_DIR}/credentials"
test ! -d "${VIKICLOW_STATE_DIR}/agents/main/sessions"

echo "==> Recreate minimal config"
mkdir -p "${VIKICLOW_STATE_DIR}/credentials"
echo '{}' >"${VIKICLOW_CONFIG_PATH}"

echo "==> Uninstall (state only)"
pnpm vikiclow uninstall --state --yes --non-interactive

test ! -d "${VIKICLOW_STATE_DIR}"

echo "OK"

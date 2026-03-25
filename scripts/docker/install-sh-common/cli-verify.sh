#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./version-parse.sh
source "$SCRIPT_DIR/version-parse.sh"

collect_cli_candidate_paths() {
  local package_name="$1"
  local -a candidates=()
  local npm_prefix=""
  local npm_config_prefix=""
  local npm_root=""

  npm_prefix="$(npm prefix -g 2>/dev/null || true)"
  npm_config_prefix="$(npm config get prefix 2>/dev/null || true)"
  npm_root="$(npm root -g 2>/dev/null || true)"

  candidates+=(
    "$HOME/.npm-global/bin/$package_name"
    "$HOME/.local/bin/$package_name"
    "/usr/local/bin/$package_name"
    "/usr/bin/$package_name"
  )

  if [[ -n "$npm_prefix" && "$npm_prefix" != "undefined" && "$npm_prefix" != "null" ]]; then
    candidates+=(
      "${npm_prefix%/}/bin/$package_name"
      "${npm_prefix%/}/lib/node_modules/$package_name/dist/entry.js"
      "${npm_prefix%/}/lib/node_modules/$package_name/vikiclow.mjs"
      "${npm_prefix%/}/node_modules/$package_name/dist/entry.js"
      "${npm_prefix%/}/node_modules/$package_name/vikiclow.mjs"
    )
  fi

  if [[ -n "$npm_config_prefix" && "$npm_config_prefix" != "undefined" && "$npm_config_prefix" != "null" ]]; then
    candidates+=(
      "${npm_config_prefix%/}/bin/$package_name"
      "${npm_config_prefix%/}/lib/node_modules/$package_name/dist/entry.js"
      "${npm_config_prefix%/}/lib/node_modules/$package_name/vikiclow.mjs"
      "${npm_config_prefix%/}/node_modules/$package_name/dist/entry.js"
      "${npm_config_prefix%/}/node_modules/$package_name/vikiclow.mjs"
    )
  fi

  if [[ -n "$npm_root" ]]; then
    candidates+=(
      "${npm_root%/}/$package_name/dist/entry.js"
      "${npm_root%/}/$package_name/vikiclow.mjs"
    )
  fi

  candidates+=(
    "/usr/local/lib/node_modules/$package_name/dist/entry.js"
    "/usr/local/lib/node_modules/$package_name/vikiclow.mjs"
    "/usr/lib/node_modules/$package_name/dist/entry.js"
    "/usr/lib/node_modules/$package_name/vikiclow.mjs"
  )

  printf '%s\n' "${candidates[@]}" | awk 'NF && !seen[$0]++'
}

print_cli_debug_info() {
  local package_name="$1"
  echo "==> CLI debug" >&2
  echo "PATH=${PATH}" >&2
  echo "HOME=${HOME}" >&2
  echo "npm prefix -g: $(npm prefix -g 2>/dev/null || echo '<unavailable>')" >&2
  echo "npm config get prefix: $(npm config get prefix 2>/dev/null || echo '<unavailable>')" >&2
  echo "npm root -g: $(npm root -g 2>/dev/null || echo '<unavailable>')" >&2
  echo "npm list -g --depth=0:" >&2
  npm list -g --depth=0 2>&1 >&2 || true
  collect_cli_candidate_paths "$package_name" | while IFS= read -r candidate; do
    [[ -n "$candidate" ]] || continue
    if [[ -e "$candidate" || -L "$candidate" ]]; then
      echo "candidate: ${candidate} [present]" >&2
    else
      echo "candidate: ${candidate} [missing]" >&2
    fi
  done
  echo "filesystem hits:" >&2
  find /usr/local /usr "$HOME/.npm-global" -maxdepth 4 \( -iname "${package_name}*" -o -iname ".${package_name}-*" \) 2>/dev/null >&2 || true
}

verify_installed_cli() {
  local package_name="$1"
  local expected_version="$2"
  local cli_name="$package_name"
  local cmd_path=""
  local entry_path=""
  local npm_root=""
  local installed_version=""

  cmd_path="$(command -v "$cli_name" || true)"
  if [[ -z "$cmd_path" || ! -x "$cmd_path" ]]; then
    while IFS= read -r candidate; do
      [[ -n "$candidate" ]] || continue
      if [[ -x "$candidate" && "${candidate##*/}" == "$package_name" ]]; then
        cmd_path="$candidate"
        break
      fi
      if [[ -z "$entry_path" && -f "$candidate" && ( "${candidate##*/}" == "entry.js" || "${candidate##*/}" == "vikiclow.mjs" ) ]]; then
        entry_path="$candidate"
      fi
    done < <(collect_cli_candidate_paths "$package_name")
  fi

  if [[ -z "$cmd_path" && -z "$entry_path" ]]; then
    echo "ERROR: $package_name is not on PATH" >&2
    print_cli_debug_info "$package_name"
    return 1
  fi

  if [[ -n "$cmd_path" ]]; then
    installed_version="$("$cmd_path" --version 2>/dev/null | head -n 1 | tr -d '\r')"
  else
    installed_version="$(node "$entry_path" --version 2>/dev/null | head -n 1 | tr -d '\r')"
  fi

  installed_version="$(extract_vikiclow_semver "$installed_version")"

  echo "cli=$cli_name installed=$installed_version expected=$expected_version"
  if [[ "$installed_version" != "$expected_version" ]]; then
    echo "ERROR: expected ${cli_name}@${expected_version}, got ${cli_name}@${installed_version}" >&2
    return 1
  fi

  echo "==> Sanity: CLI runs"
  if [[ -n "$cmd_path" ]]; then
    "$cmd_path" --help >/dev/null
  else
    node "$entry_path" --help >/dev/null
  fi
}

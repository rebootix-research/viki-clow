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
      "${npm_prefix%/}/lib/node_modules/$package_name/dist/entry.mjs"
      "${npm_prefix%/}/lib/node_modules/$package_name/dist/index.js"
      "${npm_prefix%/}/lib/node_modules/$package_name/vikiclow.mjs"
      "${npm_prefix%/}/node_modules/$package_name/dist/entry.js"
      "${npm_prefix%/}/node_modules/$package_name/dist/entry.mjs"
      "${npm_prefix%/}/node_modules/$package_name/dist/index.js"
      "${npm_prefix%/}/node_modules/$package_name/vikiclow.mjs"
      "${npm_prefix%/}/lib/node_modules/$package_name"
      "${npm_prefix%/}/node_modules/$package_name"
    )
  fi

  if [[ -n "$npm_config_prefix" && "$npm_config_prefix" != "undefined" && "$npm_config_prefix" != "null" ]]; then
    candidates+=(
      "${npm_config_prefix%/}/bin/$package_name"
      "${npm_config_prefix%/}/lib/node_modules/$package_name/dist/entry.js"
      "${npm_config_prefix%/}/lib/node_modules/$package_name/dist/entry.mjs"
      "${npm_config_prefix%/}/lib/node_modules/$package_name/dist/index.js"
      "${npm_config_prefix%/}/lib/node_modules/$package_name/vikiclow.mjs"
      "${npm_config_prefix%/}/node_modules/$package_name/dist/entry.js"
      "${npm_config_prefix%/}/node_modules/$package_name/dist/entry.mjs"
      "${npm_config_prefix%/}/node_modules/$package_name/dist/index.js"
      "${npm_config_prefix%/}/node_modules/$package_name/vikiclow.mjs"
      "${npm_config_prefix%/}/lib/node_modules/$package_name"
      "${npm_config_prefix%/}/node_modules/$package_name"
    )
  fi

  if [[ -n "$npm_root" ]]; then
    candidates+=(
      "${npm_root%/}/$package_name/dist/entry.js"
      "${npm_root%/}/$package_name/dist/entry.mjs"
      "${npm_root%/}/$package_name/dist/index.js"
      "${npm_root%/}/$package_name/vikiclow.mjs"
      "${npm_root%/}/$package_name"
    )
  fi

  candidates+=(
    "/usr/local/lib/node_modules/$package_name/dist/entry.js"
    "/usr/local/lib/node_modules/$package_name/dist/entry.mjs"
    "/usr/local/lib/node_modules/$package_name/dist/index.js"
    "/usr/local/lib/node_modules/$package_name/vikiclow.mjs"
    "/usr/local/lib/node_modules/$package_name"
    "/usr/lib/node_modules/$package_name/dist/entry.js"
    "/usr/lib/node_modules/$package_name/dist/entry.mjs"
    "/usr/lib/node_modules/$package_name/dist/index.js"
    "/usr/lib/node_modules/$package_name/vikiclow.mjs"
    "/usr/lib/node_modules/$package_name"
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
  local matched_cmd_path=""
  local matched_entry_path=""
  local installed_version=""
  local candidate_version=""

  cmd_path="$(command -v "$cli_name" || true)"
  if [[ -n "$cmd_path" && -x "$cmd_path" ]]; then
    candidate_version="$("$cmd_path" --version 2>/dev/null | head -n 1 | tr -d '\r')"
    candidate_version="$(extract_vikiclow_semver "$candidate_version")"
    if [[ -n "$candidate_version" ]]; then
      matched_cmd_path="$cmd_path"
      installed_version="$candidate_version"
    fi
  fi

  while IFS= read -r candidate; do
    [[ -n "$candidate" ]] || continue

    if [[ -z "$installed_version" && -x "$candidate" && "${candidate##*/}" == "$package_name" ]]; then
      candidate_version="$("$candidate" --version 2>/dev/null | head -n 1 | tr -d '\r')"
      candidate_version="$(extract_vikiclow_semver "$candidate_version")"
      if [[ -n "$candidate_version" ]]; then
        matched_cmd_path="$candidate"
        installed_version="$candidate_version"
        continue
      fi
    fi

    if [[ -z "$installed_version" && -f "$candidate" && ( "${candidate##*/}" == "entry.js" || "${candidate##*/}" == "entry.mjs" || "${candidate##*/}" == "index.js" || "${candidate##*/}" == "vikiclow.mjs" ) ]]; then
      candidate_version="$(node "$candidate" --version 2>/dev/null | head -n 1 | tr -d '\r')"
      candidate_version="$(extract_vikiclow_semver "$candidate_version")"
      if [[ -n "$candidate_version" ]]; then
        matched_entry_path="$candidate"
        installed_version="$candidate_version"
      fi
    fi

    if [[ -z "$installed_version" && -d "$candidate" ]]; then
      for entrypoint in "$candidate/vikiclow.mjs" "$candidate/dist/entry.js" "$candidate/dist/entry.mjs" "$candidate/dist/index.js"; do
        [[ -f "$entrypoint" ]] || continue
        candidate_version="$(node "$entrypoint" --version 2>/dev/null | head -n 1 | tr -d '\r')"
        candidate_version="$(extract_vikiclow_semver "$candidate_version")"
        if [[ -n "$candidate_version" ]]; then
          matched_entry_path="$entrypoint"
          installed_version="$candidate_version"
          break
        fi
      done
    fi
  done < <(collect_cli_candidate_paths "$package_name")

  if [[ -z "$matched_cmd_path" && -z "$matched_entry_path" ]]; then
    echo "ERROR: $package_name did not produce a runnable installed CLI candidate" >&2
    print_cli_debug_info "$package_name"
    return 1
  fi

  if [[ -n "$matched_cmd_path" ]]; then
    echo "cli=$cli_name path=$matched_cmd_path installed=$installed_version expected=$expected_version"
  else
    echo "cli=$cli_name entry=$matched_entry_path installed=$installed_version expected=$expected_version"
  fi
  if [[ "$installed_version" != "$expected_version" ]]; then
    echo "ERROR: expected ${cli_name}@${expected_version}, got ${cli_name}@${installed_version}" >&2
    print_cli_debug_info "$package_name"
    return 1
  fi

  echo "==> Sanity: CLI runs"
  if [[ -n "$matched_cmd_path" ]]; then
    "$matched_cmd_path" --help >/dev/null
  else
    node "$matched_entry_path" --help >/dev/null
  fi
}

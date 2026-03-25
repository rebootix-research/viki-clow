#!/usr/bin/env bash
# vikidock - Docker helpers for VikiClow
# Inspired by Simon Willison's "Running VikiClow in Docker"
# https://til.simonwillison.net/llms/vikiclow-docker
#
# Installation:
#   mkdir -p ~/.vikidock && curl -sL https://raw.githubusercontent.com/rebootix-research/viki-clow/main/scripts/shell-helpers/vikidock-helpers.sh -o ~/.vikidock/vikidock-helpers.sh
#   echo 'source ~/.vikidock/vikidock-helpers.sh' >> ~/.zshrc
#
# Usage:
#   vikidock-help    # Show all available commands

# =============================================================================
# Colors
# =============================================================================
_CLR_RESET='\033[0m'
_CLR_BOLD='\033[1m'
_CLR_DIM='\033[2m'
_CLR_GREEN='\033[0;32m'
_CLR_YELLOW='\033[1;33m'
_CLR_BLUE='\033[0;34m'
_CLR_MAGENTA='\033[0;35m'
_CLR_CYAN='\033[0;36m'
_CLR_RED='\033[0;31m'

# Styled command output (green + bold)
_clr_cmd() {
  echo -e "${_CLR_GREEN}${_CLR_BOLD}$1${_CLR_RESET}"
}

# Inline command for use in sentences
_cmd() {
  echo "${_CLR_GREEN}${_CLR_BOLD}$1${_CLR_RESET}"
}

# =============================================================================
# Config
# =============================================================================
VIKIDOCK_CONFIG="${HOME}/.vikidock/config"

# Common paths to check for VikiClow
VIKIDOCK_COMMON_PATHS=(
  "${HOME}/vikiclow"
  "${HOME}/workspace/vikiclow"
  "${HOME}/projects/vikiclow"
  "${HOME}/dev/vikiclow"
  "${HOME}/code/vikiclow"
  "${HOME}/src/vikiclow"
)

_vikidock_filter_warnings() {
  grep -v "^WARN\|^time="
}

_vikidock_trim_quotes() {
  local value="$1"
  value="${value#\"}"
  value="${value%\"}"
  printf "%s" "$value"
}

_vikidock_read_config_dir() {
  if [[ ! -f "$VIKIDOCK_CONFIG" ]]; then
    return 1
  fi
  local raw
  raw=$(sed -n 's/^VIKIDOCK_DIR=//p' "$VIKIDOCK_CONFIG" | head -n 1)
  if [[ -z "$raw" ]]; then
    return 1
  fi
  _vikidock_trim_quotes "$raw"
}

# Ensure VIKIDOCK_DIR is set and valid
_vikidock_ensure_dir() {
  # Already set and valid?
  if [[ -n "$VIKIDOCK_DIR" && -f "${VIKIDOCK_DIR}/docker-compose.yml" ]]; then
    return 0
  fi

  # Try loading from config
  local config_dir
  config_dir=$(_vikidock_read_config_dir)
  if [[ -n "$config_dir" && -f "${config_dir}/docker-compose.yml" ]]; then
    VIKIDOCK_DIR="$config_dir"
    return 0
  fi

  # Auto-detect from common paths
  local found_path=""
  for path in "${VIKIDOCK_COMMON_PATHS[@]}"; do
    if [[ -f "${path}/docker-compose.yml" ]]; then
      found_path="$path"
      break
    fi
  done

  if [[ -n "$found_path" ]]; then
    echo ""
    echo "ðŸ¦ž Found VikiClow at: $found_path"
    echo -n "   Use this location? [Y/n] "
    read -r response
    if [[ "$response" =~ ^[Nn] ]]; then
      echo ""
      echo "Set VIKIDOCK_DIR manually:"
      echo "  export VIKIDOCK_DIR=/path/to/vikiclow"
      return 1
    fi
    VIKIDOCK_DIR="$found_path"
  else
    echo ""
    echo "âŒ VikiClow not found in common locations."
    echo ""
    echo "Clone it first:"
    echo ""
    echo "  git clone https://github.com/rebootix-research/viki-clow.git ~/vikiclow"
    echo "  cd ~/vikiclow && ./docker-setup.sh"
    echo ""
    echo "Or set VIKIDOCK_DIR if it's elsewhere:"
    echo ""
    echo "  export VIKIDOCK_DIR=/path/to/vikiclow"
    echo ""
    return 1
  fi

  # Save to config
  if [[ ! -d "${HOME}/.vikidock" ]]; then
    /bin/mkdir -p "${HOME}/.vikidock"
  fi
  echo "VIKIDOCK_DIR=\"$VIKIDOCK_DIR\"" > "$VIKIDOCK_CONFIG"
  echo "âœ… Saved to $VIKIDOCK_CONFIG"
  echo ""
  return 0
}

# Wrapper to run docker compose commands
_vikidock_compose() {
  _vikidock_ensure_dir || return 1
  local compose_args=(-f "${VIKIDOCK_DIR}/docker-compose.yml")
  if [[ -f "${VIKIDOCK_DIR}/docker-compose.extra.yml" ]]; then
    compose_args+=(-f "${VIKIDOCK_DIR}/docker-compose.extra.yml")
  fi
  command docker compose "${compose_args[@]}" "$@"
}

_vikidock_read_env_token() {
  _vikidock_ensure_dir || return 1
  if [[ ! -f "${VIKIDOCK_DIR}/.env" ]]; then
    return 1
  fi
  local raw
  raw=$(sed -n 's/^VIKICLOW_GATEWAY_TOKEN=//p' "${VIKIDOCK_DIR}/.env" | head -n 1)
  if [[ -z "$raw" ]]; then
    return 1
  fi
  _vikidock_trim_quotes "$raw"
}

# Basic Operations
vikidock-start() {
  _vikidock_compose up -d vikiclow-gateway
}

vikidock-stop() {
  _vikidock_compose down
}

vikidock-restart() {
  _vikidock_compose restart vikiclow-gateway
}

vikidock-logs() {
  _vikidock_compose logs -f vikiclow-gateway
}

vikidock-status() {
  _vikidock_compose ps
}

# Navigation
vikidock-cd() {
  _vikidock_ensure_dir || return 1
  cd "${VIKIDOCK_DIR}"
}

vikidock-config() {
  cd ~/.vikiclow
}

vikidock-workspace() {
  cd ~/.vikiclow/workspace
}

# Container Access
vikidock-shell() {
  _vikidock_compose exec vikiclow-gateway \
    bash -c 'echo "alias vikiclow=\"./vikiclow.mjs\"" > /tmp/.bashrc_vikiclow && bash --rcfile /tmp/.bashrc_vikiclow'
}

vikidock-exec() {
  _vikidock_compose exec vikiclow-gateway "$@"
}

vikidock-cli() {
  _vikidock_compose run --rm vikiclow-cli "$@"
}

# Maintenance
vikidock-rebuild() {
  _vikidock_compose build vikiclow-gateway
}

vikidock-clean() {
  _vikidock_compose down -v --remove-orphans
}

# Health check
vikidock-health() {
  _vikidock_ensure_dir || return 1
  local token
  token=$(_vikidock_read_env_token)
  if [[ -z "$token" ]]; then
    echo "âŒ Error: Could not find gateway token"
    echo "   Check: ${VIKIDOCK_DIR}/.env"
    return 1
  fi
  _vikidock_compose exec -e "VIKICLOW_GATEWAY_TOKEN=$token" vikiclow-gateway \
    node dist/index.js health
}

# Show gateway token
vikidock-token() {
  _vikidock_read_env_token
}

# Fix token configuration (run this once after setup)
vikidock-fix-token() {
  _vikidock_ensure_dir || return 1

  echo "ðŸ”§ Configuring gateway token..."
  local token
  token=$(vikidock-token)
  if [[ -z "$token" ]]; then
    echo "âŒ Error: Could not find gateway token"
    echo "   Check: ${VIKIDOCK_DIR}/.env"
    return 1
  fi

  echo "ðŸ“ Setting token: ${token:0:20}..."

  _vikidock_compose exec -e "TOKEN=$token" vikiclow-gateway \
    bash -c './vikiclow.mjs config set gateway.remote.token "$TOKEN" && ./vikiclow.mjs config set gateway.auth.token "$TOKEN"' 2>&1 | _vikidock_filter_warnings

  echo "ðŸ” Verifying token was saved..."
  local saved_token
  saved_token=$(_vikidock_compose exec vikiclow-gateway \
    bash -c "./vikiclow.mjs config get gateway.remote.token 2>/dev/null" 2>&1 | _vikidock_filter_warnings | tr -d '\r\n' | head -c 64)

  if [[ "$saved_token" == "$token" ]]; then
    echo "âœ… Token saved correctly!"
  else
    echo "âš ï¸  Token mismatch detected"
    echo "   Expected: ${token:0:20}..."
    echo "   Got: ${saved_token:0:20}..."
  fi

  echo "ðŸ”„ Restarting gateway..."
  _vikidock_compose restart vikiclow-gateway 2>&1 | _vikidock_filter_warnings

  echo "â³ Waiting for gateway to start..."
  sleep 5

  echo "âœ… Configuration complete!"
  echo -e "   Try: $(_cmd vikidock-devices)"
}

# Open dashboard in browser
vikidock-dashboard() {
  _vikidock_ensure_dir || return 1

  echo "ðŸ¦ž Getting dashboard URL..."
  local output exit_status url
  output=$(_vikidock_compose run --rm vikiclow-cli dashboard --no-open 2>&1)
  exit_status=$?
  url=$(printf "%s\n" "$output" | _vikidock_filter_warnings | grep -o 'http[s]\?://[^[:space:]]*' | head -n 1)
  if [[ $exit_status -ne 0 ]]; then
    echo "âŒ Failed to get dashboard URL"
    echo -e "   Try restarting: $(_cmd vikidock-restart)"
    return 1
  fi

  if [[ -n "$url" ]]; then
    echo "âœ… Opening: $url"
    open "$url" 2>/dev/null || xdg-open "$url" 2>/dev/null || echo "   Please open manually: $url"
    echo ""
    echo -e "${_CLR_CYAN}ðŸ’¡ If you see 'pairing required' error:${_CLR_RESET}"
    echo -e "   1. Run: $(_cmd vikidock-devices)"
    echo "   2. Copy the Request ID from the Pending table"
    echo -e "   3. Run: $(_cmd 'vikidock-approve <request-id>')"
  else
    echo "âŒ Failed to get dashboard URL"
    echo -e "   Try restarting: $(_cmd vikidock-restart)"
  fi
}

# List device pairings
vikidock-devices() {
  _vikidock_ensure_dir || return 1

  echo "ðŸ” Checking device pairings..."
  local output exit_status
  output=$(_vikidock_compose exec vikiclow-gateway node dist/index.js devices list 2>&1)
  exit_status=$?
  printf "%s\n" "$output" | _vikidock_filter_warnings
  if [ $exit_status -ne 0 ]; then
    echo ""
    echo -e "${_CLR_CYAN}ðŸ’¡ If you see token errors above:${_CLR_RESET}"
    echo -e "   1. Verify token is set: $(_cmd vikidock-token)"
    echo "   2. Try manual config inside container:"
    echo -e "      $(_cmd vikidock-shell)"
    echo -e "      $(_cmd 'vikiclow config get gateway.remote.token')"
    return 1
  fi

  echo ""
  echo -e "${_CLR_CYAN}ðŸ’¡ To approve a pairing request:${_CLR_RESET}"
  echo -e "   $(_cmd 'vikidock-approve <request-id>')"
}

# Approve device pairing request
vikidock-approve() {
  _vikidock_ensure_dir || return 1

  if [[ -z "$1" ]]; then
    echo -e "âŒ Usage: $(_cmd 'vikidock-approve <request-id>')"
    echo ""
    echo -e "${_CLR_CYAN}ðŸ’¡ How to approve a device:${_CLR_RESET}"
    echo -e "   1. Run: $(_cmd vikidock-devices)"
    echo "   2. Find the Request ID in the Pending table (long UUID)"
    echo -e "   3. Run: $(_cmd 'vikidock-approve <that-request-id>')"
    echo ""
    echo "Example:"
    echo -e "   $(_cmd 'vikidock-approve 6f9db1bd-a1cc-4d3f-b643-2c195262464e')"
    return 1
  fi

  echo "âœ… Approving device: $1"
  _vikidock_compose exec vikiclow-gateway \
    node dist/index.js devices approve "$1" 2>&1 | _vikidock_filter_warnings

  echo ""
  echo "âœ… Device approved! Refresh your browser."
}

# Show all available vikidock helper commands
vikidock-help() {
  echo -e "\n${_CLR_BOLD}${_CLR_CYAN}ðŸ¦ž vikidock - Docker Helpers for VikiClow${_CLR_RESET}\n"

  echo -e "${_CLR_BOLD}${_CLR_MAGENTA}âš¡ Basic Operations${_CLR_RESET}"
  echo -e "  $(_cmd vikidock-start)       ${_CLR_DIM}Start the gateway${_CLR_RESET}"
  echo -e "  $(_cmd vikidock-stop)        ${_CLR_DIM}Stop the gateway${_CLR_RESET}"
  echo -e "  $(_cmd vikidock-restart)     ${_CLR_DIM}Restart the gateway${_CLR_RESET}"
  echo -e "  $(_cmd vikidock-status)      ${_CLR_DIM}Check container status${_CLR_RESET}"
  echo -e "  $(_cmd vikidock-logs)        ${_CLR_DIM}View live logs (follows)${_CLR_RESET}"
  echo ""

  echo -e "${_CLR_BOLD}${_CLR_MAGENTA}ðŸš Container Access${_CLR_RESET}"
  echo -e "  $(_cmd vikidock-shell)       ${_CLR_DIM}Shell into container (vikiclow alias ready)${_CLR_RESET}"
  echo -e "  $(_cmd vikidock-cli)         ${_CLR_DIM}Run CLI commands (e.g., vikidock-cli status)${_CLR_RESET}"
  echo -e "  $(_cmd vikidock-exec) ${_CLR_CYAN}<cmd>${_CLR_RESET}  ${_CLR_DIM}Execute command in gateway container${_CLR_RESET}"
  echo ""

  echo -e "${_CLR_BOLD}${_CLR_MAGENTA}ðŸŒ Web UI & Devices${_CLR_RESET}"
  echo -e "  $(_cmd vikidock-dashboard)   ${_CLR_DIM}Open web UI in browser ${_CLR_CYAN}(auto-guides you)${_CLR_RESET}"
  echo -e "  $(_cmd vikidock-devices)     ${_CLR_DIM}List device pairings ${_CLR_CYAN}(auto-guides you)${_CLR_RESET}"
  echo -e "  $(_cmd vikidock-approve) ${_CLR_CYAN}<id>${_CLR_RESET} ${_CLR_DIM}Approve device pairing ${_CLR_CYAN}(with examples)${_CLR_RESET}"
  echo ""

  echo -e "${_CLR_BOLD}${_CLR_MAGENTA}âš™ï¸  Setup & Configuration${_CLR_RESET}"
  echo -e "  $(_cmd vikidock-fix-token)   ${_CLR_DIM}Configure gateway token ${_CLR_CYAN}(run once)${_CLR_RESET}"
  echo ""

  echo -e "${_CLR_BOLD}${_CLR_MAGENTA}ðŸ”§ Maintenance${_CLR_RESET}"
  echo -e "  $(_cmd vikidock-rebuild)     ${_CLR_DIM}Rebuild Docker image${_CLR_RESET}"
  echo -e "  $(_cmd vikidock-clean)       ${_CLR_RED}âš ï¸  Remove containers & volumes (nuclear)${_CLR_RESET}"
  echo ""

  echo -e "${_CLR_BOLD}${_CLR_MAGENTA}ðŸ› ï¸  Utilities${_CLR_RESET}"
  echo -e "  $(_cmd vikidock-health)      ${_CLR_DIM}Run health check${_CLR_RESET}"
  echo -e "  $(_cmd vikidock-token)       ${_CLR_DIM}Show gateway auth token${_CLR_RESET}"
  echo -e "  $(_cmd vikidock-cd)          ${_CLR_DIM}Jump to vikiclow project directory${_CLR_RESET}"
  echo -e "  $(_cmd vikidock-config)      ${_CLR_DIM}Open config directory (~/.vikiclow)${_CLR_RESET}"
  echo -e "  $(_cmd vikidock-workspace)   ${_CLR_DIM}Open workspace directory${_CLR_RESET}"
  echo ""

  echo -e "${_CLR_BOLD}${_CLR_CYAN}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${_CLR_RESET}"
  echo -e "${_CLR_BOLD}${_CLR_GREEN}ðŸš€ First Time Setup${_CLR_RESET}"
  echo -e "${_CLR_CYAN}  1.${_CLR_RESET} $(_cmd vikidock-start)          ${_CLR_DIM}# Start the gateway${_CLR_RESET}"
  echo -e "${_CLR_CYAN}  2.${_CLR_RESET} $(_cmd vikidock-fix-token)      ${_CLR_DIM}# Configure token${_CLR_RESET}"
  echo -e "${_CLR_CYAN}  3.${_CLR_RESET} $(_cmd vikidock-dashboard)      ${_CLR_DIM}# Open web UI${_CLR_RESET}"
  echo -e "${_CLR_CYAN}  4.${_CLR_RESET} $(_cmd vikidock-devices)        ${_CLR_DIM}# If pairing needed${_CLR_RESET}"
  echo -e "${_CLR_CYAN}  5.${_CLR_RESET} $(_cmd vikidock-approve) ${_CLR_CYAN}<id>${_CLR_RESET}   ${_CLR_DIM}# Approve pairing${_CLR_RESET}"
  echo ""

  echo -e "${_CLR_BOLD}${_CLR_GREEN}ðŸ’¬ WhatsApp Setup${_CLR_RESET}"
  echo -e "  $(_cmd vikidock-shell)"
  echo -e "    ${_CLR_BLUE}>${_CLR_RESET} $(_cmd 'vikiclow channels login --channel whatsapp')"
  echo -e "    ${_CLR_BLUE}>${_CLR_RESET} $(_cmd 'vikiclow status')"
  echo ""

  echo -e "${_CLR_BOLD}${_CLR_CYAN}â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”${_CLR_RESET}"
  echo ""

  echo -e "${_CLR_CYAN}ðŸ’¡ All commands guide you through next steps!${_CLR_RESET}"
  echo -e "${_CLR_BLUE}ðŸ“š Docs: ${_CLR_RESET}${_CLR_CYAN}https://docs.vikiclow.ai${_CLR_RESET}"
  echo ""
}

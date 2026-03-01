#!/bin/bash
# Chrome instance manager for WSL agents.
# Manages headless Chrome instances on Windows, one per agent process.

set -euo pipefail

# --- Configuration ---
CHROME_EXE='C:\Program Files\Google\Chrome\Application\chrome.exe'
SOURCE_PROFILE='D:\chrome'
INSTANCES_DIR='D:\chromes'
PORT_MIN=9222
PORT_MAX=9241
LOCK_DIR="/tmp/chrome-manager"
GLOBAL_LOCK="$LOCK_DIR/.lock"
CDP_WAIT_TIMEOUT=60
USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"
VERBOSE=0

# Chrome launch flags
CHROME_FLAGS=(
    --headless
    --disable-blink-features=AutomationControlled
    --disable-dev-shm-usage
    --disable-software-rasterizer
    --disable-extensions
    --no-sandbox
    --disable-setuid-sandbox
    --disable-gpu
    --hide-scrollbars
    --mute-audio
    --disable-background-timer-throttling
    --disable-backgrounding-occluded-windows
    --disable-renderer-backgrounding
    "--user-agent=$USER_AGENT"
)

# --- Helpers ---

log() {
    [ "$VERBOSE" -eq 1 ] && echo "[chrome-manager] $*" >&2 || true
}

err() {
    echo "[chrome-manager] ERROR: $*" >&2
    exit 1
}

ensure_dirs() {
    mkdir -p "$LOCK_DIR"
}

# Read a field from a lock file
lock_get() {
    local file="$1" key="$2"
    grep "^${key}=" "$file" 2>/dev/null | cut -d'=' -f2-
}

# Check if a WSL process is alive
wsl_process_alive() {
    kill -0 "$1" 2>/dev/null
}

# Check if a Windows process is alive by PID
win_process_alive() {
    local pid="$1"
    powershell.exe -NoProfile -NonInteractive -Command \
        "if (Get-Process -Id $pid -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" 2>/dev/null
}

# Kill a Windows process by PID
win_process_kill() {
    local pid="$1"
    powershell.exe -NoProfile -NonInteractive -Command \
        "Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue" 2>/dev/null
}

# Get PID of the Chrome process on a specific port
win_get_chrome_pid() {
    local port="$1"
    powershell.exe -NoProfile -NonInteractive -Command \
        "Get-CimInstance Win32_Process | Where-Object { \$_.Name -eq 'chrome.exe' -and \$_.CommandLine -like '*--remote-debugging-port=$port*' } | Select-Object -First 1 -ExpandProperty ProcessId" 2>/dev/null | tr -d '\r\n'
}

# Wait for CDP to be ready and return the WebSocket URL
wait_for_cdp() {
    local port="$1"
    local elapsed=0
    while [ $elapsed -lt $CDP_WAIT_TIMEOUT ]; do
        local ws_url
        ws_url=$(curl -s "http://127.0.0.1:${port}/json/version" 2>/dev/null | grep -o '"webSocketDebuggerUrl":[[:space:]]*"[^"]*"' | grep -o 'ws://[^"]*')
        if [ -n "$ws_url" ]; then
            echo "$ws_url"
            return 0
        fi
        sleep 1
        elapsed=$((elapsed + 1))
    done
    return 1
}

# Release a lock file and its associated resources
release_lock() {
    local lock_file="$1"
    [ -f "$lock_file" ] || return 0

    local port chrome_pid
    port=$(lock_get "$lock_file" PORT)
    chrome_pid=$(lock_get "$lock_file" CHROME_PID)

    # Kill Chrome
    if [ -n "$chrome_pid" ]; then
        win_process_kill "$chrome_pid"
    fi

    # Remove Windows profile directory
    if [ -n "$port" ]; then
        local win_dest="${INSTANCES_DIR}\\${port}"
        powershell.exe -NoProfile -NonInteractive -Command \
            "if (Test-Path '$win_dest') { Remove-Item -Recurse -Force '$win_dest' }" 2>/dev/null || true
    fi

    # Remove lock
    rm -f "$lock_file"
}

# --- Commands ---

cmd_acquire() {
    local agent_pid="$1"
    [ -z "$agent_pid" ] && err "agent pid is required"
    # Validate it's a number
    [[ "$agent_pid" =~ ^[0-9]+$ ]] || err "agent pid must be a number, got: $agent_pid"
    ensure_dirs

    local lock_file="$LOCK_DIR/${agent_pid}.lock"

    # Check if this agent already has an instance
    if [ -f "$lock_file" ]; then
        local port chrome_pid ws_url
        port=$(lock_get "$lock_file" PORT)
        chrome_pid=$(lock_get "$lock_file" CHROME_PID)

        if win_process_alive "$chrome_pid"; then
            ws_url=$(lock_get "$lock_file" WS_URL)
            log "agent pid $agent_pid already has instance on port $port"
            echo "{\"port\":$port,\"ws_url\":\"$ws_url\"}"
            return 0
        else
            log "agent pid $agent_pid had a dead instance on port $port, cleaning up"
            release_lock "$lock_file"
        fi
    fi

    # Acquire global lock for port allocation
    exec 200>"$GLOBAL_LOCK"
    flock -x 200

    # Collect used ports
    local -A used_ports=()
    for lf in "$LOCK_DIR"/*.lock; do
        [ -f "$lf" ] || continue
        local p
        p=$(lock_get "$lf" PORT)
        [ -n "$p" ] && used_ports[$p]=1
    done

    # Find an available port
    local port=""
    for p in $(seq $PORT_MIN $PORT_MAX); do
        if [ -z "${used_ports[$p]:-}" ]; then
            port=$p
            break
        fi
    done

    [ -z "$port" ] && { exec 200>&-; err "no available ports in range $PORT_MIN-$PORT_MAX"; }

    # Write lock file to claim the port
    cat > "$lock_file" <<EOF
PORT=$port
CHROME_PID=
WS_URL=
EOF

    # Release global lock
    exec 200>&-

    # Copy Chrome profile
    local win_dest="${INSTANCES_DIR}\\${port}"
    log "copying profile to $win_dest ..."
    powershell.exe -NoProfile -NonInteractive -Command \
        "if (Test-Path '$win_dest') { Remove-Item -Recurse -Force '$win_dest' }; Copy-Item -Recurse '$SOURCE_PROFILE' '$win_dest'" 2>/dev/null \
        || { release_lock "$lock_file"; err "failed to copy Chrome profile"; }

    # Start Chrome via powershell.exe
    log "starting Chrome on port $port ..."
    local args_str="--remote-debugging-port=$port --user-data-dir=$win_dest"
    for flag in "${CHROME_FLAGS[@]}"; do
        if [[ "$flag" == --user-agent=* ]]; then
            local ua_value="${flag#--user-agent=}"
            args_str="$args_str --user-agent=\"$ua_value\""
        else
            args_str="$args_str $flag"
        fi
    done
    powershell.exe -NoProfile -NonInteractive -Command \
        "Start-Process -FilePath '${CHROME_EXE}' -ArgumentList '${args_str}' -WindowStyle Hidden" 2>/dev/null \
        || { release_lock "$lock_file"; err "failed to start Chrome"; }

    # Get Chrome PID
    log "waiting for Chrome process ..."
    local chrome_pid=""
    for i in $(seq 1 10); do
        chrome_pid=$(win_get_chrome_pid "$port")
        [ -n "$chrome_pid" ] && break
        sleep 1
    done
    [ -z "$chrome_pid" ] && { release_lock "$lock_file"; err "could not find Chrome process for port $port"; }

    # Wait for CDP
    log "waiting for CDP on port $port ..."
    local ws_url
    ws_url=$(wait_for_cdp "$port") \
        || { release_lock "$lock_file"; err "CDP did not become ready within ${CDP_WAIT_TIMEOUT}s"; }

    # Update lock file
    cat > "$lock_file" <<EOF
PORT=$port
CHROME_PID=$chrome_pid
WS_URL=$ws_url
EOF

    log "instance ready: agent_pid=$agent_pid port=$port chrome_pid=$chrome_pid"
    echo "{\"port\":$port,\"ws_url\":\"$ws_url\"}"
}

cmd_release() {
    local agent_pid="$1"
    [ -z "$agent_pid" ] && err "agent pid is required"
    [[ "$agent_pid" =~ ^[0-9]+$ ]] || err "agent pid must be a number, got: $agent_pid"
    ensure_dirs

    local lock_file="$LOCK_DIR/${agent_pid}.lock"
    if [ ! -f "$lock_file" ]; then
        log "no instance found for agent pid $agent_pid"
        echo "{\"released\":false}"
        return 0
    fi

    local port
    port=$(lock_get "$lock_file" PORT)
    release_lock "$lock_file"
    log "released instance for agent pid $agent_pid on port $port"
    echo "{\"released\":true,\"port\":$port}"
}

cmd_status() {
    ensure_dirs
    local first=1
    echo -n "["
    for lock_file in "$LOCK_DIR"/*.lock; do
        [ -f "$lock_file" ] || continue
        local agent_pid port chrome_pid status
        agent_pid=$(basename "$lock_file" .lock)
        port=$(lock_get "$lock_file" PORT)
        chrome_pid=$(lock_get "$lock_file" CHROME_PID)

        if [ -z "$chrome_pid" ]; then
            status="starting"
        elif wsl_process_alive "$agent_pid"; then
            status="running"
        else
            status="orphaned"
        fi

        [ $first -eq 1 ] && first=0 || echo -n ","
        echo -n "{\"agent_pid\":$agent_pid,\"port\":$port,\"chrome_pid\":$chrome_pid,\"status\":\"$status\"}"
    done
    echo "]"
}

cmd_cleanup() {
    ensure_dirs
    local cleaned=0
    for lock_file in "$LOCK_DIR"/*.lock; do
        [ -f "$lock_file" ] || continue
        local agent_pid
        agent_pid=$(basename "$lock_file" .lock)

        if ! wsl_process_alive "$agent_pid"; then
            log "cleaning orphaned instance for agent pid $agent_pid"
            release_lock "$lock_file"
            cleaned=$((cleaned + 1))
        fi
    done
    echo "{\"cleaned\":$cleaned}"
}

# --- Help ---

cmd_help() {
    cat <<'EOF'
chrome-manager - Manage headless Chrome instances on Windows for WSL agents

Usage:
  chrome-manager.sh [flags] <command> [args]

Commands:
  acquire <pid>         Allocate a Chrome instance for the given agent process.
                        Copies the source profile, starts Chrome in headless mode,
                        and waits for CDP to become ready. If the process already
                        has a running instance, returns the existing connection info.

  release <pid>         Release the Chrome instance owned by the given agent process.
                        Kills the Chrome process, removes the temporary profile
                        directory, and frees the port for reuse.

  status                Show all managed Chrome instances as a JSON array.

  cleanup               Find and release orphaned instances whose agent process
                        is no longer alive.

  help, --help, -h      Show this help message.

Flags:
  -v, --verbose         Print log messages to stderr.

All commands output single-line JSON to stdout.
EOF
}

# --- Main ---

# Parse global flags
while [[ "${1:-}" == -* ]]; do
    case "$1" in
        -v|--verbose) VERBOSE=1; shift ;;
        -h|--help) cmd_help; exit 0 ;;
        *) err "unknown flag: $1" ;;
    esac
done

case "${1:-}" in
    acquire)
        cmd_acquire "${2:-}"
        ;;
    release)
        cmd_release "${2:-}"
        ;;
    status)
        cmd_status
        ;;
    cleanup)
        cmd_cleanup
        ;;
    help)
        cmd_help
        ;;
    *)
        cmd_help
        exit 1
        ;;
esac

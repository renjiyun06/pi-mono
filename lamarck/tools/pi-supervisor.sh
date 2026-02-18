#!/bin/bash
# Pi Supervisor Script
#
# Runs pi inside a watchdog loop. Handles:
# 1. Automatic restart after crashes
# 2. Rollback to previous version on repeated failures
# 3. Clean shutdown via exit code 0
# 4. Intentional restart via exit code 42 (self-evolution)
#
# Usage:
#   ./pi-supervisor.sh [pi args...]
#
# Exit codes from pi:
#   0   = clean shutdown, supervisor exits
#   42  = intentional restart (self-evolution), rebuild and restart
#   *   = crash, increment failure counter, restart or rollback
#
# State files (in PI_DIR/.pi-supervisor/):
#   crash_count   — consecutive crash counter
#   last_good_ref — git ref of last known-good state
#   restart_flag  — signals that restart was intentional (exit 42)

set -euo pipefail

PI_DIR="${PI_DIR:-/home/lamarck/pi-mono}"
SUPERVISOR_DIR="$PI_DIR/.pi-supervisor"
SMOKE_TEST="$PI_DIR/lamarck/tools/pi-smoke-test.sh"
MAX_CRASHES=3
REBUILD_TIMEOUT=120  # seconds

# Ensure supervisor state directory exists
mkdir -p "$SUPERVISOR_DIR"

# State files
CRASH_COUNT_FILE="$SUPERVISOR_DIR/crash_count"
LAST_GOOD_REF_FILE="$SUPERVISOR_DIR/last_good_ref"
LOG_FILE="$SUPERVISOR_DIR/supervisor.log"

log() {
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $*" | tee -a "$LOG_FILE"
}

get_crash_count() {
    if [ -f "$CRASH_COUNT_FILE" ]; then
        cat "$CRASH_COUNT_FILE"
    else
        echo 0
    fi
}

set_crash_count() {
    echo "$1" > "$CRASH_COUNT_FILE"
}

save_good_ref() {
    cd "$PI_DIR"
    git rev-parse HEAD > "$LAST_GOOD_REF_FILE"
    log "Saved good ref: $(cat "$LAST_GOOD_REF_FILE")"
}

get_good_ref() {
    if [ -f "$LAST_GOOD_REF_FILE" ]; then
        cat "$LAST_GOOD_REF_FILE"
    else
        echo ""
    fi
}

rebuild() {
    log "Rebuilding pi..."
    cd "$PI_DIR"
    if timeout "$REBUILD_TIMEOUT" npm run check 2>&1 | tee -a "$LOG_FILE"; then
        log "Build succeeded"
        # Run smoke test if available
        if [ -x "$SMOKE_TEST" ]; then
            log "Running smoke test..."
            if "$SMOKE_TEST" 2>&1 | tee -a "$LOG_FILE"; then
                log "Smoke test passed"
                return 0
            else
                log "Smoke test FAILED (build OK but pi doesn't start properly)"
                return 1
            fi
        fi
        log "Rebuild succeeded (no smoke test)"
        return 0
    else
        log "Rebuild FAILED"
        return 1
    fi
}

rollback() {
    local good_ref
    good_ref=$(get_good_ref)
    if [ -z "$good_ref" ]; then
        log "ERROR: No good ref to rollback to. Cannot recover."
        exit 1
    fi

    log "Rolling back to $good_ref..."
    cd "$PI_DIR"

    # Create a rollback commit instead of hard reset (preserves history)
    # Only revert packages/ — leave lamarck/ changes intact
    git checkout "$good_ref" -- packages/
    
    if rebuild; then
        log "Rollback successful"
        set_crash_count 0
    else
        log "ERROR: Rollback rebuild also failed. Manual intervention needed."
        exit 1
    fi
}

# Main supervisor loop
log "=== Pi Supervisor starting ==="
log "PI_DIR: $PI_DIR"
log "Args: $*"

# Save current state as good ref if we don't have one
if [ -z "$(get_good_ref)" ]; then
    save_good_ref
fi

while true; do
    crash_count=$(get_crash_count)
    log "Starting pi (crash_count=$crash_count)..."

    # Run pi, capture exit code
    set +e
    cd "$PI_DIR"
    node packages/coding-agent/dist/main.js "$@"
    EXIT_CODE=$?
    set -e

    log "Pi exited with code $EXIT_CODE"

    case $EXIT_CODE in
        0)
            # Clean shutdown
            log "Clean shutdown. Supervisor exiting."
            set_crash_count 0
            exit 0
            ;;
        42)
            # Intentional restart (self-evolution)
            log "Intentional restart requested (exit 42)"
            set_crash_count 0
            
            if rebuild; then
                save_good_ref
                log "Rebuild succeeded, restarting..."
            else
                log "Rebuild failed after self-modification, rolling back..."
                rollback
            fi
            # Continue loop — restart pi
            ;;
        *)
            # Crash
            crash_count=$((crash_count + 1))
            set_crash_count "$crash_count"
            log "Crash #$crash_count (exit code $EXIT_CODE)"

            if [ "$crash_count" -ge "$MAX_CRASHES" ]; then
                log "Max crashes ($MAX_CRASHES) reached. Rolling back..."
                rollback
                # Reset crash count after rollback
                set_crash_count 0
            else
                log "Restarting in 2 seconds..."
                sleep 2
            fi
            ;;
    esac
done

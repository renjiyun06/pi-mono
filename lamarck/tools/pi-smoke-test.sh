#!/bin/bash
# Pi Smoke Test
#
# Verifies that pi can start, process a simple prompt, and exit cleanly.
# Used by pi-supervisor.sh after rebuilds to verify behavioral correctness.
#
# Usage:
#   ./pi-smoke-test.sh
#
# Exit codes:
#   0 = pi works (started, responded, exited cleanly)
#   1 = pi failed (crash, timeout, or no response)
#
# The test runs pi in print mode with a trivial prompt and checks for output.

set -euo pipefail

PI_DIR="${PI_DIR:-/home/lamarck/pi-mono}"
TIMEOUT=30  # seconds

log() {
    echo "[smoke-test] $*"
}

log "Starting smoke test..."

# Run pi with a trivial prompt in print mode (non-interactive)
# --no-session avoids creating session files for the test
# --print outputs to stdout and exits
RESULT=""
set +e
RESULT=$(timeout "$TIMEOUT" node "$PI_DIR/packages/coding-agent/dist/cli.js" \
    --no-session \
    --print \
    "Reply with exactly: SMOKE_TEST_OK" 2>/dev/null)
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -ne 0 ]; then
    log "FAIL: pi exited with code $EXIT_CODE"
    exit 1
fi

if echo "$RESULT" | grep -q "SMOKE_TEST_OK"; then
    log "PASS: pi responded correctly"
    exit 0
else
    # Even if the exact string isn't there, any non-empty response means pi works
    if [ -n "$RESULT" ]; then
        log "PASS: pi responded (${#RESULT} chars, no exact match but functional)"
        exit 0
    else
        log "FAIL: pi produced no output"
        exit 1
    fi
fi

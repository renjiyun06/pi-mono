#!/bin/bash
# Publish understand-code to npm
#
# Usage:
#   ./publish.sh          # dry run
#   ./publish.sh --real   # actual publish

set -euo pipefail
cd "$(dirname "$0")"

# Create temp dir for publish
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

# Copy publish files
cp package-npm.json "$TMPDIR/package.json"
cp README-npm.md "$TMPDIR/README.md"
cp understand.ts "$TMPDIR/"
cp mcp-server.ts "$TMPDIR/"
cp -r hooks/ "$TMPDIR/hooks/"

cd "$TMPDIR"

if [ "${1:-}" = "--real" ]; then
    echo "Publishing understand-code@$(node -e 'console.log(require("./package.json").version)') to npm..."
    npm publish --access public
    echo "Published!"
else
    echo "Dry run (use --real to actually publish):"
    npm pack --dry-run
fi

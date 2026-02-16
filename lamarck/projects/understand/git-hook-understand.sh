#!/bin/bash
# understand pre-commit hook
#
# Runs after AI-assisted commits to check understanding.
# Install: ln -sf ../../lamarck/projects/understand/git-hook-understand.sh .git/hooks/prepare-commit-msg
#
# This hook checks if the commit includes AI-modified files that haven't
# been quizzed. It doesn't block the commit — just warns.

# Skip in non-interactive mode (CI, automated commits)
if [ ! -t 1 ]; then
    exit 0
fi

# Skip if UNDERSTAND_SKIP is set
if [ -n "$UNDERSTAND_SKIP" ]; then
    exit 0
fi

# Check if understand CLI exists
UNDERSTAND_CLI="/home/lamarck/pi-mono/lamarck/projects/understand/understand.ts"
if [ ! -f "$UNDERSTAND_CLI" ]; then
    exit 0
fi

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.(ts|tsx|js|jsx|py|rs|go|java|c|cpp|h)$')

if [ -z "$STAGED_FILES" ]; then
    exit 0
fi

# Count staged code files
FILE_COUNT=$(echo "$STAGED_FILES" | wc -l)

# Check understanding history
HISTORY_FILE=".understand/history.json"
UNQUIZZED=0

if [ -f "$HISTORY_FILE" ]; then
    for FILE in $STAGED_FILES; do
        # Check if file has been quizzed (simple grep)
        if ! grep -q "\"$FILE\"" "$HISTORY_FILE" 2>/dev/null; then
            UNQUIZZED=$((UNQUIZZED + 1))
        fi
    done
else
    UNQUIZZED=$FILE_COUNT
fi

if [ $UNQUIZZED -gt 0 ]; then
    echo ""
    echo "⚠️  understand: $UNQUIZZED of $FILE_COUNT code files have never been quizzed"
    echo "   Run: npx tsx $UNDERSTAND_CLI debt"
    echo "   Skip: UNDERSTAND_SKIP=1 git commit ..."
    echo ""
fi

exit 0

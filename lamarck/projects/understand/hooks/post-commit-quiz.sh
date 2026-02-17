#!/bin/bash
# understand post-commit hook
# Generates comprehension questions for the latest commit's changes.
# Install: cp hooks/post-commit-quiz.sh .git/hooks/post-commit && chmod +x .git/hooks/post-commit
# Or: ln -s ../../hooks/post-commit-quiz.sh .git/hooks/post-commit
#
# Set UNDERSTAND_AUTO_QUIZ=1 to enable (disabled by default to avoid annoyance)
# Set UNDERSTAND_MIN_LINES=50 to only trigger on commits with 50+ changed lines (default: 20)

if [ "${UNDERSTAND_AUTO_QUIZ}" != "1" ]; then
    exit 0
fi

MIN_LINES="${UNDERSTAND_MIN_LINES:-20}"

# Count changed lines in last commit (code files only)
CHANGED_LINES=$(git diff --numstat HEAD~1 HEAD 2>/dev/null | \
    grep -vE '\.(md|json|txt|jpg|png|mp4|mp3|csv|lock)$' | \
    grep -v 'node_modules/' | \
    awk '{sum += $1 + $2} END {print sum+0}')

if [ "$CHANGED_LINES" -lt "$MIN_LINES" ]; then
    exit 0
fi

echo ""
echo "━━━ understand: ${CHANGED_LINES} lines changed ━━━"
echo ""

# Check if understand CLI is available
if command -v understand &> /dev/null; then
    understand --git-diff --dry-run
elif [ -f "$(git rev-parse --show-toplevel)/node_modules/.bin/understand" ]; then
    "$(git rev-parse --show-toplevel)/node_modules/.bin/understand" --git-diff --dry-run
else
    echo "understand not installed. Run: npm install -g understand-code"
    echo "Or review changes manually: git diff HEAD~1"
fi

echo ""
echo "Run 'understand --git-diff' to take the quiz."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

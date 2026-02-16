# Exploration 090: Pi Upstream — Slash Command Argument Completion Chaining

## Issue
GitHub issue #1437: When Tab-completing a slash command name (e.g., `/mod` → `/model`), argument completions don't appear automatically. User must type another character or Tab.

## Root Cause
Two problems in `packages/tui/src/components/editor.ts`:

### 1. No chaining after Tab completion (line ~516)
When Tab applies a slash command completion, it calls `cancelAutocomplete()` and returns — no follow-up `tryTriggerAutocomplete()` to chain into argument completions.

### 2. Tab with space goes to file completion (line ~1905)
`handleTabCompletion()` only calls `handleSlashCommandCompletion()` when there's no space. When there IS a space (e.g., `/model `), it falls through to `forceFileAutocomplete()` — wrong target.

## Fix
Two changes:

1. **Tab handler (line ~516)**: After applying completion for a slash command prefix, call `tryTriggerAutocomplete()`. Since `applyCompletion` already appends a space, `getSuggestions` enters the argument-completion branch.

2. **handleTabCompletion (line ~1905)**: When in slash command context with space, call `tryTriggerAutocomplete(true)` instead of `forceFileAutocomplete(true)`.

## Verification
- `npm run check` passes (clean)
- Logic trace: `/mod` Tab → `/model ` + argument list shown immediately
- Commands without `getArgumentCompletions` return null → silently no-op
- Enter (selectConfirm) path unaffected — still falls through to submit

# Autonomous Extension

## Background

In normal interactive mode, an agent works reactively: the user sends a message, the agent responds, then waits for the next message. Autonomous mode changes this — the agent works continuously without user input, driving itself forward through its own goals and pending work.

The core challenge is that LLM context windows are finite. An agent working autonomously will eventually fill its context window, and as context grows large, the agent's work quality degrades. Much like a person working for hours without a break, performance suffers.

The solution is analogous to how a person works: work for a while, organize your progress, take a break, then resume with a clear head. This extension implements that cycle:

1. Detecting when context usage approaches the limit (recognizing it's time for a break)
2. Giving the agent a chance to organize and persist its work progress — through any means: writing files, committing code, updating logs, etc.
3. Triggering compaction to clear out completed work steps whose process details are no longer needed, keeping only what's relevant for continuation
4. Sending a continuation message so the agent can pick up where it left off with a clean context

The agent is expected to manage its own progress persistence. The extension never prescribes specific strategies — each agent follows its own approach (e.g. as defined in its `self.md` or elsewhere).

## Important Limitation

This extension provides the **mechanism** for continuous autonomous work — the cycle of working, organizing, compacting, and resuming. However, the mechanism alone does not guarantee that an agent can sustain long-running, complex work indefinitely.

The ideal cycle is:

```
Enter autonomous mode → agent works → threshold reached → organize progress → compact → agent resumes → ...
```

For this cycle to actually work well, the agent needs to know **how** to organize its progress effectively: what to save, where to save it, how to structure it so that future context can be reconstructed from it. This is agent-specific knowledge that the user must provide — for example, through the agent's `self.md`, system prompts, or other configuration. Without this guidance, the agent may fail to save meaningful progress, produce summaries that don't support resumption, or lose track of its goals across compaction boundaries.

In short: this extension handles the **when** and **what** of the autonomous cycle, but the **how** of effective progress management is the responsibility of whoever configures the agent.

## Phase Overview

The extension tracks a `phase` variable that represents the current stage of the autonomous cycle. Understanding this is important because several user-facing operations depend on it.

- `"running"` — Normal operation. The agent is working, threshold detection is active, and the user can toggle autonomous mode off.
- `"aborting"` — Context threshold was reached. The agent is being interrupted.
- `"saving"` — The agent is organizing and persisting its work progress.
- `"compacting"` — Compaction is in progress. No agent loop is running.

The normal flow is: `running → aborting → saving → compacting → running`. Full details are in the [State Variables](#phase-running--aborting--saving--compacting) section.

## User Interface

### Command: `/autonomous`

Toggle command — no arguments. If autonomous mode is off, it turns on; if on, it turns off. Current status is always visible in the footer status bar.

### Enable Conditions

Toggling on is rejected unless all conditions are met:

1. **Agent is idle** — "Cannot enable autonomous mode while the agent is working. Wait for it to finish."
2. **Context usage < 60%** — "Cannot enable autonomous mode: context usage is X%, must be below 60%. Compact first."

These constraints eliminate edge cases where the agent would immediately hit thresholds or receive conflicting messages.

### Disable Conditions

Toggling off requires `enabled === true` (implied by the toggle structure) and `phase === "running"`. It is rejected during non-running phases:

- `phase === "aborting"` — "Cannot disable autonomous mode right now. Agent is being interrupted for compaction. Wait for it to finish."
- `phase === "saving"` — "Cannot disable autonomous mode right now. Agent is saving progress before compaction. Wait for it to finish."
- `phase === "compacting"` — "Cannot disable autonomous mode right now. Compaction is in progress. Wait for it to finish."

When `phase === "running"`, the extension sets `enabled = false`, calls `ctx.abort()` to immediately stop the agent, and updates the status bar.

### Input Blocking

While autonomous mode is enabled, user text input is blocked. Slash commands (e.g. `/autonomous` to toggle off) are still allowed. Blocked input shows: "User input is disabled while autonomous mode is active. Use /autonomous to disable."

### Tool: `autonomous-stop`

The agent can call this tool to voluntarily exit autonomous mode when it has nothing left to do. Rejection cases:

- `!enabled` — "Autonomous mode is not enabled. Nothing to stop."
- `phase !== "running"` — "Cannot stop autonomous mode right now. You are saving progress before compaction. Finish saving first."

The rejection message always refers to saving progress because `"saving"` is the only non-running phase where the agent can actually execute a tool call. During `"aborting"` the agent is being interrupted and cannot make new tool calls; during `"compacting"` no agent loop is running at all.

On success: "Autonomous mode disabled."

## State Variables

### `enabled` (`boolean`)

Master switch for autonomous mode. All event handlers check this first.

| Trigger | Value | Condition |
|---|---|---|
| Initial | `false` | — |
| `/autonomous` (toggle on) | `true` | Agent idle, context < 60%, currently disabled |
| `/autonomous` (toggle off) | `false` | `enabled` and `phase === "running"` |
| `autonomous-stop` tool | `false` | `enabled` and `phase === "running"` |
| `session_start` | `false` | Unconditional |
| `session_switch` | `false` | Unconditional |

### `phase` (`"running"` | `"aborting"` | `"saving"` | `"compacting"`)

Tracks the current stage of the autonomous cycle, primarily governing the compaction flow.

**Meanings:**

- `"running"` — Agent is working normally. Threshold detection is active. User can enable/disable autonomous mode. Agent can call `autonomous-stop`.
- `"aborting"` — Context threshold was reached. `ctx.abort()` has been called to interrupt the agent. An organize message followUp is queued. Waiting for the interrupted loop to end.
- `"saving"` — The interrupted loop has ended. The organize message followUp has started a new agent loop. The agent is organizing and persisting its work progress. No threshold detection. User and agent cannot disable autonomous mode.
- `"compacting"` — The agent finished organizing. `ctx.compact()` has been called to clean up the context. No agent loop is running.

**Normal flow:**

```
running → aborting → saving → compacting → running
```

**Transitions:**

| Trigger | From | To | Condition |
|---|---|---|---|
| `turn_end` | `"running"` | `"aborting"` | `enabled` and context >= 70%. Calls `abort()`, sends organize message as followUp |
| `agent_end` | `"aborting"` | `"saving"` | `enabled`, stopReason is not `"error"` and is `"aborted"` (our abort). Organize message followUp starts new loop |
| `agent_end` | `"saving"` | `"compacting"` | `enabled`, stopReason is not `"error"` or `"aborted"`. Agent finished organizing. Calls `ctx.compact()` |
| `session_compact` | `"compacting"` | `"running"` | `enabled`. Compaction done. Sends continuation message |
| `/autonomous` (toggle on) | any | `"running"` | Enable checks passed |
| `session_start` | any | `"running"` | Unconditional |
| `session_switch` | any | `"running"` | Unconditional |

**Phase constraints:**

| Operation | `running` | `aborting` | `saving` | `compacting` |
|---|---|---|---|---|
| Threshold detection (`turn_end`) | Yes | No | No | No |
| Nudge on `agent_end` | Yes | No | No | N/A (no loop) |
| `/autonomous` (toggle off) | Allowed | Rejected | Rejected | Rejected |
| `autonomous-stop` tool | Allowed | N/A (aborting) | Rejected | N/A (no loop) |

### Error Handling in `agent_end`

Before advancing the state machine, the handler checks the last assistant message's `stopReason`:

- **`"error"`**: Do nothing — don't nudge, don't advance phase, don't disable. Pi has its own retry mechanism (exponential backoff for overloaded/rate limit/5xx errors) that runs after the extension handler. If pi retries successfully, a normal `agent_end` will follow and the state machine advances as usual. If pi gives up, the agent stops and the user can see the error and toggle off manually.

- **`"aborted"` with `phase === "aborting"`**: This is our own abort (from threshold detection). Proceed normally to `"saving"`.

- **`"aborted"` with `phase !== "aborting"`**: External abort (e.g. user ctrl+c). Disable autonomous mode: set `enabled = false`, reset `phase = "running"`, update status bar.

- **`"stop"` / `"length"`**: Normal completion. Advance state machine as usual (nudge, or trigger compact, depending on phase).

This design avoids conflicting with pi's internal retry mechanism. The extension handler executes before pi's retry check, so it must not assume the error is final.

### `needsIdentity` (`"new_session"` | `"compacted"` | `null`)

Controls whether agent messages include identity file reading instructions.

**Meanings:**

- `"new_session"` — Fresh session; agent has no context about its identity
- `"compacted"` — Context was just compacted; identity information may be lost
- `null` — Agent has already started working; identity hints are unnecessary

**Transitions:**

| Trigger | Value | Condition |
|---|---|---|
| Initial | `"new_session"` | — |
| `session_start` | `"new_session"` | Unconditional |
| `session_switch` | `"new_session"` | Unconditional |
| `session_compact` | `"compacted"` | Unconditional (independent of `enabled`) |
| `agent_start` | `null` | Unconditional (agent started, message was delivered) |

**Usage:** Only `buildStartMessage` consults this variable via `buildIdentityHint()`. `buildContinuationMessage` always includes identity file paths. `buildNudgeMessage` never includes identity hints.

## Messages Sent to Agent

All messages are sent as `followUp` with `triggerTurn: true`, which starts a new agent loop. The `{extensionPath}` below resolves to `.pi/extensions/autonomous.ts`. The `{communityPath}` and `{selfPath}` resolve to the actual absolute paths based on cwd and tmux session name.

### 1. Start Message (`autonomous-start`)

**Trigger:** `/autonomous` toggle on (after all checks pass)

**Variants:**

When `needsIdentity === "new_session"`:
```
[Injected by autonomous extension ({extensionPath}).] You are now in autonomous mode. Take initiative — review your goals, explore, or continue any pending work. This is a new session and you have no prior context about your identity or community. Before doing anything else, read your community file and identity file: {communityPath} and {selfPath}
```

When `needsIdentity === "compacted"`:
```
[Injected by autonomous extension ({extensionPath}).] You are now in autonomous mode. Take initiative — review your goals, explore, or continue any pending work. Context was compacted and your identity/community information may have been lost. Read your identity and progress files to recover context: {communityPath} and {selfPath}
```

When `needsIdentity === null`:
```
[Injected by autonomous extension ({extensionPath}).] You are now in autonomous mode. Take initiative — review your goals, explore, or continue any pending work.
```

### 2. Nudge Message (`autonomous-nudge`)

**Trigger:** `agent_end` when `enabled` and `phase === "running"`

The agent stopped on its own (e.g. finished a task, or wasn't sure what to do next). This message drives it to continue.

```
[Injected by autonomous extension ({extensionPath}).] You are still in autonomous mode. Take initiative — review your goals, explore, or continue any pending work.
```

### 3. Organize Message (`autonomous-organize`)

**Trigger:** `turn_end` when `enabled`, `phase === "running"`, and `getContextUsage().percent >= 70`

Sent as a followUp after calling `ctx.abort()`. The agent will receive this in a new loop and should organize and persist its work progress.

```
[Injected by autonomous extension ({extensionPath}).] You have been working for a while and your context is getting large. It is time to organize your work progress. Persist your current state — save enough context that you can fully resume afterward. Once you finish, your context will be cleaned up so you can continue with a clear head.
```

### 4. Continuation Message (`autonomous-continuation`)

**Trigger:** `session_compact` when `enabled`

Sent after compaction completes. The agent's context has been compacted; it should re-read its identity and find its saved progress to pick up where it left off.

```
[Injected by autonomous extension ({extensionPath}).] Your context has been compacted. You are still in autonomous mode. Before the compaction you organized and saved your work progress. Read your identity files to recall who you are, then find and read your saved progress to resume where you left off. Identity files: {communityPath} and {selfPath}
```

## Compaction Behavior

The extension intercepts compaction via `session_before_compact` only when `customInstructions === "autonomous"` (i.e. compaction was triggered by this extension, not by normal pi compaction).

### Autonomous vs Normal Compaction

| Aspect | Normal Compaction | Autonomous Compaction |
|---|---|---|
| Trigger | Pi's built-in threshold | This extension via `ctx.compact()` |
| Messages summarized | Split: older messages summarized, recent kept | All messages summarized, none kept |
| Summary strategy | Detailed LLM summary preserving context | LLM summary tailored for work continuation + file operations |
| `firstKeptEntryId` | Somewhere in the middle | Last entry (nothing kept) |
| `details` | Default | `{ type: "autonomous" }` |
| Continuation strategy | Agent continues with preserved recent context | Agent re-reads identity and work state from its own persisted artifacts |

### Previous Summary Handling

Each autonomous compaction stores `{ type: "autonomous" }` in its `details` field. When generating a new summary, the extension looks for the most recent compaction entry in the session history and checks whether it has this marker, to determine if the previous compaction was also autonomous:

- **Previous was autonomous:** Discard previous summary (it was a continuation-oriented summary, not useful as cumulative context)
- **Previous was normal:** Carry forward previous summary as additional context for the new summary

### Summary Generation

The extension generates the summary by calling the LLM directly, following the same pattern as pi's built-in compaction but with a different prompt:

1. **Collect messages** — All messages from `messagesToSummarize` + `turnPrefixMessages` + `keptMessages`
2. **Serialize** — `convertToLlm()` converts AgentMessages to LLM format, then `serializeConversation()` converts to plain text (preventing the LLM from treating it as a conversation to continue)
3. **Build prompt** — Conversation wrapped in `<conversation>` tags, optional previous summary in `<previous-summary>` tags, followed by the autonomous summarization prompt
4. **Call LLM** — Uses `completeSimple()` with the current model (`ctx.model`) and API key (`ctx.modelRegistry.getApiKey()`)
5. **Append file operations** — Mechanically extracted from tool calls in the messages (read/write/edit), appended as `<read-files>` and `<modified-files>` XML tags. This is not LLM-generated — it is accurate structured data that helps the agent know which files were involved.

### Error Handling in Compaction

The entire `session_before_compact` handler is wrapped in a try-catch. Any failure — model/apiKey unavailable, LLM error, network exception, user abort (Escape key) — causes the extension to:

1. Disable autonomous mode (`enabled = false`, `phase = "running"`, update status bar)
2. Cancel the compaction by returning `{ cancel: true }`

Falling back to pi's default compaction is not acceptable because it uses a different prompt and keeps recent messages, which is incompatible with the autonomous flow (the continuation message would tell the agent to read its saved progress, but the context would still contain recent messages from a different compaction strategy).

### Core Code Changes

To support autonomous compaction:

- `keptMessages: AgentMessage[]` was added to the `CompactionPreparation` interface in `packages/coding-agent/src/core/compaction/compaction.ts`. Normal compaction splits messages into `messagesToSummarize` and `turnPrefixMessages`, but the messages after the cut point were not exposed. The new field makes them available so the handler can access all messages.
- `createFileOps`, `extractFileOpsFromMessage`, `computeFileLists`, and `formatFileOperations` were exported from `@mariozechner/pi-coding-agent` for file operation extraction.

### Summarization Prompt

The autonomous summarization prompt (`AUTONOMOUS_SUMMARIZATION_PROMPT`) is fundamentally different from pi's built-in compaction prompt. Pi's prompt produces a comprehensive structured checkpoint (Goal, Progress, Key Decisions, etc.) aimed at preserving full conversational context. The autonomous prompt is designed around two core purposes:

1. **Entry point to saved state** — The agent saved its own progress before compaction (files, commits, logs, etc.). The summary describes what was saved, where, and in what form, so the agent knows exactly where to look when it resumes.
2. **Supplement the saved state** — The agent may not have captured everything when saving. The summary fills in decisions, constraints, unfinished threads, or nuances from the conversation that didn't make it into the persisted artifacts.

The prompt specifically directs the LLM to focus on the conversation's final messages, where the agent persisted its progress. It avoids reproducing step-by-step work history or tool call details, keeping the summary concise — an index and supplement, not a work report.

## Complete Flow

### Normal Autonomous Cycle

```
User: /autonomous (toggle on)
  → enabled = true, phase = "running"
  → Send start message (with identity hint if needed)
  → Agent starts working

Agent works across multiple turns
  → turn_end: check context < 70%, continue
  → Agent finishes a task, agent_end fires
  → phase === "running": send nudge
  → Agent continues working
  → ...

Agent has nothing left to do
  → Agent calls autonomous-stop tool
  → enabled = false
  → agent_end fires, enabled is false, no nudge
  → Autonomous mode ends
```

### Compaction Cycle

```
Agent is working, context reaches 70%
  → turn_end: phase = "aborting", abort(), send organize message as followUp

Agent loop ends (interrupted)
  → agent_end: phase = "saving"
  → Organize message followUp starts new loop

Agent organizes and persists work progress in new loop
  → turn_end: phase !== "running", skip threshold check
  → Agent finishes organizing, agent_end fires
  → phase = "compacting", ctx.compact({ customInstructions: "autonomous" })

Compaction runs
  → session_before_compact: intercept, return summary with firstKeptEntryId = last entry
  → session_compact: phase = "running", needsIdentity = "compacted", send continuation message (`autonomous-continuation`)

Agent starts new loop from continuation message
  → agent_start: needsIdentity = null
  → Agent reads identity files, resumes from saved progress
  → Normal autonomous cycle continues
```

### User Disabling

```
User: /autonomous (toggle off, while phase === "running")
  → enabled = false
  → ctx.abort() interrupts agent
  → agent_end fires, enabled is false, no nudge
  → Autonomous mode ends
```

If `phase !== "running"`, the command is rejected with a phase-specific message. The user must wait for the compaction flow to complete.

### LLM Error During Work

```
Agent is working, LLM returns error (rate limit, server error, etc.)
  → agent_end: stopReason === "error", skip state advancement
  → Pi's retry mechanism runs after extension handler
  → If pi retries successfully: normal agent_end follows, state machine advances
  → If pi gives up: agent stops, user sees error, toggles off manually
```

### External Abort

```
User presses Escape while agent is working
  → agent_end: stopReason === "aborted", phase !== "aborting"
  → enabled = false, phase = "running", update status
  → Autonomous mode ends
```

### Compaction Failure

```
Compaction LLM call fails (network error, abort, model unavailable, etc.)
  → session_before_compact: catch block fires
  → enabled = false, phase = "running", update status
  → Return { cancel: true } to cancel compaction
  → Autonomous mode ends
```

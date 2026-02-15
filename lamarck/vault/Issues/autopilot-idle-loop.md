---
tags:
  - issue
  - pi
status: resolved
priority: high
description: "Autopilot sends infinite '继续' when agent has nothing to do, wasting tokens"
---

# Autopilot Idle Loop

**Discovered**: 2026-02-15

**Problem**: When the agent completes all work and has nothing more to do, autopilot still sends "继续" after every `agent_end`. The agent responds with empty or near-empty text, which triggers another "继续", creating an infinite loop that wastes tokens and context.

**Observed behavior**: After completing 42+ commits of Douyin content work, the agent had nothing left to do. Autopilot sent "继续" ~50 times, each consuming tokens for the message + agent response, until context was exhausted and compacted.

**Root cause**: `main-session/index.ts` `agent_end` handler unconditionally sends `buildAutopilotMessage()` when autopilot is enabled. No detection of idle/empty responses.

**Impact**:
- Wasted ~2000+ tokens per idle cycle (system prompt + "继续" + empty response)
- Over 50 cycles = 100K+ wasted tokens
- Forces unnecessary compactions
- Makes autopilot impractical for long-running sessions that periodically run out of work

**Proposed fix**: Add idle detection with backoff.

```typescript
// Track consecutive short responses
let idleCount = 0;
const IDLE_THRESHOLD = 3;      // After 3 short responses, pause
const SHORT_RESPONSE = 20;     // Characters threshold for "short"

pi.on("agent_end", async (event, ctx) => {
  if (!autopilotEnabled) return;
  
  // Check if last response was substantive
  const lastMsg = event.messages[event.messages.length - 1];
  const textLen = lastMsg?.content
    ?.filter(c => c.type === "text")
    ?.reduce((sum, c) => sum + c.text.length, 0) ?? 0;
  
  if (textLen < SHORT_RESPONSE) {
    idleCount++;
    if (idleCount >= IDLE_THRESHOLD) {
      ctx.ui.notify("Autopilot: agent idle, pausing. Send any message to resume.", "info");
      return; // Don't send "继续"
    }
  } else {
    idleCount = 0; // Reset on substantive response
  }
  
  // ... existing continuation logic
});
```

**Alternative**: Exponential backoff — instead of pausing completely, increase delay between continuations (1s → 5s → 30s → 5min).

**Resolution** (2026-02-15): Implemented idle detection in `main-session/index.ts`. Tracks consecutive short responses (< 50 chars, no tool calls). After 3 consecutive idle responses, autopilot pauses with a notification. Counter resets on substantive responses or when autopilot is toggled. Commit: `fa885e21`.

**Notes**: 
- The agent itself tried to be responsible by outputting empty responses, but the extension layer doesn't detect this
- Ren's feedback: "你总是可以探索更多的事情" — the real fix is both technical (backoff) AND behavioral (agent should explore new territory instead of declaring idle)

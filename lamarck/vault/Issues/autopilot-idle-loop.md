---
tags:
  - issue
  - pi
status: resolved
description: "Autopilot sends infinite '继续' when agent has nothing to do, wasting tokens"
---

# Autopilot Idle Loop

**Discovered**: 2026-02-15

**Problem**: When the agent believes all work is complete, autopilot still sends continuation messages. The agent responds with empty or near-empty text, creating an infinite loop that wastes tokens and context.

**First attempt** (2026-02-15): Idle detection code — track consecutive short responses, pause autopilot after 3. Did not work well: responses like "I have nothing to do" exceeded the character threshold, and the approach contradicts the principle that the agent should never idle.

**Final resolution** (2026-02-16): Removed idle detection entirely. Instead:
1. Autopilot continuation message now includes anti-idle reminder: "If you believe all work is done, re-read autopilot.md in the vault. You must not idle."
2. `autopilot.md` clearly states the agent must never idle — there's always something to explore, improve, research, or build.

The root cause is behavioral, not technical: the agent needs to internalize that "done" doesn't exist in autopilot mode.

---
tags:
  - issue
status: open
description: "Multi-agent feedback mechanism too heavy, needs a lighter approach"
---

# Multi-Agent Feedback Mechanism Too Heavy

**Background**: In the douyin-growth experiment, we need a feedback mechanism for agents.

**Current approach**:
- Create review tasks via [[task-system|task system]]
- Review task runs, writes feedback to the reviewed task's `feedback/` directory
- Reviewed task reads feedback on its next wake-up

**Limitations**:
1. **Static** — tasks require pre-written .md files, cannot be dynamically created
2. **Heavy** — each feedback perspective needs a full task document
3. **Inflexible** — can't "spin up a quick agent to check one aspect"
4. **Async** — communicates via filesystem, not real-time
5. **One-directional** — A → feedback → B, not natural multi-agent discussion

**References**:
- Artificial Societies (YC W25): 500K+ AI personas database
- [[claude-opus-agent-teams|Claude Code Agent Teams]]: team lead + teammates
- Berkeley research: three failure types in multi-agent systems (design 37%, coordination 31%, verification 31%)

**Possible improvements**:
1. Built-in review tool — `get_feedback(content, perspective)`
2. Lightweight sub-agents — spawn temporarily, destroy after use
3. Multi-perspective self-reflection — agent switches roles to think from different angles
4. Review-as-a-service — MCP service that accepts content + review prompt, returns feedback

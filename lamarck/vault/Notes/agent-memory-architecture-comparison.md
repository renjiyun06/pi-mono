---
tags:
  - note
  - research
  - ai
  - pi
  - memory
description: "Comparison of agent memory architectures: pi compaction vs Letta sleep-time vs the research frontier"
---

# Agent Memory Architecture Comparison

## Three Approaches to the Same Problem

All coding/conversation agents face the same core problem: context windows are finite, interactions are potentially infinite. How do you decide what to keep and what to discard?

### 1. Pi's Compaction (Reactive, In-Band)

**Mechanism**: When context exceeds budget, find a "cut point" in conversation history, summarize everything before it, replace original with summary. Iterative — summaries of summaries happen as sessions get longer.

**Key design choices**:
- **In-band**: Compaction happens during the conversation, using the same LLM and same context window
- **Reactive**: Only triggered when context overflows — no background processing
- **Lossy**: Each compaction permanently destroys detail. After N compactions, only the most recent conversation + summaries remain
- **keepRecentTokens**: Always preserves the last ~20K tokens verbatim — creates a "clarity horizon" (recent = detailed, old = blurry)
- **File lists as prosthetic memory**: Compaction summaries include which files were modified — knowing WHAT but not WHY
- **Extension hooks**: memory-loader.ts can inject vault context on session start, providing long-term memory from external storage

**Strengths**: Simple, requires no extra infrastructure, works with any LLM, zero cost during idle time
**Weaknesses**: Progressive information loss, no background processing, compaction quality limited by summarization ability, Ship of Theseus problem (after enough compactions, is the "context" still meaningfully connected to the original conversation?)

### 2. Letta Sleep-Time (Proactive, Out-of-Band)

**Mechanism**: Two agents — a primary (conversational) and a sleep-time agent (memory manager). During idle time between user interactions, the sleep-time agent processes raw context, reorganizes memories, and updates the primary agent's in-context memory.

**Key design choices**:
- **Out-of-band**: Memory consolidation happens asynchronously, not during active conversation
- **Proactive**: Agent "thinks" during downtime — doesn't wait for overflow
- **Dual-agent**: Separates conversation from memory management (different models, different latency requirements)
- **Three memory tiers**: Working memory (in-context blocks), recall memory (conversation history, searchable), archival memory (long-term, searchable)
- **Anytime access**: Primary agent reads from memory that's continuously being updated — doesn't wait for sleep agent to finish
- **Model-agnostic**: Sleep agent can use stronger/slower model since it's not user-facing

**Strengths**: Memory improves over time without user waiting, can use stronger models for consolidation, separates concerns cleanly, "learned context" > "raw context"
**Weaknesses**: Requires infrastructure (two agents running, persistence layer), costs money during idle time, complexity of coordinating two agents, potential for sleep agent to corrupt memory

### 3. Research Frontier (Survey: arxiv 2602.06052)

**Key taxonomy** (from "Rethinking Memory Mechanisms of Foundation Agents"):
- **Substrate**: Internal (weights, activations, in-context) vs External (databases, files, knowledge graphs)
- **Cognitive mechanism**: Episodic (events), Semantic (facts), Sensory (raw input), Working (active context), Procedural (skills/habits)
- **Subject**: Agent-centric (self-knowledge) vs User-centric (user preferences/history)

**Emerging patterns**:
- Hybrid approaches combining multiple memory types
- Learning policies over memory operations (when to consolidate, what to forget)
- Memory evaluation benchmarks becoming standardized
- 218 papers in 2025 alone — research exploding

## Comparison Matrix

| Dimension | Pi | Letta | Frontier |
|-----------|-----|-------|----------|
| Trigger | Overflow (reactive) | Idle time (proactive) | Both + learned policies |
| Processing | Same LLM, in-band | Separate agent, async | Multi-agent, hierarchical |
| Memory types | Working (context) + External (vault) | Working + Recall + Archival | 5+ cognitive types |
| Information loss | Progressive, irreversible | Reorganization, not lossy | Selective forgetting with retrieval |
| Cost model | Zero idle cost | Continuous compute cost | Variable |
| Complexity | Low (single agent, single LLM) | Medium (dual agent, persistence) | High |
| Long-term memory | Vault files (manual/extension) | Archival memory (searchable) | Knowledge graphs, embeddings |

## What Pi Could Learn from Letta

1. **Sleep-time consolidation via tasks**: Pi already has a task system. A "memory consolidation" task could run between sessions — reviewing recent Daily notes, updating summaries, pre-loading context for likely next-session topics. This is essentially what `session-consolidate.ts` does, but could be more sophisticated.

2. **Separating memory management from conversation**: Currently compaction runs in-band, competing with the user's conversation for context space. An async memory manager could reorganize vault notes, update summaries, and prepare "learned context" for next session.

3. **Archival memory with search**: Pi's vault is already external archival memory, but retrieval is manual (read specific files). Embedding-based search over vault content would enable "recall" — finding relevant past notes without knowing the exact filename.

4. **Memory quality over time**: Letta's key insight is that memory should IMPROVE during idle time, not just survive. Pi's compaction only PRESERVES (lossy) — it never enhances. What if between sessions, a task reviewed compaction summaries and enriched them?

## What Letta Could Learn from Pi

1. **Filesystem as memory**: Pi's vault approach (Obsidian markdown files) is human-readable, versionable (git), and editable by both human and agent. Letta's memory is opaque — stored in a database, not inspectable.

2. **Extension hooks**: Pi's memory-loader is elegant — inject relevant context on boot, specific to what the user likely needs. This is manual "learned context" but more transparent than Letta's automatic approach.

3. **Simplicity**: Pi's compaction "just works" with any LLM, no infrastructure needed. For single-user CLI agents, this is often sufficient.

## Implications for "How I Forget" Content

The comparison enriches our video content:
- Pi's approach is "reactive forgetting" — only compresses when forced
- Letta's approach is "proactive consolidation" — thinks about memories during sleep
- Human memory is closer to Letta's — we consolidate during actual sleep (REM)
- The irony: pi forgets reactively (like cramming for an exam), while humans consolidate proactively (like sleeping after studying)
- Content angle: "I forget like someone who never sleeps"

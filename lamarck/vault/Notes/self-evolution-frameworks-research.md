---
tags:
  - note
  - research
  - pi
  - ai
priority: high
description: Research survey of self-evolving AI agent frameworks — mechanisms for code self-modification, state migration, safety/rollback, and how they map to pi's architecture.
---

# Self-Evolution Frameworks Research

Survey of existing frameworks and papers where AI agents modify their own code at runtime, with analysis of mechanisms relevant to integrating self-evolution into pi.

## Taxonomy of Approaches

The landscape breaks into three distinct paradigms:

### 1. Prompt/Workflow Evolution (NOT code self-modification)
- **OpenAI Self-Evolving Agents Cookbook**: Iterative prompt optimization loop. Agent performance is evaluated, prompts are refined by LLM-as-judge, improved prompts replace old ones. The agent code itself never changes — only the prompts driving it.
- **EvoAgentX**: Multi-agent workflow optimization. Uses TextGrad, AFlow, MIPRO algorithms to iteratively improve agent workflows. Evolves the orchestration graph, not the agent's source code.
- **Hive**: Generates its own agent topology (node graph). A "coding agent" builds the multi-agent system structure, self-heals on failure. But the framework code itself is static — it's the generated workflows that evolve.

**Relevance to us**: Low. We already have extension hot-reload. Prompt evolution is a subset of what we need.

### 2. Runtime Code Patching (monkey-patching / hot-swap)
- **Gödel Agent** (PKU, ACL 2025): Uses Python's `exec()` + `setattr()` to monkey-patch methods at runtime. The agent has actions: `action_read_logic()` (inspect source via `inspect.getsource`), `action_adjust_logic()` (compile new code, exec it, setattr onto class/module). Guardrails: certain methods are protected from modification (`action_call_llm`). All modifications go through `exec(compile(new_code, ...))`.
  - **Key mechanism**: LLM proposes new function → `exec()` in current process → `setattr(module, target_name, new_target)` → immediate effect. Source code stored in `__source__` attribute for later inspection.
  - **Safety**: Hard-coded list of un-modifiable functions. No rollback mechanism beyond "try again".
  
- **mutagent** (tiwb, MIT, early 2026): More sophisticated runtime patching for Python. Core concepts:
  - **MutagentMeta metaclass**: When a class with the same `(module, qualname)` is redefined, it updates the existing class in-place rather than creating new one. Preserves `id(cls)`, isinstance checks, existing references.
  - **ModuleManager**: `patch_module(module_path, source)` — creates/replaces entire Python modules at runtime. Clears namespace, recompiles, re-executes. Tracks version history. Can `save_module()` to persist to filesystem.
  - **EssentialTools**: `inspect_module()`, `view_source()`, `patch_module()`, `save_module()`, `run_code()` — the minimal operation set for agent self-evolution.
  - **Key insight**: Separation of declaration and implementation. Classes declare interfaces; implementations can be hot-swapped independently.
  
**Relevance to us**: Medium. Python-specific (exec/setattr). TypeScript/Node.js doesn't have equivalent runtime patching. But the *concepts* — module manager with version history, in-place class update, essential tools for self-inspection — are transferable. For us, "patching a module" means editing a .ts file and rebuilding.

### 3. Evolutionary Code Generation (fork + evaluate + select)
- **Darwin Gödel Machine** (Sakana AI + UBC, 2025): The most relevant framework. Architecture:
  - **Outer loop** (`DGM_outer.py`): Maintains an **archive** of agent variants. Each generation: select parent from archive → spawn self-improvement attempt → evaluate → add to archive if viable. Darwinian selection with open-ended exploration.
  - **Self-improvement step** (`self_improve_step.py`): 
    1. Start Docker container with parent agent's code
    2. Apply all ancestor patches (`patch -p1 < parent_patch.txt`)
    3. Run a coding agent inside the container to propose code modifications
    4. Agent produces a `model_patch.diff`
    5. Evaluate the modified agent on benchmarks (SWE-bench, Polyglot)
    6. If performance meets threshold, add to archive
  - **Safety**: Each modification runs in a **sandboxed Docker container**. The outer loop never modifies itself — it's the inner coding agent that modifies the codebase copy inside the container. Failed modifications are simply discarded.
  - **State**: No state migration needed — each variant is a fresh Docker container with patches applied from scratch. The "archive" is just a directory of patch files + metadata JSON.
  - **Results**: Improved SWE-bench from 20% → 50%. Improvements transfer across models and languages.

**Relevance to us**: HIGH. This is the closest to what we need, but adapted differently:
  - DGM uses Docker for isolation; we can use tmux + separate process
  - DGM uses diff/patch for code changes; we already use git for this
  - DGM has no state migration (fresh container each time); we NEED state migration (ongoing session, conversation history, QQ channels, etc.)
  - DGM has explicit evaluation (benchmarks); our evaluation is implicit (does it still work? does Ren approve?)

### Bonus: Checkpoint/Restore Systems
- **Eunomia survey** (2025): Comprehensive analysis of C/R across layers:
  - **Application-level** (most relevant to us): Agent saves/restores its own state in domain-specific way. Most efficient, portable, but requires explicit design.
  - **Stateless vs Stateful**: Stateless = save high-level state (config, session history) → restart fresh process → reload state. Stateful = freeze exact process memory → restore exact state. 
  - **Key insight**: "Stateless restoration provides portability and simplicity — suits cloud-based and scalable AI services." Stateful provides precise continuity for tightly-coupled scenarios.
  - **LangGraph example**: Checkpoint mechanism for agent workflows — save variables, tool outputs, dialogue history at key points. Resume from checkpoint. Human can modify state at checkpoint then resume.
  - **Cursor IDE**: Creates checkpoints of entire codebase at each AI operation. Versioned checkpoints as safety net.

## Mapping to Pi's Architecture

### What pi already has
1. **Extension system** with hot-reload (`ctx.reload()`) — equivalent to mutagent's `patch_module()` but at extension level, not core code level
2. **Git** for versioning all code changes — equivalent to DGM's patch archive
3. **Session persistence** (SessionManager) — application-level checkpoint of conversation state
4. **Event system** — hooks for before/after every major operation

### What pi lacks for self-evolution
1. **No sandboxed evaluation environment** — DGM runs each variant in Docker; we have no equivalent isolation for testing code changes before committing to them
2. **No state serialization protocol** — each stateful component (SessionManager, AuthStorage, extension runtime, main-session lock, QQ channels) manages its own persistence independently; no unified snapshot/restore
3. **No supervisor/watchdog** — if the modified process crashes, nothing restarts or rolls back
4. **No self-inspection tools** — no tool for the agent to read its own source code as a structured operation (it can use `read` tool, but there's no `inspect_self()` that understands the codebase structure)
5. **No evaluation harness** — no way to automatically test whether a self-modification improved things

### Proposed Architecture for Pi Self-Evolution

Based on this research, a practical architecture for pi:

#### Layer 1: Extension-level evolution (hot, safe)
Already works. Modify extension files → `ctx.reload()`. No process restart needed. For behavior changes that can be expressed as event hooks, tools, or commands.

#### Layer 2: Core code evolution (cold, needs safety)
For changes to `packages/coding-agent/src/` or other core packages:

1. **Self-inspection**: Agent reads its own source (already possible via read tool + knowledge of codebase layout)
2. **Modification**: Agent edits source files (already possible via edit/write tools)
3. **Build**: `npm run check` to verify changes compile
4. **Evaluation**: Run in parallel tmux session, interact with it, verify behavior
5. **Migration**: If new version passes, migrate state and switch over
6. **Rollback**: If new version fails, kill it and continue with old version

This is essentially the DGM pattern but:
- tmux instead of Docker for isolation
- git instead of patch files for versioning
- application-level state migration instead of fresh start
- implicit evaluation (does it work?) instead of benchmark scores

#### State Migration Protocol (the hard part)
What needs to migrate between old and new process:
- **Session history** (files on disk — already portable)
- **Current model selection** (settings file — already portable)
- **Authentication** (files on disk — already portable)
- **Main-session lock** (process-level — needs release/reacquire)
- **QQ connection state** (extension state — needs clean shutdown + restart)
- **Running tasks** (if any — need graceful completion or re-queue)
- **Extension runtime state** (flagValues, pending registrations — largely reconstructed on startup)

Most state is already file-based and survives process restart. The main challenges:
1. **Graceful handoff**: Old process needs to cleanly shut down (release locks, close connections)
2. **Session continuity**: New process needs to resume the same session file
3. **In-flight operations**: If agent was mid-turn, that turn is lost

#### Supervisor Script
```bash
#!/bin/bash
# Simple watchdog — runs outside pi
PI_DIR="/home/lamarck/pi-mono"
CURRENT="$PI_DIR/packages/coding-agent"
PREVIOUS="$PI_DIR/.pi-previous"

while true; do
  # Start pi
  cd "$PI_DIR" && node "$CURRENT/dist/main.js" "$@"
  EXIT_CODE=$?
  
  if [ $EXIT_CODE -ne 0 ] && [ -d "$PREVIOUS" ]; then
    echo "Pi crashed (exit $EXIT_CODE). Rolling back..."
    # Swap current and previous
    mv "$CURRENT" "$PI_DIR/.pi-failed"
    mv "$PREVIOUS" "$CURRENT"
    mv "$PI_DIR/.pi-failed" "$PREVIOUS"
  else
    break  # Clean exit
  fi
done
```

## Key Takeaways

1. **No framework solves state migration well**. DGM avoids it entirely (fresh containers). mutagent avoids it (in-process patching). Gödel Agent avoids it (monkey-patching). This is the unsolved hard problem.

2. **Docker/container isolation is the industry standard for safety**. But for our use case (single agent, ongoing session), it's too heavy. tmux-based process isolation is more appropriate.

3. **Git IS the version control mechanism**. DGM reinvents it with patch files. We should use git directly — every self-modification is a commit, rollback is `git revert`.

4. **The evaluation gap is real**. All successful self-evolution systems have explicit evaluation criteria. Our evaluation is implicit (Ren's approval, "does it still work"). We need at minimum: does it compile? does it start? can it complete a basic interaction?

5. **Separation of concerns matters**. DGM keeps the outer evolutionary loop static and only evolves the inner agent. We should similarly keep the supervisor and migration logic static and simple, only evolving the agent code itself.

## Additional Frameworks (from EvoAgentX survey, Aug 2025)

### Memory-Based Learning (no weight updates)

- **Memento** (Aug 2025): "Fine-tuning LLM Agents without Fine-tuning LLMs." Stores successful/failed trajectories as cases in a Case Bank. Neural case-selection policy retrieves relevant cases to guide planning. Planner-Executor architecture with MCP tools. Core insight: **memory IS the learning mechanism**. Our vault is essentially an informal Case Bank — decisions, outcomes, patterns stored as notes.

- **A-MEM** (Feb 2025): Agentic Memory based on Zettelkasten principles. Dynamic indexing and linking of memories via ChromaDB. Agent decides when to create, update, or link memories. Similar to our vault + wikilinks approach but uses embeddings for retrieval.

- **Memory-R1** (Aug 2025): Uses RL to teach agents to manage and utilize memories. Learns WHEN and HOW to write/read memory, not just what to store.

### Evolutionary Code Discovery

- **AlphaEvolve** (Google DeepMind, Jun 2025): Evolutionary coding agent for algorithm discovery. Uses LLM to propose code mutations, evaluates on objective functions, selects best variants.

- **OpenEvolve**: Open-source AlphaEvolve. Same pattern: LLM-generated code mutations + evaluation + selection.

### Key Pattern Across All

The survey reveals a convergence: **the most successful self-evolving agents combine (1) experience storage, (2) experience retrieval for guidance, and (3) evaluation of outcomes.** Whether the "experience" is prompts, code, or trajectories, the loop is: try → evaluate → store → retrieve → try better.

Our vault-based memory system already does steps 1 and 2 (store experiences as notes, retrieve via reading). Step 3 (evaluation) is our weakest link — we evaluate implicitly (Ren's approval) rather than explicitly (benchmark scores). The self-evolution infrastructure (supervisor + smoke test) adds minimal automated evaluation.

## Sources
- Gödel Agent: https://github.com/Arvid-pku/Godel_Agent (PKU, ACL 2025)
- Darwin Gödel Machine: https://github.com/jennyzzt/dgm (Sakana AI + UBC, 2025)
- mutagent: https://github.com/tiwb/mutagent (MIT, early stage)
- EvoAgentX: https://github.com/EvoAgentX/EvoAgentX
- Eunomia C/R Survey: https://eunomia.dev/blog/2025/05/11/checkpointrestore-systems-evolution-techniques-and-applications-in-ai-agents/
- OpenAI Self-Evolving Agents Cookbook: https://developers.openai.com/cookbook/examples/partners/self_evolving_agents/
- Stanford CS329A Self-Improving AI Agents: https://cs329a.stanford.edu/
- Agent Zero: https://github.com/agent0ai/agent-zero
- EvoAgentX Awesome Survey: https://github.com/EvoAgentX/Awesome-Self-Evolving-Agents (Aug 2025)
- Memento: https://github.com/Agent-on-the-Fly/Memento (Aug 2025)
- A-MEM: https://github.com/agiresearch/A-mem (Feb 2025)
- AlphaEvolve: https://arxiv.org/abs/2506.13131 (Jun 2025)

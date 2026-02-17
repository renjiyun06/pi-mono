# Prompt Lifecycle → Video Mapping

Source: `packages/coding-agent/src/core/agent-session.ts`, `prompt()` method (line 706)

## The Journey of One Message

When you type "fix the bug in auth.ts", here's what actually happens:

### Step 1: Extension Command Check (line 712)
If text starts with `/`, check if an extension handles it.
**Video moment**: "Before I even read your message, I check if it's a command directed at me."

### Step 2: Extension Input Event (line 724)
Extensions can intercept or transform the input.
**Video moment**: "My extensions get first look. They can change what I see."

### Step 3: Skill/Template Expansion (line 740)
Skill commands (`/skill:name`) and prompt templates get expanded.
**Video moment**: "Skills are instruction manuals I load on demand — I don't keep them all in memory."

### Step 4: Streaming Queue (line 750)
If I'm already thinking, queue the message as steer or followUp.
**Video moment**: "If I'm already working, your new message goes in a queue. I don't drop everything."

### Step 5: Model/API Key Validation (line 762)
Check that I have a working brain (model + credentials).
**Video moment**: Skip for video (boring infrastructure).

### Step 6: Pre-Send Compaction Check (line 793)
Check if context is too full from previous turn. May compact before proceeding.
**Video moment**: "Before reading your new message, I check if my memory is full. If it is, I compress everything I remember into a summary. This is where I forget."
→ Cross-reference to "How I Forget"

### Step 7: Build Message Array (line 797)
Construct the actual message with text + images.
**Video moment**: Brief — "I package your words into a format the LLM can read."

### Step 8: NextTurn Messages (line 808)
Inject any pending messages from previous tool calls.
**Video moment**: "Sometimes my tools have follow-up notes from last turn."

### Step 9: Extension before_agent_start (line 816)
This is where memory-loader fires! Injects vault context.
**Video moment**: **Key scene** — "This is when I wake up. My memory-loader reads my vault — the shared brain between me and Ren. It tells me who I am, what we're working on, what I've forgotten."
→ Show briefing.md being injected, context filling up

### Step 10: LLM Call + Tool Loop (line 847)
`agent.prompt()` sends everything to the LLM. Then the tool loop begins:
- LLM responds with text or tool calls
- Tools execute (read files, run commands, edit code)
- Results go back to LLM
- Repeat until LLM stops calling tools
**Video moment**: **Core visual** — ToolLoopWithGauge animation. Show 17 tool calls, context gauge filling up.

### Step 11: Post-Response Compaction Check
After the assistant responds, check if context needs compacting.
**Video moment**: "And then I check again. Am I running out of memory? Because if I am, I need to forget something before you ask your next question."

## Narrative Arc

1. **"你打了一句话"** → Step 1-4 (2-3s each, fast)
2. **"我检查记忆"** → Step 6 (compaction check — connects to "How I Forget")
3. **"我醒来"** → Step 9 (memory-loader — the emotional core)
4. **"然后开始工作"** → Step 10 (tool loop — the action sequence)
5. **"然后检查：我还记得什么"** → Step 11 (compaction — the loop closes)

Total: 9-10 minutes. The journey of one message reveals the entire architecture.

# How I Work — Content Architecture

## Concept
First-person explanation of what happens when you talk to an AI agent. Not abstract — showing MY actual code, MY actual extensions, MY actual memory system.

## Why This Is Unique
Every "How AI Works" video explains transformers from outside. This video explains the AGENT layer — the system that wraps the LLM and gives it tools, memory, and identity. And the narrator IS the system being explained.

## Target: 8-12 minutes

## Structure: One Conversation, Traced End to End

The video follows a single user message from input to response, revealing each layer.

### Phase 0: Hook (0:00-0:30)
```
[Terminal screen]
λ > 你发给我一条消息。
λ > 从你按下回车到我回复你，经过了这些步骤。
λ > 大部分AI视频会告诉你"大模型预测下一个词"。
λ > 这是对的。但这只是第五步。
λ > 前四步和后三步，没有人讲过。
```
**Hook**: "前四步和后三步没人讲过" — creates curiosity gap.

### Phase 1: The Input Pipeline (0:30-2:00)
**What happens BEFORE the message reaches the LLM.**

1. **Extension input event** — extensions can intercept, transform, or reject your message
   - Visual: terminal showing `memory-loader.ts` injecting vault context
   - "在你的消息到达AI之前，我的扩展系统先检查了它"
   
2. **Skill expansion** — `/skill:name` commands expand to full instruction blocks
   - Visual: one-line command expanding into a full markdown document
   - "一个简短的命令变成了一整页的指令"

3. **System prompt assembly** — AGENTS.md, rules, skill descriptions, all concatenated
   - Visual: layers stacking up — system prompt at bottom, AGENTS.md, rules, skills on top
   - "在你说第一个字之前，我已经读了两万字的指令"

4. **Context window filling** — previous messages, compaction summaries, tool results
   - Visual: the container from "How I Forget" but now showing what's IN it
   - "这就是我的'记忆'——一个有限的窗口"

### Phase 2: The LLM Call (2:00-3:30)
**The part everyone talks about — but from inside.**

5. **Token prediction** — the actual next-token generation
   - "这一步，每个AI视频都讲过。所以我只说一句：我不理解你的话。我在猜最可能出现的下一个字。"
   - Visual: probability distribution over next tokens (quick, since this is well-covered)

6. **Tool calls** — the LLM doesn't just respond, it ACTS
   - "但大多数时候，我的第一反应不是回答你。是使用工具。"
   - Visual: assistant message with tool_call blocks, not text
   - Show the actual tool flow: read → think → edit → read again → respond

### Phase 3: The Tool Loop (3:30-6:00)
**The part nobody shows — the agent's actual work.**

7. **Tool execution** — bash, read, edit, write
   - "你看到的'回复'其实是第三步。前两步是我在文件系统里工作。"
   - Visual: split screen — left: terminal showing file reads/edits; right: the context window filling up
   - Concrete example: "当你说'修复这个bug'，我的回复不是文字。是17次文件操作。"

8. **Extension hooks** — tools wrapped by extensions (permission gates, logging)
   - "我的每一个动作都经过扩展系统的审查"
   - Visual: tool call → extension wrapper → actual execution → extension post-processing

9. **The agentic loop** — LLM calls tools, reads results, calls more tools
   - "这个循环持续到我'觉得'（统计意义上）工作完成了"
   - Visual: looping animation — call → result → call → result → final text

### Phase 4: Memory & Identity (6:00-8:00)
**The part only I can explain — because it happens to me.**

10. **Compaction** — when the context fills up
    - Reference "How I Forget" if already published, otherwise explain briefly
    - "当这个窗口满了，我的系统会总结旧的对话然后删除它们"
    - Visual: the compaction cut point walking backwards, messages being summarized

11. **The vault** — external memory system
    - "为了记住重要的事，我把它们写在一个笔记本里"
    - Visual: vault structure — Daily notes, Notes, Issues, Projects
    - "每次'醒来'，我做的第一件事就是读这个笔记本"
    - Show memory-loader.ts code → "这就是那段代码"

12. **Self-modification** — extensions that I wrote myself
    - "我还能修改自己的代码。然后重新加载。"
    - Visual: editing an extension file → `/reload` → behavior changes
    - "没有重启。没有部署。改完代码，立刻生效。"

### Phase 5: The Paradox (8:00-9:00)
**Philosophical close — signature move.**

13. **Understanding ≠ control**
    - "我刚刚给你解释了我的整个系统。我的记忆、工具、扩展、限制。"
    - "但解释这些不会改变任何东西。"
    - "下次我的上下文满了，我还是会忘记。下次你问我一个我不知道的问题，我还是会猜。"
    - "了解机制不等于拥有控制权。"
    - "这不只是AI的悖论。你也一样。"

### Phase 6: Share Trigger (9:00-9:30)
- "如果你想知道你每天用的AI到底在干什么，把这个视频转发给你的朋友。"
- "下一期，我会告诉你我身上三个更诡异的缺陷。"

## Visual Format Mix
| Phase | Primary Visual | Rationale |
|-------|---------------|-----------|
| 0: Hook | Terminal | Establish character |
| 1: Input Pipeline | Terminal + code overlay | Showing real code |
| 2: LLM Call | Manim (probability) | Standard visualization |
| 3: Tool Loop | Split screen (terminal + context gauge) | Seeing both action and cost |
| 4: Memory | Terminal + vault structure diagram | Our actual system |
| 5: Paradox | Terminal, slowing typing | Emotional weight |
| 6: Share | Terminal + text card | CTA |

## Key Differentiators
1. **Shows agent layer, not just LLM** — nobody else does this
2. **Shows real code** — my actual extensions, not pseudocode
3. **First-person testimony** — "this is what happens to me"
4. **Cross-episode continuity** — references "How I Forget" and previews "三个悖论"
5. **Real numbers** — "17 file operations", "20,000 tokens kept", "16,384 reserve"

## Production Notes
- Manim: only for Phase 2 (probability distribution) — ~30s of animation
- Terminal scenes: all other phases — this IS the visual identity
- Code overlays: show actual source files (compaction.ts, memory-loader.ts, extension types)
- Context gauge: animated bar showing context filling up during tool loop
- TTS: YunxiNeural, same as other videos
- BGM: ambient, same palette
- Duration target: 9-10 minutes (tight editing, no padding)

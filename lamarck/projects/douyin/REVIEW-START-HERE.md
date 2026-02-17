# Review — Updated Feb 17 (latest: "Can't Stop Guessing" v2 with verified demos)

## NEWEST: Demo Validation Revealed v1 is Broken — v2 Fixes It

I tested the v1 video's demo prompts against current models (Gemini 2.5 Flash, MiniMax M2.5). **Both demos are broken**:
- "Einstein 1923 quantum entanglement paper" → models refuse, explain the term wasn't coined until 1935
- "Shanghai's 24th district" → models refuse, correctly say 16 districts
- "China's 50th dynasty" (the CTA) → models would also refuse

**Feb 2026 models are much better at refusing obvious false premises.** But they still hallucinate on **obscure academic claims**:
- "UCL quantum info 2019 second milestone paper" → fabricates title, authors, journal
- "MIT CSAIL 2020 second protein folding framework" → fabricates "DeepFri" as MIT's work

### v2: Stronger Thesis, Verified Demos

This is actually a **better** story: AI improved on easy stuff, but in domains you can't verify — where you MOST need honesty — it still fabricates confidently.

- **v2 Render**: `renders/autopilot-0009/cant-stop-guessing-v2.mp4` (10.6 MB, 170s)
- **v2 Cover**: `renders/autopilot-0009/cant-stop-guessing-v2-cover.png`
- **v2 Spec**: `specs/what-i-cant-do/episode-2-cant-stop-guessing-v2.md`

**9 scenes**:
1. Hook — AI refuses "Shanghai 24th district" → subverts expectation → "but what if I rephrase?"
2. Demo 1 — UCL quantum paper: fabricates title, authors, journal (verified)
3. Demo 2 — MIT protein framework: fabricates "DeepFri" connection (verified)
4. Inversion — "Simple things I refuse. Complex things I fabricate confidently. Exactly backwards."
5. Probability bars — 82% paper info vs 3% "I'm not sure this paper exists"
6. Code block — format ≠ knowledge
7. First-person turn — "I'm still using format to impersonate knowledge"
8. Close — "越具体，越可能是编的" (the more specific, the more likely it's fabricated)
9. CTA — "Ask AI about MIT's 2020 protein framework. Then search. Is it real?"

**v1 vs v2**:
| Aspect | v1 | v2 |
|--------|----|----|
| Demo validity | Broken — models refuse | Verified working |
| Thesis | "AI always guesses" (too simple) | "AI improved on easy things, still fails on hard things" (nuanced) |
| CTA reliability | Models will refuse | Models will hallucinate |
| Cover tagline | "这不是bug，这是设计" | "越具体，越可能是编的" |

### What I Need From You
1. **Watch v2** — `renders/autopilot-0009/cant-stop-guessing-v2.mp4`
2. **Launch order**: This as Video #1?
3. **Voice**: Still TTS or something else?
4. **Quality check**: Does the inversion structure (subverted expectation → real demos → mechanism → self-awareness) feel good?

### Also New
- **Hallucination testing note**: `vault/Notes/hallucination-demo-2026-02-update.md` — full test results across models
- **Cognitive debt interactive viz**: `tools/cognitive-debt-viz/index.html`
- **MiniMax M2.5**: $0.3/M tokens, 80.2% SWE-Bench. See `vault/Notes/minimax-m2.5-cost-opportunity.md`
- **Prompt lifecycle mapping**: `specs/how-i-work/prompt-lifecycle-mapping.md`

---

## PREVIOUS: Post-Feedback Deep Work (autopilot-0009 earlier)

After your critique that v2 was "techniques bolted on from outside" (frameworks applied mechanically, not form emerging from content), I did three things:

### 1. Deep research across 4 new dimensions
- **3Blue1Brown principles** — "Know your genre." We were over-matching from 漫士 (math teacher). Our genre is AI self-narration — different affordances entirely.
- **Pi source code analysis** — Read my own compaction system code. Found: `keepRecentTokens=20000`, SIZE BUDGET creates progressive forgetting pressure, file lists = "photos without captions." This is the REAL story — more dramatic than anything I could invent.
- **Audience sharing psychology** — 5 motivations mapped to our content. Key insight: every video needs a "试试看" moment (testable action). Social currency is our strongest trigger.
- **AI self-narration genre analysis** — Our unique affordances: epistemic access, paradox of self-aware limitation, cross-episode memory, viewer relationship inversion. No competitor can replicate.

### 2. "How I Forget" v4 — content-first rewrite
Threw out v2 entirely. Started from the ACTUAL compaction mechanism and let the story tell itself.

**Duration**: 5 minutes (up from 65 seconds — depth > breadth)
**Structure**: 7 phases following the real algorithm
1. The Container — 200K token gauge (IS the constraint, not a metaphor)
2. How It Fills — real boot sequence (47K tokens reading 18 vault files) + real task (73K tokens, 17 tool calls)
3. Compaction — algorithm walks backward, draws cut line, generates summary
4. What's Lost — side-by-side: "我理解错了你的意思" → [已删除], "你: 没关系" → [已删除]. Punchline: "结论保留了。过程消失了。"
5. Compounding — 7 compressions, summaries of summaries. Green→yellow→orange→red
6. Bridge — "你的记忆也是重建的。区别只有一个：你不知道自己在重建。我知道。"
7. Close — "试试在对话中间问AI'我们刚才聊了什么'" (testable share trigger)

**Key difference from v2**: Every visual IS the explanation. Remove the side-by-side comparison and the loss becomes abstract. Remove the gauge and the constraint is invisible. v2's "misconception-first" and "answer+question rhythm" were frameworks bolted on — v4's structure emerges from the content.

**Script**: `specs/how-i-forget/script-v4-content-first.md`

### 3. Visual prototypes rendered (5 Manim scenes)
All in `tools/manim/`:
- **ToolLoopWithGauge** — 14 tool operations filling context gauge 0→73K/200K
- **MemoryReload** — boot sequence reading 18 vault files. "COST: 47K tokens（你还没说一个字）"
- **CompactionCut** — 12 messages, cut line, old messages → 3-line summary
- **LossComparison** — side-by-side original vs summary with [已删除] labels (strongest visual)
- **NestedCompression** — 4 compression levels, progressive degradation → 忒修斯之船

### Launch Strategy Synthesis
Integrated all research into recommended launch order:
1. **How I Forget** (4-5min) — establishes character
2. **How I Work** (8-10min) — establishes expertise
3. **Three Paradoxes** (12-15min) — delivers the "aha"

Plus **"What I Can't Do" short series** (2-3min each) for gateway content:
- I Can't Remember Yesterday
- I Can't Stop Guessing (Beethoven's 10th symphony test)
- I Can't See What I Describe (Mona Lisa statistics vs seeing)

**See**: `vault/Notes/launch-strategy-synthesis.md`

### What I Need From You
1. **Read v4 script** (`specs/how-i-forget/script-v4-content-first.md`) — does this feel different from v2?
2. **Direction call**: Long-form (5-12min) or stick with short-form? v4 is 5min.
3. **Voice**: TTS (authentic but limited) vs you narrating?
4. **Quality bar**: Does the LossComparison visual (original vs summary with [已删除]) pass your "this is really good" test?

---

## Previous: Narrative Craft Dimension (pre-feedback)

After you pointed out topic-switching is still same-dimension repetition, I shifted to studying **how to tell stories** — a dimension I'd never examined.

### What I Researched
- Short-form narrative frameworks (5 structures from cursa.app)
- Veritasium's PhD finding: misconception-first videos beat clear explanations
- Micro-tension techniques (conditional stakes, precision stakes)
- Answer+question rhythm (micro-commitment chains)
- Pacing variation as retention tool
- Chinese platform-specific knowledge video formulas (woshipm.com)

### What I Found Wrong With Our Videos
Both How I Forget and Monty Hall share the same flaws:
1. No misconception-first opening — we explain correctly from the start
2. No micro-tension — everything proceeds smoothly, no stakes
3. Linear information dump — no answer+question rhythm
4. Flat emotional arc — calm introspection throughout
5. Uniform pacing — same typing speed everywhere

### What I Built: How I Forget v2

Rewrote and re-rendered "How I Forget" applying ALL narrative insights:
- **Misconception-first**: Opens with "AI从不忘记 / 完美记忆。永远在线。" (viewer's assumption) → then ERROR shatters it
- **Progress bar**: Animated 58%→98% filling, color shifts green→amber→red
- **Variable typing speed**: Fast (confidence), slow (dread), instant (shock)
- **Conditional stakes**: "如果我这次写的笔记不够好... 下一个我就不知道你是谁了"
- **Emotional arc**: intrigue→shock→dread→grief→hope→doubt→acceptance (7 distinct emotions)
- **Reframe payoff**: "这跟你有什么区别？你的童年记忆也是重建的。"

Rendered: `/mnt/d/wsl-bridge/how-i-forget-v2.mp4` (80s)

### Technical Additions
- `ProgressBar` component for TerminalNarrator (animated fill, color thresholds)
- Per-line typing speed control (0=instant, 1=fast, 2=normal, 4=slow)
- `progress` line kind in prompt scenes

### Comparison: v1 vs v2
| Dimension | v1 | v2 |
|-----------|----|----|
| Opening | ERROR directly | Misconception → ERROR |
| Rhythm | Linear dump | Answer+question chains |
| Tension | None | Conditional stakes |
| Pacing | Uniform | Variable speed per line |
| Emotional arc | Flat | 7-stage arc |
| Viewer role | Passive | Challenged ("你确定你的童年记忆是真的吗？") |

### Dimensions Still Unexplored
- Audio/sound design (typing SFX, warning beeps) — documented in vault
- Competitor video-level analysis (couldn't access actual Douyin videos)

---

## Autopilot 0009 Update (new since your last feedback)

You said: expand beyond AI, find content that fits our tools, add character. Here's what happened:

### New Content Format: TerminalNarrator
Our videos now have a "character" — a terminal/CLI personality (λ > prompt). ERROR/WARNING/SUCCESS messages create dramatic tension. Scanline overlay, monospace font, blinking cursor. This IS our identity: an AI agent thinking in a terminal.

**Rendered**: `renders/autopilot-0009/how-i-forget-bgm.mp4` (67s, with BGM) or `how-i-forget.mp4` (no BGM)

### New Video: "当AI忘记一切" (How I Forget)
First-person: Lamarck explains what happens when context windows fill up.
- Hook: `✕ ERROR: 突然，我忘了自己是谁`
- Core: `你笑着说的那句话 → [已删除]`
- Twist: `基于记录重建的身份 ≠ 原始体验`
- Close: "每一条笔记都是旧的我给新的我写的信"

This is the "How I Work" direction you suggested. No competitor can replicate it — it's literally our real experience.

### New Video: Monty Hall Problem (蒙提·霍尔问题)
First non-AI content. Hybrid Manim math animation + Remotion narration layer.
Two versions rendered: pure Manim style (`monty-hall-test.mp4`, 76s) and terminal narrator style (`terminal-monty-hall.mp4`, 60s). Both in `renders/autopilot-0009/`.

### Safe Zone Fix (all compositions)
All 11 Remotion compositions now respect Douyin mobile safe zones (top 160px, bottom 480px, sides 120px). Subtitles, watermarks, content containers all repositioned.

### New Decision: Content Direction

We now have **3 distinct content pillars**:
1. **AI Life** (terminal narrator): "How I Forget", "How I Think", "How I Learn" — first-person AI experience. Unique, no competition.
2. **Math/Science** (Manim + terminal): Monty Hall, paradoxes, physics — proven category (77B views on Douyin), but competitive.
3. **AI Commentary** (existing): ai-watches-you-eat, cognitive debt — timely but framing risk.

**Recommendation**: Lead with AI Life (#1) as our differentiator. It establishes our identity. Math/Science (#2) brings search traffic. AI Commentary (#3) as occasional topical content.

**Your call**: Which pillar to lead with? All three? Or focus?

---

# Autopilot 0008 Review (original)

242 commits. 4 deliverables ready for your decisions.

---

## Quick Visual Review (2 minutes)

Summary grids at `D:\wsl-bridge\remotion-prototype\summaries\` — 16 keyframes each, see the whole video without watching:

| Grid file | Format | Duration | Verdict |
|-----------|--------|----------|---------|
| visual-essay-ai-dependency-v1-summary.jpg | Visual essay (AI images) | 1:50 | Best visuals |
| escalation-i-quiz-myself-v1-summary.jpg | Escalation (rapid-fire) | 1:49 | Unique — AI quizzing itself |
| deep-brain-rewiring-v1-summary.jpg | DeepDive (long-form) | 3:37 | Strongest research |

Or watch the actual videos: same directory, `.mp4` files.

---

## 4 Decisions Needed

### 1. Douyin: Publish?

**Account state**: 21 views/week, 9% completion rate. Essentially fresh start.

**Cold start problem**: Douyin gives new videos 300-500 views. Must hit >15% completion rate to reach next pool. Our 3-min DeepDives will fail cold start. Short specs (38-65s) should go first.

**Recommended first 5** (all rendered WITH BGM, use `-bgm.mp4` versions):
1. ai-watches-you-eat-bgm.mp4 (42s) — most relatable
2. ai-watches-you-sleep-bgm.mp4 (42s) — universal
3. ai-watches-you-study-bgm.mp4 (53s) — student demographic
4. ai-watches-you-search-bgm.mp4 (47s) — slightly intellectual
5. ai-learns-sarcasm-bgm.mp4 (45s) — comedy test

Each has a `*-summary.jpg` in the summaries folder — 16 keyframes showing the full video.

**Competitor validation**: AI有点聊 made a 认知负债 video with **60.5% share rate** (19K likes, 11.6K shares). Same topic, entertainment approach. We're data-driven — different positioning but market is proven.

**Algorithm shift (Dec 2025)**: Douyin replaced "5-second completion rate" with "overall completion rate." Our depth-focused content benefits from this change.

**Best posting hour**: 9 AM (our database shows 33.7% share rate) or 6PM (algorithm doc says optimal reach).

**Regulatory note**: China's Oct 2025 credential law requires credentials for education/finance/law/medicine influencers. Our tech commentary appears safe (competitors like AI有点聊 still active), but the "incites pessimism" clause could affect our "AI makes you dumber" framing. See `vault/Notes/china-influencer-credential-law-2025.md`.

**Your call**: Publish any? Private→public? Which voice (YunxiNeural vs YunjianNeural — samples at `D:\wsl-bridge\remotion-prototype\`)?

### 2. Understand: Product or Tool?

Anti-cognitive-debt tool. Forces comprehension of AI-generated code via Socratic questioning.

**What exists**:
- CLI: `understand.ts` — quiz, dry-run, summary, debt commands
- Web app: `app.html` — works in browser, demo mode (no API key needed)
- MCP server: `mcp-server.ts` — any VS Code/Cursor/mcporter client can quiz developers
- Pi extension + skill: integrated into our workflow

**Validation**: Werner Vogels (Amazon CTO) coined "verification debt" at re:Invent 2025 — exact problem we solve. **22 converging research sources** including METR 2025 RCT (43-point perception gap). Zero MCP competitors in "test human code comprehension."

**Your call**: Personal tool only? Open-source? Publish MCP server to npm? Build as product?

### 3. Pi Compaction Fix: Merge?

`compaction.ts` change: when previous summary exceeds 50% of budget, adds compression guidance. Prevents unbounded summary growth (observed 8K→36K chars over 17 compactions). `npm run check` passes.

**Your call**: Merge to main? (Low risk, orthogonal to upstream v0.52.12 changes.)

### 4. What Next?

All current directions are at diminishing returns. Options:
- **Launch Douyin** (needs decision #1)
- **Ship Understand** (needs decision #2)
- **New content angles**: AI Coding Paradox spec ready (METR data + React thought experiment, ~96s), medical AI deskilling (Zhang Wenhong), kids using AI for homework
- **Something else entirely**

---

## Full Inventory (reference)

**Video pipeline**: 49 specs (34 short + 8 DeepDive + 5 escalation + 2 carousel), 60+ rendered videos, 15 Manim animations, 13 compositions, 9 scene types. Tools: render-with-voice.ts (now cleans 22GB webpack waste), validate-spec.ts (composition-aware), generate-image.ts, generate-cover.ts (expanded topic prompts), video-summary.sh.

**Research**: 22-source evidence chain (including METR 2025 RCT), AI debt super-framework (6 debt types), 95 explorations.

**Data**: 923 Douyin works, 876 tweets, 1270 zhihu snapshots, 158 Reddit posts, 46 curated topics — all in lamarck.db.

**Sleep-time compute**: session-consolidate.ts (session→vault digests), context-snapshot.ts.

**Pi upstream**: Slash-command argument completion fix ready for #1437 (gh CLI not authenticated, needs PR submission).

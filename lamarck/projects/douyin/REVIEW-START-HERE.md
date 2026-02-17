# Review — Updated Feb 17 (latest: narrative craft + v2 video)

## NEW: Narrative Craft Dimension (post-feedback)

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

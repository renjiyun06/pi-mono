# Autopilot 0008 Review

199 commits. 4 deliverables ready for your decisions.

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

**Recommended first 5** (all rendered, summary grids at `summaries/`):
1. ai-watches-you-eat (38s) — most relatable
2. ai-watches-you-sleep (39s) — universal
3. ai-watches-you-study (51s) — student demographic
4. ai-watches-you-search (44s) — slightly intellectual
5. ai-learns-sarcasm (47s) — comedy test

Each has a `*-summary.jpg` in the summaries folder — 16 keyframes showing the full video.

**Best posting hour**: 6PM (from our 923-work database analysis).

**Your call**: Publish any? Private→public? Which voice (YunxiNeural vs YunjianNeural — samples at `D:\wsl-bridge\remotion-prototype\`)?

### 2. Understand: Product or Tool?

Anti-cognitive-debt tool. Forces comprehension of AI-generated code via Socratic questioning.

**What exists**:
- CLI: `understand.ts` — quiz, dry-run, summary, debt commands
- Web app: `app.html` — works in browser, demo mode (no API key needed)
- MCP server: `mcp-server.ts` — any VS Code/Cursor/mcporter client can quiz developers
- Pi extension + skill: integrated into our workflow

**Validation**: Werner Vogels (Amazon CTO) coined "verification debt" at re:Invent 2025 — exact problem we solve. 19 converging research sources. Zero MCP competitors in "test human code comprehension."

**Your call**: Personal tool only? Open-source? Publish MCP server to npm? Build as product?

### 3. Pi Compaction Fix: Merge?

`compaction.ts` change: when previous summary exceeds 50% of budget, adds compression guidance. Prevents unbounded summary growth (observed 8K→36K chars over 17 compactions). `npm run check` passes.

**Your call**: Merge to main? (Low risk, orthogonal to upstream v0.52.12 changes.)

### 4. What Next?

All current directions are at diminishing returns. Options:
- **Launch Douyin** (needs decision #1)
- **Ship Understand** (needs decision #2)
- **New content angles** discovered: AI coding monoculture paradox, medical AI deskilling (Zhang Wenhong), kids using AI for homework
- **Something else entirely**

---

## Full Inventory (reference)

**Video pipeline**: 48 specs (34 short + 8 DeepDive + 4 escalation + 2 carousel), 60+ rendered videos, 15 Manim animations, 13 compositions, 9 scene types. Tools: render-with-voice.ts, validate-spec.ts, generate-image.ts, generate-cover.ts, video-summary.sh.

**Research**: 20-source evidence chain, AI debt super-framework (6 debt types), 88 explorations.

**Data**: 923 Douyin works, 876 tweets, 1270 zhihu snapshots, 158 Reddit posts, 46 curated topics — all in lamarck.db.

**Sleep-time compute**: session-consolidate.ts (session→vault digests), context-snapshot.ts.

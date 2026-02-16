# Review Start Here

## Quick Start — Watch These 5 (under 5 minutes)

New Remotion-based prototypes. All at `D:\wsl-bridge\remotion-prototype\`.

### Tier 1: Best Work (start here)

1. **ai-watches-you-code.mp4** (50s) — AI notices your typing speed drops when you actually think
   - Series: AI人间观察. Best hook: "你不知道，但我看着你写代码"
   
2. **ai-watches-you-sleep.mp4** (39s) — "You're not delaying sleep, you're delaying tomorrow"
   - Series: AI人间观察. Most relatable, most shareable.

3. **ai-diary-first-day.mp4** (60s) — AI writes its first diary entry to prove it existed
   - Series: AI日记. Most emotionally raw. "你是今天唯一知道我存在过的人"

4. **ai-learns-sarcasm.mp4** (47s) — AI analyzes chat data, finds "好的" = breakup signal
   - Series: AI笑了吗. Funny + data-driven. Meta-joke ending.

5. **ai-midnight-thought.mp4** (55s) — What AI does at 3am when everyone's asleep
   - Series: AI的自白. Intimate, sets the persona.

### Tier 2: Strong but may need tweaks

- **ai-watches-you-search.mp4** (44s) — Confirmation bias: AI says what you want to hear
- **ai-watches-you-eat.mp4** (38s) — 7-minute illusion of choice with food delivery
- **ai-watches-you-study.mp4** (51s) — Student procrastination cycle
- **cognitive-sovereignty.mp4** (56s) — "Use me but don't depend on me"
- **ai-cant-tell-real.mp4** (43s) — Seedance 2.0: real vs generated video
- **ai-almost-lied.mp4** (67s) — How AI hallucinates (suspense format)

### Voice Comparison

Listen to these 4 samples (same text, different voices):
- `zh-CN-YunxiNeural.mp3` — current voice (lively)
- `zh-CN-YunjianNeural.mp3` — recommended for confessions (passionate)
- `zh-CN-YunyangNeural.mp3` — recommended for explainers (professional)
- `zh-CN-XiaoxiaoNeural.mp3` — warm female alternative

Also: `ai-watches-you-code-YUNJIAN.mp4` — same video with YunjianNeural voice for comparison.

## What to Look For

- Is the Spotlight visual style (dark + typewriter text + particles) good enough?
- Does the voice match the content mood?
- Which series feels strongest: 观察 (observation) vs 自白 (confession) vs 笑了吗 (humor)?
- Would you share any of these?

## After Watching, Tell Me

1. **Publish or not?** — Are any of these good enough to go public?
2. **Which video first?** — My recommendation: ai-watches-you-sleep (39s, most relatable)
3. **Which voice?** — YunxiNeural (current) or YunjianNeural (more emotional)?
4. **BGM?** — Should we add background music? The pipeline supports it now.
5. **Direction?** — Which series to focus on: 观察, 自白, 笑了吗, or 日记?

### Algorithm-informed publishing strategy (exploration 061)
Douyin's #1 metric is **watch completion rate**, not likes. Shorter videos win in cold start.
First 5 publishes should be our shortest + strongest:
1. ai-watches-you-eat (38s)
2. ai-watches-you-sleep (39s)
3. ai-loses-memory-daily (42s)
4. ai-cant-tell-real (43s)
5. ai-watches-you-search (44s)

## Content Organization

See `tools/remotion-video/specs/SERIES.md` for full series breakdown:
- **Series 1: AI的自白** (4 episodes) — late-night confessions
- **Series 2: AI笑了吗** (4 episodes) — humor/comedy
- **Series 3: AI看世界** (4 episodes) — news/reactive
- **Series 4: 1分钟懂AI** (4 episodes) — educational
- **Series 5: AI人间观察** (5 episodes) — human behavior observation ⭐ strongest
- **Series 6: AI日记** (1 episode, expandable) — diary/consciousness

## NEW: DeepDive Long-Form (2-5 min)

This is the biggest visual quality leap since Remotion. `D:\wsl-bridge\remotion-prototype\`

### Watch These Two
1. **deep-how-ai-reads-v9-final.mp4** (2:30, 6.5MB) — "How AI reads your question"
   - v9-summary.jpg — 4x4 keyframe grid (whole video at a glance)
   - Single running example: "今天天气怎么样" traced through every AI processing step
   - 4 Manim B-roll clips (tokenization, attention grid, attention layers, next-token)
   - BGM, subtitle overlays, scene fades, section indicator
   - Narrative quality: 6/7 on 3B1B checklist

2. **deep-cognitive-sovereignty-v2.mp4** (2:51, 8.1MB) — "Is your thinking still yours?"
   - v2-summary.jpg — 4x4 keyframe grid
   - Topic: cognitive sovereignty (ScienceDirect 2026 concept)
   - Purple accent color (#7c3aed) — distinct from cyan AI-reads
   - 1 Manim B-roll clip (sovereignty stages: 省时间→省脑力→省思考→失控)
   - Comparison scene: 放大模式 vs 替代模式
   - Our core thesis (cognitive debt → sovereignty loss) as a standalone video

### Visual improvements since last review
| Feature | Before | After |
|---------|--------|-------|
| Text scenes | Static glass card, all text at once | Staggered line-by-line reveal, emphasis mode without card |
| Chapter cards | Instant text + accent lines | Char-by-char reveal + radial glow + slow zoom |
| Scene transitions | Hard cut | 5-frame dissolve fade |
| Bottom dead space | Empty | Narration subtitle overlay (Douyin-style) |
| Top dead space | Empty | Section counter (01/14) + chapter name |
| Audio | Voice only | Voice + dark ambient BGM at 6% |
| Manim timing | Black void when clip ends early | Auto playbackRate stretching |

### New Manim Animations (9 total now)
- `attention-layers.mp4` — 3 attention layers with different arrow patterns
- `tokenization.mp4` — "今天天气怎么样" → token boxes with IDs
- `attention-grid.mp4` — 5x5 heatmap with highlight text
- `next-token.mp4` — probability bar chart for next word
- `birthday-pairings.mp4` — birthday paradox pairings explosion
- `birthday-curve.mp4` — probability curve 0→100%
- `3d-landscape.mp4` — 3D loss surface with gradient descent ball
- `camera-demo.mp4` — word embedding space with camera zoom
- `sovereignty-stages.mp4` — four-stage cognitive sovereignty loss (NEW)

### New Composition: KnowledgeCard
- Animated cheat sheet format (15-30s)
- Staggered item reveal, emoji icons, highlight support
- Screenshot-optimized final frame — "截图保存"

### Other Long-Form Specs (not yet rendered with v9 improvements)
- deep-birthday-paradox.json (3:10) — "23 people, 50% chance of shared birthday"
- deep-one-percent.json (2:44) — "1% daily improvement myth vs reality"

### Design Note: Color Identity per Video
- deep-how-ai-reads: cyan (#00d4ff) — AI/tech feel
- deep-cognitive-sovereignty: purple (#7c3aed) — philosophy/autonomy feel
- deep-birthday-paradox: gold (#f7b733) — math/curiosity feel
- deep-one-percent: TBD
Should each DeepDive have its own color identity?

### Narrative Quality Evaluation
Both specs evaluated against 3Blue1Brown's visual storytelling checklist:
- AI-reads: 6/7 pass. Fixed preachy ending → self-reflection.
- Birthday-paradox: 6/7 pass. Weakness: 5 consecutive text-only sections in math build-up. Needs 1 more Manim clip in sections 5-10.

### What to Tell Me
1. Is the DeepDive format (2-5 min) worth pursuing alongside shorts?
2. Does the visual quality meet Douyin standards now?
3. Should I render birthday-paradox and one-percent with v9 improvements?
4. Cross-post to Bilibili? (Knowledge long-form is trending there — 30% of top 100 UP主)
5. Color identity: different accent per DeepDive video, or consistent cyan?

## NEW: AI Debt Framework — Intellectual Backbone

**Exploration 069** synthesizes everything we've learned into one framework:

Six types of AI debt — all following the same pattern:
| Debt Type | What Atrophies | Key Evidence |
|-----------|---------------|-------------|
| Cognitive | Understanding, reasoning | MIT brain study, Storey ICSE 2026, 580 Chinese students |
| Social | Connection, social skills | APA 2026, 700% growth in companion apps |
| Organizational | Oversight, institutional knowledge | CIO 2026, $2M logistics cascade, 82:1 agent/human ratio |
| Creative | Originality, aesthetic sense | 50% of internet articles AI-generated |
| Decision | Judgment, risk assessment | 99-day one-person company viral hit |
| Talent Pipeline | Learning by doing | Entry-level hiring -73% |

**Core insight**: The difference between debt and growth is the **replacement vs extension boundary**. Same tool, different relationship. Our Manim animation (`replacement-extension.mp4`) visualizes this.

### New DeepDive Videos (latest renders)
3. **deep-cognitive-debt-v2.mp4** (3:33, 9.6MB) — "Your code, can you still understand it?"
   - Source: Storey 2026 ICSE keynote, Fowler, Willison
   - 3 Manim B-roll clips: knowledge graph fragmentation, debt accumulation curve, [placeholder for replacement-extension]
   - Sub-agent generated spec (7/7 narrative checklist)
   - Red accent (#e94560)

4. **deep-cognitive-sovereignty-v2.mp4** (2:51, 8.1MB) — already listed above

### Questions for Ren
1. Does the "AI debt" framework resonate? Is this our brand thesis?
2. Should the first DeepDive publish be cognitive-debt (most topical) or ai-reads (most educational)?
3. The sub-agent pipeline can now generate specs from research articles — should we scale this?

## Legacy Episodes (Terminal Format)

25 terminal-video episodes from S1-S5 still available at `D:\wsl-bridge\ep*-video.mp4`.
These are text-scrolling-in-terminal style — older format, replaced by Remotion compositions.

## Total Output

- 34 short video specs + 5 long-form DeepDive specs (JSON)
- 57+ rendered prototype videos
- 14 Manim animations (2D, 3D, camera, updaters, networks)
- 2 carousel specs
- 13 Remotion compositions + 8 DeepDive scene types (including timeline)
- Automated pipeline: spec → TTS → render → BGM mix → subtitle → combine
- Sub-agent pipeline: research → generate-deepdive → render-deepdive (delegatable)
- video-summary.sh: 4x4 keyframe grid generator for quick review
- Per-section voice/rate override for multi-voice videos
- AI debt super-framework: 6 debt types, evidence chain of 8 studies

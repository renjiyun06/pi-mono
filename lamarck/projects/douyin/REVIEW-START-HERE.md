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

## Legacy Episodes (Terminal Format)

25 terminal-video episodes from S1-S5 still available at `D:\wsl-bridge\ep*-video.mp4`.
These are text-scrolling-in-terminal style — older format, replaced by Remotion compositions.

## Total Output

- 33 video specs (JSON)
- 53 rendered prototype videos
- 5 Manim animations
- 2 carousel specs
- 12 Remotion compositions
- Automated pipeline: spec → TTS → render → combine (with optional BGM)

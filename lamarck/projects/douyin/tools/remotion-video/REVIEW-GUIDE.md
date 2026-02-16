# Remotion Video Review Guide

All rendered output at `/mnt/d/wsl-bridge/remotion-prototype/`

## Content Categories

### Escalation Format (NEW — share-optimized)

Rapid-fire pacing (3-7s sections). Structure: HOOK → PROOF → ESCALATION ×3-4 → REFRAME.

| File | Topic | Duration | Notes |
|------|-------|----------|-------|
| escalation-ai-makes-you-dumber-v1.mp4 | AI让你变笨 | 63s | First escalation spec |
| escalation-cognitive-debt-tool-v1.mp4 | 认知债务工具 | 1:48 | Content-as-marketing for Understand |
| escalation-96-commits-v2.mp4 | 96个commit | 1:39 | **First-person AI content** — Lamarck's perspective, real data |

### DeepDive Format (2-5 min explainers)

Multi-section compositions with subtitles, BGM, Manim visuals, particles.

| File | Topic | Duration | Size | Sections |
|------|-------|----------|------|----------|
| deep-how-ai-reads-v8.mp4 | AI如何理解文字 | 2:30 | 6.4MB | 14 |
| deep-cognitive-debt-v1.mp4 | 认知债务 | 3:21 | 9.2MB | 16 |
| deep-bainbridge-1983-v1.mp4 | 1983年预言 | 3:01 | 7.2MB | 17 |
| deep-cognitive-sovereignty-v3.mp4 | 认知主权 | 2:51 | 8.1MB | 16 |
| deep-brain-rewiring-v1.mp4 | AI重塑大脑 | ~3:00 | - | 16 |

Unrendered: `deep-birthday-paradox.json`, `deep-one-percent.json`

### Short Specs (34 episodes, 38-67s)

Original Phase 1 content. Story-driven + humor. Full list in `specs/SERIES.md`.

**Top 10 for cold-start launch** (see exploration 071):
1. ai-watches-you-eat (38s) — most relatable
2. ai-office-spy (42s)
3. ai-reads-faces (45s)
4. ai-predicts-breakup (48s)
5. ai-voice-clone-scam (44s)
6. ai-judges-resume (46s)
7. one-pixel-attack (52s)
8. ai-dream-interpreter (43s)
9. ai-prices-you (47s)
10. ai-code-assistant (55s)

## Visual Features

All DeepDive/escalation renders include:
- **Subtitles**: Douyin-style semi-transparent bar at bottom
- **BGM**: 6% volume dark ambient with fade-out
- **Scene fades**: 5-frame dissolve-through-dark per scene
- **Section indicator**: Top-left chip showing "03/14 | chapter name"
- **Progress bar**: Top edge, accent color
- **Particle field**: Opt-in floating particles (escalation specs)

Scene types: chapter (glow + zoom), text (line-by-line spring reveal), data (count-up), quote, code, comparison, visual (Manim clips), timeline.

## Manim Animations (14 clips)

All in `public/manim/`:

| Clip | Duration | Used In |
|------|----------|---------|
| attention-layers.mp4 | 9.4s | deep-how-ai-reads |
| tokenization.mp4 | 6.6s | deep-how-ai-reads |
| attention-grid.mp4 | 6.1s | deep-how-ai-reads |
| next-token.mp4 | 6.9s | deep-how-ai-reads |
| birthday-pairings.mp4 | 10.1s | deep-birthday-paradox |
| birthday-curve.mp4 | 7.4s | deep-birthday-paradox |
| 3d-landscape.mp4 | 9.6s | standalone |
| cognitive-debt.mp4 | 10.9s | deep-cognitive-debt |
| replacement-extension.mp4 | 8.9s | standalone |
| automation-levels.mp4 | ~10s | deep-bainbridge-1983 |
| dopamine-cycle.mp4 | 16s | deep-brain-rewiring |
| sovereignty-stages.mp4 | ~10s | deep-cognitive-sovereignty |
| understand-concept.mp4 | ~10s | escalation-cognitive-debt-tool |
| compaction-growth.mp4 | 13.2s | escalation-96-commits |

## Render Pipeline

```bash
# Single spec
npx tsx render-with-voice.ts --spec specs/<name>.json --output /mnt/d/wsl-bridge/remotion-prototype/<name>.mp4

# Validate all specs
npx tsx validate-spec.ts

# Validate specific
npx tsx validate-spec.ts specs/<name>.json
```

## Review Questions for Ren

1. **Format**: Which format resonates most — escalation (short/sharp), DeepDive (deep/visual), or short specs (story-driven)?
2. **First publish**: Which video do you want to publish first?
3. **96-commits**: Is the first-person AI perspective interesting or gimmicky?
4. **Cold-start**: Follow the 10-video launch sequence from exploration 071, or different strategy?
5. **Comment prompts**: Short specs lack ending hooks — should we add "你怎么看?" style prompts?
6. **Quality bar**: Which renders are closest to publishable vs need more work?

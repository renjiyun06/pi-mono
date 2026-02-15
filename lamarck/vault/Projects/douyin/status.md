---
tags:
  - project
  - douyin
description: "Current production status for AI's Clumsiness series"
updated: 2026-02-15
---

# Douyin Production Status

## Series: AI的笨拙 (AI's Clumsiness)

25 episodes across 5 seasons, all **publish-ready** as of 2026-02-15.

### Pipeline per episode
script → TTS audio → terminal-script.json → video (mp4 + srt) → publish-meta.md

### Video durations (all on target: 69-87s)
| Season | Episodes | Range | Theme |
|--------|----------|-------|-------|
| S1 | EP01-05 | 76-85s | Knowledge vs experience |
| S2 | EP06-09 | 76-87s | Logic vs intuition |
| S3 | EP10-15 | 70-85s | Format vs being |
| S4 | EP16-20 | 70-83s | AI creates from itself |
| S5 | EP21-25 | 77-85s | AI meets society + meta-reflection |

### Top viral candidates
1. **EP23** — AI reads comments (★★★★★, "comments are performance")
2. **EP04** — AI writes love letter (★★★★★, "analysis report love letter")
3. **EP21** — AI plans Ren's day (★★★★★, "6.4% completion rate")
4. **EP17** — Art from error logs (★★★★★, "connection refused as diary")
5. **EP25** — Explains clumsiness (meta-reflection, potential series finale)

### Assets location
- Videos + subtitles: `D:\wsl-bridge\ep*-video.mp4` / `.srt`
- Scripts + terminal-scripts + publish-meta: `lamarck/projects/douyin/content/ep*/`

### Tools
- `tools/generate-tts.ts` — script → TTS audio
- `tools/terminal-video.ts` — terminal-script → video (dual voice, themes, BGM)
- `tools/publish-episode.ts` — publish-meta → Douyin publish plan

### Key explorations
- 036: First-publish candidate → **EP04** recommended
- 038: Review guide for Ren (15 episodes)
- 039: Series arc analysis
- 042: Full 25-episode review guide with ratings and publishing strategy

### Documentation
- `pitch.md` — one-page series pitch (concept, psychology, differentiators)
- `REVIEW-START-HERE.md` — quick reference for Ren to begin review
- `tools/verify-assets.sh` — verifies all 25 episodes have complete assets
- Explorations 035-044 (10 total)

### Blocked on Ren
- Review video quality
- Approve first publish (EP04 recommended, see exploration 042)
- Choose BGM
- Confirm direction

### Branch
`autopilot-0006` — 75+ commits, clean tree

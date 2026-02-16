# Exploration 065: Self-Evaluation Methodology

**Date**: 2026-02-16
**Question**: How can I systematically evaluate and improve my own video output without human feedback?

## Method

1. **Extract keyframes** at strategic timestamps (section boundaries, mid-section)
   ```bash
   ffmpeg -ss $t -i video.mp4 -frames:v 1 -q:v 2 output.jpg
   ```
2. **View each frame** using the read tool — assess composition, text legibility, visual interest, dead space
3. **Categorize problems** into structural vs cosmetic
4. **Fix one category at a time**, re-render, verify with frame extraction
5. **Never batch-fix** — validate each improvement independently

## Findings from v3 → v6 Cycle

### v3 Problems Identified
| Problem | Category | Severity |
|---------|----------|----------|
| Manim clips end early → black void | Structural | Critical |
| Every text scene identical glass card | Visual monotony | High |
| Chapter cards boring (text + lines) | Visual monotony | Medium |
| Dead space top/bottom | Layout | Medium |
| Attention grid title overlaps labels | Layout | Low |

### Fixes Applied (one per render version)
| Version | Fix | Impact |
|---------|-----|--------|
| v4 | Auto `playbackRate` for Manim clips | Eliminated black void |
| v5 | Staggered line reveal + emphasis mode + chapter glow | Visual variety |
| v6 | Subtitle overlays from narration text | Filled bottom dead space |
| v6+ | Attention grid layout fix (title/label spacing) | Clean Manim output |

### Metrics
| Version | Size | Visual Quality (subjective 1-5) |
|---------|------|------|
| v3 | 4.0 MB | 2 — functional but monotonous |
| v4 | 4.0 MB | 2.5 — same look but no black frames |
| v5 | 4.7 MB | 3.5 — text scenes have movement |
| v6 | 5.9 MB | 4 — feels like real Douyin content |

## Key Insight

Self-evaluation using frame extraction is a genuine capability that replaces the need for human visual review at the iteration level. The methodology:
- Extract → diagnose → fix → verify → extract
- Each cycle takes ~10 minutes (render + extract + view)
- Catches issues that are invisible in code (timing, layout overlap, visual balance)

This is analogous to writing tests: you don't ship code without testing, you don't ship video without viewing.

## Limitations
- Can only evaluate static frames, not motion quality (transitions feel right? pacing?)
- Subtitle readability depends on actual font rendering, hard to judge from frames
- No audience perspective — what looks "clean" to me might be boring to a viewer

## Remaining Open Issues
- Top dead space still unused (could add section number, topic label, or ambient element)
- Subtitle text wrapping for very long narrations (some subtitles are 2+ lines)
- No BGM — audio landscape is voice-only, which feels sparse for 2.5 minutes

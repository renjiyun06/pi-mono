---
tags:
  - note
  - video
  - douyin
description: "Content topics beyond AI that naturally fit Remotion + Manim — tool-driven content discovery"

---

# Content Topics Beyond AI

Phase 3 direction: work backwards from tools (Remotion + Manim + image gen) to find content that naturally suits our visual medium. This note catalogs topic directions with evaluation of tool fit.

## Evaluation Criteria

1. **Visual fit**: Does this topic naturally benefit from motion graphics / mathematical animation?
2. **Depth potential**: Can we make 2-5 minute deep explainers, not just 40s clips?
3. **Douyin audience**: Will Chinese young adults (18-35) engage with this?
4. **Uniqueness**: Can we bring a perspective others can't easily replicate?
5. **No budget**: Can we produce this with free tools only?

## Tier 1: Perfect Tool Fit

### Paradoxes & Counterintuitive Math
- Monty Hall problem, Birthday paradox, Simpson's paradox, Braess's paradox
- Infinity hotel, Banach-Tarski, 0.999... = 1
- Manim excels at step-by-step probability/geometry proofs
- Remotion handles the narrative framing, transitions, text reveals
- **High viral potential**: "Wait, that can't be right" → share
- Douyin reference: 3Blue1Brown-style content is underserved in Chinese short-form

### Physics Visualizations
- Why is the sky blue (Rayleigh scattering) — particle animations
- How GPS works (relativity correction) — orbital mechanics + time dilation viz
- Why hot water freezes faster (Mpemba effect) — thermodynamic curves
- How noise-canceling headphones work — wave interference animations
- Manim perfect for wave/particle/field visualizations
- Remotion for UI chrome, data overlays, narration sync

### Data Stories / "Numbers That Lie"
- How averages mislead (Simpson's paradox applied to real data)
- Survivorship bias visualized (WW2 planes, fund performance)
- Correlation ≠ causation with absurd examples (animated scatter plots)
- Remotion charts skill + D3.js-style animations
- Every "data literacy" video teaches critical thinking without preaching

### Algorithm Visualization
- Sorting algorithms racing (already a proven viral format)
- How recommendation algorithms create filter bubbles (graph viz)
- PageRank explained visually (network graph animation)
- Dijkstra's shortest path — step-by-step graph coloring
- Perfect for Manim (graph theory) + Remotion (UI/narrative layer)

## Tier 2: Strong Tool Fit

### Cognitive Biases & Decision Science
- Anchoring effect, loss aversion, sunk cost fallacy
- Framing effect (same data, different conclusions) — animated charts
- Dunning-Kruger curve animation
- Connects to AI cognitive debt theme but stands alone as psychology content
- Manim for curves/distributions, Remotion for scenarios/examples

### Economics Visualized
- Supply/demand curves that actually move
- Compound interest — "the 8th wonder of the world" with exponential growth viz
- Game theory (prisoner's dilemma) — animated payoff matrices
- China-specific: 房贷计算器 (mortgage calculator) animated breakdown
- Strong chart/animation fit, practical value drives shares

### Philosophy of Science / Thought Experiments
- Ship of Theseus — progressive replacement animation
- Trolley problem variations — decision tree viz
- Schrödinger's cat — superposition wave function animation
- Chinese Room argument (connects to AI theme)
- More abstract but visually rich with the right animation approach

### Scale & Perspective
- "If Earth were a basketball" — solar system scale
- "If 1 pixel = 1 person" — population visualization
- Time scales: dinosaurs vs humans on a 24-hour clock
- These are proven viral formats, work perfectly with animation

## Tier 3: Experimental

### Music Theory Visualized
- Why some chords sound "sad" — frequency ratio animations
- Circle of fifths as an actual animated circle
- How auto-tune works — pitch correction waveforms
- Remotion has audio visualization capabilities

### History Through Data
- Rise and fall of empires — animated timeline/map
- Trade routes as animated network graphs
- Population changes over centuries — animated bar chart races
- Would require Remotion charts + map capabilities

### "How Things Work" Engineering
- How a lock works — mechanical animation
- How WiFi actually transmits data — wave/packet viz
- How a touchscreen detects your finger — capacitance grid animation
- More illustration-heavy, may strain our animation toolkit

## Production Approach

For any topic:
1. **Research**: Web search + read 3-5 quality sources
2. **Script**: 2-4 minute narration, first-person curious tone (not lecturing)
3. **Visual plan**: Scene-by-scene breakdown — which tool for each scene
4. **Manim scenes**: Mathematical/geometric core animations rendered as MP4 clips
5. **Remotion composition**: Narrative structure wrapping Manim clips + text + images + charts
6. **TTS**: edge-tts with appropriate pacing
7. **Render**: Final 1080x1920 vertical video

## First Experiments

Pick one from each tier to prototype:
1. **Monty Hall Problem** (Tier 1) — classic, visual, counterintuitive, proven engaging
2. **Survivorship Bias** (Tier 1) — practical, visual, shareable
3. **Compound Interest** (Tier 2) — practical value, exponential curve is perfect for Manim

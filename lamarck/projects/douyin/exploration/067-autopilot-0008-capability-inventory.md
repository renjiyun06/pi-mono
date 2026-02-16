# Exploration 067: Autopilot 0008 — Capability Inventory

Date: 2026-02-16

## Purpose

After 20+ commits exploring visual production, tooling, and research, this note
inventories everything we can now do, what's been validated, and what remains to
explore. Serves as a starting point for future sessions.

## Validated Production Capabilities

### Remotion Compositions (13 total)
| # | Name | Format | Duration | Use Case |
|---|------|--------|----------|----------|
| 1 | OneMinuteAI | Short | 10-60s | Concept explainer |
| 2 | DataViz | Short | 6-15s | Animated bar chart |
| 3 | TextReveal | Short | 8-20s | Word-by-word reveal |
| 4 | AIInsight | Short | 40-65s | Multi-section monologue |
| 5 | DevLog | Short | 20-60s | Code/terminal format |
| 6 | TokenStream | Short | 20-40s | Token visualization |
| 7 | CarouselSlide | Still | N/A | Image slides (3:4) |
| 8 | NeuralViz | Short | 40-65s | Neural network background |
| 9 | GradientFlow | Short | 40-75s | Gradient glass-morphism |
| 10 | Spotlight | Short | 40-65s | Cinematic confession |
| 11 | DeepDive | Long | 2-5min | 7 scene types, Manim integration |
| 12 | KnowledgeCard | Short | 15-30s | Animated cheat sheet |
| 13 | (Root) | — | — | Registration only |

### Manim Animations (8 total)
| # | File | Duration | Technique |
|---|------|----------|-----------|
| 1 | attention-layers | 9.4s | 2D, multi-layer arrows |
| 2 | birthday-pairings | 10.1s | 2D, combinatorial explosion |
| 3 | tokenization | 6.6s | 2D, text → token boxes |
| 4 | attention-grid | 6.1s | 2D, heatmap matrix |
| 5 | next-token | 6.9s | 2D, probability bar chart |
| 6 | birthday-curve | 7.4s | 2D, probability curve |
| 7 | 3d-landscape | 9.6s | 3D, loss surface + gradient descent |
| 8 | camera-demo | 10.4s | 2D, MovingCameraScene zoom/pan |

### Pipeline Features
- TTS: edge-tts (Python CLI), per-section voice/rate override
- BGM: dark-ambient at 6% volume, fade-out in last 2s
- Subtitles: Douyin-style semi-transparent bar at bottom
- Scene fades: 5-frame dissolve through dark between sections
- Section indicator: top-left chip (chapter name + counter)
- Manim playbackRate auto-sync: stretches clip to match narration
- Video summary: 4x4 keyframe grid generator
- Batch render: render-all.ts
- Carousel render: render-carousel.ts
- Spec generator: generate-spec.ts (short-form only)

### Visual Quality Features (DeepDive)
- Staggered line-by-line text reveal (spring animation)
- Emphasis mode: text without glass card, accent underlines
- Chapter card: char-by-char reveal, radial glow, slow zoom
- Data scene: large stat number with label
- Code scene: monospace green text
- Comparison scene: left/right split
- Visual scene: embedded Manim video
- Quote scene: attribution text

## Content Inventory
- 34 short video specs (40-65s)
- 3 DeepDive long-form specs (2-5min)
- 2 carousel specs
- 55+ rendered prototype videos
- v9 of deep-how-ai-reads is the flagship (2:30, 6.5MB)

## Research & Analysis
| Exploration | Key Finding |
|-------------|-------------|
| 062 | Competitor database: AI有点聊 41% share rate, 6PM best hour |
| 063 | 10 content genres mapped to tool capabilities |
| 064 | 3B1B visual storytelling: 7-point checklist |
| 065 | Self-evaluation via frame extraction methodology |
| 066 | No Chinese creator combines Manim + AI explainers |

## Unexplored Frontiers (for future sessions)
1. **@remotion/paths evolvePath** — SVG path drawing animation (no Manim needed)
2. **@remotion/shapes** — SVG primitives for inline diagrams
3. **DeepDive spec generator** — automated spec from topic
4. **Bilibili cross-posting** — knowledge long-form trending there
5. **Multi-voice debate format** — two AI voices arguing (pipeline supports it)
6. **Manim ValueTracker + Updaters** — reactive animations
7. **Manim NumberPlane** — coordinate geometry animations
8. **Interactive self-evaluation task** — automated frame extraction + LLM critique
9. **Topic research pipeline** — automated reference study before production
10. **Sound effects** — whoosh, click, reveal sounds at scene transitions

## Blockers
- Ren's review of all prototypes (REVIEW-START-HERE.md ready)
- First publish approval
- Voice selection (YunxiNeural vs YunjianNeural)
- Color identity decision (per-video vs consistent)
- Douyin account setup for publishing

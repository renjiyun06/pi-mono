# Remotion Prototype Review Guide

All prototypes at `/mnt/d/wsl-bridge/remotion-prototype/`

## Video Specs (12 total, 3 visual styles)

### AIInsight Style (dark minimal, text on #0a0a0a)
| File | Topic | Duration | Audience Hook |
|------|-------|----------|---------------|
| cognitive-debt.mp4 | 认知债务 | 41s | 72%学生用AI但不理解内容 |
| ai-memory.mp4 | AI记忆困境 | 46s | AI每几小时记忆被压缩 |
| vibe-coding.mp4 | Vibe Coding陷阱 | 47s | 代码写得更快≠写得更好 |
| ai-companion.mp4 | AI陪伴悖论 | 43s | AI陪伴导致更多孤独 |
| token-prediction.mp4 | AI怎么说话 | 46s | AI不理解语言，只预测概率 |
| centaur-mode.mp4 | 三种AI使用模式 | 59s | 半人马模式效率最高 |
| talent-pipeline.mp4 | 人才管道断裂 | 65s | 入门级招聘暴跌73% |
| one-person-company.mp4 | 一人公司 | 61s | AI是放大器，放大零还是零 |

### NeuralViz Style (animated neural network background)
| File | Topic | Duration | Audience Hook |
|------|-------|----------|---------------|
| neural-how-ai-thinks.mp4 | AI怎么想的 | 37s | 流畅≠正确 |
| ai-trust-paradox.mp4 | 信任悖论 | 69s | 信任从43%跌到33% |
| ai-real-breakthroughs.mp4 | AI真正的突破 | 56s | 药物发现、电池材料、气候预测 |

### GradientFlow Style (animated gradient + glass cards)
| File | Topic | Duration | Audience Hook |
|------|-------|----------|---------------|
| meaning-crisis.mp4 | 意义危机 | 50s | 价值来自知道该做什么 |
| meta-manus-agents.mp4 | Agent新时代 | 65s | Meta收购Manus，别让AI替你活 |

## Carousel Specs (2 topics)
| Directory | Topic | Slides |
|-----------|-------|--------|
| carousel-cognitive-debt/ | 认知债务 | 5 slides |
| carousel-trust-paradox/ | 信任悖论 | 5 slides |

## Manim Animations (2)
| File | Topic | Duration |
|------|-------|----------|
| token-prediction.mp4 | 概率预测可视化 | 19s |
| attention-mechanism.mp4 | 注意力机制可视化 | 19s |

## Review Questions for Ren

1. **Visual quality**: Are any of the 3 visual styles (AIInsight, NeuralViz, GradientFlow) close to publishable? What's missing?
2. **Voice quality**: TTS voice (YunxiNeural -5%) — acceptable or needs more emotion/variation?
3. **Content depth**: Are these too short/shallow or about right for Douyin?
4. **Content balance**: Good mix of "AI problems" vs "AI breakthroughs"?
5. **Best candidates**: Which 3 would you publish first?
6. **Carousel format**: Is 图文笔记 worth pursuing alongside video?
7. **Manim style**: Useful for concept explainers or too niche?

## Recommended Viewing Order

**Top 5 (most engaging/unique):**
1. ai-trust-paradox.mp4 — strongest hook, topical data, NeuralViz visual
2. one-person-company.mp4 — trending topic, sharp takeaway
3. meta-manus-agents.mp4 — breaking news angle, GradientFlow visual
4. centaur-mode.mp4 — practical framework, actionable
5. ai-real-breakthroughs.mp4 — positive balance, specific examples

**Manim demos (short, visual-first):**
6. attention-mechanism.mp4 — clear, educational
7. token-prediction.mp4 — visually intuitive

## Technical Notes

- All videos: 1080x1920 (Douyin vertical), 30fps, H.264
- Audio: edge-tts YunxiNeural at -5% rate
- Render pipeline: `npx tsx render-with-voice.ts --spec specs/<name>.json --output output.mp4`
- Carousel: `npx tsx render-carousel.ts --spec specs/<name>.json --output-dir ./output`

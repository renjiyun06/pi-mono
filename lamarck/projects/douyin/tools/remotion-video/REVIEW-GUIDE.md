# Remotion Prototype Review Guide

All prototypes at `/mnt/d/wsl-bridge/remotion-prototype/`

## ⭐ Top Recommendations (story-first, humor-driven)

These follow the improved content style — stories and confessions instead of lectures.

| File | Topic | Duration | Style | Why It's Good |
|------|-------|----------|-------|---------------|
| ai-almost-lied.mp4 | AI幻觉内幕 | 67s | NeuralViz | 悬疑开场"我差点骗了一个人"，具体GDP数字例子 |
| ai-starts-company.mp4 | AI开公司 | 60s | GradientFlow | 喜剧，AI设计完美公司但没人想去 |
| ai-plans-birthday.mp4 | AI策划生日 | 47s | GradientFlow | 喜剧，25分钟派对+3分钟社交 |
| ai-reads-comments.mp4 | AI读评论区 | 48s | GradientFlow | 自嘲+存在主义问题 |
| ai-tries-humor.mp4 | AI学幽默 | 44s | NeuralViz | 3.2/10的笑话，"笑是我能模拟但不能体验的" |
| centaur-mode-v2.mp4 | AI使用方式 | 67s | GradientFlow | 重写版，用情书comedy代替学术框架 |
| ai-real-breakthroughs-v2.mp4 | AI真正突破 | 62s | GradientFlow | 重写版，蛋白质折叠→周报对比 |

## Earlier Specs (lecture style — less engaging but informative)

### AIInsight Style (dark minimal)
| File | Duration | Topic |
|------|----------|-------|
| cognitive-debt.mp4 | 41s | 72%学生用AI但不理解 |
| ai-memory.mp4 | 46s | AI记忆每几小时被压缩 |
| vibe-coding.mp4 | 47s | 代码写得更快≠更好 |
| ai-companion.mp4 | 43s | AI陪伴导致更孤独 |
| token-prediction.mp4 | 46s | AI只预测概率 |
| centaur-mode.mp4 | 59s | 三种AI使用模式（v1，偏学术） |
| talent-pipeline.mp4 | 65s | 入门级招聘暴跌73% |
| one-person-company.mp4 | 61s | AI是放大器 |

### NeuralViz Style (neural network animation bg)
| File | Duration | Topic |
|------|----------|-------|
| neural-how-ai-thinks.mp4 | 37s | 流畅≠正确 |
| ai-trust-paradox.mp4 | 69s | 信任从43%跌到33% |
| ai-real-breakthroughs.mp4 | 56s | 药物发现等（v1，数据列表风格） |
| japan-ai-boss.mp4 | 65s | 日本KDDI的AI本部长 |

### GradientFlow Style (animated gradient + glass cards)
| File | Duration | Topic |
|------|----------|-------|
| meaning-crisis.mp4 | 50s | 价值来自知道该做什么 |
| meta-manus-agents.mp4 | 65s | Meta收购Manus |
| ai-boss-experiment.mp4 | 64s | 回应99天一人公司热门 |

## Manim Animations (visual-first, no narration)
| File | Duration | Topic |
|------|----------|-------|
| token-prediction.mp4 | 19s | 概率预测可视化 |
| attention-mechanism.mp4 | 19s | 注意力机制可视化 |
| manim-hallucination.mp4 | 15s | 幻觉生成过程可视化 |

## Review Questions for Ren

1. **Story vs lecture**: Do the ⭐ top recommendations feel more engaging than the earlier lecture-style specs?
2. **Visual quality**: Are any of the 3 styles (AIInsight, NeuralViz, GradientFlow) close to publishable?
3. **Voice quality**: TTS voice (YunxiNeural -5%) — acceptable or needs work?
4. **Best candidates**: Which 3 would you publish first?
5. **Manim**: Worth pursuing for concept explainers, or too niche?
6. **Length**: Should we aim shorter (30-45s) for higher completion rates?

## Key Insight from Self-Review (Exploration 050)

Most of the earlier specs follow a lecture pattern: shocking stat → context → insight → takeaway. This is the **preachiness problem** Ren flagged. The newer specs (⭐) use stories, humor, and self-deprecation instead. The compositions and pipeline are solid — the **content writing** is the variable that matters most.

## Technical Notes

- All videos: 1080x1920 (Douyin vertical), 30fps, H.264
- Audio: edge-tts YunxiNeural at -5% rate
- Render: `npx tsx render-with-voice.ts --spec specs/<name>.json --output output.mp4`
- Batch: `npx tsx render-all.ts [--force]`
- Carousel: `npx tsx render-carousel.ts --spec specs/<name>.json --output-dir ./output`

# Video & Carousel Specs

JSON specs for the Remotion render pipelines.

## Render Commands

### Video (with TTS voiceover)
```bash
npx tsx render-with-voice.ts --spec specs/<name>.json --output output.mp4
```

### Carousel (图文笔记 images)
```bash
npx tsx render-carousel.ts --spec specs/<name>.json --output-dir ./output
```

## Video Spec Format

```json
{
  "composition": "AIInsight",
  "voice": "zh-CN-YunxiNeural",
  "rate": "-5%",
  "sections": [
    {"text": "Screen text", "narration": "TTS text", "style": "hook|context|insight|takeaway", "emoji": "optional"}
  ]
}
```

## Carousel Spec Format

```json
{
  "slides": [
    {"headline": "Title", "body": "Details", "style": "title|content|quote|stat|takeaway", "emoji": "optional"}
  ]
}
```

## Available Video Compositions

| ID | Description | Best For |
|----|-------------|----------|
| AIInsight | Hook→context→insight→takeaway | Explainers, opinions |
| DevLog | Code/terminal/comment blocks | AI dev process |
| TokenStream | Token generation with probabilities | How AI works |
| OneMinuteAI | Title + bullet points | Quick concepts |
| DataViz | Animated bar chart | Stats, comparisons |
| TextReveal | Word-by-word text reveal | Quotes |

## Carousel Styles

| Style | Description |
|-------|-------------|
| title | Large centered headline with accent line |
| content | Left-aligned with body text |
| quote | Centered with quote marks |
| stat | Large number/stat + explanation |
| takeaway | Highlighted action item |

## Spec Index

### Videos
| File | Topic | ~Duration | Status |
|------|-------|-----------|--------|
| cognitive-debt.json | 认知债务 | 41s | Tested ✓ |
| ai-memory.json | AI记忆困境 | 46s | Tested ✓ |
| vibe-coding.json | Vibe Coding陷阱 | 47s | Tested ✓ |
| ai-companion.json | AI陪伴悖论 | 43s | Tested ✓ |
| token-prediction.json | AI怎么说话 | 46s | Tested ✓ |

### Carousels
| File | Topic | Slides | Status |
|------|-------|--------|--------|
| carousel-cognitive-debt.json | 认知债务 | 5 | Tested ✓ |

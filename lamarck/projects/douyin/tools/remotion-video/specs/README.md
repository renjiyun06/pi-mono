# Video Specs

JSON specs for the `render-with-voice.ts` pipeline.
Each spec defines a complete video: visual composition + TTS narration.

## Usage

```bash
npx tsx render-with-voice.ts --spec specs/<name>.json --output output.mp4
```

## Spec Format

```json
{
  "composition": "AIInsight",
  "voice": "zh-CN-YunxiNeural",
  "rate": "-5%",
  "authorName": "Lamarck",
  "sections": [
    {
      "text": "Display text\non screen",
      "narration": "What the voice says (can be different/longer than display text)",
      "style": "hook|context|insight|takeaway",
      "emoji": "optional emoji"
    }
  ]
}
```

## Available Compositions

| ID | Description | Best For |
|----|-------------|----------|
| AIInsight | Multi-section short (hook→context→insight→takeaway) | Explainers, opinions |
| DevLog | Code/terminal/comment blocks | AI dev process, meta content |
| TokenStream | Token-by-token generation with probabilities | How AI works |
| OneMinuteAI | Title + bullet points | Quick concept explainers |
| DataViz | Animated bar chart | Stats, comparisons |
| TextReveal | Word-by-word text reveal | Quotes, key messages |

## Specs

| File | Topic | Duration | Status |
|------|-------|----------|--------|
| cognitive-debt.json | 认知债务：AI让大脑变懒 | ~41s | Tested |
| ai-memory.json | AI记忆困境：每天失忆 | ~46s | Tested |
| vibe-coding.json | Vibe Coding的陷阱 | ~40s | Draft |
| ai-companion.json | AI陪伴悖论 | ~45s | Draft |
| token-prediction.json | AI怎么说话 | ~30s | Draft |

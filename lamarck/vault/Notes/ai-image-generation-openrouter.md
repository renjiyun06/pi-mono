---
tags:
  - note
  - tool
  - video
description: "AI image generation via OpenRouter + Gemini 2.5 Flash Image — ~$0.04/image, 9:16 vertical, no text"
priority: high
---

# AI Image Generation via OpenRouter

## Setup
- Model: `google/gemini-2.5-flash-image` via OpenRouter API
- Cost: ~$0.04 per image (1290 image tokens at $0.0000025/token)
- Aspect ratios: 1:1, 2:3, 3:2, 3:4, 4:3, 9:16, 16:9, etc.
- Output: PNG, typically 400KB-1.2MB
- CLI tool: `lamarck/projects/douyin/tools/generate-image.ts`

## API Usage
Response structure: `choices[0].message.images[0].image_url.url` (base64 data URL).
NOT in `content` field — images are in a separate `images` array.

## Capabilities
- Excellent at: dark abstract backgrounds, neural networks, silhouettes, geometric patterns, flat vector art, atmospheric scenes
- Works for: video backgrounds, thumbnails (without text), illustration-only scene cards
- **DOES NOT work for Chinese text** — garbles CJK characters. Always use "no text" in prompt.

## Integration with DeepDive
New `image` scene type in DeepDive.tsx:
- Full-bleed image with Ken Burns effect (1.0→1.08 scale, subtle pan)
- Dark gradient overlay for text readability
- Title text at top, caption at bottom, subtitle from narration
- Spec field: `imageSrc` pointing to `public/images/*.png`

## Workflow for Covers
1. Generate illustration-only image (no text in prompt)
2. Copy to `public/images/`
3. Overlay title text via ffmpeg: `ffmpeg -i image.png -vf "drawtext=text='标题':fontfile=NotoSansSC-Bold.otf:fontsize=64:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" cover.png`
4. Or use as `imageSrc` in DeepDive scene and extract frame

## Cost Analysis
At $0.04/image:
- 25 images per dollar
- 250 images for $10
- Sufficient for all current and future specs

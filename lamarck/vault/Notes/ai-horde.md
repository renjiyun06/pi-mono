---
tags:
  - note
  - tool
  - image
description: "AI Horde free image generation API usage and limitations"
---

# AI Horde (Free Image Generation)

API: `https://aihorde.net/api/v2/` — community-powered Stable Diffusion, no API key needed (use `apikey: 0000000000`).

- Max free resolution: 576x576 (anonymous users). Upscale via ffmpeg lanczos.
- Typical wait time: 10-30s depending on queue.
- Output format: webp (convert to png via ffmpeg).
- Wrapper: `/home/lamarck/pi-mono/lamarck/projects/douyin/tools/lib/ai-horde.ts`
- Pollinations.ai is blocked from WSL (Cloudflare error 1033).

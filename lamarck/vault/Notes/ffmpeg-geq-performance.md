---
tags:
  - note
  - tool
  - video
---

# ffmpeg geq Performance

The `geq` (generic equation) filter is extremely slow for 1080x1920@30fps because it evaluates per-pixel per-frame. A 2.3s video took 2.5min CPU. The `random()` function is even worse and causes timeouts.

- `gradient` style (static geq): acceptable for <60s videos
- `gradient-shift` style (animated geq with T): very slow, avoid for longer videos
- `vignette` style: fast (built-in filter, not pixel-level)
- For better performance with animated backgrounds, consider pre-rendering a short loop and using `-stream_loop`

---
tags:
  - note
  - tool
  - video
description: "Remotion: React-based programmatic video creation — features, license, and potential for Douyin"
---

# Remotion

React-based framework for creating videos programmatically. 36.7k GitHub stars.

- **Site**: https://remotion.dev
- **GitHub**: https://github.com/remotion-dev/remotion
- **License**: Free for individuals and companies up to 3 employees. Company license required for larger orgs.

## Key Features
- Write video compositions as React components
- Frame-by-frame rendering to MP4 (via ffmpeg/Chrome headless)
- TailwindCSS support
- AI integration: has Claude Code skills (`npx skills add remotion-dev/skills`)
- Remotion Studio: web-based preview/editor
- Remotion Lambda: serverless rendering on AWS
- Templates: blank, hello-world, Next.js, React Router

## How It Works
1. Define a `Composition` with React components, fps, duration
2. Each frame is a function of `frame` number — React re-renders per frame
3. Use `useCurrentFrame()` and `interpolate()` for animations
4. Render with `npx remotion render` → outputs MP4

## Why It Matters for Douyin
- **Beyond terminal videos**: Could create rich animated content (data viz, explainers, infographics)
- **Programmatic**: Perfect for agent-driven video creation (we write code, it renders video)
- **React ecosystem**: Huge library of components, animations, chart libraries
- **AI-friendly**: Official Claude Code integration means we can prompt-to-video

## Compared to Current Pipeline
| Aspect | Current (terminal-video.ts) | Remotion |
|--------|---------------------------|----------|
| Visual style | Terminal text on black bg | Anything React can render |
| Animation | Typing effect only | Full animation library |
| Complexity | Simple, fast | More complex setup |
| Dependencies | ffmpeg only | Node.js + Chrome headless + ffmpeg |
| Render time | Seconds | Minutes (frame-by-frame) |
| Flexibility | Very limited | Unlimited |

## Setup in WSL
```bash
npx create-video@latest
cd my-video
npm install
npx remotion render src/index.ts MyComp out.mp4
```

Requires Chrome/Chromium headless for rendering. May need additional Linux packages in WSL.

## Potential Content Types
- Animated data visualizations (AI stats, trends)
- Text animation with transitions (not just terminal typing)
- Infographic-style explainers
- Chart animations
- Countdown/timer videos
- Image slideshow with effects

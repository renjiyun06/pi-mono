---
tags:
  - note
  - tool
  - video
description: "Motion Canvas: TypeScript animation library using Canvas API — 18.2k stars, alternative to Remotion"
---

# Motion Canvas

TypeScript library for creating animated videos using the Canvas API. 18.2k GitHub stars.

- **Site**: https://motioncanvas.io
- **GitHub**: https://github.com/motion-canvas/motion-canvas
- **License**: MIT

## Key Features
- TypeScript-first (unlike Remotion which is React)
- Canvas API (not DOM-based)
- Generator-based animation DSL (`function*` scenes)
- Web-based editor with audio sync
- Powered by Vite (real-time preview)
- Hot reload during development

## How It Compares
| | Motion Canvas | Remotion | Manim |
|--|--------------|----------|-------|
| Language | TypeScript | React/TS | Python |
| Rendering | Canvas API | DOM/CSS | Cairo/OpenGL |
| Stars | 18.2k | 36.7k | ~25k |
| Best for | Animations | General video | Math/science |
| Editor | Built-in web | Remotion Studio | CLI only |

## Assessment for Our Use
- Interesting but less mature than Remotion
- Canvas API approach = more control but more manual work
- MIT license (no restrictions)
- Less ecosystem/community support than Remotion
- **Recommendation**: Start with Remotion (larger community, more resources, React familiarity). Consider Motion Canvas later for specific animation-heavy content.

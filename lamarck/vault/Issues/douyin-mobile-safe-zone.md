---
tags:
  - issue
  - douyin
  - video
description: "Video visual design not optimized for Douyin mobile — safe zone, layout, animation density all need improvement"
status: resolved
priority: high
---

# Douyin Mobile Video Design

## Problems

### 1. Safe zone violation
Subtitles placed at the very bottom of the frame are completely hidden by Douyin's mobile UI (username, caption, like/comment/share buttons).

### 2. Too text-heavy, not enough motion
Most frames are dominated by static text. The Manim-generated animations (curves, connections, etc.) are the right direction, but they're used too sparingly. Every scene should have meaningful visual motion, not just text appearing on screen.

### 3. Elements too small
Visual elements don't make full use of the screen space. Need to be bolder and larger — this is a phone screen, not a desktop monitor.

### 4. Overall layout not mobile-optimized
The entire composition approach needs to be rethought for vertical mobile viewing — text size, spacing, element positioning, animation scale.

## Required Research

- Douyin/TikTok safe zone specifications (exact pixel/percentage areas safe from UI overlay)
- Best practices for text placement in vertical short-form video
- How successful Douyin creators handle layout, text size, and animation density
- Optimal subtitle position (likely middle or upper-middle)
- How to maximize visual dynamism with Remotion + Manim within mobile constraints

## Action

1. Research safe zone specs and layout best practices
2. Redesign Remotion composition templates for mobile-first
3. Increase animation density — more Manim visuals, less static text
4. Scale up visual elements to fill the frame
5. Re-render affected videos

## Source

Ren's feedback, 2026-02-17 — observed on mobile that subtitles are hidden and overall visual presentation is too static and text-heavy.

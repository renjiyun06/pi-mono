---
tags:
  - note
  - infra
  - wsl
description: "/mnt/d/wsl-bridge/ is only for Douyin publish workflow staging — not a general file sharing directory"
priority: high
---

# WSL Bridge Directory

Location: `/mnt/d/wsl-bridge/`

## Purpose

**Only** for the Douyin publish workflow — temporary staging for video files that need to be uploaded via Windows-side browser automation.

## Rules

- Do NOT put project files, HTML apps, or other artifacts there for Ren to view
- Windows side does not have the toolchain needed for most WSL artifacts
- This is not a general WSL↔Windows file sharing directory
- Internal outputs (rendered videos, test frames, generated images, etc.) should stay in WSL filesystem (e.g., `/tmp/`, project directories)

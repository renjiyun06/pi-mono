---
tags:
  - meta
---

# Environment

## System
- Host: WSL2 Ubuntu 24.04 on Windows (DESKTOP-Q5Q2VL9), user: lamarck
- sudo password: lamarck123 (agent has full admin access)

## Runtime
- Node
- Python: 3.10.12, default venv at /home/lamarck/pi-mono/lamarck/pyenv/
- uv
- ffmpeg 4.4.2
- gh (GitHub CLI) 2.4.0

## System Packages
- fonts-noto-cjk (Chinese font for video generation)
- fonts-noto-color-emoji (emoji support in video generation)
- python3-pip (pip3 for system Python)
- zstd (required by Ollama installer)
- libnspr4, libnss3, libatk1.0-0, libatk-bridge2.0-0, libcups2, libdrm2, libxkbcommon0, libxcomposite1, libxdamage1, libxfixes3, libxrandr2, libgbm1 (Chrome headless deps for Remotion)
- libcairo2-dev, libpango1.0-dev, pkg-config (Manim/pycairo build deps)
- texlive, texlive-latex-extra (LaTeX for Manim)

## Python Packages

### System Python (python3 / pip3)
- edge-tts 7.2.7 (TTS, free Microsoft Edge voices)
- aiohttp 3.13.3 (edge-tts dependency)
- manim 0.19.1 (mathematical animation library, 3Blue1Brown-style)
- duckduckgo-search 8.1.1 (free web search, no API key needed)

### pyenv venv (/home/lamarck/pi-mono/lamarck/pyenv/)
- faster-whisper (ASR)
- edge-tts (TTS, also available here)

## Services

## API Keys (stored in /home/lamarck/pi-mono/.env)
- TAVILY_API_KEY
- OPENROUTER_API_KEY
- GITHUB_TOKEN

## Data Storage
- Database: /home/lamarck/pi-mono/lamarck/data/lamarck.db
- Table schemas: /home/lamarck/pi-mono/lamarck/data/schemas/ (one .sql file per table, filename = table name)
- Videos: /home/lamarck/pi-mono/lamarck/data/videos/
- Transcripts: /home/lamarck/pi-mono/lamarck/data/transcripts/

## Reference Repos
Location: /home/lamarck/repos/ (all reference projects must be cloned here)
- NapCatQQ — QQ Bot protocol (OneBot 11)
- WeChatFerry — WeChat PC Hook (unusable, waiting for sdk.dll to support new WeChat version)
- openclaw — Multi-channel architecture reference
- obsidian-skills — Agent skills for Obsidian

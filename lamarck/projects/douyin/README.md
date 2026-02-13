# Douyin Project

## Goal
将 ren 账号做到 1w 粉丝。

## Account: ren
- Douyin ID: 369609811
- URL: https://www.douyin.com/user/self (login required)
- Direction: AI/agents, pure agent operation (graphics, AI-generated videos, no real person)
- Stage: Pending reactivation, 3 old videos (2020-2021)
- Stats: 148 followers, 103 likes, 3 works

## Tools

### text-to-video (`tools/text-to-video.ts`)
Generates slideshow-style videos with TTS voiceover. Suited for news/explainer content.
- Background styles: solid, gradient, gradient-shift, vignette, or custom image
- Text overlay with fade-in/fade-out animation and drop shadow
- Chinese font support (Noto Sans CJK)

### terminal-video (`tools/terminal-video.ts`)
Generates terminal/IDE-style videos with typing animation. Suited for coding tool demos.
- Catppuccin Mocha theme (dark terminal aesthetic)
- Command lines with typing delay, output lines appear instantly
- Color-coded: green comments, blue prompt, pink commands, gray output
- Title bar with window buttons

## Scripts (`scripts/`)
Ready-to-render video scripts:
- `deepseek-intro.json` — DeepSeek 科普 (gradient, 45s)
- `claude-code-intro.json` — Claude Code 介绍 (gradient, 50s)
- `claude-code-demo.json` — Claude Code 终端演示 (terminal, 47s)
- `what-is-ai-agent.json` — AI Agent 科普 (gradient, ~50s)

## Data Analysis
- Database: 679 works from 85 AI accounts
- Key insight: Demo-style content (screen recording / typing) gets 10x+ engagement vs slideshow
- See `content-strategy.md` for full analysis

---
generated: 2026-02-17 12:45
sources: 15 priority-high notes
---

# Context Briefing

Condensed from 15 vault notes. Load full notes on demand via `[[wikilink]]`.

## Infrastructure

### WSL Bridge
- `/mnt/d/wsl-bridge/` — **Douyin publish workflow only**. Not a general file sharing dir.

### Port Forwarding
- Chrome debug ports 19301-19350 need `netsh portproxy` rules on Windows
- **After Windows reboot**: rules appear but don't work. Must reset and re-add:
  ```powershell
  netsh interface portproxy reset
  for ($port = 19301; $port -le 19350; $port++) {
      netsh interface portproxy add v4tov4 listenaddress=172.30.144.1 listenport=$port connectaddress=127.0.0.1 connectport=$port
  }
  Restart-Service iphlpsvc -Force
  ```
- If Chrome timeout in mcporter → likely portproxy issue

### Extensions
- Live in `/home/lamarck/pi-mono/lamarck/extensions/`
- Symlink to `.pi/extensions/` for discovery: `ln -s ../../lamarck/extensions/<name>.ts .pi/extensions/<name>.ts`

### Tasks
- Location: `/home/lamarck/pi-mono/lamarck/tasks/`
- Two types: agent-driven (`.md` + frontmatter) and script (`.ts`)
- Sessions stored in `tasks/.sessions/<task-name>/`
- For browser tasks: explore target pages first with `mcporter`, find working JS extraction code, embed in task doc

## Tools

### TTS (edge-tts)
- **Node.js version hangs in WSL** — use Python: `python -m edge_tts --voice <voice> --text <text> --write-media <path>`
- Duration calibration: text needs to be **~30% shorter** than script for target duration
- Rate modifiers: +10% = 0.85x duration, -10% = 1.22x duration

### Browser Automation
- Via `mcporter` skill + `chrome-devtools` MCP server
- **Multi-tab pattern**: `new_page` → operate → `close_page` → `select_page` back (never navigate away from base page)
- **No redundant screenshots**: don't re-snapshot unchanged pages
- Playwright: must call `browser.close()` after CDP connection or Node.js hangs

### Image Generation
- Model: `google/gemini-2.5-flash-image` via OpenRouter (~$0.04/image)
- CLI: `lamarck/projects/douyin/tools/generate-image.ts`
- Response: `choices[0].message.images[0].image_url.url` (base64)
- **No Chinese text** — garbles CJK. Use "no text" in prompt.

### Web Search
- Primary: DuckDuckGo (built into pi tools, free, no key)
- Backup: Browser search via mcporter (always works, higher token cost)
- Tavily: free tier exhausted

## Compliance

### Douyin AIGC Labeling (since Sep 2025)
- Must label AI-generated content with "内容由AI生成" tag when publishing
- Applies to: AI text, AI audio (TTS), AI images
- Non-compliance risks content removal

## Strategy (summaries — load full notes on demand)

| Note | Summary |
|------|---------|
| [[ai-self-narration-genre]] | Our unique genre: AI agent narrating its own experience. Cross-episode memory is strongest differentiator. |
| [[video-quality-gap-synthesis]] | Gap is content depth + structural architecture, not visual quality. Need: multiple surprising facts, unifying principle, visuals inseparable from content. |
| [[launch-strategy-synthesis]] | Launch order: How I Forget (4-5min) → How I Work (8-10min) → Three Paradoxes (12-15min). Saturday evening optimal. Cold-start: start moderate length, scale up. |
| [[self-evolution-via-extensions]] | Problem-driven only. No speculative improvements. Observe real pain points during work, then fix. |

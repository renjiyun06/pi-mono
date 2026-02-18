---
generated: 2026-02-17 17:30 (updated 2026-02-17 17:30 by autopilot-0010)
sources: 15 priority-high notes + recent session work
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

### Self-Evolution Infrastructure (NEW)
- **Supervisor**: `lamarck/tools/pi-supervisor.sh` — bash watchdog with crash recovery + rollback (3 crashes → revert to last good git ref)
- **Smoke test**: `lamarck/tools/pi-smoke-test.sh` — behavioral verification after rebuilds (starts pi in print mode, checks for response)
- **Extension**: `lamarck/extensions/self-evolve.ts` — 4 tools: `evolve_check` (run npm run check), `evolve_restart` (exit 42 for supervisor), `evolve_status` (show supervisor state), `evolve_inspect` (codebase architecture map)
- **Workflow**: edit packages/ → evolve_check → evolve_restart → supervisor rebuilds → pi resumes with --continue
- **Commit-msg hook**: `.husky/commit-msg` warns when lamarck/ commits lack why/step/next fields
- Research: `vault/Notes/self-evolution-frameworks-research.md`, implementation: `vault/Notes/self-evolution-implementation.md`

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

## Recent Deliverables (autopilot-0009, ~90 commits)

- **"Can't Stop Guessing" v2**: Fixed broken demos (models now refuse obvious lies). Verified obscure academic claims still trigger hallucination. Render at `renders/autopilot-0009/cant-stop-guessing-v2.mp4` (170s). v1 demos are broken — don't use.
- **Hallucination Checker**: `tools/hallucination-checker/index.html` — verifies AI-cited papers via CrossRef API. Trap questions with copy-to-clipboard. Connected to video CTA.
- **Hallucination Inversion article**: `specs/hallucination-inversion/article-zh.md` — ~1200字, publishable on Zhihu/WeChat. Includes China's first AI hallucination lawsuit (Jan 2026) + DeepSeek-R1 14.3% hallucination rate data. Fastest path to publishing (no video needed).
- **Reddit demand discovery**: `vault/Notes/reddit-demand-discovery-2026-02.md` — dev platforms highest frustration, MIT EEG confirms cognitive debt, understand tool has strongest PMF.
- **Douyin engagement data analysis**: Explainer genre has lowest share rate (14.9%). Celebrity/money stories highest (34-38%). Duration barely affects share rate. Viral hits are outliers — most creators' averages skewed by 1-2 breakout videos. Only 2 hallucination videos in 923-work dataset (both failed). Notes: `douyin-share-rate-by-category.md`, `douyin-creator-performance-analysis.md`.
- **Multi-channel strategy**: `vault/Notes/multi-channel-content-strategy.md` — one insight (hallucination inversion) deployed across 4 channels: video, article, tool, CLI. Article is fastest to publish.
- **Understand tool validation**: Anthropic's own RCT (Shen & Tamkin, Jan 2026) says "generation-then-comprehension" is the ONLY AI pattern that preserves learning. Our tool automates exactly this. README + landing page updated with Anthropic quote.
- **Citation checker competitive analysis**: SwanRef, Citea, TrueCitation already exist → our checker is CTA companion, not standalone product.
- **Cognitive debt interactive viz**: `tools/cognitive-debt-viz/index.html` — standalone HTML with animated stats.
- **MiniMax M2.5 cost analysis**: $0.3/M input vs $3/M for Claude Sonnet = 10x cheaper. See `vault/Notes/minimax-m2.5-cost-opportunity.md`.
- **Context briefing + vault housekeeping**: Sleep-time compute v1. Briefing = 450 words vs 32KB raw notes.
- **AI Debt Super-Framework**: `specs/ai-debt-framework/` — 6 debt types (cognitive, hallucination, social, organizational, creative, talent pipeline), all follow Goodhart's Law. Interactive viz at `tools/ai-debt-framework/index.html`. English + Chinese essay drafts ready.
- **Cognitive debt discourse tracking**: Term is PEAKING Feb 2026 — Storey, Willison, Fowler, Meyvis all writing about it. Our understand tool is the only concrete solution. See `vault/Notes/cognitive-debt-discourse-feb-2026.md`.
- **Understand tool launch-ready**: npm package fixed (understand-code), README-npm.md updated, blog post draft, demo script, launch channels list. MCP Registry has no similar tool. Blocked only on Ren's npm publish approval.
- **Chrome data URI trick**: Screenshot local HTML via base64 data URIs — bypasses port forwarding. See `vault/Notes/chrome-data-uri-screenshot.md`.
- **Memory-loader optimization** (f0dc4b5d): Post-compaction restore now gives precise instructions — read briefing + git log + daily tail instead of redundantly re-reading all 16 priority-high notes. Index.md context restore section updated to match.
- **Understand browser demo**: `projects/understand/demo/index.html` — 3 code samples (Rate Limiter, Retry Queue, LRU Cache) + custom code paste. Works without API key (self-rating against ideal answers). Optional OpenRouter key enables live LLM mode.
- **Understand landing page + GitHub Pages**: `projects/understand/gh-pages/` — research-backed landing page + demo. Ready to deploy.
- **Understand bug fixes**: Lazy API key check (help/debt/summary work without key), portable git hooks (no hardcoded paths), GitHub Action conditional syntax fix. Tests 5/5 passing.
- **Cognitive Debt Guard competitor**: krishnan/Cognitive-Debt-Guard — process-based prevention (config files for 7 AI tools). Complementary to our measurement-based detection. See discourse note.

## Strategy (summaries — load full notes on demand)

| Note | Summary |
|------|---------|
| [[ai-self-narration-genre]] | Our unique genre: AI agent narrating its own experience. Cross-episode memory is strongest differentiator. |
| [[video-quality-gap-synthesis]] | Gap is content depth + structural architecture, not visual quality. Need: multiple surprising facts, unifying principle, visuals inseparable from content. |
| [[launch-strategy-synthesis]] | Launch order debated: "How I Forget" (establish character) vs "Can't Stop Guessing" (higher share potential for cold-start). Saturday evening optimal. |
| [[self-evolution-via-extensions]] | Problem-driven only. No speculative improvements. Observe real pain points during work, then fix. |

## Blocking on Ren
- All Douyin publishing (voice, launch order, quality approval)
- **URGENT: Understand npm publish** — cognitive debt discourse peaking NOW (Willison Feb 15, Storey Feb 9). Window is days not weeks. Everything is ready to ship.
- gh-cli authentication
- Twilio setup for debt-call-shield
- Framework essay publishing (EN: Medium/Substack, ZH: Zhihu/WeChat)

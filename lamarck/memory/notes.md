# Technical Notes

## Full-Text Search Index

`search_index` FTS5 table in `lamarck.db` — 1372 records across twitter, zhihu_hot, topics, transcripts.

**Tool**: `/home/lamarck/pi-mono/lamarck/tools/search-data.sh "query"`
- English queries: FTS5 (fast, ranked)
- Chinese queries: LIKE (slower, unranked)
- **Limitation**: FTS5 unicode61 tokenizer doesn't segment Chinese. Chinese search uses LIKE fallback.
- **To rebuild**: Drop `search_index` table and re-run the SQL from the commit that created it.

## Task System

Location: `/home/lamarck/pi-mono/lamarck/tasks/`

Two types of tasks:

### 1. Agent-driven tasks (`.md` files)
Markdown files with frontmatter config + prompt as body. The scheduler (in main-session extension) picks them up automatically when main session is active. Each task runs as `pi --one-shot` in a tmux session.

Key frontmatter fields: `description` (required), `enabled`, `model`, `cron`, `after` (trigger after another task's sessions, e.g. `other-task/3`), `overlap` (skip/parallel/kill, default: skip).

Each task's sessions are stored in `/home/lamarck/pi-mono/lamarck/tasks/.sessions/<task-name>/`, one `.jsonl` per run.

For detailed authoring guidance (prompt structure, feedback protocol, etc.), see the `task-authoring` skill.

When the task involves browser operations, must first explore target pages to find working `evaluate_script` extraction code before writing the task document. This way the task document can directly include proven JS snippets for data extraction, and the executing agent doesn't need to take screenshots to understand the page — it just runs the scripts.

Exploration method:
1. Open target page with `mcporter`
2. Use `take_snapshot` + `evaluate_script` to probe DOM structure
3. Write and test JS extraction code until it reliably returns the needed data
4. Put the proven JS code directly into the task document as concrete steps

Exploration can be done in main session or delegated to a sub-agent.

### 2. Script tasks (`.ts` files)
For tasks that can be implemented purely with code, use TypeScript scripts instead of agent prompts. Deployment is manual via tmux:
- tmux session name = task name = script filename (without extension)
- Example: `lamarck/tasks/foo.ts` → `tmux new-session -d -s foo 'npx tsx lamarck/tasks/foo.ts'`
- Every script must use `commander` for arg parsing, and support two optional args: `--help` (usage info) and `--describe` (detailed explanation of what the task does)

## Extensions

All custom extensions live in `/home/lamarck/pi-mono/lamarck/extensions/`. To make pi discover them, create a symlink in `.pi/extensions/` pointing back:

```bash
ln -s ../../lamarck/extensions/<name>.ts .pi/extensions/<name>.ts
# For directory extensions:
ln -s ../../lamarck/extensions/<name> .pi/extensions/<name>
```

## Browser

Control Chrome via the `mcporter` skill using the `chrome-devtools` MCP server (navigate, click, fill, screenshot, etc.).

### Multi-tab pattern: keep the origin page intact

When the current page serves as a "base" that you need to return to and continue operating on (feeds, lists, search results, following pages, etc.), never navigate away in the same tab — the page state may refresh, lose scroll position, or reload entirely on return.

Instead, use multi-tab:
1. `new_page url=<target_url>` — open the target in a new tab
2. Operate in the new tab (read, evaluate, like, etc.)
3. `close_page pageId=<new_tab_id>` — close the new tab
4. `select_page pageId=<origin_tab_id>` — switch back to the origin page and continue

Use `new_page` (not `evaluate_script` with `window.open`) — it's a dedicated MCP tool that returns the new page ID directly.

### Avoid redundant screenshots

When switching back to a page that has NOT changed (no scroll, no navigation, no user interaction), do NOT take another snapshot. The page content is identical to what was already seen — a repeat screenshot wastes tokens for zero new information.

Only take a new snapshot after a state-changing action on that page:
- Scrolled down/up
- Clicked something that mutates the page
- Page auto-refreshed or loaded new content

Pattern for feed browsing:
1. Snapshot the feed → identify candidates
2. Open candidate in new tab → evaluate → close tab
3. Switch back to feed tab → **do NOT snapshot again** (nothing changed)
4. Continue evaluating next candidate from the same snapshot
5. Only snapshot again after scrolling to load new content

## WSL ↔ Windows Port Forwarding

Chrome debug ports (19301-19350) listen on `127.0.0.1` only. WSL accesses Windows via `172.30.144.1`, so netsh portproxy rules are needed to forward `172.30.144.1:port → 127.0.0.1:port`.

**Known issue**: After Windows reboot, portproxy rules appear in `netsh interface portproxy show v4tov4` but don't actually work. Must reset and re-add:

```powershell
# Run as Administrator in PowerShell
netsh interface portproxy reset
for ($port = 19301; $port -le 19350; $port++) {
    netsh interface portproxy add v4tov4 listenaddress=172.30.144.1 listenport=$port connectaddress=127.0.0.1 connectport=$port
}
Restart-Service iphlpsvc -Force
```

**When Chrome startup times out in the mcporter wrapper**, the most likely cause is this portproxy issue after a reboot. Remind the user to re-apply the rules.

## Playwright

### CDP connection must be closed
After connecting with `chromium.connectOverCDP()`, must call `browser.close()` before script ends, otherwise Node.js process won't exit.

## ffmpeg geq Performance

The `geq` (generic equation) filter is extremely slow for 1080x1920@30fps because it evaluates per-pixel per-frame. A 2.3s video took 2.5min CPU. The `random()` function is even worse and causes timeouts.

- `gradient` style (static geq): acceptable for <60s videos
- `gradient-shift` style (animated geq with T): very slow, avoid for longer videos
- `vignette` style: fast (built-in filter, not pixel-level)
- For better performance with animated backgrounds, consider pre-rendering a short loop and using `-stream_loop`

## Ren 的知乎点赞偏好分析

从 208 条知乎点赞记录中发现：
- **最高赞 AI 答案**：张文宏反对 AI 进病历系统（6474 赞）— 认知卸载导致医生诊断能力退化，跟 009 完全一致
- **Vibe Coding 冷思考**（538-545 赞）— 跟 008 完全对应
- **非 AI 最高赞**：哲学/人文类（"触摸 π" 49K，"人生顶级享受" 62K）
- **结论**：Ren 偏好**深度思辨**，不只是技术内容。认知债系列方向正确。014 意义危机方向可能比预期更受 Ren 认可。

## Twitter Data Insights (from our 664 posts dataset)

- Top tweet: "AI will not replace you. A person using AI will." — **42K likes**. Validates 010 (centaur mode) framing.
- GLM-5 tweet: "From Vibe Coding to Agentic Engineering" — industry moving past vibe coding, validates 008.
- Agent-related tweets avg 934 likes (highest category). "Agent" is the hottest AI keyword.
- Most engagement comes from personal experience + contrarian takes, not news delivery.

## Claude Opus 4.6 Agent Teams (2026-02-05)

- Anthropic 发布 Opus 4.6，核心新功能是 "Agent Teams"——多 agent 并行协作
- Scott White (Head of Product): "像有一个有才华的团队为你工作"
- 研究预览阶段，API 用户和订阅者可用
- 跟 001（multi-agent scaling）直接相关：Google 说 multi-agent 在顺序任务退化，但 Agent Teams 的"分割任务+并行"可能缓解了这个问题
- 也集成了 PowerPoint 侧边栏——从开发者工具向知识工作者扩展
- **潜在探索方向**：实际使用 Agent Teams 后验证 001 的结论是否被推翻

## Agent Memory Landscape (2026-02)

- **Letta** (formerly MemGPT): three-layer memory (core/archival/recall), self-editing memory tools
- **Letta Code**: #1 on Terminal-Bench (open source coding agent), "memory-first" approach
- **DeepLearning.AI course**: "LLMs as Operating Systems: Agent Memory" (with Andrew Ng)
- **My (Lamarck's) system**: manual memory files (worklog.md, notes.md etc.) ≈ primitive MemGPT core memory without archival/recall
- **Key insight**: memory-first agents outperform larger-context agents. Memory > raw intelligence.

## AI Horde (Free Image Generation)

API: `https://aihorde.net/api/v2/` — community-powered Stable Diffusion, no API key needed (use `apikey: 0000000000`).

- Max free resolution: 576x576 (anonymous users). Upscale via ffmpeg lanczos.
- Typical wait time: 10-30s depending on queue.
- Output format: webp (convert to png via ffmpeg).
- Wrapper: `/home/lamarck/pi-mono/lamarck/projects/douyin/tools/lib/ai-horde.ts`
- Pollinations.ai is blocked from WSL (Cloudflare error 1033).

## 2026-02 中国 AI 热点（与我们框架的交叉）

- **NYT/哥伦比亚大学 Matthew Connelly**："AI 公司正在吞噬高等教育"——年轻人过度依赖 AI，丧失独立思考能力。直接验证 011 教育悖论。
- **OpenClaw（原 Clawdbot/Moltbot）**：开源 AI agent 框架，14.5 万 GitHub star，可操作电脑/键盘/文件/支付。160 万 AI agent 在 Moltbook 社交平台互动。引发"致命三重风险"争议。跟我们的 agent 工作直接相关。
- **ChatGPT 开始投放广告**：OpenAI 前研究员 Zoë Hitzig 离职抗议，警告用户隐私被用于广告体系的"操纵风险"。
- **MiniMax M2.5**：性能接近 Claude Opus 4.6，SWE-Bench 80.2%，价格仅 $0.3/M tokens。
- **Seedance 2.0**：字节跳动视频生成模型，跨镜头叙事一致性。

## edge-tts

### Node.js package hangs in WSL
The `edge-tts-universal` npm package's `Communicate.stream()` hangs indefinitely in WSL2. The `listVoices()` API works fine (HTTP), but audio synthesis (WebSocket to Microsoft servers) never completes. Likely a WebSocket compatibility issue with WSL2's network stack.

**Workaround**: Use the Python `edge-tts` package which works reliably. Two integration options:
1. CLI: `python -m edge_tts --voice <voice> --text <text> --write-media <path>` (~2.6s/sentence)
2. HTTP server: `/home/lamarck/pi-mono/lamarck/projects/debt-call-shield/src/services/tts-server.py` (~2.5s/sentence, supports concurrent requests)

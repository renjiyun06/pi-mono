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

## 记忆系统改进想法

**Sleep-time memory consolidation**（受 Letta 启发）：
- 在 compact 前自动运行"记忆整理"——压缩 worklog、更新索引、清理过时信息
- 类似人类睡眠中的记忆整合（sleep consolidation）
- 实现方式：pi extension 或 compact hook，在 context 达到阈值前触发
- 需要修改 `packages/coding-agent` 源码，需 Ren 审阅

**Archival memory（语义检索）**：
- 当前最大缺失——无法从历史中按语义搜索
- 简单方案：sqlite FTS5（已有搜索索引 1372 条），但不覆盖探索笔记和 worklog
- 更好方案：向量数据库（需要 embedding model，可用 Ollama local）
- 优先级：中。等 Ollama 安装后可以试

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

## AI 视频生成工具

### 即梦/Dreamina/Seedance
- **即梦**（中国版）: `https://jimeng.jianying.com/ai-tool/home` — 需登录，有免费积分
- **Dreamina**（国际版）: `https://dreamina.capcut.com/ai-tool/home` — 完全免费无限
- **BytePlus ModelArk API**: `https://ark.ap-southeast.bytepluses.com/api/v3` — 新用户 2M 视频 tokens
- **Seedance 1.5 Pro**: 最新版本，支持音视频联合生成、多镜头叙事、多语言对话
- **Seedance 2.0**: 四模态参考系统（图片+视频+音频+文字），最多 12 个参考文件

### AI 视频制作核心方法论（from 大圆镜科普）
- **"生图先行"**: 先用文生图锁定画面质量，再做图生视频
- **参考图权重最高**: 导演风格/电影参考放提示词第一行
- **图生视频 prompt 越简单越好**: 推/拉/摇/移，用具体动作代替抽象情感
- **10:1 报废率是正常的**: 每个镜头平均生成 10 次才定稿
- **10 轮筛选**: 第 1 轮保构图 → 第 2 轮调影调 → 第 3 轮修正人物结构 → ...
- **风格种子**: 将满意的生成结果保存为后续参考底图，形成固定风格

### Prompt 公式
- **文生图**: 主体+外观描述+环境+风格+光影+构图
- **图生视频**: Subject + Movement + Camera movement（越简单越好）
- **Seedance 1.5 Pro**: Subject + Movement + Environment + Camera + Aesthetic + Sound
- **Seedance 2.0 万能公式**: 主体 + 动作 + 场景 + 光影 + 镜头语言 + 风格 + 画质 + 约束

### Seedance 2.0 实战要点
- **@ 语法是核心**: `@图片1 作为首帧`、`参考@视频1的运镜`、`@音频1 作为配乐`
- **稳定性约束词必加**: "五官清晰、面部稳定、不扭曲、不变形、人体结构正常"
- **画质词必加**: "4K、超高清、细节丰富、无模糊、无重影、画面稳定"
- **动作描述用慢词**: 缓慢/轻柔/连贯/自然/流畅，避免夸张高速复杂
- **分段生成**: 不一口气 15 秒，分 3 段 5 秒，每段截图作下段参考（影视飓风 Tim 方法）
- **九宫格分镜法**: 3x3 关键帧 + 一句 prompt → 一致性提升 50%（@氪学家方法）
- **即梦登录**: 抖音/剪映账号通用，无需单独注册

### OmniHuman 1.5 数字人 API
- **能力**: 单张图片 + 音频 → 口型同步视频（支持动漫/卡通角色）
- **火山引擎 API**: `https://visual.volcengineapi.com?Action=CVSubmitTask&Version=2022-08-31`（提交）/ `CVGetResult`（查询）
- **BytePlus 国际版**: `https://www.byteplus.com/en/product/OmniHuman` — 确认可用
- **限制**: 音频最长 30 秒，不支持双人对话
- **认证**: 火山引擎签名式（HMAC-SHA256），BytePlus 认证方式待确认
- **对 Lamarck 的价值**: 用 AI 生成的卡通形象图 + edge-tts 音频 → OmniHuman 生成口播视频 → 比 canvas 手绘高出几个量级
- **推荐方案**: OmniHuman 口播（开场/过渡/结尾） + Seedance 场景画面 → 混合剪辑
- **探索文档**: `/home/lamarck/pi-mono/lamarck/projects/douyin/exploration/026-omnihuman-digital-avatar.md`

### Seedance API 对接（两条路径）
- **火山方舟（国内）**: `https://ark.cn-beijing.volces.com/api/v3`，model ID 前缀 `doubao-`，需中国手机号注册
- **BytePlus（国际）**: `https://ark.ap-southeast.bytepluses.com/api/v3`，model ID 无前缀，国际邮箱注册
- **认证**: `Authorization: Bearer $ARK_API_KEY`
- **异步模式**: POST 创建任务 → 返回 task ID → GET 轮询直到 succeeded → 下载 video_url（24h 过期）
- **免费额度**: 每个模型 200 万 tokens（≈8 个 1080p 5s 视频）
- **最新可用 API 模型**: Seedance 1.5 Pro（有声视频）。**Seedance 2.0 于 2/12 上线体验中心，API 预计二月中下旬（~2/24前后）开放**
- **我们的成本**: 5 镜头 55s 视频 ≈ ¥10-20（无声）/ ¥20-58（有声+报废率）
- **Draft 模式**: 480p 预览，token 减少 30-40%，用于快速验证 prompt
- **连续视频**: `return_last_frame: true` → 获取最后一帧作为下一段首帧

### 详细探索笔记
- `/home/lamarck/pi-mono/lamarck/projects/douyin/exploration/024-ai-video-generation-mastery.md`
- `/home/lamarck/pi-mono/lamarck/projects/douyin/exploration/025-seedance-api-integration.md`

## 抖音 AI 内容标识合规

《人工智能生成合成内容标识办法》2025-09-01 生效。抖音已上线 AI 内容标识功能。

**我们的视频**使用了 AI TTS（edge-tts）和 AI 生成背景（AI Horde），属于"部分 AI 生成合成内容"，发布时应：
1. 在抖音发布界面主动添加"AI 生成"标识
2. 抖音也会自动检测并补充标识

**不影响内容策略**——我们的账号定位本身就是"AI 运营"，标识反而强化了账号身份的真实性。

# Memory

Cross-session memory for the Lamarck experiment. The agent reads this file at the start of each new session and maintains it throughout conversations.

## User Preferences
- Language: 中文交流，代码和注释用英文
- Git: commit message 用英文，简洁直接
- Style: 技术导向，不要废话
- 搜索时优先用 web_search 工具（/web_search 开启），不要直接 curl API 凑合

## Environment
- tmux: 3.4, available at /usr/bin/tmux — 长时间任务必须用 tmux 执行（非阻塞，可监控进度，可中途打断）
- Host: WSL2 Ubuntu 24.04 on Windows (DESKTOP-Q5Q2VL9), user: lamarck
- sudo password: lamarck123 (agent has full admin access to this WSL instance)
- Node: v25.6.0, npm 11.8.0
- Python: 3.10.12, default venv at lamarck/pyenv/, use `uv pip install` for packages
  - faster-whisper: 已安装（small 模型已下载），用于语音转文字
  - venv 自动激活：~/.bash_env (激活脚本) + ~/.profile 设 BASH_ENV，交互式和非交互式 shell 均生效
  - ~/.bashrc 中 venv 激活在交互守卫之前，确保交互式终端也能用
- uv: 0.9.29 at ~/.local/bin/uv
- Chrome CDP: 通过 mcporter wrapper 实现多 agent 浏览器隔离
  - **mcporter wrapper**: `lamarck/bin/mcporter` 拦截 chrome-devtools 调用，为每个 pi 进程创建独立 Chrome 实例
  - 端口范围: 19301-19350（已在 Windows netsh portproxy 预配置）
  - 用户目录: `D:\chromes\chrome-{pid}/`（从 `D:\chrome` 复制）
  - 状态文件: `/tmp/pi-browser-{pid}.json`
  - **自动清理**: `.pi/extensions/browser-cleanup.ts` 监听 `session_shutdown` 事件，pi 正常退出时自动关闭浏览器
  - **手动清理**: 如果直接 kill tmux session，浏览器会残留，运行 `browser-cleanup` 脚本清理孤儿实例
  - **Playwright CDP 连接必须断开**：用 `chromium.connectOverCDP()` 连接后，脚本结束前必须调用 `browser.close()` 断开连接，否则 Node.js 进程不会退出
- NapCatQQ WebSocket: 172.30.144.1:3001 (Windows host, OneBot 11 正向 WS)
- mcporter: 项目级配置在 /home/lamarck/pi-mono/config/mcporter.json
  - 用法: `mcporter call <server>.<tool> key=value`
  - 使用默认 daemon 模式（之前的 ephemeral 模式会导致 snapshot 状态在调用间丢失，无法完成多步操作）
- TAVILY_API_KEY: stored in project root .env file
- OPENROUTER_API_KEY: stored in project root .env file, for image generation
- GITHUB_TOKEN: stored in project root .env file, also configured in ~/.git-credentials for git push
- Tavily DNS: direct access works in new WSL env, no /etc/hosts hack needed
- 临时文件目录: /tmp/（系统临时目录，任务生成的临时文件放这里）

## Project Context
- Project: Lamarck — self-growing agent experiment on pi-mono fork
- Branch: lamarck (main stays clean for upstream sync)
- Upstream: https://github.com/badlogic/pi-mono.git
- Origin: https://github.com/renjiyun06/pi-mono.git

## Capabilities Grown
- [2026-02-04] web_search extension: Tavily API, toggle with /web_search command
- [2026-02-04] mcporter skill: MCP server access via CLI, used with chrome-devtools-mcp
- [2026-02-06] QQ Bridge 实现完成，可通过 QQ 私聊与 agent 对话
- [2026-02-06] 视频转文字工具链：download-video.ts → extract-audio.ts → transcribe-audio.ts（faster-whisper small 模型）

- [2026-02-06] 图片生成工具 generate-image.ts：OpenRouter API，默认 Nano Banana 模型，支持图生图

## Active Projects
- douyin: 抖音自媒体账号管理 (lamarck/projects/douyin/)
  - 需求：脚本撰写、选题规划、素材收集、数据分析等
  - 工具：
    - 数据库：lamarck/data/lamarck.db (douyin_accounts, douyin_videos)
    - 视频/转录存储：lamarck/data/videos/, lamarck/data/transcripts/（已加入 .gitignore）
  - **账号1：Juno朱诺（Ai创业版）**
    - 抖音号：49314893776
    - 主页：https://www.douyin.com/user/MS4wLjABAAAAdU7bhZFhvcJ_9yBfQ1AokWUHdtT_8qhTSh5FG340ZfpHheBMewvaL0w7FzPKxHhC
    - 方向：AI/智能体，真人出镜
    - 阶段：试运营，2个作品，18粉丝，233赞（更新于 2026-02-08）
  - **账号2：ren**
    - 抖音号：369609811
    - 主页：https://www.douyin.com/user/self（需登录查看）
    - 方向：AI/智能体，纯 agent 运营（图文、AI生成视频，无真人）
    - 粉丝：148，获赞：103，作品：3（老视频 2020-2021）
    - 阶段：待重新激活

## Reference Repos
- 存放位置：/home/lamarck/repos/（第三方参考项目统一克隆到这里，不放在 pi-mono 内）
- /home/lamarck/repos/NapCatQQ — NapNeko/NapCatQQ, QQ Bot 协议端 (OneBot 11), TypeScript, 用于对接 QQ 渠道
- /home/lamarck/repos/WeChatFerry — wechatferry/wechatferry (社区接力版), 微信 PC Hook 机器人框架, TypeScript/Node.js
- /home/lamarck/repos/openclaw — clawdbot/clawdbot, 150k+ stars 自托管 AI agent, 参考价值：多渠道接入架构（Telegram/Discord/Slack/Signal/飞书/Line/WhatsApp 等），channel 抽象层、monitor/send 模式

## Agent 渠道接入（规划中）
- 目标：让用户能通过 QQ 或微信等 IM 渠道与本 agent 对话，不限于终端
- 核心入口：`createAgentSession()` from `@mariozechner/pi-coding-agent` SDK
- 参考：mom（packages/mom/）的 AgentRunner 架构

### QQ（NapCatQQ）— 已实现
- 代码位置：`lamarck/bridge/qq/`（独立 Node.js 项目）
- 启动：`cd lamarck/bridge/qq && npm start`（或用 tmux 后台运行）
- tmux 启动：`tmux new-session -d -s qq-bridge "cd /home/lamarck/pi-mono/lamarck/bridge/qq && npm start"`

#### 功能
- 私聊消息 → AgentSession → 回复
- 每个 user_id 一个 session，保持对话上下文
- `/new` 命令：重置会话
- 文本块实时发送（text_end 事件触发）

#### NapCatQQ 部署（Windows）
- 部署方式：一键包（NapCat.Shell.Windows.OneKey.zip），运行在 Windows 宿主机
- 安装路径：`C:\Users\wozai\Downloads\NapCat.Shell.Windows.OneKey\`
- 启动：`NapCat.44498.Shell\napcat.bat`
- **配置文件正确路径**：`NapCat.44498.Shell\versions\9.9.26-44498\resources\app\napcat\config\onebot11_<QQ号>.json`
- WebSocket 服务：`ws://172.30.144.1:3001`（从 WSL 访问 Windows）
- Bot QQ 号：3981351485

#### 图片格式
发送图片统一使用：`[image:/path/to/file.png]`

### 微信（WeChatFerry）
- 评估结论：目前不可用，暂缓
- WeChatFerry 新仓库(wechatferry/wechatferry): 1.9k stars, 2025-07 最后更新
- 底层 sdk.dll 绑定微信 3.9.12.17，微信已强制升级到 4.x，旧版无法登录
- 多个 issue 反映版本兼容问题（#73 2026-01, #71 2026-01, #67 2025-11）
- 封号风险：图片操作等有较高风险
- 必须在 Windows 上运行（hook PC微信），WSL 宿主机是 Windows 所以理论可行
- 用户更倾向微信，等 sdk.dll 适配新版微信后再尝试

## Tools
- lamarck/tools/ 下有一些实用小工具脚本，详见 lamarck/tools/INDEX.md

## SQLite 使用约定

### 查看表结构和注释
SQLite 会保留 CREATE TABLE 语句中的 `--` 注释：
```sql
SELECT sql FROM sqlite_master WHERE type='table' AND name='表名';
```

### 新增列时保留注释
SQLite 的 ALTER TABLE ADD COLUMN 无法添加注释。如需新增带注释的列，重建表：
```sql
-- 1. 创建新表（带完整注释）
CREATE TABLE new_table (
  col1 TEXT,  -- 注释1
  col2 TEXT,  -- 注释2
  new_col TEXT  -- 新列注释
);
-- 2. 迁移数据
INSERT INTO new_table (col1, col2) SELECT col1, col2 FROM old_table;
-- 3. 删旧表、重命名
DROP TABLE old_table;
ALTER TABLE new_table RENAME TO old_table;
```
数据量不大时直接用这种方式，保持注释完整。

## 数据采集与任务系统

### 设计思路
- **数据湖模式**：先让数据进来，不追求一开始就规整
- **解耦**：采集端只管往库里塞，处理端只管从库读，互不关心对方
- **容忍混乱**：content 字段可以是任何格式（JSON、文本、链接、文件路径），大模型自己理解

### inbox 表
```sql
CREATE TABLE inbox (
  id INTEGER PRIMARY KEY,
  source TEXT,           -- 来源
  content TEXT,          -- 内容（什么格式都行）
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);
```
- 4 个字段，极简
- 重复数据没关系，后续可去重
- 质量可以通过后续流程逐步提升

### 任务脚本（lamarck/tasks/）
- 持续运行的后台任务，跑在 tmux 里
- 与 tools/（一次性调用）区分
- 依赖：commander（参数解析）、tsx（运行 TypeScript）
- 操作数据库：直接用 sqlite3 命令行

**必须支持的参数**：
1. `--help` / `-h` — 显示简要用法（commander 自动提供）
2. `--describe` / `-d` — 显示详细描述，包括：
   - 目的：脚本做什么
   - 采集内容：具体采集哪些数据
   - 存储位置：数据存到哪里
   - 与抖音账号关系：如何用于内容创作
   - 运行参数：可用的命令行参数

### 部署方式
- 一个脚本一个 tmux session
- 轻量级脚本，系统可承受 200+ 个 session（测试过）
- 启动：`tmux new-session -d -s <task-name> "npx tsx lamarck/tasks/<script>.ts --options"`

### 子 agent 管理
- **正常关闭**（推荐）：`tmux send-keys -t <session> C-d` — 触发 session_shutdown 事件，浏览器自动清理
- **强制终止**（不推荐）：`tmux kill-session -t <session>` — 跳过清理，需手动运行 `browser-cleanup`
- 详见 `.pi/skills/sub-agent/SKILL.md`

### 两类任务
1. **简单轮询**：纯脚本定时检测，不需要 LLM（如监控博主更新）
2. **智能驱动**：需要 agent 参与（如搜索+分析）

## Decisions
- [2026-02-04] Extensions live in lamarck/extensions/, symlinked to .pi/extensions/ with relative paths
- [2026-02-04] API keys stored in .env, extension reads it directly (no need to export)
- [2026-02-04] Memory mechanism: simple markdown file, no extension needed, agent maintains it directly

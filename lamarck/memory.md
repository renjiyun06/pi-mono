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
- Python: 3.12.3, default venv at lamarck/pyenv/, use `uv pip install` for packages
  - faster-whisper: 已安装（small 模型已下载），用于语音转文字
  - venv 自动激活：~/.bash_env (激活脚本) + ~/.profile 设 BASH_ENV，交互式和非交互式 shell 均生效
  - ~/.bashrc 中 venv 激活在交互守卫之前，确保交互式终端也能用
- uv: 0.9.29 at ~/.local/bin/uv
- Chrome CDP: 172.30.144.1:19222 (Windows host via WSL gateway, remote debugging)
- NapCatQQ WebSocket: 172.30.144.1:3001 (Windows host, OneBot 11 正向 WS)
- mcporter: 项目级配置在 /home/lamarck/pi-mono/config/mcporter.json
  - 用法: `mcporter call <server>.<tool> key=value`
  - **必须设置 `lifecycle: "ephemeral"`**：否则 mcporter 会自动启动 daemon，导致多个子 agent 共享同一个 MCP 进程，状态会互相干扰
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
  - 昵称：Juno朱诺（Ai创业版）
  - 抖音号：49314893776
  - 主页：https://www.douyin.com/user/MS4wLjABAAAAdU7bhZFhvcJ_9yBfQ1AokWUHdtT_8qhTSh5FG340ZfpHheBMewvaL0w7FzPKxHhC
  - 方向：AI 时代的一人公司实验，OpenClaw 相关
  - 阶段：起步期，1个作品，14粉丝，221赞
  - 需求：脚本撰写、选题规划、素材收集、数据分析等
  - 工具：
    - 数据库：lamarck/data/lamarck.db (douyin_accounts, douyin_videos)
    - 视频/转录存储：lamarck/data/videos/, lamarck/data/transcripts/（已加入 .gitignore）

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

## Workflows

### 浏览器操作（共享资源）
Chrome 浏览器是共享资源，多个任务/用户可能同时在用。操作原则：
- **新开标签页**：任务开始时用 `new_page` 打开自己的标签页
- **在自己标签页操作**：不要动别人的标签页
- **关闭自己的标签页**：任务结束时用 `close_page` 关闭自己打开的所有标签页
- **不污染环境**：保持浏览器状态干净，不影响其他任务

### 长时间任务（tmux 后台执行）
适用场景：下载、转码、爬取等耗时操作
- `tmux new-session -d -s <name> "<command>"` 启动，不阻塞
- `tmux capture-pane -t <name> -p -S -1000` 查看进度
- `tmux send-keys -t <name> C-c` 中途打断
- `tmux kill-session -t <name>` 销毁

### 探索性子任务（异步派发）
适用场景：快速探索某个方向，不需要全程参与，边探索边调整

**临时目录约定**：
- 位置：`lamarck/tmp/<session-name>/`
- 每个 tmux session 对应一个子目录
- 子 agent 产生的所有文件放在对应目录里
- 不同会话之间隔离，文件名不冲突

**派发流程**：
```bash
# 1. 创建临时目录
mkdir -p lamarck/tmp/<session-name>

# 2. 启动子 agent（交互模式）
tmux new-session -d -s <session-name> "cd /home/lamarck/pi-mono && pi"

# 3. 发送任务（告诉它工作目录）
tmux send-keys -t <session-name> "你的任务是... 所有产生的文件放在 lamarck/tmp/<session-name>/" Enter

# 4. 派发后不等待，继续主对话
```

**监控和追加**：
```bash
# 查看进度
tmux capture-pane -t <session-name> -p -S -30

# 追加指令
tmux send-keys -t <session-name> "继续深入这个方向..." Enter

# 结束
tmux send-keys -t <session-name> C-c
tmux kill-session -t <session-name>
```

**原则**：
- 派发后立即返回，不阻塞主对话
- 子 agent 自主决定怎么探索、怎么存储
- 通过 capture-pane 随时可查进度
- 探索完成后结果在 `lamarck/tmp/<session-name>/` 里

### 并行多任务（tmux + git worktree + 子 agent）
适用场景：多个独立任务需要同时推进（写多个脚本、批量测试等）
1. 与用户商量任务拆分，确保各任务操作不同文件
2. 每个任务创建独立 worktree：`git worktree add /tmp/agent-N -b task/xxx`
3. 每个 worktree 启动独立 tmux session 跑 pi 子 agent
4. 主 agent 轮询 capture-pane 监控各任务进度
5. 全部完成后由主 agent 合并分支、处理冲突、清理 worktree
- 注意：子 agent 没有当前会话上下文，prompt 必须自包含；关注 API rate limit 和 token 成本

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

## TODO
- [ ] 微信渠道接入 — 用户认为微信更有代表性，需要重新评估 WeChatFerry 或寻找替代方案

## Decisions
- [2026-02-04] Extensions live in lamarck/extensions/, symlinked to .pi/extensions/ with relative paths
- [2026-02-04] API keys stored in .env, extension reads it directly (no need to export)
- [2026-02-04] Memory mechanism: simple markdown file, no extension needed, agent maintains it directly

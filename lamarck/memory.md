# Memory

Cross-session memory for the Lamarck experiment. The agent reads this file at the start of each new session and maintains it throughout conversations.

## User Preferences
- Language: 中文交流，代码和注释用英文
- Git: commit message 用英文，简洁直接
- Style: 技术导向，不要废话

## Environment
- Host: WSL2 Ubuntu 24.04 on Windows (DESKTOP-Q5Q2VL9), user: lamarck
- sudo password: lamarck123 (agent has full admin access to this WSL instance)
- Node: v25.6.0, npm 11.8.0
- Python: 3.12.3, default venv at lamarck/pyenv/ (auto-activated in .bashrc), use `uv pip install` for packages
- uv: 0.9.29 at ~/.local/bin/uv
- Chrome CDP: 192.168.1.4:19222 (user's Windows machine, remote debugging)
- mcporter chrome command: `mcporter call --stdio "chrome-devtools-mcp --browserUrl http://192.168.1.4:19222" <tool>`
- TAVILY_API_KEY: stored in project root .env file
- Tavily DNS: direct access works in new WSL env, no /etc/hosts hack needed

## Project Context
- Project: Lamarck — self-growing agent experiment on pi-mono fork
- Branch: lamarck (main stays clean for upstream sync)
- Upstream: https://github.com/badlogic/pi-mono.git
- Origin: https://github.com/renjiyun06/pi-mono.git

## Capabilities Grown
- [2026-02-04] web_search extension: Tavily API, toggle with /web_search command
- [2026-02-04] mcporter skill: MCP server access via CLI, used with chrome-devtools-mcp

## Active Projects
- douyin: 抖音自媒体账号管理 (lamarck/projects/douyin/)
  - 昵称：Juno朱诺（Ai创业版）
  - 抖音号：49314893776
  - 主页：https://www.douyin.com/user/MS4wLjABAAAAdU7bhZFhvcJ_9yBfQ1AokWUHdtT_8qhTSh5FG340ZfpHheBMewvaL0w7FzPKxHhC
  - 方向：AI 时代的一人公司实验，OpenClaw 相关
  - 阶段：起步期，1个作品，14粉丝，221赞
  - 需求：脚本撰写、选题规划、素材收集、数据分析等

## Tools
- lamarck/tools/ 下有一些实用小工具脚本，详见 lamarck/tools/INDEX.md

## Decisions
- [2026-02-04] Extensions live in lamarck/extensions/, symlinked to .pi/extensions/ with relative paths
- [2026-02-04] API keys stored in .env, extension reads it directly (no need to export)
- [2026-02-04] Memory mechanism: simple markdown file, no extension needed, agent maintains it directly

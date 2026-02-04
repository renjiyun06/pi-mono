# Session 2026-02-04_001

## Summary
项目初始化，建立 Lamarck 实验框架，创建 web_search extension 和 mcporter skill，搭建基础工具链。

## Tags
init, lamarck, web-search, tavily, mcporter, chrome-cdp, memory, extensions, tools

## Key Points
- 创建 lamarck/ 目录结构（journal/, extensions/, tools/, projects/）
- 建立 memory.md 跨会话记忆机制
- 写了 web_search extension（Tavily API），通过 /web_search 命令切换
- 配置 mcporter skill 用于 Chrome CDP 访问
- 创建 download-video.ts 和 extract-audio.ts 两个工具脚本
- 建立抖音项目 (lamarck/projects/douyin/)

## Issues Encountered
- WSL 环境需要安装各种依赖（uv, tavily 等）
- Extension 需要 symlink 到 .pi/extensions/，用相对路径

## Files Changed
- lamarck/ — 整个目录结构初始化
- lamarck/memory.md — 跨会话记忆
- lamarck/extensions/web_search.ts — Tavily 搜索 extension
- lamarck/tools/download-video.ts — 视频下载工具
- lamarck/tools/extract-audio.ts — 音频提取工具
- AGENTS.md — 加入 Lamarck 相关规则

# Session 2026-02-04_002

## Summary
修复 download-video 工具的抖音支持，从 yt-dlp 方案改为 Playwright + CDP 方案。

## Tags
download-video, douyin, playwright, cdp, yt-dlp, tools

## Key Points
- yt-dlp 对抖音彻底不可用，GitHub 上大量 issues（#7863, #9667, #12669），反爬无解
- 改用 Playwright 通过 CDP 连接用户的 Chrome 浏览器，复用登录态提取视频真实 URL
- download-video.ts 新增 `--cdp` 参数，抖音链接强制要求提供
- 拆分为两阶段：Phase 1 浏览器提取 URL 后立即关标签页，Phase 2 Node.js 独立下载
- 其他平台（YouTube、B站等）仍走 yt-dlp
- 安装了 ffmpeg、playwright 作为新依赖

## Issues Encountered
- yt-dlp cookies 无论怎么配都报 "fresh cookies needed"，搜索确认是已知老问题
- 首版用 page.evaluate(fetch) 在浏览器内下载视频再传回，大文件直接卡死
- 无效抖音链接会被重定向到推荐页，误下载了推荐视频，需检测 URL 是否仍含 /video/
- CDP 连接无法到达时会无限挂起，加了 10 秒超时

## Files Changed
- lamarck/tools/download-video.ts — 重写抖音下载逻辑（Playwright + CDP）
- lamarck/tools/package.json — 新增 playwright 依赖

## Session Log Mechanism
- 本次会话末尾建立了 session log 机制（lamarck/sessions/）
- 文件名格式：`日期_序号_简短标题.md`
- 更新了 memory.md 和 AGENTS.md 中的相关规则

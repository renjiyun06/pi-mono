# Session 2026-02-06_004

## Summary
收集30个抖音种子账号，建立 SQLite 数据库，完成视频转文字工具链，创建抖音账号监控任务。

## Tags
抖音, 种子账号, SQLite, 视频转文字, 监控任务, faster-whisper

## Key Points
- 通过关键词搜索（AI、一人公司、独立开发、程序员副业、ChatGPT、超级个体）收集30个种子账号
- 数据存储从 markdown 迁移到 SQLite（`lamarck/data/lamarck.db`）
- 表结构：`douyin_accounts`（账号）、`douyin_videos`（视频库，含 video_path、transcript_path）
- 视频转文字工具链完成：download-video.ts → extract-audio.ts → transcribe-audio.ts
- transcribe-audio.ts 使用 faster-whisper（small 模型），支持时间戳输出（-t 参数）
- 监控任务 `douyin-monitor`：每天9点扫描所有账号，下载新视频并转录，生成详细摘要

## Issues Encountered
- 抖音搜索频繁触发验证码 → 增加请求间隔（10-15秒），遇验证码暂停60秒
- runner.ts 手动运行模式 spawn 后立即 exit → 改用 tmux 运行任务
- 账号主页置顶视频不是最新的 → 任务中加入跳过置顶视频的规则

## Files Changed
- `lamarck/data/schema.sql` — 添加 douyin_videos 表（含 video_path、transcript_path）
- `lamarck/data/lamarck.db` — SQLite 数据库，30个种子账号
- `lamarck/tools/transcribe-audio.ts` — 新建，语音转文字（faster-whisper）
- `lamarck/tools/INDEX.md` — 更新工具索引
- `lamarck/tasks/douyin-monitor/task.md` — 新建监控任务
- `lamarck/projects/douyin/README.md` — 更新数据存储说明

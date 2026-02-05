# Session 2026-02-05_001

## Summary
实现了定时任务调度系统，支持通过 cron 表达式自动触发任务执行。

## Tags
task-scheduling, cron, runner, automation

## Key Points
- 任务文件放在 `lamarck/tasks/`，每个任务一个 `.md` 文件
- 任务格式：YAML frontmatter（cron + enabled）+ 任务描述（作为 prompt）
- runner.ts 由系统 cron 每分钟触发，检查并执行到期任务
- 任务执行使用完整上下文（读 AGENTS.md、memory.md），任务模式的 agent 和交互模式一样
- 日志由 runner 统一记录到 `lamarck/tasks/logs/`

## Issues Encountered
- cron 环境缺少 nvm 的 PATH，需在 crontab 开头设置 PATH
- 最初用自定义 system prompt 覆盖默认提示词，后改为使用默认提示词保持一致性

## Files Changed
- lamarck/tasks/runner.ts — 调度脚本
- lamarck/memory.md — 添加定时任务使用说明
- config/mcporter.json — 更新 Chrome CDP IP
- .gitignore — 忽略任务日志目录

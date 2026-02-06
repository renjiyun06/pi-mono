# Session 2026-02-06_001

## Summary
优化任务调度系统：目录结构重组、并行执行、评判标准细化。

## Tags
task-scheduling, zhihu, runner, parallel-execution

## Key Points
- 任务目录重组：每个任务一个目录（task.md + data.md），自包含
- runner 改为并行执行任务（spawn 替代 execSync）
- zhihu-monitor 和 zhihu-search 评判标准细化：不点赞简单体验分享、流水账
- zhihu-search 使用绝对路径避免找不到数据文件
- Chrome CDP 地址改用 WSL 网关（172.30.144.1），不受外网变化影响

## Issues Encountered
- zhihu-search 任务有时找不到数据文件（相对路径问题）→ 改用绝对路径
- 任务串行执行导致延迟 → 改为并行

## Files Changed
- lamarck/tasks/runner.ts — 并行执行、扫描子目录
- lamarck/tasks/zhihu-monitor/task.md — 评判标准细化
- lamarck/tasks/zhihu-search/task.md — 绝对路径、每次搜5词
- lamarck/tasks/zhihu-search/data.md — 关键词池
- lamarck/memory.md — 更新任务目录结构说明
- config/mcporter.json — Chrome CDP 地址

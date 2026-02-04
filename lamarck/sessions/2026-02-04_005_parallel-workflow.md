# Session 2026-02-04_005

## Summary
从 tmux 后台执行延伸，讨论并确立了 tmux + git worktree 并行多任务工作流，写入 memory.md 的 Workflows section。

## Tags
tmux, git-worktree, parallel, workflow, agent-orchestration, memory

## Key Points
- Agent 可通过 tmux 启动多个 pi 子 agent，实现并行任务执行
- git worktree 提供物理隔离，避免多 agent 文件冲突
- 主 agent 作为调度者：分发任务、监控进度、合并结果
- memory.md 新增 Workflows section，与 Decisions 区分——工作模式 vs 简单决策

## Issues Encountered
- 无

## Files Changed
- lamarck/memory.md — 新增 Workflows section（长时间任务、并行多任务），重构 Decisions section

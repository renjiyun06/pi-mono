# Session 2026-02-04_004

## Summary
讨论并验证了用 tmux 作为 agent 的后台进程管理机制，解决 bash 调用阻塞、无法中断的问题。

## Tags
tmux, process-management, bash, non-blocking, agent-capability

## Key Points
- Agent 的 bash 调用是一锤子买卖：发出后完全失去控制权，无法中途打断
- tmux 解决了这个问题：non-blocking 启动、capture-pane 轮询进度、send-keys 打断、kill-session 销毁
- 实测用 tmux 跑了一次抖音视频下载，全程非阻塞，进度可见，完美完成
- 决定：以后长时间任务一律走 tmux
- 同时顺带测试了 extract-audio.ts 的所有选项，全部通过

## Issues Encountered
- 无

## Files Changed
- lamarck/memory.md — 新增 tmux 环境信息和使用决策
- lamarck/sessions/2026-02-04_003_extract-audio-test.md — 上一轮 extract-audio 测试记录

# Session 2026-02-06_003

## Summary
实现了 QQ Bridge，通过私聊与 agent 对话。

## Tags
qq, bridge, napcat, onebot, websocket, agent-session

## Key Points
- 架构：NapCatQQ (Windows) ← WebSocket → Bridge (WSL) → AgentSession → LLM
- 按 user_id 管理 session，会话保持在内存中
- `/new` 命令重置会话
- 文本输出在 text_end 事件时发送（一块一块发，不等 stop 合并）
- 通过同一个 WebSocket 双向通信（收事件、发请求）

## Issues Encountered
- AgentSession 事件类型与预期不同：没有直接的 `text` 事件，文本在 `message_update.assistantMessageEvent.text_delta/text_end` 里

## Files Changed
- lamarck/bridge/qq/src/napcat.ts — WebSocket 客户端封装
- lamarck/bridge/qq/src/session-pool.ts — AgentSession 管理
- lamarck/bridge/qq/src/index.ts — 主入口
- lamarck/bridge/qq/test-ws.mjs — 删除（测试脚本已完成使命）
- lamarck/memory.md — 更新 QQ Bridge 状态为已实现

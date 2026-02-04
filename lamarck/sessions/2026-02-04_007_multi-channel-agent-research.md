# Session 2026-02-04_007

## Summary
Researched how to make the agent accessible via QQ or WeChat (beyond terminal), evaluated NapCatQQ and WeChatFerry, and analyzed pi's internal structure (Agent, AgentSession, SDK) to understand how to build the integration.

## Tags
multi-channel, QQ, WeChat, NapCatQQ, WeChatFerry, agent-session, SDK, architecture, mcporter, chrome-devtools

## Key Points
- pi 三层架构：agentLoop（LLM循环）→ Agent（状态管理）→ AgentSession（session持久化+扩展+工具）
- Agent 是纯内存状态容器，不知道工作区/session文件/系统提示词构建逻辑
- AgentSession 包裹 Agent（组合非继承），管理所有高层功能
- SDK 的 `createAgentSession()` 是一站式工厂函数，做桥接用它就够了
- mom 架构参考：持久进程 + 缓存 AgentSession per channel，每次消息重建系统提示词
- NapCatQQ：可行，Docker 部署，OneBot 11 协议，WebSocket 接入
- WeChatFerry（新仓库 wechatferry/wechatferry）：1.9k stars，但 sdk.dll 绑定微信 3.9.12.17，微信已强制升级到 4.x，多个 issue 反映无法登录
- 配置了 mcporter chrome-devtools MCP server，通过 CDP 连接 Windows 宿主机 Chrome（192.168.1.4:19222）

## Issues Encountered
- WeChatFerry 原仓库 lich0821/WeChatFerry 已关闭（不可抗因素），社区在 wechatferry/wechatferry 接力
- 微信强制升级导致 WeChatFerry 底层 sdk.dll 不兼容，目前实际不可用
- mcporter 初次使用时需要先配置 MCP server，`mcporter list` 为空不代表不可用

## Files Changed
- lamarck/memory.md — 更新多渠道桥接规划、WeChatFerry 调研结果、mcporter 配置
- config/mcporter.json — 新建，配置 chrome-devtools MCP server

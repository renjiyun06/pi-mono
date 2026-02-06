# Session 2026-02-06_002

## Summary
成功部署 NapCatQQ 并验证 WebSocket 连接，为 QQ 渠道接入打通基础。

## Tags
NapCatQQ, QQ, OneBot, WebSocket, bridge, 渠道接入

## Key Points
- NapCatQQ 必须部署在 Windows 上（通过 DLL 注入 QQ 进程）
- 一键包配置文件位置在深层目录：`versions/.../napcat/config/onebot11_<QQ号>.json`
- WebSocket 连接验证成功，能收到 OneBot 11 格式的消息事件
- Bot QQ 号：3981351485，WebSocket 地址：`ws://172.30.144.1:3001`

## Issues Encountered
- WebUI 打不开（端口通但 HTTP 无响应）— 未解决，但不影响使用
- 配置文件放错位置导致 WebSocket 服务未启动 — 找到正确路径后解决
- WSL 无法直接连 127.0.0.1，需通过 Windows 网关 IP 172.30.144.1 访问

## Files Changed
- lamarck/memory.md — 更新 QQ 桥接进度和配置信息
- lamarck/bridge/qq/test-ws.mjs — WebSocket 连接测试脚本
- (Windows) NapCat 配置文件 — 添加 WebSocket 服务配置

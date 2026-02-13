# Debt Call Shield (催债电话拦截 App)

## 概述

一款面向负债人群的手机 App，核心功能：
- 自动识别并拦截/接听催债电话
- AI 代接电话，与催收方实时语音对话
- 反诈功能（识别诈骗电话）

合规定位：**智能来电防护 / 反骚扰 App**，不以"帮助逃避催收"为卖点。

## 状态

第一阶段进行中：完整 AI pipeline 已实现，等待 Twilio 账号和 API key 恢复后进行端到端测试。

已完成：
- [x] 项目脚手架（Fastify + WebSocket）
- [x] Twilio incoming call webhook（返回 TwiML，连接 Media Stream）
- [x] WebSocket handler 接收 Twilio Media Streams 事件
- [x] ASR：WhisperASR（本地 faster-whisper + 能量 VAD）
- [x] LLM：OpenRouter provider（DeepSeek Chat，含意图分类 + 4种策略话术）
- [x] TTS：Edge TTS（免费微软语音，zh-CN-XiaoxiaoNeural）
- [x] Pipeline 编排器（CallSession：ASR → LLM → TTS，句级流式）
- [x] 策略层（催收/诈骗/正常/未知，四种应对策略）

阻塞：
- [ ] OpenRouter API key 失效（需更新）
- [ ] 注册 Twilio，买美国号码
- [ ] 用 ngrok 暴露本地服务器
- [ ] 端到端来电测试

离线测试模式：
- [x] `USE_STUBS=true` 环境变量启用 stub providers（无需 API key）
- [x] `test-ws-client.ts` 模拟 Twilio Media Streams WebSocket 协议
- Stub ASR：模拟语音识别（固定文本）
- Stub LLM：意图分类 + 预设中文回复（催收/诈骗/正常/未知）
- Stub TTS：生成静音音频（时长按文本长度估算）

测试方法：
```bash
# Terminal 1: 启动服务器（stub 模式）
USE_STUBS=true npx tsx src/server.ts

# Terminal 2: 运行测试客户端
npx tsx src/test-ws-client.ts
```

已完成的优化：
- [x] Edge TTS 支持 CLI 和 HTTP 双模式（含常驻 Python HTTP 服务）
- [x] MP3 → mulaw 8kHz 转码（ffmpeg pipe，20ms chunk splitting）
- [x] CallSession 自动转码集成

优化方向（低优先级）：
- [ ] Whisper 模型预加载（避免每次转录重新加载）
- [ ] 用 ffmpeg pipe 替代临时文件进行音频转码（减少 I/O）

## 架构

整个系统分为两部分，完全独立：

### 1. AI 语音对话引擎（后端服务）

核心，与 App 前端无关。电话语音流不经过 App。

```
来电 → 呼叫转移 → 电话接入层 → AI 语音对话引擎
```

引擎内部链路：
- 收到对方实时音频流
- ASR 流式语音识别（对方说了什么）
- 意图判断 + LLM 生成回复（催收/诈骗/正常，选择应对策略）
- TTS 流式语音合成（把回复变成语音）
- 音频流回传给对方

整条链路延迟需控制在 1~2 秒内。

### 2. App 前端（控制面板）

仅通过 HTTP API 与后端通信：
- 设置呼叫转移（开关）
- 查看通话记录和 AI 对话文本
- 配置策略（哪些号码拦截、哪些放行）
- 推送通知

## 电话接入层方案

电话接入层是可替换的，AI 引擎不关心电话从哪来，只跟音频流打交道。

### 方案对比

| 方案 | 适用场景 | 需要企业资质 | 说明 |
|------|---------|-------------|------|
| Twilio Media Streams | 调试验证 | 否 | 个人可注册，$15 试用额度，买美国号码 $1.15/月 |
| 副卡 + GoIP + FreeSWITCH | 个人自用 | 否 | 副卡插 GoIP 网关，SIP 转发到 FreeSWITCH |
| 云厂商 SIP Trunk | 商用 | 是 | 阿里云/腾讯云/容联云，国内需企业认证 |

### 呼叫转移原理

用户手机设置"无应答转移"到指定号码 → 运营商转发来电到电话接入层 → 接入层接听后将音频流送入 AI 引擎。

无应答转移最适合：用户不想接的电话不接，响铃超时后自动转给 AI。

## 平台限制

### iOS

- CallKit 只能做来电识别和拦截，不能自动接听
- 私有 API `CTCallAnswer` 在 iOS 7+ 被系统级 entitlement 锁死，即使自签也不可用，需越狱
- AI 代接只能走呼叫转移到云端方案

### Android

- InCallService API 可以自动接听，但限制大：
  - 必须成为默认电话 App（用户门槛高，需实现完整拨号器）
  - 国产 ROM 兼容性差（小米/华为/OPPO 深度定制电话模块）
  - Android 11+ 限制第三方 App 获取通话音频流
  - 国产 ROM 后台杀进程严重，保活困难
- 结论：Android 端也推荐走呼叫转移方案，更可靠

## 商业化风险

- GoIP 网关在国内与电信诈骗关联紧密，公安重点打击。批量办卡+架设 GoIP 帮用户代管不可行
- 宣传不能定位为"帮助逃避催收"，否则触碰逃废债红线
- 批量 SIM 卡受实名制管控限制

## 开发计划

### 第一阶段：调试验证（Twilio）

1. 注册 Twilio，买美国号码
2. 用 ngrok 暴露本地服务器
3. 实现 WebSocket 服务对接 Twilio Media Streams
4. 跑通来电 → 收到音频 → 回传固定录音
5. 接入 ASR（流式语音识别）
6. 接入 LLM（生成回复）
7. 接入 TTS（流式语音合成）
8. 实现策略层（催收/诈骗识别，不同应对话术）

### 第二阶段：替换电话接入层

将 Twilio 替换为正式方案（云厂商 SIP Trunk 或 副卡+GoIP 自用），AI 引擎不变，只需适配音频流编码格式。

### 第三阶段：App 开发

开发移动端控制面板。

## 成本估算

### 调试阶段

- Twilio 试用额度 $15.50（约 1600 分钟通话）
- 拨打美国号码国际长途约 1 元/分钟

### 自用部署

| 项目 | 一次性 | 月费 |
|------|--------|------|
| GoIP 网关（二手） | ~150 元 | - |
| 副卡 | - | ~5 元 |
| 云服务器（可选） | - | ~50 元 |
| ASR/TTS/LLM API | - | 几分钱/次通话 |

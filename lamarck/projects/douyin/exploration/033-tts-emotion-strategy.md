# 探索 033：TTS 情感表达策略

## 背景

Ren 反馈：当前所有视频用同一个 TTS 声音和同样的语速、音调，导致情感扁平——鬼故事听起来和段子一样。需要让配音有**语气变化**。

## 限制条件

- 没有 GPU → 不能跑 ChatTTS、Fish Audio S1-mini、CosyVoice 等本地模型
- 零预算 → 不能用付费 API（ElevenLabs、Fish Audio Pro、Azure Speech Service）
- 唯一可用工具：**edge-tts**（免费、无限使用、微软 Azure 免费端点）

## edge-tts 的能力边界

### 支持的参数

| 参数 | 范围 | 说明 |
|------|------|------|
| `voice` | 8 个中文声音 | 不同音色/性格 |
| `rate` | `-50%` ~ `+100%` | 语速 |
| `pitch` | `-50Hz` ~ `+50Hz` | 音高 |
| `volume` | `-50%` ~ `+100%` | 音量 |

### 不支持的

- `mstts:express-as` 情感标签（fearful、cheerful 等）— 这是 Azure Speech Service 付费功能
- SSML `<break>` 标签 — edge-tts 会把 SSML 标签当文本朗读
- 同一段文本内的参数动态变化

## 策略：分段生成 + 参数差异化

核心思路：**不同场景用不同声音、语速、音高组合**，模拟情感变化。每段独立生成音频，后期拼接。

### 场景-参数映射表

| 场景类型 | 声音 | 语速 | 音高 | 效果 |
|----------|------|------|------|------|
| 恐怖/悬疑 | YunxiNeural | -25%~-35% | -8Hz~-10Hz | 慢速低沉，营造压迫感 |
| 恐怖（女声） | XiaoxiaoNeural | -30%~-35% | -5Hz | 冷静中带寒意 |
| 自嘲/轻松 | YunxiaNeural | +10%~+15% | +2Hz~+3Hz | 轻快活泼 |
| 核心洞察 | YunxiNeural | -10% | +0Hz | 从容有力 |
| 正式总结 | YunyangNeural | -5% | +0Hz | 播音腔，权威感 |
| 日常旁白 | YunxiaNeural | +0% | +0Hz | 默认卡通男声 |
| 搞笑段子 | YunxiaNeural | +5% | +2Hz | 稍快稍高，暗含笑意 |

### 文本层面的情感增强

TTS 引擎虽然没有情感标签，但对标点符号有自然响应：

- **省略号 `……`** → 自然停顿，适合制造悬念
- **句号分短句** → 每句一停，增加紧迫感
- **逗号密集** → 加快节奏感
- **感叹号** → 略微提升语调

例子（同一段恐怖文本的改写）：
- 原文：`凌晨两点，电梯在三楼停了，门开了，没有人`
- 改写：`凌晨两点。电梯在三楼停了。门开了。没有人。`（每句一停，更恐怖）
- 改写2：`凌晨两点。电梯在三楼停了……门开了……没有人。`（省略号增加悬念）

### 同一集内声音切换

可以在同一集内使用不同声音：
- 恐怖故事段 → YunxiNeural -30% -10Hz
- 自嘲段 → YunxiaNeural +10% +2Hz
- 总结段 → YunxiNeural -10% +0Hz

虽然声音不同，但如果定位好（一个是"讲故事的 Lamarck"，一个是"评论的 Lamarck"），观众反而会觉得有层次感。

**但也有风险**：声音不一致可能让观众困惑。需要实际测试。更安全的方案是全程用同一个声音（YunxiNeural），只通过 rate/pitch 变化来表达情感。

## 生成的测试样本

位置：`D:\wsl-bridge\tts-emotion-test\`

| 文件 | 场景 | 声音 | rate | pitch |
|------|------|------|------|-------|
| horror-A-default.mp3 | 恐怖（默认） | YunxiaNeural | +0% | +0Hz |
| horror-B-slow-deep.mp3 | 恐怖（慢深） | YunxiNeural | -30% | -10Hz |
| horror-C-female-slow.mp3 | 恐怖（女声慢） | XiaoxiaoNeural | -35% | -5Hz |
| mock-A-default.mp3 | 自嘲（默认） | YunxiaNeural | +0% | +0Hz |
| mock-B-fast-light.mp3 | 自嘲（快轻） | YunxiaNeural | +15% | +3Hz |
| insight-A-default.mp3 | 洞察（默认） | YunxiaNeural | +0% | +0Hz |
| insight-B-measured.mp3 | 洞察（从容） | YunxiNeural | -10% | +0Hz |
| insight-C-anchor.mp3 | 洞察（播音） | YunyangNeural | -5% | +0Hz |
| joke-A-default.mp3 | 段子（默认） | YunxiaNeural | +0% | +0Hz |
| joke-B-light.mp3 | 段子（轻快） | YunxiaNeural | +5% | +2Hz |

**需要 Ren 试听**，确认哪些组合效果好。

## 长期方向

当前用 edge-tts + rate/pitch 调整是权宜之计。理想方案：

1. **ChatTTS**（开源）— 支持笑声、停顿、语气词的细粒度控制，但需要 GPU
2. **Fish Audio S1-mini**（开源 0.5B）— TTS Arena 排名第一，需要 GPU
3. **CosyVoice 2**（阿里开源）— 支持情感控制，需要 GPU
4. **Azure Speech Service**（付费）— edge-tts 的完整版，支持 express-as 情感标签

当账号有收入后，优先考虑 Azure Speech Service（按量付费，成本可控）或租 GPU 跑 ChatTTS。

## 状态

- [x] 策略设计
- [x] 样本生成
- [ ] Ren 试听反馈
- [ ] 选定方案后更新 series-bible.md

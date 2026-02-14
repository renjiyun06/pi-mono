# 探索 023: AI Agent 自主视频制作技术调研

## 核心问题

Lamarck 如何独立制作高质量短视频？当前终端打字动画太单一，需要更丰富的视觉表达。

## 调研发现

### 1. Remotion（React 视频框架）

- **官网**: remotion.dev
- **原理**: 用 React 组件定义视频帧，通过 Chrome Headless Shell 渲染
- **优势**: 生态丰富（动画、图表、字幕都有），Claude Code 官方集成教程
- **当前障碍**: WSL 缺少 `libnspr4` 等系统库，Chrome Headless Shell 无法运行。需要 sudo 安装依赖。
- **解决方案**: 让 Ren 执行 `sudo apt-get install libnspr4 libnss3 libatk-bridge2.0-0 libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2 libpango-1.0-0 libcairo2`
- **评估**: 最理想方案，但被系统依赖阻塞

### 2. Node Canvas + ffmpeg（当前可行方案 ✅）

- **原理**: 用 node-canvas（Cairo 后端）逐帧绘制 PNG，ffmpeg 合成 MP4
- **优势**: 已验证可行！不需要额外安装。canvas 包已在 monorepo 中。
- **能力**: 渐变背景、文字动画、卡片布局、缓动函数、中文渲染（Noto Sans CJK SC）
- **限制**: 没有 HTML/CSS 的排版便利，需要手动计算布局。无法渲染网页组件。
- **性能**: 1080x1920@30fps，22 秒视频（660 帧）约 60 秒渲染
- **已实现**: `tools/canvas-video/engine.ts` + `demo-intro.ts`

### 3. TTS 声音选型

当前使用 edge-tts（Microsoft YunyangNeural）。需要对比：
- **CosyVoice 3**（阿里 FunAudioLLM）: 0.5B 参数，150ms 延迟，中文 SOTA。需要 Python + GPU。
- **ChatTTS**: 中文对话场景优化，开源，37K+ GitHub star。需要 Python + torch。
- **FishAudio S1**: 高质量，支持零样本克隆。
- **Kokoro TTS**: 轻量开源。
- **问题**: WSL 无 pip，无 GPU。这些方案当前无法使用。
- **结论**: 暂时继续用 edge-tts，但换一个更自然的声音。需要 Ren 安装 pip 或 Python 包管理器。

### 4. 图片生成

- **AI Horde**: 免费，已有 wrapper，但 576x576 分辨率低
- **OpenRouter**: 有 FLUX 等高质量模型，但额度有限
- **Pixazo/Flux Schnell API**: 免费，无需 API key，值得测试
- **本地 Stable Diffusion**: 无 GPU，不可行

### 5. 视频生成 AI

- VEO 3.1, SORA 2, Kling 2.6, Seedance 1.5 Pro 等——都是付费云服务
- 短期不适合大规模使用，但可以作为单个镜头的素材来源

## 技术决策

| 方案 | 可行性 | 质量 | 优先级 |
|------|--------|------|--------|
| Canvas + ffmpeg | ✅ 已验证 | 中-高 | **立即使用** |
| Remotion | 🔧 需要系统依赖 | 高 | 等 Ren 安装 |
| AI 生图 + Canvas 合成 | ✅ 可行 | 高 | 下一步 |
| TTS 升级 | ❌ 需要 pip | 高 | 等基础设施 |

## 下一步

1. **完善 canvas-video 引擎**：修复布局问题，增加更多场景模板
2. **集成 AI 生图**：用 AI Horde 或 Flux Schnell 生成场景背景图，canvas 叠加文字动画
3. **探索 edge-tts 其他中文声音**：不需要安装新东西
4. **设计 Lamarck 卡通形象**：用 AI 生图工具设计，然后作为 PNG 素材嵌入视频
5. **请求 Ren 安装系统依赖**：解锁 Remotion 和更好的 TTS

## 关键洞察

> Lamarck 独立制作视频的最大瓶颈不是创意或代码能力，而是**系统环境限制**（无 sudo、无 pip、无 GPU）。Canvas + ffmpeg 是当前最佳可行路径。解锁 Remotion 只需要一条 apt-get 命令。

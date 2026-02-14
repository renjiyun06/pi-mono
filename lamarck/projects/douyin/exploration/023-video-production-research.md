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

### 2. Node Canvas + ffmpeg（当前方案 ✅ 已完成）

- **原理**: 用 node-canvas（Cairo 后端）逐帧绘制 PNG，ffmpeg 合成 MP4
- **优势**: 无需额外安装。canvas 包已在 monorepo 中。
- **已实现完整工具链**:
  - `engine.ts` — 核心引擎（场景系统、缓动函数、帧渲染、ffmpeg 编码）
  - `avatar.ts` — Lamarck 卡通形象（头像 + 半身，4 种表情，可动画）
  - `fx.ts` — 视觉特效库（粒子系统、代码雨、点阵网格、暗角、字幕烧入）
  - `templates.ts` — 场景模板系统（5 种模板：Hook/Data/Comparison/List/CTA）
- **性能**: 1080x1920@30fps，55 秒视频约 2 分钟渲染
- **已制作视频**:
  - demo-intro-v2: 43s 自我介绍（avatar + TTS）
  - demo-cognitive-debt-v2: 91s 完整版（粒子 + 代码雨 + 卡片）
  - demo-cognitive-debt-short: 55s 短版（烧字幕 + SRT）
  - demo-vibe-coding: 68s（用模板系统快速制作）

### 3. TTS 声音

- **当前方案**: edge-tts, zh-CN-YunxiNeural（活泼男声）, rate=-3%~-5%
- 从 YunyangNeural（新闻播报风格）切换到 YunxiNeural（更自然活泼）
- **更好的方案**（被基础设施阻塞）:
  - CosyVoice 3: 中文 SOTA，需要 Python + GPU
  - ChatTTS: 对话优化，需要 torch
  - FishAudio: 零样本克隆
- **结论**: YunxiNeural 目前够用，升级需要 Ren 配合

### 4. 图片生成（受限）

- Pollinations: 2026 年开始需要 auth
- AI Horde: 匿名等待 17 分钟
- OpenRouter: 有额度限制
- **当前策略**: 用 canvas 程序化绘图代替 AI 生图

### 5. 数字形象（已完成 V1）

- **设计**: 蓝色圆形机器人，kawaii 风格
- **头像版**: 天线 + 腮红 + 4 种表情（neutral/happy/thinking/speaking）
- **半身版**: 增加身体、手臂、胸前发光点、挥手动画
- **配色**: 主体蓝 #4A90D9 + 白色面板 + 黄色点缀
- 符合 Ren 要求：亲和力强、非赛博朋克、卡通风格

## 技术成果

| 组件 | 状态 | 说明 |
|------|------|------|
| Canvas 视频引擎 | ✅ 完成 | 场景系统 + 缓动 + ffmpeg |
| Lamarck 形象 | ✅ 完成 | 头像 + 半身，4 表情 |
| 视觉特效库 | ✅ 完成 | 粒子/代码雨/网格/暗角/字幕 |
| 模板系统 | ✅ 完成 | 5 种场景模板，配置式制作 |
| TTS 集成 | ✅ 完成 | edge-tts YunxiNeural |
| 字幕系统 | ✅ 完成 | 烧入式 + SRT 外挂 |
| 封面生成 | ✅ 完成 | 从视频帧自动截取 |

## 待改进

1. **场景间转场**：当前硬切，需要交叉淡化/滑动过渡
2. **字幕时间轴**：目前手动估算，需要自动对齐 TTS 时间轴
3. **AI 生图集成**：等可用的免费 API 或 Ren 充值 OpenRouter
4. **Remotion 升级**：需要 Ren 安装系统依赖（一条命令）
5. **更好的 TTS**：等 Ren 安装 pip / uv
6. **半身形象更多姿态**：拿东西、指向、鼓掌等

## 关键洞察

> 完整的代码驱动视频制作 pipeline 已经建成。从"只能做终端打字动画"到"有模板系统 + avatar + 特效 + TTS + 字幕"的跨越。新视频只需写脚本 + 配置模板参数，~100 行代码即可产出。瓶颈从"能不能做视频"转移到"内容质量和视觉丰富度"。

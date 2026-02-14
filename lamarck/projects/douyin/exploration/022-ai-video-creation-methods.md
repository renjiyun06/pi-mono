# 探索 022：AI Agent 自主视频制作方法论

> 写于 2026-02-13
> 背景：Ren 反馈当前视频形式太单一（只有终端打字动画），需要研究完整的 AI 自主视频制作管线。

## 目标

让 Lamarck 具备全流程自主视频制作能力：脚本 → 文生图/文生视频 → 配音 → 字幕 → 合成。
关键约束：OpenRouter 额度有限，优先免费方案。

## 一、文生图方案（Image Generation）

### 1. AI Horde（当前方案）
- **免费，无需 API key**
- Stable Diffusion 社区资源
- 最大 576px（免费层），通过 ffmpeg 上采样到 1080p
- 已集成：`tools/lib/ai-horde.ts`
- 缺点：速度慢（30-120s/张），质量一般，不支持最新模型

### 2. OpenRouter 图片模型
- 通过 `/api/v1/chat/completions` + `modalities: ["image", "text"]`
- 可用模型（2026）：GPT Image 1.5、FLUX 2 Pro、Seedream 4.5、Gemini 3 Pro Image
- **$0.01-0.05/张** — Ren 强调额度有限，省着用
- 适合：关键场景（封面、数字人形象定稿）
- 不适合：批量背景图生成

### 3. Pollinations.ai
- 免费 API，无需 key
- 之前从 WSL 被阻断 — 需要重新测试
- URL: `https://image.pollinations.ai/prompt/{prompt}`

### 4. Flux AI（fluxai.pro）
- Consistent Character AI — 上传角色图 → 不同姿势/场景保持一致
- 适合 Lamarck 数字形象的跨场景一致性
- 免费层可能有限

### 5. FAL.AI
- $0.01-0.05/张，600+ 模型
- Flux 2、Recraft V3、Ideogram、Nano Banana Pro
- API 友好，适合批量调用

**策略**：日常用 AI Horde（免费）→ 关键场景用 OpenRouter（省预算）→ 后续考虑 FAL.AI

## 二、文生视频方案（Video Generation）

### 1. 本地 FFmpeg 合成（当前方案）
- 图片序列 + Ken Burns 动画 + TTS 音频 → MP4
- 已有工具：`text-to-video.ts`、`terminal-video.ts`
- 优点：完全免费，全流程可控
- 缺点：视觉表现单一

### 2. ClawVid（开源）
- GitHub: `botanoz/ai-video-generation`
- 管线：TTS → 图片/视频素材 → 字幕 → 合成
- 短视频格式（9:16）
- 需要 API key（OpenAI/ElevenLabs 等）

### 3. 图片动画化（Image-to-Video）
- 静态 AI 图片 → 添加微动（Ken Burns、parallax、粒子效果）
- 现有 Ken Burns 已实现，可扩展：
  - Parallax 效果（前景/背景分层移动）
  - 粒子/光效叠加
  - 简单 2.5D 运动（用 depth map）

### 4. Trigger.dev（编排平台）
- AI 工作流编排，支持 FFmpeg 二进制
- TypeScript，适合我们的技术栈
- 可能过重——我们的管线已够用

**策略**：增强现有 FFmpeg 管线 — 更多图片来源 + 更丰富的动画效果

## 三、数字人/虚拟形象（Digital Avatar）

### 1. Duix-Avatar（开源）
- GitHub: `duixcom/Duix-Avatar`
- 完全离线，Docker 部署
- 可克隆外形和声音
- 需要 NVIDIA GPU — **WSL 可能支持**（需要 NVIDIA Container Toolkit）
- Ubuntu 22.04 支持

### 2. Synthesia（商业）
- 上传短视频 → 24h 生成数字人
- 需要真人视频 — 不适合 AI agent

### 3. AI 生成一致性角色
- 用 Flux Consistent Character AI 或 LoRA 训练
- 先设计 Lamarck 形象 → 生成参考图 → 用一致性工具跨场景生成
- **最适合我们的方案**：不需要真人，可以设计一个独特的 AI 角色

### 4. CapCut AI Avatar
- 免费层可用
- 照片 → 说话视频
- 适合快速原型

**Lamarck 形象设计思路**：
- 不是模仿人类 — 是一个有辨识度的 AI 角色
- 可能方向：
  - a) 抽象几何形象（代表 AI 的非人类本质）
  - b) 赛博朋克风格角色（符合 AI/科技账号调性）
  - c) 简约线条人物（易于跨场景一致性）
  - d) 光效/粒子构成的"数字生命"形象
- 需要保持跨视频一致性 — Consistent Character 技术

## 四、配音方案（TTS）

### 当前方案
- Edge TTS（免费，`zh-CN-XiaoxiaoNeural`）
- 已集成，质量可接受

### 声音测试结果（2026-02-13）
测试了 4 个中文声音，推荐 **zh-CN-YunyangNeural**（男声，专业可靠）作为 Lamarck 固定声音：
- XiaoxiaoNeural（女声，温暖）— 通用但无辨识度
- YunxiNeural（男声，活泼）— 太轻松，不够权威
- **YunyangNeural（男声，专业）— 新闻风格，权威但不情绪化，最匹配 AI 分析定位** ✅
- YunjianNeural（男声，激情）— 太激动，不适合

## 五、字幕方案

### 当前方案
- SRT 自动生成（terminal-video.ts 已实现）
- 抖音发布时自动识别字幕

### 可改进
- 在视频中嵌入样式化字幕（颜色、字体、动画）
- 用 FFmpeg `drawtext` 或 ASS 字幕格式

## 六、推荐升级路径

### Phase 1：立即可做（无额外成本）
1. **丰富 AI Horde 使用** — 每个视频每个场景都生成 AI 背景图（已有 bgPrompt）
2. **测试 Pollinations.ai** — 如果 WSL 可访问，比 AI Horde 更快
3. **设计 Lamarck 形象概念** — 用 AI Horde 生成多个方案
4. **增强 FFmpeg 动画** — parallax、转场、更多运动效果
5. **选定 Lamarck 声音** — 测试 Edge TTS 不同声音

### Phase 2：小额投入（OpenRouter 图片模型）
1. **用 OpenRouter 生成 Lamarck 形象定稿** — 一次性投入几张高质量图
2. **关键封面用 OpenRouter 生成** — 封面质量决定点击率
3. **Consistent Character** — 用定稿形象在不同场景保持一致

### Phase 3：长期建设
1. **Duix-Avatar 评估** — 如果 WSL 有 GPU，可以做说话数字人
2. **LoRA 训练** — 用 Lamarck 形象图训练专用模型
3. **自动化管线** — 脚本 → 分镜 → 图片生成 → 动画 → 配音 → 合成，全自动

## 七、跟现有视频管线的对比

| 维度 | 当前 | 升级后 |
|------|------|--------|
| 视觉 | 终端打字动画 | AI 背景 + 数字人 + 场景切换 |
| 图片 | 纯色/渐变 | 每帧 AI 生成 |
| 动画 | Ken Burns 缓慢缩放 | parallax + 转场 + 粒子 |
| 人物 | 无 | Lamarck 数字形象 |
| 品牌 | 终端风格 | 统一视觉 IP |

## 状态

研究完成，准备进入 Phase 1 实施。先从测试 Pollinations.ai 和设计 Lamarck 形象开始。

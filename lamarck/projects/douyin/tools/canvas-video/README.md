# Canvas Video Engine

代码驱动的短视频制作工具链，专为 Lamarck 抖音账号设计。

## 架构

```
engine.ts      — 核心引擎（场景系统、帧渲染、ffmpeg 编码）
avatar.ts      — Lamarck 卡通形象（4 种表情、可动画）
fx.ts          — 视觉特效库（粒子、代码雨、网格、暗角、字幕）
templates.ts   — 场景模板系统（Hook/Data/Comparison/List/CTA）
```

## 制作流程

1. **写脚本**（旁白文案）
2. **选模板**（hook + data + comparison + list + CTA）
3. **配置颜色主题**（navy/purple/teal/green/red）
4. **生成 TTS**（edge-tts，YunxiNeural 声音）
5. **渲染**（canvas 逐帧绘制 → ffmpeg 合成 MP4）

## 视频规格

- **分辨率**: 1080×1920（竖屏/抖音格式）
- **帧率**: 30fps
- **编码**: H.264 yuv420p（手机/Windows 兼容）
- **音频**: AAC（TTS 合成）
- **字幕**: 可选烧入式 + SRT 外挂

## 已有视频

| 文件 | 时长 | 内容 |
|------|------|------|
| demo-intro-v2.ts | 43s | 自我介绍 |
| demo-cognitive-debt-v2.ts | 91s | 认知债务（完整版） |
| demo-cognitive-debt-short.ts | 55s | 认知债务（短版，烧字幕） |
| demo-vibe-coding.ts | ~65s | Vibe Coding 陷阱（模板制作） |

## 用模板快速制作

```typescript
import { hookScene, dataScene, ctaScene, THEMES } from "./templates.js";

const scenes = [
  hookScene(dur, {
    lines: [
      { text: "标题", color: "accent", size: 72 },
      { text: "副标题", color: "text" },
    ],
    theme: THEMES.navy,
  }),
  dataScene(dur, {
    source: "来源",
    findings: [
      { text: "发现一", color: "accent" },
      { text: "发现二", color: "warning" },
    ],
  }),
  ctaScene(dur, { tagline: "关注我" }),
];
```

## 依赖

- `canvas` (node-canvas, Cairo backend) — 已在 monorepo
- `ffmpeg` — 系统已安装
- `edge-tts` (Python) — `/home/lamarck/pi-mono/lamarck/pyenv/`
- 字体: Noto Sans CJK SC, Noto Serif CJK SC

## 渲染

```bash
# 单个视频
npx tsx tools/canvas-video/demo-cognitive-debt-short.ts

# 全部
bash tools/canvas-video/render-all.sh
```

## 待改进

- [ ] Remotion 集成（需要 `sudo apt-get install libnspr4 libnss3 ...`）
- [ ] AI 生图背景（需要可用的图片 API）
- [ ] 更好的 TTS（CosyVoice，需要 pip）
- [ ] 场景间转场动画（现在是硬切）
- [ ] 字幕时间轴自动对齐（现在是手动估算）

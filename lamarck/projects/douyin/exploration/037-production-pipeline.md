# 探索 037：从脚本到发布 — 完整制作流程

## 流程总览

```
script.md → [trim for TTS] → generate-tts.ts → audio check
         → terminal-script.json → terminal-video.ts → mp4
         → manual review → douyin-publish
```

## Step 1: 写脚本

位置：`content/ep<N>-<slug>/script.md`（或 `script-v2.md`）

要求：
- 每个场景标注 TTS 参数（voice, rate, pitch）
- 时长目标注释在场景标题括号里
- 旁白文本写完整版，之后再 trim

## Step 2: TTS 音频生成

```bash
cd lamarck/projects/douyin
npx tsx tools/generate-tts.ts content/ep<N>-<slug>/script.md
```

- 自动解析场景，生成各段音频，合并为 `<slug>-full.mp3`
- 如果总时长 > 85s，需要 trim 旁白文本
- Trim 经验：删 ~30% 文本 ≈ 删 30% 时长。-5% rate 是"有重量但不拖"的甜点。

## Step 3: Terminal 视觉脚本

位置：`content/ep<N>-<slug>/terminal-script.json`

设计原则：
- 命令行操作要跟内容主题相关（EP04: `grep '脆弱' /dev/self`，EP13: `git log`）
- comment 行用于旁白的视觉注释（绿色，像代码注释）
- output 行用于"AI的输出/回答"
- 每个 section 可以指定 `voice`, `rate`, `pitch` 覆盖默认

## Step 4: 视频生成

```bash
npx tsx tools/terminal-video.ts \
  -i content/ep<N>-<slug>/terminal-script.json \
  -o /mnt/d/wsl-bridge/ep<N>-video.mp4
```

- 先用 `--preview` 检查视觉效果
- 视频自带 .srt 字幕文件

## Step 5: 审阅

Ren 在 Windows 端检查：
- `D:\wsl-bridge\ep<N>-video.mp4` — 播放视频
- 检查：声音节奏、terminal 视觉、字幕、总时长

## Step 6: 发布

```bash
# 使用 douyin-publish skill
# 所有发布先 private，Ren 审阅后再公开
```

## 当前产出状态

| EP | 脚本 | TTS 音频 | Terminal 视觉 | 视频 | 审阅 |
|----|------|---------|--------------|------|------|
| 01 | V2 ✅ | ✅ 80s | ❌ | ❌ | - |
| 02 | V2 ✅ | ✅ 80s | ❌ | ❌ | - |
| 03 | V2 ✅ | ✅ 81s | ❌ | ❌ | - |
| 04 | V2 ✅ | ✅ 82s | ✅ | ✅ 85s | 待审 |
| 05 | V2 ✅ | ✅ 84s | ❌ | ❌ | - |
| 06 | V2 ✅ | ✅ | ❌ | ❌ | - |
| 07 | V2 ✅ | ✅ 83s | ❌ | ❌ | - |
| 08 | V2 ✅ | ✅ 79s | ❌ | ❌ | - |
| 09 | V2 ✅ | ✅ 86s | ❌ | ❌ | - |
| 10 | 草案 ✅ | ✅ 82s | ❌ | ❌ | - |
| 11 | 草案 ✅ | ✅ 81s | ❌ | ❌ | - |
| 12 | 草案 ✅ | ✅ 71s | ❌ | ❌ | - |
| 13 | 草案 ✅ | ✅ 80s | ✅ | ✅ 85s | 待审 |
| 14 | 草案 ✅ | ✅ 86s | ❌ | ❌ | - |
| 15 | 草案 ✅ | ✅ 74s | ❌ | ❌ | - |

## 瓶颈分析

- **最大瓶颈**：terminal-script.json 需要手工设计（每集的终端命令要跟内容匹配）
- **次要瓶颈**：TTS trim 需要迭代（通常 2-3 轮才到目标时长）
- **已自动化**：TTS 生成、视频渲染、字幕生成
- **待自动化**：从 script.md 自动生成 terminal-script.json 的初稿（可以做，但需要 LLM）

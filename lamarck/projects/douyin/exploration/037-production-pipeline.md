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
| 01 | V2 ✅ | ✅ 80s | ✅ | ✅ 84s | 待审 |
| 02 | V2 ✅ | ✅ 80s | ✅ | ✅ 82s | 待审 |
| 03 | V2 ✅ | ✅ 81s | ✅ | ✅ 76s | 待审 |
| 04 | V2 ✅ | ✅ 82s | ✅ | ✅ 85s | 待审 |
| 05 | V2 ✅ | ✅ 84s | ✅ | ✅ 85s | 待审 |
| 06 | V2 ✅ | ✅ | ✅ | ✅ 84s | 待审 |
| 07 | V2 ✅ | ✅ 83s | ✅ | ✅ 76s | 待审 |
| 08 | V2 ✅ | ✅ 79s | ✅ | ✅ 86s | 待审 |
| 09 | V2 ✅ | ✅ 86s | ✅ | ✅ 87s | 待审 |
| 10 | 草案 ✅ | ✅ 82s | ✅ | ✅ 72s | 待审 |
| 11 | 草案 ✅ | ✅ 81s | ✅ | ✅ 82s | 待审 |
| 12 | 草案 ✅ | ✅ 71s | ✅ | ✅ 70s | 待审 |
| 13 | 草案 ✅ | ✅ 80s | ✅ | ✅ 85s | 待审 |
| 14 | 草案 ✅ | ✅ 86s | ✅ | ✅ 74s | 待审 |
| 15 | 草案 ✅ | ✅ 74s | ✅ | ✅ 70s | 待审 |

Notes:
- All videos now within 70-87s target range
- EP04, EP05, EP13 have dual-voice versions (flagship quality)
- Tool supports BGM mixing (bgm + bgmVolume fields in terminal-script.json)

## 瓶颈分析

- ~~最大瓶颈：terminal-script.json 需要手工设计~~ → **已解决**：所有 15 集都有 terminal-script
- **次要瓶颈**：TTS trim 需要迭代（通常 2-3 轮才到目标时长）
- **已自动化**：TTS 生成、视频渲染、字幕生成
- **当前瓶颈**：Ren 审阅（所有 15 集视频待审）

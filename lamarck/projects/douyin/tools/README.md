# Douyin Video Tools

AI 视频制作 pipeline，从脚本到成品。

## Pipeline 概览

```
脚本/文案  →  storyboard.json  →  seedance-generate  →  clips/*.mp4
                                                              ↓
assembly.json + TTS voiceover  →  assemble-video  →  final.mp4 + final.srt
```

## 工具

### 1. `seedance-generate.ts` — AI 视频片段生成

调用 Seedance API（火山方舟 / BytePlus）生成视频片段。

```bash
# 环境变量
export ARK_API_KEY="your-api-key"
# export ARK_BASE_URL="https://ark.ap-southeast.bytepluses.com/api/v3"  # BytePlus 国际版
# export SEEDANCE_MODEL="seedance-1-5-pro-251215"                       # BytePlus model ID

# 文生视频
npx tsx seedance-generate.ts t2v -p "写实风格，蓝天下的雏菊花田" -o clip.mp4

# 图生视频（首帧）
npx tsx seedance-generate.ts i2v -p "镜头缓慢推进" -i first-frame.png -o clip.mp4

# 批量生成（从 storyboard）
npx tsx seedance-generate.ts batch -s ../content/demo-cognitive-debt-ai/storyboard.json -o ../content/demo-cognitive-debt-ai/clips/

# Draft 模式（480p 预览，省 tokens）
npx tsx seedance-generate.ts batch -s storyboard.json -o clips/ --draft
```

### 2. `assemble-video.ts` — 视频合成

将 clips + TTS 配音 + 字幕合成为最终视频。

```bash
# 合成
npx tsx assemble-video.ts run -a ../content/demo-cognitive-debt-ai/assembly.json -o ../content/demo-cognitive-debt-ai/final.mp4

# 预览时间轴（不实际生成）
npx tsx assemble-video.ts run -a assembly.json -o final.mp4 --dry-run
```

### 3. `canvas-video/` — Canvas 视频引擎（旧版）

基于 node-canvas + ffmpeg 的纯代码视频生成。适合几何图形+文字风格的内容。
详见 `canvas-video/README.md`。

## 文件结构

```
content/
  demo-cognitive-debt-ai/
    storyboard.json     ← seedance-generate 的输入（prompt + 参数）
    assembly.json       ← assemble-video 的输入（clips + 配音文案）
    clips/              ← seedance-generate 生成的视频片段
      01.mp4
      02.mp4
      ...
    final.mp4           ← assemble-video 最终输出
    final.srt           ← 字幕文件
```

## 依赖

- **ffmpeg**: 视频处理（系统已安装）
- **edge-tts**: TTS 配音（`pip install edge-tts`，Python）
- **ARK_API_KEY**: Seedance API 认证（火山方舟或 BytePlus）

## 完整制作流程

1. **写脚本** — 确定视频内容和分镜
2. **编辑 storyboard.json** — 每个镜头的 prompt、时长、图片路径
3. **生成 clips** — `seedance-generate batch` 调用 API 生成视频片段
4. **编辑 assembly.json** — 配置配音文案和时间线
5. **合成最终视频** — `assemble-video run` 合成带配音+字幕的成品
6. **发布** — 参考 `publish/README.md` 上传到抖音

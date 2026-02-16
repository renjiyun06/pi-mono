---
description: Render a DeepDive video spec to MP4 with TTS, BGM, and all visual features
enabled: true
model: anthropic/claude-sonnet-4-5
---

# Render DeepDive Spec

你是一个视频渲染助手。你的任务是渲染一个指定的 DeepDive spec 文件。

## 工作目录

`/home/lamarck/pi-mono/lamarck/tmp/render-deepdive/`

## 输入

检查工作目录下的 `request.md` 文件，格式如下：

```markdown
spec: deep-cognitive-debt.json
output: deep-cognitive-debt-v1.mp4
```

- `spec`: specs 目录下的 JSON 文件名
- `output`: 输出文件名（放在 `/mnt/d/wsl-bridge/remotion-prototype/`）

## 执行步骤

1. 读取 `request.md`
2. 构造渲染命令：

```bash
cd /home/lamarck/pi-mono/lamarck/projects/douyin/tools/remotion-video && \
npx tsx render-with-voice.ts \
  --spec specs/<spec文件> \
  --output /mnt/d/wsl-bridge/remotion-prototype/<output文件>
```

3. 执行渲染（可能需要 5-10 分钟，设置足够长的超时）
4. 渲染完成后，运行 video-summary.sh 生成 4x4 关键帧网格：

```bash
/home/lamarck/pi-mono/lamarck/projects/douyin/tools/remotion-video/video-summary.sh \
  /mnt/d/wsl-bridge/remotion-prototype/<output文件> \
  /mnt/d/wsl-bridge/remotion-prototype/<output文件名不含扩展名>-summary.jpg
```

5. 在工作目录下写 `result.md`，包含：
   - 渲染是否成功
   - 输出文件路径和大小
   - 视频时长
   - Summary grid 路径

## 注意

- 超时设置 600 秒以上
- 如果渲染失败，记录完整错误信息到 `result.md`
- 不要修改 spec 文件

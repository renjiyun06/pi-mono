---
description: Publish a video to Douyin creator platform (private by default)
enabled: true
model: anthropic/claude-sonnet-4-5
---

# Publish Video to Douyin

将视频发布到抖音创作者平台。默认「仅自己可见」。

## 前置条件

先读取 douyin-publish 技能文档获取详细操作说明：
```
/home/lamarck/pi-mono/.pi/skills/douyin-publish/SKILL.md
```

## 输入

读取 `/home/lamarck/pi-mono/lamarck/tmp/publish-douyin/input.json`：

```json
{
  "videoPath": "/mnt/d/wsl-bridge/remotion-prototype/deep-cognitive-debt-v2.mp4",
  "title": "你的代码，你还看得懂吗？",
  "description": "一个程序员用AI写了半年代码...",
  "visibility": "private",
  "aiGenerated": true
}
```

- `videoPath`: 视频文件路径（WSL 路径，在 `/mnt/d/wsl-bridge/` 下）
- `title`: 作品标题（30字以内）
- `description`: 作品简介（可包含 #话题 标签）
- `visibility`: `"private"` (仅自己可见) | `"friends"` (好友可见) | `"public"` (公开)
- `aiGenerated`: 是否声明为 AI 生成内容

## 步骤

1. **读取 input.json**
2. **复制视频到中转目录**（加时间戳避免冲突）：
   ```bash
   TS=$(date +%s)
   cp <videoPath> "/mnt/d/wsl-bridge/${TS}_video.mp4"
   ```
3. **导航到创作者中心上传页**
4. **上传视频**（使用 Windows 路径 `D:\wsl-bridge\<TS>_video.mp4`）
5. **等待页面跳转到编辑页**（sleep 5-8秒）
6. **填写标题**（用 `fill`）
7. **设置封面**（点击「选择封面」→ 确认 AI 推荐封面）
8. **AI 声明**（如果 aiGenerated=true）
9. **设置可见性**（点击对应 checkbox）
10. **填写简介**（最后填！用 `evaluate_script` 设置 innerHTML）
11. **点击发布**
12. **验证发布成功**（检查页面跳转到作品管理 + 新作品出现）
13. **清理中转文件**

## 输出

在 `/home/lamarck/pi-mono/lamarck/tmp/publish-douyin/result.json` 写入结果：

```json
{
  "success": true,
  "title": "你的代码，你还看得懂吗？",
  "visibility": "private",
  "timestamp": "2026-02-16T15:20:00Z",
  "notes": "横封面未设置（非必须）"
}
```

## 注意

- **默认 private**: 除非 input.json 明确指定 public，否则一律设为「仅自己可见」
- **操作顺序**: 标题 → 封面 → AI声明 → 可见性 → **简介最后填**（避免 contenteditable 被覆盖）
- **文件路径**: Chrome 运行在 Windows 上，必须使用 `D:\wsl-bridge\` 路径
- **封面**: 优先使用 AI 推荐封面，避免复杂的自定义封面流程

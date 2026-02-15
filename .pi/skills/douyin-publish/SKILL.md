---
name: douyin-publish
description: 通过浏览器自动化在抖音创作者平台发布视频。包括上传视频、设置封面、填写描述、添加AI生成声明、发布。Use when you need to publish a video to Douyin.
---

# Douyin Publish

通过 mcporter + chrome-devtools 在抖音创作者平台（creator.douyin.com）发布视频。

## Prerequisites

- Chrome 已通过 mcporter 启动并登录了抖音创作者中心
- 视频文件在 WSL 文件系统中

## Critical: File Path

Chrome 运行在 Windows 上，**无法读取 WSL 路径**（如 `/home/lamarck/...`）。必须先把文件复制到 WSL-Windows 中转目录：

- **WSL 侧路径**：`/mnt/d/wsl-bridge/`
- **Windows 侧路径**：`D:\wsl-bridge\`

文件名加时间戳避免冲突：

```bash
TS=$(date +%s)
cp /path/to/video.mp4 "/mnt/d/wsl-bridge/${TS}_video.mp4"

# 如果有封面图也一起复制
cp /path/to/cover.png "/mnt/d/wsl-bridge/${TS}_cover.png"
```

上传时使用 Windows 路径格式：`D:\wsl-bridge\<TS>_video.mp4`

上传完成后清理中转文件：
```bash
rm /mnt/d/wsl-bridge/${TS}_*
```

> **为什么？** `DOM.setFileInputFiles` 和 `upload_file` 传入的路径由 Chrome（Windows 进程）读取。WSL UNC 路径（`\\wsl$\Ubuntu\...`）虽然不报错，但文件 size=0，导致页面异常挂起。只有 Windows 本地路径才能正常工作。

## Step 1: Navigate to Upload Page

```bash
mcporter call chrome-devtools.navigate_page type=url url="https://creator.douyin.com/creator-micro/content/upload"
```

等待页面加载后 take_snapshot。如果出现"你还有上次未发布的视频，是否继续编辑？"的提示，根据情况点击"继续编辑"或"放弃"。

## Step 2: Upload Video

在上传页找到 `button "选择文件"` 的 uid，使用 `upload_file` 上传：

```bash
mcporter call chrome-devtools.upload_file uid=<file_input_uid> filePath="D:\\wsl-bridge\\video.mp4"
```

上传成功后页面会自动跳转到发布编辑页。等待 3-5 秒让视频处理完成，然后 take_snapshot 确认。

> **不要用 WSL 路径！** 详见上方 Critical 说明。

## Step 3: Fill in Details

页面跳转后，take_snapshot 获取所有元素的 uid。以下是需要填写的字段：

### 3a. 作品标题

找到 `textbox "填写作品标题，为作品获得更多流量"` 的 uid，用 fill 填写（30字以内）：

```bash
mcporter call chrome-devtools.fill uid=<title_uid> value="视频标题"
```

### 3b. 作品简介

找到包含"添加作品简介"的 contenteditable 区域。这是一个富文本编辑器，需要先点击激活，再用键盘输入：

```bash
mcporter call chrome-devtools.click uid=<intro_area_uid>
# 然后通过 evaluate_script 设置内容
mcporter call chrome-devtools.evaluate_script --args '{"function": "() => { ... }"}'
```

简介中包含话题标签和描述文字，格式参考发布指南中的作品描述。

### 3c. 话题标签

在简介编辑区域输入 `#话题名` 会自动触发话题搜索。也可以在"#添加话题"区域操作。

## Step 4: Set Cover (Optional)

页面上会显示"AI智能推荐封面"，可以直接选一个。如果有自定义封面：

1. 点击"选择封面"（竖封面 3:4 或横封面 4:3）
2. 在弹出的封面编辑器中找到上传入口
3. 用 `upload_file` 上传封面图（同样用 Windows 路径）

## Step 5: Add AI Declaration

我们的视频使用了 AI TTS 和 AI 生成内容，必须添加 AI 生成声明：

1. 在右侧找到"自主声明" → "添加声明"，点击它
2. 弹出"作者自主声明"对话框
3. 选择 `radio "内容由AI生成"`
4. 点击"确定"

```bash
# 点击"添加声明"
mcporter call chrome-devtools.click uid=<add_declaration_uid>
# 等待弹窗出现，take_snapshot 获取新 uid
mcporter call chrome-devtools.click uid=<ai_generated_radio_uid>
mcporter call chrome-devtools.click uid=<confirm_button_uid>
```

## Step 6: Set Visibility

默认是"公开"。测试时建议先用"仅自己可见"：

```bash
mcporter call chrome-devtools.click uid=<private_checkbox_uid>
```

发布设置中的选项：
- `checkbox "公开"` — 所有人可见
- `checkbox "好友可见"` — 仅好友
- `checkbox "仅自己可见"` — 私密，适合测试
- `checkbox "立即发布"` / `checkbox "定时发布"` — 发布时间

## Step 7: Publish

确认所有信息无误后，点击"发布"按钮：

```bash
mcporter call chrome-devtools.click uid=<publish_button_uid>
```

发布后等待页面提示上传完成。如果视频还在上传中，不要关闭页面。

## Troubleshooting

### 页面 hang / CDP 连接断开

最可能的原因是文件路径问题。如果用了 WSL 路径上传，Chrome 无法读取文件，页面会卡死。

恢复方法：
1. 通过 CDP WebSocket 直接发送 `Page.navigate` 到 `about:blank`
2. `mcporter daemon restart`
3. 重新开始流程

```javascript
// 恢复脚本
const listRes = await fetch('http://172.30.144.1:19301/json/list');
const pages = await listRes.json();
const page = pages.find(p => p.url.includes('creator.douyin.com'));
const ws = new WebSocket(page.webSocketDebuggerUrl);
ws.onopen = () => {
  ws.send(JSON.stringify({id: 1, method: 'Page.navigate', params: {url: 'about:blank'}}));
};
```

### upload_file 返回成功但页面没变化

检查文件是否真的可读：
```bash
mcporter call chrome-devtools.evaluate_script --args '{"function": "() => { const f = document.querySelector(\"input[type=file]\").files[0]; return f ? { name: f.name, size: f.size } : \"no file\"; }"}'
```

如果 `size: 0` 说明路径有问题，换用 Windows 本地路径。

### "上次未发布的视频"提示

之前的上传操作可能留下了草稿。点击"放弃"清除，或"继续编辑"恢复之前的进度。

## Reference: Page Structure

上传页（`/content/upload`）：
- `button "上传视频"` — 触发上传（会打开文件选择器，不要用这个）
- `button "选择文件"` — 隐藏的 `<input type="file">`，用 `upload_file` 操作这个

发布编辑页（`/content/post/video`）：
- `textbox` — 作品标题（30字）
- `generic "添加作品简介"` — 作品描述（富文本）
- `"#添加话题"` / `"@好友"` — 话题和@
- `"选择封面"` — 竖封面/横封面
- `"添加声明"` → `radio "内容由AI生成"` — AI声明
- `checkbox "公开"/"好友可见"/"仅自己可见"` — 可见性
- `checkbox "立即发布"/"定时发布"` — 发布时间
- `button "发布"` — 发布
- `button "暂存离开"` — 保存草稿

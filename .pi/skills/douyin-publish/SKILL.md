---
name: douyin-publish
description: 通过浏览器自动化在抖音创作者平台发布内容（视频、图文、文章）。Use when you need to publish content to Douyin.
---

# Douyin Publish

通过 mcporter + chrome-devtools 在抖音创作者平台（creator.douyin.com）发布内容。

支持三种发布类型：
- **视频** — mp4/webm，60分钟以内，16G以内
- **图文** — jpg/jpeg/png/webp，最多35张，单张50MB以内
- **文章** — 富文本，8000字以内，可配头图和封面

（全景视频需要 360° 全景格式，暂不涉及）

## Prerequisites

- Chrome 已通过 mcporter 启动并登录了抖音创作者中心
- 要上传的文件在 WSL 文件系统中

## Current Policy

**所有发布一律设为"仅自己可见"。** 当前视频/图文/文章的整体质量还不够高，在质量达标之前不公开发布。等 Ren 确认内容质量可以后再切换为公开。

## Critical: File Path (WSL → Windows Bridge)

Chrome 运行在 Windows 上，**无法读取 WSL 路径**。所有需要上传的文件必须先复制到中转目录：

- **WSL 侧**：`/mnt/d/wsl-bridge/`
- **Windows 侧**：`D:\wsl-bridge\`

文件名加时间戳避免冲突：

```bash
TS=$(date +%s)
cp /path/to/video.mp4 "/mnt/d/wsl-bridge/${TS}_video.mp4"
cp /path/to/cover.png "/mnt/d/wsl-bridge/${TS}_cover.png"
```

`upload_file` 时使用 Windows 路径：`D:\wsl-bridge\<TS>_video.mp4`

上传完成后清理：
```bash
rm /mnt/d/wsl-bridge/${TS}_*
```

> **为什么？** Chrome（Windows 进程）读取 `upload_file` / `DOM.setFileInputFiles` 传入的路径。WSL UNC 路径（`\\wsl$\...`）虽然不报错，但文件 size=0，导致页面异常挂起。

---

## Publishing: Video

### 1. Navigate

```bash
mcporter call chrome-devtools.navigate_page type=url \
  url="https://creator.douyin.com/creator-micro/content/upload"
```

等待加载后 `take_snapshot`。如果出现"你还有上次未发布的视频"提示，点"放弃"或"继续编辑"。

确认当前在"发布视频"标签页（默认选中）。

### 2. Upload

找到 `button "选择文件"` 的 uid：

```bash
mcporter call chrome-devtools.upload_file uid=<file_input_uid> \
  filePath="D:\\wsl-bridge\\<TS>_video.mp4"
```

上传成功后页面自动跳转到 `/content/post/video` 编辑页。等 3-5 秒再 `take_snapshot`。

### 3. Set Cover (Required)

封面是**必填**的，不设封面无法发布。

**方式一：AI 推荐封面（最简单）**

上传视频后编辑页会显示 AI 智能推荐封面缩略图。通过 `evaluate_script` 点击推荐封面：

```bash
mcporter call chrome-devtools.evaluate_script --args '{"function": "() => { const imgs = document.querySelectorAll(\"img\"); for (const img of imgs) { const rect = img.getBoundingClientRect(); if (rect.y > 200 && rect.y < 300 && rect.x > 400 && rect.x < 500) { img.click(); return \"clicked\"; } } return \"not found\"; }"}'
```

点击后弹出"是否确认应用此封面？"对话框，find `button "确定"` 的 uid 并点击。确认后竖封面(3:4)和横封面(4:3)会同时设置好。

**方式二：自定义封面**

点击"选择封面"（竖封面 3:4 或横封面 4:3），在弹出的编辑器中上传封面图（需要 Windows 路径）。

### 4. Fill Details

**操作顺序很重要**：先填标题，再设封面和声明，**最后填简介**。简介区是 contenteditable 富文本编辑器，如果填完简介后去操作话题等其他区域，简介内容可能被覆盖。
接下来我们说这个文章，然后你也重新去试一下看，看看这个文章是怎么发的。
| 字段 | 元素 | 说明 |
|------|------|------|
| 作品标题 | `textbox "填写作品标题..."` | 30字以内，用 `fill` |
| 作品简介 | `generic "添加作品简介"` | 富文本 contenteditable，用 `evaluate_script` 设置 innerHTML |
| 合集 | `"请选择合集"` 下拉 | 可选 |

**填写简介的方法**：

```javascript
// 先写一个 JS 文件，然后用 evaluate_script 执行
() => {
  const editor = document.querySelector('[contenteditable=true]');
  editor.focus();
  const paragraphs = ['第一段', '第二段', '第三段'];
  editor.innerHTML = paragraphs.map(p => '<p>' + p + '</p>').join('');
  editor.dispatchEvent(new Event('input', {bubbles: true}));
  return editor.textContent.substring(0, 80);
}
```

> **话题标签**：`#添加话题` 的独立输入区域交互复杂且不稳定。建议**不用**话题输入区域——话题标签在移动端展示中效果有限，对于我们的账号定位价值不大。如果确实需要话题，可以在简介正文中写 `#话题名` 文本。

### 5. AI Declaration

1. 点击右侧"自主声明" → "添加声明"
2. 弹窗中选择 `radio "内容由AI生成"`
3. 点击"确定"

### 5. Visibility & Publish

- `checkbox "公开"` / `checkbox "好友可见"` / `checkbox "仅自己可见"`
- `checkbox "立即发布"` / `checkbox "定时发布"`
- 点击 `button "发布"`

发布后页面跳转到作品管理页。**需要刷新页面**才能看到新发布的作品。

---

## Publishing: Image-Text (图文)

### 1. Navigate

同视频，打开上传页后点击"发布图文"标签。

### 2. Upload Images

找到图文标签下的 `button "选择文件"` uid：

```bash
mcporter call chrome-devtools.upload_file uid=<file_input_uid> \
  filePath="D:\\wsl-bridge\\<TS>_image1.png"
```

上传成功后页面跳转到 `/content/post/image` 编辑页。

要添加更多图片，点击"继续添加"按钮，然后再次 `upload_file`。最多35张。

### 3. Fill Details

**操作顺序**：先填标题 → AI 声明 → 可见性 → **最后填描述**（同视频，避免 contenteditable 内容被覆盖）。

| 字段 | 元素 | 说明 |
|------|------|------|
| 作品标题 | `textbox "添加作品标题"` | **20字以内**（比视频短），用 `fill` |
| 作品描述 | `generic "添加作品描述..."` | 富文本 contenteditable，用 `evaluate_script` 设置 innerHTML |
| 封面 | `"选择一张图片作为封面"` | **自动用第一张图**，无需手动操作（与视频不同） |
| 音乐 | `"选择音乐"` | 可选配乐 |
| 合集 | `"不选择合集"` 下拉 | 可选 |

> **与视频的关键区别**：图文的封面**不是必填**的——上传图片后自动选第一张作为封面，可以直接发布。视频必须手动选封面否则无法发布。

### 4. AI Declaration

同视频流程。右侧"自主声明" → "添加声明" → `radio "内容由AI生成"` → "确定"。

### 5. Visibility & Publish

同视频。点击 `button "发布"`。发布后页面跳转到作品管理页，**需要刷新页面**才能看到新发布的图文（列表不会自动更新）。

---

## Publishing: Article (文章)

### 1. Navigate

打开上传页后点击"发布文章"标签，然后点击 `button "我要发文"`。

页面跳转到 `/content/post/article` 编辑页。

### 2. Fill Title & Summary

先填标题和摘要（普通 textbox，直接用 `fill`）：

| 字段 | 元素 | 说明 |
|------|------|------|
| 文章标题* | `textbox "请输入文章标题..."` | 30字以内，用 `fill` |
| 文章摘要 | `textbox "添加内容摘要..."` | 30字以内，用 `fill` |

### 3. Fill Body

正文是**富文本编辑器**（`textbox multiline`），**不能用 `fill`**（会超时），必须用 `evaluate_script` 设置 innerHTML：

```javascript
() => {
  // 找到高度最大的 contenteditable 元素（正文编辑器）
  const editors = document.querySelectorAll('[contenteditable=true]');
  let editor = null;
  for (const e of editors) {
    const rect = e.getBoundingClientRect();
    if (rect.height > 200) { editor = e; break; }
  }
  editor.focus();
  const paragraphs = ['第一段', '第二段'];
  editor.innerHTML = paragraphs.map(p => '<p>' + p + '</p>').join('');
  editor.dispatchEvent(new Event('input', {bubbles: true}));
  return editor.textContent.substring(0, 80);
}
```

工具栏支持：撤销/重做、字号(T)、加粗(B)、斜体(I)、引用("")、图片、有序列表、无序列表。

### 4. Upload Cover (Required)

封面是**必填**的。文章的封面上传**没有 `input[type=file]`**，不能在 snapshot 中找到文件选择按钮。

正确方式：对 `"点击上传封面图"` 的 StaticText uid 直接使用 `upload_file`：

```bash
mcporter call chrome-devtools.upload_file uid=<cover_text_uid> \
  filePath="D:\\wsl-bridge\\<TS>_cover.png"
```

上传后会弹出**封面编辑器**（可以添加花字、裁剪等）。找到 `button "完成"` 并点击。

> **注意**：`button "完成"` 可能无法通过 `click` 的 uid 点击（超时），需要用 `evaluate_script` 点击：
> ```javascript
> () => {
>   const btns = document.querySelectorAll('button');
>   for (const btn of btns) {
>     if (btn.textContent.trim() === '完成') { btn.click(); return 'clicked'; }
>   }
>   return 'not found';
> }
> ```

### 5. Header Image (Optional)

文章头图（`"点击上传图片"` 或 `"AI 配图"`）是可选的，会在推荐频道中展示。上传方式同封面。

### 6. Visibility & Publish

- `checkbox "公开"` / `checkbox "好友可见"` / `checkbox "仅自己可见"`
- `checkbox "立即发布"` / `checkbox "定时发布"`
- 点击 `button "发布"`

> **与视频/图文的区别**：
> - 文章编辑页**没有**"自主声明"入口
> - 文章编辑页**没有**"保存权限"设置
> - 正文不能用 `fill`，必须用 `evaluate_script`
> - 封面上传后会弹出编辑器，需要点"完成"确认

---

## Shared Patterns

### Draft Recovery

如果之前有未完成的上传，页面会提示"你还有上次未发布的视频/图文，是否继续编辑？"
- 点"继续编辑"恢复草稿
- 点"放弃"清除

### Tab Switching on Upload Page

上传页 `/content/upload` 有四个标签：
- `"发布视频"` — 默认选中
- `"发布图文"`
- `"发布全景视频"`
- `"发布文章"`

点击对应 StaticText 的 uid 即可切换。

### Troubleshooting: Page Hang

最可能原因：文件路径使用了 WSL 路径。

恢复方法：
```javascript
// 通过 CDP WebSocket 强制导航到 about:blank
const listRes = await fetch('http://172.30.144.1:19301/json/list');
const pages = await listRes.json();
const page = pages.find(p => p.url.includes('creator.douyin.com'));
const ws = new WebSocket(page.webSocketDebuggerUrl);
ws.onopen = () => {
  ws.send(JSON.stringify({id: 1, method: 'Page.navigate', params: {url: 'about:blank'}}));
};
```

然后 `mcporter daemon restart` 重新连接。

### Checking Upload Success

上传文件后，验证文件是否真的可读：
```bash
mcporter call chrome-devtools.evaluate_script --args '{"function": "() => { const f = document.querySelector(\"input[type=file]\").files[0]; return f ? { name: f.name, size: f.size } : \"no file\"; }"}'
```

如果 `size: 0` 或 `"no file"` 说明路径有问题。

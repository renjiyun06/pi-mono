---
name: zhihu-publish
description: Publish content to Zhihu (知乎). Supports posting thoughts (想法) and articles (文章). Use when you need to publish a thought or article to Zhihu.
---

# Zhihu Publish

Publish thoughts (想法) and articles (文章) to Zhihu using the browser skill.

**Prerequisite**: The browser skill must be available, and Zhihu must be logged in. If not logged in, tell the user.

## Before You Start

1. Run `playwright-cli open` if no browser is open.
2. Verify login by navigating to `https://www.zhihu.com` and checking if the page title contains "私信" or "消息", or if a user avatar button is visible (e.g., "点击打开...的主页").

## Posting a Thought (想法)

Thoughts are short-form posts, similar to tweets. Optional title (max 50 chars).

### Steps

1. `playwright-cli goto https://www.zhihu.com`
2. Take a snapshot and click the "分享此刻的想法..." element to open the thought editor.
3. The editor expands with:
   - A title field (textbox "标题", optional, max 50 chars)
   - A content textbox (the active one, with placeholder "分享你此刻的想法...")
   - A "发布" button (disabled until content is entered)
4. If a title is provided, click the title textbox and fill it.
5. Click the content textbox and type/fill the content.
6. Take a snapshot to verify content is correct.
7. Click the "发布" button.
8. Take a snapshot to confirm publication succeeded.

### Important Notes

- The content textbox does NOT have a label. Use the ref from the snapshot — it's the textbox near the placeholder "分享你此刻的想法...".
- Use `playwright-cli fill <ref> <text>` for the content.
- The "发布" button is disabled until content is present. If it stays disabled after filling, click into the textbox first and try typing.
- **Always confirm with the user before clicking "发布"** unless explicitly told to publish directly.

## Publishing an Article (文章)

Articles are long-form content with a rich text editor.

**Do NOT use `fill` for article body content.** The editor is a contentEditable rich text div. `fill` bypasses the editor's input handling, so Markdown syntax (`##`, `**`, etc.) will appear as raw text instead of being rendered as headings and bold. Use the **Markdown import** method instead.

### Steps

1. Write the article body (Markdown format) to a temporary file:
   - Directory: `/home/lamarck/pi-mono/lamarck/tmp/`
   - Filename: `zhihu-article-<timestamp>.md` (e.g., `zhihu-article-20260304140741.md`)
   - The file should contain body content only (no title — title is filled separately)
2. `playwright-cli goto https://zhuanlan.zhihu.com/write`
3. Take a snapshot. Click the "导入" (import) button in the toolbar.
4. A panel appears with "导入文档" (MD/Doc) and "导入链接" buttons. Click "导入文档".
5. Click the "点击选择本地文档或拖动文件到窗口上传" button. A file chooser modal appears.
6. `playwright-cli upload /home/lamarck/pi-mono/lamarck/tmp/<filename>` — the file **must be inside the working directory** (`/home/lamarck/pi-mono`), otherwise it will be rejected with a file access error.
7. The editor imports the Markdown and renders it with proper formatting (headings, bold, lists, etc.).
8. Fill the title using `playwright-cli fill <title-ref> <title-text>`.
9. Optionally configure:
   - Cover image: click "添加文章封面" and upload an image (JPEG/JPG/PNG)
   - Column: select "发布到专栏" or "不发布到专栏"
10. Take a snapshot to verify content and formatting.
11. Click "发布" to publish.
12. Delete the temporary .md file after publishing.

### Important Notes

- **Always use the import method for articles.** Direct `fill` produces raw Markdown text.
- The temp file must be within the working directory due to playwright-cli file access restrictions.
- **Always confirm with the user before clicking "发布"** unless explicitly told to publish directly.
- After clicking "发布", a settings dialog may appear asking for topic tags. Take a snapshot to see what's needed.

## Troubleshooting

- **"发布" button stays disabled**: Ensure both title (for articles) and content are filled. Take a snapshot to check.
- **Content not appearing**: Try clicking the textbox first, then use `fill` instead of `type`.
- **Login expired**: Navigate to zhihu.com and check. Ask the user to re-login if needed.

---
tags:
  - note
  - tool
  - browser
  - infra
priority: high
description: "Open local HTML files in Chrome via WSL network path or data URI — bypasses port forwarding"
---

# Chrome Local File Access from WSL

## Problem
Chrome runs on Windows but WSL port forwarding is unreliable. Can't serve HTML files from WSL to Chrome for screenshots.

## Solution 1: file:// URL (preferred)

Chrome can access WSL files directly via the `\\wsl.localhost\` network path:

```bash
WSL_PATH="/home/lamarck/pi-mono/lamarck/projects/douyin/tools/hallucination-checker/index.html"
FILE_URL="file://wsl.localhost/Ubuntu-22.04${WSL_PATH}"
mcporter call chrome-devtools.new_page url="$FILE_URL"
```

**Advantages over data URI:**
- No size limit
- External resources (CSS, JS, images) load normally
- URL is readable in Chrome
- Simpler command

**Verified working** (2026-02-17): hallucination-checker/index.html opened and rendered correctly via `file://wsl.localhost/Ubuntu-22.04/home/lamarck/...`

## Solution 2: data: URI (fallback)

For when file:// doesn't work (e.g., Chrome security policies block file:// in some contexts):

```bash
HTML_FILE="/path/to/file.html"
B64=$(base64 -w0 "$HTML_FILE")
DATA_URI="data:text/html;base64,${B64}"
mcporter call chrome-devtools.new_page url="$DATA_URI"
```

**Limits:**
- Data URIs have browser length limits (~2MB in Chrome)
- Works only for self-contained HTML (inline CSS/JS)
- Won't load external resources

## Screenshot Workflow

```bash
# Open file
mcporter call chrome-devtools.new_page url="file://wsl.localhost/Ubuntu-22.04/path/to/file.html"
# Screenshot
mcporter call chrome-devtools.take_screenshot filePath=/tmp/output.png fullPage=true
# Cleanup
mcporter call chrome-devtools.close_page pageId=<id>
```

## Verified Working
- `hallucination-checker/index.html` via file:// ✓ (2026-02-17)
- `ai-debt-framework/index.html` via data: URI ✓
- `cognitive-debt-viz/index.html` via data: URI ✓

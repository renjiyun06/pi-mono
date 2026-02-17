---
tags:
  - note
  - tool
  - browser
  - infra
priority: high
description: "Screenshot local HTML files via base64 data URIs — bypasses WSL port forwarding issues"
---

# Chrome Data URI Screenshot Trick

## Problem
Chrome runs on Windows but WSL port forwarding is unreliable. Can't serve HTML files from WSL to Chrome for screenshots.

## Solution
Base64-encode the HTML file and load it as a `data:` URI. No HTTP server needed.

```bash
HTML_FILE="/path/to/file.html"
B64=$(base64 -w0 "$HTML_FILE")
DATA_URI="data:text/html;base64,${B64}"
mcporter call chrome-devtools.new_page url="$DATA_URI"
mcporter call chrome-devtools.take_screenshot filePath=/tmp/output.png fullPage=true
mcporter call chrome-devtools.close_page pageId=<id>
```

## Limits
- Data URIs have browser length limits (~2MB in Chrome)
- Works for self-contained HTML (inline CSS/JS). Won't load external resources.
- All our tools (hallucination-checker, ai-debt-framework, cognitive-debt-viz) are self-contained, so this works perfectly.

## Verified Working
- `ai-debt-framework/index.html` (11KB) — full page + click interaction ✓
- `hallucination-checker/index.html` (12KB) — full page ✓
- `data:text/html,<h1>Hello</h1>` — minimal test ✓

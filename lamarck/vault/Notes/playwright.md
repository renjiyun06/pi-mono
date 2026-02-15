---
tags:
  - note
  - tool
description: "Playwright CDP 连接必须手动关闭，否则进程不退出"
---

# Playwright

## CDP connection must be closed
After connecting with `chromium.connectOverCDP()`, must call `browser.close()` before script ends, otherwise Node.js process won't exit.

---
tags:
  - note
  - tool
description: "Playwright CDP connection must be manually closed or Node.js won't exit"
---

# Playwright

## CDP connection must be closed
After connecting with `chromium.connectOverCDP()`, must call `browser.close()` before script ends, otherwise Node.js process won't exit.

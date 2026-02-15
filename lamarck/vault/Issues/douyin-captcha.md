---
tags:
  - issue
  - douyin
status: open
description: "Occasional CAPTCHA when downloading Douyin videos via browser automation"
---

# Douyin Video Download CAPTCHA

**Problem**: When accessing Douyin videos via [[browser-automation|browser automation]], a slider CAPTCHA occasionally appears, preventing video URL extraction.

**Observations**:
- CAPTCHA does not appear every time
- After appearing, retries still show the CAPTCHA page
- Possible triggers: access frequency, browser fingerprinting, IP restrictions, time-based policy

**Current impact**:
- douyin-video-transcribe task runs every 5 minutes, mostly succeeds, occasionally fails due to CAPTCHA

**Potential solutions**:
1. Use a logged-in Chrome profile (cookies)
2. Add automatic CAPTCHA detection/bypass (technically difficult)
3. Reduce access frequency
4. Use proxy IP rotation
5. Explore official APIs or third-party services

**Current workaround**: Task exits on CAPTCHA, waits for next scheduled retry.

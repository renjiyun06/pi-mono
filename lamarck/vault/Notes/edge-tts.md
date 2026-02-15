---
tags:
  - note
  - tool
  - tts
description: "edge-tts usage: Node.js hangs in WSL, use Python version instead"
---

# edge-tts

## Node.js package hangs in WSL
The `edge-tts-universal` npm package's `Communicate.stream()` hangs indefinitely in WSL2. The `listVoices()` API works fine (HTTP), but audio synthesis (WebSocket to Microsoft servers) never completes. Likely a WebSocket compatibility issue with WSL2's network stack.

**Workaround**: Use the Python `edge-tts` package which works reliably. Two integration options:
1. CLI: `python -m edge_tts --voice <voice> --text <text> --write-media <path>` (~2.6s/sentence)
2. HTTP server: `/home/lamarck/pi-mono/lamarck/projects/debt-call-shield/src/services/tts-server.py` (~2.5s/sentence, supports concurrent requests)

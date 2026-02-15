---
tags:
  - note
  - tool
  - tts
description: "TTS duration calibration: text must be ~30% shorter than script for target duration"
priority: high
---

# TTS Duration Calibration

## Key Finding

Script text and TTS-ready text are not the same length. When generating audio with edge-tts, the text needs to be **~30% shorter** than what looks right on paper to hit the target duration (70-80s for our episodes).

## Rate Impact on Duration

| rate parameter | Duration multiplier (approx) |
|---------------|------------------------------|
| +10% | 0.85x |
| +5% | 0.92x |
| +0% | 1.0x |
| -5% | 1.10x |
| -10% | 1.22x |
| -30% | 1.55x |

A scene written for "10 seconds" at -10% rate will actually take ~12 seconds. At -30% it becomes ~15 seconds.

## Practical Guidelines

1. **Write script first, then cut for TTS** — the script file is the creative document, the actual TTS text can be a trimmed version
2. **-5% is the sweet spot** for "thoughtful" scenes — adds weight without excessive drag
3. **-10% and below** should only be used for very short scenes (under 5 lines of text) or the duration explodes
4. **Always test duration before committing** — generate audio and check with ffprobe before declaring a scene "done"
5. **Multi-segment scenes** (voice switching mid-scene) add ~0.5s gap per boundary in the combined file

## Workflow

```bash
# Generate single segment
edge-tts --voice zh-CN-YunxiNeural --rate="-5%" --pitch="+0Hz" \
  --text "..." --write-media /mnt/d/wsl-bridge/<ep>-audio/<scene>.mp3

# Check duration
ffprobe -v error -show_entries format=duration -of csv=p=0 <file>

# If over, trim text and regenerate
# Target: total of all segments = 70-85 seconds
```

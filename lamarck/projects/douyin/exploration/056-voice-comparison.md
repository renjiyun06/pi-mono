# 056 - Voice Comparison: edge-tts Chinese Voices

> Date: 2026-02-16

## Available Chinese Voices

| Voice | Gender | Style | Tone | Notes |
|-------|--------|-------|------|-------|
| YunxiNeural | Male | Novel | Lively, Sunshine | **Current default** — good range but not emotional enough for confessions |
| YunjianNeural | Male | Sports, Novel | Passion | More emotional delivery, slightly slower pacing |
| YunyangNeural | Male | News | Professional | Fastest pacing, more authoritative — good for explainers |
| XiaoxiaoNeural | Female | News, Novel | Warm | Warm tone, could add variety to content |
| XiaoyiNeural | Female | Cartoon, Novel | Lively | Too playful for our content |
| YunxiaNeural | Male | Cartoon, Novel | Cute | Too youthful/cute |

## Recommendations by Series

| Series | Recommended Voice | Why |
|--------|-------------------|-----|
| AI的自白 (confessions) | YunjianNeural | More emotional, deliberate pacing |
| AI笑了吗 (humor) | YunxiNeural (current) | Lively matches comedy tone |
| AI看世界 (news) | YunyangNeural | Professional, authoritative |
| 1分钟懂AI (explainers) | YunyangNeural | Clear, professional |
| AI人间观察 (observation) | YunjianNeural or XiaoxiaoNeural | Passion/warmth for empathy |
| AI日记 (diary) | YunjianNeural | Most intimate feel |

## Duration Comparison (same text, -8% rate)

Same 32-character text across voices:
- YunxiNeural: 9.6s
- YunjianNeural: 9.8s (slowest — more deliberate)
- YunyangNeural: 8.1s (fastest)
- XiaoxiaoNeural: 8.7s

## Limitations

edge-tts doesn't support:
- SSML emotion tags (tested: breaks inflate duration 5x, see exploration 053)
- Style switching within one utterance
- Prosody control beyond rate/pitch

## Advanced TTS Options (Require GPU)

| Model | Feature | Status |
|-------|---------|--------|
| Qwen3-TTS (Alibaba) | Voice clone, 9 emotion presets, style control | Open source, needs GPU |
| GLM-TTS (Zhipu) | Zero-shot voice clone (3s), RL-enhanced emotion | Open source, needs GPU |

These would give us true emotional control but our WSL environment has no GPU. Noted for future when we might have GPU access or use a cloud API.

## Action for Ren

Test files generated at `/tmp/voice-test/` — listen and compare:
- `zh-CN-YunxiNeural.mp3` (current)
- `zh-CN-YunjianNeural.mp3` (recommended for confessions)
- `zh-CN-YunyangNeural.mp3` (recommended for explainers)
- `zh-CN-XiaoxiaoNeural.mp3` (warm female alternative)

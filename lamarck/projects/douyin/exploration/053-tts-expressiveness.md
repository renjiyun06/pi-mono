# 053 - TTS Expressiveness: Edge-TTS SSML Limitations

> Date: 2026-02-16

## Experiment

Tested SSML (Speech Synthesis Markup Language) with edge-tts to add expressiveness:
- `<break time="500ms"/>` for dramatic pauses
- `<prosody rate="-10%" pitch="-2Hz">` for emphasis
- Different rates/pitches per sentence

## Results

SSML inflates audio duration dramatically:
- **Plain text**: 10s for 4 lines
- **SSML with breaks + prosody**: 55.7s for the same content

The SSML `<break>` tags and prosody changes cause massive timing issues. This makes SSML impractical for our render pipeline, which calculates video frames from audio duration.

## Available Chinese Voices (edge-tts)

| Voice | Gender | Categories |
|-------|--------|-----------|
| zh-CN-XiaoxiaoNeural | Female | News, Novel |
| zh-CN-XiaoyiNeural | Female | Cartoon, Novel |
| zh-CN-YunjianNeural | Male | Sports, Novel |
| zh-CN-YunxiNeural | Male | Novel (current) |
| zh-CN-YunxiaNeural | Male | Cartoon, Novel |
| zh-CN-YunyangNeural | Male | News |

## Alternatives for Better Expressiveness

1. **Different voices per section**: Use YunyangNeural (News, more authoritative) for hooks, YunxiNeural (Novel, narrative) for stories
2. **Rate variation**: Slower rate (-10%) for key moments, faster (-3%) for context
3. **Multiple TTS segments**: Break narration into smaller pieces with silence gaps inserted via ffmpeg
4. **Free alternatives**: No viable free alternatives to edge-tts found yet. ElevenLabs has free tier but limited.

## Current Approach

Keep using plain text with edge-tts, rate="-5%", voice=YunxiNeural. The flat delivery is a known weakness but not solvable within zero-budget constraints without significant pipeline changes.

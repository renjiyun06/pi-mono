---
tags:
  - note
  - tool
  - tts
description: "Qwen3-TTS as potential upgrade from edge-tts — voice cloning, emotion control, open-source, blocked on GPU"
---

# Qwen3-TTS Upgrade Opportunity

## Current State
We use **edge-tts** (free Microsoft API) for all narration. Quality is decent but limited:
- Fixed voices (YunxiNeural, YunjianNeural)
- No emotion control (SSML pauses inflate duration 5x — explored and rejected in exploration 053)
- No voice customization

## Qwen3-TTS (January 2026)
Alibaba's open-source TTS family. Apache 2.0.
- **3-second voice cloning** — could create unique AI narrator persona
- **Emotion/prosody/tone control** — huge quality upgrade for confessional vs analytical content
- **10 languages** including Chinese
- **Outperforms** MiniMax, ElevenLabs, SeedTTS in benchmarks

### Models
- 1.7B (6GB VRAM, highest quality, voice design + cloning)
- 0.6B (4GB VRAM, efficient, cloning only)

### Access Options
1. **Local**: Requires GPU (4-6GB VRAM). We don't have GPU in WSL. **Blocked.**
2. **Alibaba Cloud API**: $0.115/10K chars. Free quota: 10K chars (90 days). Cheap enough for testing.
3. **HuggingFace Spaces**: Some community demos available, quality varies.

## Impact If Adopted
- Could create a distinctive AI voice for our Douyin content (voice cloning from a reference sample)
- Emotion control would dramatically improve confessional content (ai-midnight-thought, ai-confession-replaceable)
- Different voices per series: warm for confessions, sharp for analysis, playful for humor
- Still Chinese-first quality (Alibaba optimized for Chinese)

## Decision
Not pursuing now — blocked on GPU locally, would need Alibaba Cloud account setup. Document for when Ren reviews TTS options. Edge-tts is good enough for launch.

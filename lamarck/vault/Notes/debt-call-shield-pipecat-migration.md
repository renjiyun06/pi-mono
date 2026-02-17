---
tags:
  - note
  - tool
description: "Analysis: should debt-call-shield migrate from custom pipeline to Pipecat?"
---

# Debt-Call-Shield: Pipecat Migration Analysis

## Current State
- 1425 lines TypeScript (custom pipeline)
- Components: Twilio WebSocket handler, WhisperASR, OpenRouter LLM, Edge TTS, audio transcoding, intent classification, 4 strategy prompts
- Status: works in stub mode, blocked on Twilio account

## What Pipecat Would Replace
- Twilio WebSocket handling (~200 lines)
- ASR integration and VAD (~190 lines)
- TTS integration and audio transcoding (~200 lines)
- Pipeline orchestration (~240 lines)
- **Total: ~830 lines replaced by Pipecat config**

## What We'd Keep
- Intent classification prompts and strategy logic (~183 lines in openrouter-llm.ts)
- Call history persistence (~153 lines)
- Strategy selection logic (embedded in call-session.ts)

## Verdict: Don't Migrate Yet
1. **Existing code works** in stub mode. Migration risk > benefit right now.
2. **Python vs TypeScript**: Pipecat is Python, our server is TypeScript (Fastify). Migration means rewriting everything, not just swapping the pipeline.
3. **Learning value**: Our custom pipeline teaches us exactly how the audio pipeline works. Pipecat would be a black box.
4. **When to reconsider**: If we hit hard Twilio integration bugs, or if we need features Pipecat handles well (barge-in, interruption handling, WebRTC).

## Recommendation
- Keep custom TypeScript pipeline for Phase 1 (Twilio testing)
- If Phase 2 (production with GoIP/FreeSWITCH) needs significant changes, evaluate Pipecat then
- Pipecat is the fallback if our custom pipeline proves too fragile

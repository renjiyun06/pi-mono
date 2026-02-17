---
tags:
  - note
  - research
  - tool
description: "Voice AI pipeline landscape in 2026 — frameworks, latency, costs for debt-call-shield"
---

# Voice AI Pipeline — 2026 Landscape

## Context
For [[Projects/debt-call-shield/index|debt-call-shield]]: AI agent answers phone calls, engages with debt collectors/scammers.

## Key Frameworks

### Pipecat (recommended for us)
- **What**: Open source Python framework for voice + multimodal AI
- **Repo**: github.com/pipecat-ai/pipecat (10.2K stars)
- **Architecture**: Modular pipeline: STT → LLM → TTS, swap any component
- **Latency**: Sub-1s voice-to-voice achievable (Modal blog demonstrates)
- **Phone integration**: Has Twilio examples out of the box (SIP dial-in, PSTN, outbound calls)
- **STT options**: Whisper, Deepgram, AssemblyAI
- **TTS options**: ElevenLabs, Cartesia, edge-tts (free)
- **LLM options**: Any — OpenAI, Anthropic, local models
- **Cost**: Framework is free. Cost = STT + LLM + TTS API usage
- **Why for us**: Zero license cost, Python (we know it), full control, Twilio integration ready

### LiveKit Agents
- WebRTC-based, sub-200ms latency
- Good for real-time apps
- More infrastructure overhead than Pipecat

### OpenAI Realtime API (gpt-realtime)
- Direct speech-to-speech, no separate STT/TTS
- Production-ready, lowest latency possible
- But: expensive, vendor lock-in, can't customize responses
- Supports SIP directly now

### Vapi
- Managed service — "build phone bots in days"
- BYOM (bring your own model)
- But: costs per minute, less control

## Architecture for Debt-Call-Shield

```
Incoming call → Twilio → Pipecat pipeline:
  → Deepgram STT (real-time transcription)
  → Intent classifier (催收/诈骗/正常)
  → LLM generates response (strategy-based)
  → edge-tts or Cartesia TTS
  → Audio back to caller via Twilio
```

### Cost Estimate (per minute of conversation)
- Deepgram STT: ~$0.0043/min (pay-as-you-go)
- LLM (Claude Haiku or GPT-4o-mini): ~$0.001-0.005/response
- edge-tts: FREE (Microsoft)
- Twilio: ~$0.0085/min inbound
- **Total**: ~$0.02/min ≈ 0.15 RMB/min

### Free Alternatives
- STT: faster-whisper (local, needs GPU) or Whisper API (OpenAI, $0.006/min)
- TTS: edge-tts (completely free, good Chinese voices)
- LLM: DeepSeek V3 via API (very cheap) or local model
- Phone: GoIP + FreeSWITCH (one-time hardware cost ~150 RMB)

## Key Technical Challenges
1. **Latency**: Must respond in <2s. Pipeline adds up: STT (~300ms) + LLM (~500ms) + TTS (~200ms) = ~1s best case
2. **Barge-in handling**: Caller interrupts mid-response. Pipecat supports this.
3. **Chinese ASR accuracy**: Debt collection calls have specific jargon. May need fine-tuned STT.
4. **Strategy selection**: Need prompt engineering for different caller types (aggressive collector, scammer, normal)
5. **Recording**: Must record both sides for evidence. Pipecat has transcript logging.

## Next Steps (when Ren approves)
1. Set up Pipecat locally: `pip install pipecat-ai`
2. Test with Twilio trial account ($15 credit)
3. Build minimal pipeline: Deepgram STT → GPT-4o-mini → edge-tts
4. Test Chinese voice quality with edge-tts YunxiNeural
5. Add intent classification for caller type

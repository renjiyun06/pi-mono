import type {
  ASRProvider,
  LLMProvider,
  TTSProvider,
  CallIntent,
  ConversationTurn,
  CallSessionConfig,
} from "./types.js";
import { mp3ToMulaw, splitMulawIntoChunks } from "../utils/audio-convert.js";
import { saveCallRecord } from "../utils/call-history.js";

/**
 * Manages a single call session.
 *
 * Orchestrates the ASR → LLM → TTS pipeline:
 * 1. Receives raw audio from telephony layer
 * 2. Feeds to ASR for transcription
 * 3. On final transcript, sends to LLM for response
 * 4. Streams LLM output through TTS
 * 5. Emits audio chunks back to telephony layer
 */
export class CallSession {
  private asr: ASRProvider;
  private llm: LLMProvider;
  private tts: TTSProvider;
  private history: ConversationTurn[] = [];
  private currentIntent: CallIntent = "unknown";
  private onAudioCallback: ((audio: Buffer) => void) | null = null;
  private processing = false;
  private pendingTranscript: string | null = null; // queue for speech received while processing
  private needsTranscode = false; // true when TTS outputs MP3 but telephony needs mulaw

  constructor(config: CallSessionConfig) {
    this.asr = config.asr;
    this.llm = config.llm;
    this.tts = config.tts;

    this.setupASRCallbacks();
  }

  /** Register callback for outbound audio chunks */
  onAudio(callback: (audio: Buffer) => void): void {
    this.onAudioCallback = callback;
  }

  /** Start the session (initialize ASR and TTS) */
  async start(
    inboundFormat: CallSessionConfig["inboundFormat"],
    outboundFormat: CallSessionConfig["outboundFormat"]
  ): Promise<void> {
    await this.asr.start(inboundFormat);
    await this.tts.start(outboundFormat);
    // Edge TTS outputs MP3, Twilio needs mulaw - enable transcoding
    this.needsTranscode = outboundFormat.encoding === "mulaw";
    console.log(
      `[call-session] Session started (transcode=${this.needsTranscode})`
    );
  }

  /** Feed inbound audio from telephony layer */
  feedAudio(audio: Buffer): void {
    this.asr.feedAudio(audio);
  }

  /** End the call session and persist history */
  destroy(): void {
    this.asr.destroy();
    this.tts.destroy();
    console.log(
      `[call-session] Session ended. ${this.history.length} turns recorded.`
    );
    // Persist call history (fire and forget)
    if (this.history.length > 0) {
      saveCallRecord(this.history, this.currentIntent).catch((err) => {
        console.error("[call-session] Failed to save call record:", err);
      });
    }
  }

  /** Get conversation history */
  getHistory(): ReadonlyArray<ConversationTurn> {
    return this.history;
  }

  /**
   * Emit audio to the telephony layer, transcoding if necessary.
   * TTS outputs MP3, but Twilio needs mulaw 8kHz.
   */
  private async emitAudio(audio: Buffer): Promise<void> {
    if (!this.onAudioCallback) return;

    if (this.needsTranscode) {
      try {
        const mulawData = await mp3ToMulaw(audio);
        // Split into 20ms chunks (160 bytes at 8kHz mulaw)
        const chunks = splitMulawIntoChunks(mulawData);
        for (const chunk of chunks) {
          this.onAudioCallback(chunk);
        }
      } catch (err) {
        console.error("[call-session] Audio transcode failed:", err);
      }
    } else {
      this.onAudioCallback(audio);
    }
  }

  private setupASRCallbacks(): void {
    // On partial transcript, we could do early intent detection
    this.asr.onPartial((text) => {
      // For now, just log partials
      console.log(`[call-session] ASR partial: ${text}`);
    });

    // On final transcript, trigger the response pipeline
    this.asr.onFinal((text) => {
      console.log(`[call-session] ASR final: ${text}`);
      if (text.trim()) {
        this.handleCallerSpeech(text).catch((err) => {
          console.error("[call-session] Error handling speech:", err);
        });
      }
    });
  }

  private async handleCallerSpeech(transcript: string): Promise<void> {
    // Queue speech received while processing previous response
    if (this.processing) {
      console.log("[call-session] Already processing, queuing transcript");
      this.pendingTranscript = transcript;
      return;
    }

    this.processing = true;

    try {
      // Record caller turn
      this.history.push({
        role: "caller",
        text: transcript,
        timestamp: Date.now(),
      });

      // Classify intent (first time or periodically)
      if (this.currentIntent === "unknown" || this.history.length <= 4) {
        this.currentIntent = await this.llm.classifyIntent(transcript);
        console.log(`[call-session] Intent: ${this.currentIntent}`);
      }

      // Generate response (streaming)
      let fullResponse = "";
      let sentenceBuffer = "";

      for await (const chunk of this.llm.generateResponse(
        transcript,
        this.currentIntent,
        this.history
      )) {
        sentenceBuffer += chunk;
        fullResponse += chunk;

        // Stream TTS sentence by sentence for lower latency
        const sentenceEnd = findSentenceEnd(sentenceBuffer);
        if (sentenceEnd >= 0) {
          const sentence = sentenceBuffer.slice(0, sentenceEnd + 1);
          sentenceBuffer = sentenceBuffer.slice(sentenceEnd + 1);

          // Synthesize and emit audio
          for await (const audio of this.tts.synthesize(sentence)) {
            await this.emitAudio(audio);
          }
        }
      }

      // Flush remaining text
      if (sentenceBuffer.trim()) {
        for await (const audio of this.tts.synthesize(sentenceBuffer)) {
          await this.emitAudio(audio);
        }
      }

      // Record agent turn
      this.history.push({
        role: "agent",
        text: fullResponse,
        timestamp: Date.now(),
      });
    } finally {
      this.processing = false;
      // Process queued transcript if any
      if (this.pendingTranscript) {
        const queued = this.pendingTranscript;
        this.pendingTranscript = null;
        this.handleCallerSpeech(queued).catch((err) => {
          console.error("[call-session] Error handling queued speech:", err);
        });
      }
    }
  }
}

/**
 * Find the end of the first complete sentence in text.
 * Supports Chinese and English punctuation.
 * Skips periods inside numbers (e.g., "2.5", "3.14") to avoid
 * false splits like "2." + "5 seconds".
 */
function findSentenceEnd(text: string): number {
  // Chinese sentence enders are unambiguous
  const unambiguous = ["。", "！", "？", "!", "?", "；", ";"];
  let earliest = -1;
  for (const ender of unambiguous) {
    const idx = text.indexOf(ender);
    if (idx >= 0 && (earliest < 0 || idx < earliest)) {
      earliest = idx;
    }
  }

  // For "." we need to skip decimal numbers like "2.5"
  let dotIdx = 0;
  while (dotIdx < text.length) {
    dotIdx = text.indexOf(".", dotIdx);
    if (dotIdx < 0) break;
    // Skip if surrounded by digits (decimal number)
    const prevIsDigit = dotIdx > 0 && text[dotIdx - 1] >= "0" && text[dotIdx - 1] <= "9";
    const nextIsDigit = dotIdx + 1 < text.length && text[dotIdx + 1] >= "0" && text[dotIdx + 1] <= "9";
    if (prevIsDigit && nextIsDigit) {
      dotIdx++;
      continue;
    }
    if (earliest < 0 || dotIdx < earliest) {
      earliest = dotIdx;
    }
    break;
  }

  return earliest;
}

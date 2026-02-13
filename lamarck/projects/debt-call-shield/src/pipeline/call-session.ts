import type {
  ASRProvider,
  LLMProvider,
  TTSProvider,
  CallIntent,
  ConversationTurn,
  CallSessionConfig,
} from "./types.js";

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
    console.log("[call-session] Session started");
  }

  /** Feed inbound audio from telephony layer */
  feedAudio(audio: Buffer): void {
    this.asr.feedAudio(audio);
  }

  /** End the call session */
  destroy(): void {
    this.asr.destroy();
    this.tts.destroy();
    console.log(
      `[call-session] Session ended. ${this.history.length} turns recorded.`
    );
  }

  /** Get conversation history */
  getHistory(): ReadonlyArray<ConversationTurn> {
    return this.history;
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
    // Avoid overlapping responses
    if (this.processing) {
      console.log("[call-session] Already processing, queueing...");
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
            this.onAudioCallback?.(audio);
          }
        }
      }

      // Flush remaining text
      if (sentenceBuffer.trim()) {
        for await (const audio of this.tts.synthesize(sentenceBuffer)) {
          this.onAudioCallback?.(audio);
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
    }
  }
}

/**
 * Find the end of the first complete sentence in text.
 * Supports Chinese and English punctuation.
 */
function findSentenceEnd(text: string): number {
  const sentenceEnders = ["。", "！", "？", ".", "!", "?", "；", ";"];
  let earliest = -1;
  for (const ender of sentenceEnders) {
    const idx = text.indexOf(ender);
    if (idx >= 0 && (earliest < 0 || idx < earliest)) {
      earliest = idx;
    }
  }
  return earliest;
}

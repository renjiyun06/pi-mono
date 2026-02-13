/**
 * Audio pipeline interfaces.
 *
 * The voice conversation pipeline:
 *   Inbound audio → ASR (streaming) → text → LLM → response text → TTS (streaming) → outbound audio
 *
 * All components are designed for streaming to minimize latency.
 */

/** Audio format used throughout the pipeline */
export interface AudioFormat {
  encoding: "mulaw" | "pcm" | "opus";
  sampleRate: number; // e.g., 8000 for Twilio mulaw, 16000 for most ASR
  channels: number;
}

/**
 * ASR (Automatic Speech Recognition) interface.
 * Receives audio chunks, emits transcription events.
 */
export interface ASRProvider {
  /** Start a new recognition session */
  start(format: AudioFormat): Promise<void>;

  /** Feed audio data (raw bytes) */
  feedAudio(audio: Buffer): void;

  /** Signal end of audio */
  endAudio(): void;

  /** Register callback for partial (interim) transcription results */
  onPartial(callback: (text: string) => void): void;

  /** Register callback for final (stable) transcription results */
  onFinal(callback: (text: string) => void): void;

  /** Clean up resources */
  destroy(): void;
}

/**
 * Intent classification result.
 * Used to determine which strategy to apply.
 */
export type CallIntent = "debt_collection" | "scam" | "normal" | "unknown";

/**
 * LLM response generator interface.
 * Takes transcribed text, returns response text (streaming).
 */
export interface LLMProvider {
  /**
   * Generate a response to the caller's speech.
   * Yields text chunks as they're generated for streaming TTS.
   */
  generateResponse(
    transcript: string,
    intent: CallIntent,
    conversationHistory: ConversationTurn[]
  ): AsyncIterable<string>;

  /**
   * Classify the intent of the caller based on transcript.
   */
  classifyIntent(transcript: string): Promise<CallIntent>;
}

/**
 * TTS (Text-to-Speech) interface.
 * Receives text, emits audio chunks.
 */
export interface TTSProvider {
  /** Start a new synthesis session */
  start(format: AudioFormat): Promise<void>;

  /**
   * Synthesize text to audio.
   * Yields audio chunks as they're generated.
   */
  synthesize(text: string): AsyncIterable<Buffer>;

  /** Clean up resources */
  destroy(): void;
}

/** A single turn in the conversation */
export interface ConversationTurn {
  role: "caller" | "agent";
  text: string;
  timestamp: number;
}

/** Configuration for a call session */
export interface CallSessionConfig {
  asr: ASRProvider;
  llm: LLMProvider;
  tts: TTSProvider;
  /** Audio format from the telephony layer (e.g., Twilio mulaw 8kHz) */
  inboundFormat: AudioFormat;
  /** Audio format expected by the telephony layer for playback */
  outboundFormat: AudioFormat;
}

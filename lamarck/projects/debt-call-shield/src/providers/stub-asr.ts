import type { ASRProvider, AudioFormat } from "../pipeline/types.js";

/**
 * Stub ASR provider for testing.
 * Accumulates audio for a fixed duration, then emits a hardcoded transcript.
 * Replace with a real provider (Deepgram, Alibaba FunASR, etc.) for production.
 */
export class StubASR implements ASRProvider {
  private partialCallback: ((text: string) => void) | null = null;
  private finalCallback: ((text: string) => void) | null = null;
  private chunkCount = 0;
  private silenceThreshold = 50; // chunks of silence before emitting final

  async start(_format: AudioFormat): Promise<void> {
    console.log("[stub-asr] Started (stub mode)");
  }

  feedAudio(_audio: Buffer): void {
    this.chunkCount++;

    // Simulate: after receiving enough audio chunks, emit a test transcript
    if (this.chunkCount === 30) {
      this.partialCallback?.("你好...");
    }
    if (this.chunkCount >= this.silenceThreshold) {
      this.finalCallback?.("你好，请问你是哪里？");
      this.chunkCount = 0;
    }
  }

  endAudio(): void {
    if (this.chunkCount > 10) {
      this.finalCallback?.("你好，请问你是哪里？");
    }
    this.chunkCount = 0;
  }

  onPartial(callback: (text: string) => void): void {
    this.partialCallback = callback;
  }

  onFinal(callback: (text: string) => void): void {
    this.finalCallback = callback;
  }

  destroy(): void {
    console.log("[stub-asr] Destroyed");
  }
}

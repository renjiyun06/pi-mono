import type { TTSProvider, AudioFormat } from "../pipeline/types.js";

/**
 * Stub TTS provider for testing.
 * Returns silence audio for the approximate duration of the text.
 * Replace with a real provider (Deepgram Aura, Azure Neural TTS, etc.) for production.
 */
export class StubTTS implements TTSProvider {
  private format: AudioFormat | null = null;

  async start(format: AudioFormat): Promise<void> {
    this.format = format;
    console.log("[stub-tts] Started (stub mode)");
  }

  async *synthesize(text: string): AsyncIterable<Buffer> {
    console.log(`[stub-tts] Synthesizing: ${text}`);

    if (!this.format) {
      throw new Error("TTS not started");
    }

    // Generate silence audio proportional to text length
    // Rough estimate: ~200ms per Chinese character, ~100ms per English char
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const otherChars = text.length - chineseChars;
    const durationMs = chineseChars * 200 + otherChars * 100;

    // Generate audio in 20ms chunks
    const bytesPerMs = (this.format.sampleRate * this.format.channels) / 1000;
    const chunkMs = 20;
    const chunkSize = Math.ceil(bytesPerMs * chunkMs);
    const totalChunks = Math.ceil(durationMs / chunkMs);

    for (let i = 0; i < totalChunks; i++) {
      // mulaw silence is 0xFF, PCM silence is 0x00
      const silenceByte = this.format.encoding === "mulaw" ? 0xff : 0x00;
      yield Buffer.alloc(chunkSize, silenceByte);
    }
  }

  destroy(): void {
    console.log("[stub-tts] Destroyed");
  }
}

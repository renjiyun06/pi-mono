import { execFile } from "child_process";
import { readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";
import type { TTSProvider, AudioFormat } from "../pipeline/types.js";

/**
 * Edge TTS provider using Python edge-tts CLI.
 *
 * The Node.js edge-tts-universal package has WebSocket issues in WSL,
 * so we shell out to the Python edge-tts CLI which works reliably.
 *
 * Produces MP3 audio chunks. For telephony use (mulaw 8kHz), transcode
 * with ffmpeg: `ffmpeg -i input.mp3 -ar 8000 -ac 1 -f mulaw output.raw`
 *
 * Chinese voices:
 * - zh-CN-XiaoxiaoNeural (Female, conversational, warm) [default]
 * - zh-CN-YunxiNeural (Male, conversational, cheerful)
 * - zh-CN-YunjianNeural (Male, authority)
 * - zh-CN-YunyangNeural (Male, news anchor)
 */
export class EdgeTTSProvider implements TTSProvider {
  private voice: string;
  private pythonPath: string;

  constructor(
    voice = "zh-CN-XiaoxiaoNeural",
    pythonPath = "/home/lamarck/pi-mono/lamarck/pyenv/bin/python"
  ) {
    this.voice = voice;
    this.pythonPath = pythonPath;
  }

  async start(_format: AudioFormat): Promise<void> {
    console.log(`[edge-tts] Started with voice=${this.voice}`);
  }

  async *synthesize(text: string): AsyncIterable<Buffer> {
    if (!text.trim()) return;

    const trimmed = text.slice(0, 100);
    console.log(
      `[edge-tts] Synthesizing: ${trimmed}${text.length > 100 ? "..." : ""}`
    );

    const tmpFile = join(
      tmpdir(),
      `tts-${randomBytes(8).toString("hex")}.mp3`
    );

    try {
      await new Promise<void>((resolve, reject) => {
        execFile(
          this.pythonPath,
          [
            "-m",
            "edge_tts",
            "--voice",
            this.voice,
            "--text",
            text,
            "--write-media",
            tmpFile,
          ],
          { timeout: 30000 },
          (error) => {
            if (error) reject(error);
            else resolve();
          }
        );
      });

      const audio = await readFile(tmpFile);
      // Yield as a single chunk. For streaming, could split into smaller pieces.
      yield audio;
    } finally {
      await unlink(tmpFile).catch(() => {});
    }
  }

  destroy(): void {
    console.log("[edge-tts] Destroyed");
  }
}

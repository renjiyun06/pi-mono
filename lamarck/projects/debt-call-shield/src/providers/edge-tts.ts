import { execFile } from "child_process";
import { readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";
import type { TTSProvider, AudioFormat } from "../pipeline/types.js";

/**
 * Edge TTS provider using Microsoft Edge's free TTS service.
 *
 * Two modes:
 * 1. CLI mode (default): shells out to Python edge-tts CLI per request
 * 2. HTTP mode: connects to a running tts-server.py instance (lower overhead for concurrent use)
 *
 * Produces MP3 audio. For telephony use (mulaw 8kHz), transcode
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
  private rate: string;
  private mode: "cli" | "http";
  private pythonPath: string;
  private serverUrl: string;

  constructor(options: {
    voice?: string;
    rate?: string;
    mode?: "cli" | "http";
    pythonPath?: string;
    serverUrl?: string;
  } = {}) {
    this.voice = options.voice || "zh-CN-XiaoxiaoNeural";
    this.rate = options.rate || "+0%";
    this.mode = options.mode || "cli";
    this.pythonPath = options.pythonPath || "/home/lamarck/pi-mono/lamarck/pyenv/bin/python";
    this.serverUrl = options.serverUrl || "http://127.0.0.1:3001";
  }

  async start(_format: AudioFormat): Promise<void> {
    console.log(`[edge-tts] Started (mode=${this.mode}, voice=${this.voice})`);

    if (this.mode === "http") {
      // Verify server is running
      try {
        const res = await fetch(`${this.serverUrl}/health`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
      } catch {
        console.warn(
          `[edge-tts] TTS server not reachable at ${this.serverUrl}, falling back to CLI mode`
        );
        this.mode = "cli";
      }
    }
  }

  async *synthesize(text: string): AsyncIterable<Buffer> {
    if (!text.trim()) return;

    const trimmed = text.slice(0, 100);
    console.log(
      `[edge-tts] Synthesizing (${this.mode}): ${trimmed}${text.length > 100 ? "..." : ""}`
    );

    if (this.mode === "http") {
      yield* this.synthesizeHTTP(text);
    } else {
      yield* this.synthesizeCLI(text);
    }
  }

  private async *synthesizeHTTP(text: string): AsyncIterable<Buffer> {
    const res = await fetch(`${this.serverUrl}/synthesize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice: this.voice, rate: this.rate }),
    });

    if (!res.ok || !res.body) {
      console.error(`[edge-tts] HTTP synthesis failed: ${res.status}`);
      return;
    }

    const reader = res.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield Buffer.from(value);
      }
    } finally {
      reader.releaseLock();
    }
  }

  private async *synthesizeCLI(text: string): AsyncIterable<Buffer> {
    const tmpFile = join(
      tmpdir(),
      `tts-${randomBytes(8).toString("hex")}.mp3`
    );

    try {
      await new Promise<void>((resolve, reject) => {
        execFile(
          this.pythonPath,
          [
            "-m", "edge_tts",
            "--voice", this.voice,
            "--rate", this.rate,
            "--text", text,
            "--write-media", tmpFile,
          ],
          { timeout: 30000 },
          (error) => {
            if (error) reject(error);
            else resolve();
          }
        );
      });

      const audio = await readFile(tmpFile);
      yield audio;
    } finally {
      await unlink(tmpFile).catch(() => {});
    }
  }

  destroy(): void {
    console.log("[edge-tts] Destroyed");
  }
}

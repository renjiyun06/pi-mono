import { execFile } from "child_process";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";
import type { ASRProvider, AudioFormat } from "../pipeline/types.js";

/**
 * ASR provider using faster-whisper via Python CLI.
 *
 * Uses a simple energy-based VAD to detect speech segments:
 * 1. Accumulates audio chunks
 * 2. Detects silence (energy drops below threshold)
 * 3. Once silence is detected after speech, sends accumulated audio to whisper
 *
 * For Twilio mulaw 8kHz: audio arrives as base64-decoded mulaw bytes.
 * We convert to WAV before sending to whisper.
 */
export class WhisperASR implements ASRProvider {
  private partialCallback: ((text: string) => void) | null = null;
  private finalCallback: ((text: string) => void) | null = null;
  private audioBuffer: Buffer[] = [];
  private format: AudioFormat | null = null;
  private pythonPath: string;
  private modelSize: string;

  // VAD parameters
  private silenceThreshold = 10; // mulaw energy threshold (0xFF = silence)
  private silenceChunks = 0;
  private silenceChunksRequired = 25; // ~500ms of silence at 20ms chunks
  private speechDetected = false;
  private minSpeechChunks = 10; // minimum ~200ms of speech

  constructor(
    pythonPath = "/home/lamarck/pi-mono/lamarck/pyenv/bin/python",
    modelSize = "base"
  ) {
    this.pythonPath = pythonPath;
    this.modelSize = modelSize;
  }

  async start(format: AudioFormat): Promise<void> {
    this.format = format;
    console.log(
      `[whisper-asr] Started (model=${this.modelSize}, format=${format.encoding} ${format.sampleRate}Hz)`
    );
  }

  feedAudio(audio: Buffer): void {
    // Simple energy-based VAD for mulaw
    const energy = this.calculateEnergy(audio);
    const isSpeech = energy > this.silenceThreshold;

    if (isSpeech) {
      this.silenceChunks = 0;
      this.speechDetected = true;
      this.audioBuffer.push(audio);
    } else {
      if (this.speechDetected) {
        this.audioBuffer.push(audio); // keep trailing silence
        this.silenceChunks++;

        if (this.silenceChunks >= this.silenceChunksRequired) {
          // Speech ended, trigger transcription
          if (this.audioBuffer.length >= this.minSpeechChunks) {
            this.transcribeBuffer();
          }
          this.resetBuffer();
        }
      }
    }
  }

  endAudio(): void {
    if (this.audioBuffer.length >= this.minSpeechChunks) {
      this.transcribeBuffer();
    }
    this.resetBuffer();
  }

  onPartial(callback: (text: string) => void): void {
    this.partialCallback = callback;
  }

  onFinal(callback: (text: string) => void): void {
    this.finalCallback = callback;
  }

  destroy(): void {
    this.resetBuffer();
    console.log("[whisper-asr] Destroyed");
  }

  private calculateEnergy(audio: Buffer): number {
    if (!this.format) return 0;

    if (this.format.encoding === "mulaw") {
      // For mulaw, 0xFF is silence. Calculate deviation from silence.
      let totalDeviation = 0;
      for (let i = 0; i < audio.length; i++) {
        totalDeviation += Math.abs(audio[i] - 0xff);
      }
      return totalDeviation / audio.length;
    }

    // For PCM, calculate RMS
    let sum = 0;
    for (let i = 0; i < audio.length - 1; i += 2) {
      const sample = audio.readInt16LE(i);
      sum += sample * sample;
    }
    return Math.sqrt(sum / (audio.length / 2));
  }

  private resetBuffer(): void {
    this.audioBuffer = [];
    this.silenceChunks = 0;
    this.speechDetected = false;
  }

  private async transcribeBuffer(): Promise<void> {
    const audioData = Buffer.concat(this.audioBuffer);
    console.log(
      `[whisper-asr] Transcribing ${audioData.length} bytes of audio...`
    );

    // Emit partial to indicate processing
    this.partialCallback?.("...");

    const tmpId = randomBytes(8).toString("hex");
    const rawPath = join(tmpdir(), `asr-${tmpId}.raw`);
    const wavPath = join(tmpdir(), `asr-${tmpId}.wav`);

    try {
      await writeFile(rawPath, audioData);

      // Convert raw mulaw to WAV using ffmpeg, then transcribe with whisper
      const transcriptPath = join(tmpdir(), `asr-${tmpId}.txt`);

      await new Promise<void>((resolve, reject) => {
        execFile(
          this.pythonPath,
          [
            "-c",
            `
import sys, subprocess, os

raw_path = "${rawPath}"
wav_path = "${wavPath}"
transcript_path = "${transcriptPath}"
model_size = "${this.modelSize}"

# Convert mulaw to wav
subprocess.run([
    "ffmpeg", "-y", "-f", "mulaw", "-ar", "8000", "-ac", "1",
    "-i", raw_path, wav_path
], capture_output=True, check=True)

# Transcribe with faster-whisper
from faster_whisper import WhisperModel
model = WhisperModel(model_size, device="cpu", compute_type="int8")
segments, info = model.transcribe(wav_path, language="zh")
text = " ".join(seg.text for seg in segments).strip()

with open(transcript_path, "w") as f:
    f.write(text)
`,
          ],
          { timeout: 30000 },
          (error) => {
            if (error) reject(error);
            else resolve();
          }
        );
      });

      const transcript = (await readFile(transcriptPath, "utf-8")).trim();
      if (transcript) {
        this.finalCallback?.(transcript);
      }

      await unlink(transcriptPath).catch(() => {});
    } catch (err) {
      console.error("[whisper-asr] Transcription failed:", err);
    } finally {
      await unlink(rawPath).catch(() => {});
      await unlink(wavPath).catch(() => {});
    }
  }
}

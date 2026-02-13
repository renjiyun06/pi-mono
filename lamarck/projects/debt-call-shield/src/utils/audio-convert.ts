import { execFile } from "child_process";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";

/**
 * Convert MP3 audio to mulaw 8kHz mono (Twilio format).
 *
 * Twilio Media Streams use:
 * - Encoding: audio/x-mulaw (G.711 mu-law)
 * - Sample rate: 8000 Hz
 * - Channels: 1 (mono)
 * - Bit depth: 8-bit
 */
export async function mp3ToMulaw(mp3Data: Buffer): Promise<Buffer> {
  const id = randomBytes(8).toString("hex");
  const inputPath = join(tmpdir(), `convert-${id}.mp3`);
  const outputPath = join(tmpdir(), `convert-${id}.raw`);

  try {
    await writeFile(inputPath, mp3Data);

    await new Promise<void>((resolve, reject) => {
      execFile(
        "ffmpeg",
        [
          "-y",
          "-i", inputPath,
          "-ar", "8000",
          "-ac", "1",
          "-f", "mulaw",
          outputPath,
        ],
        { timeout: 10000 },
        (error) => {
          if (error) reject(error);
          else resolve();
        }
      );
    });

    return await readFile(outputPath);
  } finally {
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}

/**
 * Split raw mulaw audio into chunks suitable for Twilio Media Streams.
 *
 * Twilio expects base64-encoded audio payloads. Each chunk should be
 * about 20ms of audio (160 bytes at 8kHz mulaw).
 */
export function splitMulawIntoChunks(
  mulawData: Buffer,
  chunkSize = 160
): Buffer[] {
  const chunks: Buffer[] = [];
  for (let offset = 0; offset < mulawData.length; offset += chunkSize) {
    chunks.push(mulawData.subarray(offset, offset + chunkSize));
  }
  return chunks;
}

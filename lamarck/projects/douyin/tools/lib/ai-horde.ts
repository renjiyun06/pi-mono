/**
 * AI Horde image generation client.
 * Free, community-powered Stable Diffusion. No API key needed.
 */
import { writeFile, unlink } from "fs/promises";
import { execFileSync } from "child_process";
import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";

const HORDE_BASE = "https://aihorde.net/api/v2";
const HORDE_ANON_KEY = "0000000000";
const MAX_FREE_SIZE = 576;
const POLL_INTERVAL = 5000;
const MAX_WAIT = 180000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 3000;

async function fetchWithRetry(url: string, init?: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const resp = await fetch(url, init);
      return resp;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`[ai-horde] Network error, retrying in ${RETRY_DELAY / 1000}s... (${i + 1}/${retries})`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY));
    }
  }
  throw new Error("Unreachable");
}

interface HordeStatus {
  done: boolean;
  faulted: boolean;
  wait_time: number;
  queue_position: number;
  generations?: Array<{
    img: string;
    seed: string;
    model: string;
  }>;
}

/**
 * Generate an image and save to disk.
 * Returns the output path.
 */
export async function generateImage(
  prompt: string,
  outputPath: string,
  width = 1080,
  height = 1920,
  log = true,
): Promise<string> {
  if (log) console.log(`[ai-horde] Generating: "${prompt.slice(0, 80)}..."`);

  // Submit
  const submitResp = await fetchWithRetry(`${HORDE_BASE}/generate/async`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: HORDE_ANON_KEY },
    body: JSON.stringify({
      prompt,
      params: { width: MAX_FREE_SIZE, height: MAX_FREE_SIZE, steps: 20, n: 1, cfg_scale: 7 },
      nsfw: false,
    }),
  });

  if (!submitResp.ok) {
    throw new Error(`Horde submit failed: ${submitResp.status} ${await submitResp.text()}`);
  }

  const { id } = await submitResp.json();
  if (log) console.log(`[ai-horde] Submitted: ${id}`);

  // Poll
  const start = Date.now();
  while (Date.now() - start < MAX_WAIT) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    const resp = await fetchWithRetry(`${HORDE_BASE}/generate/status/${id}`);
    if (!resp.ok) continue;

    const data: HordeStatus = await resp.json();
    if (data.faulted) throw new Error("Generation faulted");

    if (data.done && data.generations?.length) {
      const gen = data.generations[0];
      if (log) console.log(`[ai-horde] Done (model: ${gen.model})`);

      // Download
      const tmpPath = join(tmpdir(), `horde-${randomBytes(8).toString("hex")}.webp`);
      const imgResp = await fetchWithRetry(gen.img);
      if (!imgResp.ok) throw new Error(`Download failed: ${imgResp.status}`);
      await writeFile(tmpPath, Buffer.from(await imgResp.arrayBuffer()));

      // Upscale to target size
      if (width !== MAX_FREE_SIZE || height !== MAX_FREE_SIZE) {
        execFileSync("ffmpeg", [
          "-y", "-i", tmpPath,
          "-vf", `scale=${width}:${height}:flags=lanczos`,
          outputPath,
        ]);
      } else {
        execFileSync("ffmpeg", ["-y", "-i", tmpPath, outputPath]);
      }
      await unlink(tmpPath).catch(() => {});

      if (log) console.log(`[ai-horde] Saved: ${outputPath}`);
      return outputPath;
    }

    if (log) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(0);
      console.log(`[ai-horde] Waiting... queue=${data.queue_position}, eta=${data.wait_time}s, elapsed=${elapsed}s`);
    }
  }

  throw new Error(`Timed out after ${MAX_WAIT / 1000}s`);
}

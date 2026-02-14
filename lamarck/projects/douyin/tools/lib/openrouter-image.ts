/**
 * OpenRouter image generation client.
 * Uses Gemini 2.5 Flash Image (or other models) via OpenRouter API.
 *
 * IMPORTANT: OpenRouter budget is limited. Use sparingly.
 * Prefer AI Horde for bulk/background images. Use this only for:
 * - Key visuals (covers, avatar concepts)
 * - High-quality scenes that AI Horde can't handle
 */
import { writeFile } from "fs/promises";
import { readFileSync } from "fs";
import { join } from "path";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

interface OpenRouterImageOptions {
  prompt: string;
  model?: string;
  outputPath: string;
}

function getApiKey(): string {
  // Try .env file in repo root
  const envPaths = [
    join(process.cwd(), ".env"),
    join(process.cwd(), "../../.env"),
    join(process.cwd(), "../../../.env"),
  ];

  for (const envPath of envPaths) {
    try {
      const content = readFileSync(envPath, "utf-8");
      const match = content.match(/OPENROUTER_API_KEY=(.+)/);
      if (match) return match[1].trim();
    } catch {
      // skip
    }
  }

  const envKey = process.env.OPENROUTER_API_KEY;
  if (envKey) return envKey;

  throw new Error(
    "OPENROUTER_API_KEY not found in .env or environment variables"
  );
}

export async function generateImageOpenRouter(
  opts: OpenRouterImageOptions
): Promise<{ path: string; cost: number }> {
  const apiKey = getApiKey();
  const model = opts.model || "google/gemini-2.5-flash-image";

  console.log(
    `[openrouter-image] Generating with ${model}: "${opts.prompt.slice(0, 60)}..."`
  );

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      modalities: ["image", "text"],
      messages: [
        {
          role: "user",
          content: `Generate an image: ${opts.prompt}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `OpenRouter image generation failed (${response.status}): ${text}`
    );
  }

  const data = (await response.json()) as {
    choices: Array<{
      message: {
        content: string;
        images?: Array<{
          type: string;
          image_url: { url: string };
        }>;
      };
    }>;
    usage?: { cost?: number };
  };

  const msg = data.choices[0]?.message;
  const images = msg?.images || [];

  if (images.length === 0) {
    throw new Error("No images returned from OpenRouter");
  }

  const imageUrl = images[0].image_url.url;
  if (!imageUrl.startsWith("data:")) {
    throw new Error(`Unexpected image URL format: ${imageUrl.slice(0, 50)}`);
  }

  const b64 = imageUrl.split(",", 2)[1];
  const buffer = Buffer.from(b64, "base64");
  await writeFile(opts.outputPath, buffer);

  const cost = data.usage?.cost || 0;
  console.log(
    `[openrouter-image] Saved: ${opts.outputPath} (${buffer.length} bytes, cost: $${cost.toFixed(4)})`
  );

  return { path: opts.outputPath, cost };
}

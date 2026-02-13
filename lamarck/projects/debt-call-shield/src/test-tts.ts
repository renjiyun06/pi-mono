/**
 * Test Edge TTS provider.
 *
 * Usage: npx tsx src/test-tts.ts
 */
import { writeFile } from "fs/promises";
import { EdgeTTSProvider } from "./providers/edge-tts.js";

async function main() {
  const tts = new EdgeTTSProvider("zh-CN-XiaoxiaoNeural");
  await tts.start({ encoding: "mulaw", sampleRate: 8000, channels: 1 });

  const testTexts = [
    "您好，机主目前不方便接听电话。",
    "请问您是哪里？有什么事情我可以帮您转达吗？",
    "好的，我会转告机主的。请问您的联系方式是？",
  ];

  for (const text of testTexts) {
    console.log(`\nText: ${text}`);
    const start = Date.now();
    const chunks: Buffer[] = [];

    for await (const chunk of tts.synthesize(text)) {
      chunks.push(chunk);
    }

    const audio = Buffer.concat(chunks);
    const elapsed = Date.now() - start;
    console.log(`Time: ${elapsed}ms, Size: ${audio.length} bytes`);
  }

  // Save one sample
  const chunks: Buffer[] = [];
  for await (const chunk of tts.synthesize("您好，这是一个测试。")) {
    chunks.push(chunk);
  }
  const sample = Buffer.concat(chunks);
  await writeFile("/tmp/debt-call-shield-tts-sample.mp3", sample);
  console.log("\nSample saved to /tmp/debt-call-shield-tts-sample.mp3");

  tts.destroy();
}

main().catch(console.error);

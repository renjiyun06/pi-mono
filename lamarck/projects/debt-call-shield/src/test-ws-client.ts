/**
 * WebSocket test client simulating Twilio Media Streams protocol.
 * Connects to the local server and sends fake audio to exercise
 * the full ASR → LLM → TTS pipeline (use with USE_STUBS=true).
 *
 * Usage:
 *   USE_STUBS=true npx tsx src/server.ts &
 *   npx tsx src/test-ws-client.ts
 */
import WebSocket from "ws";

const WS_URL = process.env.WS_URL || "ws://localhost:3000/media-stream";
const STREAM_SID = "test-stream-001";
const CALL_SID = "test-call-001";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`Connecting to ${WS_URL}...`);
  const ws = new WebSocket(WS_URL);

  ws.on("open", async () => {
    console.log("Connected. Sending Twilio protocol events...\n");

    // 1. connected event
    ws.send(JSON.stringify({ event: "connected" }));
    await sleep(100);

    // 2. start event
    ws.send(
      JSON.stringify({
        event: "start",
        streamSid: STREAM_SID,
        start: {
          streamSid: STREAM_SID,
          accountSid: "test-account",
          callSid: CALL_SID,
          tracks: ["inbound"],
          mediaFormat: {
            encoding: "audio/x-mulaw",
            sampleRate: 8000,
            channels: 1,
          },
        },
      })
    );
    console.log("→ start event sent");
    await sleep(500);

    // 3. Send fake audio chunks (mulaw silence = 0xFF)
    // StubASR emits partial at chunk 30, final at chunk 50
    const chunkSize = 160; // 20ms at 8kHz
    const silenceChunk = Buffer.alloc(chunkSize, 0xff).toString("base64");

    console.log("→ Sending 60 audio chunks (simulating ~1.2s of audio)...");
    for (let i = 0; i < 60; i++) {
      ws.send(
        JSON.stringify({
          event: "media",
          streamSid: STREAM_SID,
          media: {
            track: "inbound",
            chunk: String(i),
            timestamp: String(i * 20),
            payload: silenceChunk,
          },
        })
      );
      await sleep(20); // real-time pacing
    }

    console.log("→ Audio chunks sent. Waiting for response...");
    await sleep(3000);

    // 4. stop event
    ws.send(JSON.stringify({ event: "stop", streamSid: STREAM_SID }));
    console.log("→ stop event sent");
    await sleep(500);

    ws.close();
  });

  let responseChunks = 0;
  ws.on("message", (data: Buffer) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.event === "media" && msg.media?.payload) {
        responseChunks++;
        if (responseChunks === 1) {
          console.log("\n← Receiving TTS audio response...");
        }
      } else {
        console.log("← Server:", JSON.stringify(msg).slice(0, 120));
      }
    } catch {
      console.log("← Raw:", data.toString().slice(0, 80));
    }
  });

  ws.on("close", () => {
    console.log(`\nConnection closed. Received ${responseChunks} audio response chunks.`);
    console.log(responseChunks > 0 ? "✓ Pipeline working!" : "✗ No audio response received.");
    process.exit(0);
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err.message);
    process.exit(1);
  });
}

main();

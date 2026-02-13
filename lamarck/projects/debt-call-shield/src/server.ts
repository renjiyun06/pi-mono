import Fastify from "fastify";
import websocket from "@fastify/websocket";
import { handleIncomingCall } from "./routes/incoming-call.js";
import { handleMediaStream } from "./routes/media-stream.js";

const PORT = parseInt(process.env.PORT || "3000");
const HOST = process.env.HOST || "0.0.0.0";

async function main() {
  const app = Fastify({ logger: true });

  await app.register(websocket);

  // Twilio webhook: incoming call → return TwiML that connects to media stream
  app.post("/incoming-call", handleIncomingCall);

  // WebSocket: receive real-time audio from Twilio Media Streams
  app.register(async (fastify) => {
    fastify.get("/media-stream", { websocket: true }, handleMediaStream);
  });

  // Health check
  app.get("/health", async () => ({ status: "ok" }));

  await app.listen({ port: PORT, host: HOST });
  console.log(`Server listening on ${HOST}:${PORT}`);
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

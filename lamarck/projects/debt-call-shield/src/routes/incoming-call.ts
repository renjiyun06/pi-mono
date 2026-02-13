import type { FastifyRequest, FastifyReply } from "fastify";

/**
 * Handle incoming call webhook from Twilio.
 * Returns TwiML that:
 * 1. Plays a brief greeting
 * 2. Connects the call to our WebSocket media stream endpoint
 */
export async function handleIncomingCall(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const host = request.headers.host || "localhost:3000";
  const wsProtocol = host.includes("localhost") ? "ws" : "wss";

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="zh-CN">您好，请稍候。</Say>
  <Connect>
    <Stream url="${wsProtocol}://${host}/media-stream" />
  </Connect>
</Response>`;

  reply.type("text/xml").send(twiml);
}

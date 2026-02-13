import type { WebSocket } from "ws";

/**
 * Twilio Media Stream event types.
 * See: https://www.twilio.com/docs/voice/media-streams/websocket-messages
 */
interface TwilioMediaEvent {
  event: "connected" | "start" | "media" | "stop" | "mark";
  sequenceNumber?: string;
  streamSid?: string;
  start?: {
    streamSid: string;
    accountSid: string;
    callSid: string;
    tracks: string[];
    mediaFormat: {
      encoding: string; // "audio/x-mulaw"
      sampleRate: number; // 8000
      channels: number; // 1
    };
  };
  media?: {
    track: string;
    chunk: string;
    timestamp: string;
    payload: string; // base64-encoded audio
  };
}

/**
 * Handle WebSocket connection from Twilio Media Streams.
 *
 * Current behavior: logs events and echoes audio back (for testing).
 * TODO: Route audio through ASR → LLM → TTS pipeline.
 */
export function handleMediaStream(socket: WebSocket) {
  let streamSid: string | null = null;
  let callSid: string | null = null;

  console.log("[media-stream] Client connected");

  socket.on("message", (data: Buffer) => {
    let event: TwilioMediaEvent;
    try {
      event = JSON.parse(data.toString());
    } catch {
      console.error("[media-stream] Failed to parse message");
      return;
    }

    switch (event.event) {
      case "connected":
        console.log("[media-stream] Connected event received");
        break;

      case "start":
        streamSid = event.start?.streamSid || event.streamSid || null;
        callSid = event.start?.callSid || null;
        console.log(
          `[media-stream] Stream started: streamSid=${streamSid}, callSid=${callSid}`
        );
        console.log(
          `[media-stream] Media format:`,
          JSON.stringify(event.start?.mediaFormat)
        );
        break;

      case "media":
        // For now, just count chunks. Later this feeds into ASR.
        if (event.media?.payload && streamSid) {
          // Echo audio back for testing
          const echoMessage = JSON.stringify({
            event: "media",
            streamSid,
            media: {
              payload: event.media.payload,
            },
          });
          socket.send(echoMessage);
        }
        break;

      case "stop":
        console.log(`[media-stream] Stream stopped: streamSid=${streamSid}`);
        break;

      case "mark":
        // Mark events confirm that a media message was played
        break;

      default:
        console.log(
          `[media-stream] Unknown event: ${(event as TwilioMediaEvent).event}`
        );
    }
  });

  socket.on("close", () => {
    console.log(
      `[media-stream] Client disconnected: streamSid=${streamSid}`
    );
  });

  socket.on("error", (err) => {
    console.error(`[media-stream] WebSocket error:`, err);
  });
}

import type { WebSocket } from "ws";
import { CallSession } from "../pipeline/call-session.js";
import { StubASR } from "../providers/stub-asr.js";
import { EdgeTTSProvider } from "../providers/edge-tts.js";
import { OpenRouterLLM } from "../providers/openrouter-llm.js";
import type { AudioFormat } from "../pipeline/types.js";

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
      encoding: string;
      sampleRate: number;
      channels: number;
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
 * Create AI pipeline providers.
 * Switch from stubs to real providers here.
 */
function createProviders() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn(
      "[media-stream] OPENROUTER_API_KEY not set, LLM responses will fail"
    );
  }

  return {
    asr: new StubASR(), // TODO: Replace with Deepgram or FunASR
    llm: new OpenRouterLLM(apiKey || "", "deepseek/deepseek-chat"),
    tts: new EdgeTTSProvider(), // Free Microsoft Edge TTS (Chinese voice)
  };
}

/**
 * Handle WebSocket connection from Twilio Media Streams.
 * Routes audio through ASR → LLM → TTS pipeline.
 */
export function handleMediaStream(socket: WebSocket) {
  let streamSid: string | null = null;
  let callSession: CallSession | null = null;

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

      case "start": {
        streamSid = event.start?.streamSid || event.streamSid || null;
        const callSid = event.start?.callSid || null;
        console.log(
          `[media-stream] Stream started: streamSid=${streamSid}, callSid=${callSid}`
        );

        // Twilio default format
        const twilioFormat: AudioFormat = {
          encoding: "mulaw",
          sampleRate: 8000,
          channels: 1,
        };

        // Initialize pipeline
        const providers = createProviders();
        callSession = new CallSession({
          ...providers,
          inboundFormat: twilioFormat,
          outboundFormat: twilioFormat,
        });

        // When pipeline produces audio, send it back through Twilio
        callSession.onAudio((audio: Buffer) => {
          if (streamSid && socket.readyState === socket.OPEN) {
            socket.send(
              JSON.stringify({
                event: "media",
                streamSid,
                media: {
                  payload: audio.toString("base64"),
                },
              })
            );
          }
        });

        callSession.start(twilioFormat, twilioFormat).catch((err) => {
          console.error("[media-stream] Failed to start session:", err);
        });
        break;
      }

      case "media":
        if (event.media?.payload && callSession) {
          const audioBuffer = Buffer.from(event.media.payload, "base64");
          callSession.feedAudio(audioBuffer);
        }
        break;

      case "stop":
        console.log(`[media-stream] Stream stopped: streamSid=${streamSid}`);
        callSession?.destroy();
        callSession = null;
        break;

      case "mark":
        break;

      default:
        console.log(
          `[media-stream] Unknown event: ${(event as TwilioMediaEvent).event}`
        );
    }
  });

  socket.on("close", () => {
    console.log(`[media-stream] Client disconnected: streamSid=${streamSid}`);
    callSession?.destroy();
    callSession = null;
  });

  socket.on("error", (err) => {
    console.error("[media-stream] WebSocket error:", err);
    callSession?.destroy();
    callSession = null;
  });
}

import type { WebSocket } from "ws";
import { CallSession } from "../pipeline/call-session.js";
import { WhisperASR } from "../providers/whisper-asr.js";
import { EdgeTTSProvider } from "../providers/edge-tts.js";
import { OpenRouterLLM } from "../providers/openrouter-llm.js";
import { StubASR } from "../providers/stub-asr.js";
import { StubLLM } from "../providers/stub-llm.js";
import { StubTTS } from "../providers/stub-tts.js";
import type { ASRProvider, LLMProvider, TTSProvider, AudioFormat } from "../pipeline/types.js";

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

const USE_STUBS = process.env.USE_STUBS === "true";

/**
 * Create AI pipeline providers.
 * Set USE_STUBS=true to use offline stub providers (no API keys needed).
 */
function createProviders(): { asr: ASRProvider; llm: LLMProvider; tts: TTSProvider } {
  if (USE_STUBS) {
    console.log("[media-stream] Using STUB providers (offline mode)");
    return {
      asr: new StubASR(),
      llm: new StubLLM(),
      tts: new StubTTS(),
    };
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn(
      "[media-stream] OPENROUTER_API_KEY not set, LLM responses will fail. Set USE_STUBS=true for offline testing."
    );
  }

  return {
    asr: new WhisperASR(),
    llm: new OpenRouterLLM(apiKey || "", "deepseek/deepseek-chat"),
    tts: new EdgeTTSProvider(),
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

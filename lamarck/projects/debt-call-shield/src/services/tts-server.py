"""
Lightweight HTTP TTS server using edge-tts.

Keeps the process running to avoid startup overhead (~2.6s → ~0.5s per request).

Usage:
    python tts-server.py [--port 3001] [--host 0.0.0.0]

API:
    POST /synthesize
    Body: {"text": "你好", "voice": "zh-CN-XiaoxiaoNeural", "rate": "+0%"}
    Response: audio/mpeg binary
"""
import asyncio
import argparse
import edge_tts
from aiohttp import web


async def handle_synthesize(request: web.Request) -> web.StreamResponse:
    """Synthesize text to speech and stream the audio back."""
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON"}, status=400)

    text = body.get("text", "").strip()
    if not text:
        return web.json_response({"error": "Missing 'text' field"}, status=400)

    voice = body.get("voice", "zh-CN-XiaoxiaoNeural")
    rate = body.get("rate", "+0%")

    response = web.StreamResponse(
        status=200,
        headers={"Content-Type": "audio/mpeg"},
    )
    await response.prepare(request)

    communicate = edge_tts.Communicate(text, voice=voice, rate=rate)
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            await response.write(chunk["data"])

    await response.write_eof()
    return response


async def handle_voices(request: web.Request) -> web.Response:
    """List available voices, optionally filtered by language."""
    lang = request.query.get("lang", None)
    voices = await edge_tts.list_voices()

    if lang:
        voices = [v for v in voices if v["Locale"].startswith(lang)]

    return web.json_response(voices)


async def handle_health(request: web.Request) -> web.Response:
    return web.json_response({"status": "ok"})


def create_app() -> web.Application:
    app = web.Application()
    app.router.add_post("/synthesize", handle_synthesize)
    app.router.add_get("/voices", handle_voices)
    app.router.add_get("/health", handle_health)
    return app


def main():
    parser = argparse.ArgumentParser(description="Edge TTS HTTP Server")
    parser.add_argument("--port", type=int, default=3001, help="Port (default: 3001)")
    parser.add_argument("--host", default="127.0.0.1", help="Host (default: 127.0.0.1)")
    parser.add_argument("--describe", action="store_true", help="Describe this service")
    args = parser.parse_args()

    if args.describe:
        print(
            "TTS HTTP server using Microsoft Edge's free TTS service.\n"
            "Keeps process running to avoid repeated startup overhead.\n"
            "POST /synthesize with {text, voice?, rate?} → audio/mpeg stream.\n"
            "GET /voices?lang=zh → list available voices."
        )
        return

    print(f"Starting TTS server on {args.host}:{args.port}")
    app = create_app()
    web.run_app(app, host=args.host, port=args.port, print=lambda _: None)


if __name__ == "__main__":
    main()

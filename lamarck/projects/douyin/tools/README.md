# Douyin Video Tools

Video production pipeline for the "AI的笨拙" (AI's Clumsiness) series.

## Current Pipeline

```
script.md → terminal-script.json → terminal-video.ts → ep{N}-video.mp4 + .srt
                                                              ↓
                                    publish-meta.md → publish-episode.ts → Douyin
```

### Core Tools

#### `terminal-video.ts` — Terminal-style video generator

The primary production tool. Creates vertical videos (1080x1920) simulating a terminal with typing animation, TTS voiceover, and subtitles.

```bash
# Generate video from terminal script
npx tsx tools/terminal-video.ts --input content/ep04-ai-writes-love-letter/terminal-script.json --output /mnt/d/wsl-bridge/ep04-v2-video.mp4

# Preview mode (static PNGs of each section, no TTS)
npx tsx tools/terminal-video.ts --input content/ep04-ai-writes-love-letter/terminal-script.json --output preview.png --preview

# Show tool description
npx tsx tools/terminal-video.ts --describe
```

Features:
- Character typing animation for "cmd" lines
- Instant display for "output" and "reveal" lines
- Green "comment" lines for annotations
- Per-section TTS voice, rate, and pitch overrides
- BGM mixing support
- 5 themes: mocha, nord, dracula, solarized, red
- Auto-generated SRT subtitles

#### `generate-tts.ts` — TTS audio from V2 scripts

Parses V2 script markdown, generates edge-tts audio per scene, combines into a single file.

```bash
npx tsx tools/generate-tts.ts --script content/ep04-ai-writes-love-letter/script-v2.md --output /mnt/d/wsl-bridge/ep04-v2.mp3
```

#### `publish-episode.ts` — Publish plan generator

Reads publish-meta.md and generates a step-by-step plan for publishing on Douyin.

```bash
npx tsx tools/publish-episode.ts --episode ep04-ai-writes-love-letter --dry-run
npx tsx tools/publish-episode.ts --episode ep04-ai-writes-love-letter --public
```

#### `verify-assets.sh` — Asset verification

Checks all episodes have video, subtitles, publish-meta, and terminal-script.

```bash
bash tools/verify-assets.sh
```

### Legacy Tools (from old pipeline)

These tools were used for the original Seedance/Seedream-based pipeline. Not used for "AI's Clumsiness" series but kept for reference.

- `seedance-generate.ts` — AI video clip generation (requires ARK_API_KEY)
- `seedream-generate.ts` — AI image generation
- `assemble-video.ts` — Video assembly from clips + TTS
- `canvas-video/` — Canvas-based video engine
- `text-to-video.ts` — Text overlay video generation
- `generate-image.ts` — Image generation
- `generate-cover.ts` — Cover image generation
- `make-carousel.ts` — Image carousel generation

## File Structure

```
content/
  ep04-ai-writes-love-letter/
    script.md              ← Original episode script
    script-v2.md           ← V2 rewrite with TTS emotion layers (S1-S2)
    terminal-script.json   ← terminal-video input (sections, lines, voiceover)
    publish-meta.md        ← Title, description, hashtags for Douyin
```

Videos and subtitles are output to `/mnt/d/wsl-bridge/`:
- S1-S2: `ep{N}-v2-video.mp4` / `.srt`
- S3-S5: `ep{N}-video.mp4` / `.srt`

## Dependencies

- **ffmpeg**: Video processing (system-installed)
- **edge-tts**: TTS voiceover (`pip install edge-tts` in Python venv at `lamarck/pyenv/`)
- **fonts-noto-cjk**: CJK font for terminal text rendering

## Production Workflow

1. **Write script** (`script.md` or `script-v2.md`)
2. **Create terminal-script.json** — Define sections, lines, voiceover text
3. **Generate video** — `npx tsx tools/terminal-video.ts`
4. **Verify duration** — Target 70-85s (use ffprobe)
5. **Create publish-meta.md** — Title, description, hashtags
6. **Verify all assets** — `bash tools/verify-assets.sh`
7. **Publish** — Use douyin-publish skill with mcporter

## TTS Voice Reference

| Voice | Character | Use for |
|-------|-----------|---------|
| zh-CN-YunxiNeural | Serious male | Narration, analysis, horror |
| zh-CN-YunxiaNeural | Light male | Self-mockery, humor, asides |

Rate: `-5%` for weight, `+0%` default, `+5%` for urgency
Pitch: `+2Hz` for excitement, `-2Hz` for gravity

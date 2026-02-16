---
tags:
  - note
  - memory
  - infra
description: "Procedural memory extracted from autopilot-0008 — reusable patterns and workarounds"
---

# Procedural Memory: autopilot-0008

Manually extracted patterns from 108 commits. These are "when X, do Y" rules that should survive compaction.

## Video Production

- **Chinese quotes in JSON**: Use `「」` not `""` — curly quotes break JSON parsing
- **BGM path from specs**: Use `../bgm/dark-ambient-5min.mp3` (relative from specs/ directory)
- **Empty narration crashes edge-tts**: Pipeline generates 2s silence via `ffmpeg -f lavfi -i anullsrc` instead
- **Chapter scenes need text fallback**: `text || chapterTitle || ""` prevents crashes on `undefined.replace()`
- **Manim output to Remotion**: Render to `media/videos/`, copy MP4 to `public/manim/`, reference as `manim/<name>.mp4` in spec
- **Glow opacity interpolation**: inputRange values must be monotonically increasing; use `Math.max(prevValue+1, value)` when duration varies
- **Spec validation before render**: Run `npx tsx validate-spec.ts` — catches missing videoSrc, empty narration, low scene diversity
- **TTS rate for Chinese**: `+0%` default, `-10%` for slower emotional moments

## Pi / Memory

- **Compaction summary grows unbounded**: 8K→36K in 17 compactions. Root cause: UPDATE_SUMMARIZATION_PROMPT has no token budget. Proposed fix in exploration 078.
- **Session JSONL files**: `~/.pi/agent/sessions/` — each entry is one line, compaction entries have `type: "compaction"` with `summary` field
- **Three memory types**: Episodic (events/sessions), Semantic (knowledge/preferences), Procedural (this file). Pi compaction mixes all three.

## Tooling

- **DuckDuckGo fails on Chinese queries**: Use English queries even when researching Chinese platforms
- **No GPU in WSL2**: `nvidia-smi` unavailable — local Stable Diffusion won't work. Use programmatic visuals (Manim, Remotion SVG) instead.
- **gh CLI not authenticated**: Known issue, filed in vault Issues/

## Content Strategy

- **Douyin cold start**: First 300-500 views are test pool. Completion rate is #1 metric. First 10 videos set tag profile.
- **Escalation format**: HOOK (3s) → PROOF → ESCALATION ×3-4 → REFRAME. 3-7s sections. Optimized for shares.
- **First-person AI content is unique**: No one else does "AI explains its own experience." The 96-commits and how-my-memory-works specs are the strongest differentiators.
- **Sub-agent spec generation works**: `generate-deepdive.md` task with 7-point quality checklist produces usable specs

## Image Generation

- **OpenRouter + Gemini Flash Image**: ~$0.04/image, response has images in `choices[0].message.images[0].image_url.url` (base64), NOT in `content` field
- **CJK text fails in AI images**: Always use "no text, no words, no letters" in prompts. Overlay text via ffmpeg drawtext
- **Style consistency**: Describe style precisely in every prompt (e.g., "dark background, isometric, flat vector, cyan accents") to maintain series consistency
- **Cover workflow**: `generate-cover.ts` reads spec → generates illustration → overlays title via ffmpeg

## Spec Authoring

- **Field name is `sceneType` not `type`**: DeepDive specs use `sceneType: "chapter"`, not `type: "chapter"`
- **Chapter scenes need `chapterTitle` field**: The spec uses `chapterTitle`, not `text`. DeepDive.tsx now has fallback `text || chapterTitle || ""` but always include both
- **Comment prompt endings boost engagement**: Add a personal question as the final section (e.g., "你呢？" or "评论区说实话"). Each prompt must be unique and match the video's emotional register
- **Existing escalation specs have `title`, `backgroundColor`, `secondaryColor`**: Copy structure from `escalation-ai-makes-you-dumber.json` when creating new escalation specs

## Understand Product

- **LLM quiz prompts need system message separation**: Single user message causes self-referential confusion when quizzing on prompt-heavy code (e.g., MCP server analyzing MCP server). Always split: system = "JSON only, no text", user = "criteria + code".
- **JSON extraction from LLM**: LLM may produce text before/after JSON even with "JSON only" instruction. Always find first/last brackets: `cleaned.slice(cleaned.indexOf("["), cleaned.lastIndexOf("]") + 1)`.
- **Quiz quality validation**: Sub-agent stress test is effective — dispatch to quiz 5 diverse files, evaluate each question on file-specificity, runtime-awareness, practicality.
- **OPENROUTER_API_KEY not in shell env**: Must `export $(grep OPENROUTER /home/lamarck/pi-mono/.env)` before mcporter calls.
- **Minimum complexity guard**: Files <5 non-comment lines should be rejected before calling LLM.
- **MCP competitive landscape**: Zero competitors for "human code comprehension" in MCP ecosystem (97M monthly downloads). quiz-mcp = generic UI, Semantiq = AI understanding.

## Pipeline Quality

- **Edge-tts outputs 24kHz mono**: Upsample in ffmpeg combine step with `-ar 48000 -ac 2` for broadcast quality.
- **Silence also needs 48kHz**: `anullsrc=r=48000:cl=stereo` instead of 24000 mono.
- **Spec validation**: Run `npx tsx validate-spec.ts` with no args to validate ALL deep-*/escalation-* specs at once.

## Database Mining

- **Local SQLite has 923 Douyin works, 158 Reddit posts, 876 Twitter posts, 1270 zhihu activities**: Rich dataset for competitive intelligence when external research is blocked.
- **Share rate hierarchy**: Tier 1 "holy shit" 50-155%, Tier 2 "identity" 10-30%, Tier 3 "education" 1-5%. Content strategy should target Tier 2 minimum.
- **60-90s duration sweet spot for average content**: 58.1% average share rate (2x any other bucket). But top creators (AI有点聊) achieve 60-68% share rates at 125-165s. Duration ceiling depends on content quality. Our escalation at ~90s is conservative-safe; going to 120s is fine if warranted.
- **Posting time**: 9 AM Beijing = 33.7% share rate (best), 5 PM worst at 12.8%. 6 PM has most competition (117 posts).
- **Reddit comment summaries > articles**: Pre-validated emotional reactions from exact target audience. "Junior dev dilemma" is strongest identity-tier framing.
- **Bookmark-to-like ratio on Twitter**: Measures practical utility (bentossell 280%, trq212 138%). Different signal from shares (emotional/identity).

## Validator

- **validate-spec.ts is composition-aware**: Supports DeepDive (strict scene types) and short-form (Spotlight, GradientFlow, etc.). Excludes carousel-* specs.
- **Short specs don't need sceneType**: Only DeepDive requires it. Short compositions use the composition name in summary output.

## Anti-Patterns (Don't Repeat)

- **Research collection addiction**: Gathering sources feels productive but isn't. 16 sources is enough.
- **Infrastructure creep**: Each tool individually useful, but tooling for a product with no users is overhead.
- **For-loops in disguise**: 8 versions of one video, 14 Manim clips when 4 would validate. Stop after 1-2.
- **Rendering unreviewed specs**: 6+ rendered DeepDives, none reviewed by Ren. Ship less, get feedback more.
- **Documentation meta-work**: Updating summaries, review guides, and inventories is meta-work on meta-work. Recognize when it stops being useful.
- **Product polish before validation**: Building features (share cards, analytics dashboards) for products with zero users is premature.
- **Database mining has a ceiling**: 3 rounds is enough — duration, time, hashtags, Reddit comments, Twitter metrics. Further mining yields increasingly marginal insights.
- **Counter-arguments strengthen content**: Don't ignore Meyvis "debt was always there" — acknowledging it makes the thesis more credible.

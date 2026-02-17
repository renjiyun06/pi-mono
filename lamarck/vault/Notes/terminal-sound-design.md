---
tags:
  - note
  - video
  - douyin
description: "Sound design plan for TerminalNarrator — making the terminal audible"
---

# Terminal Sound Design

## Concept

Transform TerminalNarrator from visual-only to multi-sensory. The viewer should HEAR the terminal, not just see it.

## Sound Elements Needed

| Element | Trigger | Character |
|---------|---------|-----------|
| Keyboard typing | During typewriter text | Soft mechanical clicks, rhythm matches typing speed |
| Error beep | ERROR messages | Short harsh digital tone |
| Warning tone | WARNING messages | Softer alert, lower pitch |
| Success chime | ✓ OK messages | Brief positive chirp |
| Progress tick | Progress bar filling | Quiet tick per percentage point |
| Ambient hum | Always on, low volume | CRT monitor / computer fan |
| Transition whoosh | Between scenes | Subtle digital sweep |

## Sources (free/CC0)

- Pixabay (pixabay.com/sound-effects) — free for commercial use
- Freesound (freesound.org) — CC0 and CC-BY options
- ElevenLabs SFX generator — AI-generated terminal sounds

## Implementation Approach

In Remotion, audio is declarative — you place `<Audio>` components in the render tree. For SFX tied to line events:

1. Pre-calculate when each line appears (startFrame)
2. Place `<Audio src={typingSfx} startFrom={lineStartFrame} />` for each line
3. Use volume envelopes to fade in/out naturally

This requires extending TerminalNarrator's scene renderer to emit SFX Audio elements alongside visual components.

## Priority

Medium. The narrative structure improvements (v2 script) are higher impact than sound polish. But sound is a genuinely different dimension that no amount of narrative work addresses. Explore after v2 is reviewed by Ren.

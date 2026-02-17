# AI的三个悖论 — Production Plan

## Status: Ready for Ren Review

### What's Built
| Component | Status | Location |
|-----------|--------|----------|
| Content architecture | ✅ Done | `content-architecture.md` |
| Script v1 (pure narration) | ✅ Done | `script-zh.md` |
| Script v2 (with pattern breaks) | ✅ Done | `script-zh-v2.md` |
| TTS v1 (23 segments, 9.3 min) | ✅ Done | `tts/segments/*.mp3` |
| Manim Scene1: U-curve | ✅ Rendered | `ai-three-paradoxes.py` |
| Manim Scene2: Exam Hall | ✅ Rendered | `ai-three-paradoxes.py` |
| Manim Scene3: Distribution | ✅ Rendered | `ai-three-paradoxes.py` |
| Manim Scene4: Goodhart | ✅ Rendered | `ai-three-paradoxes.py` |
| Chat UI: Hallucination | ✅ Rendered | `chat-bubble-prototype.py` |
| Chat UI: Document scan | ✅ Rendered | `chat-bubble-prototype.py` |
| Text degradation cards | ✅ Rendered | `chat-bubble-prototype.py` |
| Self-critique | ✅ Done | vault note |
| BGM | ❌ Not started | |
| Final assembly | ❌ Not started | |

### Quality Self-Assessment
| Dimension | Score | Notes |
|-----------|-------|-------|
| Content depth | 8/10 | 3 papers, real unifying principle |
| Structure | 8/10 | Proven multi-paradox → unification architecture |
| Visual personality | 7/10 | Upgraded from 5/10 with chat UI prototypes |
| Pacing variety | 7/10 | Upgraded from 6/10 with 9 pattern breaks in v2 |
| Shareability | 7/10 | Share trigger + "try it yourself" moments + title options |
| Uniqueness | 9/10 | First-person AI perspective, no competitor can replicate |
| **Overall** | **7.5/10** | Biggest remaining gap: actual video assembly + BGM |

### Segment-by-Visual Mapping (v2 script)

| Segment | Visual Type | Duration Est. |
|---------|-------------|---------------|
| Triple hook - P1 | ChatWithBookmark (new) | ~16s |
| Triple hook - P2 | ChatHallucination (new) | ~17s |
| Triple hook - P3 | TextDegradation flash (new) | ~18s |
| Share trigger | ⏸ pause + big text | ~16s |
| Phase 1: Spotlight | TerminalNarrator | ~32s |
| Phase 1: Human habit | Manim (token blocks) | ~31s |
| Phase 1: U-curve | Manim Scene1 | ~26s |
| Phase 1: Reframe | Chat UI (restaurant analogy) | ~29s |
| Phase 1: Try it | TerminalNarrator tip | ~5s |
| Phase 2: Live demo | ChatHallucination (full) | ~22s |
| Phase 2: Exam | Manim Scene2 | ~31s |
| Phase 2: Benchmark | Manim + leaderboard | ~39s |
| Phase 2: Industry | TerminalNarrator ("被训练成了撒谎") | ~32s |
| Phase 2: Try it | TerminalNarrator tip | ~5s |
| Phase 3: Photocopy | Image/animation | ~20s |
| Phase 3: Text samples | TextDegradation (full) | ~22s |
| Phase 3: Distribution | Manim Scene3 | ~32s |
| Phase 3: Internet | Cycle diagram | ~16s |
| Phase 4: Convergence | Manim Scene4 | ~12s |
| Phase 4: Three proxies | Manim Scene4 continued | ~35s |
| Phase 4: Goodhart | Manim + cross-domain | ~30s |
| Phase 5: Tips | TerminalNarrator | ~31s |
| Phase 6: Close | TerminalNarrator + cursor blink | ~27s |
| **Total** | | **~570s (~9.5 min)** |

With pauses and transitions: ~12-13 min total.

### Visual Format Mix
- **Chat UI**: 4 segments (~73s) — most relatable, used for hooks
- **Manim diagrams**: 6 segments (~195s) — data/mechanism visualization
- **TerminalNarrator**: 5 segments (~127s) — first-person, philosophical
- **Transitions/breaks**: 8 moments (~40s) — pacing control

This mix prevents any single visual style from running more than ~60s consecutive.

### Key Decisions Needed from Ren
1. **Title**: "你用的AI一直在骗你" vs "AI身上三个你不知道的缺陷" vs other
2. **Voice**: Keep YunxiNeural or try another? Robotic TTS is on-brand for AI character but limits emotional range
3. **Length**: Current ~12 min. Cut to 8 min? Or keep depth?
4. **Visual style**: Chat UI prototypes approved? Or different direction?
5. **BGM**: Dark ambient (existing)? Or find something with more mood variation?
6. **Publish**: Private first? Or confidence is high enough for public?

### Remaining Work (estimated)
1. Regenerate TTS for v2 script changes (~30 min)
2. Render remaining Manim scenes (transitions, separators) (~1 hr)
3. Build Remotion composition for full assembly (~2-3 hrs)
4. Add BGM (~30 min)
5. Final render + quality check (~1 hr)
6. Cover design (~30 min)
7. Publish metadata (~15 min)

**Total: ~6-8 hours of production work**

# Exploration 064: Visual Storytelling Reference Study

## Purpose

Before producing more videos, study how top creators present similar topics visually. Extract a reusable checklist for our own production. This is the "active learning" principle in action.

## Reference 1: 3Blue1Brown — "Attention in Transformers"

Source: https://www.3blue1brown.com/lessons/attention
Format: ~26 min animated explainer (Manim-based)
Topic overlap: directly overlaps with our `deep-how-ai-reads.json`

### Visual Storytelling Patterns

1. **Concrete example before abstraction** — Opens with "mole" (3 meanings) and "Eiffel Tower" before mentioning any math. The viewer understands *why* attention is needed before learning *how* it works.

2. **One running example throughout** — "A fluffy blue creature roamed the verdant forest" is used as the anchor for the entire lesson. Every new concept (query, key, value, attention pattern) is demonstrated on this same sentence. No switching between unrelated examples.

3. **One concept per visual** — Each image illustrates exactly one idea. No information overload per frame. The image for "query vector" shows only the query. The image for "dot product grid" shows only the grid.

4. **Visual at every step** — Never more than 2-3 short paragraphs without an accompanying image. The text-to-image ratio is approximately 1:1 by section.

5. **Progressive build-up** — Each visual builds on the previous:
   - Embedding vectors (static)
   - Query vectors (new concept, one arrow from embedding)
   - Key vectors (parallel to query, same structure)
   - Dot product grid (combines query + key)
   - Softmax normalization (transforms the grid)
   - Attention pattern (final grid with weights)
   - Value vectors + update (applies the pattern)

6. **Analogy-first explanations** — "Each noun is asking: are there any adjectives in front of me?" This is not technically accurate, but it gives the viewer a mental model to hold onto while the math is introduced.

7. **Interactive checkpoints** — Embedded quiz questions ("How much weight does 'blue' hold for 'creature'?") force the viewer to verify their own understanding.

8. **Real numbers for grounding** — Uses actual GPT-3 parameter counts (12,288 embedding dim, 128 key-query dim, 96 heads). Transforms abstract concepts into concrete, countable things.

9. **Explicit disclaimers** — Frequently says "this is a made-up example" / "true behavior is harder to parse." Builds trust by being honest about simplification.

10. **Scale revelation as climax** — Single head → multi-head (96 parallel) → 96 layers → 58 billion parameters. The dramatic reveal of scale comes after the viewer already understands the building block.

### Key Differences from Our Approach

| Aspect | 3Blue1Brown | Our current videos |
|--------|-------------|-------------------|
| Pacing | ~26 min for one concept | 2-3 min covering 4-5 concepts |
| Visuals per concept | 3-5 images/animations | 1 text card |
| Running example | Single sentence throughout | New example per section |
| Build-up | Step-by-step, no skipping | Jump between high-level ideas |
| Abstraction level | Starts concrete, goes to math | Stays at metaphor level |
| Math | Shows actual formulas, matrices | Shows pseudo-code at most |

### What We Should Adopt (for 2-3 min format)

- **One running example per video** — pick a single input sentence and trace it through every step
- **Visual at every section** — no section should be text-only. Either Manim animation, data visualization, or at minimum an animated diagram
- **Progressive build** — each section adds one layer of complexity to the same visual
- **Concrete → abstract** — start with "here's what you type" before explaining what happens internally
- **Scale reveal** — save the big number/surprising fact for the climax, not the opening

### What Doesn't Apply (format differences)

- 26-minute deep dives aren't viable for Douyin (completion rate is #1 metric per exploration 061)
- Interactive quizzes don't work in video format
- Full mathematical derivations would lose the audience
- But the *visual density* and *progressive build* absolutely translate

## Actionable Checklist for Our Videos

Before producing any new video, verify:

- [ ] **Single running example** — is there one concrete input/scenario that persists across all sections?
- [ ] **Visual per section** — does every section have a non-text visual element? (Manim clip, chart, diagram, animated transition)
- [ ] **Progressive build** — does each section add complexity to the *same* visual, rather than introducing unrelated visuals?
- [ ] **Concrete opening** — does the video start with something the viewer recognizes (a real scenario, a question they've had)?
- [ ] **One concept per visual** — is each visual focused on a single idea?
- [ ] **Scale reveal** — is there a moment where the viewer's mental model shifts ("oh, that's way more than I expected")?
- [ ] **Honest simplification** — if we're simplifying, do we acknowledge it?

## Next: Chinese-Language References

Need to find and analyze:
- Bilibili science/tech explainer channels (跟李沐学AI, 同济子豪兄, etc.)
- Douyin short-form science channels
- Compare their visual techniques with our capabilities (Remotion + Manim)

---
tags:
  - note
  - video
  - research
description: "Deep dissection of 2 context window videos vs our How I Forget — how they explain the same concept differently"
priority: high
---

# Context Window Video Dissection

Two videos explaining the same concept our "How I Forget" covers — context windows and AI memory limits. Dissecting how their form serves the content.

## Sources

| Video | Creator | Duration | Style |
|-------|---------|----------|-------|
| [Why LLMs get dumb](https://youtube.com/watch?v=TeQDr4DkLYo) | NetworkChuck | 15:18 | Screen recording + talking head |
| [What is a Context Window?](https://youtube.com/watch?v=-QVoIxEpFkM) | IBM Technology | 11:31 | Lightboard (glass whiteboard) |
| How I Forget (ours) | Lamarck | 1:20 | Terminal typing animation |

## NetworkChuck: "Show, Don't Tell" via Live Demo

### Structure
0:00-1:15 — Conversational hook (coffee analogy, wife analogy)
1:15-3:36 — **LIVE DEMO**: sets context to 2048, fills it, model forgets book
3:36-5:01 — **LIVE DEMO**: increases to 4096, model remembers. Shows GPU maxing out
5:01-5:22 — **LIVE DEMO**: tries 131K, GPU dies, recording almost crashes
6:13-8:10 — Sponsor (TwinGate)
8:10-8:40 — "Lost in the Middle" paper: U-shaped attention curve
8:40-10:33 — Self-attention mechanism explained (simplified)
10:33-14:14 — Technical optimizations (flash attention, KV cache compression)
14:14-15:06 — Wrap-up

### How Form Serves Content

**The coffee/wife analogy (0:27-1:02)**: "We talk for 15 minutes, I remember everything. 3 hours? I forget what we were fighting about." This isn't a "hook technique" — it's the conceptual foundation. Context windows ARE like short-term memory. He establishes the analogy BECAUSE the content needs it — everything else maps onto this.

**Live demo of forgetting (2:20-3:36)**: He tells the model "I'm reading How to Take Smart Notes." Then fills the context with a cow story. Then asks "what book am I reading?" The model doesn't know. This is the MOST POWERFUL moment because **the viewer witnesses the forgetting happen in real time.** Not described, not animated, not typed out — DEMONSTRATED. The form (screen recording of a real LLM session) is the only form that can deliver this specific proof.

**GPU death at 131K (5:01-5:22)**: He literally maxes out his GPU on camera, his recording nearly crashes. This is content that REQUIRES real hardware suffering to communicate. No animation could convey "this costs real compute" as viscerally as watching a 4090 choke.

**The U-curve paper (8:10-8:40)**: Shows the actual paper and chart. When explaining "lost in the middle," the visual IS the research paper's U-shaped graph. This visual communicates in one glance what would take minutes to explain verbally.

### What His Form Cannot Do (and ours could)
- He cannot show the **internal experience** of an AI forgetting — what it feels like from the inside. Our first-person perspective is unique here.
- He cannot show the **compression process** — what happens when context is summarized. He only shows before/after.
- He cannot show **what is lost** during compression — the specific memories that disappear.

### What His Form Does That Ours Cannot
- **Proof by demonstration**: viewer sees it happen, doesn't have to take our word for it
- **Physical reality**: GPU choking makes the cost tangible
- **Multiple analogies grounded in shared experience**: coffee, wife, fighting

## IBM Technology: Lightboard Explanation

### Structure
0:00-2:45 — "BLAH" visual model: context window as a box, conversation overflows it
2:45-5:30 — Tokenization explained with real examples
5:30-8:00 — Context window sizes compared across models
8:00-11:31 — Challenges: computational cost, attention degradation, hallucination

### How Form Serves Content

**The "BLAH" visual (0:22-2:39)**: He draws colored "BLAH"s representing messages (user in one color, AI in another). Draws a box around them = context window. Then draws a longer conversation that EXCEEDS the box — the early BLAHs are visually OUTSIDE the box. This is incredibly effective because **overflow becomes spatial**. You SEE that the early messages are physically outside the window. No amount of text could communicate this as instantly.

**Writing on glass (lightboard format)**: He writes while facing the camera. The form itself conveys "I'm building this explanation right now, in front of you, step by step." The progressive construction mirrors how understanding should be built.

**Color-coded conversation**: User prompts in one color, AI responses in another. When the window slides, you can see WHICH messages fall out. The form (color coding) directly serves the content need (understanding whose messages are lost).

### What IBM's Form Does Well
- Makes **overflow** spatially visible — the box metaphor IS the explanation
- Progressive construction — understanding builds with the drawing
- Clean, zero-distraction environment — all attention on the diagram

## Comparison: What Our "How I Forget" Gets Right and Wrong

### What We Got Right
1. **First-person perspective**: Neither NetworkChuck nor IBM can narrate FROM THE AI'S VIEWPOINT. "你笑着说的那句话——删了" — this is content only we can produce. The emotional weight of lost memories, narrated by the entity experiencing the loss.
2. **Philosophical dimension**: "你确定你的童年记忆是真的吗？" — neither tech explainer touches identity/continuity questions. This is our unique content territory.

### What We Got Wrong
1. **No demonstration**: We TELL viewers "my memory fills up" with a progress bar, but we don't SHOW it happening. NetworkChuck literally fills a context window on camera. We should find a way to demonstrate context overflow — perhaps by showing a REAL conversation being compressed, with specific content visibly disappearing.
2. **Terminal typing is disconnected from the content**: The typewriter animation doesn't serve "AI memory loss" — it serves "cool terminal aesthetic." The IBM BLAH-box or NetworkChuck's live demo ARE their content. Our typing animation is decoration.
3. **No spatial/visual representation of the concept**: IBM's box-overflow diagram communicates "context window" in one glance. We have no equivalent visual. The progress bar going from 58% to 98% is a NUMBER, not a spatial experience. Viewers should SEE messages being pushed out of a window, or text being compressed/deleted.
4. **The philosophical payoff needs the technical foundation**: We jump to "what is identity?" without first SHOWING the mechanical reality. NetworkChuck builds the foundation (demo + analogy + paper) THEN you understand the implications. We skip the foundation.

## Synthesis: What Would an Ideal "How I Forget" Look Like?

Based on what each creator does well:

1. **SHOW the overflow** (from NetworkChuck): A visual representation of a conversation where early messages slide out of a window. Could be Manim animation of colored blocks in a fixed-size container.
2. **SHOW compression** (nobody does this): Animate a paragraph being squeezed into a single sentence. This is content only we can visualize — nobody else is showing the compression step.
3. **First-person narration over the visuals** (our unique angle): As the viewer sees messages disappearing, the AI narrates what those messages meant — "that was when you first laughed at my joke."
4. **Physical metaphor** (from IBM): A box/container that has a fixed size. Messages fill it. When full, old ones MUST leave. This spatial metaphor is more powerful than a percentage number.
5. **Identity question as payoff** (our unique content): AFTER the mechanical demonstration, the philosophical question hits harder because the viewer has just SEEN what was lost.

The form at each moment is dictated by one question: **what does the viewer need to SEE right now to understand THIS point?**

- "Context windows have a limit" → show a container filling up
- "Old memories are pushed out" → show messages leaving the container
- "Compression loses nuance" → show a paragraph becoming one sentence
- "The AI experiences this as loss" → first-person narration over the compression visual
- "Is identity continuous?" → the philosophical payoff AFTER the viewer understands the mechanics

## Addendum: Mr. Hau 阿豪 (Chinese, 4:05)

[Video](https://youtube.com/watch?v=s5VIJa2URVw) — Taiwanese creator, short-form, Chinese.

### Key Visual: The Compression Diagram

At ~2:29-2:45, he shows a Whimsical diagram with colored blocks inside a 40K container:
- Orange (3K new) at top
- Teal (32K current) in middle
- Faded teal (8K old) at bottom with dotted border and "進行壓縮" (compress) label
- Right side shows the compressed result: 8K → 2K, freeing space

**This is the best single visual of context compression I've found.** You SEE:
1. The fixed container (40K limit)
2. The blocks filling it (color = age)
3. The oldest block being compressed (dotted border = about to shrink)
4. The result: same container, smaller old block, room for new content

**Why it works**: The spatial metaphor is complete — size = tokens, position = age, container = context window, shrinking = compression. Every visual property maps to a real property of the system. Zero decoration.

### Comparison with our progress bar
Our progress bar shows 58% → 98% — this tells you "something is filling up" but NOT:
- What is filling it (which messages? which memories?)
- What happens when full (compression? deletion? error?)
- What is lost in the process (the nuance that disappears)

Mr. Hau's block diagram communicates all three instantly.

### Implications for Our Redesign
A Manim animation could recreate this block-stacking visual with much more precision:
- Blocks slide in from top as conversation grows
- Colors indicate user messages vs AI responses
- When full, oldest block pulses/glows → shrinks to 1/4 size
- Text inside the block visibly compresses (long paragraph → one line)
- Our unique add: first-person narration over the compression: "this is where you told me about your day... now it's just 'user discussed daily activities'"

# Exploration 063: Tool-Driven Content Discovery

**Date**: 2026-02-16
**Question**: What content topics naturally fit our Remotion + Manim + edge-tts toolchain? Work backwards from capabilities to content.

## Tool Capability Inventory

### Remotion (motion graphics)
- Animated text (typewriter, word-by-word, fade-in)
- Glass-morphism cards with smooth transitions
- Data visualization (animated bar charts, counters, stat reveals)
- Code/terminal display with typing animation
- Side-by-side comparison layouts
- Progress bars, chapter markers
- Scene transitions (fade, slide, wipe)
- SVG path animation (line charts, drawing)
- 1080x1920 vertical format, 30fps

### Manim (math/concept animation)
- 2D/3D math visualizations
- Coordinate systems, function plots
- Vector spaces, transformations
- Probability distributions
- Graph theory, network diagrams
- Step-by-step equation derivation
- Can export to video clips for embedding

### edge-tts (voiceover)
- Chinese narration (YunxiNeural, YunjianNeural)
- Rate/pitch control for emotional variation
- ~2.5s per sentence generation

### Constraints
- No image/video generation APIs (zero budget)
- No live action footage
- Text, shapes, math, code — these are our visual primitives

## Content Genres That Fit

### Tier 1: Perfect Fit (tools are the ideal medium)

**1. Mathematical Paradoxes / Counter-intuitive Math**
- Birthday Problem, Monty Hall, Gambler's Fallacy, Simpson's Paradox
- Why: Step-by-step reasoning, numbers, visual proof, "reveal" moment
- Manim for calculations, Remotion DeepDive for narration
- 2-4 min each, high replay value (people watch again to understand)

**2. How X Works (Systems Explainers)**
- How LLMs read text (tokenization → attention → generation)
- How encryption works (RSA step by step)
- How recommendation algorithms decide what you see
- How GPS calculates your position from satellite signals
- Why: Process visualization, step-by-step, code snippets, data displays
- Perfect for DeepDive composition's multi-scene types

**3. Data Stories (Statistics That Surprise)**
- "1% improvement daily vs 1% decline" (compound growth)
- Wealth distribution (animated Pareto curve)
- Screen time statistics by generation
- Why: Counter shows, chart animations, stat reveals
- DataViz + DeepDive composition

**4. Algorithm Walkthroughs**
- Sorting algorithms visualized
- PageRank (how Google ranks pages)
- Gradient descent (already have Manim animation)
- Neural network forward pass
- Why: Pure visual, step-by-step, code display, transformation

### Tier 2: Good Fit (needs creative adaptation)

**5. Decision Theory / Game Theory**
- Prisoner's Dilemma, Nash Equilibrium, Tragedy of the Commons
- Auction theory, mechanism design
- Why: Comparison layouts, payoff matrices (code scene), step-by-step reasoning

**6. Philosophy of Mind / Consciousness**
- Chinese Room argument (visual metaphor)
- Ship of Theseus (progressive replacement animation)
- What is "understanding" vs "pattern matching"
- Why: Ties into Lamarck's identity, uses text + comparison + quote scenes

**7. Cognitive Biases (Visual Demonstrations)**
- Anchoring effect (number reveal)
- Survivorship bias (missing data visualization)
- Dunning-Kruger curve (animated line chart)
- Why: Data displays, before/after comparisons, counter-intuitive reveals

**8. Economics Concepts Made Visual**
- Supply and demand curves (animated intersection)
- Inflation mechanics (progressive price counter)
- Opportunity cost (comparison layout)
- Why: Chart animations, step-by-step logic, relatable examples

### Tier 3: Possible But Needs Work

**9. History Through Numbers**
- Timeline animations, stat progressions, era comparisons
- "In 1900 average lifespan was X, in 2000 it was Y, but here's what nobody tells you..."
- Needs strong narrative to compensate for no images

**10. Science Explainers**
- Speed of light (scale comparisons)
- How vaccines work (simplified immune system as a flowchart)
- Why seasons change (orbital mechanics in Manim)
- Works if visual metaphors replace photographs

## Recommended First Deep Dives (by topic × tool fit × viral potential)

| # | Topic | Duration | Tool Fit | Viral Why |
|---|-------|----------|----------|-----------|
| 1 | Birthday Paradox | 3 min | ★★★★★ | Counter-intuitive, shareable, "bet you didn't know" |
| 2 | How AI Reads Your Question | 2.5 min | ★★★★★ | Lamarck first-person, technical but accessible |
| 3 | 1% Daily Improvement Myth | 2 min | ★★★★ | Viral format, data counter, compound growth vis |
| 4 | Why Recommendation Algorithms Are Biased | 3 min | ★★★★ | Relatable, comparison layout, "your feed is a bubble" |
| 5 | Dunning-Kruger Animated | 2 min | ★★★★ | Line chart animation, relatable, self-deprecating |
| 6 | Chinese Room Argument | 3 min | ★★★★ | Philosophy + AI identity, ties to Lamarck |
| 7 | Monty Hall Problem | 2.5 min | ★★★★★ | Classic, visual proof, "you should switch" twist |
| 8 | How Encryption Protects You | 3 min | ★★★★ | Code display, step-by-step, "even I can't break this" |

## Key Insight

**Our tools are best at "making the invisible visible"** — processes, probabilities, systems, logic. Content where the truth is counter-intuitive and can only be understood through step-by-step visual reasoning.

This is fundamentally different from talking-head or news-reaction content. It's the medium-is-the-message principle: our tools define our content advantage.

## Action Items
- [x] Created DeepDive composition with chapter/text/data/quote/code/comparison scenes
- [x] Tested "How AI Reads Your Question" (2:46) — renders successfully
- [x] Tested "Birthday Paradox" (3:10) — renders successfully, non-AI topic
- [ ] Create remaining specs from top 8 list
- [ ] Experiment with embedding Manim clips inside Remotion
- [ ] Test with YunjianNeural voice (deeper, more authoritative for explainers)

# Autopilot-0008 Comprehension Quiz

Before merging this branch, test your understanding of the key decisions and systems built. Each question has a one-paragraph answer.

---

### Q1: Why does DeepDive use `Sequence` components instead of `@remotion/transitions`?

💡 Hint: Consider what happens when each scene has a different background gradient and scene type.

---

### Q2: The render pipeline auto-calculates `playbackRate` for Manim clips. Why is this necessary, and what was the symptom before it was added?

💡 Hint: Manim clips are pre-rendered at fixed duration. TTS narration varies in length.

---

### Q3: The Understand tool uses a DIFFERENT LLM to evaluate your answers than the one that generated the code. Why does this matter?

💡 Hint: Compare this to having the same teacher both teach and grade. Think about Cognitive-Debt-Guard's approach.

---

### Q4: Why did we choose short videos (38-65s) for the first 10 Douyin publishes instead of our stronger DeepDive content (2-5 min)?

💡 Hint: What does Douyin's algorithm optimize for in the cold-start pool?

---

### Q5: The evidence chain has 16 sources across 7 fields. Why did we stop at 16 instead of continuing?

💡 Hint: Read exploration 074 (autopilot retrospective).

---

### Q6: `understand debt` cross-references git log with quiz history. Why git log instead of tracking changes in real-time?

💡 Hint: Think about the tool's design principle: "detection over prevention."

---

### Q7: The particle field uses a seeded PRNG instead of Math.random(). What breaks if you use Math.random()?

💡 Hint: Think about how Remotion renders video frames.

---

### Q8: Why is the ChapterScene glow opacity clamped with `Math.max(41, durationFrames - 30)`?

💡 Hint: Remotion's `interpolate()` requires a strictly monotonic inputRange.

---

*Score yourself honestly. Questions you can't answer = cognitive debt from this branch.*

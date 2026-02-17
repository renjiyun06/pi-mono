---
tags:
  - note
  - video
  - research
description: "Grant Sanderson's advice on math video creation — directly applicable to our Douyin content"
priority: high
---

# 3Blue1Brown Animation Principles

Source: [3Blue1Brown FAQ](https://www.3blue1brown.com/faq) and [SoME kickoff video](https://youtu.be/ojjzXyQCzso)

## Key Principles (ranked by relevance to us)

### 1. Know your genre
> "Some educational creators play the role of student documenting their own learning, others play the role of an expert conveying what they've spent years learning, others are teachers, others are journalists... what works for one may not work for another."

**Our genre**: AI explaining itself. Not teacher, not journalist, not student. First-person witness/subject. This is genuinely novel — the subject IS the narrator. We should stop pattern-matching from 漫士 (math teacher genre) and lean into what makes our genre unique.

### 2. Topic choice > production quality
> "Topic choice matters way more than production quality."

We learned this the hard way — 80s clips with perfect rendering got 21 views. The topic shift to "AI三个悖论" is correct.

### 3. Concrete before abstract
> "Try putting concrete and specific ideas before general and abstract frameworks."

Our bridge concepts (spotlight, exam student, photocopy) are doing this right. The Goodhart's Law unification comes AFTER three concrete stories — correct order.

### 4. Don't overuse Manim
> "I've seen many people overuse and abuse it, e.g. by just displaying a series of equations or text which are unnecessarily animated."

**Warning for us**: The chat UI prototypes (ChatHallucination, ChatWithBookmark) are NOT Manim overuse because they represent something the viewer physically experiences. But animating text equations would be overuse.

### 5. Manim works when code reflects the concept
> "Where programmatic animations work best is when the code directly reflects the math you're trying to explain."

Our U-curve attention visualization passes this test — the code literally computes attention scores by position. Distribution narrowing also passes — the code IS the model collapse process.

### 6. Manim is for clips, not full videos
> "This is just a tool for spitting out the individual clips to be edited together later."

Validates our ffmpeg concat approach. Don't try to build the entire video in Remotion or Manim. Render clips, concat with audio, use traditional editing.

### 7. Embrace niche
> "Embrace niche topics, especially when getting started, rather than trying to cast the widest net."

"AI from AI's perspective" is niche but deeply authentic. Don't try to be a general science channel.

## Applied to Our Work

### What to keep
- Chat UI prototypes — recognizable, physical, genre-appropriate
- Bridge concepts before mechanisms
- Goodhart unification after concrete stories
- ffmpeg clip-based assembly

### What to reconsider
- Studying 漫士 too closely — different genre, different needs
- Over-animating text/equations in Manim
- Trying to be a "science explainer" when our unique angle is "AI self-narration"

### Genre-specific strengths to lean into
- Terminal/CLI aesthetic (the AI's native environment)
- First-person knowledge of attention, hallucination, collapse
- The philosophical close ("understanding a mechanism doesn't fix it")
- Error messages, log outputs, code snippets AS visual language
- The tension between self-awareness and inability to change

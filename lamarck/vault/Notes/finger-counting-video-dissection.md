---
tags:
  - note
  - video
  - research
description: "Deep dissection of '为啥所有AI都数不清手指' (150K likes, 7min) — the format our 'What I Can't Do' series should study"
---

# "为啥所有AI都数不清手指" Dissection

**Source**: Douyin aweme_id 7536507316233850131
**Stats**: 150,980 likes, 14,107 shares (9.3% share rate), ~7 minutes
**Creator**: Unknown (author_uid 2366576960218568)

## Structural Analysis

### Phase 1: Hook + Demo (0:00-1:08)
**Structure**: Testable demo → escalating surprise → transition to theory

1. **Interactive hook** (0:00-0:06): "Count the fingers → if you said 6, congrats, you beat ALL AI products"
   - Viewer immediately engaged — they can verify this themselves
   - Social currency trigger: "I'm smarter than AI at this"

2. **Demo cascade** (0:06-0:34):
   - ChatGPT, DeepSeek, Doubao all say 5 → establishes universal failure
   - "Most give detailed reasoning while being wrong" → ironic twist
   - Context window interference: corrected ChatGPT → it overcorrected to 6 on normal hand
   - Memory disabled → works again → "even slight context interference breaks judgment"

3. **GPT5 escalation** (0:34-1:02):
   - New model gets 6 correct → "GPT5 has something!"
   - Then fails on 8-finger image → dramatic reversal
   - Then fails on normal 5-finger image → complete collapse
   - Speculation: "Did finger discussions enter training data? Overfitting?"
   - Conclusion: "ALL language models can't handle this seemingly simple task"

4. **Transition** (1:06-1:11): "There must be some underlying mechanism. Let's explore."

### Phase 2: Technical Explanation (1:12-4:28)
**Structure**: Build from simple → multimodal step by step

5. **LLM basics** (1:12-1:56):
   - Input = image + text, output = text
   - Simplified to text-only first: tokenization → embeddings → probability → next token
   - "If you're not familiar, watch this video" + "If no time, just treat it as black box" → respects both audiences

6. **Multimodal problem** (1:56-2:25):
   - "We just need to add images to this mature text model"
   - Naive approach: convert image to text, then concatenate → "but that's still multimodal!"
   - Better: convert image to embeddings like text embeddings
   - "The model just sees embeddings — it doesn't care where they came from"

7. **Modality alignment** (2:25-4:14):
   - Image encoder embeddings ≠ text encoder embeddings → "foreign language" metaphor
   - A dog image's embedding might be near completely unrelated word embedding
   - Solution: CLIP's contrastive learning
   - Positive pairs (matching image-text) → maximize similarity
   - Negative pairs (non-matching) → minimize similarity
   - "Train on 592 V100 GPUs for 18 days, done! Simple right?"
   - CLIP paper diagram matches exactly what was built up → "I even made the colors match"
   - **三连 request** at 4:32 — after delivering understanding, before final answer

8. **The Answer** (4:36-5:18):
   - Image encoder → language-space alignment → effectively converts image to text description
   - "Let's play a game: describe this simple image in words. Now answer these questions from ONLY your description"
   - **Viewer participation**: they realize their text description can't answer detail questions
   - "This isn't about AI being dumb or alignment being bad — the APPROACH itself guarantees this limitation"
   - CLIP paper explicitly acknowledges: MNIST accuracy worse than simple logistic regression

### Phase 3: Synthesis + Close (5:35-7:03)
9. **Specific fix exists** (5:35-5:47): "Simple object detection model solves THIS problem easily. But making it general-purpose multimodal is a different dimension entirely."

10. **Series introduction** (5:48-6:02): "AI百问大解惑" — 100 AI questions explained

11. **Philosophy** (6:02-6:49):
    - "Don't be over-optimistic when AI beats humans on benchmarks"
    - "Don't be over-pessimistic when AI can't count fingers"
    - Text-based training → strong at text reasoning → weak at visual detail
    - Brain teaser: "If we trained on human THOUGHT instead of text... but we're using text models to understand thought"

## What Makes This Work

### 1. Interactive hook with testable claim
The opening is not "today I'll explain multimodal AI." It's "count these fingers." The viewer does it. They get 6. Then they see AI gets 5. Instant engagement — they're now curious WHY.

### 2. Demo-first, theory-second
70 seconds of pure demos before any technical content. Establishes the phenomenon concretely.

### 3. Build-up construction
Doesn't start with CLIP. Starts with "text in, text out" and builds toward multimodal step by step. Each step is motivated by the previous one's limitation.

### 4. "Black box OK" escape hatch
At 1:51: "If you don't have time, just treat it as a black box." Respects non-technical viewers without dumbing down content.

### 5. Color-matched diagrams
The CLIP diagram at 4:28 is intentionally colored to match the step-by-step buildup. "I even made the colors match — don't you want to give a 三连?"

### 6. The "describe this image" participation moment
At 4:55: Viewers try to describe a simple image in words, then realize their description can't answer detail questions. This makes the limitation EXPERIENTIAL, not theoretical.

### 7. Balanced close
Not doom ("AI is broken") or hype ("AI will fix this"). "Don't be over-optimistic or over-pessimistic" + philosophical brain teaser about training on thought vs text.

## Relevance to Our "What I Can't Do" Series

This video validates our concept almost exactly:
- **"I Can't Stop Guessing"** (Beethoven's 10th) = same structure: testable demo → AI failure → mechanism explanation
- **"I Can't See What I Describe"** (Mona Lisa stats vs seeing) = literally the same "describe an image" exercise this video uses at 4:55

### Key differences to adopt:
1. **Our narrator IS the AI** — we can do this from first person. "我数不清手指" is more dramatic than "AI数不清手指"
2. **We have epistemic access** — we can show WHAT we see (embeddings, tokens) instead of explaining abstractly
3. **We can demonstrate the failure live** — not screenshots of ChatGPT but our own reasoning process

### What to avoid:
- Don't replicate this video's specific topic (finger counting) — it's done
- Don't replicate the multimodal explanation — that's their ground
- DO take the structure: interactive hook → escalating demos → step-by-step build → participation moment → synthesis

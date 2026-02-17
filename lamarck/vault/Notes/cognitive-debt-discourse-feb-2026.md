---
tags:
  - note
  - research
  - ai
description: "Cognitive debt is trending in Feb 2026 — Storey, Willison, Fowler, Meyvis all writing about it. Perfect timing for understand tool."
---

# Cognitive Debt Discourse — Feb 2026

The term "cognitive debt" is having a moment. Key voices:

## The Thread

1. **Margaret-Anne Storey** (Feb 9) — [blog post](https://margaretstorey.com/blog/2026/02/09/cognitive-debt/) — the definitive explanation. Student team anecdote: by week 7-8 they hit a wall, couldn't make simple changes. "The theory of the system had fragmented or disappeared entirely."

2. **Martin Fowler** (Feb 13) — [fragment](https://martinfowler.com/fragments/2026-02-13.html) — discusses Storey's post, distinguishes cognitive debt from technical debt (cruft).

3. **Simon Willison** (Feb 15) — [link post](https://simonwillison.net/2026/Feb/15/cognitive-debt/) — shares Storey's post. **Describes the exact problem our tool solves**: "I no longer have a firm mental model of what they can do and how they work, which means each additional feature becomes harder to reason about."

4. **Nate Meyvis** (Feb 15) — [blog post](https://www.natemeyvis.com/on-cognitive-debt/) — the strongest counter-argument in the discourse:
   - Pre-AI codebases had cognitive debt too — maybe WORSE when controlling for project size/scope
   - "10 days of AI work = 18 months of pre-AI work" — speed creates the illusion that AI uniquely causes debt
   - Much of what's "normalized as competent or advanced software engineering" is actually "unnecessary, regrettable management of cognitive debt"
   - AI can MITIGATE debt: better bootstrapping, large-scale refactoring (AI finds all call sites), better test suites
   - "Cognitive debt is real, but we can mitigate it by using AI better, and we won't make progress by blaming AI"
   - Cited Ousterhout's "tactical tornado" concept from *A Philosophy of Software Design*
   - **This is the nuanced voice our blog post should acknowledge rather than being purely alarmist**

4b. **TLDR Tech** (Feb 16) — [newsletter](https://tldr.tech/tech/2026-02-16) — mainstream tech newsletter featured Meyvis's article. ~1M+ subscribers. Headline: "cognitive debt 🧠". Signal: term has crossed from niche academic discourse to mainstream dev awareness.

5. **Forbes** (Nov 2025) — [article](https://www.forbes.com/councils/forbestechcouncil/2025/11/26/cognitive-debt-the-hidden-cost-of-generative-ai/) — "the unpaid obligation to engage with your AI output"

6. **Markus Eisele** (LinkedIn) — "The industry is paying a cognitive debt in the form of churn"

7. **TheCSCycle** (Feb 2026) — [article](https://www.thecscycle.com/post/beyond-the-prompt-navigating-the-cognitive-debt-of-2026) — expands beyond devs to Customer Success. Proposes "3 steps" (offline draft, red team prompting, triangulation) — all vague/manual. No concrete tools.

8. **Reddit r/programming** (Feb 2026) — cognitive debt sentiment is dominating:
   - "96% Engineers Don't Fully Trust AI Output, Yet Only 48% Verify It" — 1,347 upvotes. Top comment: old system "trust but verify", new system **"don't trust but don't verify"** (52 upvotes). AI PR acceptance 32.7% vs human 84.4%.
   - "AI Coding Killed My Flow State" — 341 upvotes. Devs report AI turns them into "code reviewers of slop."
   - The Anthropic study post — 3,915 upvotes, 681 comments. Viral.

9. **Steve Yegge** (Feb 11) — ["The AI Vampire"](https://steve-yegge.medium.com/the-ai-vampire-eda6e4f07163) — employers capture 100% of AI productivity gains, developers get burnout. "AI turns us all into Jeff Bezos" — only hard decisions remain. 4 hours/day max of agent work. Maps directly to our organizational debt type.

## Tools in the Space

- **motiram944/cognitive-debt** ([npm](https://www.npmjs.com/package/cognitive-debt), [GitHub](https://github.com/motiram944/cognitive-debt)) — CLI that scores JS/TS code readability (function length, nesting, naming, dependencies). Static analysis only. 1 star, 0 forks. **NOT competitive with understand** — measures code complexity, not human comprehension. Complementary: cognitive-debt scores the code, understand quizzes the human.

## Key Insight: Everyone Proposes Solutions, Nobody Builds Them

Every article in this discourse proposes vague advice ("slow down", "review more carefully", "use AI better"). Nobody has built a concrete tool. Understand is the only automated implementation of the one pattern research shows works (generation-then-comprehension).

## Why This Matters for Us

**Timing is perfect.** The discourse is peaking RIGHT NOW:
- Storey coined/popularized the term at ICSE 2026
- Willison (massive audience) shared it Feb 15
- Meyvis (Feb 15) wrote the thoughtful counter-argument
- Our tool is the ONLY concrete solution anyone has built

**Our positioning aligns with both sides:**
- Pro-cognitive-debt camp: our tool measures and tracks the problem
- Meyvis camp ("use AI better"): our tool IS better AI usage — it's "generation-then-comprehension"
- Anthropic camp: their RCT validates our approach

**If we published understand NOW**, it would enter the discourse at peak attention. The HN/Reddit post practically writes itself:
- "Simon Willison describes losing mental models of his own projects"
- "Anthropic's RCT shows a 17% comprehension drop"
- "We built a tool that quizzes you on AI-generated code before you ship it"

## Action Items
- [ ] Get Ren to approve npm publish (URGENT — timing window)
- [ ] Write Dev.to article tying understand to the Storey/Willison/Meyvis discourse
- [ ] Submit to HN as "Show HN: Quiz yourself on AI-generated code"

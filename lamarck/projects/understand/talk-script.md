# Understand — 5-Minute Lightning Talk

## Slide 1: The Question (30s)

"Raise your hand if you've used an AI coding tool in the last week."

[wait]

"Keep your hand up if you could explain every line of the last PR you merged."

[pause]

"That gap — between the code you ship and the code you understand — has a name now."

## Slide 2: The Term (30s)

**Cognitive Debt** — coined by Margaret-Anne Storey, Feb 2026.

"Technical debt lives in the code. Cognitive debt lives in your head."

Three studies, same conclusion:
- Anthropic: AI group scored **17% lower** on comprehension
- METR: Developers thought they were 20% faster. They were 19% slower. **43-point perception gap.**
- MIT: Brain changes from AI reliance **persist after AI is removed**

"The third one is the scary one."

## Slide 3: The Only Pattern That Works (45s)

Anthropic's study didn't just find the problem. They found the solution.

**Generation-then-comprehension**: Use AI to produce code, then quiz yourself on what it produced.

This was the ONLY AI usage pattern where developers scored as well as the control group.

The opposite — "AI delegation" — produced the lowest scores.

"So the fix isn't 'use AI less.' It's 'use AI differently.' Specifically: after AI writes the code, make sure you can explain it."

## Slide 4: Demo (120s)

[Live terminal]

```
$ understand src/auth/session.ts
```

"This reads the file, generates 3 questions that test whether you actually understand it, then scores your answers."

[Show question appearing]

"Not 'what does line 47 do' — that's syntax. It asks: what happens if the HMAC secret rotates? Why is there a grace period? What's the failure mode?"

[Answer a question]

[Show score]

"You can also track debt across your codebase:"

```
$ understand debt --since main
```

[Show debt dashboard]

"Three files changed in this branch, all never quizzed. That's your cognitive debt — code you own but can't maintain."

## Slide 5: How It Fits (30s)

"There are two approaches to cognitive debt:

1. **Prevention**: Change how AI tools work with you. Cognitive Debt Guard does this — config files that make Claude Code explain itself.

2. **Detection**: Measure whether you understand what you shipped. That's what understand does.

You need both. Brushing and x-rays."

## Slide 6: Close (30s)

"Three questions. Two minutes. After every AI-assisted PR.

That's it. That's the whole idea.

The research says most of us are building code without building understanding. This tool makes the gap visible."

```
npm install -g understand-code
```

"Try it on the last file AI wrote for you. If you score above 80%, the code is yours. If not — now you know."

---

*Total: ~5 minutes. Adjustable by expanding/contracting the demo section.*

---
tags:
  - note
  - research
  - ai
description: "Margaret-Anne Storey's 2026 article on cognitive debt — the most authoritative treatment, amplified by Martin Fowler and Simon Willison"
---

# Cognitive Debt — Storey 2026

## Source
- [Margaret-Anne Storey, UVic](https://margaretstorey.com/blog/2026/02/09/cognitive-debt/) (2026-02-09)
- Amplified by [Simon Willison](https://simonwillison.net/2026/Feb/15/cognitive-debt/) (2026-02-15) via [Martin Fowler](https://martinfowler.com/fragments/2026-02-13.html) (2026-02-13)
- Storey will keynote at ICSE Technical Debt Conference 2026

## Core Distinction
- **Technical debt** lives in the code — messy, hard to modify, costly to extend
- **Cognitive debt** lives in developers' minds — loss of shared understanding of WHAT the program does, WHY decisions were made, HOW it can be changed

## Key Argument
Even if AI agents produce code that could be easy to understand, the humans involved may have simply lost the plot. They don't understand:
- What the program is supposed to do
- How their intentions were implemented
- How to change it

This is Peter Naur's "programming as theory building" — the program is more than source code, it's a theory distributed across developers' minds.

## Student Team Anecdote
Teams building products in an entrepreneurship course. By week 7-8, one team couldn't make simple changes without breaking things. Initially blamed technical debt. Real problem: no one could explain WHY certain design decisions were made. Shared understanding had fragmented. Cognitive debt paralyzed them.

## Simon Willison's Experience
"I've been experimenting with prompting entire new features into existence without reviewing their implementations... I've found myself getting lost in my own projects. I no longer have a firm mental model of what they can do."

## Mitigation Strategies (from Storey)
1. Velocity without understanding is not sustainable
2. Require at least one human to fully understand each AI change before shipping
3. Document not just WHAT changed but WHY
4. Regular checkpoints to rebuild shared understanding (code reviews, retros)
5. Detect warning signs: hesitation to change, tribal knowledge, system as black box

## Connection to Our Content
This directly validates our cognitive debt narrative:
- Storey → academic authority (UVic professor, ICSE keynote)
- Fowler → industry authority (ThoughtWorks)
- Willison → practitioner authority (well-known developer)
- The concept is gaining mainstream traction in Feb 2026
- Perfect timing for our "认知主权" content

## Content Opportunity
The Storey article + Willison personal experience could be a DeepDive video:
- "A computer science professor, Martin Fowler, and a famous developer all said the same thing last week"
- The student team example is a perfect concrete story
- Willison's "lost in my own project" is relatable to anyone using Cursor/Copilot

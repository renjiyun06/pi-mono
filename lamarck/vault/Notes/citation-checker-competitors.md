---
tags:
  - note
  - research
  - tool
description: "Multiple citation verification tools already exist — our checker is a CTA companion, not a product"
---

# Citation Checker Competitors

Researched Feb 17, 2026.

## Existing Tools

| Tool | Databases | Cost | Notes |
|------|-----------|------|-------|
| [SwanRef](https://swanref.org) | CrossRef, Google Scholar, publishers | Unknown | Pattern matching for hallucination signatures |
| [Citea](https://citea.cc) | CrossRef, PubMed, arXiv, Semantic Scholar | Free, no registration | Most feature-rich free option |
| [TrueCitation](https://truecitation.com) | Unknown | Free | Simple verification |
| [CiteTrue](https://citetrue.com) | Unknown | Free | AI-powered |
| [Citely](https://citely.ai) | Multiple | Unknown | AI assistant for citation checking |

## Implication for Our Tool

Our `tools/hallucination-checker/index.html` is **not a standalone product opportunity** — the market is already served. However:

1. **CTA companion**: It's still valuable as a linked tool from the "Can't Stop Guessing" video
2. **Chinese UI**: Our Chinese-first interface may be unique in this space (most tools are English-only)
3. **Trap questions**: The "copy this question, paste to AI" flow is our differentiator
4. **Self-contained**: Zero backend, works offline (once loaded), no account needed

## Action Items
- Don't invest more time improving the checker's core verification
- Focus on the CTA flow (video → trap question → paste to AI → paste back → verify)
- The Chinese-language angle might still be valuable for the Chinese market

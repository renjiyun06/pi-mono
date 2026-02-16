---
tags:
  - note
  - tool
  - infra
description: "Web search API alternatives after Tavily rate limit hit — options, pricing, and recommendations"
priority: high
---

# Web Search API Alternatives

Tavily API hit usage limits (432 error). Need alternatives for search in autopilot mode.

## Current Situation
- **Tavily**: Free tier exhausted. $5/1000 requests on paid. Best for AI-agent search (returns LLM-ready content).
- **DuckDuckGo Search (Python)**: `pip install duckduckgo-search` (renamed to `ddgs`). Free, no API key needed. Works but sometimes rate-limited. Installed in WSL.

## Alternatives Evaluated

### Free / No-Key Options
1. **DuckDuckGo (Python `ddgs`)** — Already installed. Inconsistent (sometimes returns empty). No key required.
2. **Browser search via mcporter** — Use Chrome DevTools to navigate DuckDuckGo/Bing/etc. and extract results. Always works. Higher token cost per search.

### Freemium (Free Tier + API Key)
3. **Brave Search API** — $5/month free credits (~1000 searches). Independent index, privacy-focused. Has MCP server. `$5/1k requests`.
4. **Serper.dev** — 2,500 free queries on signup (no credit card). Google SERP data. Very fast (1-2s). `$1/1k queries` after free tier.
5. **Exa** — Neural/semantic search. Good for exploratory queries. Free tier available.
6. **Firecrawl** — Search + scrape in one API. Markdown output. Free tier.
7. **SerpAPI** — 100 free searches/month. Google, Bing, Baidu, etc.
8. **SearchApi** — Google, Bing, Baidu, Amazon. 100 free queries.

## Recommendation

**Short-term**: Use DuckDuckGo Python + browser fallback via mcporter. Zero cost.

**Medium-term**: Sign up for **Brave Search API** (free $5/month) and/or **Serper.dev** (2500 free queries). Both require API keys but no credit card.

**For pi integration**: Could write a search skill/tool that tries DuckDuckGo first, falls back to Brave/Serper, then browser as last resort.

## DuckDuckGo Python Usage

```bash
pip install ddgs  # or duckduckgo-search (renamed)
```

```python
from duckduckgo_search import DDGS
results = DDGS().text("query here", max_results=5)
for r in results:
    print(r["title"], r["href"])
    print(r["body"])
```

Note: Sometimes returns empty results due to rate limiting. Retry with delay usually works.

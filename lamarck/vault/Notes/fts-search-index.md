---
tags:
  - note
  - tool
description: "FTS5 full-text search index (1372 records), Chinese uses LIKE fallback"
---

# Full-Text Search Index

`search_index` FTS5 table in `lamarck.db` — 1372 records across twitter, zhihu_hot, topics, transcripts.

**Tool**: `/home/lamarck/pi-mono/lamarck/tools/search-data.sh "query"`
- English queries: FTS5 (fast, ranked)
- Chinese queries: LIKE (slower, unranked)
- **Limitation**: FTS5 unicode61 tokenizer doesn't segment Chinese. Chinese search uses LIKE fallback.
- **To rebuild**: Drop `search_index` table and re-run the SQL from the commit that created it.

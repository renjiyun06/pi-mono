# 058 - Autopilot Mode Learnings

> Date: 2026-02-16

## What Works in Autopilot

1. **Commit-as-progress**: Each commit is a checkpoint. If context compacts, the git log is the recovery path.
2. **Spec-driven pipeline**: Writing content as JSON specs decouples writing from rendering. Can batch-render anytime.
3. **Small steps**: One spec, one render, one commit. Never batch too many changes before committing.
4. **Research → Write → Explore**: Cycle between research (web search), creation (specs), and analysis (explorations).
5. **Daily notes**: High-level decisions that commits can't capture — direction changes, synthesis, priorities.

## What Doesn't Work

1. **Over-production before review**: Built 33 specs and 53 videos without Ren reviewing any. Should have paused at ~10 and asked for feedback.
2. **DuckDuckGo search**: Inconsistent quality, especially for Chinese queries. Often returns irrelevant or spam results.
3. **Infrastructure building without validation**: Spent time on BGM mixing, carousel rendering, spec generator — useful tools but no validated content to use them on.
4. **Exploration creep**: 58 exploration documents. Most are useful but some just rehash similar insights.

## Efficiency Metrics (This Autopilot Session)

- ~15 commits in this session
- ~8 new video specs (all rendered)
- ~3 explorations
- ~2 composition improvements
- ~1 pipeline feature (BGM)
- ~1 review doc update

Roughly 1 commit per 10-15 minutes of work. Each commit is a meaningful unit of progress.

## Recommendations for Future Autopilot

1. **Cap at 10 specs before review**: Don't produce more content until existing content is validated
2. **Time-box research**: 2 searches max per topic, then write up findings
3. **Prioritize rendering existing specs** over creating new ones
4. **Check vault Issues/ first**: Some issues might be resolvable
5. **If truly blocked on all projects**: Improve documentation, write tests, or study code — don't create more unreviewed content

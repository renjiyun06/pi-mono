# Known Issues

## Twitter anti-crawl blocks agent browsing

- **Date**: 2026-02-09
- **Task**: twitter-seed-accounts (collect seed accounts from Twitter recommended feed)
- **Symptom**: Agent failed twice, no result file produced. Likely page content empty or blocked.
- **Cause**: Twitter/X has aggressive anti-crawl mechanisms. Pages may return empty content or require retry.
- **Workaround**: Not yet found. Retry button clicking was instructed but didn't help.
- **Status**: Unresolved

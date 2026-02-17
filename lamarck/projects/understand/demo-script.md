# Understand — Demo Script

## For Product Hunt / HN / Video Demo

### Scene 1: The Problem (15s)

```
# You accept AI-generated code you don't understand
$ cursor generate "add OAuth2 flow to auth.ts"
✓ Generated 67 lines in src/auth/oauth-flow.ts
$ git add . && git commit -m "add oauth"  # Ship it!
```

*Narrator: "You just shipped 67 lines of code. Can you explain how it handles token refresh? What happens if the refresh token is expired during a concurrent request?"*

### Scene 2: The Quiz (30s)

```
$ understand src/auth/oauth-flow.ts

📖 understand — testing your comprehension of: oauth-flow.ts

Generating questions...

━━━ Question 1/3 ━━━

The refresh token logic uses a mutex lock. What happens if two
requests both detect an expired access token simultaneously?

💡 Hint: Look at the acquireLock() call and the token cache check
   after acquiring the lock.

Your answer: The mutex prevents both from refreshing at once.
  The second request will find the token already refreshed
  after it acquires the lock, and skip the refresh.

Score: [████████░░] 8/10
Good. You identified the double-check pattern. Note: there's also
a 5-second grace period (line 34) that prevents near-simultaneous
refresh attempts even without the lock.

━━━ Question 2/3 ━━━

What error does the user see if the refresh token itself has expired?

...
```

### Scene 3: The Score (10s)

```
━━━ Understanding Score ━━━

Overall: [███████░░░] 73%

⚠️  Partial understanding. You may struggle to debug or modify
    this code under pressure.

Saved to .understand/history.json
```

### Scene 4: The Debt Dashboard (15s)

```
$ understand debt --since main

━━━ Understanding Debt ━━━

4 code files changed, 3 never quizzed, 412 total line changes

  🔴 [▓▓▓▓▓▓░░░░]  234 lines  src/auth/oauth-flow.ts
     3 commits, never quizzed
  🔴 [▓▓░░░░░░░░]   98 lines  src/api/middleware.ts
     1 commit, never quizzed
  🟡 [▓░░░░░░░░░]   45 lines  src/utils/cache.ts
     1 commit, score: 45%, quizzed 2 days ago

💡 Start here: understand src/auth/oauth-flow.ts
```

*Narrator: "Three files you've never reviewed. 234 lines of OAuth code you can't explain. That's cognitive debt."*

### Scene 5: The CTA (5s)

```
$ npx understand-code src/auth/oauth-flow.ts
```

*"One command. Know your code."*

---

## Key Messages

1. **Not a linter, not tests** — those check code correctness. This checks YOUR understanding.
2. **Research-backed** — Anthropic's own study says this approach works.
3. **Zero friction** — one command, no config beyond an API key.
4. **Tracks debt** — shows you what you don't know, not just what's broken.

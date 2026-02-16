# 081: Understand Distribution Strategy — MCP vs Everything Else

## Context

Understand is an anti-cognitive-debt tool. It quizzes developers on code they're working with to ensure comprehension. Current implementations: CLI (understand.ts), web app (app.html), pi extension, MCP server. The question: what's the right distribution strategy?

## Options Considered

### 1. npm CLI tool
**How**: `npx understand-code quiz file.ts`
**Pros**: Familiar to developers, easy to install, works everywhere
**Cons**: Standalone tool = extra step in workflow. Developers already have terminal open for git, build, etc. Adding another command is friction.
**Verdict**: Good for power users, bad for adoption.

### 2. VS Code extension
**How**: Extension marketplace, activate on file save or AI code acceptance
**Pros**: Where most developers already work. Can intercept Copilot/Cursor completions.
**Cons**: Platform-locked. VS Code market is crowded. Building and maintaining a VS Code extension is significant work. Would need separate Cursor, JetBrains, Neovim versions.
**Verdict**: High impact if we commit, but high cost and platform lock.

### 3. MCP server (chosen)
**How**: Any MCP-compatible client calls `understand_quiz`, `understand_evaluate`, `understand_score`
**Pros**:
- **Platform-agnostic**: Works with VS Code, Cursor, pi, Windsurf, any future MCP client
- **Zero UI work**: The client provides the UI. We just provide the intelligence.
- **Composable**: Other tools can build on top. A VS Code extension could be a thin MCP client wrapper.
- **Future-proof**: MCP is becoming the standard protocol for AI tool integration
- **Already works**: Tested end-to-end via mcporter in < 1 day of work
**Cons**: Depends on MCP adoption. Not standalone — needs an MCP client.
**Verdict**: Best effort-to-reach ratio. One implementation, many clients.

### 4. GitHub Action
**How**: Run on PRs, check if contributors understand changed code
**Pros**: Catches cognitive debt at review time. Works for teams.
**Cons**: Post-hoc (code already written), not real-time. CI-only.
**Verdict**: Good complement to MCP, not primary distribution.

### 5. Git hook
**How**: pre-commit or prepare-commit-msg hook quizzes on changed files
**Pros**: Catches at commit time, before code enters repo.
**Cons**: Annoying. Developers will disable it. Hook installation is fragile.
**Verdict**: Only works if voluntary. Already implemented as opt-in reminder.

## Strategic Analysis

The key insight: **Understand's value is in the intelligence (question generation + evaluation), not the UI.** The MCP approach separates these correctly:

- We own: question quality, evaluation accuracy, score tracking
- Client owns: when to trigger, how to present, user interaction

This is the "headless CMS" pattern applied to developer tools. Contentful doesn't build websites — it provides content APIs that any frontend can consume. Similarly, Understand doesn't build editors — it provides comprehension APIs that any editor can consume.

## MCP Market Timing

VS Code announced MCP support in preview (Jan 2026). Cursor already supports MCP. GitHub Copilot is adding MCP tool support. The protocol is early enough that quality tools will get visibility, but established enough that clients exist.

The MCP marketplace is where the npm registry was in 2012 — small, growing fast, first-movers get outsized attention.

## Next Steps (if Ren approves)

1. Publish MCP server to npm (as `understand-mcp`)
2. Submit to MCP server directories (awesome-mcp-servers, etc.)
3. Write blog post: "I built an MCP server that quizzes you on AI-generated code"
4. Add GitHub Action as secondary distribution channel
5. Consider: VS Code extension as thin MCP client wrapper (minimal code, maximum reach)

## Connection to Douyin Content

The escalation video `escalation-cognitive-debt-tool.json` already promotes Understand. If the MCP server is published, the video CTA changes from "concept" to "try it now." Content-as-marketing with a real product behind it.

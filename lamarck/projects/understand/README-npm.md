# understand-code

CLI + MCP server that quizzes developers on code comprehension. Tests design decisions, failure modes, and architectural understanding — not syntax memorization.

> Anthropic's own RCT (Shen & Tamkin, Jan 2026) found that "generation-then-comprehension" is the only AI usage pattern that preserves learning. This tool automates that pattern.

## Why

- **-17%** comprehension scores when using AI (Anthropic RCT, 52 developers)
- **43-point** perception gap: devs think they're faster, they're actually slower (METR RCT)
- **96%** of developers don't trust AI code, but **48%** don't check before committing (Sonar survey)
- Brain changes from AI reliance **persist after AI is removed** (MIT EEG study)

## Install

```bash
npm install -g understand-code
```

Or use directly:

```bash
npx understand-code src/auth.ts
```

## CLI Usage

```bash
# Quiz on a file
understand src/auth.ts

# Preview questions without quiz
understand src/auth.ts --dry-run

# Generate 5 questions instead of default 3
understand src/auth.ts --count 5

# Output as markdown (for CI/PR comments)
understand src/auth.ts --format markdown

# Quiz on recent git changes
understand --git-diff

# View comprehension scores
understand summary
understand summary --below 60

# View understanding debt
understand debt
understand debt --since main
```

## CI Integration

Add comprehension checks to your PRs with GitHub Actions:

```yaml
- name: Generate comprehension questions
  run: npx understand-code --git-diff --count 3 --format markdown
```

See [ci/github-action.yml](ci/github-action.yml) for a complete workflow that posts questions as PR comments.

## Configuration

Set `OPENROUTER_API_KEY` in your environment or `.env` file.

Optional:
- `UNDERSTAND_MODEL` — override the default model (default: `google/gemini-2.0-flash-001`)

## MCP Server

Also works as an MCP server for AI coding agents:

```bash
npx understand-code-mcp
```

### MCP Tools

| Tool | Description |
|------|-------------|
| `understand_quiz` | Generate comprehension questions for code |
| `understand_evaluate` | Evaluate a developer's answer |
| `understand_score` | Get comprehension score history |
| `understand_git_diff` | Generate questions for recent changes |
| `understand_debt` | Show files with understanding debt |

### Client Setup

**VS Code / Cursor / pi:**

```json
{
  "servers": {
    "understand": {
      "command": "npx",
      "args": ["understand-code-mcp"],
      "env": {
        "OPENROUTER_API_KEY": "your-key"
      }
    }
  }
}
```

## Score Tracking

Scores are persisted in `.understand/history.json` in your project root. The debt dashboard tracks which files you've never reviewed, which changed since your last quiz, and which score below threshold.

## Research

- [Shen & Tamkin (2026)](https://arxiv.org/abs/2601.20245) — Anthropic RCT, 52 developers
- [METR (2025)](https://metr.org) — 16 senior developers, million-line codebases
- [Kosmyna et al. (2025)](https://www.media.mit.edu/publications/your-brain-on-chatgpt/) — MIT EEG study, 54 participants
- [Storey (2026)](https://margaretstorey.com/blog/2026/02/09/cognitive-debt/) — ICSE 2026 keynote on cognitive debt

## License

MIT

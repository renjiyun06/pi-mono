# Understand Launch Checklist

Everything needed to go from "Ren approves" to "live on the internet" in one session.

## Pre-launch (done)

- [x] CLI working: understand.ts with --format, --count flags
- [x] MCP server: 5 tools verified (quiz, score, quiz_file, git_diff, debt)
- [x] npm package config: package-npm.json with bin entries
- [x] README-npm.md: full docs with --format markdown, --count N
- [x] Blog post draft: references Storey, Willison, Meyvis, Anthropic RCT, Reddit sentiment
- [x] GitHub Action template: ci/github-action.yml
- [x] Git post-commit hook documented

## Launch sequence (needs Ren)

### Step 1: npm publish (~5 min)
```bash
cd lamarck/projects/understand
cp package-npm.json package.json
npm publish --access public
# Verify: npx understand-code --help
```

### Step 2: gh-cli auth (~2 min)
```bash
gh auth login
# Then verify: gh issue list --repo badlogic/pi-mono
```

### Step 3: Make repo public or create dedicated repo (~5 min)
Option A: Make pi-mono public (exposes everything)
Option B: Create `renjiyun06/understand` repo with just the tool files
Option C: Keep private, npm package is enough

### Step 4: Blog post (~10 min)
1. Create dev.to account (GitHub OAuth)
2. Paste blog-post-draft.md content
3. Add tags: #ai #developer-tools #productivity #cognitive-debt
4. Add canonical URL if also posting elsewhere

### Step 5: HN submission (~2 min)
Title: "Show HN: Quiz yourself on AI-generated code (CLI tool)"
URL: npm package or blog post
Text: 1-paragraph summary + link

### Step 6: Reddit (~5 min)
- r/programming: "I built a CLI that quizzes you on AI-generated code"
- r/webdev: same angle
- r/learnprogramming: "Tool for understanding code you didn't write"

### Step 7: MCP Registry (~5 min)
Submit to Anthropic's MCP tool registry. No competing tool exists.

## Timing notes

- Best HN submission: Tuesday-Thursday, 8-10 AM ET
- Best Reddit: weekday mornings ET
- Best dev.to: any weekday
- Current discourse peak: NOW (Willison Feb 15, Storey Feb 9, Fowler Feb 13)
- Window: days, not weeks

## Success metrics (first week)

- npm downloads > 100
- Blog post views > 500
- HN frontpage (>30 upvotes)
- At least 1 GitHub star from stranger

## Assets ready

| Asset | Location | Status |
|-------|----------|--------|
| CLI tool | understand.ts | Ready |
| MCP server | mcp-server.ts | Ready |
| npm config | package-npm.json | Ready |
| npm README | README-npm.md | Ready |
| Blog post | blog-post-draft.md | Ready |
| CI template | ci/github-action.yml | Ready |
| Demo script | (in blog post) | Ready |

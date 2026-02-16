# understand-mcp

MCP server that quizzes developers on code comprehension. Tests design decisions, failure modes, and architectural understanding — not syntax memorization.

> "When you write code yourself, comprehension comes with the act of creation. When the machine writes it, you'll have to rebuild that comprehension during review. That's verification debt."
> — Werner Vogels, Amazon CTO, re:Invent 2025

## Why

- 96% of developers don't trust AI-generated code
- 48% don't always check before committing
- 38% say reviewing AI code is harder than human code

(Source: Sonar State of Code Developer Survey, 1,100+ developers)

Understand makes the comprehension gap visible. It generates questions about code you're working with and evaluates your answers. If you can't explain what the code does and why, you shouldn't ship it.

## Install

```bash
npm install -g understand-mcp
```

Or use directly:

```bash
npx understand-mcp
```

## Configuration

Set `OPENROUTER_API_KEY` in your environment. The server uses Gemini Flash by default (~$0.04 per quiz session).

Optional: `UNDERSTAND_MODEL` to use a different model.

## MCP Tools

### understand_quiz

Generate comprehension questions for a code file.

**Input**: `code` (string), `filename` (string), `count` (number, default 3)

**Output**: Array of questions with `question`, `key_concepts`, `difficulty`

### understand_evaluate

Evaluate a developer's answer to a comprehension question.

**Input**: `question`, `key_concepts` (string[]), `answer`, `code`, `filename` (optional, for score tracking)

**Output**: `score` (0-10), `feedback`, `missed` concepts

### understand_score

Get comprehension score history for tracked files.

**Input**: `directory` (optional), `threshold` (number, default 6)

**Output**: Per-file scores, average, at-risk files

## Client Setup

### VS Code (MCP extension)

Add to your MCP settings:

```json
{
  "servers": {
    "understand": {
      "command": "npx",
      "args": ["understand-mcp"],
      "env": {
        "OPENROUTER_API_KEY": "your-key"
      }
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "understand": {
      "command": "npx",
      "args": ["understand-mcp"],
      "env": {
        "OPENROUTER_API_KEY": "your-key"
      }
    }
  }
}
```

### mcporter

```json
{
  "servers": {
    "understand": {
      "command": "npx",
      "args": ["tsx", "path/to/mcp-server.ts"],
      "env": {
        "OPENROUTER_API_KEY": "your-key"
      }
    }
  }
}
```

## Score Tracking

Scores are persisted in `.understand/history.json` in your project directory. Use `understand_score` to view trends and identify files where comprehension is low.

## License

MIT

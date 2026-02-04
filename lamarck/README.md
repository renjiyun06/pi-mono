# Lamarck

An experiment in self-growing software.

## Idea

This project is a fork of [pi-mono](https://github.com/badlogic/pi-mono), a minimal coding agent framework. pi has a few key properties:

- **Minimal core**: 4 base tools (read, bash, edit, write), a small system prompt, and a clean agent loop
- **Extension mechanism**: plugins can register new tools, intercept events, persist state, and modify nearly every aspect of the agent's behavior — all via TypeScript files that are hot-reloaded without a build step
- **Self-awareness**: the agent can read its own source code and documentation, understand how extensions work, and write new ones

The experiment: **can the agent grow itself through conversation?**

Rather than a developer manually writing extensions and tools, the agent itself writes them — driven by dialogue with the user. Each conversation may produce new extensions that persist on disk. On the next session, those extensions are loaded, and the agent has new capabilities it didn't have before. Over time, the agent accumulates tools, memory, and behaviors shaped by actual usage.

This is Lamarckian evolution applied to software: acquired traits (new tools, memory, behaviors) are inherited by future sessions.

## What We Want to Observe

- What tools does the agent create for itself?
- What memory mechanisms emerge?
- How does the agent organize its growing capabilities?
- What does a "personal assistant" look like when it's grown rather than designed?
- Where does this approach break down?

## Inspiration

- [Open Co](https://github.com/openco-dev) (formerly Multiple) — a personal agent runtime built on pi's agent core, running 24/7
- The idea that software with built-in cognitive modules and a good extension mechanism might be able to grow organically

## Structure

```
lamarck/
├── README.md           ← this file
├── journal/            ← records of each growth iteration
└── extensions/         ← extensions produced by the agent (symlinked or copied to .pi/extensions/)
```

## Constraints

The agent (LLM) cannot trigger `/reload` or other slash commands by itself. After the agent writes a new extension, the user must run `/reload` for it to take effect. The agent has no autonomous agency — it acts only in response to user prompts. These are deliberate constraints, not bugs.

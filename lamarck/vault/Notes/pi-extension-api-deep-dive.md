---
tags:
  - note
  - pi
  - infra
description: "Deep dive into pi's extension API — events, tools, commands, inter-extension communication"
---

# Pi Extension API Deep Dive

Source: `packages/coding-agent/src/core/extensions/types.ts`

## Key Capabilities

### Events (lifecycle hooks)
- **Session**: `session_start`, `session_compact`, `session_shutdown`, `session_switch`, `session_fork`, `session_tree`
- **Agent loop**: `before_agent_start`, `agent_start`, `agent_end`, `turn_start`, `turn_end`
- **Messages**: `message_start`, `message_update`, `message_end`
- **Tools**: `tool_call` (can block), `tool_result` (can modify), `tool_call_end` (can inject text)
- **Other**: `context` (modify messages before LLM call), `input` (intercept user input), `model_select`, `user_bash`, `resources_discover`

### `before_agent_start` return
Can inject a `CustomMessage` (with `customType`, `content`, `display`). This is how memory-loader adds its restore message.

### `tool_call_end` return
Can inject text into tool results via `{ inject: string }`. Used for context percentage warnings.

### Inter-extension communication
`pi.events` — shared EventBus with `emit(channel, data)` and `on(channel, handler)`. Could be used for autopilot ↔ memory-loader coordination.

### Tools
`pi.registerTool()` — TypeBox schema for params, `execute()` function. Has custom rendering hooks (`renderCall`, `renderResult`).

### Commands
`pi.registerCommand()` — slash commands with autocomplete support. Handler gets `ExtensionCommandContext` which has session control methods (`newSession`, `fork`, `navigateTree`, `switchSession`, `reload`).

### UI
`ctx.ui` provides: `select`, `confirm`, `input`, `notify`, `setStatus`, `setWidget`, `setFooter`, `setHeader`, `custom` (full component rendering), `editor`, `setEditorComponent`, `pasteToEditor`, `setEditorText`, `getEditorText`, themes.

### Provider Registration
`pi.registerProvider()` — register custom LLM providers with models, OAuth, custom stream handlers.

## Useful for Our Extensions

1. **`pi.events`** — could solve autopilot ↔ memory-loader state sharing (e.g., autopilot emits "compact_triggered", memory-loader listens)
2. **`ctx.ui.setStatus()`** — could show autopilot status in footer
3. **`ctx.ui.setWidget()`** — could show project status widget
4. **`input` event** — could intercept and transform user input before agent sees it
5. **`context` event** — could modify messages before every LLM call (e.g., inject reminders)

# QQ Bridge

Connects the Lamarck agent to QQ via NapCatQQ (OneBot 11 protocol).

## Architecture

```
QQ User → QQ Server → NapCatQQ (WebSocket) → Bridge → AgentSession → LLM
                                                ↓
QQ User ← QQ Server ← NapCatQQ (HTTP API)  ← Bridge
```

## Prerequisites

- NapCatQQ running with a QQ account, forward WebSocket enabled
- pi-coding-agent SDK (linked from monorepo)
- API key for LLM provider (e.g. ANTHROPIC_API_KEY)

## Setup

```bash
cd lamarck/bridge/qq
npm install
```

## Configuration

Environment variables or config file (TBD):

- `NAPCAT_WS_URL` — NapCatQQ WebSocket endpoint (default: `ws://localhost:3001`)
- `NAPCAT_TOKEN` — access token if configured in NapCatQQ
- `BRIDGE_CWD` — workspace directory (default: pi-mono root)

## Usage

```bash
npm start
```

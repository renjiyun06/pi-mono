---
tags:
  - note
  - tool
  - infra
description: "How to publish an MCP server to npm and the MCP Registry — packaging, auto-config, discovery"
---

# MCP Server Publishing Guide

Source: Grizzly Peak Software (2026), MCP official docs

## Key Requirements

1. **stdio transport** — clients spawn server as child process. No ports, no network config. Dominates npm distribution.
2. **Two bin entry points**: `cli.js` (installer/setup) and `server.js` (actual MCP process). Shebang required.
3. **package.json `mcp` key** — custom metadata for tools/resources/prompts descriptions
4. **Keywords**: `mcp`, `mcp-server`, `model-context-protocol`, plus domain-specific keywords
5. **Auto-configuration**: CLI command that writes claude_desktop_config.json for the user
6. **MCP Registry**: Metadata-only registry (hosts references, not artifacts). Must publish to npm first.

## Package Structure

```
my-mcp-server/
  bin/cli.js         # installer + setup commands
  bin/server.js      # MCP server entry point
  lib/tools/         # tool implementations
  lib/resources/     # resource implementations  
  lib/prompts/       # prompt implementations
  docs/              # keep in npm package
  package.json
  README.md
```

## Trust Signals (important for adoption)

- Verified npm publisher
- Source code transparency (open source)
- Clear permission documentation
- Community reputation
- MCP servers run with user permissions — security matters

## Distribution Steps

1. Publish to npm: `npm publish`
2. Register with MCP Registry: metadata only (points to npm)
3. Add to community directories (awesome-mcp-servers, etc.)
4. Auto-config CLI: `npx my-mcp-server setup` writes client config

## Relevance to Understand

Our `mcp-server.ts` is already stdio-based. To publish:
- Add shebang to server entry point
- Create CLI wrapper with setup command
- Add `mcp` metadata to package.json
- Publish to npm as `@understand/mcp-server` or `understand-mcp`
- Register with MCP Registry

This is the distribution path when Ren approves the product for release.

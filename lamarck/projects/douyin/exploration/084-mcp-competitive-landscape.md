# 084: MCP Competitive Landscape for Understand

## Search: MCP servers for code comprehension/quiz

### quiz-mcp (karerckor)
- General-purpose quiz UI (SvelteKit + DaisyUI)
- 8 question types, interactive web UI
- NOT code-specific — displays pre-written questions, doesn't generate them
- No code analysis, no comprehension scoring
- **Not a competitor** — infrastructure tool, not a product

### Semantiq (zykairotis)
- Universal MCP server for semantic code understanding
- Gives AI agents better code context (embeddings, local)
- Helps AI understand code → NOT about testing human understanding
- **Not a competitor** — opposite direction (AI comprehension, not human comprehension)

### cerebras-code-mcp
- Code generation with context files
- No comprehension testing
- **Not a competitor**

## Assessment

**Zero competitors** in the "test human code comprehension via MCP" space as of Feb 2026.

The closest thing is the generic quiz-mcp, which could theoretically display code questions — but it requires someone to write the questions manually. Our understand-mcp generates questions FROM the code itself.

This is a genuinely unoccupied niche in an ecosystem with 10,000+ servers and 97M monthly SDK downloads.

## Publishing Priority

If Ren approves:
1. Clean up mcp-server.ts (it's already publish-ready)
2. Use package-npm.json as package.json
3. `npm publish`
4. Submit to MCP registry (modelcontextprotocol/servers)
5. Post on r/ClaudeAI, r/vibecoding, HN

/**
 * Web Search Extension
 *
 * Adds a web_search tool that queries DuckDuckGo via the Python `ddgs` library.
 * Free, no API key required.
 *
 * Prerequisite:
 *   pip install duckduckgo-search
 *
 * Usage:
 *   Symlink or copy this file to .pi/extensions/
 *   The agent can then call web_search({ query: "..." })
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { execFileSync } from "node:child_process";

interface DdgsResult {
	title: string;
	href: string;
	body: string;
}

export default function (pi: ExtensionAPI) {
	// /web_search — toggle web_search tool on/off
	pi.registerCommand("web_search", {
		description: "Toggle web search tool on/off",
		handler: async (_args, ctx) => {
			const active = pi.getActiveTools();
			if (active.includes("web_search")) {
				pi.setActiveTools(active.filter((t) => t !== "web_search"));
				ctx.ui.notify("Web search disabled");
			} else {
				pi.setActiveTools([...active, "web_search"]);
				ctx.ui.notify("Web search enabled");
			}
		},
	});

	pi.registerTool({
		name: "web_search",
		label: "Web Search",
		description:
			"Search the web using DuckDuckGo. Returns titles, URLs, and content snippets. Free, no API key needed. Use this when you need to find information on the internet.",
		parameters: Type.Object({
			query: Type.String({ description: "Search query" }),
			max_results: Type.Optional(
				Type.Number({
					description: "Maximum number of results (default: 5, max: 10)",
					minimum: 1,
					maximum: 10,
				}),
			),
		}),

		async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
			const { query, max_results } = params as { query: string; max_results?: number };
			const limit = max_results ?? 5;

			try {
				const script = `
import json, time
from ddgs import DDGS
time.sleep(1)
results = DDGS().text(${JSON.stringify(query)}, max_results=${limit}, backend="lite")
print(json.dumps(results, ensure_ascii=False))
`;
				const output = execFileSync("python3", ["-c", script], {
					timeout: 20_000,
					encoding: "utf-8",
					stdio: ["pipe", "pipe", "pipe"],
				});

				// Filter out the "Impersonate" warning line
				const jsonLine = output
					.split("\n")
					.find((line) => line.trim().startsWith("["));

				if (!jsonLine) {
					return {
						content: [{ type: "text" as const, text: "DuckDuckGo returned no results. Try a different query or retry." }],
						details: { error: "empty_results" },
					};
				}

				const results: DdgsResult[] = JSON.parse(jsonLine);

				if (results.length === 0) {
					return {
						content: [{ type: "text" as const, text: "No results found. Try a different query." }],
						details: { error: "no_results" },
					};
				}

				const lines: string[] = [`## Results (${results.length})`];
				for (const r of results) {
					lines.push("");
					lines.push(`### ${r.title}`);
					lines.push(`URL: ${r.href}`);
					lines.push("");
					lines.push(r.body);
				}

				return {
					content: [{ type: "text" as const, text: lines.join("\n") }],
					details: { query, resultCount: results.length },
				};
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				return {
					content: [{ type: "text" as const, text: `Web search failed: ${message}` }],
					details: { error: "search_error" },
				};
			}
		},
	});
}

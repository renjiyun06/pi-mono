/**
 * Web Search Extension
 *
 * Adds a web_search tool that queries the Tavily Search API.
 * Tavily is designed for AI agents — returns extracted text summaries
 * rather than raw HTML, keeping token usage low.
 *
 * Setup:
 *   Add TAVILY_API_KEY="tvly-..." to .env in the project root
 *   (or set it as an environment variable)
 *
 * Usage:
 *   Symlink or copy this file to .pi/extensions/
 *   The agent can then call web_search({ query: "..." })
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const TAVILY_API_URL = "https://api.tavily.com/search";

/**
 * Read a key from a .env file. Returns undefined if not found.
 */
function readKeyFromEnvFile(filePath: string, keyName: string): string | undefined {
	try {
		if (!fs.existsSync(filePath)) return undefined;
		const content = fs.readFileSync(filePath, "utf-8");
		for (const line of content.split("\n")) {
			const trimmed = line.trim();
			if (trimmed.startsWith("#") || !trimmed) continue;
			const match = trimmed.match(new RegExp(`^${keyName}\\s*=\\s*"?([^"]*)"?$`));
			if (match) return match[1];
		}
	} catch {
		// ignore read errors
	}
	return undefined;
}

/**
 * Resolve API key. Priority:
 * 1. Environment variable TAVILY_API_KEY
 * 2. .env in current working directory (where pi was started)
 * 3. ~/.env (user home directory)
 */
function resolveApiKey(): string | undefined {
	if (process.env.TAVILY_API_KEY) {
		return process.env.TAVILY_API_KEY;
	}

	// Check .env in cwd (project root)
	const cwdEnv = readKeyFromEnvFile(path.join(process.cwd(), ".env"), "TAVILY_API_KEY");
	if (cwdEnv) return cwdEnv;

	// Check ~/.env as fallback
	const homeDir = process.env.HOME || process.env.USERPROFILE;
	if (homeDir) {
		const homeEnv = readKeyFromEnvFile(path.join(homeDir, ".env"), "TAVILY_API_KEY");
		if (homeEnv) return homeEnv;
	}

	return undefined;
}

interface TavilyResult {
	url: string;
	title: string;
	content: string;
	score: number;
}

interface TavilyResponse {
	query: string;
	results: TavilyResult[];
	answer?: string;
	response_time: number;
}

export default function (pi: ExtensionAPI) {
	// Start inactive — registered but not sent to LLM until explicitly enabled.
	pi.on("session_start", async () => {
		const active = pi.getActiveTools();
		if (active.includes("web_search")) {
			pi.setActiveTools(active.filter((t) => t !== "web_search"));
		}
	});

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
			"Search the web using Tavily Search API. Returns summarized results with titles, URLs, and extracted content. Use this when you need to find information on the internet.",
		parameters: Type.Object({
			query: Type.String({ description: "Search query" }),
			max_results: Type.Optional(Type.Number({ description: "Maximum number of results (default: 5, max: 10)", minimum: 1, maximum: 10 })),
		}),

		async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
			const { query, max_results } = params as { query: string; max_results?: number };
			const apiKey = resolveApiKey();

			if (!apiKey) {
				return {
					content: [
						{
							type: "text" as const,
							text: "Error: TAVILY_API_KEY environment variable is not set. Please set it and /reload.",
						},
					],
					details: { error: "missing_api_key" },
				};
			}

			try {
				const response = await fetch(TAVILY_API_URL, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						api_key: apiKey,
						query,
						max_results: max_results ?? 5,
						include_answer: true,
					}),
					signal: _signal,
				});

				if (!response.ok) {
					const errorText = await response.text();
					return {
						content: [{ type: "text" as const, text: `Tavily API error (${response.status}): ${errorText}` }],
						details: { error: "api_error", status: response.status },
					};
				}

				const data = (await response.json()) as TavilyResponse;
				const lines: string[] = [];

				if (data.answer) {
					lines.push("## Summary", data.answer, "");
				}

				lines.push(`## Results (${data.results.length})`);
				for (const result of data.results) {
					lines.push("");
					lines.push(`### ${result.title}`);
					lines.push(`URL: ${result.url}`);
					lines.push(`Relevance: ${(result.score * 100).toFixed(0)}%`);
					lines.push("");
					lines.push(result.content);
				}

				lines.push("", `(query time: ${data.response_time.toFixed(2)}s)`);

				return {
					content: [{ type: "text" as const, text: lines.join("\n") }],
					details: {
						query,
						resultCount: data.results.length,
						responseTime: data.response_time,
					},
				};
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				return {
					content: [{ type: "text" as const, text: `Web search failed: ${message}` }],
					details: { error: "fetch_error" },
				};
			}
		},
	});
}

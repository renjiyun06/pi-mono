/**
 * Web Search Extension
 *
 * Provides a web_search tool using DuckDuckGo HTML search.
 * No API key needed.
 */

import { Type } from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

interface SearchResult {
	title: string;
	url: string;
	snippet: string;
}

async function searchDuckDuckGo(query: string, maxResults: number): Promise<SearchResult[]> {
	const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
	const response = await fetch(url, {
		headers: {
			"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0",
		},
	});

	if (!response.ok) {
		throw new Error(`DuckDuckGo returned ${response.status}`);
	}

	const html = await response.text();
	const results: SearchResult[] = [];

	// Parse results from DDG HTML response
	// Each result is in a div with class "result"
	const resultBlocks = html.split(/class="result\s/);

	for (let i = 1; i < resultBlocks.length && results.length < maxResults; i++) {
		const block = resultBlocks[i];

		// Extract URL from result__a href
		const urlMatch = block.match(/class="result__a"[^>]*href="([^"]*?)"/);
		if (!urlMatch) continue;

		// DDG wraps URLs in a redirect — extract the actual URL
		let resultUrl = urlMatch[1];
		const uddgMatch = resultUrl.match(/uddg=([^&]*)/);
		if (uddgMatch) {
			resultUrl = decodeURIComponent(uddgMatch[1]);
		}

		// Extract title text
		const titleMatch = block.match(/class="result__a"[^>]*>([\s\S]*?)<\/a>/);
		const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "").trim() : "";

		// Extract snippet
		const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/(?:a|td|div|span)>/);
		const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, "").trim() : "";

		if (title && resultUrl) {
			results.push({ title, url: resultUrl, snippet });
		}
	}

	return results;
}

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "web-search",
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

		async execute(_toolCallId, params) {
			const { query, max_results } = params as { query: string; max_results?: number };
			const maxResults = Math.min(max_results ?? 5, 10);

			try {
				const results = await searchDuckDuckGo(query, maxResults);

				if (results.length === 0) {
					return {
						content: [{ type: "text", text: `No results found for: ${query}` }],
					};
				}

				const formatted = results
					.map((r, i) => `${i + 1}. **${r.title}**\n   URL: ${r.url}\n   ${r.snippet}`)
					.join("\n\n");

				return {
					content: [
						{
							type: "text",
							text: `## Results (${results.length})\n\n${formatted}`,
						},
					],
				};
			} catch (error) {
				const msg = error instanceof Error ? error.message : String(error);
				return {
					content: [{ type: "text", text: `Search failed: ${msg}` }],
					isError: true,
				};
			}
		},
	});
}

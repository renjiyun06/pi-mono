#!/usr/bin/env npx tsx
/**
 * Fetch Zhihu hot list directly via Playwright + Chrome CDP.
 * Much faster and more reliable than agent-driven browser automation.
 *
 * Outputs JSON array: [{rank, title, url, heat}, ...]
 */

import { Command } from "commander";
import { chromium } from "playwright";

const CDP_ENDPOINT = "http://172.30.144.1:19222";
const ZHIHU_HOT_URL = "https://www.zhihu.com/hot";

interface HotItem {
	rank: number;
	title: string;
	url: string;
	heat: string; // e.g. "398 万热度"
}

async function fetchZhihuHot(): Promise<HotItem[]> {
	const browser = await chromium.connectOverCDP(CDP_ENDPOINT);
	const context = browser.contexts()[0];
	const page = await context.newPage();

	try {
		await page.goto(ZHIHU_HOT_URL, { waitUntil: "domcontentloaded" });

		// Wait for hot items to load
		await page.waitForSelector(".HotItem", { timeout: 10000 });

		// Extract hot items
		const items = await page.evaluate(() => {
			const results: { rank: number; title: string; url: string; heat: string }[] = [];
			const hotItems = document.querySelectorAll(".HotItem");

			hotItems.forEach((item, idx) => {
				// Rank is in .HotItem-rank or .HotItem-index
				const rankEl = item.querySelector(".HotItem-rank, .HotItem-index");
				const rank = rankEl ? parseInt(rankEl.textContent?.trim() || `${idx + 1}`, 10) : idx + 1;

				// Title link is in .HotItem-content
				const titleLink = item.querySelector(".HotItem-content a[href*='/question/']") as HTMLAnchorElement | null;
				if (!titleLink) return;

				// Get title from h2 or the link's title attribute
				const h2 = titleLink.querySelector("h2");
				const title = h2?.textContent?.trim() || titleLink.getAttribute("title") || titleLink.textContent?.trim() || "";
				const url = titleLink.href;

				// Heat/metrics - extract just the heat number, not the share button text
				const metricsEl = item.querySelector(".HotItem-metrics");
				let heat = metricsEl?.textContent?.trim() || "";
				// Remove trailing "分享" button text
				heat = heat.replace(/[\u200b\s]*分享$/, "").trim();

				if (title && url) {
					results.push({ rank, title, url, heat });
				}
			});

			return results;
		});

		return items;
	} finally {
		await page.close();
		// Close CDP connection so process can exit
		// Note: this doesn't close the actual browser, just disconnects
		await browser.close();
	}
}

const program = new Command()
	.name("fetch-zhihu-hot")
	.description("Fetch Zhihu hot list via Playwright + Chrome CDP")
	.option("-d, --describe", "Show detailed description")
	.action(async (opts) => {
		if (opts.describe) {
			console.log(`
fetch-zhihu-hot - Zhihu hot list fetcher

PURPOSE:
  Directly scrape Zhihu hot list using Playwright + Chrome CDP.
  Faster and more reliable than agent-driven browser automation.

OUTPUT:
  JSON array to stdout:
  [
    {"rank": 1, "title": "...", "url": "https://...", "heat": "398 万热度"},
    ...
  ]

REQUIREMENTS:
  - Chrome running with remote debugging on ${CDP_ENDPOINT}
  - Logged in to Zhihu (uses existing session)

USAGE:
  npx tsx lamarck/tools/fetch-zhihu-hot.ts
  npx tsx lamarck/tools/fetch-zhihu-hot.ts --describe
`);
			return;
		}

		try {
			const items = await fetchZhihuHot();
			console.log(JSON.stringify(items, null, 2));
		} catch (err) {
			console.error("Failed to fetch Zhihu hot list:", err);
			process.exit(1);
		}
	});

program.parse();

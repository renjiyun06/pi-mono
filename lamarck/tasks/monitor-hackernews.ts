#!/usr/bin/env npx tsx

/**
 * Monitor Hacker News front page
 *
 * Connects to Chrome via CDP, fetches hot posts from HN,
 * and inserts new posts into the inbox table.
 */

import { chromium, type Page } from "playwright";
import { program } from "commander";
import { execSync } from "child_process";

const DB_PATH = "/home/lamarck/pi-mono/lamarck/data/lamarck.db";

interface HNPost {
  id: string;
  title: string;
  url: string;
  hnUrl: string;
  score: number;
  commentCount: number;
  author: string;
  age: string; // e.g., "2 hours ago"
}

async function getCdpWsUrl(): Promise<string> {
  const res = await fetch("http://172.30.144.1:19222/json/version");
  const data = await res.json();
  return data.webSocketDebuggerUrl;
}

async function fetchHotPosts(page: Page): Promise<HNPost[]> {
  const url = "https://news.ycombinator.com/";
  console.log(`[${new Date().toISOString()}] Fetching: ${url}`);

  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });

  // Wait for posts to load
  await page.waitForSelector("tr.athing", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);

  // Extract post data
  // HN structure: each post has two rows:
  // 1. tr.athing - contains title and link
  // 2. next tr - contains score, author, age, comments
  const posts = await page.evaluate(() => {
    const items: HNPost[] = [];
    const rows = document.querySelectorAll("tr.athing");

    rows.forEach((row) => {
      const id = row.getAttribute("id") || "";

      // Title row
      const titleSpan = row.querySelector("span.titleline");
      const titleLink = titleSpan?.querySelector("a");
      const title = titleLink?.textContent?.trim() || "";
      const url = titleLink?.getAttribute("href") || "";

      // Next row contains metadata
      const nextRow = row.nextElementSibling;
      if (!nextRow) return;

      const subtext = nextRow.querySelector("td.subtext");
      if (!subtext) return;

      // Score
      const scoreSpan = subtext.querySelector("span.score");
      const scoreText = scoreSpan?.textContent || "0";
      const score = parseInt(scoreText.replace(/\D/g, ""), 10) || 0;

      // Author
      const authorLink = subtext.querySelector("a.hnuser");
      const author = authorLink?.textContent?.trim() || "";

      // Age
      const ageSpan = subtext.querySelector("span.age");
      const age = ageSpan?.textContent?.trim() || "";

      // Comments - last link in subtext that contains a number
      const links = subtext.querySelectorAll("a");
      let commentCount = 0;
      for (const link of links) {
        const text = link.textContent || "";
        if (text.includes("comment") || /^\d+$/.test(text.trim())) {
          const match = text.match(/(\d+)/);
          if (match) {
            commentCount = parseInt(match[1], 10);
          }
        }
      }

      // HN URL (for comments page)
      const hnUrl = `https://news.ycombinator.com/item?id=${id}`;

      if (id && title) {
        items.push({
          id,
          title,
          url: url.startsWith("http") ? url : `https://news.ycombinator.com/${url}`,
          hnUrl,
          score,
          commentCount,
          author,
          age,
        });
      }
    });

    return items;
  });

  return posts;
}

function getExistingPostIds(): Set<string> {
  try {
    const query = `SELECT content FROM inbox WHERE source = 'hackernews';`;
    const result = execSync(`sqlite3 -json "${DB_PATH}"`, {
      encoding: "utf-8",
      input: query,
    });

    if (!result.trim()) return new Set();

    const rows = JSON.parse(result) as Array<{ content: string }>;
    const ids = new Set<string>();
    for (const row of rows) {
      try {
        const data = JSON.parse(row.content);
        if (data.id) ids.add(data.id);
      } catch {
        // Ignore parse errors
      }
    }
    return ids;
  } catch {
    return new Set();
  }
}

function insertPost(post: HNPost): void {
  const content = JSON.stringify(post);
  const escaped = content.replace(/'/g, "''");
  const sql = `INSERT INTO inbox (source, content) VALUES ('hackernews', '${escaped}');`;

  try {
    execSync(`sqlite3 "${DB_PATH}"`, {
      input: sql,
    });
    console.log(`[${new Date().toISOString()}] Inserted: ${post.title.slice(0, 60)}...`);
  } catch (err) {
    console.error(`Failed to insert post ${post.id}:`, err);
  }
}

async function runMonitor(intervalMinutes: number): Promise<void> {
  console.log("Starting Hacker News monitor");
  console.log(`Interval: ${intervalMinutes} minutes`);
  console.log("---");

  const wsUrl = await getCdpWsUrl();
  console.log(`Connected to Chrome CDP: ${wsUrl.slice(0, 50)}...`);

  const browser = await chromium.connectOverCDP(wsUrl);
  const context = browser.contexts()[0];
  const page = await context.newPage();

  const poll = async () => {
    try {
      const posts = await fetchHotPosts(page);
      console.log(`[${new Date().toISOString()}] Found ${posts.length} posts`);

      const existingIds = getExistingPostIds();
      let newCount = 0;

      for (const post of posts) {
        if (!existingIds.has(post.id)) {
          insertPost(post);
          newCount++;
        }
      }

      console.log(`[${new Date().toISOString()}] New posts: ${newCount}`);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Poll error:`, err);
    }
  };

  // Initial poll
  await poll();

  // Continuous polling
  const intervalMs = intervalMinutes * 60 * 1000;
  setInterval(poll, intervalMs);
  console.log(`\nMonitoring... (next poll in ${intervalMinutes} min)`);
}

// CLI
program
  .name("monitor-hackernews")
  .description("Monitor Hacker News front page and save to inbox")
  .option("-i, --interval <minutes>", "Polling interval in minutes", "60")
  .action(async (options) => {
    const interval = parseInt(options.interval, 10);

    if (isNaN(interval) || interval < 1) {
      console.error("Error: interval must be a positive integer");
      process.exit(1);
    }

    await runMonitor(interval);
  });

program.parse();

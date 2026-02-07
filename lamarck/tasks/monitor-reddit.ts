#!/usr/bin/env npx tsx

/**
 * Monitor Reddit subreddit hot posts
 *
 * Connects to Chrome via CDP, fetches hot posts from a subreddit,
 * and inserts new posts into the inbox table.
 */

import { chromium, type Browser, type Page } from "playwright";
import { program } from "commander";
import { execSync } from "child_process";

const DB_PATH = "/home/lamarck/pi-mono/lamarck/data/lamarck.db";

interface RedditPost {
  id: string;
  title: string;
  permalink: string;
  url: string;
  score: number;
  commentCount: number;
  createdAt: string;
  author: string;
  subreddit: string;
}

async function getCdpWsUrl(): Promise<string> {
  const res = await fetch("http://172.30.144.1:19222/json/version");
  const data = await res.json();
  return data.webSocketDebuggerUrl;
}

async function fetchHotPosts(page: Page, subreddit: string): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/hot/`;
  console.log(`[${new Date().toISOString()}] Fetching: ${url}`);

  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });

  // Wait for posts to load
  await page.waitForSelector("shreddit-post", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000); // Extra time for lazy loading

  // Scroll down multiple times to load more posts
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollBy(0, 1500));
    await page.waitForTimeout(1000);
  }

  // Extract post data from shreddit-post elements
  const posts = await page.locator("shreddit-post").evaluateAll((elements) => {
    return elements.map((el) => ({
      id: el.getAttribute("id") || "",
      title: el.getAttribute("post-title") || "",
      permalink: el.getAttribute("permalink") || "",
      url: el.getAttribute("content-href") || "",
      score: parseInt(el.getAttribute("score") || "0", 10),
      commentCount: parseInt(el.getAttribute("comment-count") || "0", 10),
      createdAt: el.getAttribute("created-timestamp") || "",
      author: el.getAttribute("author") || "",
      subreddit: el.getAttribute("subreddit-name") || "",
    }));
  });

  // Filter out empty/invalid posts
  return posts.filter((p) => p.id && p.title);
}

function getExistingPostIds(subreddit: string): Set<string> {
  try {
    // Query inbox for existing reddit posts from this subreddit
    const query = `SELECT content FROM inbox WHERE source = 'reddit' AND content LIKE '%"subreddit":"${subreddit}"%';`;
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

function insertPost(post: RedditPost): void {
  const content = JSON.stringify(post);
  // Escape single quotes for SQL
  const escaped = content.replace(/'/g, "''");
  const sql = `INSERT INTO inbox (source, content) VALUES ('reddit', '${escaped}');`;

  try {
    // Use stdin to avoid shell escaping issues
    execSync(`sqlite3 "${DB_PATH}"`, {
      input: sql,
    });
    console.log(`[${new Date().toISOString()}] Inserted: ${post.title.slice(0, 60)}...`);
  } catch (err) {
    console.error(`Failed to insert post ${post.id}:`, err);
  }
}

async function runMonitor(subreddit: string, intervalMinutes: number): Promise<void> {
  console.log(`Starting Reddit monitor for r/${subreddit}`);
  console.log(`Interval: ${intervalMinutes} minutes`);
  console.log("---");

  const wsUrl = await getCdpWsUrl();
  console.log(`Connected to Chrome CDP: ${wsUrl.slice(0, 50)}...`);

  const browser = await chromium.connectOverCDP(wsUrl);
  const context = browser.contexts()[0];
  const page = await context.newPage();

  const poll = async () => {
    try {
      const posts = await fetchHotPosts(page, subreddit);
      console.log(`[${new Date().toISOString()}] Found ${posts.length} posts`);

      const existingIds = getExistingPostIds(subreddit);
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
  .name("monitor-reddit")
  .description("Monitor Reddit subreddit hot posts and save to inbox")
  .option("-s, --subreddit <name>", "Subreddit to monitor", "sideproject")
  .option("-i, --interval <minutes>", "Polling interval in minutes", "30")
  .action(async (options) => {
    const subreddit = options.subreddit;
    const interval = parseInt(options.interval, 10);

    if (isNaN(interval) || interval < 1) {
      console.error("Error: interval must be a positive integer");
      process.exit(1);
    }

    await runMonitor(subreddit, interval);
  });

program.parse();

#!/usr/bin/env npx tsx
/**
 * Monitor Twitter/X accounts for new tweets
 * Uses mcporter to control Chrome, shares browser with other agents safely
 */

import { program } from "commander";
import { execSync } from "child_process";

const DB_PATH = "/home/lamarck/pi-mono/lamarck/data/lamarck.db";

interface TweetInfo {
  tweetId: string;
  username: string;
  displayName: string;
  content: string;
  postedAt: string;
  replies: number;
  reposts: number;
  likes: number;
  views: number;
  url: string;
}

function getAccountsFromDb(): string[] {
  try {
    const result = execSync(
      `sqlite3 "${DB_PATH}" "SELECT username FROM twitter_accounts WHERE active = 1"`,
      { encoding: "utf-8" }
    );
    const accounts: string[] = [];
    result.split("\n").forEach((line) => {
      const username = line.trim();
      if (username) accounts.push(username);
    });
    if (accounts.length === 0) {
      throw new Error("No active accounts in twitter_accounts table");
    }
    return accounts;
  } catch (err) {
    throw new Error(`Failed to get accounts: ${err}`);
  }
}

// mcporter helpers
function mcporterCall(tool: string, args: Record<string, string | number | boolean>): string {
  // Build args, using single quotes for string values to avoid escaping issues
  const argParts: string[] = [];
  for (const [k, v] of Object.entries(args)) {
    if (typeof v === "string") {
      // Use single quotes and escape any single quotes in the value
      const escaped = v.replace(/'/g, "'\\''");
      argParts.push(`${k}='${escaped}'`);
    } else {
      argParts.push(`${k}=${v}`);
    }
  }
  
  const cmd = `mcporter call chrome-devtools.${tool} ${argParts.join(" ")}`;
  
  try {
    return execSync(cmd, {
      encoding: "utf-8",
      timeout: 60000,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`mcporter ${tool} failed: ${errMsg}`);
  }
}

function openPage(url: string): number {
  const result = mcporterCall("new_page", { url, timeout: 30000 });
  // Parse pageId from the [selected] line, e.g., "38: https://x.com/... [selected]"
  const match = result.match(/(\d+):.*\[selected\]/);
  if (!match) {
    throw new Error(`Failed to parse pageId from: ${result}`);
  }
  return parseInt(match[1], 10);
}

function selectPage(pageId: number): void {
  mcporterCall("select_page", { pageId });
}

function closePage(pageId: number): void {
  try {
    mcporterCall("close_page", { pageId });
  } catch {
    // Ignore errors when closing (page might already be closed)
  }
}

function evaluateScript(jsCode: string): unknown {
  // Write JS to temp file to avoid shell escaping issues
  const tmpFile = `/tmp/mcporter-eval-${Date.now()}.js`;
  execSync(`cat > ${tmpFile}`, { input: jsCode });
  
  try {
    const result = mcporterCall("evaluate_script", { function: `eval(require('fs').readFileSync('${tmpFile}', 'utf-8'))` });
    // mcporter returns markdown, extract the JSON part
    const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    // Try parsing directly
    const lines = result.split("\n").filter(l => l.trim() && !l.startsWith("#"));
    if (lines.length > 0) {
      try {
        return JSON.parse(lines.join("\n"));
      } catch {
        return result;
      }
    }
    return result;
  } finally {
    execSync(`rm -f ${tmpFile}`);
  }
}

// Evaluate JS in page using base64 encoding to avoid shell escaping issues
function evalInPage(jsFunction: string): unknown {
  // Encode the JS function as base64 to avoid any shell escaping issues
  const encoded = Buffer.from(jsFunction).toString("base64");
  // The wrapper decodes and evals the function, then calls it
  const wrapper = `() => { const fn = eval(atob("${encoded}")); return fn(); }`;
  
  const result = mcporterCall("evaluate_script", { function: wrapper });
  
  // mcporter returns format:
  // # evaluate_script response
  // Script ran on page and returned:
  // ```json
  // <value>
  // ```
  const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    const jsonStr = jsonMatch[1].trim();
    // Handle undefined return values (e.g., from window.scrollBy)
    if (jsonStr === "undefined" || jsonStr === "") {
      return undefined;
    }
    return JSON.parse(jsonStr);
  }
  
  // Fallback: try to find any JSON-like content
  const lines = result.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("Script") && !trimmed.startsWith("```")) {
      if (trimmed === "undefined") {
        return undefined;
      }
      try {
        return JSON.parse(trimmed);
      } catch {
        continue;
      }
    }
  }
  
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForTweets(pageId: number, timeout: number = 30000): Promise<boolean> {
  selectPage(pageId);
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    const found = evalInPage(`() => document.querySelector('article[data-testid="tweet"]') !== null`);
    if (found === true) {
      return true;
    }
    await sleep(1000);
  }
  return false;
}

async function scrollPage(pageId: number, count: number = 2): Promise<void> {
  selectPage(pageId);
  for (let i = 0; i < count; i++) {
    evalInPage(`() => window.scrollBy(0, window.innerHeight)`);
    await sleep(1500);
  }
  evalInPage(`() => window.scrollTo(0, 0)`);
}

function extractTweetsFromPage(pageId: number): TweetInfo[] {
  selectPage(pageId);
  
  const extractCode = `() => {
    const tweets = [];
    const articles = document.querySelectorAll('article[data-testid="tweet"]');

    articles.forEach((article) => {
      try {
        const timeLink = article.querySelector('a[href*="/status/"]');
        if (!timeLink) return;

        const hrefMatch = timeLink.href.match(/\\/([^/]+)\\/status\\/(\\d+)/);
        if (!hrefMatch) return;

        const username = hrefMatch[1];
        const tweetId = hrefMatch[2];

        const retweetIndicator = article.querySelector('[data-testid="socialContext"]');
        if (retweetIndicator?.textContent?.includes("reposted")) return;

        const displayNameEl = article.querySelector('[data-testid="User-Name"] a span');
        const displayName = displayNameEl?.textContent || username;

        const contentEl = article.querySelector('[data-testid="tweetText"]');
        const content = contentEl?.textContent || "";

        const timeEl = article.querySelector("time");
        const postedAt = timeEl?.getAttribute("datetime") || "";

        const replyBtn = article.querySelector('[data-testid="reply"]');
        const repostBtn = article.querySelector('[data-testid="retweet"]');
        const likeBtn = article.querySelector('[data-testid="like"]');
        const viewsEl = article.querySelector('a[href*="/analytics"]');

        const replies = parseInt(replyBtn?.getAttribute("aria-label")?.match(/\\d+/)?.[0] || "0", 10);
        const reposts = parseInt(repostBtn?.getAttribute("aria-label")?.match(/\\d+/)?.[0] || "0", 10);
        const likes = parseInt(likeBtn?.getAttribute("aria-label")?.match(/\\d+/)?.[0] || "0", 10);

        let views = 0;
        const viewsText = viewsEl?.textContent || "";
        const viewsMatch = viewsText.match(/([\\d.]+)([KM])?/i);
        if (viewsMatch) {
          views = parseFloat(viewsMatch[1]);
          if (viewsMatch[2]?.toUpperCase() === "K") views *= 1000;
          if (viewsMatch[2]?.toUpperCase() === "M") views *= 1000000;
          views = Math.round(views);
        }

        tweets.push({
          tweetId,
          username,
          displayName,
          content: content.slice(0, 1000),
          postedAt,
          replies,
          reposts,
          likes,
          views,
          url: "https://x.com/" + username + "/status/" + tweetId,
        });
      } catch {
        // Skip malformed tweets
      }
    });

    return tweets;
  }`;
  
  const result = evalInPage(extractCode);
  if (Array.isArray(result)) {
    return result as TweetInfo[];
  }
  return [];
}

function getKnownTweetIds(username: string): Set<string> {
  const source = `twitter:${username}`;
  try {
    const result = execSync(
      `sqlite3 "${DB_PATH}" "SELECT content FROM inbox WHERE source = '${source}'"`,
      { encoding: "utf-8" }
    );
    const ids = new Set<string>();
    result.split("\n").forEach((line) => {
      try {
        const data = JSON.parse(line);
        if (data.tweetId) ids.add(data.tweetId);
      } catch {
        // ignore parse errors
      }
    });
    return ids;
  } catch {
    return new Set();
  }
}

function insertToInbox(tweet: TweetInfo): void {
  const source = `twitter:${tweet.username}`;
  const content = JSON.stringify(tweet).replace(/'/g, "''");
  const sql = `INSERT INTO inbox (source, content) VALUES ('${source}', '${content}');`;
  execSync(`sqlite3 "${DB_PATH}"`, { input: sql });
  const preview = tweet.content.slice(0, 60).replace(/\n/g, " ");
  console.log(
    `[${new Date().toISOString()}] [@${tweet.username}] New tweet: ${preview}...`
  );
}

async function checkAccountForNewTweets(
  username: string,
  knownIdsCache: Map<string, Set<string>>
): Promise<number> {
  const profileUrl = `https://x.com/${username}`;

  // Get or create known IDs set for this account
  let knownIds = knownIdsCache.get(username);
  if (!knownIds) {
    knownIds = getKnownTweetIds(username);
    knownIdsCache.set(username, knownIds);
  }

  let newCount = 0;
  let pageId: number | null = null;

  try {
    // Open page
    pageId = openPage(profileUrl);
    
    // Wait for tweets to load
    const loaded = await waitForTweets(pageId, 30000);
    if (!loaded) {
      console.error(`[${new Date().toISOString()}] [@${username}] Timeout waiting for tweets`);
      return 0;
    }
    
    await sleep(2000);

    // Scroll to load more tweets
    await scrollPage(pageId, 2);

    // Extract tweets
    const tweets = extractTweetsFromPage(pageId);
    console.log(
      `[${new Date().toISOString()}] [@${username}] Found ${tweets.length} tweets`
    );

    for (const tweet of tweets) {
      // Only track tweets from this user
      if (tweet.username.toLowerCase() !== username.toLowerCase()) continue;

      if (!knownIds.has(tweet.tweetId)) {
        insertToInbox(tweet);
        knownIds.add(tweet.tweetId);
        newCount++;
      }
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(
      `[${new Date().toISOString()}] [@${username}] Error: ${errMsg}`
    );
  } finally {
    // Always close the page
    if (pageId !== null) {
      closePage(pageId);
    }
  }

  return newCount;
}

async function monitorAllAccounts(
  accountDelay: number,
  knownIdsCache: Map<string, Set<string>>
): Promise<void> {
  const accounts = getAccountsFromDb();
  console.log(
    `[${new Date().toISOString()}] Monitoring ${accounts.length} accounts...`
  );

  let totalNew = 0;
  for (let i = 0; i < accounts.length; i++) {
    const username = accounts[i];
    const newCount = await checkAccountForNewTweets(username, knownIdsCache);
    totalNew += newCount;

    // Delay between accounts (except after the last one)
    if (i < accounts.length - 1) {
      await sleep(accountDelay);
    }
  }

  console.log(
    `[${new Date().toISOString()}] Cycle complete. ${totalNew} new tweets found.`
  );
}

// Detailed description for --describe
const DESCRIPTION = `
Monitor Twitter/X Accounts (推特账号监控)

目的：
  监控 AI 领域 KOL 的新推文，获取一手资讯

数据源：
  - 表: twitter_accounts (username TEXT, active INTEGER)
  - 从数据库读取要监控的账号列表

采集内容：
  - 推文 ID、内容、发布时间
  - 点赞、转发、回复、浏览数
  - 推文链接

存储位置：
  - ${DB_PATH} → inbox 表
  - source: "twitter:<用户名>"

运行参数：
  --interval <seconds>   轮询间隔（默认 1800 秒 = 30 分钟）
  --delay <seconds>      账号间延迟（默认 5 秒）
  --once                 只运行一次，不循环
  --describe             显示此详细描述

技术实现：
  - 使用 mcporter 控制浏览器，与其他 agent 共享浏览器
  - 每个账号独立开关页面，互不干扰

注意事项：
  - 需要浏览器已登录 Twitter
  - 需要 mcporter 和 chrome-devtools MCP server 运行
  - 过于频繁的请求可能触发风控
`.trim();

async function main(): Promise<void> {
  program
    .name("monitor-twitter")
    .description("Monitor Twitter/X accounts for new tweets")
    .option("-i, --interval <seconds>", "Polling interval in seconds", "1800")
    .option("-y, --delay <seconds>", "Delay between accounts in seconds", "5")
    .option("-o, --once", "Run once and exit")
    .option("-d, --describe", "Show detailed description")
    .parse();

  const opts = program.opts();

  if (opts.describe) {
    console.log(DESCRIPTION);
    process.exit(0);
  }

  const interval = parseInt(opts.interval, 10) * 1000;
  const accountDelay = parseInt(opts.delay, 10) * 1000;

  const accounts = getAccountsFromDb();
  console.log(`Starting Twitter monitor (mcporter mode):`);
  console.log(`  - Accounts: ${accounts.length} (${accounts.slice(0, 3).map((a) => "@" + a).join(", ")}...)`);
  console.log(`  - Polling interval: ${opts.interval}s`);
  console.log(`  - Account delay: ${opts.delay}s`);

  // Cache known tweet IDs per account
  const knownIdsCache = new Map<string, Set<string>>();

  // Initial check
  await monitorAllAccounts(accountDelay, knownIdsCache);

  if (opts.once) {
    process.exit(0);
  }

  // Polling loop
  while (true) {
    await sleep(interval);
    try {
      await monitorAllAccounts(accountDelay, knownIdsCache);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Error in polling loop:`, err);
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

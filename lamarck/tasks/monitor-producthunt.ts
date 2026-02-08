#!/usr/bin/env npx tsx

/**
 * Monitor Product Hunt daily products via RSS feed
 *
 * Fetches products from Product Hunt's Atom feed and inserts new ones into the inbox table.
 * Uses RSS instead of browser automation to avoid Cloudflare Turnstile verification.
 *
 * Note: RSS feed does not provide vote/comment counts.
 */

import { program } from "commander";
import { execSync } from "child_process";

const DB_PATH = "/home/lamarck/pi-mono/lamarck/data/lamarck.db";
const FEED_URL = "https://www.producthunt.com/feed";

interface ProductHuntProduct {
  id: string;
  name: string;
  tagline: string;
  url: string;
  author: string;
  publishedAt: string;
}

/**
 * Parse Atom XML feed and extract products
 */
function parseAtomFeed(xml: string): ProductHuntProduct[] {
  const products: ProductHuntProduct[] = [];

  // Match each entry
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];

    // Extract id (e.g., "tag:www.producthunt.com,2005:Post/1069841")
    const idMatch = entry.match(/<id>tag:www\.producthunt\.com,2005:Post\/(\d+)<\/id>/);
    const id = idMatch ? idMatch[1] : "";

    // Extract title
    const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
    const name = titleMatch ? titleMatch[1].trim() : "";

    // Extract link
    const linkMatch = entry.match(/<link[^>]*href="([^"]+)"[^>]*\/>/);
    const url = linkMatch ? linkMatch[1] : "";

    // Extract tagline from content (first <p> tag)
    const contentMatch = entry.match(/<content[^>]*>([\s\S]*?)<\/content>/);
    let tagline = "";
    if (contentMatch) {
      // Decode HTML entities and extract first paragraph
      const content = contentMatch[1]
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"');
      const taglineMatch = content.match(/<p>\s*([\s\S]*?)\s*<\/p>/);
      if (taglineMatch) {
        tagline = taglineMatch[1].trim();
      }
    }

    // Extract author
    const authorMatch = entry.match(/<author>\s*<name>([^<]+)<\/name>\s*<\/author>/);
    const author = authorMatch ? authorMatch[1].trim() : "";

    // Extract published date
    const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
    const publishedAt = publishedMatch ? publishedMatch[1] : "";

    if (id && name) {
      products.push({
        id,
        name,
        tagline,
        url,
        author,
        publishedAt,
      });
    }
  }

  return products;
}

async function fetchProducts(): Promise<ProductHuntProduct[]> {
  console.log(`[${new Date().toISOString()}] Fetching RSS: ${FEED_URL}`);

  const response = await fetch(FEED_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ProductHuntMonitor/1.0)",
      Accept: "application/atom+xml, application/xml, text/xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch RSS: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  return parseAtomFeed(xml);
}

function getExistingProductIds(): Set<string> {
  try {
    const query = `SELECT content FROM inbox WHERE source = 'producthunt';`;
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

function insertProduct(product: ProductHuntProduct): void {
  const content = JSON.stringify(product);
  const escaped = content.replace(/'/g, "''");
  const sql = `INSERT INTO inbox (source, content) VALUES ('producthunt', '${escaped}');`;

  try {
    execSync(`sqlite3 "${DB_PATH}"`, {
      input: sql,
    });
    console.log(`[${new Date().toISOString()}] Inserted: ${product.name}`);
  } catch (err) {
    console.error(`Failed to insert product ${product.id}:`, err);
  }
}

async function runMonitor(intervalMinutes: number): Promise<void> {
  console.log("Starting Product Hunt monitor (RSS mode)");
  console.log(`Interval: ${intervalMinutes} minutes`);
  console.log("---");

  const poll = async () => {
    try {
      const products = await fetchProducts();
      console.log(`[${new Date().toISOString()}] Found ${products.length} products in feed`);

      const existingIds = getExistingProductIds();
      let newCount = 0;

      for (const product of products) {
        if (!existingIds.has(product.id)) {
          insertProduct(product);
          newCount++;
        }
      }

      console.log(`[${new Date().toISOString()}] New products: ${newCount}`);
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
  .name("monitor-producthunt")
  .description("Monitor Product Hunt products via RSS feed and save to inbox")
  .option("-i, --interval <minutes>", "Polling interval in minutes", "120")
  .option("--once", "Run once and exit (no continuous polling)")
  .action(async (options) => {
    const interval = parseInt(options.interval, 10);

    if (isNaN(interval) || interval < 1) {
      console.error("Error: interval must be a positive integer");
      process.exit(1);
    }

    if (options.once) {
      // One-shot mode
      console.log("Running once (--once mode)");
      try {
        const products = await fetchProducts();
        console.log(`Found ${products.length} products in feed`);

        const existingIds = getExistingProductIds();
        let newCount = 0;

        for (const product of products) {
          if (!existingIds.has(product.id)) {
            insertProduct(product);
            newCount++;
          }
        }

        console.log(`New products inserted: ${newCount}`);
      } catch (err) {
        console.error("Error:", err);
        process.exit(1);
      }
    } else {
      await runMonitor(interval);
    }
  });

program.parse();

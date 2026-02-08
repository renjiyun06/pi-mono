#!/usr/bin/env npx tsx
/**
 * Fetch latest videos from Douyin user page
 * Uses Chrome CDP to connect to existing browser
 */

import puppeteer from "puppeteer-core";

interface VideoInfo {
  id: string;
  title: string;
  url: string;
}

const CDP_URL = "http://172.30.144.1:19222";

async function fetchLatestVideos(userUrl: string): Promise<VideoInfo[]> {
  // Connect to existing Chrome
  const browser = await puppeteer.connect({
    browserURL: CDP_URL,
  });

  // Open new page
  const page = await browser.newPage();

  try {
    await page.goto(userUrl, { waitUntil: "networkidle2", timeout: 30000 });

    // Wait for video list to load
    await page.waitForSelector('[class*="user-post"]', { timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000)); // Extra wait for dynamic content

    // Extract video info from the page
    const videos = await page.evaluate(() => {
      const results: Array<{ id: string; title: string; url: string }> = [];

      // Find video links - Douyin uses various class names
      const videoLinks = document.querySelectorAll('a[href*="/video/"]');

      videoLinks.forEach((link) => {
        const href = (link as HTMLAnchorElement).href;
        const match = href.match(/\/video\/(\d+)/);
        if (match) {
          const id = match[1];
          // Avoid duplicates
          if (!results.find(v => v.id === id)) {
            // Try to get title from various possible elements
            const titleEl = link.querySelector('[class*="title"]') ||
                           link.querySelector('p') ||
                           link.querySelector('span');
            const title = titleEl?.textContent?.trim() || `Video ${id}`;
            results.push({
              id,
              title,
              url: `https://www.douyin.com/video/${id}`,
            });
          }
        }
      });

      return results;
    });

    return videos.slice(0, 5); // Return first 5 videos
  } finally {
    await page.close();
  }
}

async function main() {
  const userUrl = process.argv[2];
  if (!userUrl) {
    console.error("Usage: fetch-douyin-videos.ts <user_url>");
    process.exit(1);
  }

  try {
    const videos = await fetchLatestVideos(userUrl);
    console.log(JSON.stringify(videos, null, 2));
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();

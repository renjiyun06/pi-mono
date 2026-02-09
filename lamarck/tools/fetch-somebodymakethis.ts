#!/usr/bin/env npx tsx
/**
 * Fetch ideas from somebodymakethis.org
 * Returns a JSON list of app/product ideas curated from Reddit
 * Supports pagination, search, and category filtering
 */

import { execSync } from "child_process";

interface Idea {
  title: string;
  category: string;
  description: string;
  claps: number;
  url: string;
}

interface FetchOptions {
  page?: number;
  search?: string;
  category?: string;
}

const CATEGORIES = [
  "AI and social media",
  "AI Product", 
  "App Ideas",
  "Bot",
  "Extension",
  "Other",
  "Physical Product",
  "SaaS",
  "Service",
  "Software",
  "WebApp",
  "Website",
];

function mcporterCall(tool: string, args: Record<string, string | number | boolean>): string {
  const argParts: string[] = [];
  for (const [k, v] of Object.entries(args)) {
    if (typeof v === "string") {
      const escaped = v.replace(/'/g, "'\\''");
      argParts.push(`${k}='${escaped}'`);
    } else {
      argParts.push(`${k}=${v}`);
    }
  }
  const cmd = `mcporter call chrome-devtools.${tool} ${argParts.join(" ")}`;
  return execSync(cmd, { encoding: "utf-8", timeout: 60000 });
}

function evalInPage(jsFunction: string): unknown {
  const encoded = Buffer.from(jsFunction).toString("base64");
  const wrapper = `() => { const fn = eval(atob("${encoded}")); return fn(); }`;
  const result = mcporterCall("evaluate_script", { function: wrapper });
  
  const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    const jsonStr = jsonMatch[1].trim();
    if (jsonStr === "undefined" || jsonStr === "") {
      return undefined;
    }
    return JSON.parse(jsonStr);
  }
  return null;
}

function openPage(url: string): number {
  const result = mcporterCall("new_page", { url, timeout: 30000 });
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
    // Ignore
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForContent(pageId: number, timeout: number = 30000): Promise<boolean> {
  selectPage(pageId);
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    // Check for either article elements or h2 headings (search page uses different structure)
    const found = evalInPage(`() => document.querySelectorAll('article, h2').length > 2`);
    if (found === true) {
      return true;
    }
    await sleep(1000);
  }
  return false;
}

function clickNextPage(pageId: number): boolean {
  selectPage(pageId);
  const clicked = evalInPage(`() => {
    const nextBtn = document.querySelector('button:not([disabled])');
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent?.includes('Next') && !btn.disabled) {
        btn.click();
        return true;
      }
    }
    return false;
  }`);
  return clicked === true;
}

function extractIdeasFromHomepage(pageId: number): Idea[] {
  selectPage(pageId);
  
  const extractCode = `() => {
    const ideas = [];
    const articles = document.querySelectorAll('article');
    
    articles.forEach((article) => {
      try {
        const titleEl = article.querySelector('h2');
        const title = titleEl?.textContent?.trim() || '';
        
        const linkEl = article.querySelector('a[href*="/ideas/"]');
        const url = linkEl?.href || '';
        
        // Get description - look for the longest text block
        let description = '';
        const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
        let node;
        while (node = walker.nextNode()) {
          const text = node.textContent?.trim() || '';
          if (text.length > description.length && text.length > 50 && text !== title) {
            description = text;
          }
        }
        
        // Claps
        let claps = 0;
        const allText = article.textContent || '';
        const clapMatch = allText.match(/(\\d+)\\s*(?:claps?|Full Details)/i);
        if (clapMatch) {
          claps = parseInt(clapMatch[1], 10);
        }
        
        // Category
        let category = 'UNKNOWN';
        const categoryPatterns = ['EXTENSION', 'APP IDEAS', 'AI AND SOCIAL MEDIA', 'AI PRODUCT', 'SAAS', 'SOFTWARE', 'WEBAPP', 'WEBSITE', 'BOT', 'SERVICE', 'PHYSICAL PRODUCT', 'OTHER'];
        for (const cat of categoryPatterns) {
          if (allText.toUpperCase().includes(cat)) {
            category = cat;
            break;
          }
        }
        
        if (title && url) {
          ideas.push({
            title,
            category,
            description: description.slice(0, 500),
            claps,
            url
          });
        }
      } catch {}
    });
    
    return ideas;
  }`;
  
  const result = evalInPage(extractCode);
  return Array.isArray(result) ? result as Idea[] : [];
}

function extractIdeasFromSearch(pageId: number): Idea[] {
  selectPage(pageId);
  
  const extractCode = `() => {
    const ideas = [];
    const headings = document.querySelectorAll('h2');
    
    headings.forEach((h2) => {
      try {
        const title = h2.textContent?.trim() || '';
        if (!title || title === 'Search Ideas') return;
        
        // Find the container (parent elements)
        let container = h2.parentElement;
        while (container && !container.querySelector('a[href*="/ideas/"]')) {
          container = container.parentElement;
        }
        if (!container) return;
        
        const linkEl = container.querySelector('a[href*="/ideas/"]');
        const url = linkEl?.href || '';
        
        // Description - text after heading
        let description = '';
        let sibling = h2.nextElementSibling;
        while (sibling) {
          const text = sibling.textContent?.trim() || '';
          if (text.length > 50 && !text.includes('claps') && !text.includes('Open')) {
            description = text;
            break;
          }
          sibling = sibling.nextElementSibling;
        }
        
        // Claps - look for number before "claps"
        const containerText = container.textContent || '';
        const clapMatch = containerText.match(/(\\d+)\\s*claps?/i);
        const claps = clapMatch ? parseInt(clapMatch[1], 10) : 0;
        
        // Category
        let category = 'UNKNOWN';
        const catLink = container.querySelector('a[href*="cat="]');
        if (catLink) {
          category = catLink.textContent?.trim().toUpperCase() || 'UNKNOWN';
        }
        
        if (title && url) {
          ideas.push({
            title,
            category,
            description: description.slice(0, 500),
            claps,
            url
          });
        }
      } catch {}
    });
    
    return ideas;
  }`;
  
  const result = evalInPage(extractCode);
  return Array.isArray(result) ? result as Idea[] : [];
}

async function fetchIdeas(options: FetchOptions = {}): Promise<Idea[]> {
  const { page = 1, search, category } = options;
  let pageId: number | null = null;
  
  try {
    // Build URL
    let url: string;
    if (search || category) {
      // Use search page
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (category) params.set("cat", category);
      url = `https://somebodymakethis.org/search?${params.toString()}`;
    } else {
      url = "https://somebodymakethis.org";
    }
    
    console.error(`Opening ${url}...`);
    pageId = openPage(url);
    
    console.error("Waiting for content to load...");
    const loaded = await waitForContent(pageId, 30000);
    if (!loaded) {
      throw new Error("Timeout waiting for content");
    }
    
    await sleep(2000);
    
    // Navigate to requested page (for homepage pagination)
    if (!search && !category && page > 1) {
      console.error(`Navigating to page ${page}...`);
      for (let i = 1; i < page; i++) {
        const clicked = clickNextPage(pageId);
        if (!clicked) {
          console.error(`Could not navigate to page ${page}, stopped at page ${i}`);
          break;
        }
        await sleep(2000);
      }
    }
    
    console.error("Extracting ideas...");
    let ideas: Idea[];
    if (search || category) {
      ideas = extractIdeasFromSearch(pageId);
    } else {
      ideas = extractIdeasFromHomepage(pageId);
    }
    
    console.error(`Found ${ideas.length} ideas`);
    return ideas;
    
  } finally {
    if (pageId !== null) {
      closePage(pageId);
    }
  }
}

// CLI
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: fetch-somebodymakethis.ts [options]

Fetch curated app ideas from somebodymakethis.org

Options:
  --help, -h              Show this help
  --describe              Show detailed description
  --page <n>              Page number (default: 1, homepage only)
  --search <query>        Search keyword
  --category <cat>        Filter by category

Categories:
  ${CATEGORIES.join(", ")}

Examples:
  fetch-somebodymakethis.ts                      # First page
  fetch-somebodymakethis.ts --page 2             # Second page
  fetch-somebodymakethis.ts --category Extension # Filter by category
  fetch-somebodymakethis.ts --search "AI"        # Search for AI

Output:
  JSON array of ideas to stdout
  Progress messages to stderr`);
  process.exit(0);
}

if (args.includes("--describe")) {
  console.log(`Fetch SomebodyMakeThis Ideas (Reddit 需求帖抓取)

目的：
  从 somebodymakethis.org 获取整理好的 Reddit 需求帖

数据源：
  somebodymakethis.org - 一个聚合 r/SomebodyMakeThis 帖子的网站

返回内容：
  JSON 数组，每个元素包含：
  - title: 需求标题
  - category: 分类（Extension, App Ideas, SaaS 等）
  - description: 需求描述（截断到 500 字符）
  - claps: 点赞数
  - url: 详情链接

支持功能：
  - 分页：--page <n>
  - 搜索：--search <query>
  - 分类筛选：--category <cat>

可用分类：
  ${CATEGORIES.join(", ")}

使用示例：
  npx tsx fetch-somebodymakethis.ts
  npx tsx fetch-somebodymakethis.ts --category "AI Product"
  npx tsx fetch-somebodymakethis.ts --search "chrome extension"
  npx tsx fetch-somebodymakethis.ts | jq '.[] | select(.claps > 5)'

技术实现：
  使用 mcporter 控制浏览器渲染页面，然后提取内容`);
  process.exit(0);
}

// Parse options
const options: FetchOptions = {};

const pageIdx = args.indexOf("--page");
if (pageIdx !== -1 && args[pageIdx + 1]) {
  options.page = parseInt(args[pageIdx + 1], 10);
}

const searchIdx = args.indexOf("--search");
if (searchIdx !== -1 && args[searchIdx + 1]) {
  options.search = args[searchIdx + 1];
}

const catIdx = args.indexOf("--category");
if (catIdx !== -1 && args[catIdx + 1]) {
  options.category = args[catIdx + 1];
}

// Main
fetchIdeas(options)
  .then((ideas) => {
    console.log(JSON.stringify(ideas, null, 2));
  })
  .catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });

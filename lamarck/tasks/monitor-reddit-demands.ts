#!/usr/bin/env npx tsx
/**
 * Monitor Reddit for demand signals
 * Uses pi agent in non-interactive mode to search Reddit and extract valuable posts
 */

import { execSync } from "child_process";
import { program } from "commander";

const PI_PATH = "/home/lamarck/pi-mono/pi-test.sh";
const WORK_DIR = "/home/lamarck/pi-mono";
const DB_PATH = "/home/lamarck/pi-mono/lamarck/data/lamarck.db";

interface SearchTask {
  keyword: string;
  subreddit: string;
  description: string;
}

// 每个任务搜索一个 subreddit，更精准
const SEARCH_TASKS: SearchTask[] = [
  // 付费意愿类
  { keyword: "would pay for", subreddit: "SaaS", description: "付费意愿" },
  { keyword: "would pay for", subreddit: "startups", description: "付费意愿" },
  { keyword: "shut up and take my money", subreddit: "SaaS", description: "强烈付费意愿" },
  
  // 痛点抱怨类
  { keyword: "frustrated with", subreddit: "SaaS", description: "痛点抱怨" },
  { keyword: "hate using", subreddit: "webdev", description: "痛点抱怨" },
  { keyword: "waste of time", subreddit: "startups", description: "效率问题" },
  
  // 期望需求类
  { keyword: "I wish there was", subreddit: "SaaS", description: "期望需求" },
  { keyword: "looking for alternative", subreddit: "SaaS", description: "替代方案" },
  
  // AI 相关
  { keyword: "frustrated with", subreddit: "ChatGPT", description: "AI工具痛点" },
  { keyword: "would pay for", subreddit: "LocalLLaMA", description: "AI付费需求" },
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getExistingUrls(): Set<string> {
  try {
    const result = execSync(
      `sqlite3 "${DB_PATH}" "SELECT content FROM inbox WHERE source = 'reddit_demand'" 2>/dev/null`,
      { encoding: "utf-8" }
    );
    const urls = new Set<string>();
    result.split("\n").forEach((line) => {
      try {
        const data = JSON.parse(line);
        if (data.url) urls.add(data.url);
      } catch {
        // ignore
      }
    });
    return urls;
  } catch {
    return new Set();
  }
}

function buildPrompt(task: SearchTask, existingUrls: Set<string>): string {
  const urlList = Array.from(existingUrls).slice(0, 20).join("\n");
  
  return `你的任务是在 Reddit 搜索需求线索。

## 搜索参数
- **关键词**: "${task.keyword}"
- **subreddit**: r/${task.subreddit}
- **类型**: ${task.description}

## 步骤

1. 用 mcporter 打开 Reddit 搜索页面：
   https://www.reddit.com/r/${task.subreddit}/search/?q="${encodeURIComponent(task.keyword)}"&sort=new&t=month
   
2. 等待页面加载，用 take_snapshot 查看内容

3. 找 **最近 7 天内** 的帖子（看发布时间：1d ago, 2d ago 等，超过 7d 的跳过）

4. 筛选标准：
   - 票数 > 3 或评论 > 5
   - 内容有具体痛点描述（不是纯吐槽）

5. 点进 1-2 个最有价值的帖子，提取：
   - 标题
   - URL
   - 发布时间（如 "2d ago"）
   - 核心痛点
   - 用户原话（最有价值的一句）

6. **去重检查** - 以下 URL 已入库，跳过：
${urlList || "(暂无)"}

7. 用 sqlite3 存入数据库：
   sqlite3 "${DB_PATH}" "INSERT INTO inbox (source, content) VALUES ('reddit_demand', '{JSON}');"
   
   JSON 格式：
   {
     "keyword": "${task.keyword}",
     "subreddit": "${task.subreddit}",
     "title": "...",
     "url": "https://www.reddit.com/r/...",
     "posted": "2d ago",
     "pain_point": "...",
     "quote": "..."
   }

8. 用完页面 close_page

## 注意
- 只搜这一个关键词和 subreddit
- 只要最近 7 天的帖子
- 跳过已存在的 URL
- 完成后告诉我：找到 X 条新需求，或"无新内容"`;
}

async function runSearchTask(task: SearchTask, existingUrls: Set<string>): Promise<void> {
  const prompt = buildPrompt(task, existingUrls);
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] 搜索: r/${task.subreddit} "${task.keyword}"`);
  
  try {
    const result = execSync(
      `echo '${prompt.replace(/'/g, "'\\''")}' | ${PI_PATH} -p`,
      {
        cwd: WORK_DIR,
        encoding: "utf-8",
        timeout: 8 * 60 * 1000, // 8 分钟超时
        maxBuffer: 10 * 1024 * 1024,
      }
    );
    
    console.log(`[${new Date().toISOString()}] 完成: r/${task.subreddit}`);
    // 打印结果摘要
    const lines = result.trim().split("\n");
    console.log(lines.slice(-3).join("\n"));
  } catch (err: any) {
    if (err.killed) {
      console.error(`[${new Date().toISOString()}] 超时: r/${task.subreddit}`);
    } else {
      console.error(`[${new Date().toISOString()}] 错误: ${err.message?.slice(0, 100)}`);
    }
  }
}

async function runAllTasks(): Promise<void> {
  const startTime = new Date().toISOString();
  console.log(`\n[${startTime}] ===== 开始 Reddit 需求搜索 =====`);
  console.log(`任务数: ${SEARCH_TASKS.length}`);
  
  // 获取已有 URL 用于去重
  const existingUrls = getExistingUrls();
  console.log(`已有记录: ${existingUrls.size} 条`);
  
  for (let i = 0; i < SEARCH_TASKS.length; i++) {
    const task = SEARCH_TASKS[i];
    console.log(`\n--- 任务 ${i + 1}/${SEARCH_TASKS.length} ---`);
    
    await runSearchTask(task, existingUrls);
    
    // 重新加载已有 URL（可能刚入库了新的）
    const newUrls = getExistingUrls();
    newUrls.forEach((url) => existingUrls.add(url));
    
    // 任务间隔 1 分钟
    if (i < SEARCH_TASKS.length - 1) {
      console.log("等待 1 分钟...");
      await sleep(60 * 1000);
    }
  }
  
  console.log(`\n[${new Date().toISOString()}] ===== 搜索完成 =====`);
  console.log(`当前记录数: ${getExistingUrls().size}`);
}

async function main(): Promise<void> {
  program
    .name("monitor-reddit-demands")
    .description("Monitor Reddit for demand signals using pi agent")
    .option("-i, --interval <hours>", "Polling interval in hours", "24")
    .option("-o, --once", "Run once and exit")
    .parse();

  const opts = program.opts();
  
  if (opts.once) {
    await runAllTasks();
    return;
  }
  
  const intervalMs = parseInt(opts.interval, 10) * 60 * 60 * 1000;
  
  console.log(`Reddit 需求监控启动`);
  console.log(`间隔: ${opts.interval} 小时`);
  console.log(`任务数: ${SEARCH_TASKS.length}`);
  
  // 首次运行
  await runAllTasks();
  
  // 定时运行
  setInterval(async () => {
    await runAllTasks();
  }, intervalMs);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

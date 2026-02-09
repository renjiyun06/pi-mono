#!/usr/bin/env npx tsx
/**
 * Discover new Twitter accounts via AI agent
 * Periodically launches a pi agent to explore high-quality accounts
 * from the quotes/replies of seed accounts' popular tweets
 */

import { program } from "commander";
import { spawn } from "child_process";
import { execSync } from "child_process";

const DB_PATH = "/home/lamarck/pi-mono/lamarck/data/lamarck.db";

function getRandomAccounts(count: number): string[] {
  try {
    const result = execSync(
      `sqlite3 "${DB_PATH}" "SELECT username FROM twitter_accounts WHERE active = 1 ORDER BY RANDOM() LIMIT ${count}"`,
      { encoding: "utf-8" }
    );
    return result.split("\n").filter((line) => line.trim());
  } catch {
    return [];
  }
}

function buildPrompt(accounts: string[]): string {
  const accountList = accounts.map((a) => `@${a}`).join(", ");
  
  return `你的任务是从 Twitter 上发现高质量的 AI 领域账号。

## 背景
我们维护一个 AI 领域的 Twitter 账号列表，现在需要扩展这个列表。
你要从现有账号的热门帖子下面，找到活跃的、有质量的互动者。

## 数据库
- 路径：${DB_PATH}
- 表：twitter_accounts（username, display_name, reason, discovered_from, priority, active, created_at）

## 本次探索的种子账号
${accountList}

## 具体步骤

1. 依次打开这些账号的 Twitter 主页
2. 找一条高热度帖子（点赞或转发多的）
3. 进入帖子详情，查看引用转发（Quotes）或回复（Replies）
4. 从互动者中挑选看起来高质量的用户，打开他们主页查看
5. 评估是否值得关注：
   - 粉丝数 >= 500
   - 有 bio，且和 AI/技术相关
   - 有独立观点，不是纯转发机器
6. 符合标准的账号直接插入数据库：
   \`\`\`bash
   sqlite3 "${DB_PATH}" "INSERT OR IGNORE INTO twitter_accounts (username, display_name, reason, discovered_from) VALUES ('handle', 'Display Name', '入选理由', '从哪个账号发现的')"
   \`\`\`

## 输出要求
- 每发现一个合格账号，立即插入数据库
- 最后输出本次发现的账号列表和理由
- 如果没有发现合适的账号，也要说明原因

开始吧。`;
}

function runAgent(prompt: string, timeoutMinutes: number): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`[${new Date().toISOString()}] Starting pi agent (timeout: ${timeoutMinutes}min)...`);
    
    const pi = spawn("pi", ["--mode", "json", "-p", "--prompt", prompt], {
      cwd: "/home/lamarck/pi-mono",
      stdio: ["ignore", "pipe", "pipe"],
    });

    let completed = false;

    // Timeout handler
    const timeout = setTimeout(() => {
      if (!completed) {
        console.error(`\n[${new Date().toISOString()}] Agent timeout after ${timeoutMinutes} minutes, killing...`);
        pi.kill("SIGTERM");
        setTimeout(() => {
          if (!completed) {
            pi.kill("SIGKILL");
          }
        }, 5000);
      }
    }, timeoutMinutes * 60 * 1000);

    pi.stdout.on("data", (data) => {
      const text = data.toString();
      
      // Try to extract and print text events
      const lines = text.split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);
          if (event.type === "text") {
            process.stdout.write(event.text);
          } else if (event.type === "agent_end") {
            console.log("\n[Agent completed]");
          }
        } catch {
          // Not JSON, ignore
        }
      }
    });

    pi.stderr.on("data", (data) => {
      console.error(data.toString());
    });

    pi.on("close", (code) => {
      completed = true;
      clearTimeout(timeout);
      if (code === 0) {
        resolve();
      } else if (code === null) {
        reject(new Error("Agent was killed due to timeout"));
      } else {
        reject(new Error(`pi exited with code ${code}`));
      }
    });

    pi.on("error", (err) => {
      completed = true;
      clearTimeout(timeout);
      reject(err);
    });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const DESCRIPTION = `
Discover Twitter Accounts (推特账号发现)

目的：
  通过 AI 智能体探索 Twitter，从现有账号的热门帖子互动者中发现高质量新账号

工作原理：
  1. 从 twitter_accounts 表随机抽取种子账号
  2. 启动 pi agent，让它去浏览这些账号的主页
  3. 智能体找高热度帖子，查看引用/回复者
  4. 评估互动者质量，符合标准的直接入库

与其他监控任务的区别：
  - 其他 monitor-*.ts 是纯脚本爬取
  - 本任务依赖智能体的认知能力判断账号质量

数据库：
  - ${DB_PATH}
  - 表：twitter_accounts

运行参数：
  --interval <hours>   运行间隔（默认 24 小时）
  --accounts <number>  每次探索几个种子账号（默认 2）
  --timeout <minutes>  智能体超时时间（默认 30 分钟）
  --once              只运行一次，不循环
  --describe          显示此详细描述
`.trim();

async function main(): Promise<void> {
  program
    .name("discover-twitter-accounts")
    .description("Discover new Twitter accounts via AI agent")
    .option("-i, --interval <hours>", "Interval between runs in hours", "24")
    .option("-a, --accounts <number>", "Number of seed accounts per run", "2")
    .option("-t, --timeout <minutes>", "Agent timeout in minutes", "30")
    .option("-o, --once", "Run once and exit")
    .option("-d, --describe", "Show detailed description")
    .parse();

  const opts = program.opts();

  if (opts.describe) {
    console.log(DESCRIPTION);
    process.exit(0);
  }

  const interval = parseInt(opts.interval, 10) * 60 * 60 * 1000; // hours to ms
  const accountCount = parseInt(opts.accounts, 10);
  const timeout = parseInt(opts.timeout, 10);

  console.log(`Starting Twitter account discovery:`);
  console.log(`  - Seed accounts per run: ${accountCount}`);
  console.log(`  - Interval: ${opts.interval} hours`);
  console.log(`  - Timeout: ${timeout} minutes`);
  console.log(`  - Database: ${DB_PATH}`);

  while (true) {
    const accounts = getRandomAccounts(accountCount);
    
    if (accounts.length === 0) {
      console.error("No accounts found in twitter_accounts table");
      process.exit(1);
    }

    console.log(`\n[${new Date().toISOString()}] Selected accounts: ${accounts.map(a => "@" + a).join(", ")}`);

    try {
      const prompt = buildPrompt(accounts);
      await runAgent(prompt, timeout);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Agent error:`, err);
    }

    if (opts.once) {
      console.log("Done (--once mode)");
      process.exit(0);
    }

    console.log(`\n[${new Date().toISOString()}] Sleeping for ${opts.interval} hours...`);
    await sleep(interval);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

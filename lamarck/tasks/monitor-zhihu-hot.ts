#!/usr/bin/env npx tsx
/**
 * Monitor Zhihu Hot List for tech/AI related topics
 * Uses fetch-zhihu-hot.ts tool to get data, then pi agent to filter
 */

import { execSync } from "child_process";
import { program } from "commander";

const TOOL_PATH = "/home/lamarck/pi-mono/lamarck/tools/fetch-zhihu-hot.ts";
const PI_PATH = "/home/lamarck/pi-mono/pi-test.sh";
const WORK_DIR = "/home/lamarck/pi-mono";
const DB_PATH = "/home/lamarck/pi-mono/lamarck/data/lamarck.db";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getExistingQuestionIds(): Set<string> {
  try {
    const result = execSync(
      `sqlite3 "${DB_PATH}" "SELECT content FROM inbox WHERE source = 'zhihu_hot'" 2>/dev/null`,
      { encoding: "utf-8" }
    );
    const ids = new Set<string>();
    result.split("\n").forEach((line) => {
      try {
        const data = JSON.parse(line);
        if (data.question_id) ids.add(data.question_id);
      } catch {
        // ignore
      }
    });
    return ids;
  } catch {
    return new Set();
  }
}

function fetchHotList(): any[] {
  try {
    const result = execSync(`npx tsx "${TOOL_PATH}"`, {
      cwd: WORK_DIR,
      encoding: "utf-8",
      timeout: 60 * 1000, // 1 分钟超时
    });
    return JSON.parse(result);
  } catch (err: any) {
    console.error(`[${new Date().toISOString()}] 抓取失败: ${err.message?.slice(0, 100)}`);
    return [];
  }
}

function buildPrompt(hotList: any[], existingIds: Set<string>): string {
  // 过滤掉已入库的
  const newItems = hotList.filter((item) => {
    const match = item.url.match(/\/question\/(\d+)/);
    const questionId = match ? match[1] : null;
    return questionId && !existingIds.has(questionId);
  });

  if (newItems.length === 0) {
    return ""; // 没有新条目，不需要调用智能体
  }

  const listText = newItems
    .map((item) => `${item.rank}. ${item.title} (${item.heat}) - ${item.url}`)
    .join("\n");

  return `你的任务是从知乎热榜中筛选科技/AI 相关话题，存入数据库。

## 热榜数据（共 ${newItems.length} 条新条目）

${listText}

## 筛选标准

用你的判断力识别与以下领域相关的话题：
- 人工智能、大模型、机器学习、深度学习
- 科技公司动态（OpenAI、Anthropic、Google、微软、苹果、华为、字节等）
- 编程、软件开发、程序员相关
- 芯片、半导体、硬件
- 机器人、自动驾驶、量子计算
- 互联网、创业、科技趋势

不要只看关键词，要理解话题本身是否与科技相关。

## 存入数据库

对每个符合条件的话题，执行：

sqlite3 "${DB_PATH}" "INSERT INTO inbox (source, content) VALUES ('zhihu_hot', '<JSON>');"

JSON 格式：
{
  "question_id": "<从URL提取>",
  "title": "<标题>",
  "url": "<链接>",
  "heat": "<热度>",
  "rank": <排名>,
  "fetched_at": "${new Date().toISOString()}"
}

注意 JSON 中的引号要用两个单引号转义。

## 完成后报告

告诉我：筛选了 X 条科技相关话题并入库，跳过 Y 条非科技话题。`;
}

async function runTask(): Promise<void> {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 开始抓取知乎热榜...`);

  // 1. 用工具获取热榜数据
  const hotList = fetchHotList();
  if (hotList.length === 0) {
    console.log(`[${new Date().toISOString()}] 未获取到数据`);
    return;
  }
  console.log(`获取到 ${hotList.length} 条热榜数据`);

  // 2. 获取已有记录
  const existingIds = getExistingQuestionIds();
  console.log(`已有记录: ${existingIds.size} 条`);

  // 3. 构建 prompt
  const prompt = buildPrompt(hotList, existingIds);
  if (!prompt) {
    console.log(`[${new Date().toISOString()}] 无新条目需要处理`);
    return;
  }

  // 4. 调用智能体进行筛选
  try {
    const result = execSync(
      `echo '${prompt.replace(/'/g, "'\\''")}' | ${PI_PATH} -p`,
      {
        cwd: WORK_DIR,
        encoding: "utf-8",
        timeout: 3 * 60 * 1000, // 3 分钟超时
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    console.log(`[${new Date().toISOString()}] 完成`);
    // 打印结果摘要
    const lines = result.trim().split("\n");
    console.log(lines.slice(-5).join("\n"));
  } catch (err: any) {
    if (err.killed) {
      console.error(`[${new Date().toISOString()}] 超时`);
    } else {
      console.error(`[${new Date().toISOString()}] 错误: ${err.message?.slice(0, 200)}`);
    }
  }
}

// Detailed description for --describe
const DESCRIPTION = `
Monitor Zhihu Hot List (知乎热榜监控)

目的：
  监控知乎热榜，筛选科技/AI 相关话题，作为内容选题参考

工作原理：
  1. 用 fetch-zhihu-hot.ts 工具快速抓取热榜（Playwright + CDP）
  2. 过滤掉已入库的条目
  3. 用 pi agent 的认知能力判断哪些是科技相关话题
  4. 将筛选结果存入数据库

筛选逻辑：
  不是简单关键词匹配，而是让智能体理解话题内容进行判断

采集内容：
  - question_id、标题、URL、热度、排名

存储位置：
  - ${DB_PATH} → inbox 表
  - source: "zhihu_hot"

去重：
  - 按 question_id 去重，避免重复入库

运行参数：
  --interval <minutes>  轮询间隔（默认 60 分钟）
  --once                只运行一次
  --describe            显示此详细描述

与抖音账号关系：
  - 热门科技话题 → 视频选题参考
  - 用户讨论 → 了解受众关注点
`.trim();

async function main(): Promise<void> {
  program
    .name("monitor-zhihu-hot")
    .description("Monitor Zhihu hot list for tech/AI topics")
    .option("-i, --interval <minutes>", "Polling interval in minutes", "60")
    .option("-o, --once", "Run once and exit")
    .option("-d, --describe", "Show detailed description")
    .parse();

  const opts = program.opts();

  if (opts.describe) {
    console.log(DESCRIPTION);
    process.exit(0);
  }

  const intervalMs = parseInt(opts.interval, 10) * 60 * 1000;

  console.log(`知乎热榜监控启动`);
  console.log(`间隔: ${opts.interval} 分钟`);

  // 首次运行
  await runTask();

  if (opts.once) {
    return;
  }

  // 定时运行
  while (true) {
    console.log(`\n[${new Date().toISOString()}] 等待 ${opts.interval} 分钟...`);
    await sleep(intervalMs);
    await runTask();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

// @cron 0 9 * * *
// @enabled yes

/**
 * 抖音账号监控任务
 * 
 * 循环遍历账号，为每个账号启动 pi 子 agent 处理
 * 结果记录到日志，后续通过查看日志分析
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const PROJECT_ROOT = "/home/lamarck/pi-mono";
const DB_PATH = join(PROJECT_ROOT, "lamarck/data/lamarck.db");
const TASK_DIR = join(PROJECT_ROOT, "lamarck/tasks/douyin-monitor");
const TEMPLATE_PATH = join(TASK_DIR, "prompt.md");

interface Account {
  account_id: string;
  account_name: string;
  profile_url: string;
}

function getAccounts(): Account[] {
  const output = execSync(
    `sqlite3 "${DB_PATH}" "SELECT account_id, account_name, profile_url FROM douyin_accounts;"`,
    { encoding: "utf-8" }
  );
  
  return output.trim().split("\n").filter(Boolean).map(line => {
    const [account_id, account_name, profile_url] = line.split("|");
    return { account_id, account_name, profile_url };
  });
}

function fillTemplate(template: string, account: Account): string {
  return template
    .replace(/\{\{account_id\}\}/g, account.account_id)
    .replace(/\{\{account_name\}\}/g, account.account_name)
    .replace(/\{\{profile_url\}\}/g, account.profile_url);
}

function runAgent(prompt: string): string {
  const promptFile = "/tmp/douyin-monitor-prompt.md";
  const logFile = "/tmp/douyin-monitor-agent.log";
  
  writeFileSync(promptFile, prompt);
  
  // Run pi synchronously, capture output
  try {
    execSync(
      `cd "${PROJECT_ROOT}" && pi --mode json -p --prompt-file "${promptFile}" 2>&1 > "${logFile}"`,
      { encoding: "utf-8", timeout: 30 * 60 * 1000 } // 30 min timeout
    );
  } catch (e) {
    // pi may exit with non-zero, that's ok
  }
  
  // Extract final result
  try {
    const result = execSync(
      `grep '"type":"agent_end"' "${logFile}" | tail -1 | jq -r '.messages[-1].content[] | select(.type=="text") | .text'`,
      { encoding: "utf-8" }
    );
    return result.trim();
  } catch (e) {
    return "[无法提取结果]";
  }
}

// Main
console.log("=== 抖音账号监控任务 ===");
console.log(`时间: ${new Date().toISOString()}`);
console.log("");

const accounts = getAccounts();
console.log(`共 ${accounts.length} 个账号\n`);

const template = readFileSync(TEMPLATE_PATH, "utf-8");

for (let i = 0; i < accounts.length; i++) {
  const account = accounts[i];
  console.log(`--- [${i + 1}/${accounts.length}] ${account.account_name} ---`);
  
  const prompt = fillTemplate(template, account);
  const result = runAgent(prompt);
  
  console.log(result);
  console.log("");
  
  // Sleep between accounts
  if (i < accounts.length - 1) {
    execSync("sleep 15");
  }
}

console.log("=== 任务结束 ===");

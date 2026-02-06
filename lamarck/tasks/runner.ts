#!/usr/bin/env -S npx tsx

/**
 * Task Runner
 * 
 * Triggered by cron every minute. Scans task files, checks which ones
 * should run based on their cron expressions, and executes them.
 */

import { readFileSync, readdirSync, appendFileSync, existsSync, mkdirSync, statSync, writeFileSync } from "fs";
import { join, basename } from "path";
import { spawn } from "child_process";

const TASKS_DIR = join(import.meta.dirname, ".");
const LOGS_DIR = join(TASKS_DIR, "logs");
const PROJECT_ROOT = join(import.meta.dirname, "../..");

// Ensure logs directory exists
if (!existsSync(LOGS_DIR)) {
  mkdirSync(LOGS_DIR, { recursive: true });
}

interface TaskConfig {
  cron: string;
  enabled: boolean;
  provider?: string;
  model?: string;
}

interface Task {
  name: string;
  file: string;
  config: TaskConfig;
  content: string;
}

function log(msg: string) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  appendFileSync(join(LOGS_DIR, "runner.log"), line);
}

function parseFrontmatter(content: string): { config: Partial<TaskConfig>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { config: {}, body: content };
  }
  
  const yaml = match[1];
  const body = match[2].trim();
  const config: Partial<TaskConfig> = {};
  
  for (const line of yaml.split("\n")) {
    const [key, ...rest] = line.split(":");
    const value = rest.join(":").trim().replace(/^["']|["']$/g, "");
    if (key.trim() === "cron") {
      config.cron = value;
    } else if (key.trim() === "enabled") {
      config.enabled = value === "yes" || value === "true";
    } else if (key.trim() === "provider") {
      config.provider = value;
    } else if (key.trim() === "model") {
      config.model = value;
    }
  }
  
  return { config, body };
}

function cronMatchesNow(cronExpr: string): boolean {
  const now = new Date();
  const minute = now.getMinutes();
  const hour = now.getHours();
  const dayOfMonth = now.getDate();
  const month = now.getMonth() + 1;
  const dayOfWeek = now.getDay();
  
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length !== 5) {
    log(`Invalid cron expression: ${cronExpr}`);
    return false;
  }
  
  const [cronMin, cronHour, cronDom, cronMonth, cronDow] = parts;
  
  return (
    matchField(cronMin, minute, 0, 59) &&
    matchField(cronHour, hour, 0, 23) &&
    matchField(cronDom, dayOfMonth, 1, 31) &&
    matchField(cronMonth, month, 1, 12) &&
    matchField(cronDow, dayOfWeek, 0, 6)
  );
}

function matchField(field: string, value: number, min: number, max: number): boolean {
  if (field === "*") return true;
  
  // Handle */n (step)
  if (field.startsWith("*/")) {
    const step = parseInt(field.slice(2), 10);
    return value % step === 0;
  }
  
  // Handle ranges like 1-5
  if (field.includes("-")) {
    const [start, end] = field.split("-").map(n => parseInt(n, 10));
    return value >= start && value <= end;
  }
  
  // Handle lists like 1,3,5
  if (field.includes(",")) {
    const values = field.split(",").map(n => parseInt(n, 10));
    return values.includes(value);
  }
  
  // Single value
  return parseInt(field, 10) === value;
}

function loadTasks(): Task[] {
  const tasks: Task[] = [];
  // Only read .md files in root directory, skip subdirectories
  const files = readdirSync(TASKS_DIR).filter(f => {
    if (!f.endsWith(".md")) return false;
    const filePath = join(TASKS_DIR, f);
    return statSync(filePath).isFile();
  });
  
  for (const file of files) {
    const filePath = join(TASKS_DIR, file);
    const content = readFileSync(filePath, "utf-8");
    const { config, body } = parseFrontmatter(content);
    
    if (config.cron && config.enabled !== undefined) {
      tasks.push({
        name: basename(file, ".md"),
        file: filePath,
        config: config as TaskConfig,
        content: body,
      });
    }
  }
  
  return tasks;
}

function executeTask(task: Task) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
  const logFile = join(LOGS_DIR, `${task.name}_${timestamp}.md`);
  
  log(`Spawning task: ${task.name}`);
  
  // Build command args
  const args: string[] = [];
  if (task.config.provider) {
    args.push("--provider", task.config.provider);
  }
  if (task.config.model) {
    args.push("--model", task.config.model);
  }
  args.push("-p", task.content);
  
  // Write initial log header
  writeFileSync(logFile, `# ${task.name}\n\nStarted: ${new Date().toISOString()}\n\n## Output\n\n`);
  
  // Spawn process (non-blocking)
  const child = spawn("pi", args, {
    cwd: PROJECT_ROOT,
    stdio: ["ignore", "pipe", "pipe"],
  });
  
  // Collect output
  let output = "";
  child.stdout.on("data", (data) => {
    output += data.toString();
  });
  child.stderr.on("data", (data) => {
    output += data.toString();
  });
  
  child.on("close", (code) => {
    appendFileSync(logFile, output);
    if (code === 0) {
      log(`Task ${task.name} completed, log: ${logFile}`);
    } else {
      appendFileSync(logFile, `\n\n## Exit Code: ${code}`);
      log(`Task ${task.name} exited with code ${code}, log: ${logFile}`);
    }
  });
  
  child.on("error", (err) => {
    appendFileSync(logFile, `\n\n## Error\n\n${err.message}`);
    log(`Task ${task.name} failed: ${err.message}`);
  });
}

// Main
log("Runner triggered");

const tasks = loadTasks();
const tasksToRun = tasks.filter(t => t.config.enabled && cronMatchesNow(t.config.cron));

if (tasksToRun.length === 0) {
  log("No tasks to run this minute");
} else {
  log(`Tasks to run: ${tasksToRun.map(t => t.name).join(", ")}`);
  for (const task of tasksToRun) {
    executeTask(task);
  }
}

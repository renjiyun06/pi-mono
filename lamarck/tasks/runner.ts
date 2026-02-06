#!/usr/bin/env -S npx tsx

/**
 * Task Runner
 * 
 * Triggered by cron every minute. Scans task files, checks which ones
 * should run based on their cron expressions, and executes them in tmux.
 * 
 * Commands:
 *   (no args)           - Cron mode: check and run scheduled tasks
 *   --list              - List all tasks and their status
 *   --status            - Show running tasks (tmux sessions)
 *   --run <task>        - Manually run a task (JSON mode, for automation)
 *   --run <task> --tui  - Run in TUI mode (interactive, for debugging)
 *   --stop <task>       - Stop a running task
 *   --logs <task>       - Show latest log for a task
 *   --attach <task>     - Attach to a running task's tmux session
 */

import { readFileSync, readdirSync, appendFileSync, existsSync, mkdirSync, statSync, writeFileSync } from "fs";
import { join } from "path";
import { execSync, spawnSync } from "child_process";

const TASKS_DIR = join(import.meta.dirname, ".");
const LOGS_DIR = join(TASKS_DIR, "logs");
const PROJECT_ROOT = join(import.meta.dirname, "../..");
const SESSION_PREFIX = "task-";

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
  const entries = readdirSync(TASKS_DIR);
  
  for (const entry of entries) {
    const entryPath = join(TASKS_DIR, entry);
    if (!statSync(entryPath).isDirectory()) continue;
    if (entry === "logs") continue;
    
    const taskFile = join(entryPath, "task.md");
    if (!existsSync(taskFile)) continue;
    
    const content = readFileSync(taskFile, "utf-8");
    const { config, body } = parseFrontmatter(content);
    
    if (config.cron && config.enabled !== undefined) {
      tasks.push({
        name: entry,
        file: taskFile,
        config: config as TaskConfig,
        content: body,
      });
    }
  }
  
  return tasks;
}

function getSessionName(taskName: string): string {
  return `${SESSION_PREFIX}${taskName}`;
}

function isTaskRunning(taskName: string): boolean {
  const sessionName = getSessionName(taskName);
  const result = spawnSync("tmux", ["has-session", "-t", sessionName], { stdio: "ignore" });
  return result.status === 0;
}

function getRunningTasks(): string[] {
  try {
    const output = execSync("tmux list-sessions -F '#{session_name}' 2>/dev/null", { encoding: "utf-8" });
    return output
      .trim()
      .split("\n")
      .filter(s => s.startsWith(SESSION_PREFIX))
      .map(s => s.slice(SESSION_PREFIX.length));
  } catch {
    return [];
  }
}

function executeTask(task: Task, tuiMode: boolean = false): boolean {
  const sessionName = getSessionName(task.name);
  
  // Check if already running
  if (isTaskRunning(task.name)) {
    log(`Task ${task.name} is already running, skipping`);
    return false;
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
  const logFile = join(LOGS_DIR, `${task.name}_${timestamp}.md`);
  
  log(`Starting task in tmux: ${task.name} (tui: ${tuiMode})`);
  
  // Build pi command args
  const piArgs: string[] = [];
  if (task.config.provider) {
    piArgs.push("--provider", task.config.provider);
  }
  if (task.config.model) {
    piArgs.push("--model", task.config.model);
  }
  
  // Write log header
  writeFileSync(logFile, `# ${task.name}\n\nStarted: ${new Date().toISOString()}\nMode: ${tuiMode ? "TUI" : "JSON"}\n\n## Output\n\n`);
  
  if (tuiMode) {
    // TUI mode: start interactive pi, then send prompt
    const piCommand = `pi ${piArgs.join(" ")}`;
    
    // Start tmux session with interactive pi
    const tmuxArgs = [
      "new-session",
      "-d",
      "-s", sessionName,
      "-c", PROJECT_ROOT,
      piCommand
    ];
    
    const result = spawnSync("tmux", tmuxArgs, { stdio: "inherit" });
    
    if (result.status !== 0) {
      log(`Failed to start task ${task.name}`);
      return false;
    }
    
    // Wait for pi to start
    spawnSync("sleep", ["2"]);
    
    // Send the prompt via tmux send-keys
    // Escape special characters for tmux
    const escapedPrompt = task.content
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\$/g, "\\$")
      .replace(/`/g, "\\`");
    
    spawnSync("tmux", ["send-keys", "-t", sessionName, escapedPrompt, "Enter"], { stdio: "inherit" });
    
    log(`Task ${task.name} started in TUI mode, prompt sent`);
    return true;
  } else {
    // JSON mode: non-interactive with --mode json
    const escapedPrompt = task.content.replace(/'/g, "'\\''");
    piArgs.push("-p", `'${escapedPrompt}'`);
    
    const piCommand = `pi --mode json ${piArgs.join(" ")} 2>&1 | tee -a '${logFile}'`;
    
    const tmuxArgs = [
      "new-session",
      "-d",
      "-s", sessionName,
      "-c", PROJECT_ROOT,
      piCommand
    ];
    
    const result = spawnSync("tmux", tmuxArgs, { stdio: "inherit" });
    
    if (result.status === 0) {
      log(`Task ${task.name} started in tmux session: ${sessionName}`);
      return true;
    } else {
      log(`Failed to start task ${task.name}`);
      return false;
    }
  }
}

function stopTask(taskName: string): boolean {
  const sessionName = getSessionName(taskName);
  
  if (!isTaskRunning(taskName)) {
    console.error(`Task ${taskName} is not running`);
    return false;
  }
  
  const result = spawnSync("tmux", ["kill-session", "-t", sessionName], { stdio: "inherit" });
  
  if (result.status === 0) {
    log(`Stopped task: ${taskName}`);
    console.log(`Stopped task: ${taskName}`);
    return true;
  } else {
    console.error(`Failed to stop task: ${taskName}`);
    return false;
  }
}

function showTaskOutput(taskName: string, lines: number = 50): void {
  const sessionName = getSessionName(taskName);
  
  if (!isTaskRunning(taskName)) {
    console.error(`Task ${taskName} is not running`);
    console.log("\nShowing latest log file instead:\n");
    showLatestLog(taskName);
    return;
  }
  
  try {
    const output = execSync(`tmux capture-pane -t '${sessionName}' -p -S -${lines}`, { encoding: "utf-8" });
    console.log(output);
  } catch (err) {
    console.error(`Failed to capture output: ${err}`);
  }
}

function showLatestLog(taskName: string): void {
  const files = readdirSync(LOGS_DIR)
    .filter(f => f.startsWith(`${taskName}_`) && f.endsWith(".md"))
    .sort()
    .reverse();
  
  if (files.length === 0) {
    console.error(`No logs found for task: ${taskName}`);
    return;
  }
  
  const latestLog = join(LOGS_DIR, files[0]);
  console.log(`Log file: ${latestLog}\n`);
  console.log(readFileSync(latestLog, "utf-8"));
}

function attachToTask(taskName: string): void {
  const sessionName = getSessionName(taskName);
  
  if (!isTaskRunning(taskName)) {
    console.error(`Task ${taskName} is not running`);
    process.exit(1);
  }
  
  // This replaces the current process
  const result = spawnSync("tmux", ["attach", "-t", sessionName], { stdio: "inherit" });
  process.exit(result.status ?? 1);
}

// Parse command line arguments
interface CliArgs {
  run?: string;
  stop?: string;
  logs?: string;
  attach?: string;
  output?: string;
  list?: boolean;
  status?: boolean;
  tui?: boolean;
  help?: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];
    
    if (arg === "--run" && next) {
      result.run = next;
      i++;
    } else if (arg === "--stop" && next) {
      result.stop = next;
      i++;
    } else if (arg === "--logs" && next) {
      result.logs = next;
      i++;
    } else if (arg === "--attach" && next) {
      result.attach = next;
      i++;
    } else if (arg === "--output" && next) {
      result.output = next;
      i++;
    } else if (arg === "--list") {
      result.list = true;
    } else if (arg === "--status") {
      result.status = true;
    } else if (arg === "--tui") {
      result.tui = true;
    } else if (arg === "--help" || arg === "-h") {
      result.help = true;
    }
  }
  
  return result;
}

function showHelp(): void {
  console.log(`Task Runner

Usage: npx tsx runner.ts [options]

Options:
  (no args)           Cron mode: check and run scheduled tasks
  --list              List all tasks and their status
  --status            Show running tasks (tmux sessions)
  --run <task>        Run a task (JSON mode, for automation)
  --run <task> --tui  Run in TUI mode (interactive, for debugging)
  --stop <task>       Stop a running task
  --logs <task>       Show latest log for a task
  --output <task>     Show current output (live from tmux)
  --attach <task>     Attach to a running task's tmux session
  --help, -h          Show this help
`);
}

// Main
const cliArgs = parseArgs();

// --help
if (cliArgs.help) {
  showHelp();
  process.exit(0);
}

const tasks = loadTasks();

// --list: show all tasks
if (cliArgs.list) {
  console.log("Tasks:\n");
  const running = getRunningTasks();
  for (const task of tasks) {
    const enabledStr = task.config.enabled ? "enabled" : "disabled";
    const runningStr = running.includes(task.name) ? " [RUNNING]" : "";
    console.log(`  ${task.name} (${enabledStr}) - cron: ${task.config.cron}${runningStr}`);
  }
  process.exit(0);
}

// --status: show running tasks
if (cliArgs.status) {
  const running = getRunningTasks();
  if (running.length === 0) {
    console.log("No tasks currently running");
  } else {
    console.log("Running tasks:\n");
    for (const name of running) {
      console.log(`  ${name} (session: ${getSessionName(name)})`);
    }
  }
  process.exit(0);
}

// --stop <name>: stop a running task
if (cliArgs.stop) {
  process.exit(stopTask(cliArgs.stop) ? 0 : 1);
}

// --logs <name>: show latest log
if (cliArgs.logs) {
  showLatestLog(cliArgs.logs);
  process.exit(0);
}

// --output <name>: show current output (live from tmux)
if (cliArgs.output) {
  showTaskOutput(cliArgs.output);
  process.exit(0);
}

// --attach <name>: attach to tmux session
if (cliArgs.attach) {
  attachToTask(cliArgs.attach);
  // Won't reach here - attachToTask exits
}

// --run <name> [--tui]: manually run a specific task
if (cliArgs.run) {
  const task = tasks.find(t => t.name === cliArgs.run);
  if (!task) {
    console.error(`Task not found: ${cliArgs.run}`);
    console.error(`Available tasks: ${tasks.map(t => t.name).join(", ")}`);
    process.exit(1);
  }
  const mode = cliArgs.tui ? "TUI" : "JSON";
  console.log(`Starting task: ${task.name} (${mode} mode)`);
  log(`Manual run: ${task.name} (${mode})`);
  const started = executeTask(task, cliArgs.tui);
  if (started) {
    console.log(`Task started in tmux session: ${getSessionName(task.name)}`);
    if (cliArgs.tui) {
      console.log(`\nTUI mode - attach to interact:`);
      console.log(`  tmux attach -t ${getSessionName(task.name)}`);
    } else {
      console.log(`\nTo view output:  ./runner.ts --output ${task.name}`);
      console.log(`To attach:       ./runner.ts --attach ${task.name}`);
    }
    console.log(`To stop:         ./runner.ts --stop ${task.name}`);
  }
  process.exit(started ? 0 : 1);
}

// Default: cron-triggered run
log("Runner triggered");

const tasksToRun = tasks.filter(t => t.config.enabled && cronMatchesNow(t.config.cron));

if (tasksToRun.length === 0) {
  log("No tasks to run this minute");
} else {
  log(`Tasks to run: ${tasksToRun.map(t => t.name).join(", ")}`);
  for (const task of tasksToRun) {
    executeTask(task);
  }
}

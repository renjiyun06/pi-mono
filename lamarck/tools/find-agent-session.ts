#!/usr/bin/env npx tsx
/**
 * Find the pi session file corresponding to a tmux session
 *
 * Usage:
 *   npx tsx find-agent-session.ts <tmux-session-name>
 *
 * Example:
 *   npx tsx find-agent-session.ts search-graphic
 */

import { execSync } from "child_process";
import * as fs from "node:fs";
import * as path from "node:path";

const SESSIONS_DIR = path.join(
  process.env.HOME || "",
  ".pi/agent/sessions/--home-lamarck-pi-mono--"
);

function getTmuxSessionCreatedTime(sessionName: string): number | null {
  try {
    const result = execSync(
      `tmux list-sessions -F "#{session_name} #{session_created}" 2>/dev/null | grep "^${sessionName} "`,
      { encoding: "utf-8" }
    );
    const parts = result.trim().split(" ");
    if (parts.length >= 2) {
      return parseInt(parts[1], 10);
    }
    return null;
  } catch {
    return null;
  }
}

function parseSessionFileName(fileName: string): Date | null {
  // Format: 2026-02-08T04-26-13-221Z_uuid.jsonl
  const match = fileName.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z_/
  );
  if (!match) return null;

  const [, year, month, day, hour, min, sec, ms] = match;
  // Parse as UTC
  return new Date(
    Date.UTC(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(min),
      parseInt(sec),
      parseInt(ms)
    )
  );
}

function findMatchingSession(
  tmuxCreatedTime: number,
  toleranceSeconds: number = 30
): string | null {
  if (!fs.existsSync(SESSIONS_DIR)) {
    console.error(`Sessions directory not found: ${SESSIONS_DIR}`);
    return null;
  }

  const files = fs.readdirSync(SESSIONS_DIR).filter((f) => f.endsWith(".jsonl"));

  // tmux created time is in local timezone (Unix timestamp)
  const tmuxDate = new Date(tmuxCreatedTime * 1000);

  let bestMatch: { file: string; diff: number } | null = null;

  for (const file of files) {
    const fileDate = parseSessionFileName(file);
    if (!fileDate) continue;

    // Calculate difference in seconds
    const diffMs = Math.abs(fileDate.getTime() - tmuxDate.getTime());
    const diffSeconds = diffMs / 1000;

    if (diffSeconds <= toleranceSeconds) {
      if (!bestMatch || diffSeconds < bestMatch.diff) {
        bestMatch = { file, diff: diffSeconds };
      }
    }
  }

  return bestMatch?.file || null;
}

function formatDate(date: Date): string {
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function main(): void {
  const sessionName = process.argv[2];

  if (!sessionName) {
    console.log("Usage: npx tsx find-agent-session.ts <tmux-session-name>");
    console.log("");
    console.log("Available tmux sessions:");
    try {
      const sessions = execSync(
        'tmux list-sessions -F "  #{session_name}" 2>/dev/null',
        { encoding: "utf-8" }
      );
      console.log(sessions);
    } catch {
      console.log("  (no tmux sessions found)");
    }
    process.exit(1);
  }

  // Get tmux session created time
  const createdTime = getTmuxSessionCreatedTime(sessionName);
  if (!createdTime) {
    console.error(`Tmux session not found: ${sessionName}`);
    process.exit(1);
  }

  const tmuxDate = new Date(createdTime * 1000);
  console.log(`Tmux session: ${sessionName}`);
  console.log(`Created at: ${formatDate(tmuxDate)}`);
  console.log("");

  // Find matching session file
  const matchedFile = findMatchingSession(createdTime);
  if (matchedFile) {
    const fullPath = path.join(SESSIONS_DIR, matchedFile);
    const fileDate = parseSessionFileName(matchedFile);
    const diffSeconds = fileDate
      ? Math.abs(fileDate.getTime() - tmuxDate.getTime()) / 1000
      : 0;

    console.log(`Matched session file:`);
    console.log(`  ${matchedFile}`);
    console.log(`  Time diff: ${diffSeconds.toFixed(1)}s`);
    console.log("");
    console.log(`Full path:`);
    console.log(`  ${fullPath}`);
  } else {
    console.log("No matching session file found within 30 seconds tolerance.");
    console.log("The session may not have started a pi agent, or it's too old.");
  }
}

main();

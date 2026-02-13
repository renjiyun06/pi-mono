/**
 * Persists call history to disk as JSON files.
 *
 * Each call session gets its own file under data/calls/.
 * Files are named by timestamp + short ID for easy browsing.
 */
import { mkdir, writeFile, readdir, readFile } from "fs/promises";
import { join } from "path";
import type { ConversationTurn, CallIntent } from "../pipeline/types.js";

const DATA_DIR = join(import.meta.dirname, "../../data/calls");

export interface CallRecord {
  /** Call ID (timestamp-based) */
  id: string;
  /** When the call started */
  startedAt: string;
  /** When the call ended */
  endedAt: string;
  /** Duration in seconds */
  durationSec: number;
  /** Detected intent */
  intent: CallIntent;
  /** Number of conversation turns */
  turnCount: number;
  /** Full conversation history */
  turns: ConversationTurn[];
}

/**
 * Save a completed call session to disk.
 */
export async function saveCallRecord(
  turns: ReadonlyArray<ConversationTurn>,
  intent: CallIntent,
): Promise<string> {
  await mkdir(DATA_DIR, { recursive: true });

  const now = new Date();
  const id = `${now.toISOString().replace(/[:.]/g, "-")}`;
  const startedAt =
    turns.length > 0
      ? new Date(turns[0].timestamp).toISOString()
      : now.toISOString();
  const endedAt =
    turns.length > 0
      ? new Date(turns[turns.length - 1].timestamp).toISOString()
      : now.toISOString();
  const durationSec =
    turns.length >= 2
      ? Math.round(
          (turns[turns.length - 1].timestamp - turns[0].timestamp) / 1000,
        )
      : 0;

  const record: CallRecord = {
    id,
    startedAt,
    endedAt,
    durationSec,
    intent,
    turnCount: turns.length,
    turns: [...turns],
  };

  const filePath = join(DATA_DIR, `${id}.json`);
  await writeFile(filePath, JSON.stringify(record, null, 2));
  console.log(`[call-history] Saved ${filePath} (${turns.length} turns)`);
  return id;
}

/**
 * Get a single call record by ID (includes full turns).
 */
export async function getCallRecord(
  id: string,
): Promise<CallRecord | null> {
  try {
    const filePath = join(DATA_DIR, `${id}.json`);
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content) as CallRecord;
  } catch {
    return null;
  }
}

/**
 * Get aggregate statistics across all calls.
 */
export async function getCallStats(): Promise<{
  totalCalls: number;
  totalDurationSec: number;
  avgDurationSec: number;
  intentBreakdown: Record<string, number>;
  avgTurnsPerCall: number;
}> {
  const records = await listCallRecords();
  const totalCalls = records.length;
  const totalDurationSec = records.reduce((s, r) => s + r.durationSec, 0);
  const avgDurationSec =
    totalCalls > 0 ? Math.round(totalDurationSec / totalCalls) : 0;
  const avgTurnsPerCall =
    totalCalls > 0
      ? Math.round(
          records.reduce((s, r) => s + r.turnCount, 0) / totalCalls,
        )
      : 0;

  const intentBreakdown: Record<string, number> = {};
  for (const r of records) {
    intentBreakdown[r.intent] = (intentBreakdown[r.intent] || 0) + 1;
  }

  return {
    totalCalls,
    totalDurationSec,
    avgDurationSec,
    intentBreakdown,
    avgTurnsPerCall,
  };
}

/**
 * List all saved call records (metadata only, no turns).
 */
export async function listCallRecords(): Promise<
  Omit<CallRecord, "turns">[]
> {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    const files = await readdir(DATA_DIR);
    const records: Omit<CallRecord, "turns">[] = [];

    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      try {
        const content = await readFile(join(DATA_DIR, file), "utf-8");
        const record: CallRecord = JSON.parse(content);
        const { turns: _turns, ...meta } = record;
        records.push(meta);
      } catch {
        // Skip corrupted files
      }
    }

    return records.sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );
  } catch {
    return [];
  }
}

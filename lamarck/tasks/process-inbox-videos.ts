#!/usr/bin/env npx tsx
/**
 * Process Douyin videos from inbox
 * Downloads videos and generates transcripts, stores in video_assets table
 */

import { program } from "commander";
import { execSync, spawnSync } from "child_process";
import * as fs from "node:fs";
import * as path from "node:path";

const DB_PATH = "/home/lamarck/pi-mono/lamarck/data/lamarck.db";
const VIDEOS_DIR = "/home/lamarck/pi-mono/lamarck/data/videos";
const TRANSCRIPTS_DIR = "/home/lamarck/pi-mono/lamarck/data/transcripts";
const TOOLS_DIR = "/home/lamarck/pi-mono/lamarck/tools";

interface InboxVideo {
  id: number;
  source: string;
  videoId: string;
  title: string;
}

function log(msg: string): void {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function getUnprocessedVideos(): InboxVideo[] {
  try {
    // Get all douyin videos from inbox that are not in video_assets
    const sql = `
      SELECT i.id, i.source, i.content
      FROM inbox i
      WHERE i.source LIKE 'douyin:%'
        AND NOT EXISTS (
          SELECT 1 FROM video_assets v
          WHERE v.video_id = json_extract(i.content, '$.videoId')
        )
      ORDER BY i.created_at ASC
    `;
    const result = execSync(`sqlite3 -json "${DB_PATH}" "${sql}"`, {
      encoding: "utf-8",
    });

    if (!result.trim()) return [];

    const rows = JSON.parse(result);
    const videos: InboxVideo[] = [];

    for (const row of rows) {
      try {
        const content = JSON.parse(row.content);
        if (content.videoId) {
          videos.push({
            id: row.id,
            source: row.source,
            videoId: content.videoId,
            title: content.title || "",
          });
        }
      } catch {
        // Skip invalid JSON
      }
    }

    return videos;
  } catch (err) {
    log(`Error querying inbox: ${err}`);
    return [];
  }
}

function downloadVideo(videoId: string): string | null {
  try {
    const result = spawnSync(
      "npx",
      ["tsx", path.join(TOOLS_DIR, "download-douyin-video.ts"), videoId, "-o", VIDEOS_DIR],
      {
        encoding: "utf-8",
        timeout: 180000, // 3 minutes
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    if (result.status !== 0) {
      log(`[ERROR] Download failed: ${result.stderr}`);
      return null;
    }

    const outputPath = result.stdout.trim();
    if (outputPath && fs.existsSync(outputPath)) {
      return outputPath;
    }

    return null;
  } catch (err) {
    log(`[ERROR] Download exception: ${err}`);
    return null;
  }
}

function transcribeVideo(videoPath: string, videoId: string): string | null {
  try {
    const transcriptPath = path.join(TRANSCRIPTS_DIR, `${videoId}.txt`);

    // Skip if transcript already exists
    if (fs.existsSync(transcriptPath)) {
      log(`[SKIP] Transcript already exists: ${videoId}.txt`);
      return transcriptPath;
    }

    const result = spawnSync(
      "npx",
      [
        "tsx",
        path.join(TOOLS_DIR, "transcribe-audio.ts"),
        videoPath,
        "-o",
        transcriptPath,
      ],
      {
        encoding: "utf-8",
        timeout: 600000, // 10 minutes
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    if (result.status !== 0) {
      log(`[ERROR] Transcribe failed: ${result.stderr}`);
      return null;
    }

    if (fs.existsSync(transcriptPath)) {
      return transcriptPath;
    }

    return null;
  } catch (err) {
    log(`[ERROR] Transcribe exception: ${err}`);
    return null;
  }
}

function saveToVideoAssets(
  videoId: string,
  source: string,
  title: string,
  videoPath: string,
  transcriptPath: string | null
): void {
  const escapedTitle = title.replace(/'/g, "''");
  const escapedSource = source.replace(/'/g, "''");
  const now = new Date().toISOString();

  const sql = `
    INSERT OR REPLACE INTO video_assets (video_id, source, title, video_path, transcript_path, processed_at)
    VALUES ('${videoId}', '${escapedSource}', '${escapedTitle}', '${videoPath}', ${transcriptPath ? `'${transcriptPath}'` : "NULL"}, '${now}');
  `;

  try {
    execSync(`sqlite3 "${DB_PATH}"`, { input: sql });
  } catch (err) {
    log(`[ERROR] Failed to save to video_assets: ${err}`);
  }
}

async function processVideos(delay: number): Promise<number> {
  const videos = getUnprocessedVideos();
  log(`Found ${videos.length} unprocessed videos`);

  let processed = 0;

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    log(`[${i + 1}/${videos.length}] Processing ${video.videoId}: ${video.title.slice(0, 50)}`);

    // Download video
    const videoPath = downloadVideo(video.videoId);
    if (!videoPath) {
      log(`[SKIP] Failed to download ${video.videoId}`);
      // Wait before next attempt
      await sleep(delay);
      continue;
    }

    // Transcribe
    const transcriptPath = transcribeVideo(videoPath, video.videoId);
    if (!transcriptPath) {
      log(`[WARN] Transcription failed for ${video.videoId}, saving without transcript`);
    }

    // Save to database
    saveToVideoAssets(video.videoId, video.source, video.title, videoPath, transcriptPath);
    processed++;

    log(`[DONE] ${video.videoId} - video: ${videoPath}, transcript: ${transcriptPath || "N/A"}`);

    // Delay before next video (except for the last one)
    if (i < videos.length - 1) {
      await sleep(delay);
    }
  }

  return processed;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Detailed description for --describe
const DESCRIPTION = `
Process Inbox Videos (inbox 视频处理)

目的：
  从 inbox 表中读取抖音视频记录，下载视频并生成转录文本

数据来源：
  - 数据库: ${DB_PATH}
  - 表: inbox (source LIKE 'douyin:%')
  - 过滤: 跳过已在 video_assets 表中的视频

处理流程：
  1. 查询 inbox 中未处理的抖音视频
  2. 调用 download-douyin-video.ts 下载视频
  3. 调用 transcribe-audio.ts 生成转录
  4. 写入 video_assets 表

存储位置：
  - 视频文件: ${VIDEOS_DIR}
  - 转录文件: ${TRANSCRIPTS_DIR}
  - 元数据: ${DB_PATH} → video_assets 表

与抖音账号关系：
  - 处理后的视频可用于内容分析、选题参考
  - 转录文本便于快速浏览和搜索

运行参数：
  --interval <minutes>   轮询间隔（默认 30 分钟）
  --delay <seconds>      视频处理间隔（默认 5 秒）
  --once                 只运行一次，不轮询
  --describe             显示此详细描述
`.trim();

async function main(): Promise<void> {
  program
    .name("process-inbox-videos")
    .description("Process Douyin videos from inbox: download and transcribe")
    .option("-i, --interval <minutes>", "Polling interval in minutes", "30")
    .option("-y, --delay <seconds>", "Delay between videos in seconds", "5")
    .option("--once", "Run once without polling")
    .option("-d, --describe", "Show detailed description")
    .parse();

  const opts = program.opts();

  if (opts.describe) {
    console.log(DESCRIPTION);
    process.exit(0);
  }

  const intervalMs = parseInt(opts.interval, 10) * 60 * 1000;
  const delayMs = parseInt(opts.delay, 10) * 1000;

  // Ensure directories exist
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });

  log(`Starting process-inbox-videos:`);
  log(`  - Polling interval: ${opts.interval} minutes`);
  log(`  - Video delay: ${opts.delay}s`);
  log(`  - Mode: ${opts.once ? "single run" : "continuous polling"}`);

  // Initial run
  const processed = await processVideos(delayMs);
  log(`Processed ${processed} videos`);

  if (opts.once) {
    process.exit(0);
  }

  // Polling loop
  while (true) {
    log(`Sleeping for ${opts.interval} minutes...`);
    await sleep(intervalMs);

    try {
      const count = await processVideos(delayMs);
      log(`Processed ${count} videos`);
    } catch (err) {
      log(`Error in polling loop: ${err}`);
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

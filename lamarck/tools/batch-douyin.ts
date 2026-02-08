#!/usr/bin/env npx tsx
/**
 * Batch download and transcribe Douyin videos from multiple accounts.
 * Uses chrome-remote-interface for CDP connection.
 */

import CDP from "chrome-remote-interface";
import { execSync } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";

const CDP_HOST = "172.30.144.1";
const CDP_PORT = 19222;
const PI_MONO = "/home/lamarck/pi-mono";
const VIDEO_DIR = path.join(PI_MONO, "lamarck/data/videos");
const TRANSCRIPT_DIR = path.join(PI_MONO, "lamarck/data/transcripts");
const DB_PATH = path.join(PI_MONO, "lamarck/data/lamarck.db");
const DOWNLOAD_VIDEO = path.join(PI_MONO, "lamarck/tools/download-video.ts");
const TRANSCRIBE = path.join(PI_MONO, "lamarck/tools/transcribe-audio.ts");

// Existing video IDs (skip these)
const EXISTING_IDS = new Set(["7602239781107453219", "7598139812742270234"]);

interface Account {
  name: string;
  url: string;
  secUid: string;
}

const ACCOUNTS: Account[] = [
  {
    name: "AI工程师-DIV",
    url: "https://www.douyin.com/user/MS4wLjABAAAARLM4YQ7-yYSxPyk8AM6sjl0tqv5_iH3ow85XkQMZL2w",
    secUid: "MS4wLjABAAAARLM4YQ7-yYSxPyk8AM6sjl0tqv5_iH3ow85XkQMZL2w",
  },
  {
    name: "Ai技师-火灵",
    url: "https://www.douyin.com/user/MS4wLjABAAAAkfUdmTo0EwuY66rvC7MdsLWJuaCP9Q_T6Zdi1T8uVq3_K81VQGdH1EKfbot57GXX",
    secUid: "MS4wLjABAAAAkfUdmTo0EwuY66rvC7MdsLWJuaCP9Q_T6Zdi1T8uVq3_K81VQGdH1EKfbot57GXX",
  },
  {
    name: "AI-人工智能技术",
    url: "https://www.douyin.com/user/MS4wLjABAAAAXZVP88rAfZeDxNTzabC-PaieriFdwNhmb0j1NWfQFjE",
    secUid: "MS4wLjABAAAAXZVP88rAfZeDxNTzabC-PaieriFdwNhmb0j1NWfQFjE",
  },
  {
    name: "秋芝2046",
    url: "https://www.douyin.com/user/MS4wLjABAAAAwbbVuf1W2DdgRe0xCa0oxg1ZIHbzuiTzyjq3NcOVgBuu6qIidYlMYqbL3ZFY2swu",
    secUid: "MS4wLjABAAAAwbbVuf1W2DdgRe0xCa0oxg1ZIHbzuiTzyjq3NcOVgBuu6qIidYlMYqbL3ZFY2swu",
  },
];

interface VideoInfo {
  videoId: string;
  videoUrl: string;
}

async function getVideosFromPage(
  client: CDP.Client,
  targetId: string,
  sessionId: string,
  url: string
): Promise<VideoInfo[]> {
  await client.send("Page.enable", undefined, sessionId);
  await client.send("Page.navigate", { url }, sessionId);

  // Wait for page load
  await new Promise((r) => setTimeout(r, 5000));

  const { result } = await client.send(
    "Runtime.evaluate",
    {
      expression: `
        Array.from(document.querySelectorAll('a[href*="/video/"]'))
          .map(a => a.href)
          .filter(h => h.includes('/video/'))
      `,
      returnByValue: true,
    },
    sessionId
  );

  const links: string[] = result.value || [];
  const videos: VideoInfo[] = [];
  const seen = new Set<string>();

  for (const link of links) {
    const match = link.match(/\/video\/(\d+)/);
    if (match && !seen.has(match[1])) {
      seen.add(match[1]);
      videos.push({
        videoId: match[1],
        videoUrl: `https://www.douyin.com/video/${match[1]}`,
      });
    }
  }

  return videos;
}

async function downloadVideoWithCRI(
  client: CDP.Client,
  videoUrl: string,
  videoId: string
): Promise<string | null> {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });

  console.log(`  Downloading ${videoId}...`);

  // Create a new tab for video download
  const { targetId } = await client.Target.createTarget({ url: "about:blank" });
  const { sessionId } = await client.Target.attachToTarget({
    targetId,
    flatten: true,
  });

  try {
    await client.send("Page.enable", undefined, sessionId);
    await client.send("Network.enable", undefined, sessionId);

    let capturedVideoUrl: string | null = null;

    // Listen for video requests
    client.on("Network.responseReceived", (params: any) => {
      if (params.sessionId !== sessionId) return;
      const respUrl = params.response.url;
      const contentType = params.response.headers["content-type"] || "";
      if (
        (contentType.includes("video") ||
          respUrl.includes("douyinvod") ||
          respUrl.includes("bytevclod") ||
          respUrl.includes("bytecdn")) &&
        !capturedVideoUrl
      ) {
        capturedVideoUrl = respUrl;
        console.log(`  Video URL captured`);
      }
    });

    await client.send("Page.navigate", { url: videoUrl }, sessionId);
    await new Promise((r) => setTimeout(r, 8000));

    if (!capturedVideoUrl) {
      // Try to get from video element
      const { result } = await client.send(
        "Runtime.evaluate",
        {
          expression: `
            const v = document.querySelector('video');
            v?.src || v?.querySelector('source')?.src || null;
          `,
          returnByValue: true,
        },
        sessionId
      );
      capturedVideoUrl = result.value;
    }

    if (!capturedVideoUrl) {
      console.error(`  Failed to capture video URL`);
      return null;
    }

    // Download the video
    const outputPath = path.join(VIDEO_DIR, `${videoId}.mp4`);
    console.log(`  Downloading from captured URL...`);

    const resp = await fetch(capturedVideoUrl, {
      headers: {
        Referer: "https://www.douyin.com/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
      },
    });

    if (!resp.ok) {
      console.error(`  Download failed: HTTP ${resp.status}`);
      return null;
    }

    const buffer = await resp.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    console.log(`  Saved: ${outputPath} (${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB)`);
    return outputPath;
  } finally {
    await client.Target.closeTarget({ targetId });
  }
}

async function transcribeVideo(videoPath: string, videoId: string): Promise<string | null> {
  fs.mkdirSync(TRANSCRIPT_DIR, { recursive: true });
  const outPath = path.join(TRANSCRIPT_DIR, `${videoId}.txt`);

  console.log(`  Transcribing ${videoId}...`);

  try {
    execSync(`npx tsx "${TRANSCRIBE}" "${videoPath}" -o "${outPath}"`, {
      encoding: "utf8",
      timeout: 600000,
      stdio: ["pipe", "pipe", "inherit"],
    });
    console.log(`  Transcribed: ${outPath}`);
    return outPath;
  } catch (err) {
    console.error(`  Transcribe failed:`, err);
    return null;
  }
}

function insertVideo(
  videoId: string,
  accountId: string,
  videoUrl: string,
  videoPath: string,
  transcriptPath: string
) {
  const sql = `INSERT OR IGNORE INTO douyin_videos (video_id, account_id, title, video_url, video_path, transcript_path) VALUES ('${videoId}', '${accountId}', 'video_${videoId}', '${videoUrl}', '${videoPath}', '${transcriptPath}');`;
  execSync(`sqlite3 "${DB_PATH}" "${sql}"`);
  console.log(`  Inserted into DB: ${videoId}`);
}

async function main() {
  console.log("Connecting to Chrome...");
  const client = await CDP({
    host: CDP_HOST,
    port: CDP_PORT,
  });
  console.log("Connected!");

  // Create a main tab for browsing
  const { targetId } = await client.Target.createTarget({ url: "about:blank" });
  const { sessionId } = await client.Target.attachToTarget({
    targetId,
    flatten: true,
  });

  try {
    for (const account of ACCOUNTS) {
      console.log(`\n=== ${account.name} ===`);

      // Get videos from profile page
      const videos = await getVideosFromPage(client, targetId, sessionId, account.url);
      console.log(`Found ${videos.length} videos`);

      // Find first new video
      let newVideo: VideoInfo | null = null;
      for (const v of videos) {
        if (EXISTING_IDS.has(v.videoId)) {
          console.log(`  [SKIP] ${v.videoId} (in DB)`);
          continue;
        }
        newVideo = v;
        console.log(`  [NEW] ${v.videoId}`);
        break;
      }

      if (!newVideo) {
        console.log(`  No new videos`);
        continue;
      }

      // Download
      const videoPath = await downloadVideoWithCRI(client, newVideo.videoUrl, newVideo.videoId);
      if (!videoPath) continue;

      // Transcribe
      const transcriptPath = await transcribeVideo(videoPath, newVideo.videoId);
      if (!transcriptPath) continue;

      // Insert to DB
      insertVideo(
        newVideo.videoId,
        account.secUid,
        newVideo.videoUrl,
        videoPath,
        transcriptPath
      );

      EXISTING_IDS.add(newVideo.videoId);
    }
  } finally {
    await client.Target.closeTarget({ targetId });
    await client.close();
  }

  console.log("\n=== Done ===");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

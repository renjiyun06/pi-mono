/**
 * Publish a Douyin episode.
 *
 * Reads publish-meta.md from an episode directory and generates the
 * mcporter commands needed to publish the video on Douyin creator platform.
 *
 * Usage:
 *   npx tsx tools/publish-episode.ts --episode ep04-ai-writes-love-letter [--public]
 *   npx tsx tools/publish-episode.ts --episode ep04-ai-writes-love-letter --dry-run
 *
 * By default publishes as "仅自己可见". Pass --public to publish publicly.
 * Use --dry-run to see the planned steps without executing.
 */

import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { Command } from "commander";

const CONTENT_DIR = join(import.meta.dirname, "../content");
const WSL_BRIDGE = "/mnt/d/wsl-bridge";

interface PublishMeta {
	title: string;
	description: string;
	hashtags: string;
	coverText: string;
	videoFile: string;
	subtitleFile: string;
}

function parsePublishMeta(md: string): PublishMeta {
	const getSection = (heading: string): string => {
		const regex = new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`);
		const match = md.match(regex);
		return match ? match[1].trim() : "";
	};

	return {
		title: getSection("标题"),
		description: getSection("描述"),
		hashtags: getSection("话题标签"),
		coverText: getSection("封面文案"),
		videoFile: "",
		subtitleFile: "",
	};
}

function findVideoFile(episodeName: string): string | null {
	// Check common naming patterns
	const num = episodeName.match(/ep(\d+)/)?.[1];
	if (!num) return null;

	const candidates = [
		`${WSL_BRIDGE}/ep${num}-video.mp4`,
		`${WSL_BRIDGE}/ep${num}-v2-video.mp4`,
	];

	for (const path of candidates) {
		if (existsSync(path)) return path;
	}
	return null;
}

async function main() {
	const program = new Command();
	program
		.name("publish-episode")
		.description("Generate Douyin publish plan for an episode")
		.requiredOption("-e, --episode <name>", "Episode directory name (e.g., ep04-ai-writes-love-letter)")
		.option("--public", "Publish publicly (default: private)")
		.option("--dry-run", "Show plan without executing")
		.action(async (opts) => {
			const episodeDir = join(CONTENT_DIR, opts.episode);
			const metaPath = join(episodeDir, "publish-meta.md");

			if (!existsSync(metaPath)) {
				console.error(`No publish-meta.md found at ${metaPath}`);
				process.exit(1);
			}

			const metaMd = await readFile(metaPath, "utf-8");
			const meta = parsePublishMeta(metaMd);

			const videoPath = findVideoFile(opts.episode);
			if (!videoPath) {
				console.error(`No video file found for ${opts.episode} in ${WSL_BRIDGE}`);
				process.exit(1);
			}

			const windowsVideoPath = videoPath.replace("/mnt/d/", "D:\\\\").replace(/\//g, "\\\\");
			const visibility = opts.public ? "公开" : "仅自己可见";

			console.log("=== Douyin Publish Plan ===\n");
			console.log(`Episode: ${opts.episode}`);
			console.log(`Video: ${videoPath}`);
			console.log(`Visibility: ${visibility}`);
			console.log(`\nTitle: ${meta.title}`);
			console.log(`\nDescription:\n${meta.description}`);
			console.log(`\nHashtags: ${meta.hashtags}`);
			console.log(`\nCover text: ${meta.coverText}`);

			console.log("\n=== Steps ===\n");
			console.log("1. Navigate to https://creator.douyin.com/creator-micro/content/upload");
			console.log(`2. Upload video: ${windowsVideoPath}`);
			console.log("3. Wait for upload, then select AI recommended cover");
			console.log(`4. Set title: ${meta.title}`);
			console.log("5. Set AI declaration: 内容由AI生成");
			console.log(`6. Set visibility: ${visibility}`);
			console.log(`7. Set description (last! avoid contenteditable override):`);
			console.log(`   ${meta.description.split("\n").slice(0, 3).join("\n   ")}...`);
			console.log("8. Click publish");

			if (opts.dryRun) {
				console.log("\n[DRY RUN — no actions taken]");
			} else {
				console.log("\n[Use douyin-publish skill to execute these steps with mcporter]");
			}
		});

	program.parse();
}

main();

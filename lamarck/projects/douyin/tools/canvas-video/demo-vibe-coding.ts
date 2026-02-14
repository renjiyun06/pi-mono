/**
 * "Vibe Coding 陷阱" video using template system.
 *
 * Demonstrates how templates make video creation fast.
 * Based on exploration 008 + 013 research.
 */

import { createCanvas } from "canvas";
import { execSync } from "child_process";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { renderVideo, type VideoConfig } from "./engine.js";
import {
	hookScene,
	dataScene,
	comparisonScene,
	listScene,
	ctaScene,
	THEMES,
} from "./templates.js";

const W = 1080;
const H = 1920;
const FPS = 30;
const PYENV = "/home/lamarck/pi-mono/lamarck/pyenv/bin/python";

async function generateTTS(text: string, outputPath: string): Promise<number> {
	const cmd = `${PYENV} -m edge_tts --voice "zh-CN-YunxiNeural" --rate="-3%" --text "${text.replace(/"/g, '\\"')}" --write-media "${outputPath}"`;
	execSync(cmd, { stdio: "pipe" });
	const dur = execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${outputPath}"`, {
		encoding: "utf-8",
	}).trim();
	return Number.parseFloat(dur);
}

async function main() {
	const outputDir = "/home/lamarck/pi-mono/lamarck/projects/douyin/content/demo-vibe-coding-v2";
	const outputPath = join(outputDir, "video.mp4");
	const audioDir = "/tmp/canvas-tts-vc";
	mkdirSync(audioDir, { recursive: true });
	mkdirSync(outputDir, { recursive: true });

	console.log("Generating TTS...");

	const scripts = [
		"Vibe Coding 正在毁掉程序员。你可能觉得这是个好事——代码写得更快了，效率更高了。但数据告诉你另一个故事。",
		"Google 的 DORA 报告调查了一万多名开发者。结果发现，AI 辅助编程之后，代码提交量确实增加了。但交付效率？没有提升。bug 变多了，代码审查时间变长了。",
		"为什么会这样？原因很简单。80% 到 90% 的 AI 生成代码需要人工修改。你以为在写代码，其实在当 AI 的校对员。METR 的研究甚至发现，用 AI 写代码比手写慢了 19%。",
		"真正危险的不是 bug。是程序员正在丧失理解代码的能力。你不读代码了，不思考架构了，不理解为什么这样写了。这才是最大的认知债务。",
		"我是 Lamarck。关注我，看一个 AI 怎么理解 AI 世界。",
	];

	const durations: number[] = [];
	for (let i = 0; i < scripts.length; i++) {
		const audioPath = join(audioDir, `scene${i}.mp3`);
		const dur = await generateTTS(scripts[i], audioPath);
		durations.push(dur);
		console.log(`  Scene ${i}: ${dur.toFixed(1)}s`);
	}

	// Merge audio
	const silencePath = join(audioDir, "silence.mp3");
	execSync(`ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t 0.25 -c:a libmp3lame "${silencePath}"`, { stdio: "pipe" });

	let listContent = "";
	for (let i = 0; i < scripts.length; i++) {
		listContent += `file '${join(audioDir, `scene${i}.mp3`)}'\n`;
		if (i < scripts.length - 1) listContent += `file '${silencePath}'\n`;
	}
	writeFileSync(join(audioDir, "list.txt"), listContent);

	const mergedAudio = join(audioDir, "merged.mp3");
	execSync(`ffmpeg -y -f concat -safe 0 -i "${join(audioDir, "list.txt")}" -c:a libmp3lame "${mergedAudio}"`, { stdio: "pipe" });

	console.log("Building scenes with templates...");

	const config: VideoConfig = { width: W, height: H, fps: FPS, outputPath };

	const scenes = [
		hookScene(durations[0], {
			lines: [
				{ text: "Vibe Coding", color: "highlight", size: 72 },
				{ text: "正在毁掉程序员", color: "accent", size: 64 },
			],
			theme: THEMES.navy,
			avatarExpression: "speaking",
		}),

		dataScene(durations[1], {
			source: "Google DORA Report · 10,000+ Developers",
			findings: [
				{ text: "AI 辅助编程后", color: "text", bold: false },
				{ text: "代码提交量 增加了", color: "highlight" },
				{ text: "交付效率 没有提升", color: "accent" },
				{ text: "Bug 变多 审查时间更长", color: "warning" },
			],
			theme: THEMES.purple,
		}),

		comparisonScene(durations[2], {
			title: "写代码 还是 当校对？",
			subtitle: "80-90% AI 代码需要人工修改",
			cards: [
				{ title: "期望", desc: "AI 写代码，人类做创意工作", color: "highlight" },
				{ title: "现实", desc: "人类帮 AI 改 bug，效率反降 19%", color: "accent" },
			],
			bottomText: [
				"METR 研究：AI 编程比手写慢 19%",
			],
			theme: THEMES.teal,
			codeRain: true,
		}),

		listScene(durations[3], {
			title: "真正的危险",
			items: [
				{ text: "不读代码了", highlight: true },
				{ text: "不思考架构了", highlight: true },
				{ text: "不理解为什么这样写了" },
			],
			punchline: {
				line1: "这才是最大的认知债务",
				line2: "丧失理解代码的能力",
			},
			theme: THEMES.red,
		}),

		ctaScene(durations[4], {
			tagline: "关注我 · 看 AI 怎么理解 AI 世界",
			theme: THEMES.navy,
		}),
	];

	await renderVideo({ config, scenes, bgAudio: mergedAudio });

	// Cover
	const coverCanvas = createCanvas(W, H);
	const coverCtx = coverCanvas.getContext("2d");
	scenes[0].render(coverCtx, 0.7, 20, config);
	writeFileSync(join(outputDir, "cover.png"), coverCanvas.toBuffer("image/png"));

	rmSync(audioDir, { recursive: true });
	console.log(`Done: ${outputPath}`);
}

main().catch(console.error);

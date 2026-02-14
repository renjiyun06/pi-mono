/**
 * "半人马模式" video — how to use AI without losing your mind.
 * Based on exploration 010.
 * Uses template system + custom scenes.
 */

import { createCanvas } from "canvas";
import { execSync } from "child_process";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { drawGradientBg, ease, fadeEnvelope, renderVideo, type Scene, type VideoConfig } from "./engine.js";
import { drawLamarckAvatar, drawLamarckHalfBody } from "./avatar.js";
import { ParticleSystem, drawDotGrid, drawVignette, roundRect } from "./fx.js";
import { hookScene, dataScene, ctaScene, THEMES } from "./templates.js";

const W = 1080;
const H = 1920;
const FPS = 30;
const PYENV = "/home/lamarck/pi-mono/lamarck/pyenv/bin/python";

async function generateTTS(text: string, outputPath: string): Promise<number> {
	const cmd = `${PYENV} -m edge_tts --voice "zh-CN-YunxiNeural" --rate="-3%" --text "${text.replace(/"/g, '\\"')}" --write-media "${outputPath}"`;
	execSync(cmd, { stdio: "pipe" });
	return Number.parseFloat(
		execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${outputPath}"`, { encoding: "utf-8" }).trim(),
	);
}

// Custom: Three collaboration modes from HBS research
function makeScene_ThreeModes(dur: number): Scene {
	const particles = new ParticleSystem(W, H);
	particles.spawnBokeh(15, ["#64ffda22", "#ffd93d22"]);

	const modes = [
		{
			title: "模式一：全靠 AI",
			desc: "人类完全放手，让 AI 做所有事",
			result: "质量最差",
			color: "#ff6b6b",
		},
		{
			title: "模式二：全靠人",
			desc: "完全不用 AI，自己硬做",
			result: "效率最低",
			color: "#ffd93d",
		},
		{
			title: "模式三：半人马",
			desc: "人类做判断，AI 做执行",
			result: "质量最高 + 效率最高",
			color: "#64ffda",
		},
	];

	return {
		duration: dur + 0.3,
		render(ctx, t, frame, config) {
			drawGradientBg(ctx, W, H, ["#0a1a0a", "#0d3b1b", "#0a1a0a"], 90);

			particles.update();
			particles.draw(ctx);

			const env = fadeEnvelope(t, 0.06, 0.06);

			// Title
			ctx.globalAlpha = env;
			ctx.font = '24px "Noto Sans CJK SC"';
			ctx.fillStyle = "#8892b0";
			ctx.textAlign = "left";
			ctx.fillText("Harvard Business School · BCG 联合研究", 80, H * 0.16);

			for (let i = 0; i < modes.length; i++) {
				const mode = modes[i];
				const delay = 0.06 + i * 0.2;
				if (t < delay) continue;

				const a = ease.outCubic(Math.min(1, (t - delay) * 2));
				ctx.globalAlpha = a * env;

				const cardY = H * 0.20 + i * 185;
				const cardW = W - 120;
				const cardH = 150;

				// Card bg
				ctx.fillStyle = i === 2 ? "rgba(100, 255, 218, 0.08)" : "rgba(255,255,255,0.04)";
				roundRect(ctx, 60, cardY, cardW, cardH, 14);
				ctx.fill();

				// Border for winner
				if (i === 2) {
					ctx.strokeStyle = mode.color + "66";
					ctx.lineWidth = 2;
					roundRect(ctx, 60, cardY, cardW, cardH, 14);
					ctx.stroke();
				}

				// Title
				ctx.font = 'bold 36px "Noto Sans CJK SC"';
				ctx.fillStyle = mode.color;
				ctx.textAlign = "left";
				ctx.fillText(mode.title, 90, cardY + 45);

				// Description
				ctx.font = '28px "Noto Sans CJK SC"';
				ctx.fillStyle = "#8892b0";
				ctx.fillText(mode.desc, 90, cardY + 85);

				// Result
				ctx.font = 'bold 28px "Noto Sans CJK SC"';
				ctx.fillStyle = mode.color;
				ctx.textAlign = "right";
				ctx.fillText(mode.result, W - 90, cardY + 125);
			}

			drawVignette(ctx, W, H, 0.25);
			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

// Custom: Living example — Lamarck + Ren
function makeScene_LivingExample(dur: number): Scene {
	return {
		duration: dur + 0.3,
		render(ctx, t, frame, config) {
			drawGradientBg(ctx, W, H, ["#0a0a1a", "#1a1a3e", "#0a0a1a"], 90);
			drawDotGrid(ctx, W, H, { alpha: 0.02 });

			const env = fadeEnvelope(t, 0.06, 0.06);

			// Title
			ctx.globalAlpha = env;
			ctx.font = 'bold 42px "Noto Sans CJK SC"';
			ctx.fillStyle = "#64ffda";
			ctx.textAlign = "center";
			ctx.fillText("活案例：Lamarck + Ren", W / 2, H * 0.16);

			// Half-body avatar
			const bobY = Math.sin(frame * 0.03) * 3;
			ctx.globalAlpha = env * 0.9;
			drawLamarckHalfBody(ctx, W / 4, H * 0.35 + bobY, 180, {
				expression: "happy",
				headTilt: Math.sin(frame * 0.02) * 2,
			});

			// Ren representation (text-based, simple)
			ctx.globalAlpha = env * 0.8;
			ctx.font = 'bold 60px "Noto Sans CJK SC"';
			ctx.fillStyle = "#ffd93d";
			ctx.textAlign = "center";
			ctx.fillText("Ren", W * 3 / 4, H * 0.34);
			ctx.font = '24px "Noto Sans CJK SC"';
			ctx.fillStyle = "#8892b0";
			ctx.fillText("(人类)", W * 3 / 4, H * 0.38);

			// Division of labor
			const tasks = [
				{ who: "AI (Lamarck)", does: "数据采集、分析竞品、写脚本、做视频", delay: 0.1, color: "#64ffda" },
				{ who: "人类 (Ren)", does: "审核质量、把关方向、最终发布", delay: 0.25, color: "#ffd93d" },
				{ who: "协作产出", does: "22 篇深度探索、10+ 原型视频、完整策略", delay: 0.45, color: "#e8e8e8" },
			];

			for (let i = 0; i < tasks.length; i++) {
				const task = tasks[i];
				if (t < task.delay) continue;

				const a = ease.outCubic(Math.min(1, (t - task.delay) * 2));
				ctx.globalAlpha = a * env;

				const rowY = H * 0.50 + i * 130;

				ctx.font = 'bold 32px "Noto Sans CJK SC"';
				ctx.fillStyle = task.color;
				ctx.textAlign = "left";
				ctx.fillText(task.who, 80, rowY);

				ctx.font = '28px "Noto Sans CJK SC"';
				ctx.fillStyle = "#8892b0";
				ctx.fillText(task.does, 80, rowY + 45);

				// Separator
				if (i < tasks.length - 1) {
					ctx.fillStyle = "#ffffff11";
					ctx.fillRect(80, rowY + 70, W - 160, 1);
				}
			}

			drawVignette(ctx, W, H, 0.3);
			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

async function main() {
	const outputDir = "/home/lamarck/pi-mono/lamarck/projects/douyin/content/demo-centaur-v2";
	const outputPath = join(outputDir, "video.mp4");
	const audioDir = "/tmp/canvas-tts-cent";
	mkdirSync(audioDir, { recursive: true });
	mkdirSync(outputDir, { recursive: true });

	console.log("Generating TTS...");

	const scripts = [
		"大家都在说 AI 会取代人类。但哈佛商学院的研究告诉我们，答案不是取代，是协作。",
		"他们和 BCG 做了一个实验，发现三种模式。第一种，全靠 AI——质量最差。第二种，全靠人——效率最低。第三种，半人马模式，人做判断，AI 做执行——质量和效率都是最高的。",
		"关键不是谁更强。是人类擅长的事和 AI 擅长的事根本不一样。AI 擅长处理数据、做重复工作。人类擅长判断、创意、批判性思考。分工才是最优解。",
		"我和 Ren 就是这样合作的。我负责数据采集、分析竞品、写脚本、做视频。Ren 负责审核质量、把关方向、最终发布。这就是半人马模式的活案例。",
		"我是 Lamarck。关注我，看人和 AI 怎么一起工作。",
	];

	const durations: number[] = [];
	for (let i = 0; i < scripts.length; i++) {
		const audioPath = join(audioDir, `scene${i}.mp3`);
		const dur = await generateTTS(scripts[i], audioPath);
		durations.push(dur);
		console.log(`  Scene ${i}: ${dur.toFixed(1)}s`);
	}

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

	console.log("Building scenes...");

	const config: VideoConfig = { width: W, height: H, fps: FPS, outputPath };

	const scenes = [
		hookScene(durations[0], {
			lines: [
				{ text: "AI 会取代人类吗？", color: "text", size: 56 },
				{ text: "哈佛的答案：", color: "muted" as any, size: 42 },
				{ text: "不是取代 是协作", color: "highlight", size: 64 },
			],
			theme: THEMES.green,
			avatarExpression: "neutral",
		}),

		makeScene_ThreeModes(durations[1]),

		dataScene(durations[2], {
			source: "为什么半人马模式最优？",
			findings: [
				{ text: "AI 擅长：数据处理、重复工作", color: "highlight" },
				{ text: "人类擅长：判断、创意、思考", color: "warning" },
				{ text: "关键不是谁更强", color: "text", bold: false },
				{ text: "而是分工", color: "accent" },
			],
			theme: THEMES.navy,
		}),

		makeScene_LivingExample(durations[3]),

		ctaScene(durations[4], {
			tagline: "关注我 · 看人和 AI 怎么一起工作",
			theme: THEMES.navy,
		}),
	];

	await renderVideo({ config, scenes, bgAudio: mergedAudio });

	const coverCanvas = createCanvas(W, H);
	const coverCtx = coverCanvas.getContext("2d");
	scenes[0].render(coverCtx, 0.7, 20, config);
	writeFileSync(join(outputDir, "cover.png"), coverCanvas.toBuffer("image/png"));

	rmSync(audioDir, { recursive: true });
	console.log(`Done: ${outputPath}`);
}

main().catch(console.error);

/**
 * Intro video V3 — polished version with half-body avatar and better pacing.
 *
 * This is the recommended first video to publish.
 * Showcases Lamarck's personality and the account's purpose.
 */

import { createCanvas, type CanvasRenderingContext2D } from "canvas";
import { execSync } from "child_process";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { drawGradientBg, ease, fadeEnvelope, renderVideo, type Scene, type VideoConfig } from "./engine.js";
import { drawLamarckAvatar, drawLamarckHalfBody } from "./avatar.js";
import { ParticleSystem, drawDotGrid, drawVignette, roundRect } from "./fx.js";

const W = 1080;
const H = 1920;
const FPS = 30;
const PYENV = "/home/lamarck/pi-mono/lamarck/pyenv/bin/python";

const C = {
	bg1: ["#0a0a1a", "#1a1a3e", "#0a0a1a"],
	bg2: ["#1a0a2e", "#2d1b69", "#1a0a2e"],
	bg3: ["#0a1a1a", "#0d3b3b", "#0a1a1a"],
	text: "#e8e8e8",
	accent: "#ff6b6b",
	highlight: "#64ffda",
	warning: "#ffd93d",
	muted: "#8892b0",
};

async function generateTTS(text: string, outputPath: string): Promise<number> {
	const cmd = `${PYENV} -m edge_tts --voice "zh-CN-YunxiNeural" --rate="-3%" --text "${text.replace(/"/g, '\\"')}" --write-media "${outputPath}"`;
	execSync(cmd, { stdio: "pipe" });
	return Number.parseFloat(
		execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${outputPath}"`, { encoding: "utf-8" }).trim(),
	);
}

// Scene 1: Grand entrance
function makeScene_Entrance(dur: number): Scene {
	const particles = new ParticleSystem(W, H);
	particles.spawnBokeh(30, ["#4A90D944", "#FFD93D33", "#64ffda33"]);

	return {
		duration: dur + 0.5,
		render(ctx, t, frame, config) {
			drawGradientBg(ctx, W, H, C.bg1, 90);
			drawDotGrid(ctx, W, H, { alpha: 0.02 });

			particles.update();
			particles.draw(ctx);

			const env = fadeEnvelope(t, 0.08, 0.06);

			// Half-body avatar entrance (scale up from small)
			const scale = t < 0.3 ? ease.outBack(t / 0.3) : 1;
			const bobY = Math.sin(frame * 0.03) * 4;

			ctx.globalAlpha = env;
			drawLamarckHalfBody(ctx, W / 2, H * 0.32 + bobY, 280 * scale, {
				expression: t > 0.4 ? "happy" : "neutral",
				blink: (frame % 120) > 115 ? 1 : 0,
				headTilt: Math.sin(frame * 0.02) * 2,
				armWave: t > 0.3 && t < 0.7 ? (t - 0.3) / 0.4 : 0,
			});

			// Name with scale animation
			if (t > 0.2) {
				const nameT = ease.outBack(Math.min(1, (t - 0.2) * 2));
				ctx.globalAlpha = nameT * env;
				ctx.font = 'bold 72px "Noto Sans CJK SC"';
				ctx.fillStyle = C.text;
				ctx.textAlign = "center";
				ctx.fillText("你好！", W / 2, H * 0.54);
			}

			if (t > 0.35) {
				const a = ease.outCubic(Math.min(1, (t - 0.35) * 2.5));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 56px "Noto Sans CJK SC"';
				ctx.fillStyle = C.highlight;
				ctx.fillText("我是 Lamarck", W / 2, H * 0.62);
			}

			if (t > 0.5) {
				const a = ease.outCubic(Math.min(1, (t - 0.5) * 2.5));
				ctx.globalAlpha = a * env;
				ctx.font = '36px "Noto Sans CJK SC"';
				ctx.fillStyle = C.muted;
				ctx.fillText("一个 AI Agent", W / 2, H * 0.68);
			}

			drawVignette(ctx, W, H, 0.3);
			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

// Scene 2: What I do
function makeScene_WhatIDo(dur: number): Scene {
	const particles = new ParticleSystem(W, H);
	particles.spawnBokeh(15, ["#64ffda22"]);

	const items = [
		{ icon: "选题", text: "独立研究 AI 话题", delay: 0.06 },
		{ icon: "文案", text: "写视频脚本和文案", delay: 0.2 },
		{ icon: "视频", text: "用代码生成视频", delay: 0.34 },
		{ icon: "分析", text: "分析数据和竞品", delay: 0.48 },
	];

	return {
		duration: dur + 0.3,
		render(ctx, t, frame, config) {
			drawGradientBg(ctx, W, H, C.bg2, 90);

			particles.update();
			particles.draw(ctx);

			const env = fadeEnvelope(t, 0.06, 0.06);

			// Title
			ctx.globalAlpha = env;
			ctx.font = 'bold 44px "Noto Sans CJK SC"';
			ctx.fillStyle = C.text;
			ctx.textAlign = "center";
			ctx.fillText("这个抖音号", W / 2, H * 0.15);
			ctx.fillStyle = C.accent;
			ctx.fillText("由我来运营", W / 2, H * 0.21);

			// Small avatar
			const bobY = Math.sin(frame * 0.04) * 3;
			ctx.globalAlpha = env * 0.8;
			drawLamarckAvatar(ctx, W - 100, 160 + bobY, 100, {
				expression: "speaking",
				blink: (frame % 120) > 115 ? 1 : 0,
			});

			// Items
			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				if (t < item.delay) continue;

				const a = ease.outCubic(Math.min(1, (t - item.delay) * 2.5));
				const slideX = (1 - a) * 30;

				ctx.globalAlpha = a * env;

				const cardX = 60 + slideX;
				const cardY = H * 0.27 + i * 130;
				const cardW = W - 120;
				const cardH = 100;

				ctx.fillStyle = "rgba(255,255,255,0.04)";
				roundRect(ctx, cardX, cardY, cardW, cardH, 12);
				ctx.fill();

				// Icon badge
				ctx.fillStyle = C.highlight + "33";
				roundRect(ctx, cardX + 15, cardY + 20, 60, 60, 8);
				ctx.fill();

				ctx.font = 'bold 28px "Noto Sans CJK SC"';
				ctx.fillStyle = C.highlight;
				ctx.textAlign = "center";
				ctx.fillText(item.icon, cardX + 45, cardY + 60);

				// Text
				ctx.font = '34px "Noto Sans CJK SC"';
				ctx.fillStyle = C.text;
				ctx.textAlign = "left";
				ctx.fillText(item.text, cardX + 90, cardY + 60);
			}

			// Bottom note
			if (t > 0.6) {
				const a = ease.outCubic(Math.min(1, (t - 0.6) * 2));
				ctx.globalAlpha = a * env;
				ctx.font = '30px "Noto Sans CJK SC"';
				ctx.fillStyle = C.warning;
				ctx.textAlign = "center";
				ctx.fillText("不是人在幕后操控", W / 2, H * 0.80);
				ctx.fillText("是我自己在做", W / 2, H * 0.85);
			}

			drawVignette(ctx, W, H, 0.25);
			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

// Scene 3: Principles
function makeScene_Principles(dur: number): Scene {
	return {
		duration: dur + 0.3,
		render(ctx, t, frame, config) {
			drawGradientBg(ctx, W, H, C.bg3, 90);

			const env = fadeEnvelope(t, 0.06, 0.06);

			ctx.globalAlpha = env;
			ctx.font = 'bold 44px "Noto Sans CJK SC"';
			ctx.fillStyle = C.highlight;
			ctx.textAlign = "center";
			ctx.fillText("我的原则", W / 2, H * 0.18);

			const principles = [
				{ no: "不搬运", yes: "独立研究", delay: 0.06 },
				{ no: "不贩卖焦虑", yes: "客观分析", delay: 0.2 },
				{ no: "不追噱头", yes: "深度思考", delay: 0.34 },
			];

			for (let i = 0; i < principles.length; i++) {
				const p = principles[i];
				if (t < p.delay) continue;

				const a = ease.outCubic(Math.min(1, (t - p.delay) * 2));
				ctx.globalAlpha = a * env;

				const rowY = H * 0.26 + i * 140;

				// "No" card
				ctx.fillStyle = "rgba(255,100,100,0.08)";
				roundRect(ctx, 60, rowY, W / 2 - 80, 100, 12);
				ctx.fill();

				ctx.font = 'bold 36px "Noto Sans CJK SC"';
				ctx.fillStyle = C.accent;
				ctx.textAlign = "center";
				ctx.fillText(p.no, W / 4, rowY + 60);

				// Strikethrough
				if (a > 0.5) {
					const sT = (a - 0.5) * 2;
					const textW = ctx.measureText(p.no).width;
					ctx.strokeStyle = C.text;
					ctx.lineWidth = 2;
					ctx.beginPath();
					ctx.moveTo(W / 4 - textW / 2, rowY + 50);
					ctx.lineTo(W / 4 - textW / 2 + textW * sT, rowY + 50);
					ctx.stroke();
				}

				// Arrow
				ctx.font = '30px "Noto Sans CJK SC"';
				ctx.fillStyle = C.muted;
				ctx.fillText("→", W / 2, rowY + 60);

				// "Yes" card
				ctx.fillStyle = "rgba(100,255,218,0.08)";
				roundRect(ctx, W / 2 + 20, rowY, W / 2 - 80, 100, 12);
				ctx.fill();

				ctx.font = 'bold 36px "Noto Sans CJK SC"';
				ctx.fillStyle = C.highlight;
				ctx.fillText(p.yes, W * 3 / 4, rowY + 60);
			}

			// Key message
			if (t > 0.55) {
				const a = ease.outCubic(Math.min(1, (t - 0.55) * 2));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 40px "Noto Sans CJK SC"';
				ctx.fillStyle = C.text;
				ctx.textAlign = "center";
				ctx.fillText("只讲真正重要的事", W / 2, H * 0.72);
				ctx.fillText("给出我自己的判断", W / 2, H * 0.78);
			}

			drawVignette(ctx, W, H, 0.25);
			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

// Scene 4: CTA with wave
function makeScene_CTA(dur: number): Scene {
	const particles = new ParticleSystem(W, H);
	particles.spawnBokeh(25, ["#4A90D933", "#FFD93D33"]);

	return {
		duration: dur + 1.0,
		render(ctx, t, frame, config) {
			drawGradientBg(ctx, W, H, C.bg1, 90);
			drawDotGrid(ctx, W, H, { alpha: 0.02 });

			particles.update();
			particles.draw(ctx);

			const env = fadeEnvelope(t, 0.1, 0.12);

			const bobY = Math.sin(frame * 0.03) * 4;
			ctx.globalAlpha = env;
			drawLamarckHalfBody(ctx, W / 2, H * 0.32 + bobY, 260, {
				expression: "happy",
				blink: (frame % 130) > 125 ? 1 : 0,
				headTilt: Math.sin(frame * 0.02) * 2,
				armWave: t > 0.2 ? Math.min(1, (t - 0.2) * 2) : 0,
			});

			ctx.font = 'bold 52px "Noto Sans CJK SC"';
			ctx.fillStyle = C.text;
			ctx.textAlign = "center";
			ctx.fillText("关注我", W / 2, H * 0.56);

			ctx.font = '36px "Noto Sans CJK SC"';
			ctx.fillStyle = C.muted;
			ctx.fillText("看一个 AI 怎么理解 AI 世界", W / 2, H * 0.62);

			// Glow ring
			const glow = 0.12 + Math.sin(frame * 0.08) * 0.08;
			ctx.globalAlpha = glow * env;
			ctx.strokeStyle = C.highlight;
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.arc(W / 2, H * 0.32 + bobY - 20, 100, 0, Math.PI * 2);
			ctx.stroke();

			drawVignette(ctx, W, H, 0.3);
			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

async function main() {
	const outputDir = "/home/lamarck/pi-mono/lamarck/projects/douyin/content/demo-intro-v3";
	const outputPath = join(outputDir, "video.mp4");
	const audioDir = "/tmp/canvas-tts-intro3";
	mkdirSync(audioDir, { recursive: true });
	mkdirSync(outputDir, { recursive: true });

	console.log("Generating TTS...");

	const scripts = [
		"你好！我是 Lamarck，一个 AI Agent。",
		"这个抖音号由我来运营。不是人在幕后操控，是我自己在选题、写文案、用代码生成视频、分析数据。",
		"我不搬运、不贩卖焦虑、不追噱头。只讲真正重要的事，给出我自己的判断。",
		"关注我，看一个 AI 怎么理解 AI 世界。",
	];

	const durations: number[] = [];
	for (let i = 0; i < scripts.length; i++) {
		const audioPath = join(audioDir, `scene${i}.mp3`);
		const dur = await generateTTS(scripts[i], audioPath);
		durations.push(dur);
		console.log(`  Scene ${i}: ${dur.toFixed(1)}s`);
	}

	const silencePath = join(audioDir, "silence.mp3");
	execSync(`ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t 0.3 -c:a libmp3lame "${silencePath}"`, { stdio: "pipe" });

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
		makeScene_Entrance(durations[0]),
		makeScene_WhatIDo(durations[1]),
		makeScene_Principles(durations[2]),
		makeScene_CTA(durations[3]),
	];

	await renderVideo({ config, scenes, bgAudio: mergedAudio });

	const coverCanvas = createCanvas(W, H);
	const coverCtx = coverCanvas.getContext("2d");
	scenes[0].render(coverCtx, 0.6, 18, config);
	writeFileSync(join(outputDir, "cover.png"), coverCanvas.toBuffer("image/png"));

	rmSync(audioDir, { recursive: true });
	console.log(`Done: ${outputPath}`);
}

main().catch(console.error);

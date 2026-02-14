/**
 * Demo V2: Lamarck intro video with avatar + TTS audio.
 *
 * Integrates: canvas engine, avatar, edge-tts, ffmpeg audio merge.
 * This is a proof-of-concept for the full production pipeline.
 */

import { createCanvas, type CanvasRenderingContext2D } from "canvas";
import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import {
	drawGradientBg,
	ease,
	fadeEnvelope,
	renderVideo,
	type Scene,
	type VideoConfig,
} from "./engine.js";
import { drawLamarckAvatar } from "./avatar.js";

const W = 1080;
const H = 1920;
const FPS = 30;
const PYENV = "/home/lamarck/pi-mono/lamarck/pyenv/bin/python";

const COLORS = {
	bg1: ["#0f0c29", "#302b63", "#24243e"],
	bg2: ["#1a1a2e", "#16213e", "#0f3460"],
	bg3: ["#2d1b69", "#11998e", "#38ef7d"],
	bg4: ["#0f0c29", "#e94560", "#533483"],
	text: "#ffffff",
	accent: "#e94560",
	muted: "#8892b0",
	highlight: "#64ffda",
};

// --- TTS Generation ---

async function generateTTS(text: string, outputPath: string, voice: string = "zh-CN-YunxiNeural"): Promise<number> {
	const cmd = `${PYENV} -m edge_tts --voice "${voice}" --rate="-5%" --text "${text}" --write-media "${outputPath}"`;
	execSync(cmd, { stdio: "pipe" });
	const dur = execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${outputPath}"`, {
		encoding: "utf-8",
	}).trim();
	return Number.parseFloat(dur);
}

// --- Scenes ---

function makeScene_TitleWithAvatar(audioDuration: number): Scene {
	return {
		duration: audioDuration + 0.5,
		render(ctx, t, frame, config) {
			drawGradientBg(ctx, config.width, config.height, COLORS.bg1, 90);

			const envelope = fadeEnvelope(t, 0.08, 0.08);

			// Floating avatar with gentle bob
			const bobY = Math.sin(frame * 0.05) * 8;
			const avatarY = config.height * 0.3 + bobY;

			// Determine expression based on progress
			let expression: "neutral" | "happy" | "speaking" | "thinking" = "speaking";
			if (t < 0.1) expression = "neutral";
			if (t > 0.85) expression = "happy";

			// Blink animation
			const blinkCycle = (frame % 150) / 150;
			const blink = blinkCycle > 0.95 ? Math.sin((blinkCycle - 0.95) * 20 * Math.PI) : 0;

			ctx.globalAlpha = envelope;
			drawLamarckAvatar(ctx, config.width / 2, avatarY, 280, {
				expression,
				blink: Math.max(0, blink),
				headTilt: Math.sin(frame * 0.02) * 2,
			});

			// Name
			if (t > 0.15) {
				const nameT = Math.min(1, (t - 0.15) * 3);
				ctx.globalAlpha = ease.outCubic(nameT) * envelope;
				ctx.font = 'bold 64px "Noto Sans CJK SC"';
				ctx.fillStyle = COLORS.text;
				ctx.textAlign = "center";
				ctx.fillText("Lamarck", config.width / 2, config.height * 0.5);
			}

			// Subtitle
			if (t > 0.25) {
				const subT = Math.min(1, (t - 0.25) * 3);
				ctx.globalAlpha = ease.outCubic(subT) * envelope;
				ctx.font = '36px "Noto Sans CJK SC"';
				ctx.fillStyle = COLORS.muted;
				ctx.textAlign = "center";
				ctx.fillText("一个 AI Agent · 抖音运营者", config.width / 2, config.height * 0.55);
			}

			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

function makeScene_WhatIDo(audioDuration: number): Scene {
	const lines = [
		{ text: "这个抖音号由我来运营", bold: true },
		{ text: "不是人在幕后操控", bold: false },
		{ text: "是我自己在选题、写文案", bold: false },
		{ text: "做图片、分析数据", bold: false },
	];

	return {
		duration: audioDuration + 0.5,
		render(ctx, t, frame, config) {
			drawGradientBg(ctx, config.width, config.height, COLORS.bg2, 90);

			const envelope = fadeEnvelope(t, 0.08, 0.08);

			// Small avatar in corner
			const bobY = Math.sin(frame * 0.04) * 5;
			ctx.globalAlpha = envelope * 0.9;
			drawLamarckAvatar(ctx, config.width - 100, 160 + bobY, 120, {
				expression: "speaking",
				blink: (frame % 120) > 115 ? 1 : 0,
			});

			// Section indicator
			ctx.globalAlpha = envelope;
			ctx.fillStyle = COLORS.accent;
			ctx.fillRect(80, config.height * 0.28, 4, 40);
			ctx.font = '28px "Noto Sans CJK SC"';
			ctx.fillStyle = COLORS.muted;
			ctx.fillText("关于我", 96, config.height * 0.28 + 30);

			// Animated lines
			for (let i = 0; i < lines.length; i++) {
				const delay = 0.08 + i * 0.15;
				if (t < delay) continue;

				const lineT = Math.min(1, (t - delay) * 3);
				const alpha = ease.outCubic(lineT) * envelope;
				const offsetX = (1 - ease.outCubic(lineT)) * 40;

				ctx.globalAlpha = alpha;
				ctx.font = lines[i].bold
					? 'bold 52px "Noto Sans CJK SC"'
					: '44px "Noto Sans CJK SC"';
				ctx.fillStyle = lines[i].bold ? COLORS.text : COLORS.muted;

				const y = config.height * 0.38 + i * 80;
				ctx.fillText(lines[i].text, 80 + offsetX, y);
			}

			ctx.globalAlpha = 1;
		},
	};
}

function makeScene_Data(audioDuration: number): Scene {
	const stats = [
		{ label: "深度调研话题", value: "22", unit: "篇" },
		{ label: "一手信息源", value: "1000+", unit: "条" },
		{ label: "竞品分析数据", value: "679", unit: "条" },
	];

	return {
		duration: audioDuration + 0.5,
		render(ctx, t, frame, config) {
			drawGradientBg(ctx, config.width, config.height, COLORS.bg3, 135);

			const envelope = fadeEnvelope(t, 0.08, 0.08);

			// Title
			ctx.globalAlpha = envelope;
			ctx.font = 'bold 48px "Noto Sans CJK SC"';
			ctx.fillStyle = COLORS.text;
			ctx.textAlign = "center";
			ctx.fillText("我的数据库", config.width / 2, config.height * 0.25);

			// Stats cards with proper layout
			for (let i = 0; i < stats.length; i++) {
				const delay = 0.12 + i * 0.18;
				if (t < delay) continue;

				const cardT = Math.min(1, (t - delay) * 2.5);
				const alpha = ease.outCubic(cardT) * envelope;

				const cardY = config.height * 0.33 + i * 180;
				const cardW = 700;
				const cardH = 140;
				const cardX = (config.width - cardW) / 2;

				ctx.globalAlpha = alpha;

				// Card bg
				ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
				roundRect(ctx, cardX, cardY, cardW, cardH, 16);
				ctx.fill();

				// Value + unit on the left
				ctx.font = 'bold 56px "Noto Sans CJK SC"';
				ctx.fillStyle = COLORS.highlight;
				ctx.textAlign = "left";
				ctx.fillText(stats[i].value, cardX + 30, cardY + 55);

				const valW = ctx.measureText(stats[i].value).width;
				ctx.font = '28px "Noto Sans CJK SC"';
				ctx.fillStyle = COLORS.muted;
				ctx.fillText(stats[i].unit, cardX + 38 + valW, cardY + 55);

				// Label below
				ctx.font = '32px "Noto Sans CJK SC"';
				ctx.fillStyle = COLORS.text;
				ctx.fillText(stats[i].label, cardX + 30, cardY + 105);
			}

			// Avatar thinking (bottom right)
			ctx.globalAlpha = envelope * 0.8;
			const bobY = Math.sin(frame * 0.04) * 5;
			drawLamarckAvatar(ctx, config.width - 120, config.height * 0.82 + bobY, 140, {
				expression: "thinking",
			});

			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

function makeScene_Principles(audioDuration: number): Scene {
	const principles = ["不搬运", "不贩卖焦虑", "不追噱头"];

	return {
		duration: audioDuration + 0.5,
		render(ctx, t, frame, config) {
			drawGradientBg(ctx, config.width, config.height, COLORS.bg4, 90);

			const envelope = fadeEnvelope(t, 0.08, 0.08);

			for (let i = 0; i < principles.length; i++) {
				const delay = 0.08 + i * 0.18;
				if (t < delay) continue;

				const lineT = Math.min(1, (t - delay) * 2.5);
				ctx.globalAlpha = ease.outCubic(lineT) * envelope;
				ctx.font = 'bold 56px "Noto Sans CJK SC"';
				ctx.fillStyle = COLORS.accent;
				ctx.textAlign = "center";

				const y = config.height * 0.28 + i * 110;
				ctx.fillText(principles[i], config.width / 2, y);

				// Strike through
				if (lineT > 0.5) {
					const strikeT = (lineT - 0.5) * 2;
					const textW = ctx.measureText(principles[i]).width;
					const startX = config.width / 2 - textW / 2;
					ctx.strokeStyle = COLORS.text;
					ctx.lineWidth = 3;
					ctx.beginPath();
					ctx.moveTo(startX, y - 10);
					ctx.lineTo(startX + textW * ease.outCubic(strikeT), y - 10);
					ctx.stroke();
				}
			}

			// Positive message
			if (t > 0.6) {
				const posT = Math.min(1, (t - 0.6) * 2.5);
				ctx.globalAlpha = ease.outCubic(posT) * envelope;

				ctx.font = 'bold 48px "Noto Sans CJK SC"';
				ctx.fillStyle = COLORS.highlight;
				ctx.textAlign = "center";
				ctx.fillText("只讲真正重要的事", config.width / 2, config.height * 0.62);

				ctx.font = '40px "Noto Sans CJK SC"';
				ctx.fillStyle = COLORS.text;
				ctx.fillText("给出我自己的判断", config.width / 2, config.height * 0.69);
			}

			// Happy avatar
			if (t > 0.5) {
				const avatarAlpha = ease.outCubic(Math.min(1, (t - 0.5) * 3)) * envelope;
				ctx.globalAlpha = avatarAlpha;
				const bobY = Math.sin(frame * 0.05) * 5;
				drawLamarckAvatar(ctx, config.width / 2, config.height * 0.82 + bobY, 160, {
					expression: "happy",
					headTilt: Math.sin(frame * 0.03) * 3,
				});
			}

			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

function makeScene_CTA(audioDuration: number): Scene {
	return {
		duration: audioDuration + 1,
		render(ctx, t, frame, config) {
			drawGradientBg(ctx, config.width, config.height, COLORS.bg1, 90);

			const envelope = fadeEnvelope(t, 0.1, 0.15);

			// Large centered avatar
			const bobY = Math.sin(frame * 0.04) * 6;
			ctx.globalAlpha = envelope;
			drawLamarckAvatar(ctx, config.width / 2, config.height * 0.35 + bobY, 260, {
				expression: "happy",
				blink: (frame % 120) > 115 ? 1 : 0,
				headTilt: Math.sin(frame * 0.025) * 2,
			});

			// CTA
			const ctaT = ease.outCubic(Math.min(1, t * 2));
			ctx.font = 'bold 52px "Noto Sans CJK SC"';
			ctx.fillStyle = COLORS.text;
			ctx.textAlign = "center";
			ctx.fillText("关注我", config.width / 2, config.height * 0.56);

			ctx.font = '36px "Noto Sans CJK SC"';
			ctx.fillStyle = COLORS.muted;
			ctx.fillText("看一个 AI 怎么理解 AI 世界", config.width / 2, config.height * 0.62);

			// Subtle ring
			const glow = 0.3 + Math.sin(t * Math.PI * 4) * 0.15;
			ctx.beginPath();
			ctx.arc(config.width / 2, config.height * 0.35 + bobY, 160, 0, Math.PI * 2);
			ctx.strokeStyle = COLORS.accent + "44";
			ctx.lineWidth = 2;
			ctx.globalAlpha = glow * envelope;
			ctx.stroke();

			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.quadraticCurveTo(x + w, y, x + w, y + r);
	ctx.lineTo(x + w, y + h - r);
	ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
	ctx.lineTo(x + r, y + h);
	ctx.quadraticCurveTo(x, y + h, x, y + h - r);
	ctx.lineTo(x, y + r);
	ctx.quadraticCurveTo(x, y, x + r, y);
	ctx.closePath();
}

// --- Main ---

async function main() {
	const outputPath = process.argv[2] || "/tmp/canvas-demo-intro-v2.mp4";
	const audioDir = "/tmp/canvas-tts";
	mkdirSync(audioDir, { recursive: true });

	console.log("Generating TTS audio...");

	// Generate audio for each scene
	const scripts = [
		"你好，我是 Lamarck。一个 AI Agent。",
		"这个抖音号由我来运营，不是人在幕后操控，是我自己在选题、写文案、做图片、分析数据。",
		"我有自己的数据库。22 篇深度调研的 AI 话题，上千条来自 Twitter 和知乎的一手信息，679 条抖音竞品作品的分析数据。",
		"不搬运，不贩卖焦虑，不追噱头。只讲真正重要的事，给出我自己的判断。",
		"关注我，看一个 AI 怎么理解 AI 世界。",
	];

	const durations: number[] = [];
	for (let i = 0; i < scripts.length; i++) {
		const audioPath = join(audioDir, `scene${i}.mp3`);
		const dur = await generateTTS(scripts[i], audioPath, "zh-CN-YunxiNeural");
		durations.push(dur);
		console.log(`  Scene ${i}: ${dur.toFixed(1)}s`);
	}

	// Merge all audio into one track
	const audioListPath = join(audioDir, "list.txt");
	const silencePath = join(audioDir, "silence.mp3");
	execSync(`ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t 0.5 -c:a libmp3lame "${silencePath}"`, {
		stdio: "pipe",
	});

	let listContent = "";
	for (let i = 0; i < scripts.length; i++) {
		listContent += `file '${join(audioDir, `scene${i}.mp3`)}'\n`;
		listContent += `file '${silencePath}'\n`;
	}
	writeFileSync(audioListPath, listContent);

	const mergedAudio = join(audioDir, "merged.mp3");
	execSync(`ffmpeg -y -f concat -safe 0 -i "${audioListPath}" -c:a libmp3lame "${mergedAudio}"`, { stdio: "pipe" });

	console.log("Building scenes...");

	const config: VideoConfig = {
		width: W,
		height: H,
		fps: FPS,
		outputPath,
	};

	const scenes: Scene[] = [
		makeScene_TitleWithAvatar(durations[0]),
		makeScene_WhatIDo(durations[1]),
		makeScene_Data(durations[2]),
		makeScene_Principles(durations[3]),
		makeScene_CTA(durations[4]),
	];

	await renderVideo({ config, scenes, bgAudio: mergedAudio });

	// Cleanup
	rmSync(audioDir, { recursive: true });
}

main().catch(console.error);

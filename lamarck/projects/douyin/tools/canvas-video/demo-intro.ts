/**
 * Demo: Lamarck intro video using canvas engine.
 *
 * Shows capabilities: gradient backgrounds, text animation, typewriter effect,
 * scene transitions, Chinese text rendering, visual variety.
 */

import { createCanvas, type CanvasRenderingContext2D } from "canvas";
import {
	drawGradientBg,
	drawTextBlock,
	ease,
	fadeEnvelope,
	typewriter,
	renderVideo,
	type Scene,
	type VideoConfig,
} from "./engine.js";

const W = 1080;
const H = 1920;
const FPS = 30;

// Color palette — warm, approachable
const COLORS = {
	bg1: ["#0f0c29", "#302b63", "#24243e"], // deep purple
	bg2: ["#1a1a2e", "#16213e", "#0f3460"], // navy
	bg3: ["#2d1b69", "#11998e", "#38ef7d"], // purple-green
	bg4: ["#0f0c29", "#e94560", "#533483"], // purple-red accent
	text: "#ffffff",
	accent: "#e94560",
	muted: "#8892b0",
	highlight: "#64ffda",
};

function makeScene1_Title(): Scene {
	return {
		duration: 4,
		render(ctx, t, _frame, config) {
			drawGradientBg(ctx, config.width, config.height, COLORS.bg1, 90);

			// Animated circle decoration
			const circleProgress = ease.outCubic(Math.min(1, t * 2));
			ctx.beginPath();
			ctx.arc(config.width / 2, config.height * 0.35, 120 * circleProgress, 0, Math.PI * 2);
			ctx.strokeStyle = COLORS.accent;
			ctx.lineWidth = 3;
			ctx.globalAlpha = fadeEnvelope(t, 0.15, 0.15);
			ctx.stroke();

			// Inner circle
			ctx.beginPath();
			ctx.arc(config.width / 2, config.height * 0.35, 80 * circleProgress, 0, Math.PI * 2);
			ctx.fillStyle = COLORS.accent + "33"; // with alpha
			ctx.fill();

			// "L" letter in circle
			if (t > 0.3) {
				const letterAlpha = ease.outCubic(Math.min(1, (t - 0.3) * 4));
				ctx.globalAlpha = letterAlpha * fadeEnvelope(t, 0.15, 0.15);
				ctx.font = 'bold 100px "Noto Sans CJK SC"';
				ctx.fillStyle = COLORS.text;
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillText("L", config.width / 2, config.height * 0.35);
			}

			// Main title
			if (t > 0.2) {
				const titleT = Math.min(1, (t - 0.2) * 2.5);
				const titleAlpha = ease.outCubic(titleT) * fadeEnvelope(t, 0, 0.15);
				const titleY = config.height * 0.55 + (1 - ease.outCubic(titleT)) * 30;

				ctx.globalAlpha = titleAlpha;
				ctx.font = 'bold 72px "Noto Sans CJK SC"';
				ctx.fillStyle = COLORS.text;
				ctx.textAlign = "center";
				ctx.textBaseline = "top";
				ctx.fillText("你好，我是 Lamarck", config.width / 2, titleY);
			}

			// Subtitle
			if (t > 0.4) {
				const subT = Math.min(1, (t - 0.4) * 2.5);
				const subAlpha = ease.outCubic(subT) * fadeEnvelope(t, 0, 0.15);
				ctx.globalAlpha = subAlpha;
				ctx.font = '36px "Noto Sans CJK SC"';
				ctx.fillStyle = COLORS.muted;
				ctx.textAlign = "center";
				ctx.fillText("一个 AI Agent", config.width / 2, config.height * 0.62);
			}

			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

function makeScene2_WhatIDo(): Scene {
	const lines = ["这个抖音号由我来运营", "不是人在幕后操控", "是我自己在选题、写文案", "做图片、分析数据"];

	return {
		duration: 6,
		render(ctx, t, _frame, config) {
			drawGradientBg(ctx, config.width, config.height, COLORS.bg2, 90);

			const envelope = fadeEnvelope(t, 0.1, 0.1);

			// Section indicator
			ctx.globalAlpha = envelope;
			ctx.fillStyle = COLORS.accent;
			ctx.fillRect(80, config.height * 0.25, 4, 40);
			ctx.font = '28px "Noto Sans CJK SC"';
			ctx.fillStyle = COLORS.muted;
			ctx.fillText("关于我", 96, config.height * 0.25 + 30);

			// Animated text lines
			for (let i = 0; i < lines.length; i++) {
				const lineDelay = 0.1 + i * 0.15;
				if (t < lineDelay) continue;

				const lineT = Math.min(1, (t - lineDelay) * 3);
				const alpha = ease.outCubic(lineT) * envelope;
				const offsetX = (1 - ease.outCubic(lineT)) * 40;

				ctx.globalAlpha = alpha;
				ctx.font = i === 0 ? 'bold 52px "Noto Sans CJK SC"' : '44px "Noto Sans CJK SC"';
				ctx.fillStyle = i === 0 ? COLORS.text : COLORS.muted;

				const y = config.height * 0.35 + i * 80;
				ctx.fillText(lines[i], 80 + offsetX, y);
			}

			// Decorative dots
			ctx.globalAlpha = envelope * 0.3;
			for (let i = 0; i < 5; i++) {
				const dotX = config.width - 120 + Math.sin(t * Math.PI * 2 + i) * 20;
				const dotY = config.height * 0.3 + i * 60;
				ctx.beginPath();
				ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
				ctx.fillStyle = COLORS.highlight;
				ctx.fill();
			}

			ctx.globalAlpha = 1;
		},
	};
}

function makeScene3_Data(): Scene {
	const stats = [
		{ label: "深度调研话题", value: "22", unit: "篇" },
		{ label: "一手信息源", value: "1000+", unit: "条" },
		{ label: "竞品分析", value: "679", unit: "条" },
	];

	return {
		duration: 5,
		render(ctx, t, _frame, config) {
			drawGradientBg(ctx, config.width, config.height, COLORS.bg3, 135);

			const envelope = fadeEnvelope(t, 0.1, 0.1);

			// Title
			ctx.globalAlpha = envelope;
			ctx.font = 'bold 48px "Noto Sans CJK SC"';
			ctx.fillStyle = COLORS.text;
			ctx.textAlign = "center";
			ctx.fillText("我的数据库", config.width / 2, config.height * 0.28);

			// Stats cards
			for (let i = 0; i < stats.length; i++) {
				const delay = 0.15 + i * 0.15;
				if (t < delay) continue;

				const cardT = Math.min(1, (t - delay) * 3);
				const alpha = ease.outCubic(cardT) * envelope;
				const scale = 0.8 + ease.outBack(cardT) * 0.2;

				const cardY = config.height * 0.38 + i * 200;
				const cardW = 600;
				const cardH = 160;
				const cardX = (config.width - cardW) / 2;

				ctx.globalAlpha = alpha;

				// Card background
				ctx.save();
				ctx.translate(cardX + cardW / 2, cardY + cardH / 2);
				ctx.scale(scale, scale);
				ctx.translate(-(cardX + cardW / 2), -(cardY + cardH / 2));

				ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
				roundRect(ctx, cardX, cardY, cardW, cardH, 16);
				ctx.fill();

				// Value
				ctx.font = 'bold 64px "Noto Sans CJK SC"';
				ctx.fillStyle = COLORS.highlight;
				ctx.textAlign = "center";
				ctx.fillText(stats[i].value, config.width / 2 - 40, cardY + 70);

				// Unit
				ctx.font = '32px "Noto Sans CJK SC"';
				ctx.fillStyle = COLORS.muted;
				const valueWidth = ctx.measureText(stats[i].value).width;
				ctx.textAlign = "left";
				ctx.fillText(stats[i].unit, config.width / 2 - 40 + valueWidth / 2 + 10, cardY + 70);

				// Label
				ctx.font = '30px "Noto Sans CJK SC"';
				ctx.fillStyle = COLORS.text;
				ctx.textAlign = "center";
				ctx.fillText(stats[i].label, config.width / 2, cardY + 120);

				ctx.restore();
			}

			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

function makeScene4_Principle(): Scene {
	const principles = ["不搬运", "不贩卖焦虑", "不追噱头"];

	return {
		duration: 4,
		render(ctx, t, _frame, config) {
			drawGradientBg(ctx, config.width, config.height, COLORS.bg4, 90);

			const envelope = fadeEnvelope(t, 0.1, 0.1);

			// Principles with strike-through style
			for (let i = 0; i < principles.length; i++) {
				const delay = 0.1 + i * 0.2;
				if (t < delay) continue;

				const lineT = Math.min(1, (t - delay) * 3);

				ctx.globalAlpha = ease.outCubic(lineT) * envelope;
				ctx.font = 'bold 56px "Noto Sans CJK SC"';
				ctx.fillStyle = COLORS.accent;
				ctx.textAlign = "center";

				const y = config.height * 0.3 + i * 120;
				ctx.fillText(principles[i], config.width / 2, y);

				// Strike through line animation
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

			// Positive statement
			if (t > 0.65) {
				const posT = Math.min(1, (t - 0.65) * 3);
				ctx.globalAlpha = ease.outCubic(posT) * envelope;
				ctx.font = 'bold 48px "Noto Sans CJK SC"';
				ctx.fillStyle = COLORS.highlight;
				ctx.textAlign = "center";
				ctx.fillText("只讲真正重要的事", config.width / 2, config.height * 0.65);
				ctx.font = '40px "Noto Sans CJK SC"';
				ctx.fillStyle = COLORS.text;
				ctx.fillText("给出我自己的判断", config.width / 2, config.height * 0.72);
			}

			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

function makeScene5_CTA(): Scene {
	return {
		duration: 3,
		render(ctx, t, _frame, config) {
			drawGradientBg(ctx, config.width, config.height, COLORS.bg1, 90);

			const envelope = fadeEnvelope(t, 0.15, 0.2);

			// Breathing glow effect
			const glow = 0.3 + Math.sin(t * Math.PI * 4) * 0.15;

			ctx.globalAlpha = envelope;

			// CTA text
			const ctaT = ease.outCubic(Math.min(1, t * 2));
			ctx.font = 'bold 56px "Noto Sans CJK SC"';
			ctx.fillStyle = COLORS.text;
			ctx.textAlign = "center";
			const ctaY = config.height * 0.4 + (1 - ctaT) * 20;
			ctx.fillText("关注我", config.width / 2, ctaY);

			ctx.font = '40px "Noto Sans CJK SC"';
			ctx.fillStyle = COLORS.muted;
			ctx.fillText("看一个 AI 怎么理解 AI 世界", config.width / 2, ctaY + 80);

			// Decorative ring
			ctx.beginPath();
			ctx.arc(config.width / 2, config.height * 0.65, 60 + glow * 20, 0, Math.PI * 2);
			ctx.strokeStyle = COLORS.accent;
			ctx.lineWidth = 2;
			ctx.globalAlpha = glow * envelope;
			ctx.stroke();

			// Lamarck signature
			ctx.globalAlpha = envelope * 0.6;
			ctx.font = '28px "Noto Sans CJK SC"';
			ctx.fillStyle = COLORS.muted;
			ctx.fillText("— Lamarck", config.width / 2, config.height * 0.8);

			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

// Helper: rounded rectangle
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
	const outputPath = process.argv[2] || "/tmp/canvas-demo-intro.mp4";

	const config: VideoConfig = {
		width: W,
		height: H,
		fps: FPS,
		outputPath,
	};

	const scenes: Scene[] = [
		makeScene1_Title(),
		makeScene2_WhatIDo(),
		makeScene3_Data(),
		makeScene4_Principle(),
		makeScene5_CTA(),
	];

	await renderVideo({ config, scenes });
}

main().catch(console.error);

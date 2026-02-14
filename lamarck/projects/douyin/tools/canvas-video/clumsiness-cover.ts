/**
 * "AI 的笨拙"系列封面图生成器。
 *
 * 统一模板：
 * - 温暖渐变背景
 * - 系列标识 + 集数
 * - 挑战问题（大字）
 * - 结果数据（醒目）
 * - Lamarck avatar
 *
 * 用法：npx tsx clumsiness-cover.ts <epNumber> <title> <result> <outputPath>
 * 例：npx tsx clumsiness-cover.ts 1 "AI能写出让人笑的段子吗？" "成功率20%" cover.png
 */

import { createCanvas, type CanvasRenderingContext2D } from "canvas";
import { writeFileSync } from "fs";
import { drawLamarckAvatar } from "./avatar.js";

const W = 1080;
const H = 1920;

const PALETTE = {
	bg: ["#FFF8F0", "#FFF0E0", "#FFECD2"],
	text: "#2D3748",
	accent: "#E53E3E",
	blue: "#3182CE",
	muted: "#A0AEC0",
};

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

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
	const lines: string[] = [];
	let current = "";
	for (const char of text) {
		const test = current + char;
		if (ctx.measureText(test).width > maxWidth) {
			if (current) lines.push(current);
			current = char;
		} else {
			current = test;
		}
	}
	if (current) lines.push(current);
	return lines;
}

function generateCover(epNumber: number, title: string, result: string, outputPath: string) {
	const canvas = createCanvas(W, H);
	const ctx = canvas.getContext("2d");

	// Background gradient
	const grad = ctx.createLinearGradient(0, 0, W, H);
	grad.addColorStop(0, PALETTE.bg[0]);
	grad.addColorStop(0.5, PALETTE.bg[1]);
	grad.addColorStop(1, PALETTE.bg[2]);
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, W, H);

	// Series branding - top
	ctx.font = 'bold 36px "Noto Sans CJK SC"';
	ctx.fillStyle = PALETTE.blue;
	ctx.textAlign = "center";
	ctx.fillText("AI 的笨拙", W / 2, H * 0.10);

	// Episode number badge
	ctx.font = '28px "Noto Sans CJK SC"';
	ctx.fillStyle = PALETTE.muted;
	ctx.fillText(`EP${String(epNumber).padStart(2, "0")}`, W / 2, H * 0.14);

	// Main title (big, center)
	ctx.font = 'bold 64px "Noto Sans CJK SC"';
	ctx.fillStyle = PALETTE.text;
	const titleLines = wrapText(ctx, title, W * 0.8);
	const titleStartY = H * 0.30;
	for (let i = 0; i < titleLines.length; i++) {
		ctx.fillText(titleLines[i], W / 2, titleStartY + i * 80);
	}

	// Result card (bottom-center)
	const cardY = H * 0.52;
	const cardW = W * 0.7;
	const cardH = 160;
	const cardX = (W - cardW) / 2;

	ctx.shadowColor = "rgba(0,0,0,0.1)";
	ctx.shadowBlur = 30;
	ctx.shadowOffsetY = 8;
	ctx.fillStyle = "#FFFFFF";
	roundRect(ctx, cardX, cardY, cardW, cardH, 24);
	ctx.fill();
	ctx.shadowColor = "transparent";

	ctx.font = 'bold 72px "Noto Sans CJK SC"';
	ctx.fillStyle = PALETTE.accent;
	ctx.fillText(result, W / 2, cardY + cardH / 2 + 24);

	// Avatar
	drawLamarckAvatar(ctx, W / 2, H * 0.78, 200, { expression: "thinking" });

	// Bottom tagline
	ctx.font = '28px "Noto Sans CJK SC"';
	ctx.fillStyle = PALETTE.muted;
	ctx.fillText("当所有人都在讲 AI 多强的时候", W / 2, H * 0.92);
	ctx.fillText("我们讲 AI 有多蠢", W / 2, H * 0.96);

	writeFileSync(outputPath, canvas.toBuffer("image/png"));
	console.log(`Cover saved: ${outputPath} (${W}x${H})`);
}

// --- CLI ---
const args = process.argv.slice(2);
if (args.length < 4) {
	console.log("Usage: npx tsx clumsiness-cover.ts <epNumber> <title> <result> <outputPath>");
	console.log('Example: npx tsx clumsiness-cover.ts 1 "AI能写出让人笑的段子吗？" "成功率20%" cover.png');
	process.exit(1);
}

generateCover(Number.parseInt(args[0]), args[1], args[2], args[3]);

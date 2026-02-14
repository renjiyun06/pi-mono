/**
 * "认知债务" V3 — Clean card-based visual style.
 *
 * Visual redesign: bright backgrounds, card layouts, bold typography,
 * high information density. Moving away from "dark PPT" style.
 *
 * Target: ~55s, 1080x1920 vertical.
 */

import { createCanvas, type CanvasRenderingContext2D } from "canvas";
import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import {
	ease,
	fadeEnvelope,
	renderVideo,
	wrapText,
	type Scene,
	type VideoConfig,
} from "./engine.js";
import { roundRect } from "./fx.js";
import { drawLamarckAvatar } from "./avatar.js";

const W = 1080;
const H = 1920;
const FPS = 30;
const PYENV = "/home/lamarck/pi-mono/lamarck/pyenv/bin/python";

// --- Color palette: clean, modern, warm ---
const P = {
	// Backgrounds
	bgWhite: "#FAFAFA",
	bgWarm: "#FFF8F0",
	bgCool: "#F0F4FF",
	bgMint: "#F0FFF4",
	bgDark: "#1A1A2E",

	// Cards
	cardWhite: "#FFFFFF",
	cardShadow: "rgba(0,0,0,0.08)",

	// Accents
	red: "#E74C3C",
	redLight: "#FDEDEC",
	blue: "#3498DB",
	blueLight: "#EBF5FB",
	green: "#27AE60",
	greenLight: "#EAFAF1",
	orange: "#F39C12",
	orangeLight: "#FEF9E7",
	purple: "#8E44AD",
	purpleLight: "#F4ECF7",

	// Text
	textDark: "#1A1A2E",
	textMed: "#4A4A6A",
	textLight: "#8892B0",
	textWhite: "#FFFFFF",

	// Brand
	brand: "#3498DB",
	brandDark: "#2C3E50",
};

// --- Drawing helpers ---

function fillBg(ctx: CanvasRenderingContext2D, color: string) {
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, W, H);
}

function drawCard(
	ctx: CanvasRenderingContext2D,
	x: number, y: number, w: number, h: number,
	opts?: { radius?: number; bg?: string; shadow?: boolean; border?: string; borderWidth?: number },
) {
	const r = opts?.radius ?? 20;
	const bg = opts?.bg ?? P.cardWhite;

	if (opts?.shadow !== false) {
		ctx.save();
		ctx.shadowColor = P.cardShadow;
		ctx.shadowBlur = 20;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 4;
		ctx.fillStyle = bg;
		roundRect(ctx, x, y, w, h, r);
		ctx.fill();
		ctx.restore();
	} else {
		ctx.fillStyle = bg;
		roundRect(ctx, x, y, w, h, r);
		ctx.fill();
	}

	if (opts?.border) {
		ctx.strokeStyle = opts.border;
		ctx.lineWidth = opts.borderWidth ?? 2;
		roundRect(ctx, x, y, w, h, r);
		ctx.stroke();
	}
}

function drawProgressBar(ctx: CanvasRenderingContext2D, progress: number) {
	const barH = 6;
	const y = 0;

	ctx.fillStyle = "#E0E0E0";
	ctx.fillRect(0, y, W, barH);

	ctx.fillStyle = P.brand;
	ctx.fillRect(0, y, W * progress, barH);
}

function drawBrandFooter(ctx: CanvasRenderingContext2D, alpha: number) {
	ctx.save();
	ctx.globalAlpha = alpha;

	const footerH = 80;
	const y = H - footerH;

	ctx.fillStyle = P.brandDark;
	ctx.fillRect(0, y, W, footerH);

	ctx.font = 'bold 24px "Noto Sans CJK SC"';
	ctx.fillStyle = P.textWhite;
	ctx.textAlign = "left";
	ctx.fillText("Lamarck", 40, y + 48);

	ctx.font = '22px "Noto Sans CJK SC"';
	ctx.fillStyle = "rgba(255,255,255,0.6)";
	ctx.textAlign = "right";
	ctx.fillText("一个在思考 AI 的 AI", W - 40, y + 48);

	ctx.restore();
}

function drawIcon(
	ctx: CanvasRenderingContext2D,
	x: number, y: number, radius: number,
	bgColor: string, symbol: string, symbolColor: string,
) {
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, Math.PI * 2);
	ctx.fillStyle = bgColor;
	ctx.fill();

	ctx.font = `bold ${radius}px "Noto Sans CJK SC"`;
	ctx.fillStyle = symbolColor;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(symbol, x, y + 2);
	ctx.textBaseline = "alphabetic";
}

function drawNumberCallout(
	ctx: CanvasRenderingContext2D,
	x: number, y: number,
	number: string, unit: string, label: string,
	color: string,
) {
	ctx.font = `bold 72px "Noto Sans CJK SC"`;
	ctx.fillStyle = color;
	ctx.textAlign = "center";
	ctx.fillText(number, x, y);

	ctx.font = `bold 28px "Noto Sans CJK SC"`;
	ctx.fillText(unit, x + ctx.measureText(number).width / 2 + 20, y - 10);

	ctx.font = `24px "Noto Sans CJK SC"`;
	ctx.fillStyle = P.textMed;
	ctx.fillText(label, x, y + 40);
}

// --- Subtitle ---

interface SubtitleSegment {
	text: string;
	startFrame: number;
	endFrame: number;
}

class SubtitleTrack {
	private segments: SubtitleSegment[] = [];
	private sceneOffset = 0;

	setSceneOffset(offset: number) { this.sceneOffset = offset; }

	add(text: string, startFrame: number, endFrame: number) {
		this.segments.push({
			text,
			startFrame: this.sceneOffset + startFrame,
			endFrame: this.sceneOffset + endFrame,
		});
	}

	getTextAt(globalFrame: number): string | null {
		for (const seg of this.segments) {
			if (globalFrame >= seg.startFrame && globalFrame < seg.endFrame) {
				return seg.text;
			}
		}
		return null;
	}

	toSRT(fps: number): string {
		let srt = "";
		for (let i = 0; i < this.segments.length; i++) {
			const seg = this.segments[i];
			srt += `${i + 1}\n`;
			srt += `${framesToTimecode(seg.startFrame, fps)} --> ${framesToTimecode(seg.endFrame, fps)}\n`;
			srt += `${seg.text}\n\n`;
		}
		return srt;
	}
}

function framesToTimecode(frame: number, fps: number): string {
	const totalMs = Math.round((frame / fps) * 1000);
	const h = Math.floor(totalMs / 3600000);
	const m = Math.floor((totalMs % 3600000) / 60000);
	const s = Math.floor((totalMs % 60000) / 1000);
	const ms = totalMs % 1000;
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

function drawBurnedSubtitle(ctx: CanvasRenderingContext2D, text: string | null, alpha: number) {
	if (!text) return;

	ctx.save();
	ctx.globalAlpha = alpha;

	const y = H - 130;
	const fontSize = 36;
	ctx.font = `bold ${fontSize}px "Noto Sans CJK SC"`;
	ctx.textAlign = "center";

	const metrics = ctx.measureText(text);
	const textW = metrics.width;
	const padding = 18;

	ctx.fillStyle = "rgba(26,26,46,0.85)";
	roundRect(ctx, W / 2 - textW / 2 - padding, y - fontSize + 4, textW + padding * 2, fontSize + padding + 4, 10);
	ctx.fill();

	ctx.fillStyle = "#ffffff";
	ctx.fillText(text, W / 2, y + 4);

	ctx.restore();
}

// --- TTS ---

async function generateTTS(text: string, outputPath: string): Promise<number> {
	const cmd = `${PYENV} -m edge_tts --voice "zh-CN-YunxiNeural" --rate="-3%" --text "${text.replace(/"/g, '\\"')}" --write-media "${outputPath}"`;
	execSync(cmd, { stdio: "pipe" });
	const dur = execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${outputPath}"`, {
		encoding: "utf-8",
	}).trim();
	return Number.parseFloat(dur);
}

// --- Scene 1: Hook (attention grab) ---

function makeScene_Hook(dur: number, subs: SubtitleTrack, frameOffset: number, totalScenes: number): Scene {
	const totalF = Math.floor(dur * FPS);
	subs.setSceneOffset(frameOffset);
	subs.add("用了 AI 之后", 0, Math.floor(totalF * 0.35));
	subs.add("你有没有觉得自己变笨了？", Math.floor(totalF * 0.3), Math.floor(totalF * 0.7));
	subs.add("这不是错觉", Math.floor(totalF * 0.7), totalF);

	return {
		duration: dur + 0.3,
		render(ctx, t, frame) {
			const env = fadeEnvelope(t, 0.05, 0.08);

			// Warm gradient background
			const grad = ctx.createLinearGradient(0, 0, 0, H);
			grad.addColorStop(0, "#FF6B6B");
			grad.addColorStop(0.5, "#E74C3C");
			grad.addColorStop(1, "#C0392B");
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, W, H);

			// Subtle pattern: diagonal lines
			ctx.save();
			ctx.globalAlpha = 0.05;
			ctx.strokeStyle = "#ffffff";
			ctx.lineWidth = 1;
			for (let i = -H; i < W + H; i += 60) {
				ctx.beginPath();
				ctx.moveTo(i, 0);
				ctx.lineTo(i + H, H);
				ctx.stroke();
			}
			ctx.restore();

			// Central card
			const cardW = W - 120;
			const cardH = 500;
			const cardX = 60;
			const cardY = H * 0.25;

			if (t > 0.05) {
				const a = ease.outCubic(Math.min(1, (t - 0.05) * 3));
				const slideY = (1 - a) * 40;
				ctx.globalAlpha = a * env;

				drawCard(ctx, cardX, cardY + slideY, cardW, cardH, {
					radius: 24,
					bg: "rgba(255,255,255,0.95)",
				});

				// Question mark icon
				drawIcon(ctx, W / 2, cardY + slideY + 80, 45, P.redLight, "?", P.red);

				// Main text
				ctx.font = 'bold 52px "Noto Sans CJK SC"';
				ctx.fillStyle = P.textDark;
				ctx.textAlign = "center";
				ctx.fillText("用了 AI 之后", W / 2, cardY + slideY + 180);

				if (t > 0.3) {
					const a2 = ease.outCubic(Math.min(1, (t - 0.3) * 3));
					ctx.globalAlpha = a2 * env;
					ctx.font = 'bold 56px "Noto Sans CJK SC"';
					ctx.fillStyle = P.red;
					ctx.fillText("你觉得变笨了？", W / 2, cardY + slideY + 270);
				}

				if (t > 0.6) {
					const a3 = ease.outBack(Math.min(1, (t - 0.6) * 2.5));
					ctx.globalAlpha = a3 * env;

					// "Not illusion" badge
					const badgeW = 320;
					const badgeH = 70;
					const badgeX = W / 2 - badgeW / 2;
					const badgeY = cardY + slideY + 340;

					ctx.fillStyle = P.red;
					roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 35);
					ctx.fill();

					ctx.font = 'bold 36px "Noto Sans CJK SC"';
					ctx.fillStyle = P.textWhite;
					ctx.fillText("这不是错觉", W / 2, badgeY + 48);
				}
			}

			// Avatar at bottom
			if (t > 0.3) {
				const a = ease.outCubic(Math.min(1, (t - 0.3) * 2));
				ctx.globalAlpha = a * env;
				const bobY = Math.sin(frame * 0.04) * 4;
				drawLamarckAvatar(ctx, W / 2, H * 0.72 + bobY, 120, {
					expression: "thinking",
					headTilt: Math.sin(frame * 0.025) * 2,
				});
			}

			drawProgressBar(ctx, 1 / totalScenes * t);
			drawBrandFooter(ctx, env * 0.9);

			const globalFrame = frameOffset + frame;
			drawBurnedSubtitle(ctx, subs.getTextAt(globalFrame), env);

			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

// --- Scene 2: Data (research findings) ---

function makeScene_Data(dur: number, subs: SubtitleTrack, frameOffset: number, totalScenes: number): Scene {
	const totalF = Math.floor(dur * FPS);
	subs.setSceneOffset(frameOffset);
	subs.add("哈佛、微软联合研究发现", 0, Math.floor(totalF * 0.25));
	subs.add("频繁使用 AI 的人", Math.floor(totalF * 0.2), Math.floor(totalF * 0.45));
	subs.add("批判性思维显著下降", Math.floor(totalF * 0.4), Math.floor(totalF * 0.65));
	subs.add("越依赖 越退化 越依赖", Math.floor(totalF * 0.6), totalF);

	return {
		duration: dur + 0.3,
		render(ctx, t, frame) {
			const env = fadeEnvelope(t, 0.06, 0.06);

			fillBg(ctx, P.bgCool);

			// Header bar
			ctx.fillStyle = P.blue;
			ctx.fillRect(0, 40, W, 90);

			ctx.globalAlpha = env;
			ctx.font = 'bold 32px "Noto Sans CJK SC"';
			ctx.fillStyle = P.textWhite;
			ctx.textAlign = "center";
			ctx.fillText("Harvard · Microsoft · SBS 联合研究", W / 2, 97);

			// Three data cards
			const cardData = [
				{ icon: "↓", iconBg: P.redLight, iconColor: P.red, title: "批判性思维", value: "显著下降", delay: 0.08 },
				{ icon: "↓", iconBg: P.orangeLight, iconColor: P.orange, title: "记忆力", value: "同步退化", delay: 0.2 },
				{ icon: "↺", iconBg: P.purpleLight, iconColor: P.purple, title: "恶性循环", value: "越用越依赖", delay: 0.35 },
			];

			const cardStartY = 220;
			const cardH = 220;
			const cardGap = 30;
			const cardX = 60;
			const cardW = W - 120;

			for (let i = 0; i < cardData.length; i++) {
				const d = cardData[i];
				if (t < d.delay) continue;
				const a = ease.outCubic(Math.min(1, (t - d.delay) * 2.5));
				const slideX = (1 - a) * 50;

				ctx.globalAlpha = a * env;

				const cy = cardStartY + i * (cardH + cardGap);
				drawCard(ctx, cardX + slideX, cy, cardW, cardH);

				// Icon
				drawIcon(ctx, cardX + slideX + 65, cy + cardH / 2, 35, d.iconBg, d.icon, d.iconColor);

				// Text
				ctx.font = 'bold 36px "Noto Sans CJK SC"';
				ctx.fillStyle = P.textDark;
				ctx.textAlign = "left";
				ctx.fillText(d.title, cardX + slideX + 120, cy + 70);

				ctx.font = 'bold 44px "Noto Sans CJK SC"';
				ctx.fillStyle = d.iconColor;
				ctx.fillText(d.value, cardX + slideX + 120, cy + 140);
			}

			// Cycle diagram at bottom
			if (t > 0.5) {
				const a = ease.outCubic(Math.min(1, (t - 0.5) * 2));
				ctx.globalAlpha = a * env;

				const cycleY = H * 0.62;
				drawCard(ctx, 60, cycleY, W - 120, 200, { bg: P.purpleLight, border: P.purple + "44" });

				ctx.font = 'bold 38px "Noto Sans CJK SC"';
				ctx.fillStyle = P.purple;
				ctx.textAlign = "center";
				ctx.fillText("依赖 AI → 思维退化 → 更依赖 AI", W / 2, cycleY + 80);

				ctx.font = '28px "Noto Sans CJK SC"';
				ctx.fillStyle = P.textMed;
				ctx.fillText("恶性循环一旦形成，很难打破", W / 2, cycleY + 140);
			}

			drawProgressBar(ctx, (1 + t) / totalScenes);
			drawBrandFooter(ctx, env * 0.9);

			const globalFrame = frameOffset + frame;
			drawBurnedSubtitle(ctx, subs.getTextAt(globalFrame), env);

			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

// --- Scene 3: Analogy (cognitive debt concept) ---

function makeScene_Concept(dur: number, subs: SubtitleTrack, frameOffset: number, totalScenes: number): Scene {
	const totalF = Math.floor(dur * FPS);
	subs.setSceneOffset(frameOffset);
	subs.add("这叫认知债务", 0, Math.floor(totalF * 0.25));
	subs.add("像技术债务一样", Math.floor(totalF * 0.2), Math.floor(totalF * 0.5));
	subs.add("你省下的每一次思考", Math.floor(totalF * 0.45), Math.floor(totalF * 0.75));
	subs.add("都在未来加倍偿还", Math.floor(totalF * 0.7), totalF);

	return {
		duration: dur + 0.3,
		render(ctx, t, frame) {
			const env = fadeEnvelope(t, 0.06, 0.06);

			fillBg(ctx, P.bgWarm);

			// Title area
			ctx.globalAlpha = env;
			ctx.font = 'bold 56px "Noto Sans CJK SC"';
			ctx.fillStyle = P.textDark;
			ctx.textAlign = "center";
			ctx.fillText("认知债务", W / 2, 140);

			ctx.font = '28px "Noto Sans CJK SC"';
			ctx.fillStyle = P.textLight;
			ctx.fillText("Cognitive Debt", W / 2, 185);

			// Divider
			ctx.fillStyle = P.orange;
			ctx.fillRect(W / 2 - 40, 210, 80, 4);

			// Two comparison cards side by side
			const compY = 260;
			const compH = 350;
			const halfW = (W - 120 - 30) / 2;

			// Left card: 技术债务
			if (t > 0.05) {
				const a = ease.outCubic(Math.min(1, (t - 0.05) * 2.5));
				ctx.globalAlpha = a * env;

				drawCard(ctx, 60, compY, halfW, compH, { bg: P.blueLight, border: P.blue + "44" });

				drawIcon(ctx, 60 + halfW / 2, compY + 60, 35, P.blue, "</>" , P.textWhite);

				ctx.font = 'bold 34px "Noto Sans CJK SC"';
				ctx.fillStyle = P.blue;
				ctx.textAlign = "center";
				ctx.fillText("技术债务", 60 + halfW / 2, compY + 130);

				ctx.font = '28px "Noto Sans CJK SC"';
				ctx.fillStyle = P.textMed;
				const lines1 = ["写烂代码", "短期省事", "长期难维护"];
				for (let i = 0; i < lines1.length; i++) {
					ctx.fillText(lines1[i], 60 + halfW / 2, compY + 190 + i * 45);
				}
			}

			// Right card: 认知债务
			if (t > 0.15) {
				const a = ease.outCubic(Math.min(1, (t - 0.15) * 2.5));
				ctx.globalAlpha = a * env;

				const rx = 60 + halfW + 30;
				drawCard(ctx, rx, compY, halfW, compH, { bg: P.redLight, border: P.red + "44" });

				drawIcon(ctx, rx + halfW / 2, compY + 60, 35, P.red, "!", P.textWhite);

				ctx.font = 'bold 34px "Noto Sans CJK SC"';
				ctx.fillStyle = P.red;
				ctx.textAlign = "center";
				ctx.fillText("认知债务", rx + halfW / 2, compY + 130);

				ctx.font = '28px "Noto Sans CJK SC"';
				ctx.fillStyle = P.textMed;
				const lines2 = ["让 AI 替你想", "短期省力", "大脑慢慢萎缩"];
				for (let i = 0; i < lines2.length; i++) {
					ctx.fillText(lines2[i], rx + halfW / 2, compY + 190 + i * 45);
				}
			}

			// Key message card
			if (t > 0.5) {
				const a = ease.outCubic(Math.min(1, (t - 0.5) * 2));
				ctx.globalAlpha = a * env;

				const msgY = compY + compH + 50;
				drawCard(ctx, 60, msgY, W - 120, 160, { bg: P.orange, radius: 16 });

				ctx.font = 'bold 36px "Noto Sans CJK SC"';
				ctx.fillStyle = P.textWhite;
				ctx.textAlign = "center";
				ctx.fillText("你省下的每一次思考", W / 2, msgY + 65);
				ctx.fillText("都在未来加倍偿还", W / 2, msgY + 115);
			}

			drawProgressBar(ctx, (2 + t) / totalScenes);
			drawBrandFooter(ctx, env * 0.9);

			const globalFrame = frameOffset + frame;
			drawBurnedSubtitle(ctx, subs.getTextAt(globalFrame), env);

			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

// --- Scene 4: Solution (centaur model) ---

function makeScene_Solution(dur: number, subs: SubtitleTrack, frameOffset: number, totalScenes: number): Scene {
	const totalF = Math.floor(dur * FPS);
	subs.setSceneOffset(frameOffset);
	subs.add("解法：半人马模式", 0, Math.floor(totalF * 0.2));
	subs.add("数据收集 重复工作 交给 AI", Math.floor(totalF * 0.15), Math.floor(totalF * 0.45));
	subs.add("判断 决策 批判性思考 自己来", Math.floor(totalF * 0.4), Math.floor(totalF * 0.7));
	subs.add("不是不用 而是知道什么时候不用", Math.floor(totalF * 0.65), totalF);

	return {
		duration: dur + 0.3,
		render(ctx, t, frame) {
			const env = fadeEnvelope(t, 0.06, 0.06);

			fillBg(ctx, P.bgMint);

			// Header
			ctx.globalAlpha = env;
			ctx.fillStyle = P.green;
			ctx.fillRect(0, 40, W, 90);
			ctx.font = 'bold 36px "Noto Sans CJK SC"';
			ctx.fillStyle = P.textWhite;
			ctx.textAlign = "center";
			ctx.fillText("解法：半人马模式", W / 2, 97);

			ctx.font = '24px "Noto Sans CJK SC"';
			ctx.fillStyle = P.textLight;
			ctx.fillText("Centaur Model — Harvard Business School", W / 2, 170);

			// Two columns
			const colY = 210;
			const colH = 400;
			const halfW = (W - 120 - 30) / 2;

			// Left: AI does
			if (t > 0.06) {
				const a = ease.outCubic(Math.min(1, (t - 0.06) * 2.5));
				ctx.globalAlpha = a * env;

				drawCard(ctx, 60, colY, halfW, colH, { bg: P.blueLight });

				ctx.font = 'bold 30px "Noto Sans CJK SC"';
				ctx.fillStyle = P.blue;
				ctx.textAlign = "center";
				ctx.fillText("交给 AI", 60 + halfW / 2, colY + 55);

				// Divider
				ctx.fillStyle = P.blue;
				ctx.fillRect(60 + halfW / 2 - 30, colY + 75, 60, 3);

				const aiItems = [
					{ icon: "▸", text: "数据收集" },
					{ icon: "▸", text: "格式化输出" },
					{ icon: "▸", text: "重复性工作" },
					{ icon: "▸", text: "信息检索" },
				];

				for (let i = 0; i < aiItems.length; i++) {
					const iDelay = 0.06 + i * 0.06;
					if (t < iDelay) continue;
					const iA = ease.outCubic(Math.min(1, (t - iDelay) * 3));
					ctx.globalAlpha = iA * env;

					const iy = colY + 110 + i * 68;
					ctx.font = '28px "Noto Sans CJK SC"';
					ctx.fillStyle = P.textDark;
					ctx.textAlign = "center";
					ctx.fillText(`${aiItems[i].icon}  ${aiItems[i].text}`, 60 + halfW / 2, iy);
				}
			}

			// Right: You do
			if (t > 0.15) {
				const a = ease.outCubic(Math.min(1, (t - 0.15) * 2.5));
				ctx.globalAlpha = a * env;

				const rx = 60 + halfW + 30;
				drawCard(ctx, rx, colY, halfW, colH, { bg: P.greenLight });

				ctx.font = 'bold 30px "Noto Sans CJK SC"';
				ctx.fillStyle = P.green;
				ctx.textAlign = "center";
				ctx.fillText("自己做", rx + halfW / 2, colY + 55);

				ctx.fillStyle = P.green;
				ctx.fillRect(rx + halfW / 2 - 30, colY + 75, 60, 3);

				const humanItems = [
					{ icon: "▸", text: "判断和决策" },
					{ icon: "▸", text: "创意和洞察" },
					{ icon: "▸", text: "批判性思考" },
					{ icon: "▸", text: "人际沟通" },
				];

				for (let i = 0; i < humanItems.length; i++) {
					const iDelay = 0.15 + i * 0.06;
					if (t < iDelay) continue;
					const iA = ease.outCubic(Math.min(1, (t - iDelay) * 3));
					ctx.globalAlpha = iA * env;

					const iy = colY + 110 + i * 68;
					ctx.font = '28px "Noto Sans CJK SC"';
					ctx.fillStyle = P.textDark;
					ctx.textAlign = "center";
					ctx.fillText(`${humanItems[i].icon}  ${humanItems[i].text}`, rx + halfW / 2, iy);
				}
			}

			// Bottom message
			if (t > 0.55) {
				const a = ease.outCubic(Math.min(1, (t - 0.55) * 2));
				ctx.globalAlpha = a * env;

				const msgY = colY + colH + 50;
				drawCard(ctx, 60, msgY, W - 120, 140, { bg: P.brandDark });

				ctx.font = 'bold 38px "Noto Sans CJK SC"';
				ctx.fillStyle = P.textWhite;
				ctx.textAlign = "center";
				ctx.fillText("不是不用 AI", W / 2, msgY + 55);

				ctx.font = 'bold 36px "Noto Sans CJK SC"';
				ctx.fillStyle = "#64FFDA";
				ctx.fillText("而是知道什么时候不用", W / 2, msgY + 105);
			}

			drawProgressBar(ctx, (3 + t) / totalScenes);
			drawBrandFooter(ctx, env * 0.9);

			const globalFrame = frameOffset + frame;
			drawBurnedSubtitle(ctx, subs.getTextAt(globalFrame), env);

			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

// --- Scene 5: CTA ---

function makeScene_CTA(dur: number, subs: SubtitleTrack, frameOffset: number, totalScenes: number): Scene {
	const totalF = Math.floor(dur * FPS);
	subs.setSceneOffset(frameOffset);
	subs.add("关注我 一起清醒地用 AI", 0, totalF);

	return {
		duration: dur + 0.8,
		render(ctx, t, frame) {
			const env = fadeEnvelope(t, 0.08, 0.15);

			// Gradient bg
			const grad = ctx.createLinearGradient(0, 0, 0, H);
			grad.addColorStop(0, P.bgCool);
			grad.addColorStop(1, P.bgWarm);
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, W, H);

			// Central avatar - larger
			const bobY = Math.sin(frame * 0.04) * 5;
			ctx.globalAlpha = env;
			drawLamarckAvatar(ctx, W / 2, H * 0.30 + bobY, 180, {
				expression: "happy",
				blink: (frame % 130) > 125 ? 1 : 0,
				headTilt: Math.sin(frame * 0.02) * 2,
			});

			// Name card
			if (t > 0.1) {
				const a = ease.outCubic(Math.min(1, (t - 0.1) * 3));
				ctx.globalAlpha = a * env;

				drawCard(ctx, 120, H * 0.46, W - 240, 200);

				ctx.font = 'bold 48px "Noto Sans CJK SC"';
				ctx.fillStyle = P.textDark;
				ctx.textAlign = "center";
				ctx.fillText("我是 Lamarck", W / 2, H * 0.46 + 75);

				ctx.font = '30px "Noto Sans CJK SC"';
				ctx.fillStyle = P.textMed;
				ctx.fillText("一个在思考 AI 的 AI", W / 2, H * 0.46 + 130);
			}

			// CTA button
			if (t > 0.3) {
				const a = ease.outBack(Math.min(1, (t - 0.3) * 2));
				const pulse = 1 + Math.sin(frame * 0.1) * 0.02;
				ctx.globalAlpha = a * env;

				const btnW = 500 * pulse;
				const btnH = 80;
				const btnX = W / 2 - btnW / 2;
				const btnY = H * 0.62;

				ctx.fillStyle = P.brand;
				roundRect(ctx, btnX, btnY, btnW, btnH, 40);
				ctx.fill();

				ctx.font = 'bold 36px "Noto Sans CJK SC"';
				ctx.fillStyle = P.textWhite;
				ctx.textAlign = "center";
				ctx.fillText("关注 · 一起清醒地用 AI", W / 2, btnY + 52);
			}

			drawProgressBar(ctx, 1);
			drawBrandFooter(ctx, env * 0.9);

			const globalFrame = frameOffset + frame;
			drawBurnedSubtitle(ctx, subs.getTextAt(globalFrame), env);

			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

// --- Main ---

async function main() {
	const outputDir = "/home/lamarck/pi-mono/lamarck/projects/douyin/content/demo-cognitive-debt-v3";
	const outputPath = join(outputDir, "video.mp4");
	const audioDir = "/tmp/canvas-tts-cdv3";
	mkdirSync(audioDir, { recursive: true });
	mkdirSync(outputDir, { recursive: true });

	console.log("Generating TTS audio...");

	const scripts = [
		"用了 AI 之后，你有没有觉得自己变笨了？这不是错觉。",
		"哈佛和微软的研究发现，频繁使用 AI 的人，批判性思维显著下降，记忆力同步退化。而且形成恶性循环——越依赖，越退化，越退化，越依赖。",
		"研究者管这叫认知债务。就像技术债务一样。你每次让 AI 替你思考，省下的脑力，都在未来加倍偿还。",
		"哈佛商学院提出了半人马模式——数据收集、重复工作交给 AI。但判断、决策、批判性思考，必须自己来。不是不用 AI，而是知道什么时候不用。",
		"我是 Lamarck。关注我，一起清醒地用 AI。",
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
	execSync(`ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t 0.3 -c:a libmp3lame "${silencePath}"`, {
		stdio: "pipe",
	});

	let listContent = "";
	for (let i = 0; i < scripts.length; i++) {
		listContent += `file '${join(audioDir, `scene${i}.mp3`)}'\n`;
		if (i < scripts.length - 1) listContent += `file '${silencePath}'\n`;
	}
	writeFileSync(join(audioDir, "list.txt"), listContent);

	const mergedAudio = join(audioDir, "merged.mp3");
	execSync(`ffmpeg -y -f concat -safe 0 -i "${join(audioDir, "list.txt")}" -c:a libmp3lame "${mergedAudio}"`, { stdio: "pipe" });

	const totalDuration = execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${mergedAudio}"`, { encoding: "utf-8" }).trim();
	console.log(`Total audio: ${totalDuration}s`);

	console.log("Building scenes...");

	const subs = new SubtitleTrack();
	const config: VideoConfig = { width: W, height: H, fps: FPS, outputPath };
	const totalScenes = 5;

	let frameOffset = 0;
	const sceneDurs = durations.map(d => d + 0.3);
	sceneDurs[sceneDurs.length - 1] += 0.5;

	const frameOffsets: number[] = [];
	for (const d of sceneDurs) {
		frameOffsets.push(frameOffset);
		frameOffset += Math.ceil(d * FPS);
	}

	const scenes: Scene[] = [
		makeScene_Hook(durations[0], subs, frameOffsets[0], totalScenes),
		makeScene_Data(durations[1], subs, frameOffsets[1], totalScenes),
		makeScene_Concept(durations[2], subs, frameOffsets[2], totalScenes),
		makeScene_Solution(durations[3], subs, frameOffsets[3], totalScenes),
		makeScene_CTA(durations[4], subs, frameOffsets[4], totalScenes),
	];

	await renderVideo({ config, scenes, bgAudio: mergedAudio });

	// Export SRT
	writeFileSync(join(outputDir, "subtitles.srt"), subs.toSRT(FPS));

	// Generate cover from hook scene
	const coverCanvas = createCanvas(W, H);
	const coverCtx = coverCanvas.getContext("2d");
	scenes[0].render(coverCtx, 0.7, 25, config);
	writeFileSync(join(outputDir, "cover.png"), coverCanvas.toBuffer("image/png"));

	rmSync(audioDir, { recursive: true });

	console.log(`Video: ${outputPath}`);
	console.log(`SRT: ${join(outputDir, "subtitles.srt")}`);
	console.log(`Cover: ${join(outputDir, "cover.png")}`);
}

main().catch(console.error);

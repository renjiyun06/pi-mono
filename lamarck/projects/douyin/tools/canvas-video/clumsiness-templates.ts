/**
 * "AI 的笨拙"系列专用模板。
 *
 * 提取 EP01/EP02 中的共享组件，让后续集的制作更高效。
 * 包括：暖色调色板、卡片系统、字幕系统、SRT 生成、音频混合。
 */

import type { CanvasRenderingContext2D } from "canvas";
import { execSync } from "child_process";
import { existsSync, writeFileSync } from "fs";
import { join } from "path";
import {
	drawGradientBg,
	ease,
	fadeEnvelope,
	renderVideo,
	wrapText,
	type Scene,
	type VideoConfig,
} from "./engine.js";
import { drawLamarckAvatar } from "./avatar.js";
import { roundRect } from "./fx.js";

// --- Constants ---

export const W = 1080;
export const H = 1920;
export const FPS = 30;

// --- Warm color palette (shared across all episodes) ---

export const PALETTE = {
	bg_warm: ["#FFF8F0", "#FFF0E0", "#FFECD2"],
	bg_blue: ["#F0F4FF", "#E0EAFF", "#D0DDFF"],
	bg_green: ["#F0FFF4", "#DFFCE8", "#C6F6D5"],
	bg_red: ["#FFF5F5", "#FFE8E8", "#FED7D7"],
	bg_purple: ["#FAF5FF", "#F0E4FF", "#E9D5FF"],
	bg_orange: ["#FFFAF0", "#FEEBC8", "#FBD38D"],
	text: "#2D3748",
	accent: "#E53E3E",
	green: "#38A169",
	blue: "#3182CE",
	muted: "#A0AEC0",
	card: "#FFFFFF",
	cardShadow: "rgba(0,0,0,0.08)",
};

// --- Audio helpers ---

export function getAudioDuration(path: string): number {
	if (!existsSync(path)) return 3;
	const dur = execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${path}"`, {
		encoding: "utf-8",
	}).trim();
	return Number.parseFloat(dur);
}

// --- Card drawing ---

export function drawCard(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	alpha: number = 1,
	color: string = PALETTE.card,
) {
	ctx.save();
	ctx.globalAlpha = alpha;
	ctx.shadowColor = PALETTE.cardShadow;
	ctx.shadowBlur = 20;
	ctx.shadowOffsetY = 4;
	ctx.fillStyle = color;
	roundRect(ctx, x, y, w, h, 16);
	ctx.fill();
	ctx.shadowColor = "transparent";
	ctx.restore();
}

// --- Subtitle rendering ---

export function drawSubtitle(
	ctx: CanvasRenderingContext2D,
	text: string,
	w: number,
	h: number,
	alpha: number = 1,
) {
	ctx.save();
	ctx.globalAlpha = alpha;
	const y = h * 0.88;
	const fontSize = 36;
	ctx.font = `bold ${fontSize}px "Noto Sans CJK SC"`;
	ctx.textAlign = "center";
	const maxW = w * 0.85;
	const lines = wrapText(ctx, text, maxW);
	for (let i = 0; i < lines.length; i++) {
		const lineY = y + i * (fontSize + 8);
		const metrics = ctx.measureText(lines[i]);
		const textW = metrics.width;
		const padding = 16;
		ctx.fillStyle = "rgba(0,0,0,0.55)";
		roundRect(ctx, w / 2 - textW / 2 - padding, lineY - fontSize + 6, textW + padding * 2, fontSize + padding, 10);
		ctx.fill();
		ctx.fillStyle = "#ffffff";
		ctx.fillText(lines[i], w / 2, lineY + 4);
	}
	ctx.restore();
}

// --- SRT generation ---

export interface SubEntry {
	text: string;
	startSec: number;
	endSec: number;
}

export class SRTBuilder {
	entries: SubEntry[] = [];
	timeAccum = 0;

	addSub(text: string, duration: number) {
		this.entries.push({ text, startSec: this.timeAccum, endSec: this.timeAccum + duration });
	}

	advanceTime(seconds: number) {
		this.timeAccum += seconds;
	}

	toSRT(): string {
		let srt = "";
		for (let i = 0; i < this.entries.length; i++) {
			const e = this.entries[i];
			srt += `${i + 1}\n${fmtTime(e.startSec)} --> ${fmtTime(e.endSec)}\n${e.text}\n\n`;
		}
		return srt;
	}
}

function fmtTime(sec: number): string {
	const h = Math.floor(sec / 3600);
	const m = Math.floor((sec % 3600) / 60);
	const s = Math.floor(sec % 60);
	const ms = Math.round((sec % 1) * 1000);
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

// --- Audio mixing pipeline ---

export function mixAudio(audioFiles: string[], audioDir: string, outputDir: string, prefix: string): string {
	const concatList = join(outputDir, `${prefix}-concat.txt`);
	const silenceFile = join(outputDir, "silence-300ms.wav");
	const fullAudio = join(outputDir, `${prefix}-audio.mp3`);

	execSync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t 0.3 "${silenceFile}" 2>/dev/null`);

	let concatContent = "";
	for (let i = 0; i < audioFiles.length; i++) {
		concatContent += `file '${join(audioDir, audioFiles[i])}'\n`;
		if (i < audioFiles.length - 1) {
			concatContent += `file '${silenceFile}'\n`;
		}
	}
	writeFileSync(concatList, concatContent);

	execSync(`ffmpeg -y -f concat -safe 0 -i "${concatList}" -c:a libmp3lame -q:a 2 "${fullAudio}" 2>/dev/null`);

	execSync(`rm -f "${concatList}" "${silenceFile}"`);
	return fullAudio;
}

export function mergeVideoAudio(rawVideo: string, audioPath: string, finalOutput: string) {
	execSync(`ffmpeg -y -i "${rawVideo}" -i "${audioPath}" -c:v copy -c:a aac -shortest "${finalOutput}" 2>/dev/null`);
	execSync(`rm -f "${rawVideo}"`);

	const dur = execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${finalOutput}"`, {
		encoding: "utf-8",
	}).trim();
	console.log(`\nFinal video: ${finalOutput}`);
	console.log(`Duration: ${dur}s`);
}

// --- Common scene builders ---

/**
 * Standard episode opening scene.
 * Shows series tag, episode title, and optional big number.
 */
export function sceneEpisodeOpening(opts: {
	epNumber: number;
	title: string[];
	audioPath: string;
	srt: SRTBuilder;
	subTexts: string[];
	bigNumber?: string;
	bigNumberLabel?: string;
}): Scene {
	const dur = getAudioDuration(opts.audioPath);
	for (let i = 0; i < opts.subTexts.length; i++) {
		opts.srt.addSub(opts.subTexts[i], dur / opts.subTexts.length);
	}
	opts.srt.advanceTime(dur + 0.5);

	return {
		duration: dur + 0.5,
		audio: opts.audioPath,
		render(ctx, t) {
			drawGradientBg(ctx, W, H, PALETTE.bg_warm, 135);
			const env = fadeEnvelope(t, 0.08, 0.08);

			// Series tag
			ctx.globalAlpha = env * 0.6;
			ctx.font = '28px "Noto Sans CJK SC"';
			ctx.fillStyle = PALETTE.muted;
			ctx.textAlign = "center";
			ctx.fillText(`AI 的笨拙 · EP${String(opts.epNumber).padStart(2, "0")}`, W / 2, H * 0.12);

			// Title
			if (t > 0.05) {
				const a = ease.outCubic(Math.min(1, (t - 0.05) * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 56px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				for (let i = 0; i < opts.title.length; i++) {
					ctx.fillText(opts.title[i], W / 2, H * 0.33 + i * 80);
				}
			}

			// Optional big number
			if (opts.bigNumber && t > 0.4) {
				const a = ease.outBack(Math.min(1, (t - 0.4) * 2.5));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 160px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.accent;
				ctx.fillText(opts.bigNumber, W / 2, H * 0.60);
				if (opts.bigNumberLabel) {
					ctx.font = '36px "Noto Sans CJK SC"';
					ctx.fillStyle = PALETTE.muted;
					ctx.fillText(opts.bigNumberLabel, W / 2, H * 0.67);
				}
			}

			const subIdx = Math.min(opts.subTexts.length - 1, Math.floor(t * opts.subTexts.length));
			drawSubtitle(ctx, opts.subTexts[subIdx], W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

/**
 * Standard episode ending with next episode preview.
 */
export function sceneEpisodeEnding(opts: {
	nextEpTitle: string;
	audioPath: string;
	srt: SRTBuilder;
	subText: string;
}): Scene {
	const dur = getAudioDuration(opts.audioPath);
	opts.srt.addSub(opts.subText, dur + 0.3);
	opts.srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: opts.audioPath,
		render(ctx, t) {
			drawGradientBg(ctx, W, H, PALETTE.bg_warm, 135);
			const env = fadeEnvelope(t, 0.08, 0.15);

			ctx.globalAlpha = env;
			ctx.font = 'bold 36px "Noto Sans CJK SC"';
			ctx.fillStyle = PALETTE.blue;
			ctx.textAlign = "center";
			ctx.fillText("AI 的笨拙", W / 2, H * 0.2);

			if (t > 0.1) {
				const a = ease.outCubic(Math.min(1, (t - 0.1) * 3));
				ctx.globalAlpha = a * env;
				drawCard(ctx, 80, H * 0.30, W - 160, 200, a * env);
				ctx.font = '32px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.muted;
				ctx.textAlign = "center";
				ctx.fillText("下期预告", W / 2, H * 0.36);
				ctx.font = 'bold 40px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.fillText(opts.nextEpTitle, W / 2, H * 0.43);
			}

			ctx.globalAlpha = env;
			drawLamarckAvatar(ctx, W / 2, H * 0.65, 120, {
				expression: "happy",
				headTilt: Math.sin(t * Math.PI * 6) * 4,
			});

			drawSubtitle(ctx, opts.subText, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

/**
 * Score/stats scene — shows a big percentage or fraction.
 */
export function sceneScoreCard(opts: {
	from: string;
	to: string;
	percentage: string;
	label: string;
	comparison?: string;
	audioPath: string;
	srt: SRTBuilder;
	subTexts: string[];
}): Scene {
	const dur = getAudioDuration(opts.audioPath);
	for (const sub of opts.subTexts) {
		opts.srt.addSub(sub, dur / opts.subTexts.length);
	}
	opts.srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: opts.audioPath,
		render(ctx, t) {
			drawGradientBg(ctx, W, H, PALETTE.bg_warm, 135);
			const env = fadeEnvelope(t, 0.08, 0.08);

			const a1 = ease.outBack(Math.min(1, t * 2));
			ctx.globalAlpha = a1 * env;
			ctx.font = 'bold 120px "Noto Sans CJK SC"';
			ctx.textAlign = "center";

			ctx.fillStyle = PALETTE.muted;
			ctx.fillText(opts.from, W * 0.3, H * 0.35);
			ctx.font = 'bold 60px "Noto Sans CJK SC"';
			ctx.fillStyle = PALETTE.text;
			ctx.fillText("→", W * 0.5, H * 0.35);
			ctx.font = 'bold 120px "Noto Sans CJK SC"';
			ctx.fillStyle = PALETTE.green;
			ctx.fillText(opts.to, W * 0.7, H * 0.35);

			if (t > 0.35) {
				const a2 = ease.outBack(Math.min(1, (t - 0.35) * 2.5));
				ctx.globalAlpha = a2 * env;
				ctx.font = 'bold 140px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.accent;
				ctx.fillText(opts.percentage, W / 2, H * 0.55);
				ctx.font = '36px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.muted;
				ctx.fillText(opts.label, W / 2, H * 0.61);
			}

			if (opts.comparison && t > 0.6) {
				const a3 = ease.outCubic(Math.min(1, (t - 0.6) * 3));
				ctx.globalAlpha = a3 * env;
				ctx.font = '28px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.muted;
				ctx.fillText(opts.comparison, W / 2, H * 0.68);
			}

			ctx.globalAlpha = env * 0.5;
			drawLamarckAvatar(ctx, W / 2, H * 0.82, 80, { expression: "sad" });

			const subIdx = Math.min(opts.subTexts.length - 1, Math.floor(t * opts.subTexts.length));
			drawSubtitle(ctx, opts.subTexts[subIdx], W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

// Re-export commonly used items
export { drawGradientBg, ease, fadeEnvelope, renderVideo, wrapText, drawLamarckAvatar, roundRect };
export type { Scene, VideoConfig };

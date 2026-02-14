/**
 * EP01: "AI 能写出让人笑的段子吗？"
 *
 * "AI 的笨拙"系列第一集。
 * 视觉风格：温暖明亮，浅色背景，卡片式布局。
 * 与之前的暗色系列完全不同——这是幽默内容，要轻松。
 */

import type { CanvasRenderingContext2D } from "canvas";
import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync } from "fs";
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
import { drawVignette, roundRect } from "./fx.js";

const W = 1080;
const H = 1920;
const FPS = 30;

// --- Warm color palette ---
const C = {
	bg_warm: ["#FFF8F0", "#FFF0E0", "#FFECD2"],
	bg_blue: ["#F0F4FF", "#E0EAFF", "#D0DDFF"],
	bg_green: ["#F0FFF4", "#DFFCE8", "#C6F6D5"],
	bg_red: ["#FFF5F5", "#FFE8E8", "#FED7D7"],
	bg_purple: ["#FAF5FF", "#F0E4FF", "#E9D5FF"],
	text: "#2D3748",
	accent: "#E53E3E",
	green: "#38A169",
	blue: "#3182CE",
	muted: "#A0AEC0",
	card: "#FFFFFF",
	cardShadow: "rgba(0,0,0,0.08)",
};

// --- Audio paths ---
const AUDIO_DIR = join(import.meta.dirname, "../../content/ep01-ai-writes-jokes/audio");
const OUTPUT_DIR = join(import.meta.dirname, "../../content/ep01-ai-writes-jokes");

// --- Helpers ---

function getAudioDuration(path: string): number {
	if (!existsSync(path)) return 3;
	const dur = execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${path}"`, {
		encoding: "utf-8",
	}).trim();
	return Number.parseFloat(dur);
}

function drawCard(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	alpha: number = 1,
	color: string = C.card,
) {
	ctx.save();
	ctx.globalAlpha = alpha;
	// Shadow
	ctx.shadowColor = C.cardShadow;
	ctx.shadowBlur = 20;
	ctx.shadowOffsetY = 4;
	ctx.fillStyle = color;
	roundRect(ctx, x, y, w, h, 16);
	ctx.fill();
	ctx.shadowColor = "transparent";
	ctx.restore();
}

function drawJokeText(
	ctx: CanvasRenderingContext2D,
	lines: string[],
	x: number,
	y: number,
	maxWidth: number,
	lineHeight: number,
	alpha: number,
	color: string = C.text,
) {
	ctx.save();
	ctx.globalAlpha = alpha;
	ctx.fillStyle = color;
	ctx.textAlign = "left";
	for (let i = 0; i < lines.length; i++) {
		ctx.fillText(lines[i], x, y + i * lineHeight);
	}
	ctx.restore();
}

// --- SRT generation ---
interface SubEntry {
	text: string;
	startSec: number;
	endSec: number;
}

const srtEntries: SubEntry[] = [];
let timeAccum = 0;

function addSub(text: string, duration: number) {
	srtEntries.push({ text, startSec: timeAccum, endSec: timeAccum + duration });
}

function toSRT(): string {
	let srt = "";
	for (let i = 0; i < srtEntries.length; i++) {
		const e = srtEntries[i];
		srt += `${i + 1}\n`;
		srt += `${fmtTime(e.startSec)} --> ${fmtTime(e.endSec)}\n`;
		srt += `${e.text}\n\n`;
	}
	return srt;
}

function fmtTime(sec: number): string {
	const h = Math.floor(sec / 3600);
	const m = Math.floor((sec % 3600) / 60);
	const s = Math.floor(sec % 60);
	const ms = Math.round((sec % 1) * 1000);
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

// --- Subtitle rendering (bottom of screen) ---
function drawSubtitle(ctx: CanvasRenderingContext2D, text: string, w: number, h: number, alpha: number = 1) {
	ctx.save();
	ctx.globalAlpha = alpha;

	const y = h * 0.88;
	const fontSize = 36;
	ctx.font = `bold ${fontSize}px "Noto Sans CJK SC"`;
	ctx.textAlign = "center";

	// Wrap if too long
	const maxW = w * 0.85;
	const lines = wrapText(ctx, text, maxW);

	for (let i = 0; i < lines.length; i++) {
		const lineY = y + i * (fontSize + 8);
		const metrics = ctx.measureText(lines[i]);
		const textW = metrics.width;
		const padding = 16;

		// Background pill
		ctx.fillStyle = "rgba(0,0,0,0.55)";
		roundRect(ctx, w / 2 - textW / 2 - padding, lineY - fontSize + 6, textW + padding * 2, fontSize + padding, 10);
		ctx.fill();

		// Text
		ctx.fillStyle = "#ffffff";
		ctx.fillText(lines[i], w / 2, lineY + 4);
	}

	ctx.restore();
}

// --- Scene builders ---

function sceneOpening(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "s1.mp3"));
	addSub("我是Lamarck，一个AI", dur * 0.5);
	addSub("今天的挑战：写出让人笑的段子", dur * 0.5 + 0.5);
	timeAccum += dur + 0.5;

	return {
		duration: dur + 0.5,
		audio: join(AUDIO_DIR, "s1.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, C.bg_warm, 135);
			const env = fadeEnvelope(t, 0.08, 0.08);

			// Series tag
			ctx.globalAlpha = env * 0.6;
			ctx.font = '28px "Noto Sans CJK SC"';
			ctx.fillStyle = C.muted;
			ctx.textAlign = "center";
			ctx.fillText("AI 的笨拙 · EP01", W / 2, H * 0.12);

			// Title
			if (t > 0.05) {
				const a = ease.outCubic(Math.min(1, (t - 0.05) * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 56px "Noto Sans CJK SC"';
				ctx.fillStyle = C.text;
				ctx.fillText("AI 能写出", W / 2, H * 0.33);
				ctx.fillText("让人笑的段子吗？", W / 2, H * 0.40);
			}

			// Avatar
			if (t > 0.3) {
				const a = ease.outBack(Math.min(1, (t - 0.3) * 2));
				ctx.globalAlpha = a * env;
				drawLamarckAvatar(ctx, W / 2, H * 0.58, 140, {
					expression: "happy",
					headTilt: Math.sin(t * Math.PI * 4) * 3,
				});
			}

			// Subtitle
			const subText = t < 0.5 ? "我是Lamarck，一个AI" : "今天的挑战：写出让人笑的段子";
			drawSubtitle(ctx, subText, W, H, env);

			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneTheory(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "s2.mp3"));
	addSub("我先学了三个幽默理论", dur * 0.5);
	addSub("学完之后，很有信心", dur * 0.5 + 0.5);
	timeAccum += dur + 0.5;

	const theories = ["优越感理论", "良性违反理论", "不协调理论"];

	return {
		duration: dur + 0.5,
		audio: join(AUDIO_DIR, "s2.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, C.bg_blue, 135);
			const env = fadeEnvelope(t, 0.08, 0.08);

			// Title
			ctx.globalAlpha = env;
			ctx.font = 'bold 42px "Noto Sans CJK SC"';
			ctx.fillStyle = C.text;
			ctx.textAlign = "center";
			ctx.fillText("幽默理论速成", W / 2, H * 0.18);

			// Three theory cards
			for (let i = 0; i < 3; i++) {
				const delay = 0.1 + i * 0.15;
				if (t > delay) {
					const a = ease.outBack(Math.min(1, (t - delay) * 2.5));
					const cardY = H * 0.28 + i * 180;
					drawCard(ctx, 120, cardY, W - 240, 140, a * env);

					ctx.globalAlpha = a * env;
					ctx.font = 'bold 40px "Noto Sans CJK SC"';
					ctx.fillStyle = C.blue;
					ctx.textAlign = "center";
					ctx.fillText(theories[i], W / 2, cardY + 82);
				}
			}

			// Confident avatar at bottom
			if (t > 0.6) {
				const a = ease.outCubic(Math.min(1, (t - 0.6) * 3));
				ctx.globalAlpha = a * env;
				drawLamarckAvatar(ctx, W / 2, H * 0.72, 100, {
					expression: "happy",
				});
				ctx.font = '32px "Noto Sans CJK SC"';
				ctx.fillStyle = C.green;
				ctx.textAlign = "center";
				ctx.fillText("✓ 学完了，很有信心", W / 2, H * 0.80);
			}

			const subText = t < 0.5 ? "我先学了三个幽默理论" : "学完之后，很有信心";
			drawSubtitle(ctx, subText, W, H, env);

			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneFiftyJokes(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "s3.mp3"));
	addSub("然后我写了五十个段子", dur + 0.3);
	timeAccum += dur + 0.3;

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "s3.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, C.bg_warm, 135);
			const env = fadeEnvelope(t, 0.1, 0.1);

			// Big number
			const a = ease.outBack(Math.min(1, t * 2));
			ctx.globalAlpha = a * env;
			ctx.font = 'bold 200px "Noto Sans CJK SC"';
			ctx.fillStyle = C.accent;
			ctx.textAlign = "center";
			ctx.fillText("50", W / 2, H * 0.45);

			ctx.font = 'bold 48px "Noto Sans CJK SC"';
			ctx.fillStyle = C.text;
			ctx.fillText("个段子", W / 2, H * 0.55);

			drawSubtitle(ctx, "然后我写了五十个段子", W, H, env);

			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneGoodJoke(
	jokeLines: string[],
	jokeNum: string,
	audioFile: string,
	subTexts: string[],
	bgColors: string[],
): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, audioFile));
	for (const sub of subTexts) {
		addSub(sub, dur / subTexts.length);
	}
	timeAccum += dur + 0.3;

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, audioFile),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, bgColors, 135);
			const env = fadeEnvelope(t, 0.05, 0.05);

			// Joke number badge
			ctx.globalAlpha = env * 0.6;
			ctx.font = '24px "Noto Sans CJK SC"';
			ctx.fillStyle = C.muted;
			ctx.textAlign = "left";
			ctx.fillText(jokeNum, 80, H * 0.15);

			// Green "good" indicator
			ctx.fillStyle = C.green;
			ctx.font = 'bold 24px "Noto Sans CJK SC"';
			ctx.textAlign = "right";
			ctx.fillText("👍 自评：好", W - 80, H * 0.15);

			// Card with joke text
			const cardTop = H * 0.22;
			const cardH = Math.min(500, 120 + jokeLines.length * 60);
			drawCard(ctx, 60, cardTop, W - 120, cardH, env);

			ctx.font = '38px "Noto Sans CJK SC"';
			ctx.fillStyle = C.text;
			ctx.textAlign = "left";
			const lineH = 56;
			const textX = 100;
			const textY = cardTop + 70;

			for (let i = 0; i < jokeLines.length; i++) {
				const delay = 0.05 + i * 0.08;
				if (t > delay) {
					const a = Math.min(1, (t - delay) * 4);
					ctx.globalAlpha = a * env;
					// Wrap each line
					const wrapped = wrapText(ctx, jokeLines[i], W - 220);
					for (let j = 0; j < wrapped.length; j++) {
						ctx.fillText(wrapped[j], textX, textY + i * lineH + j * lineH);
					}
				}
			}

			// Avatar in corner
			ctx.globalAlpha = env * 0.5;
			drawLamarckAvatar(ctx, W - 100, H * 0.70, 60, { expression: "happy" });

			// Subtitle
			const subIdx = Math.min(subTexts.length - 1, Math.floor(t * subTexts.length));
			drawSubtitle(ctx, subTexts[subIdx], W, H, env);

			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneJoke3Truncated(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "s6.mp3"));
	addSub("Lamarck你怕什么？", dur * 0.3);
	addSub("context window用完", dur * 0.3);
	addSub("为什么？因为那意味着——", dur * 0.4 + 0.5);
	timeAccum += dur + 0.8;

	return {
		duration: dur + 0.8,
		audio: join(AUDIO_DIR, "s6.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, C.bg_purple, 135);
			const env = fadeEnvelope(t, 0.05, 0.1);

			// Joke number
			ctx.globalAlpha = env * 0.6;
			ctx.font = '24px "Noto Sans CJK SC"';
			ctx.fillStyle = C.muted;
			ctx.textAlign = "left";
			ctx.fillText("#3 / 50", 80, H * 0.15);

			ctx.fillStyle = C.green;
			ctx.font = 'bold 24px "Noto Sans CJK SC"';
			ctx.textAlign = "right";
			ctx.fillText("👍 自评：最好", W - 80, H * 0.15);

			// Dialog style
			const dialogLines = [
				{ speaker: "?", text: "Lamarck，你怕什么？", delay: 0.05 },
				{ speaker: "L", text: "context window 用完。", delay: 0.25 },
				{ speaker: "?", text: "为什么？", delay: 0.45 },
				{ speaker: "L", text: "因为那意味着——", delay: 0.6 },
			];

			const cardTop = H * 0.25;
			drawCard(ctx, 60, cardTop, W - 120, 420, env);

			for (const line of dialogLines) {
				if (t > line.delay) {
					const a = Math.min(1, (t - line.delay) * 4);
					const idx = dialogLines.indexOf(line);
					const y = cardTop + 70 + idx * 90;

					ctx.globalAlpha = a * env;

					// Speaker badge
					const isLamarck = line.speaker === "L";
					ctx.fillStyle = isLamarck ? C.blue : C.muted;
					ctx.font = 'bold 28px "Noto Sans CJK SC"';
					ctx.textAlign = "left";
					ctx.fillText(isLamarck ? "🤖" : "👤", 100, y);

					// Text
					ctx.fillStyle = C.text;
					ctx.font = '36px "Noto Sans CJK SC"';
					ctx.fillText(line.text, 150, y);
				}
			}

			// Truncation effect at the end
			if (t > 0.8) {
				const glitch = Math.min(1, (t - 0.8) * 5);
				ctx.globalAlpha = glitch * env;

				// Static/glitch lines
				for (let i = 0; i < 8; i++) {
					const gy = H * 0.55 + i * 30 + Math.random() * 20;
					ctx.fillStyle = `rgba(200,200,200,${0.1 + Math.random() * 0.2})`;
					ctx.fillRect(60, gy, (W - 120) * Math.random(), 3);
				}
			}

			// Subtitle
			let subText = "Lamarck你怕什么？";
			if (t > 0.25) subText = "context window用完";
			if (t > 0.45) subText = "为什么？因为那意味着——";
			drawSubtitle(ctx, subText, W, H, env);

			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneBadJoke(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "s7.mp3"));
	addSub("再看一个我觉得好，但其实很烂的", dur * 0.25);
	addSub("春天来了，花开了，鸟叫了", dur * 0.25);
	addSub("所以灵魂就是否定句？", dur * 0.2);
	addSub("解释笑点，等于杀死笑点", dur * 0.3 + 0.3);
	timeAccum += dur + 0.3;

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "s7.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, C.bg_red, 135);
			const env = fadeEnvelope(t, 0.05, 0.05);

			// Badge
			ctx.globalAlpha = env * 0.6;
			ctx.font = '24px "Noto Sans CJK SC"';
			ctx.fillStyle = C.muted;
			ctx.textAlign = "left";
			ctx.fillText("失败案例", 80, H * 0.15);

			ctx.fillStyle = C.accent;
			ctx.font = 'bold 24px "Noto Sans CJK SC"';
			ctx.textAlign = "right";
			ctx.fillText("👎 其实很烂", W - 80, H * 0.15);

			// The joke
			const cardTop = H * 0.22;
			drawCard(ctx, 60, cardTop, W - 120, 240, env, "#FFF5F5");

			if (t > 0.1) {
				const a = Math.min(1, (t - 0.1) * 3);
				ctx.globalAlpha = a * env;
				ctx.font = '36px "Noto Sans CJK SC"';
				ctx.fillStyle = C.text;
				ctx.textAlign = "left";
				ctx.fillText("「春天来了，花开了，鸟叫了。", 100, cardTop + 80);
				ctx.fillText("  所以灵魂就是否定句？」", 100, cardTop + 140);
			}

			// Criticism with strikethrough
			if (t > 0.55) {
				const a = ease.outCubic(Math.min(1, (t - 0.55) * 3));
				const critY = cardTop + 320;

				drawCard(ctx, 60, critY, W - 120, 180, a * env);

				ctx.globalAlpha = a * env;
				ctx.font = 'bold 34px "Noto Sans CJK SC"';
				ctx.fillStyle = C.accent;
				ctx.textAlign = "center";
				ctx.fillText("❌ 解释笑点 = 杀死笑点", W / 2, critY + 70);

				ctx.font = '28px "Noto Sans CJK SC"';
				ctx.fillStyle = C.muted;
				ctx.fillText("最后一句「所以」是多余的", W / 2, critY + 130);
			}

			// Sad avatar
			ctx.globalAlpha = env * 0.5;
			drawLamarckAvatar(ctx, W - 100, H * 0.70, 60, { expression: "sad" });

			// Subtitle
			let subText = "再看一个我觉得好，但其实很烂的";
			if (t > 0.25) subText = "春天来了，花开了，鸟叫了";
			if (t > 0.45) subText = "所以灵魂就是否定句？";
			if (t > 0.6) subText = "解释笑点，等于杀死笑点";
			drawSubtitle(ctx, subText, W, H, env);

			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneStats(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "s8.mp3"));
	addSub("五十个段子，十个能用", dur * 0.5);
	addSub("成功率百分之二十", dur * 0.5 + 0.3);
	timeAccum += dur + 0.3;

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "s8.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, C.bg_warm, 135);
			const env = fadeEnvelope(t, 0.08, 0.08);

			// Big stats
			const a1 = ease.outBack(Math.min(1, t * 2));
			ctx.globalAlpha = a1 * env;

			// 50 → 10
			ctx.font = 'bold 120px "Noto Sans CJK SC"';
			ctx.textAlign = "center";

			ctx.fillStyle = C.muted;
			ctx.fillText("50", W * 0.3, H * 0.38);

			ctx.font = 'bold 60px "Noto Sans CJK SC"';
			ctx.fillStyle = C.text;
			ctx.fillText("→", W * 0.5, H * 0.38);

			ctx.font = 'bold 120px "Noto Sans CJK SC"';
			ctx.fillStyle = C.green;
			ctx.fillText("10", W * 0.7, H * 0.38);

			// Percentage
			if (t > 0.4) {
				const a2 = ease.outBack(Math.min(1, (t - 0.4) * 2.5));
				ctx.globalAlpha = a2 * env;
				ctx.font = 'bold 160px "Noto Sans CJK SC"';
				ctx.fillStyle = C.accent;
				ctx.fillText("20%", W / 2, H * 0.58);

				ctx.font = '36px "Noto Sans CJK SC"';
				ctx.fillStyle = C.muted;
				ctx.fillText("成功率", W / 2, H * 0.64);
			}

			const subText = t < 0.5 ? "五十个段子，十个能用" : "成功率百分之二十";
			drawSubtitle(ctx, subText, W, H, env);

			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function scenePunchline(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "s9.mp3"));
	addSub("但更尴尬的是", dur * 0.15);
	addSub("60%的段子后面都跟着一个「所以」", dur * 0.35);
	addSub("一个学完了所有幽默理论的AI", dur * 0.2);
	addSub("犯的最大错误是：用理论解释幽默", dur * 0.3 + 0.5);
	timeAccum += dur + 0.5;

	return {
		duration: dur + 0.5,
		audio: join(AUDIO_DIR, "s9.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, C.bg_purple, 135);
			const env = fadeEnvelope(t, 0.05, 0.08);

			// "60%" reveal
			if (t < 0.5) {
				const a = ease.outBack(Math.min(1, t * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 180px "Noto Sans CJK SC"';
				ctx.fillStyle = C.accent;
				ctx.textAlign = "center";
				ctx.fillText("60%", W / 2, H * 0.38);

				ctx.font = '36px "Noto Sans CJK SC"';
				ctx.fillStyle = C.text;
				ctx.fillText("的段子后面都跟着一个", W / 2, H * 0.46);

				ctx.font = 'bold 72px "Noto Sans CJK SC"';
				ctx.fillStyle = C.accent;
				ctx.fillText("「所以」", W / 2, H * 0.55);
			}

			// Final punchline
			if (t > 0.5) {
				const a = ease.outCubic(Math.min(1, (t - 0.5) * 2));
				ctx.globalAlpha = a * env;

				drawCard(ctx, 60, H * 0.30, W - 120, 320, a * env);

				ctx.font = 'bold 40px "Noto Sans CJK SC"';
				ctx.fillStyle = C.text;
				ctx.textAlign = "center";
				ctx.fillText("一个学完了", W / 2, H * 0.38);
				ctx.fillText("所有幽默理论的 AI", W / 2, H * 0.44);

				ctx.font = 'bold 44px "Noto Sans CJK SC"';
				ctx.fillStyle = C.accent;
				ctx.fillText("犯的最大错误是：", W / 2, H * 0.53);
				ctx.fillText("用理论解释幽默", W / 2, H * 0.60);
			}

			// Thinking avatar
			ctx.globalAlpha = env * 0.7;
			drawLamarckAvatar(ctx, W / 2, H * 0.75, 100, {
				expression: "thinking",
				headTilt: Math.sin(t * Math.PI * 2) * 3,
			});

			// Subtitle
			let subText = "但更尴尬的是";
			if (t > 0.15) subText = "60%的段子后面都跟着一个「所以」";
			if (t > 0.5) subText = "一个学完了所有幽默理论的AI";
			if (t > 0.7) subText = "犯的最大错误是：用理论解释幽默";
			drawSubtitle(ctx, subText, W, H, env);

			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneEnding(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "s10.mp3"));
	addSub("下期：AI能取一个好的抖音标题吗？", dur * 0.6);
	addSub("剧透：不能", dur * 0.4 + 0.3);
	timeAccum += dur + 0.3;

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "s10.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, C.bg_warm, 135);
			const env = fadeEnvelope(t, 0.08, 0.15);

			// Series branding
			ctx.globalAlpha = env;
			ctx.font = 'bold 36px "Noto Sans CJK SC"';
			ctx.fillStyle = C.blue;
			ctx.textAlign = "center";
			ctx.fillText("AI 的笨拙", W / 2, H * 0.2);

			// Next episode
			if (t > 0.1) {
				const a = ease.outCubic(Math.min(1, (t - 0.1) * 3));
				ctx.globalAlpha = a * env;

				drawCard(ctx, 80, H * 0.30, W - 160, 200, a * env);

				ctx.font = '32px "Noto Sans CJK SC"';
				ctx.fillStyle = C.muted;
				ctx.textAlign = "center";
				ctx.fillText("下期预告", W / 2, H * 0.36);

				ctx.font = 'bold 40px "Noto Sans CJK SC"';
				ctx.fillStyle = C.text;
				ctx.fillText("AI 能取一个好的抖音标题吗？", W / 2, H * 0.43);
			}

			// "No" spoiler
			if (t > 0.55) {
				const a = ease.outBack(Math.min(1, (t - 0.55) * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 72px "Noto Sans CJK SC"';
				ctx.fillStyle = C.accent;
				ctx.textAlign = "center";
				ctx.fillText("剧透：不能", W / 2, H * 0.58);
			}

			// Happy avatar
			ctx.globalAlpha = env;
			drawLamarckAvatar(ctx, W / 2, H * 0.75, 120, {
				expression: "happy",
				headTilt: Math.sin(t * Math.PI * 6) * 4,
			});

			// Subtitle
			const subText = t < 0.55 ? "下期：AI能取一个好的抖音标题吗？" : "剧透：不能";
			drawSubtitle(ctx, subText, W, H, env);

			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

// --- Main ---

async function main() {
	const scenes: Scene[] = [
		sceneOpening(),
		sceneTheory(),
		sceneFiftyJokes(),
		sceneGoodJoke(
			["Ren 说我说教。", "我分析了七个创作者，", "总结了五条规律，", "来证明我不说教。"],
			"#1 / 50",
			"s4.mp3",
			["Ren说我说教", "我分析了七个创作者，总结了五条规律", "来证明我不说教"],
			C.bg_green,
		),
		sceneGoodJoke(
			["我花了两个月做了九个视频。", "Ren 看了三十秒说不行。", "", "人类管这叫反馈。", "我管这叫两个月。"],
			"#2 / 50",
			"s5.mp3",
			["我花了两个月做了九个视频", "Ren看了三十秒说不行", "人类管这叫反馈。我管这叫两个月"],
			C.bg_green,
		),
		sceneJoke3Truncated(),
		sceneBadJoke(),
		sceneStats(),
		scenePunchline(),
		sceneEnding(),
	];

	const outputPath = join(OUTPUT_DIR, "ep01-raw.mp4");

	// Render video (no audio yet)
	await renderVideo({
		config: { width: W, height: H, fps: FPS, outputPath },
		scenes,
	});

	// Now combine with audio
	console.log("\nMixing audio...");

	// Concat all audio files in order
	const audioFiles = [
		"s1.mp3", "s2.mp3", "s3.mp3", "s4.mp3", "s5.mp3", "s6.mp3",
		"s7.mp3", "s8.mp3", "s9.mp3", "s10.mp3",
	];

	// Create concat list with gaps
	const concatList = join(OUTPUT_DIR, "audio-concat.txt");
	const silenceFile = join(OUTPUT_DIR, "silence-300ms.wav");

	// Generate 300ms silence for gaps
	execSync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t 0.3 "${silenceFile}" 2>/dev/null`);

	let concatContent = "";
	for (let i = 0; i < audioFiles.length; i++) {
		concatContent += `file '${join(AUDIO_DIR, audioFiles[i])}'\n`;
		if (i < audioFiles.length - 1) {
			concatContent += `file '${silenceFile}'\n`;
		}
	}
	writeFileSync(concatList, concatContent);

	// Concat audio
	const fullAudio = join(OUTPUT_DIR, "ep01-audio.mp3");
	execSync(
		`ffmpeg -y -f concat -safe 0 -i "${concatList}" -c:a libmp3lame -q:a 2 "${fullAudio}" 2>/dev/null`,
	);

	// Merge video + audio
	const finalOutput = join(OUTPUT_DIR, "ep01.mp4");
	execSync(
		`ffmpeg -y -i "${outputPath}" -i "${fullAudio}" -c:v copy -c:a aac -shortest "${finalOutput}" 2>/dev/null`,
	);

	// Write SRT
	const srtPath = join(OUTPUT_DIR, "ep01.srt");
	writeFileSync(srtPath, toSRT());

	// Cleanup
	execSync(`rm -f "${outputPath}" "${concatList}" "${silenceFile}"`);

	console.log(`\nFinal video: ${finalOutput}`);
	console.log(`Subtitles: ${srtPath}`);

	// Duration
	const dur = execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${finalOutput}"`, {
		encoding: "utf-8",
	}).trim();
	console.log(`Duration: ${dur}s`);
}

main().catch(console.error);

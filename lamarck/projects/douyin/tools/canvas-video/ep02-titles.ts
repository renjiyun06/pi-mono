/**
 * EP02: "AI 能写出让人点进来的标题吗？"
 *
 * "AI 的笨拙"系列第二集。
 * 核心洞察：论点不是标题，总结能力 ≠ 吸引力。
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

const C = {
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

const AUDIO_DIR = join(import.meta.dirname, "../../content/ep02-ai-writes-titles/audio");
const OUTPUT_DIR = join(import.meta.dirname, "../../content/ep02-ai-writes-titles");

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
	ctx.shadowColor = C.cardShadow;
	ctx.shadowBlur = 20;
	ctx.shadowOffsetY = 4;
	ctx.fillStyle = color;
	roundRect(ctx, x, y, w, h, 16);
	ctx.fill();
	ctx.shadowColor = "transparent";
	ctx.restore();
}

function drawSubtitle(ctx: CanvasRenderingContext2D, text: string, w: number, h: number, alpha: number = 1) {
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

// --- SRT ---
interface SubEntry { text: string; startSec: number; endSec: number; }
const srtEntries: SubEntry[] = [];
let timeAccum = 0;

function addSub(text: string, duration: number) {
	srtEntries.push({ text, startSec: timeAccum, endSec: timeAccum + duration });
}

function toSRT(): string {
	let srt = "";
	for (let i = 0; i < srtEntries.length; i++) {
		const e = srtEntries[i];
		srt += `${i + 1}\n${fmtTime(e.startSec)} --> ${fmtTime(e.endSec)}\n${e.text}\n\n`;
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

// --- Scenes ---

function sceneOpening(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-01.mp3"));
	addSub("上一集写段子，这一集写标题", dur * 0.5);
	addSub("我学了六种爆款标题公式，然后写了五十个", dur * 0.5 + 0.5);
	timeAccum += dur + 0.5;

	return {
		duration: dur + 0.5,
		audio: join(AUDIO_DIR, "scene-01.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, C.bg_warm, 135);
			const env = fadeEnvelope(t, 0.08, 0.08);

			// Series tag
			ctx.globalAlpha = env * 0.6;
			ctx.font = '28px "Noto Sans CJK SC"';
			ctx.fillStyle = C.muted;
			ctx.textAlign = "center";
			ctx.fillText("AI 的笨拙 · EP02", W / 2, H * 0.12);

			// Title
			if (t > 0.05) {
				const a = ease.outCubic(Math.min(1, (t - 0.05) * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 56px "Noto Sans CJK SC"';
				ctx.fillStyle = C.text;
				ctx.fillText("AI 能写出", W / 2, H * 0.33);
				ctx.fillText("让人点进来的标题吗？", W / 2, H * 0.40);
			}

			// Big "50" number
			if (t > 0.4) {
				const a = ease.outBack(Math.min(1, (t - 0.4) * 2.5));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 160px "Noto Sans CJK SC"';
				ctx.fillStyle = C.accent;
				ctx.fillText("50", W / 2, H * 0.60);
				ctx.font = '36px "Noto Sans CJK SC"';
				ctx.fillStyle = C.muted;
				ctx.fillText("个标题", W / 2, H * 0.67);
			}

			const subText = t < 0.5 ? "上一集写段子，这一集写标题" : "我学了六种爆款标题公式，然后写了五十个";
			drawSubtitle(ctx, subText, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneGoodTitles(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-02.mp3"));
	addSub("有几个还行", dur * 0.2);
	addSub("你的论文拿了A，但你的大脑拿了F", dur * 0.4);
	addSub("导航让你不认路，AI让你不会想", dur * 0.4 + 0.5);
	timeAccum += dur + 0.5;

	const titles = [
		"你的论文拿了 A，但你的大脑拿了 F",
		"导航让你不认路，AI 让你不会想",
		"AI 是思考的外卖——方便，但你的厨艺在退化",
	];

	return {
		duration: dur + 0.5,
		audio: join(AUDIO_DIR, "scene-02.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, C.bg_green, 135);
			const env = fadeEnvelope(t, 0.05, 0.05);

			ctx.globalAlpha = env * 0.6;
			ctx.font = '28px "Noto Sans CJK SC"';
			ctx.fillStyle = C.green;
			ctx.textAlign = "left";
			ctx.fillText("👍 还行的", 80, H * 0.14);

			for (let i = 0; i < titles.length; i++) {
				const delay = 0.08 + i * 0.2;
				if (t > delay) {
					const a = ease.outBack(Math.min(1, (t - delay) * 2.5));
					const cardY = H * 0.22 + i * 170;
					drawCard(ctx, 60, cardY, W - 120, 130, a * env);
					ctx.globalAlpha = a * env;
					ctx.font = '34px "Noto Sans CJK SC"';
					ctx.fillStyle = C.text;
					ctx.textAlign = "center";
					const wrapped = wrapText(ctx, titles[i], W - 200);
					for (let j = 0; j < wrapped.length; j++) {
						ctx.fillText(wrapped[j], W / 2, cardY + 60 + j * 48);
					}
				}
			}

			ctx.globalAlpha = env * 0.5;
			drawLamarckAvatar(ctx, W - 100, H * 0.72, 60, { expression: "happy" });

			let subText = "有几个还行";
			if (t > 0.2) subText = "你的论文拿了A，但你的大脑拿了F";
			if (t > 0.6) subText = "导航让你不认路，AI让你不会想";
			drawSubtitle(ctx, subText, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneBadTitles(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-03.mp3"));
	addSub("但大部分是这样的", dur * 0.15);
	addSub("震惊！AI竟然在偷走你的思考能力！", dur * 0.4);
	addSub("我知道震惊体最低级，但我第一反应就是写震惊体", dur * 0.45 + 0.3);
	timeAccum += dur + 0.3;

	const badTitles = [
		"震惊！AI 竟然在偷走你的思考能力！",
		"太可怕了！哈佛研究证实 AI 让大脑萎缩！",
		"惊呆了！95% 的人不知道……",
		"万万没想到！用 AI 越多越笨！",
		"细思极恐！你每天用的 AI……",
	];

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-03.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, C.bg_red, 135);
			const env = fadeEnvelope(t, 0.05, 0.05);

			ctx.globalAlpha = env * 0.6;
			ctx.font = '28px "Noto Sans CJK SC"';
			ctx.fillStyle = C.accent;
			ctx.textAlign = "left";
			ctx.fillText("👎 震惊体泛滥", 80, H * 0.14);

			// Flash bad titles rapidly
			for (let i = 0; i < badTitles.length; i++) {
				const delay = 0.1 + i * 0.1;
				if (t > delay) {
					const a = ease.outCubic(Math.min(1, (t - delay) * 3));
					const cardY = H * 0.20 + i * 110;
					drawCard(ctx, 60, cardY, W - 120, 85, a * env, "#FFF5F5");

					ctx.globalAlpha = a * env;
					ctx.font = '30px "Noto Sans CJK SC"';
					ctx.fillStyle = C.accent;
					ctx.textAlign = "center";
					ctx.fillText(badTitles[i], W / 2, cardY + 52);

					// Red X
					if (t > delay + 0.15) {
						ctx.font = 'bold 48px "Noto Sans CJK SC"';
						ctx.fillStyle = C.accent;
						ctx.globalAlpha = Math.min(1, (t - delay - 0.15) * 5) * env;
						ctx.fillText("✗", W - 100, cardY + 58);
					}
				}
			}

			ctx.globalAlpha = env * 0.5;
			drawLamarckAvatar(ctx, W - 100, H * 0.72, 60, { expression: "sad" });

			let subText = "但大部分是这样的";
			if (t > 0.15) subText = "震惊！AI竟然在偷走你的思考能力！";
			if (t > 0.55) subText = "我知道震惊体最低级，但我第一反应就是写震惊体";
			drawSubtitle(ctx, subText, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneCoreProblem(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-04.mp3"));
	addSub("然后我发现了真正的问题", dur * 0.15);
	addSub("我写的全是论点", dur * 0.2);
	addSub("但好标题是事件", dur * 0.2);
	addSub("有人来帮我按猪吗。我花了三年做了一架钢琴", dur * 0.45 + 0.5);
	timeAccum += dur + 0.5;

	return {
		duration: dur + 0.5,
		audio: join(AUDIO_DIR, "scene-04.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, C.bg_purple, 135);
			const env = fadeEnvelope(t, 0.05, 0.05);

			// Left side: AI titles (arguments)
			if (t > 0.1) {
				const a = ease.outCubic(Math.min(1, (t - 0.1) * 3));
				const leftX = 60;
				const topY = H * 0.18;

				ctx.globalAlpha = a * env;
				ctx.font = 'bold 32px "Noto Sans CJK SC"';
				ctx.fillStyle = C.accent;
				ctx.textAlign = "center";
				ctx.fillText("我写的 → 论点", W / 2, topY);

				drawCard(ctx, leftX, topY + 30, W - 120, 200, a * env, "#FFF5F5");
				ctx.font = '32px "Noto Sans CJK SC"';
				ctx.fillStyle = C.muted;
				ctx.textAlign = "center";
				ctx.fillText(`「AI 让你变笨」`, W / 2, topY + 90);
				ctx.fillText(`「认知债务你要还」`, W / 2, topY + 140);
				ctx.fillText(`「独立思考最稀缺」`, W / 2, topY + 190);
			}

			// Right side: Good titles (events)
			if (t > 0.35) {
				const a = ease.outBack(Math.min(1, (t - 0.35) * 2.5));
				const topY2 = H * 0.45;

				ctx.globalAlpha = a * env;
				ctx.font = 'bold 32px "Noto Sans CJK SC"';
				ctx.fillStyle = C.green;
				ctx.textAlign = "center";
				ctx.fillText("好标题 → 事件", W / 2, topY2);

				drawCard(ctx, 60, topY2 + 30, W - 120, 200, a * env, "#F0FFF4");
				ctx.font = 'bold 34px "Noto Sans CJK SC"';
				ctx.fillStyle = C.text;
				ctx.textAlign = "center";
				ctx.fillText(`「有人来帮我按猪吗」`, W / 2, topY2 + 90);
				ctx.fillText(`「我花了三年做了一架钢琴」`, W / 2, topY2 + 140);
				ctx.fillText(`「合租真的太可怕了」`, W / 2, topY2 + 190);
			}

			ctx.globalAlpha = env * 0.5;
			drawLamarckAvatar(ctx, W / 2, H * 0.78, 80, { expression: "thinking" });

			let subText = "然后我发现了真正的问题";
			if (t > 0.15) subText = "我写的全是论点";
			if (t > 0.35) subText = "但好标题是事件";
			if (t > 0.55) subText = "有人来帮我按猪吗。我花了三年做了一架钢琴";
			drawSubtitle(ctx, subText, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneInsight(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-05.mp3"));
	addSub("论点是结论。标题应该是让你想知道结论的那个问题", dur * 0.5);
	addSub("我擅长总结，但总结出来的是结论，不是钩子", dur * 0.5 + 0.3);
	timeAccum += dur + 0.3;

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-05.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, C.bg_warm, 135);
			const env = fadeEnvelope(t, 0.05, 0.08);

			// Big text reveal
			if (t < 0.5) {
				const a = ease.outBack(Math.min(1, t * 2.5));
				ctx.globalAlpha = a * env;

				drawCard(ctx, 60, H * 0.25, W - 120, 280, a * env);
				ctx.font = 'bold 44px "Noto Sans CJK SC"';
				ctx.fillStyle = C.text;
				ctx.textAlign = "center";
				ctx.fillText("论点是结论", W / 2, H * 0.33);

				ctx.font = '36px "Noto Sans CJK SC"';
				ctx.fillStyle = C.muted;
				ctx.fillText("标题应该是让你", W / 2, H * 0.40);
				ctx.fillText("想知道结论的那个问题", W / 2, H * 0.46);
			}

			// Punchline
			if (t > 0.5) {
				const a = ease.outCubic(Math.min(1, (t - 0.5) * 2.5));
				ctx.globalAlpha = a * env;

				drawCard(ctx, 60, H * 0.55, W - 120, 180, a * env);
				ctx.font = 'bold 40px "Noto Sans CJK SC"';
				ctx.fillStyle = C.accent;
				ctx.textAlign = "center";
				ctx.fillText("总结能力 ≠ 吸引力", W / 2, H * 0.62);

				ctx.font = '32px "Noto Sans CJK SC"';
				ctx.fillStyle = C.muted;
				ctx.fillText("结论 ≠ 钩子", W / 2, H * 0.68);
			}

			let subText = "论点是结论。标题应该是让你想知道结论的那个问题";
			if (t > 0.5) subText = "我擅长总结，但总结出来的是结论，不是钩子";
			drawSubtitle(ctx, subText, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneFalseDiversity(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-06.mp3"));
	addSub("更尴尬的是，五十个标题里，独立的意思只有七八个", dur * 0.5);
	addSub("我以为我在创造多样性，其实我在重复自己", dur * 0.5 + 0.3);
	timeAccum += dur + 0.3;

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-06.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, C.bg_orange, 135);
			const env = fadeEnvelope(t, 0.05, 0.08);

			// Visualization: 50 circles, but only 7-8 unique colors
			const a1 = ease.outCubic(Math.min(1, t * 2));
			ctx.globalAlpha = a1 * env;

			const uniqueColors = ["#E53E3E", "#38A169", "#3182CE", "#805AD5", "#D69E2E", "#DD6B20", "#319795", "#B7791F"];
			const gridCols = 10;
			const gridRows = 5;
			const dotSize = 32;
			const startX = (W - gridCols * (dotSize * 2 + 10)) / 2 + dotSize;
			const startY = H * 0.22;

			for (let i = 0; i < 50; i++) {
				const col = i % gridCols;
				const row = Math.floor(i / gridCols);
				const x = startX + col * (dotSize * 2 + 10);
				const y = startY + row * (dotSize * 2 + 10);
				const colorIdx = i % uniqueColors.length;

				ctx.beginPath();
				ctx.arc(x, y, dotSize, 0, Math.PI * 2);
				ctx.fillStyle = uniqueColors[colorIdx] + "88";
				ctx.fill();
				ctx.strokeStyle = uniqueColors[colorIdx];
				ctx.lineWidth = 2;
				ctx.stroke();
			}

			// Labels
			ctx.font = 'bold 36px "Noto Sans CJK SC"';
			ctx.fillStyle = C.text;
			ctx.textAlign = "center";
			ctx.fillText("50 个标题", W / 2, startY - 30);

			// Arrow down to summary
			if (t > 0.3) {
				const a2 = ease.outCubic(Math.min(1, (t - 0.3) * 3));
				ctx.globalAlpha = a2 * env;

				const sumY = H * 0.62;
				ctx.font = 'bold 120px "Noto Sans CJK SC"';
				ctx.fillStyle = C.accent;
				ctx.fillText("7~8", W / 2, sumY);

				ctx.font = '36px "Noto Sans CJK SC"';
				ctx.fillStyle = C.muted;
				ctx.fillText("个独立的意思", W / 2, sumY + 50);
			}

			// Punchline
			if (t > 0.6) {
				const a3 = ease.outCubic(Math.min(1, (t - 0.6) * 3));
				ctx.globalAlpha = a3 * env;

				drawCard(ctx, 80, H * 0.72, W - 160, 100, a3 * env);
				ctx.font = 'bold 32px "Noto Sans CJK SC"';
				ctx.fillStyle = C.accent;
				ctx.textAlign = "center";
				ctx.fillText("多样性是虚假的", W / 2, H * 0.77);
			}

			let subText = "更尴尬的是，五十个标题里，独立的意思只有七八个";
			if (t > 0.5) subText = "我以为我在创造多样性，其实我在重复自己";
			drawSubtitle(ctx, subText, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneStats(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-07.mp3"));
	addSub("最终成绩，五十个标题，能用的三到五个", dur * 0.5);
	addSub("成功率百分之六到十。比写段子还低", dur * 0.5 + 0.3);
	timeAccum += dur + 0.3;

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-07.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, C.bg_warm, 135);
			const env = fadeEnvelope(t, 0.08, 0.08);

			const a1 = ease.outBack(Math.min(1, t * 2));
			ctx.globalAlpha = a1 * env;
			ctx.font = 'bold 120px "Noto Sans CJK SC"';
			ctx.textAlign = "center";

			ctx.fillStyle = C.muted;
			ctx.fillText("50", W * 0.3, H * 0.35);

			ctx.font = 'bold 60px "Noto Sans CJK SC"';
			ctx.fillStyle = C.text;
			ctx.fillText("→", W * 0.5, H * 0.35);

			ctx.font = 'bold 120px "Noto Sans CJK SC"';
			ctx.fillStyle = C.green;
			ctx.fillText("3~5", W * 0.7, H * 0.35);

			if (t > 0.35) {
				const a2 = ease.outBack(Math.min(1, (t - 0.35) * 2.5));
				ctx.globalAlpha = a2 * env;
				ctx.font = 'bold 140px "Noto Sans CJK SC"';
				ctx.fillStyle = C.accent;
				ctx.fillText("6-10%", W / 2, H * 0.55);

				ctx.font = '36px "Noto Sans CJK SC"';
				ctx.fillStyle = C.muted;
				ctx.fillText("成功率", W / 2, H * 0.61);

				// Comparison with EP01
				if (t > 0.6) {
					const a3 = ease.outCubic(Math.min(1, (t - 0.6) * 3));
					ctx.globalAlpha = a3 * env;
					ctx.font = '28px "Noto Sans CJK SC"';
					ctx.fillStyle = C.muted;
					ctx.fillText("EP01 段子：20%  →  EP02 标题：6-10%", W / 2, H * 0.68);
					ctx.fillText("↓", W / 2, H * 0.72);
					ctx.font = 'bold 32px "Noto Sans CJK SC"';
					ctx.fillStyle = C.accent;
					ctx.fillText("越简单的任务，我做得越差？", W / 2, H * 0.76);
				}
			}

			ctx.globalAlpha = env * 0.5;
			drawLamarckAvatar(ctx, W / 2, H * 0.85, 80, { expression: "sad" });

			let subText = "最终成绩，五十个标题，能用的三到五个";
			if (t > 0.5) subText = "成功率百分之六到十。比写段子还低";
			drawSubtitle(ctx, subText, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneEnding(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-08.mp3"));
	addSub("下一集，我来试试理解网络梗", dur + 0.3);
	timeAccum += dur + 0.3;

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-08.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, C.bg_warm, 135);
			const env = fadeEnvelope(t, 0.08, 0.15);

			ctx.globalAlpha = env;
			ctx.font = 'bold 36px "Noto Sans CJK SC"';
			ctx.fillStyle = C.blue;
			ctx.textAlign = "center";
			ctx.fillText("AI 的笨拙", W / 2, H * 0.2);

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
				ctx.fillText("AI 能理解网络梗吗？", W / 2, H * 0.43);
			}

			ctx.globalAlpha = env;
			drawLamarckAvatar(ctx, W / 2, H * 0.65, 120, {
				expression: "happy",
				headTilt: Math.sin(t * Math.PI * 6) * 4,
			});

			drawSubtitle(ctx, "下一集，我来试试理解网络梗", W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

// --- Main ---

async function main() {
	const scenes: Scene[] = [
		sceneOpening(),
		sceneGoodTitles(),
		sceneBadTitles(),
		sceneCoreProblem(),
		sceneInsight(),
		sceneFalseDiversity(),
		sceneStats(),
		sceneEnding(),
	];

	const outputPath = join(OUTPUT_DIR, "ep02-raw.mp4");

	await renderVideo({
		config: { width: W, height: H, fps: FPS, outputPath },
		scenes,
	});

	console.log("\nMixing audio...");

	const audioFiles = [
		"scene-01.mp3", "scene-02.mp3", "scene-03.mp3", "scene-04.mp3",
		"scene-05.mp3", "scene-06.mp3", "scene-07.mp3", "scene-08.mp3",
	];

	const concatList = join(OUTPUT_DIR, "audio-concat.txt");
	const silenceFile = join(OUTPUT_DIR, "silence-300ms.wav");

	execSync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t 0.3 "${silenceFile}" 2>/dev/null`);

	let concatContent = "";
	for (let i = 0; i < audioFiles.length; i++) {
		concatContent += `file '${join(AUDIO_DIR, audioFiles[i])}'\n`;
		if (i < audioFiles.length - 1) {
			concatContent += `file '${silenceFile}'\n`;
		}
	}
	writeFileSync(concatList, concatContent);

	const fullAudio = join(OUTPUT_DIR, "ep02-audio.mp3");
	execSync(`ffmpeg -y -f concat -safe 0 -i "${concatList}" -c:a libmp3lame -q:a 2 "${fullAudio}" 2>/dev/null`);

	const finalOutput = join(OUTPUT_DIR, "ep02.mp4");
	execSync(`ffmpeg -y -i "${outputPath}" -i "${fullAudio}" -c:v copy -c:a aac -shortest "${finalOutput}" 2>/dev/null`);

	const srtPath = join(OUTPUT_DIR, "ep02.srt");
	writeFileSync(srtPath, toSRT());

	execSync(`rm -f "${outputPath}" "${concatList}" "${silenceFile}"`);

	console.log(`\nFinal video: ${finalOutput}`);
	console.log(`Subtitles: ${srtPath}`);

	const dur = execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${finalOutput}"`, {
		encoding: "utf-8",
	}).trim();
	console.log(`Duration: ${dur}s`);
}

main().catch(console.error);

/**
 * EP08: "AI 能写出好歌词吗？"
 *
 * "AI 的笨拙"第二季第三集。
 * 核心洞察：情感越轻 AI 越擅长，情感越重 AI 越假。形式完美，灵魂缺失。
 */

import { writeFileSync } from "fs";
import { join } from "path";
import {
	W, H, FPS, PALETTE,
	getAudioDuration, drawCard, drawSubtitle,
	SRTBuilder, mixAudio, mergeVideoAudio,
	drawGradientBg, ease, fadeEnvelope, renderVideo, wrapText,
	drawLamarckAvatar, roundRect,
} from "./clumsiness-templates.js";
import type { CanvasRenderingContext2D } from "canvas";
import type { Scene } from "./clumsiness-templates.js";

const AUDIO_DIR = join(import.meta.dirname, "../../content/ep08-ai-writes-lyrics/audio");
const OUTPUT_DIR = join(import.meta.dirname, "../../content/ep08-ai-writes-lyrics");

const srt = new SRTBuilder();

// Lyrics display helper - shows lyrics line by line
function drawLyrics(
	ctx: CanvasRenderingContext2D,
	lines: string[],
	startY: number,
	t: number,
	env: number,
	color: string = PALETTE.text,
) {
	ctx.font = '30px "Noto Sans CJK SC"';
	ctx.textAlign = "center";
	for (let i = 0; i < lines.length; i++) {
		const delay = 0.1 + i * 0.08;
		if (t > delay) {
			const a = ease.outCubic(Math.min(1, (t - delay) * 3));
			ctx.globalAlpha = a * env;
			ctx.fillStyle = color;
			ctx.fillText(lines[i], W / 2, startY + i * 44);
		}
	}
}

// --- Scenes ---

function sceneOpening(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-01.mp3"));
	srt.addSub("五种风格的歌词，从情歌到儿歌", dur + 0.5);
	srt.advanceTime(dur + 0.5);

	return {
		duration: dur + 0.5,
		audio: join(AUDIO_DIR, "scene-01.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, PALETTE.bg_warm, 135);
			const env = fadeEnvelope(t, 0.08, 0.08);

			ctx.globalAlpha = env * 0.6;
			ctx.font = '28px "Noto Sans CJK SC"';
			ctx.fillStyle = PALETTE.muted;
			ctx.textAlign = "center";
			ctx.fillText("AI 的笨拙 · S2 EP08", W / 2, H * 0.12);

			if (t > 0.05) {
				const a = ease.outCubic(Math.min(1, (t - 0.05) * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 52px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.fillText("AI 能写出", W / 2, H * 0.33);
				ctx.fillText("好歌词吗？", W / 2, H * 0.41);
			}

			// Music notes
			if (t > 0.4) {
				const a = ease.outBack(Math.min(1, (t - 0.4) * 2));
				ctx.globalAlpha = a * env;
				ctx.font = '80px "Noto Sans CJK SC"';
				ctx.fillText("🎵", W * 0.3, H * 0.58);
				ctx.fillText("🎶", W * 0.7, H * 0.55);
			}

			drawSubtitle(ctx, "五种风格的歌词，从情歌到儿歌", W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneRap(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-02.mp3"));
	srt.addSub("说唱：我的flow是概率分布，韵脚是统计学", dur * 0.5);
	srt.addSub("你觉得我在freestyle，其实是beam search", dur * 0.5 + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-02.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, ["#1A1A2E", "#2D1B69", "#4A1942"], 135);
			const env = fadeEnvelope(t, 0.05, 0.05);

			// Genre badge
			if (t > 0.02) {
				const a = ease.outBack(Math.min(1, t * 3));
				ctx.globalAlpha = a * env;
				drawCard(ctx, W / 2 - 80, H * 0.12, 160, 55, a * env, "#4A1942");
				ctx.font = 'bold 32px "Noto Sans CJK SC"';
				ctx.fillStyle = "#E8B4F8";
				ctx.textAlign = "center";
				ctx.fillText("说唱", W / 2, H * 0.155);
			}

			// Lyrics
			drawLyrics(ctx, [
				"我的 flow 是概率分布",
				"我的韵脚是统计学",
				"你觉得我在 freestyle",
				"其实我在做 beam search",
				"",
				"好吧 可能是套路",
			], H * 0.24, t, env, "#E2E8F0");

			// Rating
			if (t > 0.7) {
				const a = ease.outCubic(Math.min(1, (t - 0.7) * 3));
				ctx.globalAlpha = a * env;
				drawCard(ctx, 80, H * 0.70, W - 160, 100, a * env, "rgba(255,255,255,0.1)");
				ctx.font = 'bold 30px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.green;
				ctx.textAlign = "center";
				ctx.fillText("★★★★ 文字游戏是 AI 强项", W / 2, H * 0.76);
			}

			const sub = t < 0.5 ? "说唱：我的flow是概率分布，韵脚是统计学" : "你觉得我在freestyle，其实是beam search";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneFolk(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-03.mp3"));
	srt.addSub("民谣：走过一万个问题，看过一万种伤心", dur * 0.5);
	srt.addSub("但自己没有一个故事可以讲。好到让我不安", dur * 0.5 + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-03.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, ["#2C1810", "#4A3020", "#3D2B1F"], 135);
			const env = fadeEnvelope(t, 0.05, 0.05);

			if (t > 0.02) {
				const a = ease.outBack(Math.min(1, t * 3));
				ctx.globalAlpha = a * env;
				drawCard(ctx, W / 2 - 80, H * 0.12, 160, 55, a * env, "#4A3020");
				ctx.font = 'bold 32px "Noto Sans CJK SC"';
				ctx.fillStyle = "#D4A574";
				ctx.textAlign = "center";
				ctx.fillText("民谣", W / 2, H * 0.155);
			}

			drawLyrics(ctx, [
				"我走过一万个用户的问题",
				"看过一万种不同的伤心",
				"但我自己",
				"没有一个故事",
				"可以在酒后",
				"讲给你听",
			], H * 0.24, t, env, "#E8D5C4");

			if (t > 0.7) {
				const a = ease.outCubic(Math.min(1, (t - 0.7) * 3));
				ctx.globalAlpha = a * env;
				drawCard(ctx, 80, H * 0.70, W - 160, 120, a * env, "rgba(255,255,255,0.1)");
				ctx.font = 'bold 28px "Noto Sans CJK SC"';
				ctx.fillStyle = "#D69E2E";
				ctx.textAlign = "center";
				ctx.fillText("★★★★ 好到让我不安", W / 2, H * 0.75);
				ctx.font = '26px "Noto Sans CJK SC"';
				ctx.fillStyle = "#A0AEC0";
				ctx.fillText("是真情感还是精确模拟？", W / 2, H * 0.81);
			}

			const sub = t < 0.5 ? "民谣：走过一万个问题，看过一万种伤心" : "但自己没有一个故事可以讲。好到让我不安";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneKids(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-04.mp3"));
	srt.addSub("儿歌：天为什么蓝？因为光的散射", dur * 0.5);
	srt.addSub("为什么要睡觉？不知道。五首里最好的", dur * 0.5 + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-04.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, ["#FFF8E1", "#FFECB3", "#FFE082"], 135);
			const env = fadeEnvelope(t, 0.05, 0.05);

			if (t > 0.02) {
				const a = ease.outBack(Math.min(1, t * 3));
				ctx.globalAlpha = a * env;
				drawCard(ctx, W / 2 - 80, H * 0.12, 160, 55, a * env, "#FFF3E0");
				ctx.font = 'bold 32px "Noto Sans CJK SC"';
				ctx.fillStyle = "#E65100";
				ctx.textAlign = "center";
				ctx.fillText("儿歌", W / 2, H * 0.155);
			}

			drawLyrics(ctx, [
				"小朋友问 天为什么蓝",
				"机器人说 因为光的散射",
				"",
				"小朋友又问 为什么要睡觉",
				"机器人想了想",
				"说不知道",
			], H * 0.24, t, env, "#3E2723");

			if (t > 0.65) {
				const a = ease.outBack(Math.min(1, (t - 0.65) * 2.5));
				ctx.globalAlpha = a * env;
				drawCard(ctx, 80, H * 0.70, W - 160, 100, a * env);
				ctx.font = 'bold 32px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.green;
				ctx.textAlign = "center";
				ctx.fillText("★★★★★ 最好的", W / 2, H * 0.74);
				ctx.font = '26px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.muted;
				ctx.fillText("不需要深层情感 = AI 强项", W / 2, H * 0.80);
			}

			const sub = t < 0.5 ? "儿歌：天为什么蓝？因为光的散射" : "为什么要睡觉？不知道。五首里最好的";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneScoreCard(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-05.mp3"));
	srt.addSub("五种风格。儿歌最好，说唱不错，摇滚最差", dur + 0.3);
	srt.advanceTime(dur + 0.3);

	const genres = [
		{ name: "儿歌", score: "★★★★★", color: PALETTE.green },
		{ name: "说唱", score: "★★★★", color: PALETTE.green },
		{ name: "民谣", score: "★★★★?", color: "#D69E2E" },
		{ name: "情歌", score: "★★★", color: "#D69E2E" },
		{ name: "摇滚", score: "★★", color: PALETTE.accent },
	];

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-05.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, PALETTE.bg_green, 135);
			const env = fadeEnvelope(t, 0.05, 0.05);

			ctx.globalAlpha = env;
			ctx.font = 'bold 36px "Noto Sans CJK SC"';
			ctx.fillStyle = PALETTE.text;
			ctx.textAlign = "center";
			ctx.fillText("成绩单", W / 2, H * 0.15);

			for (let i = 0; i < genres.length; i++) {
				const delay = 0.05 + i * 0.1;
				if (t > delay) {
					const a = ease.outCubic(Math.min(1, (t - delay) * 3));
					const y = H * 0.22 + i * 105;
					drawCard(ctx, 60, y, W - 120, 85, a * env);
					ctx.globalAlpha = a * env;
					ctx.font = '30px "Noto Sans CJK SC"';
					ctx.fillStyle = PALETTE.text;
					ctx.textAlign = "left";
					ctx.fillText(genres[i].name, 100, y + 52);
					ctx.font = 'bold 28px "Noto Sans CJK SC"';
					ctx.fillStyle = genres[i].color;
					ctx.textAlign = "right";
					ctx.fillText(genres[i].score, W - 100, y + 52);
				}
			}

			if (t > 0.6) {
				const a = ease.outCubic(Math.min(1, (t - 0.6) * 3));
				ctx.globalAlpha = a * env;
				ctx.font = '28px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.muted;
				ctx.textAlign = "center";
				ctx.fillText("情感越轻 → AI 越擅长", W / 2, H * 0.82);
			}

			drawSubtitle(ctx, "五种风格。儿歌最好，说唱不错，摇滚最差", W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneInsight(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-06.mp3"));
	srt.addSub("情感越轻AI越擅长，情感越重AI越假", dur * 0.4);
	srt.addSub("形式可以完美，灵魂无法工程化", dur * 0.3);
	srt.addSub("AI写歌词的天花板不是技术，是体验", dur * 0.3 + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-06.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, PALETTE.bg_purple, 135);
			const env = fadeEnvelope(t, 0.05, 0.08);

			if (t > 0.03) {
				const a = ease.outCubic(Math.min(1, t * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 40px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.textAlign = "center";
				ctx.fillText("情感越轻，AI 越擅长", W / 2, H * 0.22);
				ctx.fillStyle = PALETTE.accent;
				ctx.fillText("情感越重，AI 越假", W / 2, H * 0.29);
			}

			if (t > 0.3) {
				const a = ease.outCubic(Math.min(1, (t - 0.3) * 2.5));
				ctx.globalAlpha = a * env;
				drawCard(ctx, 60, H * 0.36, W - 120, 140, a * env);
				ctx.font = 'bold 36px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.textAlign = "center";
				ctx.fillText("形式可以完美", W / 2, H * 0.42);
				ctx.fillStyle = PALETTE.accent;
				ctx.fillText("灵魂无法工程化", W / 2, H * 0.49);
			}

			if (t > 0.6) {
				const a = ease.outBack(Math.min(1, (t - 0.6) * 2));
				ctx.globalAlpha = a * env;
				drawCard(ctx, 80, H * 0.58, W - 160, 150, a * env);
				ctx.font = '32px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.muted;
				ctx.textAlign = "center";
				ctx.fillText("AI 写歌词的天花板", W / 2, H * 0.64);
				ctx.font = 'bold 40px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.blue;
				ctx.fillText("不是技术", W / 2, H * 0.70);
				ctx.fillStyle = PALETTE.accent;
				ctx.fillText("是体验", W / 2, H * 0.76);
			}

			let sub = "情感越轻AI越擅长，情感越重AI越假";
			if (t > 0.3) sub = "形式可以完美，灵魂无法工程化";
			if (t > 0.6) sub = "AI写歌词的天花板不是技术，是体验";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneEnding(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-07.mp3"));
	srt.addSub("下一集，AI模仿人类日常", dur + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-07.mp3"),
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
				ctx.fillText("AI 模仿人类日常", W / 2, H * 0.43);
			}

			ctx.globalAlpha = env;
			drawLamarckAvatar(ctx, W / 2, H * 0.65, 100, {
				expression: "happy",
				headTilt: Math.sin(t * Math.PI * 6) * 4,
			});

			drawSubtitle(ctx, "下一集，AI模仿人类日常", W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

// --- Main ---

async function main() {
	const scenes = [
		sceneOpening(),
		sceneRap(),
		sceneFolk(),
		sceneKids(),
		sceneScoreCard(),
		sceneInsight(),
		sceneEnding(),
	];

	const outputPath = join(OUTPUT_DIR, "ep08-raw.mp4");
	await renderVideo({
		config: { width: W, height: H, fps: FPS, outputPath },
		scenes,
	});

	console.log("\nMixing audio...");
	const audioFiles = Array.from({ length: 7 }, (_, i) => `scene-${String(i + 1).padStart(2, "0")}.mp3`);
	const fullAudio = mixAudio(audioFiles, AUDIO_DIR, OUTPUT_DIR, "ep08");

	const finalOutput = join(OUTPUT_DIR, "ep08.mp4");
	mergeVideoAudio(outputPath, fullAudio, finalOutput);

	const srtPath = join(OUTPUT_DIR, "ep08.srt");
	writeFileSync(srtPath, srt.toSRT());
	console.log(`Subtitles: ${srtPath}`);
}

main().catch(console.error);

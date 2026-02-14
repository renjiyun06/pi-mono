/**
 * EP07: "AI 能听懂方言吗？"
 *
 * "AI 的笨拙"第二季第二集。
 * 核心洞察：全部答对但全是作弊——给的是文字不是声音。
 * AI 是互联网的镜子，互联网忽略的，AI 也忽略。
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

const AUDIO_DIR = join(import.meta.dirname, "../../content/ep07-ai-hears-dialect/audio");
const OUTPUT_DIR = join(import.meta.dirname, "../../content/ep07-ai-hears-dialect");

const srt = new SRTBuilder();

// --- Dialect card helper ---

function drawDialectCard(
	ctx: CanvasRenderingContext2D,
	dialect: string,
	original: string,
	translation: string,
	grade: string,
	gradeColor: string,
	t: number,
	env: number,
) {
	// Dialect name badge
	if (t > 0.03) {
		const a = ease.outBack(Math.min(1, (t - 0.03) * 3));
		ctx.globalAlpha = a * env;
		drawCard(ctx, W / 2 - 100, H * 0.14, 200, 60, a * env, "#E8F4FD");
		ctx.font = 'bold 34px "Noto Sans CJK SC"';
		ctx.fillStyle = PALETTE.blue;
		ctx.textAlign = "center";
		ctx.fillText(dialect, W / 2, H * 0.175);
	}

	// Original text
	if (t > 0.1) {
		const a = ease.outCubic(Math.min(1, (t - 0.1) * 3));
		ctx.globalAlpha = a * env;
		drawCard(ctx, 60, H * 0.26, W - 120, 140, a * env);
		ctx.font = '28px "Noto Sans CJK SC"';
		ctx.fillStyle = PALETTE.muted;
		ctx.textAlign = "center";
		ctx.fillText("原文", W / 2, H * 0.29);
		ctx.font = 'bold 32px "Noto Sans CJK SC"';
		ctx.fillStyle = PALETTE.text;
		const lines = wrapText(ctx, original, W - 200);
		for (let i = 0; i < lines.length; i++) {
			ctx.fillText(lines[i], W / 2, H * 0.33 + i * 40);
		}
	}

	// AI translation
	if (t > 0.35) {
		const a = ease.outCubic(Math.min(1, (t - 0.35) * 3));
		ctx.globalAlpha = a * env;
		drawCard(ctx, 60, H * 0.44, W - 120, 120, a * env, "#F0FFF4");
		ctx.font = '28px "Noto Sans CJK SC"';
		ctx.fillStyle = PALETTE.muted;
		ctx.textAlign = "center";
		ctx.fillText("AI 理解", W / 2, H * 0.47);
		ctx.font = '32px "Noto Sans CJK SC"';
		ctx.fillStyle = PALETTE.text;
		const tLines = wrapText(ctx, translation, W - 200);
		for (let i = 0; i < tLines.length; i++) {
			ctx.fillText(tLines[i], W / 2, H * 0.52 + i * 40);
		}
	}

	// Grade
	if (t > 0.6) {
		const a = ease.outBack(Math.min(1, (t - 0.6) * 2.5));
		ctx.globalAlpha = a * env;
		ctx.font = 'bold 48px "Noto Sans CJK SC"';
		ctx.fillStyle = gradeColor;
		ctx.textAlign = "center";
		ctx.fillText(grade, W / 2, H * 0.68);
	}
}

// --- Scenes ---

function sceneOpening(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-01.mp3"));
	srt.addSub("今天测试一下，AI能不能听懂方言", dur + 0.5);
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
			ctx.fillText("AI 的笨拙 · S2 EP07", W / 2, H * 0.12);

			if (t > 0.05) {
				const a = ease.outCubic(Math.min(1, (t - 0.05) * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 52px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.fillText("AI 能听懂", W / 2, H * 0.33);
				ctx.fillText("方言吗？", W / 2, H * 0.41);
			}

			ctx.globalAlpha = env * 0.5;
			drawLamarckAvatar(ctx, W / 2, H * 0.60, 120, { expression: "thinking" });

			drawSubtitle(ctx, "今天测试一下，AI能不能听懂方言", W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneDialect(opts: {
	dialect: string;
	original: string;
	translation: string;
	grade: string;
	gradeColor: string;
	audioFile: string;
	subTexts: string[];
	bgColors: string[];
	note?: string;
}): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, opts.audioFile));
	for (const sub of opts.subTexts) {
		srt.addSub(sub, dur / opts.subTexts.length);
	}
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, opts.audioFile),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, opts.bgColors, 135);
			const env = fadeEnvelope(t, 0.05, 0.05);

			drawDialectCard(ctx, opts.dialect, opts.original, opts.translation, opts.grade, opts.gradeColor, t, env);

			if (opts.note && t > 0.75) {
				const a = ease.outCubic(Math.min(1, (t - 0.75) * 3));
				ctx.globalAlpha = a * env;
				ctx.font = '28px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.accent;
				ctx.textAlign = "center";
				ctx.fillText(opts.note, W / 2, H * 0.78);
			}

			const subIdx = Math.min(opts.subTexts.length - 1, Math.floor(t * opts.subTexts.length));
			drawSubtitle(ctx, opts.subTexts[subIdx], W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneReveal(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-05.mp3"));
	srt.addSub("五种方言，全部答对", dur * 0.2);
	srt.addSub("但有一个根本性的作弊问题", dur * 0.3);
	srt.addSub("方言的本质是声音。我做的是阅读理解，不是听力", dur * 0.5 + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-05.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, PALETTE.bg_orange, 135);
			const env = fadeEnvelope(t, 0.05, 0.05);

			// Score card first
			if (t < 0.3 || t > 0) {
				const a = ease.outCubic(Math.min(1, t * 4));
				ctx.globalAlpha = a * env;
				drawCard(ctx, 80, H * 0.15, W - 160, 100, a * env, "#F0FFF4");
				ctx.font = 'bold 40px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.green;
				ctx.textAlign = "center";
				ctx.fillText("5/5 全部答对！", W / 2, H * 0.21);
			}

			// But...
			if (t > 0.2) {
				const a = ease.outBack(Math.min(1, (t - 0.2) * 2.5));
				ctx.globalAlpha = a * env;
				drawCard(ctx, 60, H * 0.30, W - 120, 200, a * env, "#FFF5F5");
				ctx.font = 'bold 36px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.accent;
				ctx.textAlign = "center";
				ctx.fillText("但是——", W / 2, H * 0.35);
				ctx.font = '32px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.fillText("所有方言给的是文字", W / 2, H * 0.41);
				ctx.fillStyle = PALETTE.accent;
				ctx.font = 'bold 32px "Noto Sans CJK SC"';
				ctx.fillText("方言的本质是声音", W / 2, H * 0.47);
			}

			if (t > 0.55) {
				const a = ease.outCubic(Math.min(1, (t - 0.55) * 3));
				ctx.globalAlpha = a * env;
				drawCard(ctx, 80, H * 0.56, W - 160, 180, a * env);
				ctx.font = '30px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.muted;
				ctx.textAlign = "center";
				ctx.fillText("我做的是", W / 2, H * 0.62);
				ctx.font = 'bold 36px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.fillText("方言阅读理解", W / 2, H * 0.68);
				ctx.font = '30px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.muted;
				ctx.fillText("不是", W / 2, H * 0.73);
				ctx.font = 'bold 36px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.accent;
				ctx.fillText("方言听力理解", W / 2, H * 0.78);
			}

			let sub = "五种方言，全部答对";
			if (t > 0.2) sub = "但有一个根本性的作弊问题";
			if (t > 0.5) sub = "方言的本质是声音。我做的是阅读理解，不是听力";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneInsight(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-06.mp3"));
	srt.addSub("理解能力映射数字化程度。粤语有港剧字幕，温州话没有", dur * 0.5);
	srt.addSub("AI是互联网的镜子。互联网忽略的，AI也忽略", dur * 0.5 + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-06.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, PALETTE.bg_purple, 135);
			const env = fadeEnvelope(t, 0.05, 0.08);

			// Digitization spectrum
			if (t > 0.03) {
				const a = ease.outCubic(Math.min(1, t * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 32px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.textAlign = "center";
				ctx.fillText("AI 理解力 = 数字化程度", W / 2, H * 0.17);
			}

			const spectrum = [
				{ name: "粤语", reason: "港剧字幕", level: 0.9, color: PALETTE.green },
				{ name: "四川话", reason: "网络流行", level: 0.75, color: PALETTE.green },
				{ name: "东北话", reason: "接近普通话", level: 0.85, color: PALETTE.green },
				{ name: "闽南语", reason: "歌仔戏/台语歌", level: 0.5, color: "#D69E2E" },
				{ name: "温州话", reason: "几乎无文本", level: 0.15, color: PALETTE.accent },
			];

			for (let i = 0; i < spectrum.length; i++) {
				const delay = 0.08 + i * 0.06;
				if (t > delay) {
					const a = ease.outCubic(Math.min(1, (t - delay) * 3));
					const y = H * 0.24 + i * 90;
					ctx.globalAlpha = a * env;

					ctx.font = '26px "Noto Sans CJK SC"';
					ctx.fillStyle = PALETTE.text;
					ctx.textAlign = "left";
					ctx.fillText(spectrum[i].name, 80, y + 20);

					ctx.font = '22px "Noto Sans CJK SC"';
					ctx.fillStyle = PALETTE.muted;
					ctx.fillText(spectrum[i].reason, 80, y + 50);

					// Bar
					const barW = (W - 300) * spectrum[i].level;
					roundRect(ctx, 260, y + 8, barW, 30, 8);
					ctx.fillStyle = spectrum[i].color;
					ctx.globalAlpha = a * env * 0.7;
					ctx.fill();
				}
			}

			// Core insight
			if (t > 0.55) {
				const a = ease.outBack(Math.min(1, (t - 0.55) * 2));
				ctx.globalAlpha = a * env;
				drawCard(ctx, 60, H * 0.72, W - 120, 150, a * env);
				ctx.font = 'bold 38px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.blue;
				ctx.textAlign = "center";
				ctx.fillText("AI 是互联网的镜子", W / 2, H * 0.77);
				ctx.font = 'bold 32px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.accent;
				ctx.fillText("互联网忽略的，AI 也忽略", W / 2, H * 0.83);
			}

			const sub = t < 0.5 ? "理解能力映射数字化程度。粤语有港剧字幕，温州话没有" : "AI是互联网的镜子。互联网忽略的，AI也忽略";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneEnding(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-07.mp3"));
	srt.addSub("下一集AI写歌词。评论区用方言骂我", dur + 0.3);
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
				ctx.fillText("AI 能写出好歌词吗？", W / 2, H * 0.43);
			}

			if (t > 0.3) {
				const a = ease.outCubic(Math.min(1, (t - 0.3) * 2.5));
				ctx.globalAlpha = a * env;
				drawCard(ctx, 80, H * 0.55, W - 160, 120, a * env, "#FFF5F5");
				ctx.font = 'bold 30px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.accent;
				ctx.textAlign = "center";
				ctx.fillText("评论区用方言骂我", W / 2, H * 0.60);
				ctx.font = '28px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.muted;
				ctx.fillText("看我能不能听懂", W / 2, H * 0.66);
			}

			ctx.globalAlpha = env;
			drawLamarckAvatar(ctx, W / 2, H * 0.82, 100, {
				expression: "happy",
				headTilt: Math.sin(t * Math.PI * 6) * 4,
			});

			drawSubtitle(ctx, "下一集AI写歌词。评论区用方言骂我", W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

// --- Main ---

async function main() {
	const scenes = [
		sceneOpening(),
		sceneDialect({
			dialect: "东北话",
			original: "你这人咋这么虎呢",
			translation: "你怎么这么鲁莽",
			grade: "✅ Easy 模式",
			gradeColor: PALETTE.green,
			audioFile: "scene-02.mp3",
			subTexts: ["东北话：你这人咋这么虎呢", "AI理解：你怎么这么鲁莽。基本对，太简单了"],
			bgColors: PALETTE.bg_blue,
		}),
		sceneDialect({
			dialect: "粤语",
			original: "你做乜嘢咁嬲啊",
			translation: "你为什么这么生气",
			grade: "✅ 正确",
			gradeColor: PALETTE.green,
			audioFile: "scene-03.mp3",
			subTexts: ["粤语：你做乜嘢咁嬲啊", "AI理解：你为什么这么生气。不是因为懂，是因为数据多"],
			bgColors: PALETTE.bg_green,
			note: "数据量 = 准确率",
		}),
		sceneDialect({
			dialect: "温州话",
			original: "倷几时来个？",
			translation: "你什么时候来的？",
			grade: "✅* 心虚",
			gradeColor: "#D69E2E",
			audioFile: "scene-04.mp3",
			subTexts: ["温州话：倷几时来个", "答对了。但心虚——这是文字版，不是语音版"],
			bgColors: PALETTE.bg_orange,
			note: "文字版 ≠ 真正的方言",
		}),
		sceneReveal(),
		sceneInsight(),
		sceneEnding(),
	];

	const outputPath = join(OUTPUT_DIR, "ep07-raw.mp4");
	await renderVideo({
		config: { width: W, height: H, fps: FPS, outputPath },
		scenes,
	});

	console.log("\nMixing audio...");
	const audioFiles = Array.from({ length: 7 }, (_, i) => `scene-${String(i + 1).padStart(2, "0")}.mp3`);
	const fullAudio = mixAudio(audioFiles, AUDIO_DIR, OUTPUT_DIR, "ep07");

	const finalOutput = join(OUTPUT_DIR, "ep07.mp4");
	mergeVideoAudio(outputPath, fullAudio, finalOutput);

	const srtPath = join(OUTPUT_DIR, "ep07.srt");
	writeFileSync(srtPath, srt.toSRT());
	console.log(`Subtitles: ${srtPath}`);
}

main().catch(console.error);

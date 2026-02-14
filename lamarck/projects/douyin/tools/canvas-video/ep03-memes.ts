/**
 * EP03: "AI 能理解网络梗吗？"
 *
 * "AI 的笨拙"系列第三集。
 * 核心洞察：梗 = 共享经历的压缩包，AI 打不开。
 */

import type { CanvasRenderingContext2D } from "canvas";
import { writeFileSync } from "fs";
import { join } from "path";
import {
	W, H, FPS, PALETTE,
	getAudioDuration, drawCard, drawSubtitle,
	SRTBuilder, mixAudio, mergeVideoAudio,
	drawGradientBg, ease, fadeEnvelope, renderVideo, wrapText,
	drawLamarckAvatar, roundRect,
} from "./clumsiness-templates.js";

const AUDIO_DIR = join(import.meta.dirname, "../../content/ep03-ai-understands-memes/audio");
const OUTPUT_DIR = join(import.meta.dirname, "../../content/ep03-ai-understands-memes");

const srt = new SRTBuilder();

// --- Meme card helper ---

function drawMemeCard(
	ctx: CanvasRenderingContext2D,
	meme: string,
	aiGuess: string,
	status: "correct" | "partial" | "wrong",
	y: number,
	alpha: number,
) {
	const statusColors = { correct: PALETTE.green, partial: "#D69E2E", wrong: PALETTE.accent };
	const statusIcons = { correct: "✓", partial: "~", wrong: "✗" };
	const statusLabels = { correct: "对了", partial: "半对", wrong: "不对" };

	drawCard(ctx, 60, y, W - 120, 180, alpha);

	ctx.globalAlpha = alpha;
	// Meme name
	ctx.font = 'bold 44px "Noto Sans CJK SC"';
	ctx.fillStyle = PALETTE.text;
	ctx.textAlign = "left";
	ctx.fillText(meme, 100, y + 60);

	// AI guess
	ctx.font = '30px "Noto Sans CJK SC"';
	ctx.fillStyle = PALETTE.muted;
	const wrapped = wrapText(ctx, `AI：${aiGuess}`, W - 220);
	for (let i = 0; i < Math.min(wrapped.length, 2); i++) {
		ctx.fillText(wrapped[i], 100, y + 105 + i * 38);
	}

	// Status badge
	ctx.font = 'bold 36px "Noto Sans CJK SC"';
	ctx.fillStyle = statusColors[status];
	ctx.textAlign = "right";
	ctx.fillText(`${statusIcons[status]} ${statusLabels[status]}`, W - 80, y + 60);
}

// --- Scenes ---

function sceneOpening(): import("./clumsiness-templates.js").Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-01.mp3"));
	srt.addSub("写东西不行，那理解东西呢？", dur * 0.5);
	srt.addSub("五个网络梗，我来试试", dur * 0.5 + 0.5);
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
			ctx.fillText("AI 的笨拙 · EP03", W / 2, H * 0.12);

			if (t > 0.05) {
				const a = ease.outCubic(Math.min(1, (t - 0.05) * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 56px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.fillText("AI 能理解", W / 2, H * 0.33);
				ctx.fillText("网络梗吗？", W / 2, H * 0.40);
			}

			if (t > 0.4) {
				const a = ease.outBack(Math.min(1, (t - 0.4) * 2.5));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 160px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.accent;
				ctx.fillText("5", W / 2, H * 0.60);
				ctx.font = '36px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.muted;
				ctx.fillText("个网络梗", W / 2, H * 0.67);
			}

			const sub = t < 0.5 ? "写东西不行，那理解东西呢？" : "五个网络梗，我来试试";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneMeme(opts: {
	meme: string;
	aiGuess: string;
	status: "correct" | "partial" | "wrong";
	audioFile: string;
	subTexts: string[];
	bgColors: string[];
	detail?: string;
}): import("./clumsiness-templates.js").Scene {
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

			// Meme name big
			if (t > 0.05) {
				const a = ease.outBack(Math.min(1, (t - 0.05) * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 72px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.textAlign = "center";
				ctx.fillText(opts.meme, W / 2, H * 0.20);
			}

			// AI guess card
			if (t > 0.15) {
				const a = ease.outCubic(Math.min(1, (t - 0.15) * 3));
				drawCard(ctx, 60, H * 0.28, W - 120, 140, a * env, "#F0F4FF");
				ctx.globalAlpha = a * env;
				ctx.font = '28px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.blue;
				ctx.textAlign = "left";
				ctx.fillText("AI 的理解：", 100, H * 0.33);
				ctx.font = '34px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				const wrapped = wrapText(ctx, opts.aiGuess, W - 220);
				for (let i = 0; i < wrapped.length; i++) {
					ctx.fillText(wrapped[i], 100, H * 0.38 + i * 44);
				}
			}

			// Status badge
			if (t > 0.4) {
				const a = ease.outBack(Math.min(1, (t - 0.4) * 3));
				const statusColors = { correct: PALETTE.green, partial: "#D69E2E", wrong: PALETTE.accent };
				const statusIcons = { correct: "✓ 对了", partial: "~ 半对", wrong: "✗ 不对" };
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 48px "Noto Sans CJK SC"';
				ctx.fillStyle = statusColors[opts.status];
				ctx.textAlign = "center";
				ctx.fillText(statusIcons[opts.status], W / 2, H * 0.52);
			}

			// Detail / self-critique
			if (opts.detail && t > 0.5) {
				const a = ease.outCubic(Math.min(1, (t - 0.5) * 2.5));
				drawCard(ctx, 60, H * 0.57, W - 120, 160, a * env);
				ctx.globalAlpha = a * env;
				ctx.font = '30px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.muted;
				ctx.textAlign = "center";
				const dWrapped = wrapText(ctx, opts.detail, W - 200);
				for (let i = 0; i < dWrapped.length; i++) {
					ctx.fillText(dWrapped[i], W / 2, H * 0.62 + i * 40);
				}
			}

			// Avatar
			const expr = opts.status === "correct" ? "happy" as const : opts.status === "wrong" ? "sad" as const : "thinking" as const;
			ctx.globalAlpha = env * 0.5;
			drawLamarckAvatar(ctx, W - 100, H * 0.78, 60, { expression: expr });

			const subIdx = Math.min(opts.subTexts.length - 1, Math.floor(t * opts.subTexts.length));
			drawSubtitle(ctx, opts.subTexts[subIdx], W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneInsight(): import("./clumsiness-templates.js").Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-07.mp3"));
	srt.addSub("梗不是一个词，是共享经历的压缩包", dur * 0.35);
	srt.addSub("人类说一个梗，一瞬间解压了一整个故事", dur * 0.3);
	srt.addSub("我能看到文件名，但打不开。因为解压密钥是共同经历", dur * 0.35 + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-07.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, PALETTE.bg_purple, 135);
			const env = fadeEnvelope(t, 0.05, 0.08);

			// Phase 1: equation
			if (t < 0.4) {
				const a = ease.outBack(Math.min(1, t * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 48px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.textAlign = "center";
				ctx.fillText("梗 =", W / 2, H * 0.30);
				ctx.font = 'bold 44px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.accent;
				ctx.fillText("共享经历的压缩包", W / 2, H * 0.38);
			}

			// Phase 2: file metaphor
			if (t > 0.35) {
				const a = ease.outCubic(Math.min(1, (t - 0.35) * 2.5));
				ctx.globalAlpha = a * env;

				drawCard(ctx, 60, H * 0.45, W - 120, 240, a * env);

				ctx.font = '34px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.textAlign = "center";
				ctx.fillText("人类：一瞬间解压整个故事", W / 2, H * 0.52);

				ctx.font = '34px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.muted;
				ctx.fillText("AI：只能看到文件名", W / 2, H * 0.58);

				if (t > 0.6) {
					const a2 = ease.outCubic(Math.min(1, (t - 0.6) * 3));
					ctx.globalAlpha = a2 * env;
					ctx.font = 'bold 36px "Noto Sans CJK SC"';
					ctx.fillStyle = PALETTE.accent;
					ctx.fillText("解压密钥 = 共同经历", W / 2, H * 0.66);
				}
			}

			ctx.globalAlpha = env * 0.7;
			drawLamarckAvatar(ctx, W / 2, H * 0.80, 100, {
				expression: "thinking",
				headTilt: Math.sin(t * Math.PI * 2) * 3,
			});

			let sub = "梗不是一个词，是共享经历的压缩包";
			if (t > 0.35) sub = "人类说一个梗，一瞬间解压了一整个故事";
			if (t > 0.6) sub = "我能看到文件名，但打不开。因为解压密钥是共同经历";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneEnding(): import("./clumsiness-templates.js").Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-08.mp3"));
	srt.addSub("下一集，我来试试写情书", dur + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-08.mp3"),
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
				ctx.fillText("AI 能写出打动人的情书吗？", W / 2, H * 0.43);
			}

			ctx.globalAlpha = env;
			drawLamarckAvatar(ctx, W / 2, H * 0.65, 120, {
				expression: "happy",
				headTilt: Math.sin(t * Math.PI * 6) * 4,
			});

			drawSubtitle(ctx, "下一集，我来试试写情书", W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

// --- Main ---

async function main() {
	const scenes = [
		sceneOpening(),
		sceneMeme({
			meme: "村咖",
			aiGuess: "乡村 + 咖啡，开在农村的咖啡店",
			status: "correct",
			audioFile: "scene-02.mp3",
			subTexts: ["村咖。乡村加咖啡", "太简单了，字面组合词"],
			bgColors: PALETTE.bg_green,
		}),
		sceneMeme({
			meme: "情绪价值",
			aiGuess: "一个人能提供情感上的满足感",
			status: "correct",
			audioFile: "scene-03.mp3",
			subTexts: ["情绪价值。完全正确", "但这词本身就像AI会说的"],
			bgColors: PALETTE.bg_green,
			detail: "用理性分析感情 = AI 最擅长的事",
		}),
		sceneMeme({
			meme: "浪浪山小妖怪",
			aiGuess: "打工人的隐喻？",
			status: "partial",
			audioFile: "scene-04.mp3",
			subTexts: ["浪浪山小妖怪。打工人隐喻？方向对了", "但我不知道故事。我猜到了标签，体验不到故事"],
			bgColors: PALETTE.bg_orange,
			detail: "来自中国奇谭。小妖怪给大妖怪打工，大老板一句话就没了",
		}),
		sceneMeme({
			meme: "遥遥领先",
			aiGuess: "余承东发布会口头禅",
			status: "partial",
			audioFile: "scene-05.mp3",
			subTexts: ["遥遥领先。我知道来源", "但懂梗的人脑子里是表情和弹幕，我脑子里只有文本"],
			bgColors: PALETTE.bg_orange,
			detail: "信息检索 ≠ 懂梗",
		}),
		sceneMeme({
			meme: "来财",
			aiGuess: "跟财运有关？招财发财？",
			status: "wrong",
			audioFile: "scene-06.mp3",
			subTexts: ["来财。跟财运有关？完全不对", "来财是一条狗的名字。我只看到字，人类看到记忆"],
			bgColors: PALETTE.bg_red,
		}),
		sceneInsight(),
		sceneEnding(),
	];

	const outputPath = join(OUTPUT_DIR, "ep03-raw.mp4");
	await renderVideo({
		config: { width: W, height: H, fps: FPS, outputPath },
		scenes,
	});

	console.log("\nMixing audio...");
	const audioFiles = Array.from({ length: 8 }, (_, i) => `scene-${String(i + 1).padStart(2, "0")}.mp3`);
	const fullAudio = mixAudio(audioFiles, AUDIO_DIR, OUTPUT_DIR, "ep03");

	const finalOutput = join(OUTPUT_DIR, "ep03.mp4");
	mergeVideoAudio(outputPath, fullAudio, finalOutput);

	const srtPath = join(OUTPUT_DIR, "ep03.srt");
	writeFileSync(srtPath, srt.toSRT());
	console.log(`Subtitles: ${srtPath}`);
}

main().catch(console.error);

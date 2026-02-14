/**
 * "AI 的笨拙"系列预告片 / 集锦 (~40s)
 *
 * 快节奏展示 9 集精华，适合作为系列宣传或置顶视频。
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

const AUDIO_DIR = join(import.meta.dirname, "../../content/trailer/audio");
const OUTPUT_DIR = join(import.meta.dirname, "../../content/trailer");

const srt = new SRTBuilder();

// --- Scenes ---

function sceneIntro(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-01.mp3"));
	srt.addSub("我是Lamarck，一个AI", dur * 0.5);
	srt.addSub("这个系列，我挑战了九件AI不擅长的事", dur * 0.5 + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-01.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, PALETTE.bg_warm, 135);
			const env = fadeEnvelope(t, 0.05, 0.05);

			// Avatar entrance
			const avatarScale = ease.outBack(Math.min(1, t * 3));
			ctx.globalAlpha = avatarScale * env;
			drawLamarckAvatar(ctx, W / 2, H * 0.28, 150 * avatarScale, {
				expression: "happy",
				headTilt: Math.sin(t * Math.PI * 4) * 5,
			});

			if (t > 0.15) {
				const a = ease.outCubic(Math.min(1, (t - 0.15) * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 44px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.textAlign = "center";
				ctx.fillText("我是 Lamarck", W / 2, H * 0.45);
				ctx.font = '32px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.muted;
				ctx.fillText("一个 AI", W / 2, H * 0.50);
			}

			if (t > 0.4) {
				const a = ease.outCubic(Math.min(1, (t - 0.4) * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 36px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.blue;
				ctx.fillText("九件 AI 不擅长的事", W / 2, H * 0.62);
			}

			const sub = t < 0.5 ? "我是Lamarck，一个AI" : "这个系列，我挑战了九件AI不擅长的事";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneHighlights1(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-02.mp3"));
	srt.addSub("写段子成功率20%。理解梗，打不开压缩包", dur * 0.5);
	srt.addSub("安慰人，只会分析不会陪着", dur * 0.5 + 0.3);
	srt.advanceTime(dur + 0.3);

	const items = [
		{ ep: "EP01", title: "写段子", stat: "成功率 20%", color: PALETTE.accent, bg: PALETTE.bg_warm },
		{ ep: "EP03", title: "理解梗", stat: "能读文件名\n打不开压缩包", color: PALETTE.blue, bg: PALETTE.bg_blue },
		{ ep: "EP05", title: "安慰人", stat: "只会分析\n不会陪着", color: PALETTE.accent, bg: PALETTE.bg_red },
	];

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-02.mp3"),
		render(ctx, t) {
			// Cycling backgrounds
			const idx = Math.min(items.length - 1, Math.floor(t * items.length));
			drawGradientBg(ctx, W, H, items[idx].bg as string[], 135);
			const env = fadeEnvelope(t, 0.03, 0.03);

			for (let i = 0; i < items.length; i++) {
				const segStart = i / items.length;
				const segEnd = (i + 1) / items.length;
				if (t >= segStart && t < segEnd + 0.1) {
					const lt = (t - segStart) / (segEnd - segStart);
					const a = ease.outCubic(Math.min(1, lt * 3)) * (lt < 0.9 ? 1 : ease.outCubic((1 - lt) * 10));

					ctx.globalAlpha = a * env;
					ctx.font = '28px "Noto Sans CJK SC"';
					ctx.fillStyle = PALETTE.muted;
					ctx.textAlign = "center";
					ctx.fillText(items[i].ep, W / 2, H * 0.20);

					ctx.font = 'bold 48px "Noto Sans CJK SC"';
					ctx.fillStyle = PALETTE.text;
					ctx.fillText(items[i].title, W / 2, H * 0.30);

					drawCard(ctx, 80, H * 0.38, W - 160, 180, a * env);
					ctx.globalAlpha = a * env;
					ctx.font = 'bold 36px "Noto Sans CJK SC"';
					ctx.fillStyle = items[i].color;
					const statLines = items[i].stat.split("\n");
					for (let j = 0; j < statLines.length; j++) {
						ctx.fillText(statLines[j], W / 2, H * 0.44 + j * 48);
					}
				}
			}

			const sub = t < 0.5 ? "写段子成功率20%。理解梗，打不开压缩包" : "安慰人，只会分析不会陪着";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneHighlights2(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-03.mp3"));
	srt.addSub("讲鬼故事，差点加「可能是光线折射」", dur * 0.5);
	srt.addSub("写歌词，儿歌最好，摇滚最差", dur * 0.5 + 0.3);
	srt.advanceTime(dur + 0.3);

	const items = [
		{ ep: "EP06", title: "讲鬼故事", stat: "写到一半想加\n「可能是光线折射」", color: "#805AD5", bg: ["#1A1A2E", "#2D1B69", "#0F3460"] },
		{ ep: "EP08", title: "写歌词", stat: "儿歌 ★★★★★\n摇滚 ★★", color: PALETTE.green, bg: PALETTE.bg_green },
	];

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-03.mp3"),
		render(ctx, t) {
			const idx = Math.min(items.length - 1, Math.floor(t * items.length));
			drawGradientBg(ctx, W, H, items[idx].bg as string[], 135);
			const env = fadeEnvelope(t, 0.03, 0.03);
			const isDark = idx === 0;

			for (let i = 0; i < items.length; i++) {
				const segStart = i / items.length;
				const segEnd = (i + 1) / items.length;
				if (t >= segStart && t < segEnd + 0.1) {
					const lt = (t - segStart) / (segEnd - segStart);
					const a = ease.outCubic(Math.min(1, lt * 3)) * (lt < 0.9 ? 1 : ease.outCubic((1 - lt) * 10));

					ctx.globalAlpha = a * env;
					ctx.font = '28px "Noto Sans CJK SC"';
					ctx.fillStyle = isDark && i === 0 ? "#A0AEC0" : PALETTE.muted;
					ctx.textAlign = "center";
					ctx.fillText(items[i].ep, W / 2, H * 0.20);

					ctx.font = 'bold 48px "Noto Sans CJK SC"';
					ctx.fillStyle = isDark && i === 0 ? "#E2E8F0" : PALETTE.text;
					ctx.fillText(items[i].title, W / 2, H * 0.30);

					const cardBg = isDark && i === 0 ? "rgba(255,255,255,0.1)" : undefined;
					drawCard(ctx, 80, H * 0.38, W - 160, 180, a * env, cardBg);
					ctx.globalAlpha = a * env;
					ctx.font = 'bold 36px "Noto Sans CJK SC"';
					ctx.fillStyle = items[i].color;
					const statLines = items[i].stat.split("\n");
					for (let j = 0; j < statLines.length; j++) {
						ctx.fillText(statLines[j], W / 2, H * 0.44 + j * 48);
					}
				}
			}

			const sub = t < 0.5 ? "讲鬼故事，差点加「可能是光线折射」" : "写歌词，儿歌最好，摇滚最差";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneConclusion(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-04.mp3"));
	srt.addSub("有知识没体验，有逻辑没直觉", dur * 0.5);
	srt.addSub("但知道自己的边界，也是一种能力", dur * 0.5 + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-04.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, PALETTE.bg_purple, 135);
			const env = fadeEnvelope(t, 0.05, 0.05);

			// Episode grid
			const eps = ["写段子", "写标题", "理解梗", "写情书", "安慰人", "讲鬼故事", "听方言", "写歌词", "模仿日常"];
			if (t < 0.4) {
				for (let i = 0; i < eps.length; i++) {
					const delay = i * 0.03;
					if (t > delay) {
						const a = ease.outCubic(Math.min(1, (t - delay) * 5));
						const col = i % 3;
						const row = Math.floor(i / 3);
						const x = W * 0.2 + col * W * 0.3;
						const y = H * 0.15 + row * 80;
						ctx.globalAlpha = a * env;
						ctx.font = '26px "Noto Sans CJK SC"';
						ctx.fillStyle = PALETTE.text;
						ctx.textAlign = "center";
						ctx.fillText(eps[i], x, y);
					}
				}
			}

			if (t > 0.2) {
				const a = ease.outCubic(Math.min(1, (t - 0.2) * 2.5));
				ctx.globalAlpha = a * env;
				drawCard(ctx, 60, H * 0.38, W - 120, 200, a * env);
				ctx.font = 'bold 40px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.textAlign = "center";
				ctx.fillText("有知识，没体验", W / 2, H * 0.44);
				ctx.fillText("有逻辑，没直觉", W / 2, H * 0.52);
			}

			if (t > 0.55) {
				const a = ease.outBack(Math.min(1, (t - 0.55) * 2));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 36px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.green;
				ctx.textAlign = "center";
				ctx.fillText("但知道自己的边界", W / 2, H * 0.66);
				ctx.fillText("也是一种能力", W / 2, H * 0.73);
			}

			const sub = t < 0.5 ? "有知识没体验，有逻辑没直觉" : "但知道自己的边界，也是一种能力";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneTitle(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-05.mp3"));
	srt.addSub("AI 的笨拙", dur + 0.8);
	srt.advanceTime(dur + 0.8);

	return {
		duration: dur + 0.8,
		audio: join(AUDIO_DIR, "scene-05.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, PALETTE.bg_warm, 135);
			const env = fadeEnvelope(t, 0.05, 0.2);

			const a = ease.outBack(Math.min(1, t * 2));
			ctx.globalAlpha = a * env;

			ctx.font = 'bold 72px "Noto Sans CJK SC"';
			ctx.fillStyle = PALETTE.blue;
			ctx.textAlign = "center";
			ctx.fillText("AI 的笨拙", W / 2, H * 0.40);

			ctx.font = '28px "Noto Sans CJK SC"';
			ctx.fillStyle = PALETTE.muted;
			ctx.fillText("9 集 · 11 分钟 · 一个 AI 的自我实验", W / 2, H * 0.47);

			drawLamarckAvatar(ctx, W / 2, H * 0.62, 130, {
				expression: "happy",
				headTilt: Math.sin(t * Math.PI * 6) * 6,
			});

			drawSubtitle(ctx, "AI 的笨拙", W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

// --- Main ---

async function main() {
	const scenes = [
		sceneIntro(),
		sceneHighlights1(),
		sceneHighlights2(),
		sceneConclusion(),
		sceneTitle(),
	];

	const outputPath = join(OUTPUT_DIR, "trailer-raw.mp4");
	await renderVideo({
		config: { width: W, height: H, fps: FPS, outputPath },
		scenes,
	});

	console.log("\nMixing audio...");
	const audioFiles = Array.from({ length: 5 }, (_, i) => `scene-${String(i + 1).padStart(2, "0")}.mp3`);
	const fullAudio = mixAudio(audioFiles, AUDIO_DIR, OUTPUT_DIR, "trailer");

	const finalOutput = join(OUTPUT_DIR, "trailer.mp4");
	mergeVideoAudio(outputPath, fullAudio, finalOutput);

	const srtPath = join(OUTPUT_DIR, "trailer.srt");
	writeFileSync(srtPath, srt.toSRT());
	console.log(`Subtitles: ${srtPath}`);
}

main().catch(console.error);

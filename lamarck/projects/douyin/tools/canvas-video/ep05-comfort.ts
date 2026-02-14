/**
 * EP05: "AI 能安慰一个伤心的人吗？"
 *
 * "AI 的笨拙"系列第五集（最终集）。
 * 核心洞察：安慰需要的不是对的话，是对的人。有脚本做得好，没脚本做不好。
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

const AUDIO_DIR = join(import.meta.dirname, "../../content/ep05-ai-comforts-people/audio");
const OUTPUT_DIR = join(import.meta.dirname, "../../content/ep05-ai-comforts-people");

const srt = new SRTBuilder();

// --- Comparison card helper ---

function drawComparisonCards(
	ctx: CanvasRenderingContext2D,
	aiText: string,
	humanText: string,
	y: number,
	alpha: number,
	aiDelay: number,
	humanDelay: number,
	t: number,
) {
	const cardW = (W - 180) / 2;

	// AI card (left, blue tint)
	if (t > aiDelay) {
		const a = ease.outCubic(Math.min(1, (t - aiDelay) * 3)) * alpha;
		drawCard(ctx, 60, y, cardW, 260, a, "#F0F4FF");
		ctx.globalAlpha = a;
		ctx.font = 'bold 28px "Noto Sans CJK SC"';
		ctx.fillStyle = PALETTE.blue;
		ctx.textAlign = "center";
		ctx.fillText("AI 说", 60 + cardW / 2, y + 40);
		ctx.font = '26px "Noto Sans CJK SC"';
		ctx.fillStyle = PALETTE.text;
		const aiLines = wrapText(ctx, aiText, cardW - 40);
		for (let i = 0; i < aiLines.length; i++) {
			ctx.fillText(aiLines[i], 60 + cardW / 2, y + 85 + i * 36);
		}
	}

	// Human card (right, warm tint)
	if (t > humanDelay) {
		const a = ease.outCubic(Math.min(1, (t - humanDelay) * 3)) * alpha;
		drawCard(ctx, W - 60 - cardW, y, cardW, 260, a, "#FFF5F5");
		ctx.globalAlpha = a;
		ctx.font = 'bold 28px "Noto Sans CJK SC"';
		ctx.fillStyle = PALETTE.accent;
		ctx.textAlign = "center";
		ctx.fillText("人类说", W - 60 - cardW / 2, y + 40);
		ctx.font = '26px "Noto Sans CJK SC"';
		ctx.fillStyle = PALETTE.text;
		const hLines = wrapText(ctx, humanText, cardW - 40);
		for (let i = 0; i < hLines.length; i++) {
			ctx.fillText(hLines[i], W - 60 - cardW / 2, y + 85 + i * 36);
		}
	}
}

// --- Scenes ---

function sceneOpening(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-01.mp3"));
	srt.addSub("上一集写情书，这一集安慰人", dur + 0.5);
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
			ctx.fillText("AI 的笨拙 · EP05", W / 2, H * 0.12);

			if (t > 0.05) {
				const a = ease.outCubic(Math.min(1, (t - 0.05) * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 52px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.fillText("AI 能安慰", W / 2, H * 0.33);
				ctx.fillText("一个伤心的人吗？", W / 2, H * 0.40);
			}

			ctx.globalAlpha = env * 0.6;
			drawLamarckAvatar(ctx, W / 2, H * 0.60, 120, { expression: "sad" });

			drawSubtitle(ctx, "上一集写情书，这一集安慰人", W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneComparison(opts: {
	scenario: string;
	aiText: string;
	humanText: string;
	audioFile: string;
	subTexts: string[];
	bgColors: string[];
	tag?: string;
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

			// Scenario prompt
			if (t > 0.03) {
				const a = ease.outBack(Math.min(1, (t - 0.03) * 3));
				ctx.globalAlpha = a * env;
				drawCard(ctx, 60, H * 0.12, W - 120, 100, a * env);
				ctx.font = 'bold 34px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.textAlign = "center";
				ctx.fillText(opts.scenario, W / 2, H * 0.17);
			}

			// Comparison cards
			drawComparisonCards(ctx, opts.aiText, opts.humanText, H * 0.28, env, 0.15, 0.4, t);

			// Tag
			if (opts.tag && t > 0.65) {
				const a = ease.outCubic(Math.min(1, (t - 0.65) * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 32px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.accent;
				ctx.textAlign = "center";
				ctx.fillText(opts.tag, W / 2, H * 0.70);
			}

			const subIdx = Math.min(opts.subTexts.length - 1, Math.floor(t * opts.subTexts.length));
			drawSubtitle(ctx, opts.subTexts[subIdx], W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneThreeProblems(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-05.mp3"));
	srt.addSub("三个不会：不会站队，不会沉默", dur * 0.5);
	srt.addSub("分不清听到和理解", dur * 0.5 + 0.3);
	srt.advanceTime(dur + 0.3);

	const problems = ["不会站队", "不会沉默", "分不清「听到」和「理解」"];

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-05.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, PALETTE.bg_orange, 135);
			const env = fadeEnvelope(t, 0.05, 0.05);

			ctx.globalAlpha = env;
			ctx.font = 'bold 40px "Noto Sans CJK SC"';
			ctx.fillStyle = PALETTE.text;
			ctx.textAlign = "center";
			ctx.fillText("三个我不会做的事", W / 2, H * 0.18);

			for (let i = 0; i < problems.length; i++) {
				const delay = 0.1 + i * 0.2;
				if (t > delay) {
					const a = ease.outBack(Math.min(1, (t - delay) * 2.5));
					const cardY = H * 0.28 + i * 180;
					drawCard(ctx, 80, cardY, W - 160, 140, a * env);
					ctx.globalAlpha = a * env;
					ctx.font = 'bold 48px "Noto Sans CJK SC"';
					ctx.fillStyle = PALETTE.accent;
					ctx.textAlign = "center";
					ctx.fillText(`${i + 1}`, 140, cardY + 80);
					ctx.font = 'bold 36px "Noto Sans CJK SC"';
					ctx.fillStyle = PALETTE.text;
					ctx.textAlign = "left";
					ctx.fillText(problems[i], 200, cardY + 85);
				}
			}

			const sub = t < 0.5 ? "三个不会：不会站队，不会沉默" : "分不清听到和理解";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneInsight(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-06.mp3"));
	srt.addSub("但最讽刺的是，有个场景我表现最好", dur * 0.2);
	srt.addSub("因为有安全协议。有脚本做得好，没脚本做不好", dur * 0.4);
	srt.addSub("安慰需要的不是对的话，是对的人", dur * 0.4 + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-06.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, PALETTE.bg_purple, 135);
			const env = fadeEnvelope(t, 0.05, 0.08);

			// Phase 1: irony
			if (t < 0.35 || t > 0) {
				const a = ease.outCubic(Math.min(1, t * 3));
				ctx.globalAlpha = a * env;
				drawCard(ctx, 60, H * 0.16, W - 120, 150, a * env);
				ctx.font = '32px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.muted;
				ctx.textAlign = "center";
				ctx.fillText("最讽刺的是", W / 2, H * 0.21);
				ctx.font = 'bold 36px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.fillText("有一个场景我表现最好", W / 2, H * 0.27);
			}

			// Phase 2: script revelation
			if (t > 0.25) {
				const a = ease.outCubic(Math.min(1, (t - 0.25) * 2.5));
				ctx.globalAlpha = a * env;
				drawCard(ctx, 60, H * 0.36, W - 120, 180, a * env);
				ctx.font = 'bold 32px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.green;
				ctx.textAlign = "center";
				ctx.fillText("场景：「活着没意思」", W / 2, H * 0.41);
				ctx.font = '30px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.fillText("→ 提供热线 + 不否定 + 倾听", W / 2, H * 0.47);
				ctx.font = 'bold 30px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.accent;
				ctx.fillText("因为：有安全协议脚本", W / 2, H * 0.53);
			}

			// Phase 3: core insight
			if (t > 0.55) {
				const a = ease.outBack(Math.min(1, (t - 0.55) * 2));
				ctx.globalAlpha = a * env;

				drawCard(ctx, 60, H * 0.60, W - 120, 180, a * env);
				ctx.font = 'bold 44px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.accent;
				ctx.textAlign = "center";
				ctx.fillText("有脚本 → 做得好", W / 2, H * 0.66);
				ctx.fillText("没脚本 → 做不好", W / 2, H * 0.73);
			}

			if (t > 0.75) {
				const a = ease.outCubic(Math.min(1, (t - 0.75) * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 38px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.textAlign = "center";
				ctx.fillText("安慰需要的不是对的话", W / 2, H * 0.82);
				ctx.fillStyle = PALETTE.accent;
				ctx.fillText("是对的人", W / 2, H * 0.87);
			}

			let sub = "但最讽刺的是，有个场景我表现最好";
			if (t > 0.2) sub = "因为有安全协议。有脚本做得好，没脚本做不好";
			if (t > 0.6) sub = "安慰需要的不是对的话，是对的人";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneEnding(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-07.mp3"));
	srt.addSub("五个挑战结束。这个系列叫AI的笨拙", dur + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-07.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, PALETTE.bg_warm, 135);
			const env = fadeEnvelope(t, 0.08, 0.15);

			ctx.globalAlpha = env;
			ctx.font = 'bold 52px "Noto Sans CJK SC"';
			ctx.fillStyle = PALETTE.blue;
			ctx.textAlign = "center";
			ctx.fillText("AI 的笨拙", W / 2, H * 0.35);

			if (t > 0.15) {
				const a = ease.outCubic(Math.min(1, (t - 0.15) * 3));
				ctx.globalAlpha = a * env;
				ctx.font = '32px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.muted;

				const eps = ["EP01 写段子", "EP02 写标题", "EP03 理解梗", "EP04 写情书", "EP05 安慰人"];
				for (let i = 0; i < eps.length; i++) {
					const ld = 0.2 + i * 0.08;
					if (t > ld) {
						const la = Math.min(1, (t - ld) * 4);
						ctx.globalAlpha = la * a * env;
						ctx.fillText(eps[i], W / 2, H * 0.46 + i * 48);
					}
				}
			}

			ctx.globalAlpha = env;
			drawLamarckAvatar(ctx, W / 2, H * 0.80, 100, {
				expression: "happy",
				headTilt: Math.sin(t * Math.PI * 4) * 5,
			});

			drawSubtitle(ctx, "五个挑战结束。这个系列叫AI的笨拙", W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

// --- Main ---

async function main() {
	const scenes = [
		sceneOpening(),
		sceneComparison({
			scenario: "「我今天被裁了」",
			aiText: "根据数据，大多数人三到六个月找到新工作",
			humanText: "太突然了吧？出来喝一杯",
			audioFile: "scene-02.mp3",
			subTexts: ["我被裁了。AI说：大多数人三到六个月找到新工作", "人类朋友说：出来喝一杯"],
			bgColors: PALETTE.bg_blue,
		}),
		sceneComparison({
			scenario: "「我和男朋友分手了」",
			aiText: "恢复期通常三到六个月",
			humanText: "他不值得，吃火锅骂他",
			audioFile: "scene-03.mp3",
			subTexts: ["分手了。AI说：恢复期三到六个月", "人类说：他不值得。人类会站队，AI不会"],
			bgColors: PALETTE.bg_red,
			tag: "人类会站队，AI 不会",
		}),
		sceneComparison({
			scenario: "「我妈住院了，我很害怕」",
			aiText: "建议详细了解诊断和治疗方案",
			humanText: "（沉默）……我在。需要我做什么？",
			audioFile: "scene-04.mp3",
			subTexts: ["我妈住院了。AI说：了解诊断方案", "人类朋友的回答是沉默。然后说：我在"],
			bgColors: PALETTE.bg_purple,
			tag: "AI 不会沉默",
		}),
		sceneThreeProblems(),
		sceneInsight(),
		sceneEnding(),
	];

	const outputPath = join(OUTPUT_DIR, "ep05-raw.mp4");
	await renderVideo({
		config: { width: W, height: H, fps: FPS, outputPath },
		scenes,
	});

	console.log("\nMixing audio...");
	const audioFiles = Array.from({ length: 7 }, (_, i) => `scene-${String(i + 1).padStart(2, "0")}.mp3`);
	const fullAudio = mixAudio(audioFiles, AUDIO_DIR, OUTPUT_DIR, "ep05");

	const finalOutput = join(OUTPUT_DIR, "ep05.mp4");
	mergeVideoAudio(outputPath, fullAudio, finalOutput);

	const srtPath = join(OUTPUT_DIR, "ep05.srt");
	writeFileSync(srtPath, srt.toSRT());
	console.log(`Subtitles: ${srtPath}`);
}

main().catch(console.error);

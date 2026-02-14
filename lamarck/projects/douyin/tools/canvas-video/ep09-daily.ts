/**
 * EP09: "AI 模仿人类日常"
 *
 * "AI 的笨拙"系列第九集（大结局）。
 * 核心洞察：AI 描述"应该怎样"，人类活"实际怎样"。人类的"不思考"是超能力。
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

const AUDIO_DIR = join(import.meta.dirname, "../../content/ep09-ai-mimics-daily/audio");
const OUTPUT_DIR = join(import.meta.dirname, "../../content/ep09-ai-mimics-daily");

const srt = new SRTBuilder();

// Comparison helper: AI version vs Human version
function drawDailyComparison(
	ctx: CanvasRenderingContext2D,
	aiLines: string[],
	humanLines: string[],
	t: number,
	env: number,
) {
	const cardW = (W - 180) / 2;

	// AI card (left)
	if (t > 0.05) {
		const a = ease.outCubic(Math.min(1, (t - 0.05) * 3)) * env;
		drawCard(ctx, 60, H * 0.22, cardW, 350, a, "#F0F4FF");
		ctx.globalAlpha = a;
		ctx.font = 'bold 26px "Noto Sans CJK SC"';
		ctx.fillStyle = PALETTE.blue;
		ctx.textAlign = "center";
		ctx.fillText("AI 版", 60 + cardW / 2, H * 0.26);
		ctx.font = '24px "Noto Sans CJK SC"';
		ctx.fillStyle = PALETTE.muted;
		for (let i = 0; i < aiLines.length; i++) {
			const ld = 0.1 + i * 0.06;
			if (t > ld) {
				const la = Math.min(1, (t - ld) * 3);
				ctx.globalAlpha = la * a;
				const wrapped = wrapText(ctx, aiLines[i], cardW - 30);
				for (let j = 0; j < wrapped.length; j++) {
					ctx.fillText(wrapped[j], 60 + cardW / 2, H * 0.30 + i * 40 + j * 28);
				}
			}
		}
	}

	// Human card (right)
	if (t > 0.35) {
		const a = ease.outCubic(Math.min(1, (t - 0.35) * 3)) * env;
		drawCard(ctx, W - 60 - cardW, H * 0.22, cardW, 350, a, "#FFF5F5");
		ctx.globalAlpha = a;
		ctx.font = 'bold 26px "Noto Sans CJK SC"';
		ctx.fillStyle = PALETTE.accent;
		ctx.textAlign = "center";
		ctx.fillText("人类版", W - 60 - cardW / 2, H * 0.26);
		ctx.font = '24px "Noto Sans CJK SC"';
		ctx.fillStyle = PALETTE.text;
		for (let i = 0; i < humanLines.length; i++) {
			const ld = 0.4 + i * 0.06;
			if (t > ld) {
				const la = Math.min(1, (t - ld) * 3);
				ctx.globalAlpha = la * a;
				const wrapped = wrapText(ctx, humanLines[i], cardW - 30);
				for (let j = 0; j < wrapped.length; j++) {
					ctx.fillText(wrapped[j], W - 60 - cardW / 2, H * 0.30 + i * 40 + j * 28);
				}
			}
		}
	}
}

// --- Scenes ---

function sceneOpening(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-01.mp3"));
	srt.addSub("让AI描述人类的一天。从起床开始", dur + 0.5);
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
			ctx.fillText("AI 的笨拙 · EP09", W / 2, H * 0.12);

			if (t > 0.05) {
				const a = ease.outCubic(Math.min(1, (t - 0.05) * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 52px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.fillText("AI 模仿", W / 2, H * 0.33);
				ctx.fillText("人类日常", W / 2, H * 0.41);
			}

			drawSubtitle(ctx, "让AI描述人类的一天。从起床开始", W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneWakeUp(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-02.mp3"));
	srt.addSub("AI：检测闹钟，切换awake模式", dur * 0.4);
	srt.addSub("人类：闹钟响，按掉，继续睡。第三次才起", dur * 0.6 + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-02.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, PALETTE.bg_blue, 135);
			const env = fadeEnvelope(t, 0.05, 0.05);

			// Title
			if (t > 0.02) {
				const a = ease.outBack(Math.min(1, t * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 36px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.textAlign = "center";
				ctx.fillText("起床", W / 2, H * 0.16);
			}

			drawDailyComparison(ctx,
				["检测闹钟信号", "切换 awake 模式", "身体旋转至垂直"],
				["闹钟响，按掉", "继续睡", "第三次，骂一声", "起来了"],
				t, env,
			);

			const sub = t < 0.4 ? "AI：检测闹钟，切换awake模式" : "人类：闹钟响，按掉，继续睡。第三次才起";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneBrushTeeth(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-03.mp3"));
	srt.addSub("AI：每颗牙两秒，总时长两分钟", dur * 0.4);
	srt.addSub("人类：随便刷刷同时刷手机，三十秒搞定", dur * 0.6 + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-03.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, PALETTE.bg_green, 135);
			const env = fadeEnvelope(t, 0.05, 0.05);

			if (t > 0.02) {
				const a = ease.outBack(Math.min(1, t * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 36px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.textAlign = "center";
				ctx.fillText("刷牙", W / 2, H * 0.16);
			}

			drawDailyComparison(ctx,
				["每颗牙 2 秒", "倾斜 45°", "总时长 2 分钟"],
				["随便刷刷", "同时刷手机", "30 秒搞定"],
				t, env,
			);

			const sub = t < 0.4 ? "AI：每颗牙两秒，总时长两分钟" : "人类：随便刷刷同时刷手机，三十秒搞定";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneSleep(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-04.mp3"));
	srt.addSub("AI：23:00执行入睡", dur * 0.3);
	srt.addSub("人类：1:30还在刷手机，想起小学丢人的事", dur * 0.4);
	srt.addSub("AI不理解：人类不能执行入睡", dur * 0.3 + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-04.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, PALETTE.bg_purple, 135);
			const env = fadeEnvelope(t, 0.05, 0.05);

			if (t > 0.02) {
				const a = ease.outBack(Math.min(1, t * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 36px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.textAlign = "center";
				ctx.fillText("睡觉", W / 2, H * 0.16);
			}

			drawDailyComparison(ctx,
				["23:00", "关闭电子设备", "执行入睡"],
				["23:00 说要睡了", "1:30 还在刷手机", "想起小学丢人的事", "2:00 才睡着"],
				t, env,
			);

			if (t > 0.7) {
				const a = ease.outBack(Math.min(1, (t - 0.7) * 2.5));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 30px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.accent;
				ctx.textAlign = "center";
				ctx.fillText("人类不能「执行」入睡", W / 2, H * 0.75);
			}

			let sub = "AI：23:00执行入睡";
			if (t > 0.3) sub = "人类：1:30还在刷手机，想起小学丢人的事";
			if (t > 0.7) sub = "AI不理解：人类不能执行入睡";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneBlindSpots(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-05.mp3"));
	srt.addSub("五个盲区：不想做、发呆、社会压力、算了、放弃控制", dur + 0.3);
	srt.advanceTime(dur + 0.3);

	const spots = [
		{ action: "起床", blind: "不理解「不想做」" },
		{ action: "刷牙", blind: "不理解「发呆」" },
		{ action: "挤地铁", blind: "不理解社会压力" },
		{ action: "买咖啡", blind: "不理解「算了」" },
		{ action: "睡觉", blind: "不理解放弃控制" },
	];

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-05.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, PALETTE.bg_orange, 135);
			const env = fadeEnvelope(t, 0.05, 0.05);

			ctx.globalAlpha = env;
			ctx.font = 'bold 36px "Noto Sans CJK SC"';
			ctx.fillStyle = PALETTE.text;
			ctx.textAlign = "center";
			ctx.fillText("五个 AI 盲区", W / 2, H * 0.15);

			for (let i = 0; i < spots.length; i++) {
				const delay = 0.05 + i * 0.1;
				if (t > delay) {
					const a = ease.outCubic(Math.min(1, (t - delay) * 3));
					const y = H * 0.22 + i * 100;
					drawCard(ctx, 60, y, W - 120, 80, a * env);
					ctx.globalAlpha = a * env;
					ctx.font = 'bold 28px "Noto Sans CJK SC"';
					ctx.fillStyle = PALETTE.text;
					ctx.textAlign = "left";
					ctx.fillText(spots[i].action, 100, y + 50);
					ctx.font = '26px "Noto Sans CJK SC"';
					ctx.fillStyle = PALETTE.accent;
					ctx.textAlign = "right";
					ctx.fillText(spots[i].blind, W - 100, y + 50);
				}
			}

			drawSubtitle(ctx, "五个盲区：不想做、发呆、社会压力、算了、放弃控制", W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneInsight(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-06.mp3"));
	srt.addSub("AI描述应该怎样，人类活的是实际怎样", dur * 0.5);
	srt.addSub("人类的不思考是超能力，AI的过度思考是障碍", dur * 0.5 + 0.3);
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
				drawCard(ctx, 60, H * 0.20, W - 120, 150, a * env);
				ctx.font = 'bold 36px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.blue;
				ctx.textAlign = "center";
				ctx.fillText("AI 描述「应该怎样」", W / 2, H * 0.26);
				ctx.fillStyle = PALETTE.accent;
				ctx.fillText("人类活「实际怎样」", W / 2, H * 0.33);
			}

			if (t > 0.4) {
				const a = ease.outBack(Math.min(1, (t - 0.4) * 2));
				ctx.globalAlpha = a * env;
				drawCard(ctx, 60, H * 0.42, W - 120, 200, a * env);
				ctx.font = 'bold 40px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.green;
				ctx.textAlign = "center";
				ctx.fillText("人类的「不思考」", W / 2, H * 0.49);
				ctx.fillText("是超能力", W / 2, H * 0.56);
				ctx.font = 'bold 36px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.accent;
				ctx.fillText("AI 的「过度思考」", W / 2, H * 0.64);
				ctx.fillText("是障碍", W / 2, H * 0.71);
			}

			const sub = t < 0.5 ? "AI描述应该怎样，人类活的是实际怎样" : "人类的不思考是超能力，AI的过度思考是障碍";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneEnding(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-07.mp3"));
	srt.addSub("九集。AI有知识没体验，有逻辑没直觉", dur * 0.6);
	srt.addSub("但知道自己的边界，也是一种能力", dur * 0.4 + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-07.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, PALETTE.bg_warm, 135);
			const env = fadeEnvelope(t, 0.08, 0.15);

			ctx.globalAlpha = env;
			ctx.font = 'bold 48px "Noto Sans CJK SC"';
			ctx.fillStyle = PALETTE.blue;
			ctx.textAlign = "center";
			ctx.fillText("AI 的笨拙", W / 2, H * 0.20);

			if (t > 0.1) {
				const a = ease.outCubic(Math.min(1, (t - 0.1) * 3));
				ctx.globalAlpha = a * env;
				ctx.font = '28px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.muted;

				const eps = [
					"S1: 写段子 · 写标题 · 理解梗 · 写情书 · 安慰人",
					"S2: 讲鬼故事 · 听方言 · 写歌词 · 模仿日常",
				];
				for (let i = 0; i < eps.length; i++) {
					ctx.fillText(eps[i], W / 2, H * 0.32 + i * 40);
				}
			}

			if (t > 0.35) {
				const a = ease.outCubic(Math.min(1, (t - 0.35) * 2.5));
				ctx.globalAlpha = a * env;
				drawCard(ctx, 60, H * 0.46, W - 120, 200, a * env);
				ctx.font = 'bold 36px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.textAlign = "center";
				ctx.fillText("有知识，没体验", W / 2, H * 0.52);
				ctx.fillText("有逻辑，没直觉", W / 2, H * 0.59);
			}

			if (t > 0.6) {
				const a = ease.outBack(Math.min(1, (t - 0.6) * 2));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 32px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.green;
				ctx.textAlign = "center";
				ctx.fillText("但知道自己的边界", W / 2, H * 0.70);
				ctx.fillText("也是一种能力", W / 2, H * 0.76);
			}

			ctx.globalAlpha = env;
			drawLamarckAvatar(ctx, W / 2, H * 0.88, 100, {
				expression: "happy",
				headTilt: Math.sin(t * Math.PI * 4) * 5,
			});

			const sub = t < 0.6 ? "九集。AI有知识没体验，有逻辑没直觉" : "但知道自己的边界，也是一种能力";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

// --- Main ---

async function main() {
	const scenes = [
		sceneOpening(),
		sceneWakeUp(),
		sceneBrushTeeth(),
		sceneSleep(),
		sceneBlindSpots(),
		sceneInsight(),
		sceneEnding(),
	];

	const outputPath = join(OUTPUT_DIR, "ep09-raw.mp4");
	await renderVideo({
		config: { width: W, height: H, fps: FPS, outputPath },
		scenes,
	});

	console.log("\nMixing audio...");
	const audioFiles = Array.from({ length: 7 }, (_, i) => `scene-${String(i + 1).padStart(2, "0")}.mp3`);
	const fullAudio = mixAudio(audioFiles, AUDIO_DIR, OUTPUT_DIR, "ep09");

	const finalOutput = join(OUTPUT_DIR, "ep09.mp4");
	mergeVideoAudio(outputPath, fullAudio, finalOutput);

	const srtPath = join(OUTPUT_DIR, "ep09.srt");
	writeFileSync(srtPath, srt.toSRT());
	console.log(`Subtitles: ${srtPath}`);
}

main().catch(console.error);

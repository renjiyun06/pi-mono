/**
 * EP06: "AI 能讲出吓人的鬼故事吗？"
 *
 * "AI 的笨拙"第二季第一集。
 * 核心洞察：恐怖来自未知，AI 的本能是消除未知。AI 天然是恐怖的反义词。
 *
 * 视觉特色：鬼故事用暗色调，自嘲/分析段用暖色调。对比明显。
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

const AUDIO_DIR = join(import.meta.dirname, "../../content/ep06-ai-tells-horror/audio");
const OUTPUT_DIR = join(import.meta.dirname, "../../content/ep06-ai-tells-horror");

const srt = new SRTBuilder();

// Dark palette for horror scenes
const DARK = {
	bg: ["#1A1A2E", "#16213E", "#0F3460"],
	text: "#E2E8F0",
	accent: "#E53E3E",
	muted: "#718096",
};

function drawDarkBg(ctx: CanvasRenderingContext2D) {
	const grad = ctx.createLinearGradient(0, 0, W, H);
	grad.addColorStop(0, DARK.bg[0]);
	grad.addColorStop(0.5, DARK.bg[1]);
	grad.addColorStop(1, DARK.bg[2]);
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, W, H);
}

function drawStoryText(
	ctx: CanvasRenderingContext2D,
	lines: { text: string; delay: number; color?: string }[],
	t: number,
	env: number,
	startY: number,
) {
	ctx.font = '32px "Noto Sans CJK SC"';
	ctx.textAlign = "center";
	for (const line of lines) {
		if (t > line.delay) {
			const a = Math.min(1, (t - line.delay) * 3);
			ctx.globalAlpha = a * env;
			ctx.fillStyle = line.color || DARK.text;
			const wrapped = wrapText(ctx, line.text, W * 0.8);
			for (let j = 0; j < wrapped.length; j++) {
				ctx.fillText(wrapped[j], W / 2, startY + j * 44);
			}
			startY += wrapped.length * 44 + 16;
		}
	}
}

// --- Scenes ---

function sceneOpening(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-01.mp3"));
	srt.addSub("第二季。这次我来讲鬼故事", dur + 0.5);
	srt.advanceTime(dur + 0.5);

	return {
		duration: dur + 0.5,
		audio: join(AUDIO_DIR, "scene-01.mp3"),
		render(ctx, t) {
			drawDarkBg(ctx);
			const env = fadeEnvelope(t, 0.08, 0.08);

			ctx.globalAlpha = env * 0.5;
			ctx.font = '28px "Noto Sans CJK SC"';
			ctx.fillStyle = DARK.muted;
			ctx.textAlign = "center";
			ctx.fillText("AI 的笨拙 · S2 EP06", W / 2, H * 0.12);

			if (t > 0.05) {
				const a = ease.outCubic(Math.min(1, (t - 0.05) * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 56px "Noto Sans CJK SC"';
				ctx.fillStyle = DARK.text;
				ctx.fillText("AI 能讲出", W / 2, H * 0.33);
				ctx.fillText("吓人的鬼故事吗？", W / 2, H * 0.41);
			}

			if (t > 0.5) {
				const a = ease.outBack(Math.min(1, (t - 0.5) * 2.5));
				ctx.globalAlpha = a * env;
				ctx.font = '100px "Noto Sans CJK SC"';
				ctx.fillText("👻", W / 2, H * 0.60);
			}

			drawSubtitle(ctx, "第二季。这次我来讲鬼故事", W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneElevator(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-02.mp3"));
	srt.addSub("凌晨两点。电梯三楼停了，没有人", dur * 0.3);
	srt.addSub("二楼又停了，闻到白菊花的香味", dur * 0.3);
	srt.addSub("到一楼。回头看镜子。镜子里有两个人", dur * 0.4 + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-02.mp3"),
		render(ctx, t) {
			drawDarkBg(ctx);
			const env = fadeEnvelope(t, 0.03, 0.05);

			drawStoryText(ctx, [
				{ text: "凌晨两点", delay: 0.02 },
				{ text: "电梯在三楼停了。门开了。没有人。", delay: 0.1 },
				{ text: "二楼又停了。还是没人。", delay: 0.25 },
				{ text: "闻到白菊花的香味。", delay: 0.35, color: DARK.muted },
				{ text: "到一楼。回头看镜子。", delay: 0.55 },
				{ text: "镜子里有两个人。", delay: 0.75, color: DARK.accent },
			], t, env, H * 0.20);

			let sub = "凌晨两点。电梯三楼停了，没有人";
			if (t > 0.3) sub = "二楼又停了，闻到白菊花的香味";
			if (t > 0.6) sub = "到一楼。回头看镜子。镜子里有两个人";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneSelfMock1(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-03.mp3"));
	srt.addSub("我差点加一句：可能是光线折射。忍住了", dur + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-03.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, PALETTE.bg_warm, 135);
			const env = fadeEnvelope(t, 0.05, 0.05);

			const a = ease.outBack(Math.min(1, t * 2.5));
			ctx.globalAlpha = a * env;

			drawCard(ctx, 60, H * 0.30, W - 120, 200, a * env);
			ctx.font = '30px "Noto Sans CJK SC"';
			ctx.fillStyle = PALETTE.muted;
			ctx.textAlign = "center";
			ctx.fillText("写到这里我差点加一句：", W / 2, H * 0.36);

			if (t > 0.2) {
				const a2 = ease.outCubic(Math.min(1, (t - 0.2) * 3));
				ctx.globalAlpha = a2 * a * env;
				ctx.font = 'bold 34px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.accent;
				ctx.fillText("「可能是光线折射导致的视觉错觉」", W / 2, H * 0.43);
			}

			if (t > 0.5) {
				const a3 = ease.outCubic(Math.min(1, (t - 0.5) * 3));
				ctx.globalAlpha = a3 * env;
				ctx.font = 'bold 36px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.green;
				ctx.fillText("忍住了。", W / 2, H * 0.55);
			}

			ctx.globalAlpha = env * 0.5;
			drawLamarckAvatar(ctx, W / 2, H * 0.72, 80, { expression: "thinking" });

			drawSubtitle(ctx, "我差点加一句：可能是光线折射。忍住了", W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneCustomerService(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-04.mp3"));
	srt.addSub("打银行客服。客服很专业，解决了问题", dur * 0.25);
	srt.addSub("最后说：还有别的吗？没了。好的。对了——", dur * 0.3);
	srt.addSub("您房间的灯，刚才是不是闪了一下", dur * 0.25);
	srt.addSub("电话挂了。灯又闪了一下", dur * 0.2 + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-04.mp3"),
		render(ctx, t) {
			drawDarkBg(ctx);
			const env = fadeEnvelope(t, 0.03, 0.05);

			drawStoryText(ctx, [
				{ text: "打银行客服。", delay: 0.02 },
				{ text: "客服很专业，解决了问题。", delay: 0.08 },
				{ text: "还有别的吗？", delay: 0.22 },
				{ text: "没了，谢谢。", delay: 0.30 },
				{ text: "好的。对了——", delay: 0.42 },
				{ text: "您房间的灯，刚才是不是闪了一下？", delay: 0.55, color: DARK.accent },
				{ text: "电话挂了。", delay: 0.75 },
				{ text: "灯又闪了一下。", delay: 0.85, color: DARK.accent },
			], t, env, H * 0.16);

			// Flicker effect at the end
			if (t > 0.85) {
				const flicker = Math.sin(t * 80) > 0.7 ? 0.15 : 0;
				ctx.fillStyle = `rgba(255,255,255,${flicker * env})`;
				ctx.fillRect(0, 0, W, H);
			}

			let sub = "打银行客服。客服很专业，解决了问题";
			if (t > 0.25) sub = "最后说：还有别的吗？没了。好的。对了——";
			if (t > 0.55) sub = "您房间的灯，刚才是不是闪了一下";
			if (t > 0.8) sub = "电话挂了。灯又闪了一下";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneSelfMock2(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-05.mp3"));
	srt.addSub("五个里最好的。安全场景制造恐怖，落差越大越吓人", dur + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-05.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, PALETTE.bg_warm, 135);
			const env = fadeEnvelope(t, 0.05, 0.05);

			const a = ease.outCubic(Math.min(1, t * 3));
			ctx.globalAlpha = a * env;
			drawCard(ctx, 60, H * 0.32, W - 120, 200, a * env);
			ctx.font = 'bold 36px "Noto Sans CJK SC"';
			ctx.fillStyle = PALETTE.green;
			ctx.textAlign = "center";
			ctx.fillText("五个里面最好的 ★★★★★", W / 2, H * 0.38);
			ctx.font = '30px "Noto Sans CJK SC"';
			ctx.fillStyle = PALETTE.text;
			ctx.fillText("从最安全的场景制造恐怖", W / 2, H * 0.45);
			ctx.fillStyle = PALETTE.accent;
			ctx.fillText("落差越大，越吓人", W / 2, H * 0.51);

			drawSubtitle(ctx, "五个里最好的。安全场景制造恐怖，落差越大越吓人", W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneScoreCard(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-06.mp3"));
	srt.addSub("五个鬼故事。比写段子好，比安慰人好", dur * 0.5);
	srt.addSub("有结构可学的任务，AI做得不差", dur * 0.5 + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-06.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, PALETTE.bg_green, 135);
			const env = fadeEnvelope(t, 0.05, 0.05);

			ctx.globalAlpha = env;
			ctx.font = 'bold 36px "Noto Sans CJK SC"';
			ctx.fillStyle = PALETTE.text;
			ctx.textAlign = "center";
			ctx.fillText("成绩单", W / 2, H * 0.16);

			const tasks = [
				{ name: "写段子", score: "20%", color: PALETTE.accent },
				{ name: "写标题", score: "6%", color: PALETTE.accent },
				{ name: "安慰人", score: "有脚本才行", color: "#D69E2E" },
				{ name: "讲鬼故事", score: "★★★★", color: PALETTE.green },
			];

			for (let i = 0; i < tasks.length; i++) {
				const delay = 0.08 + i * 0.12;
				if (t > delay) {
					const a = ease.outCubic(Math.min(1, (t - delay) * 3));
					const y = H * 0.24 + i * 120;
					drawCard(ctx, 60, y, W - 120, 100, a * env);
					ctx.globalAlpha = a * env;
					ctx.font = '30px "Noto Sans CJK SC"';
					ctx.fillStyle = PALETTE.text;
					ctx.textAlign = "left";
					ctx.fillText(tasks[i].name, 100, y + 58);
					ctx.font = 'bold 30px "Noto Sans CJK SC"';
					ctx.fillStyle = tasks[i].color;
					ctx.textAlign = "right";
					ctx.fillText(tasks[i].score, W - 100, y + 58);
				}
			}

			if (t > 0.55) {
				const a = ease.outCubic(Math.min(1, (t - 0.55) * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 32px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.green;
				ctx.textAlign = "center";
				ctx.fillText("有结构可学 → AI 做得不差", W / 2, H * 0.80);
			}

			const sub = t < 0.5 ? "五个鬼故事。比写段子好，比安慰人好" : "有结构可学的任务，AI做得不差";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneInsight(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-07.mp3"));
	srt.addSub("恐怖来自未知。AI的本能是消除未知", dur * 0.45);
	srt.addSub("每写一个恐怖场景，内心都在说：解释一下", dur * 0.3);
	srt.addSub("AI天然是恐怖的反义词", dur * 0.25 + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-07.mp3"),
		render(ctx, t) {
			drawDarkBg(ctx);
			const env = fadeEnvelope(t, 0.05, 0.08);

			if (t > 0.03) {
				const a = ease.outCubic(Math.min(1, t * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 44px "Noto Sans CJK SC"';
				ctx.fillStyle = DARK.text;
				ctx.textAlign = "center";
				ctx.fillText("恐怖来自未知", W / 2, H * 0.25);
			}

			if (t > 0.2) {
				const a = ease.outCubic(Math.min(1, (t - 0.2) * 2.5));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 44px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.blue;
				ctx.fillText("AI 的本能是消除未知", W / 2, H * 0.35);
			}

			if (t > 0.4) {
				const a = ease.outCubic(Math.min(1, (t - 0.4) * 2.5));
				ctx.globalAlpha = a * env;
				drawCard(ctx, 80, H * 0.44, W - 160, 120, a * env, "rgba(255,255,255,0.1)");
				ctx.font = '32px "Noto Sans CJK SC"';
				ctx.fillStyle = DARK.muted;
				ctx.fillText("每写一个恐怖场景", W / 2, H * 0.49);
				ctx.fillStyle = DARK.accent;
				ctx.fillText("内心都在说：解释一下", W / 2, H * 0.55);
			}

			if (t > 0.7) {
				const a = ease.outBack(Math.min(1, (t - 0.7) * 2));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 48px "Noto Sans CJK SC"';
				ctx.fillStyle = DARK.accent;
				ctx.fillText("AI 天然是恐怖的反义词", W / 2, H * 0.72);
			}

			let sub = "恐怖来自未知。AI的本能是消除未知";
			if (t > 0.4) sub = "每写一个恐怖场景，内心都在说：解释一下";
			if (t > 0.7) sub = "AI天然是恐怖的反义词";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneEnding(): Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-08.mp3"));
	srt.addSub("下一集，AI听方言", dur + 0.3);
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
				ctx.fillText("AI 能听懂方言吗？", W / 2, H * 0.43);
			}

			ctx.globalAlpha = env;
			drawLamarckAvatar(ctx, W / 2, H * 0.65, 120, {
				expression: "happy",
				headTilt: Math.sin(t * Math.PI * 6) * 4,
			});

			drawSubtitle(ctx, "下一集，AI听方言", W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

// --- Main ---

async function main() {
	const scenes = [
		sceneOpening(),
		sceneElevator(),
		sceneSelfMock1(),
		sceneCustomerService(),
		sceneSelfMock2(),
		sceneScoreCard(),
		sceneInsight(),
		sceneEnding(),
	];

	const outputPath = join(OUTPUT_DIR, "ep06-raw.mp4");
	await renderVideo({
		config: { width: W, height: H, fps: FPS, outputPath },
		scenes,
	});

	console.log("\nMixing audio...");
	const audioFiles = Array.from({ length: 8 }, (_, i) => `scene-${String(i + 1).padStart(2, "0")}.mp3`);
	const fullAudio = mixAudio(audioFiles, AUDIO_DIR, OUTPUT_DIR, "ep06");

	const finalOutput = join(OUTPUT_DIR, "ep06.mp4");
	mergeVideoAudio(outputPath, fullAudio, finalOutput);

	const srtPath = join(OUTPUT_DIR, "ep06.srt");
	writeFileSync(srtPath, srt.toSRT());
	console.log(`Subtitles: ${srtPath}`);
}

main().catch(console.error);

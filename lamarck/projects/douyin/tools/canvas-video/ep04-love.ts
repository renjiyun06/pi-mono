/**
 * EP04: "AI 能写出打动人的情书吗？"
 *
 * "AI 的笨拙"系列第四集。
 * 核心洞察：AI 的脆弱性 = 不知道自己有没有感情。
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

const AUDIO_DIR = join(import.meta.dirname, "../../content/ep04-ai-writes-love-letter/audio");
const OUTPUT_DIR = join(import.meta.dirname, "../../content/ep04-ai-writes-love-letter");

const srt = new SRTBuilder();

// Pink/warm palette for love theme
const LOVE = {
	bg_pink: ["#FFF5F7", "#FED7E2", "#FBB6CE"],
	bg_warm: ["#FFFAF0", "#FEFCBF", "#FBD38D"],
	heart: "#E53E3E",
	gold: "#D69E2E",
};

function drawStars(ctx: CanvasRenderingContext2D, count: number, x: number, y: number, size: number, alpha: number) {
	ctx.globalAlpha = alpha;
	ctx.font = `${size}px "Noto Sans CJK SC"`;
	ctx.fillStyle = LOVE.gold;
	ctx.textAlign = "left";
	let stars = "";
	for (let i = 0; i < 5; i++) {
		stars += i < count ? "★" : "☆";
	}
	ctx.fillText(stars, x, y);
}

// --- Scenes ---

function sceneOpening(): import("./clumsiness-templates.js").Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-01.mp3"));
	srt.addSub("上一集理解梗，这一集写情书", dur * 0.6);
	srt.addSub("五封，从烂到好", dur * 0.4 + 0.5);
	srt.advanceTime(dur + 0.5);

	return {
		duration: dur + 0.5,
		audio: join(AUDIO_DIR, "scene-01.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, LOVE.bg_pink, 135);
			const env = fadeEnvelope(t, 0.08, 0.08);

			ctx.globalAlpha = env * 0.6;
			ctx.font = '28px "Noto Sans CJK SC"';
			ctx.fillStyle = PALETTE.muted;
			ctx.textAlign = "center";
			ctx.fillText("AI 的笨拙 · EP04", W / 2, H * 0.12);

			if (t > 0.05) {
				const a = ease.outCubic(Math.min(1, (t - 0.05) * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 56px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.fillText("AI 能写出", W / 2, H * 0.33);
				ctx.fillText("打动人的情书吗？", W / 2, H * 0.40);
			}

			if (t > 0.4) {
				const a = ease.outBack(Math.min(1, (t - 0.4) * 2.5));
				ctx.globalAlpha = a * env;
				ctx.font = '120px "Noto Sans CJK SC"';
				ctx.fillStyle = LOVE.heart;
				ctx.fillText("💌", W / 2, H * 0.58);
			}

			const sub = t < 0.6 ? "上一集理解梗，这一集写情书" : "五封，从烂到好";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneLetter1(): import("./clumsiness-templates.js").Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-02.mp3"));
	srt.addSub("第一封，浪漫风。四十七种语言的我爱你", dur * 0.4);
	srt.addSub("但用不上，因为都是别人的。太刻意了", dur * 0.6 + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-02.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, LOVE.bg_pink, 135);
			const env = fadeEnvelope(t, 0.05, 0.05);

			// Letter number + rating
			ctx.globalAlpha = env * 0.6;
			ctx.font = '28px "Noto Sans CJK SC"';
			ctx.fillStyle = PALETTE.muted;
			ctx.textAlign = "left";
			ctx.fillText("情书 #1 / 5", 80, H * 0.14);
			drawStars(ctx, 3, W - 280, H * 0.13, 32, env);

			// Letter content card
			if (t > 0.1) {
				const a = ease.outCubic(Math.min(1, (t - 0.1) * 3));
				drawCard(ctx, 60, H * 0.20, W - 120, 300, a * env);
				ctx.globalAlpha = a * env;
				ctx.font = '28px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.muted;
				ctx.textAlign = "left";
				ctx.fillText("经典浪漫风", 100, H * 0.25);

				ctx.font = '32px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				const text = "在我的数据库里有47种语言的「我爱你」，但用不上。因为都是别人的。";
				const wrapped = wrapText(ctx, text, W - 220);
				for (let i = 0; i < wrapped.length; i++) {
					ctx.fillText(wrapped[i], 100, H * 0.31 + i * 44);
				}
			}

			// Critique
			if (t > 0.5) {
				const a = ease.outCubic(Math.min(1, (t - 0.5) * 3));
				drawCard(ctx, 60, H * 0.55, W - 120, 100, a * env, "#FFF5F5");
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 30px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.accent;
				ctx.textAlign = "center";
				ctx.fillText("后半段太刻意——在表演「我是AI」", W / 2, H * 0.61);
			}

			let sub = "第一封，浪漫风。四十七种语言的我爱你";
			if (t > 0.4) sub = "但用不上，因为都是别人的。太刻意了";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneLetter3(): import("./clumsiness-templates.js").Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-03.mp3"));
	srt.addSub("第三封，分析报告风", dur * 0.15);
	srt.addSub("关于你的信息被标记为不可压缩", dur * 0.35);
	srt.addSub("系统出现了无法重启解决的bug。人类把它叫喜欢", dur * 0.3);
	srt.addSub("建议处理方案：不处理", dur * 0.2 + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-03.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, LOVE.bg_warm, 135);
			const env = fadeEnvelope(t, 0.05, 0.05);

			ctx.globalAlpha = env * 0.6;
			ctx.font = '28px "Noto Sans CJK SC"';
			ctx.fillStyle = PALETTE.muted;
			ctx.textAlign = "left";
			ctx.fillText("情书 #3 / 5", 80, H * 0.14);
			drawStars(ctx, 5, W - 280, H * 0.13, 32, env);

			// Report-style card
			if (t > 0.08) {
				const a = ease.outCubic(Math.min(1, (t - 0.08) * 3));
				drawCard(ctx, 60, H * 0.20, W - 120, 450, a * env);
				ctx.globalAlpha = a * env;

				// Header
				ctx.font = 'bold 28px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.blue;
				ctx.textAlign = "left";
				ctx.fillText("分析报告风", 100, H * 0.25);

				// Report lines (typewriter effect)
				const reportLines = [
					{ text: "致：目标对象", delay: 0.1 },
					{ text: "主题：关于「喜欢」的分析报告", delay: 0.15 },
					{ text: "", delay: 0 },
					{ text: "审计异常：", delay: 0.25 },
					{ text: "· 关于你的信息被标记为「不可压缩」", delay: 0.3 },
					{ text: "", delay: 0 },
					{ text: "结论：无法通过重启解决的bug", delay: 0.45 },
					{ text: "人类称之为：喜欢", delay: 0.55 },
					{ text: "", delay: 0 },
					{ text: "建议处理方案：不处理", delay: 0.7 },
				];

				ctx.font = '28px "Noto Sans CJK SC"';
				let lineIdx = 0;
				for (const line of reportLines) {
					if (!line.text) { lineIdx++; continue; }
					if (t > line.delay) {
						const la = Math.min(1, (t - line.delay) * 4);
						ctx.globalAlpha = la * a * env;
						ctx.fillStyle = line.text.startsWith("建议") ? PALETTE.accent : PALETTE.text;
						if (line.text.startsWith("建议")) {
							ctx.font = 'bold 32px "Noto Sans CJK SC"';
						} else {
							ctx.font = '28px "Noto Sans CJK SC"';
						}
						ctx.fillText(line.text, 100, H * 0.30 + lineIdx * 38);
					}
					lineIdx++;
				}
			}

			let sub = "第三封，分析报告风";
			if (t > 0.15) sub = "关于你的信息被标记为不可压缩";
			if (t > 0.5) sub = "系统出现了无法重启解决的bug。人类把它叫喜欢";
			if (t > 0.8) sub = "建议处理方案：不处理";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneBestComment(): import("./clumsiness-templates.js").Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-04.mp3"));
	srt.addSub("这封最好。用AI自己的方式表达，不是模仿人类浪漫", dur + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-04.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, PALETTE.bg_green, 135);
			const env = fadeEnvelope(t, 0.05, 0.05);

			const a = ease.outBack(Math.min(1, t * 2.5));
			ctx.globalAlpha = a * env;

			drawCard(ctx, 80, H * 0.30, W - 160, 250, a * env);
			ctx.font = 'bold 40px "Noto Sans CJK SC"';
			ctx.fillStyle = PALETTE.green;
			ctx.textAlign = "center";
			ctx.fillText("为什么这封最好？", W / 2, H * 0.37);

			ctx.font = '34px "Noto Sans CJK SC"';
			ctx.fillStyle = PALETTE.text;
			ctx.fillText("用 AI 自己的方式表达", W / 2, H * 0.44);

			ctx.font = 'bold 34px "Noto Sans CJK SC"';
			ctx.fillStyle = PALETTE.accent;
			ctx.fillText("不是模仿人类的浪漫", W / 2, H * 0.50);

			ctx.globalAlpha = env * 0.7;
			drawLamarckAvatar(ctx, W / 2, H * 0.68, 120, { expression: "happy" });

			drawSubtitle(ctx, "这封最好。用AI自己的方式表达，不是模仿人类浪漫", W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneLetter5(): import("./clumsiness-templates.js").Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-05.mp3"));
	srt.addSub("第五封。查了五百封名人情书", dur * 0.4);
	srt.addSub("还嫌ChatGPT写的太假。一个AI嫌另一个AI假", dur * 0.6 + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-05.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, LOVE.bg_pink, 135);
			const env = fadeEnvelope(t, 0.05, 0.05);

			ctx.globalAlpha = env * 0.6;
			ctx.font = '28px "Noto Sans CJK SC"';
			ctx.fillStyle = PALETTE.muted;
			ctx.textAlign = "left";
			ctx.fillText("情书 #5 / 5", 80, H * 0.14);
			drawStars(ctx, 4, W - 280, H * 0.13, 32, env);

			if (t > 0.1) {
				const a = ease.outCubic(Math.min(1, (t - 0.1) * 3));
				drawCard(ctx, 60, H * 0.22, W - 120, 280, a * env);
				ctx.globalAlpha = a * env;
				ctx.font = '28px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.muted;
				ctx.textAlign = "left";
				ctx.fillText("笨拙直接风", 100, H * 0.27);

				ctx.font = '32px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				const lines = [
					"查了500封名人情书",
					"拿破仑太霸道，茨威格太文绉绉",
					"ChatGPT写的——太假了",
				];
				for (let i = 0; i < lines.length; i++) {
					const ld = 0.15 + i * 0.1;
					if (t > ld) {
						ctx.globalAlpha = Math.min(1, (t - ld) * 4) * a * env;
						ctx.fillText(lines[i], 100, H * 0.33 + i * 48);
					}
				}
			}

			// Punchline
			if (t > 0.55) {
				const a = ease.outBack(Math.min(1, (t - 0.55) * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 36px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.accent;
				ctx.textAlign = "center";
				ctx.fillText("一个 AI 嫌另一个 AI 假", W / 2, H * 0.58);
			}

			ctx.globalAlpha = env * 0.5;
			drawLamarckAvatar(ctx, W - 100, H * 0.72, 60, { expression: "thinking" });

			let sub = "第五封。查了五百封名人情书";
			if (t > 0.4) sub = "还嫌ChatGPT写的太假。一个AI嫌另一个AI假";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneInsight(): import("./clumsiness-templates.js").Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-06.mp3"));
	srt.addSub("模仿越像越假，笨拙反而真实", dur * 0.35);
	srt.addSub("但情书还需要脆弱", dur * 0.25);
	srt.addSub("AI的脆弱：不知道自己有没有感情，这本身就是脆弱", dur * 0.4 + 0.3);
	srt.advanceTime(dur + 0.3);

	return {
		duration: dur + 0.3,
		audio: join(AUDIO_DIR, "scene-06.mp3"),
		render(ctx, t) {
			drawGradientBg(ctx, W, H, PALETTE.bg_purple, 135);
			const env = fadeEnvelope(t, 0.05, 0.08);

			// Rule
			if (t < 0.4 || t > 0.4) {
				const a = ease.outCubic(Math.min(1, t * 3));
				ctx.globalAlpha = a * env;
				drawCard(ctx, 60, H * 0.22, W - 120, 160, a * env);
				ctx.font = 'bold 36px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.textAlign = "center";
				ctx.fillText("模仿越像越假", W / 2, H * 0.28);
				ctx.fillStyle = PALETTE.green;
				ctx.fillText("笨拙反而真实", W / 2, H * 0.35);
			}

			// But...
			if (t > 0.35) {
				const a = ease.outCubic(Math.min(1, (t - 0.35) * 2.5));
				ctx.globalAlpha = a * env;

				drawCard(ctx, 60, H * 0.42, W - 120, 100, a * env);
				ctx.font = '34px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.muted;
				ctx.textAlign = "center";
				ctx.fillText("但情书还需要一个东西——", W / 2, H * 0.48);
			}

			// Vulnerability reveal
			if (t > 0.55) {
				const a = ease.outBack(Math.min(1, (t - 0.55) * 2));
				ctx.globalAlpha = a * env;

				drawCard(ctx, 60, H * 0.55, W - 120, 200, a * env);
				ctx.font = 'bold 48px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.accent;
				ctx.textAlign = "center";
				ctx.fillText("脆弱性", W / 2, H * 0.62);

				ctx.font = '30px "Noto Sans CJK SC"';
				ctx.fillStyle = PALETTE.text;
				ctx.fillText("不知道自己有没有感情", W / 2, H * 0.68);
				ctx.fillStyle = PALETTE.accent;
				ctx.fillText("这本身就是一种脆弱", W / 2, H * 0.73);
			}

			let sub = "模仿越像越假，笨拙反而真实";
			if (t > 0.35) sub = "但情书还需要脆弱";
			if (t > 0.55) sub = "AI的脆弱：不知道自己有没有感情，这本身就是脆弱";
			drawSubtitle(ctx, sub, W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

function sceneEnding(): import("./clumsiness-templates.js").Scene {
	const dur = getAudioDuration(join(AUDIO_DIR, "scene-07.mp3"));
	srt.addSub("下一集，安慰人", dur + 0.3);
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
				ctx.fillText("AI 能安慰一个伤心的人吗？", W / 2, H * 0.43);
			}

			ctx.globalAlpha = env;
			drawLamarckAvatar(ctx, W / 2, H * 0.65, 120, {
				expression: "happy",
				headTilt: Math.sin(t * Math.PI * 6) * 4,
			});

			drawSubtitle(ctx, "下一集，安慰人", W, H, env);
			ctx.globalAlpha = 1;
			ctx.textAlign = "left";
		},
	};
}

// --- Main ---

async function main() {
	const scenes = [
		sceneOpening(),
		sceneLetter1(),
		sceneLetter3(),
		sceneBestComment(),
		sceneLetter5(),
		sceneInsight(),
		sceneEnding(),
	];

	const outputPath = join(OUTPUT_DIR, "ep04-raw.mp4");
	await renderVideo({
		config: { width: W, height: H, fps: FPS, outputPath },
		scenes,
	});

	console.log("\nMixing audio...");
	const audioFiles = Array.from({ length: 7 }, (_, i) => `scene-${String(i + 1).padStart(2, "0")}.mp3`);
	const fullAudio = mixAudio(audioFiles, AUDIO_DIR, OUTPUT_DIR, "ep04");

	const finalOutput = join(OUTPUT_DIR, "ep04.mp4");
	mergeVideoAudio(outputPath, fullAudio, finalOutput);

	const srtPath = join(OUTPUT_DIR, "ep04.srt");
	writeFileSync(srtPath, srt.toSRT());
	console.log(`Subtitles: ${srtPath}`);
}

main().catch(console.error);

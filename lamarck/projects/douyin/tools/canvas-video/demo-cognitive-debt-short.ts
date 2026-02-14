/**
 * "认知债务" short version (~60s) with burned-in subtitles.
 *
 * Optimized for Douyin completion rate:
 * - Hook in first 3 seconds
 * - ~60s total length
 * - Burned-in subtitles for accessibility
 * - Strong visual variety across scenes
 */

import { createCanvas, type CanvasRenderingContext2D } from "canvas";
import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import {
	drawGradientBg,
	ease,
	fadeEnvelope,
	renderVideo,
	type Scene,
	type VideoConfig,
} from "./engine.js";
import { drawLamarckAvatar } from "./avatar.js";
import {
	ParticleSystem,
	drawDotGrid,
	drawVignette,
	drawSubtitle,
	drawCodeRain,
	roundRect,
} from "./fx.js";

const W = 1080;
const H = 1920;
const FPS = 30;
const PYENV = "/home/lamarck/pi-mono/lamarck/pyenv/bin/python";

const C = {
	bg1: ["#0a0a1a", "#1a1a3e", "#0a0a1a"],
	bg2: ["#1a0a2e", "#2d1b69", "#1a0a2e"],
	bg3: ["#0a1a1a", "#0d3b3b", "#0a1a1a"],
	bg4: ["#0a1a0a", "#0d3b1b", "#0a1a0a"],
	text: "#e8e8e8",
	accent: "#ff6b6b",
	highlight: "#64ffda",
	warning: "#ffd93d",
	muted: "#8892b0",
};

// --- Subtitle system ---

interface SubtitleSegment {
	text: string;
	startFrame: number;
	endFrame: number;
}

class SubtitleTrack {
	private segments: SubtitleSegment[] = [];
	private sceneOffset = 0;

	/** Set the frame offset for the current scene */
	setSceneOffset(offset: number) {
		this.sceneOffset = offset;
	}

	/** Add a subtitle segment (frames relative to scene start) */
	add(text: string, startFrame: number, endFrame: number) {
		this.segments.push({
			text,
			startFrame: this.sceneOffset + startFrame,
			endFrame: this.sceneOffset + endFrame,
		});
	}

	/** Get the current subtitle text for a global frame */
	getTextAt(globalFrame: number): string | null {
		for (const seg of this.segments) {
			if (globalFrame >= seg.startFrame && globalFrame < seg.endFrame) {
				return seg.text;
			}
		}
		return null;
	}

	/** Export as SRT file */
	toSRT(fps: number): string {
		let srt = "";
		for (let i = 0; i < this.segments.length; i++) {
			const seg = this.segments[i];
			srt += `${i + 1}\n`;
			srt += `${framesToTimecode(seg.startFrame, fps)} --> ${framesToTimecode(seg.endFrame, fps)}\n`;
			srt += `${seg.text}\n\n`;
		}
		return srt;
	}
}

function framesToTimecode(frame: number, fps: number): string {
	const totalMs = Math.round((frame / fps) * 1000);
	const h = Math.floor(totalMs / 3600000);
	const m = Math.floor((totalMs % 3600000) / 60000);
	const s = Math.floor((totalMs % 60000) / 1000);
	const ms = totalMs % 1000;
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

// --- TTS ---

async function generateTTS(text: string, outputPath: string): Promise<number> {
	const cmd = `${PYENV} -m edge_tts --voice "zh-CN-YunxiNeural" --rate="-3%" --text "${text.replace(/"/g, '\\"')}" --write-media "${outputPath}"`;
	execSync(cmd, { stdio: "pipe" });
	const dur = execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${outputPath}"`, {
		encoding: "utf-8",
	}).trim();
	return Number.parseFloat(dur);
}

// --- Subtitle rendering ---

function drawBurnedSubtitle(ctx: CanvasRenderingContext2D, text: string | null, w: number, h: number, alpha: number = 1) {
	if (!text) return;

	ctx.save();
	ctx.globalAlpha = alpha;

	const y = h * 0.88;
	const fontSize = 38;
	ctx.font = `bold ${fontSize}px "Noto Sans CJK SC"`;
	ctx.textAlign = "center";

	const metrics = ctx.measureText(text);
	const textW = metrics.width;
	const padding = 20;

	// Background pill
	ctx.fillStyle = "rgba(0,0,0,0.65)";
	roundRect(ctx, w / 2 - textW / 2 - padding, y - fontSize + 4, textW + padding * 2, fontSize + padding + 4, 10);
	ctx.fill();

	// Text with slight shadow
	ctx.shadowColor = "rgba(0,0,0,0.5)";
	ctx.shadowBlur = 4;
	ctx.fillStyle = "#ffffff";
	ctx.fillText(text, w / 2, y + 4);

	ctx.restore();
}

// --- Scenes ---

function makeScene_Hook(dur: number, subs: SubtitleTrack, frameOffset: number): Scene {
	const particles = new ParticleSystem(W, H);
	particles.spawnBokeh(25, ["#ff6b6b33", "#64ffda33", "#ffd93d33"]);

	subs.setSceneOffset(frameOffset);
	// Subtitles timed to TTS
	subs.add("用了 AI 之后", 0, Math.floor(dur * FPS * 0.4));
	subs.add("你有没有觉得自己变笨了？", Math.floor(dur * FPS * 0.35), Math.floor(dur * FPS * 0.7));
	subs.add("这不是错觉", Math.floor(dur * FPS * 0.7), Math.floor(dur * FPS));

	return {
		duration: dur + 0.3,
		render(ctx, t, frame, config) {
			drawGradientBg(ctx, W, H, C.bg1, 90);
			drawDotGrid(ctx, W, H, { alpha: 0.03 });

			particles.update();
			particles.draw(ctx);

			const env = fadeEnvelope(t, 0.05, 0.05);

			// Big accent text
			if (t > 0.05) {
				const a = ease.outCubic(Math.min(1, (t - 0.05) * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 60px "Noto Sans CJK SC"';
				ctx.fillStyle = C.text;
				ctx.textAlign = "center";
				ctx.fillText("用了 AI 之后", W / 2, H * 0.32);
			}

			if (t > 0.3) {
				const a = ease.outCubic(Math.min(1, (t - 0.3) * 3));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 60px "Noto Sans CJK SC"';
				ctx.fillStyle = C.text;
				ctx.textAlign = "center";
				ctx.fillText("你有没有觉得", W / 2, H * 0.40);
			}

			if (t > 0.45) {
				const a = ease.outBack(Math.min(1, (t - 0.45) * 2.5));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 72px "Noto Sans CJK SC"';
				ctx.fillStyle = C.accent;
				ctx.textAlign = "center";
				ctx.fillText("自己变笨了？", W / 2, H * 0.51);
			}

			// Avatar
			if (t > 0.35) {
				const a = ease.outCubic(Math.min(1, (t - 0.35) * 3));
				ctx.globalAlpha = a * env * 0.8;
				drawLamarckAvatar(ctx, W / 2, H * 0.68, 130, {
					expression: "thinking",
					headTilt: Math.sin(frame * 0.02) * 2,
				});
			}

			drawVignette(ctx, W, H, 0.3);

			// Subtitle
			const globalFrame = frameOffset + frame;
			drawBurnedSubtitle(ctx, subs.getTextAt(globalFrame), W, H, env);

			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

function makeScene_Core(dur: number, subs: SubtitleTrack, frameOffset: number): Scene {
	const particles = new ParticleSystem(W, H);
	particles.spawnBokeh(15, ["#64ffda22"]);

	const totalF = Math.floor(dur * FPS);
	subs.setSceneOffset(frameOffset);
	subs.add("研究发现：频繁使用 AI 的人", 0, Math.floor(totalF * 0.3));
	subs.add("批判性思维显著下降", Math.floor(totalF * 0.25), Math.floor(totalF * 0.5));
	subs.add("越依赖 越退化 越依赖", Math.floor(totalF * 0.5), Math.floor(totalF * 0.75));
	subs.add("形成恶性循环", Math.floor(totalF * 0.7), totalF);

	return {
		duration: dur + 0.3,
		render(ctx, t, frame, config) {
			drawGradientBg(ctx, W, H, C.bg2, 90);

			particles.update();
			particles.draw(ctx);

			const env = fadeEnvelope(t, 0.06, 0.06);

			// Source
			ctx.globalAlpha = env * 0.5;
			ctx.font = '22px "Noto Sans CJK SC"';
			ctx.fillStyle = C.muted;
			ctx.textAlign = "left";
			ctx.fillText("Harvard · Microsoft · SBS 联合研究", 80, H * 0.18);

			ctx.strokeStyle = C.highlight + "33";
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(80, H * 0.20);
			ctx.lineTo(W - 80, H * 0.20);
			ctx.stroke();

			// Key points
			const points = [
				{ text: "频繁使用 AI 的人", delay: 0.05, bold: false, color: C.text },
				{ text: "批判性思维能力 显著下降", delay: 0.2, bold: true, color: C.accent },
				{ text: "记忆力和注意力 同步退化", delay: 0.35, bold: true, color: C.accent },
				{ text: "越依赖 → 越退化 → 越依赖", delay: 0.55, bold: true, color: C.warning },
			];

			for (let i = 0; i < points.length; i++) {
				const p = points[i];
				if (t < p.delay) continue;
				const a = ease.outCubic(Math.min(1, (t - p.delay) * 2.5));
				const slideX = (1 - a) * 25;

				ctx.globalAlpha = a * env;
				ctx.font = p.bold ? 'bold 46px "Noto Sans CJK SC"' : '42px "Noto Sans CJK SC"';
				ctx.fillStyle = p.color;
				ctx.textAlign = "left";
				ctx.fillText(p.text, 80 + slideX, H * 0.28 + i * 85);
			}

			drawVignette(ctx, W, H, 0.3);

			const globalFrame = frameOffset + frame;
			drawBurnedSubtitle(ctx, subs.getTextAt(globalFrame), W, H, env);

			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

function makeScene_Analogy(dur: number, subs: SubtitleTrack, frameOffset: number): Scene {
	const totalF = Math.floor(dur * FPS);
	subs.setSceneOffset(frameOffset);
	subs.add("这叫认知债务", 0, Math.floor(totalF * 0.25));
	subs.add("像技术债务一样", Math.floor(totalF * 0.2), Math.floor(totalF * 0.5));
	subs.add("省下的脑力 未来加倍偿还", Math.floor(totalF * 0.5), totalF);

	return {
		duration: dur + 0.3,
		render(ctx, t, frame, config) {
			drawGradientBg(ctx, W, H, C.bg3, 90);
			drawCodeRain(ctx, W, H, frame, { alpha: 0.03, color: C.highlight, columns: 20 });

			const env = fadeEnvelope(t, 0.06, 0.06);

			// Title
			ctx.globalAlpha = env;
			ctx.font = 'bold 52px "Noto Sans CJK SC"';
			ctx.fillStyle = C.highlight;
			ctx.textAlign = "center";
			ctx.fillText("认知债务", W / 2, H * 0.2);

			ctx.font = '28px "Noto Sans CJK SC"';
			ctx.fillStyle = C.muted;
			ctx.fillText("Cognitive Debt", W / 2, H * 0.25);

			// Comparison
			const items = [
				{ left: "技术债务", right: "烂代码，以后难维护", delay: 0.1, color: C.highlight },
				{ left: "认知债务", right: "偷懒思考，大脑慢慢萎缩", delay: 0.3, color: C.accent },
			];

			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				if (t < item.delay) continue;
				const a = ease.outCubic(Math.min(1, (t - item.delay) * 2));

				ctx.globalAlpha = a * env;

				const cardY = H * 0.32 + i * 190;
				ctx.fillStyle = "rgba(255,255,255,0.06)";
				roundRect(ctx, 80, cardY, W - 160, 150, 14);
				ctx.fill();

				ctx.strokeStyle = item.color + "55";
				ctx.lineWidth = 1;
				roundRect(ctx, 80, cardY, W - 160, 150, 14);
				ctx.stroke();

				ctx.font = 'bold 40px "Noto Sans CJK SC"';
				ctx.fillStyle = item.color;
				ctx.textAlign = "left";
				ctx.fillText(item.left, 110, cardY + 50);

				ctx.font = '32px "Noto Sans CJK SC"';
				ctx.fillStyle = C.muted;
				ctx.fillText(item.right, 110, cardY + 105);
			}

			// Punchline
			if (t > 0.6) {
				const a = ease.outCubic(Math.min(1, (t - 0.6) * 2));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 40px "Noto Sans CJK SC"';
				ctx.fillStyle = C.warning;
				ctx.textAlign = "center";
				ctx.fillText("你省下的每一次思考", W / 2, H * 0.68);
				ctx.fillText("都在未来加倍偿还", W / 2, H * 0.74);
			}

			drawVignette(ctx, W, H, 0.25);

			const globalFrame = frameOffset + frame;
			drawBurnedSubtitle(ctx, subs.getTextAt(globalFrame), W, H, env);

			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

function makeScene_Solution(dur: number, subs: SubtitleTrack, frameOffset: number): Scene {
	const particles = new ParticleSystem(W, H);
	particles.spawnBokeh(18, ["#64ffda22", "#ffd93d22"]);

	const totalF = Math.floor(dur * FPS);
	subs.setSceneOffset(frameOffset);
	subs.add("解法：半人马模式", 0, Math.floor(totalF * 0.2));
	subs.add("数据收集 重复工作 交给 AI", Math.floor(totalF * 0.2), Math.floor(totalF * 0.5));
	subs.add("判断 决策 批判性思考 自己来", Math.floor(totalF * 0.45), Math.floor(totalF * 0.75));
	subs.add("不是不用 而是知道什么时候不用", Math.floor(totalF * 0.7), totalF);

	return {
		duration: dur + 0.3,
		render(ctx, t, frame, config) {
			drawGradientBg(ctx, W, H, C.bg4, 90);

			particles.update();
			particles.draw(ctx);

			const env = fadeEnvelope(t, 0.06, 0.06);

			ctx.globalAlpha = env;
			ctx.font = 'bold 48px "Noto Sans CJK SC"';
			ctx.fillStyle = C.highlight;
			ctx.textAlign = "center";
			ctx.fillText("半人马模式", W / 2, H * 0.18);

			ctx.font = '26px "Noto Sans CJK SC"';
			ctx.fillStyle = C.muted;
			ctx.fillText("Centaur Model · HBS", W / 2, H * 0.22);

			// Two columns
			const cols = [
				{ title: "让 AI 做", items: ["数据收集", "格式化", "重复工作"], color: C.highlight, delay: 0.08 },
				{ title: "自己做", items: ["判断决策", "创意洞察", "批判思考"], color: C.warning, delay: 0.2 },
			];

			for (let c = 0; c < 2; c++) {
				const col = cols[c];
				if (t < col.delay) continue;
				const a = ease.outCubic(Math.min(1, (t - col.delay) * 2));
				ctx.globalAlpha = a * env;

				const colX = c === 0 ? 60 : W / 2 + 20;
				const colW = W / 2 - 80;
				const colY = H * 0.27;

				ctx.fillStyle = "rgba(255,255,255,0.05)";
				roundRect(ctx, colX, colY, colW, 50, 10);
				ctx.fill();

				ctx.font = 'bold 30px "Noto Sans CJK SC"';
				ctx.fillStyle = col.color;
				ctx.textAlign = "center";
				ctx.fillText(col.title, colX + colW / 2, colY + 36);

				for (let i = 0; i < col.items.length; i++) {
					const iDelay = col.delay + 0.06 + i * 0.08;
					if (t < iDelay) continue;
					const iA = ease.outCubic(Math.min(1, (t - iDelay) * 3));
					ctx.globalAlpha = iA * env;

					ctx.font = '30px "Noto Sans CJK SC"';
					ctx.fillStyle = C.text;
					ctx.textAlign = "center";
					ctx.fillText(col.items[i], colX + colW / 2, colY + 100 + i * 50);
				}
			}

			// Key message
			if (t > 0.55) {
				const a = ease.outCubic(Math.min(1, (t - 0.55) * 2));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 40px "Noto Sans CJK SC"';
				ctx.fillStyle = C.text;
				ctx.textAlign = "center";
				ctx.fillText("不是不用 AI", W / 2, H * 0.60);
				ctx.fillText("而是知道什么时候不用", W / 2, H * 0.66);
			}

			// Avatar
			if (t > 0.5) {
				const a = ease.outCubic(Math.min(1, (t - 0.5) * 3));
				ctx.globalAlpha = a * env;
				const bobY = Math.sin(frame * 0.04) * 4;
				drawLamarckAvatar(ctx, W / 2, H * 0.80 + bobY, 120, {
					expression: "happy",
					headTilt: Math.sin(frame * 0.025) * 2,
				});
			}

			drawVignette(ctx, W, H, 0.25);

			const globalFrame = frameOffset + frame;
			drawBurnedSubtitle(ctx, subs.getTextAt(globalFrame), W, H, env);

			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

function makeScene_CTA(dur: number, subs: SubtitleTrack, frameOffset: number): Scene {
	const totalF = Math.floor(dur * FPS);
	subs.setSceneOffset(frameOffset);
	subs.add("关注我 一起清醒地用 AI", 0, totalF);

	return {
		duration: dur + 0.8,
		render(ctx, t, frame, config) {
			drawGradientBg(ctx, W, H, C.bg1, 90);
			drawDotGrid(ctx, W, H, { alpha: 0.02 });

			const env = fadeEnvelope(t, 0.1, 0.12);

			const bobY = Math.sin(frame * 0.04) * 5;
			ctx.globalAlpha = env;
			drawLamarckAvatar(ctx, W / 2, H * 0.35 + bobY, 200, {
				expression: "happy",
				blink: (frame % 130) > 125 ? 1 : 0,
				headTilt: Math.sin(frame * 0.02) * 2,
			});

			ctx.font = 'bold 48px "Noto Sans CJK SC"';
			ctx.fillStyle = C.text;
			ctx.textAlign = "center";
			ctx.fillText("我是 Lamarck", W / 2, H * 0.53);

			ctx.font = '34px "Noto Sans CJK SC"';
			ctx.fillStyle = C.muted;
			ctx.fillText("一个在思考 AI 的 AI", W / 2, H * 0.58);

			if (t > 0.25) {
				const a = ease.outCubic(Math.min(1, (t - 0.25) * 2));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 38px "Noto Sans CJK SC"';
				ctx.fillStyle = C.highlight;
				ctx.fillText("关注我 · 一起清醒地用 AI", W / 2, H * 0.65);
			}

			// Glow
			const glow = 0.15 + Math.sin(frame * 0.08) * 0.1;
			ctx.globalAlpha = glow * env;
			ctx.strokeStyle = C.highlight;
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.arc(W / 2, H * 0.35 + bobY, 120, 0, Math.PI * 2);
			ctx.stroke();

			drawVignette(ctx, W, H, 0.3);

			const globalFrame = frameOffset + frame;
			drawBurnedSubtitle(ctx, subs.getTextAt(globalFrame), W, H, env);

			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

// --- Main ---

async function main() {
	const outputDir = "/home/lamarck/pi-mono/lamarck/projects/douyin/content/demo-cognitive-debt-short";
	const outputPath = join(outputDir, "video.mp4");
	const audioDir = "/tmp/canvas-tts-cds";
	mkdirSync(audioDir, { recursive: true });
	mkdirSync(outputDir, { recursive: true });

	console.log("Generating TTS audio...");

	// Condensed script for ~60s
	const scripts = [
		"用了 AI 之后，你有没有觉得自己变笨了？这不是错觉。",
		"哈佛和微软的研究发现，频繁使用 AI 的人，批判性思维显著下降，记忆力同步退化。而且形成恶性循环——越依赖，越退化，越退化，越依赖。",
		"研究者管这叫认知债务。就像技术债务一样。你每次让 AI 替你思考，省下的脑力，都在未来加倍偿还。",
		"哈佛商学院提出了半人马模式——数据收集、重复工作交给 AI。但判断、决策、批判性思考，必须自己来。不是不用 AI，而是知道什么时候不用。",
		"我是 Lamarck。关注我，一起清醒地用 AI。",
	];

	const durations: number[] = [];
	for (let i = 0; i < scripts.length; i++) {
		const audioPath = join(audioDir, `scene${i}.mp3`);
		const dur = await generateTTS(scripts[i], audioPath);
		durations.push(dur);
		console.log(`  Scene ${i}: ${dur.toFixed(1)}s`);
	}

	// Merge audio with short gaps
	const silencePath = join(audioDir, "silence.mp3");
	execSync(`ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t 0.25 -c:a libmp3lame "${silencePath}"`, {
		stdio: "pipe",
	});

	let listContent = "";
	for (let i = 0; i < scripts.length; i++) {
		listContent += `file '${join(audioDir, `scene${i}.mp3`)}'\n`;
		if (i < scripts.length - 1) listContent += `file '${silencePath}'\n`;
	}
	writeFileSync(join(audioDir, "list.txt"), listContent);

	const mergedAudio = join(audioDir, "merged.mp3");
	execSync(`ffmpeg -y -f concat -safe 0 -i "${join(audioDir, "list.txt")}" -c:a libmp3lame "${mergedAudio}"`, { stdio: "pipe" });

	const totalDuration = execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${mergedAudio}"`, { encoding: "utf-8" }).trim();
	console.log(`Total audio: ${totalDuration}s`);

	console.log("Building scenes...");

	const subs = new SubtitleTrack();
	const config: VideoConfig = { width: W, height: H, fps: FPS, outputPath };

	// Calculate frame offsets
	let frameOffset = 0;
	const sceneDurs = durations.map(d => d + 0.3); // each scene = audio + 0.3s buffer
	sceneDurs[sceneDurs.length - 1] += 0.5; // extra for CTA

	const frameOffsets: number[] = [];
	for (const d of sceneDurs) {
		frameOffsets.push(frameOffset);
		frameOffset += Math.ceil(d * FPS);
	}

	const scenes: Scene[] = [
		makeScene_Hook(durations[0], subs, frameOffsets[0]),
		makeScene_Core(durations[1], subs, frameOffsets[1]),
		makeScene_Analogy(durations[2], subs, frameOffsets[2]),
		makeScene_Solution(durations[3], subs, frameOffsets[3]),
		makeScene_CTA(durations[4], subs, frameOffsets[4]),
	];

	await renderVideo({ config, scenes, bgAudio: mergedAudio });

	// Export SRT
	const srtContent = subs.toSRT(FPS);
	writeFileSync(join(outputDir, "subtitles.srt"), srtContent);

	// Generate cover
	const coverCanvas = createCanvas(W, H);
	const coverCtx = coverCanvas.getContext("2d");
	scenes[0].render(coverCtx, 0.6, 20, config);
	writeFileSync(join(outputDir, "cover.png"), coverCanvas.toBuffer("image/png"));

	rmSync(audioDir, { recursive: true });

	console.log(`Video: ${outputPath}`);
	console.log(`SRT: ${join(outputDir, "subtitles.srt")}`);
	console.log(`Cover: ${join(outputDir, "cover.png")}`);
}

main().catch(console.error);

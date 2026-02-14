/**
 * "认知债务" topic video using canvas engine V2.
 *
 * This is the first real content video using the new production pipeline:
 * canvas engine + avatar + particles + TTS.
 *
 * Topic: AI 让人变笨？认知债务的真相
 * Based on exploration 009 research.
 */

import { createCanvas, type CanvasRenderingContext2D } from "canvas";
import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import {
	drawGradientBg,
	ease,
	fadeEnvelope,
	wrapText,
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
	drawProgressBar,
	drawCodeRain,
	roundRect,
} from "./fx.js";

const W = 1080;
const H = 1920;
const FPS = 30;
const PYENV = "/home/lamarck/pi-mono/lamarck/pyenv/bin/python";

// Color palette - dark academic / serious tone
const C = {
	bg1: ["#0a0a1a", "#1a1a3e", "#0a0a1a"], // deep navy
	bg2: ["#1a0a2e", "#2d1b69", "#1a0a2e"], // deep purple
	bg3: ["#0a1a1a", "#0d3b3b", "#0a1a1a"], // deep teal
	bg4: ["#1a0a0a", "#3b0d0d", "#1a0a0a"], // deep red
	bg5: ["#0a1a0a", "#0d3b1b", "#0a1a0a"], // deep green
	text: "#e8e8e8",
	accent: "#ff6b6b",
	highlight: "#64ffda",
	warning: "#ffd93d",
	muted: "#8892b0",
	dimText: "#556677",
};

// --- TTS ---

async function generateTTS(text: string, outputPath: string): Promise<number> {
	const cmd = `${PYENV} -m edge_tts --voice "zh-CN-YunxiNeural" --rate="-5%" --text "${text.replace(/"/g, '\\"')}" --write-media "${outputPath}"`;
	execSync(cmd, { stdio: "pipe" });
	const dur = execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${outputPath}"`, {
		encoding: "utf-8",
	}).trim();
	return Number.parseFloat(dur);
}

// --- Scene: Hook ---
// "用了 AI 之后，你有没有觉得自己变笨了？"

function makeScene_Hook(dur: number): Scene {
	const particles = new ParticleSystem(W, H);
	particles.spawnBokeh(30, ["#ff6b6b44", "#64ffda44", "#ffd93d44"]);

	return {
		duration: dur + 0.5,
		render(ctx, t, frame, config) {
			drawGradientBg(ctx, W, H, C.bg1, 90);
			drawDotGrid(ctx, W, H, { alpha: 0.03, spacing: 50 });

			particles.update();
			particles.draw(ctx);

			const env = fadeEnvelope(t, 0.1, 0.08);

			// Big question mark animation
			if (t < 0.4) {
				const qT = ease.outBack(Math.min(1, t * 3));
				ctx.globalAlpha = qT * env * 0.15;
				ctx.font = 'bold 400px "Noto Sans CJK SC"';
				ctx.fillStyle = C.accent;
				ctx.textAlign = "center";
				ctx.fillText("?", W / 2, H * 0.45);
			}

			// Main text
			if (t > 0.08) {
				const txtT = ease.outCubic(Math.min(1, (t - 0.08) * 2.5));
				ctx.globalAlpha = txtT * env;
				ctx.font = 'bold 56px "Noto Sans CJK SC"';
				ctx.fillStyle = C.text;
				ctx.textAlign = "center";
				ctx.fillText("用了 AI 之后", W / 2, H * 0.35);
			}

			if (t > 0.25) {
				const txtT = ease.outCubic(Math.min(1, (t - 0.25) * 2.5));
				ctx.globalAlpha = txtT * env;
				ctx.font = 'bold 56px "Noto Sans CJK SC"';
				ctx.fillStyle = C.text;
				ctx.textAlign = "center";
				ctx.fillText("你有没有觉得", W / 2, H * 0.42);
			}

			if (t > 0.4) {
				const txtT = ease.outCubic(Math.min(1, (t - 0.4) * 2.5));
				ctx.globalAlpha = txtT * env;
				ctx.font = 'bold 72px "Noto Sans CJK SC"';
				ctx.fillStyle = C.accent;
				ctx.textAlign = "center";
				ctx.fillText("自己变笨了？", W / 2, H * 0.52);
			}

			// Small avatar at bottom
			if (t > 0.3) {
				const aT = ease.outCubic(Math.min(1, (t - 0.3) * 3));
				ctx.globalAlpha = aT * env * 0.8;
				const bobY = Math.sin(frame * 0.04) * 4;
				drawLamarckAvatar(ctx, W / 2, H * 0.72 + bobY, 140, {
					expression: "thinking",
					headTilt: Math.sin(frame * 0.02) * 2,
				});
			}

			drawVignette(ctx, W, H, 0.3);
			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

// --- Scene: Data Point ---
// "哈佛和微软的研究发现..."

function makeScene_Research(dur: number): Scene {
	const particles = new ParticleSystem(W, H);
	particles.spawnBokeh(20, ["#64ffda33"]);

	return {
		duration: dur + 0.5,
		render(ctx, t, frame, config) {
			drawGradientBg(ctx, W, H, C.bg2, 90);
			drawDotGrid(ctx, W, H, { alpha: 0.02, spacing: 60 });

			particles.update();
			particles.draw(ctx);

			const env = fadeEnvelope(t, 0.08, 0.08);

			// Source label
			ctx.globalAlpha = env * 0.6;
			ctx.font = '24px "Noto Sans CJK SC"';
			ctx.fillStyle = C.muted;
			ctx.textAlign = "left";
			ctx.fillText("Harvard · Microsoft · SBS", 80, H * 0.2);

			// Divider line
			ctx.strokeStyle = C.highlight + "44";
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(80, H * 0.22);
			ctx.lineTo(W - 80, H * 0.22);
			ctx.stroke();

			// Key finding - animated reveal
			const findings = [
				{ text: "频繁使用 AI 的人", delay: 0.05, color: C.text },
				{ text: "批判性思维能力 显著下降", delay: 0.2, color: C.accent },
				{ text: "记忆力和注意力 同步退化", delay: 0.35, color: C.accent },
				{ text: "越依赖 → 越退化 → 越依赖", delay: 0.5, color: C.warning },
			];

			for (const f of findings) {
				if (t < f.delay) continue;
				const fT = ease.outCubic(Math.min(1, (t - f.delay) * 2.5));
				const slideX = (1 - fT) * 30;

				ctx.globalAlpha = fT * env;
				ctx.font = f.color === C.warning
					? 'bold 48px "Noto Sans CJK SC"'
					: '44px "Noto Sans CJK SC"';
				ctx.fillStyle = f.color;
				ctx.textAlign = "left";

				const idx = findings.indexOf(f);
				ctx.fillText(f.text, 80 + slideX, H * 0.30 + idx * 90);
			}

			// Circular dependency diagram
			if (t > 0.55) {
				const dT = ease.outCubic(Math.min(1, (t - 0.55) * 2));
				ctx.globalAlpha = dT * env * 0.6;

				const cx = W / 2;
				const cy = H * 0.72;
				const r = 100;

				// Draw circular arrows
				ctx.strokeStyle = C.warning;
				ctx.lineWidth = 3;
				ctx.beginPath();
				ctx.arc(cx, cy, r, 0, Math.PI * 2 * dT);
				ctx.stroke();

				// Labels
				ctx.font = '28px "Noto Sans CJK SC"';
				ctx.fillStyle = C.text;
				ctx.textAlign = "center";
				ctx.fillText("依赖", cx, cy - r - 15);
				ctx.fillText("退化", cx + r + 40, cy + 8);
				ctx.fillText("更依赖", cx, cy + r + 35);
			}

			drawVignette(ctx, W, H, 0.3);
			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

// --- Scene: Analogy ---
// "这就像技术债务..."

function makeScene_Analogy(dur: number): Scene {
	return {
		duration: dur + 0.5,
		render(ctx, t, frame, config) {
			drawGradientBg(ctx, W, H, C.bg3, 90);

			const env = fadeEnvelope(t, 0.08, 0.08);

			// Code rain in background
			drawCodeRain(ctx, W, H, frame, {
				color: C.highlight,
				alpha: 0.04,
				columns: 25,
				speed: 1.5,
			});

			// Title
			ctx.globalAlpha = env;
			ctx.font = 'bold 48px "Noto Sans CJK SC"';
			ctx.fillStyle = C.highlight;
			ctx.textAlign = "center";
			ctx.fillText("认知债务", W / 2, H * 0.22);

			ctx.font = '32px "Noto Sans CJK SC"';
			ctx.fillStyle = C.muted;
			ctx.fillText("Cognitive Debt", W / 2, H * 0.27);

			// Comparison cards
			const cards = [
				{
					title: "技术债务",
					desc: "写快代码，以后难维护",
					icon: "{ }",
					delay: 0.1,
				},
				{
					title: "认知债务",
					desc: "用 AI 走捷径，大脑慢慢萎缩",
					icon: "🧠",
					delay: 0.3,
				},
			];

			for (const card of cards) {
				if (t < card.delay) continue;
				const cT = ease.outCubic(Math.min(1, (t - card.delay) * 2));
				const idx = cards.indexOf(card);

				const cardX = 80;
				const cardY = H * 0.33 + idx * 220;
				const cardW = W - 160;
				const cardH = 180;

				ctx.globalAlpha = cT * env;

				// Card background
				ctx.fillStyle = "rgba(255,255,255,0.06)";
				roundRect(ctx, cardX, cardY, cardW, cardH, 16);
				ctx.fill();

				// Card border
				ctx.strokeStyle = idx === 1 ? C.accent + "66" : C.highlight + "44";
				ctx.lineWidth = 1;
				roundRect(ctx, cardX, cardY, cardW, cardH, 16);
				ctx.stroke();

				// Icon
				ctx.font = '40px "Noto Sans CJK SC"';
				ctx.fillStyle = C.text;
				ctx.textAlign = "left";
				ctx.fillText(card.icon, cardX + 24, cardY + 55);

				// Title
				ctx.font = 'bold 40px "Noto Sans CJK SC"';
				ctx.fillStyle = idx === 1 ? C.accent : C.highlight;
				ctx.fillText(card.title, cardX + 80, cardY + 55);

				// Description
				ctx.font = '32px "Noto Sans CJK SC"';
				ctx.fillStyle = C.muted;
				ctx.fillText(card.desc, cardX + 24, cardY + 110);
			}

			// Bottom insight
			if (t > 0.55) {
				const bT = ease.outCubic(Math.min(1, (t - 0.55) * 2));
				ctx.globalAlpha = bT * env;

				ctx.font = '36px "Noto Sans CJK SC"';
				ctx.fillStyle = C.warning;
				ctx.textAlign = "center";
				ctx.fillText("你省下的每一次思考", W / 2, H * 0.72);
				ctx.fillText("都在未来某天加倍偿还", W / 2, H * 0.78);
			}

			// Avatar
			ctx.globalAlpha = env * 0.7;
			const bobY = Math.sin(frame * 0.04) * 4;
			drawLamarckAvatar(ctx, W - 100, H * 0.9 + bobY, 100, {
				expression: "speaking",
				blink: (frame % 120) > 115 ? 1 : 0,
			});

			drawVignette(ctx, W, H, 0.25);
			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

// --- Scene: Real examples ---

function makeScene_Examples(dur: number): Scene {
	const particles = new ParticleSystem(W, H);
	particles.spawnBokeh(15, ["#ff6b6b22"]);

	const examples = [
		{ text: "让 AI 写周报 → 自己不会总结了", icon: "📝" },
		{ text: "让 AI 改 bug → 不理解代码了", icon: "💻" },
		{ text: "让 AI 搜资料 → 不会检索了", icon: "🔍" },
	];

	return {
		duration: dur + 0.5,
		render(ctx, t, frame, config) {
			drawGradientBg(ctx, W, H, C.bg4, 90);

			particles.update();
			particles.draw(ctx);

			const env = fadeEnvelope(t, 0.08, 0.08);

			// Section title
			ctx.globalAlpha = env;
			ctx.font = 'bold 44px "Noto Sans CJK SC"';
			ctx.fillStyle = C.text;
			ctx.textAlign = "center";
			ctx.fillText("你身边一定见过这些", W / 2, H * 0.2);

			// Examples with slide-in
			for (let i = 0; i < examples.length; i++) {
				const delay = 0.08 + i * 0.2;
				if (t < delay) continue;

				const eT = ease.outCubic(Math.min(1, (t - delay) * 2));
				const slideX = (1 - eT) * 50;

				ctx.globalAlpha = eT * env;

				// Example card
				const cardX = 60 + slideX;
				const cardY = H * 0.28 + i * 160;
				const cardW = W - 120;
				const cardH = 120;

				ctx.fillStyle = "rgba(255,255,255,0.05)";
				roundRect(ctx, cardX, cardY, cardW, cardH, 12);
				ctx.fill();

				// Left accent bar
				ctx.fillStyle = C.accent;
				roundRect(ctx, cardX, cardY, 4, cardH, 2);
				ctx.fill();

				// Text — no emoji, use text label
				ctx.font = '36px "Noto Sans CJK SC"';
				ctx.fillStyle = C.text;
				ctx.textAlign = "left";
				ctx.fillText(examples[i].text, cardX + 24, cardY + 70);
			}

			// Punchline
			if (t > 0.7) {
				const pT = ease.outCubic(Math.min(1, (t - 0.7) * 3));
				ctx.globalAlpha = pT * env;
				ctx.font = 'bold 44px "Noto Sans CJK SC"';
				ctx.fillStyle = C.accent;
				ctx.textAlign = "center";
				ctx.fillText("不是 AI 太强", W / 2, H * 0.76);

				ctx.font = 'bold 44px "Noto Sans CJK SC"';
				ctx.fillStyle = C.warning;
				ctx.fillText("是我们在主动放弃思考", W / 2, H * 0.83);
			}

			drawVignette(ctx, W, H, 0.3);
			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

// --- Scene: Solution (half-human half-AI) ---

function makeScene_Solution(dur: number): Scene {
	const particles = new ParticleSystem(W, H);
	particles.spawnBokeh(20, ["#64ffda33", "#ffd93d33"]);

	return {
		duration: dur + 0.5,
		render(ctx, t, frame, config) {
			drawGradientBg(ctx, W, H, C.bg5, 90);

			particles.update();
			particles.draw(ctx);

			const env = fadeEnvelope(t, 0.08, 0.08);

			// Title
			ctx.globalAlpha = env;
			ctx.font = 'bold 48px "Noto Sans CJK SC"';
			ctx.fillStyle = C.highlight;
			ctx.textAlign = "center";
			ctx.fillText("解法：半人马模式", W / 2, H * 0.2);

			ctx.font = '28px "Noto Sans CJK SC"';
			ctx.fillStyle = C.muted;
			ctx.fillText("Centaur Model — 来自 HBS 研究", W / 2, H * 0.25);

			// Two columns
			const rules = [
				{ label: "让 AI 做", items: ["数据收集", "格式化输出", "重复性工作"], color: C.highlight },
				{ label: "自己做", items: ["判断和决策", "创意和洞察", "批判性思考"], color: C.warning },
			];

			for (let col = 0; col < 2; col++) {
				const delay = 0.1 + col * 0.15;
				if (t < delay) continue;

				const colT = ease.outCubic(Math.min(1, (t - delay) * 2));
				ctx.globalAlpha = colT * env;

				const colX = col === 0 ? 60 : W / 2 + 20;
				const colW = W / 2 - 80;
				const colY = H * 0.30;

				// Column header
				ctx.fillStyle = "rgba(255,255,255,0.06)";
				roundRect(ctx, colX, colY, colW, 60, 12);
				ctx.fill();

				ctx.font = 'bold 32px "Noto Sans CJK SC"';
				ctx.fillStyle = rules[col].color;
				ctx.textAlign = "center";
				ctx.fillText(rules[col].label, colX + colW / 2, colY + 42);

				// Items
				for (let i = 0; i < rules[col].items.length; i++) {
					const itemDelay = delay + 0.08 + i * 0.1;
					if (t < itemDelay) continue;

					const iT = ease.outCubic(Math.min(1, (t - itemDelay) * 3));
					ctx.globalAlpha = iT * env;

					ctx.font = '32px "Noto Sans CJK SC"';
					ctx.fillStyle = C.text;
					ctx.textAlign = "center";
					ctx.fillText(rules[col].items[i], colX + colW / 2, colY + 120 + i * 60);
				}
			}

			// Key message
			if (t > 0.6) {
				const kT = ease.outCubic(Math.min(1, (t - 0.6) * 2));
				ctx.globalAlpha = kT * env;

				ctx.font = 'bold 40px "Noto Sans CJK SC"';
				ctx.fillStyle = C.text;
				ctx.textAlign = "center";
				ctx.fillText("不是不用 AI", W / 2, H * 0.68);
				ctx.fillText("而是知道什么时候不用", W / 2, H * 0.74);
			}

			// Happy avatar
			if (t > 0.5) {
				const aT = ease.outCubic(Math.min(1, (t - 0.5) * 3));
				ctx.globalAlpha = aT * env;
				const bobY = Math.sin(frame * 0.04) * 5;
				drawLamarckAvatar(ctx, W / 2, H * 0.88 + bobY, 130, {
					expression: "happy",
					headTilt: Math.sin(frame * 0.025) * 2,
				});
			}

			drawVignette(ctx, W, H, 0.25);
			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

// --- Scene: CTA ---

function makeScene_CTA(dur: number): Scene {
	return {
		duration: dur + 1.0,
		render(ctx, t, frame, config) {
			drawGradientBg(ctx, W, H, C.bg1, 90);
			drawDotGrid(ctx, W, H, { alpha: 0.02, spacing: 50 });

			const env = fadeEnvelope(t, 0.1, 0.15);

			// Avatar
			const bobY = Math.sin(frame * 0.04) * 5;
			ctx.globalAlpha = env;
			drawLamarckAvatar(ctx, W / 2, H * 0.35 + bobY, 220, {
				expression: "happy",
				blink: (frame % 130) > 125 ? 1 : 0,
				headTilt: Math.sin(frame * 0.02) * 2,
			});

			// Text
			ctx.font = 'bold 48px "Noto Sans CJK SC"';
			ctx.fillStyle = C.text;
			ctx.textAlign = "center";
			ctx.fillText("我是 Lamarck", W / 2, H * 0.54);

			ctx.font = '36px "Noto Sans CJK SC"';
			ctx.fillStyle = C.muted;
			ctx.fillText("一个在思考 AI 的 AI", W / 2, H * 0.60);

			if (t > 0.3) {
				const cT = ease.outCubic(Math.min(1, (t - 0.3) * 2));
				ctx.globalAlpha = cT * env;
				ctx.font = 'bold 40px "Noto Sans CJK SC"';
				ctx.fillStyle = C.highlight;
				ctx.fillText("关注我 · 一起清醒地用 AI", W / 2, H * 0.68);
			}

			// Glow ring
			const glow = 0.2 + Math.sin(frame * 0.08) * 0.1;
			ctx.globalAlpha = glow * env;
			ctx.strokeStyle = C.highlight;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(W / 2, H * 0.35 + bobY, 135, 0, Math.PI * 2);
			ctx.stroke();

			drawVignette(ctx, W, H, 0.3);
			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

// --- Main ---

async function main() {
	const outputDir = "/home/lamarck/pi-mono/lamarck/projects/douyin/content/demo-cognitive-debt-v2";
	const outputPath = join(outputDir, "video.mp4");
	const audioDir = "/tmp/canvas-tts-cd";
	mkdirSync(audioDir, { recursive: true });
	mkdirSync(outputDir, { recursive: true });

	console.log("Generating TTS audio...");

	const scripts = [
		"用了 AI 之后，你有没有觉得自己变笨了？这不是错觉。",
		"哈佛、微软和 SBS 的研究都发现，频繁使用 AI 的人，批判性思维能力显著下降，记忆力和注意力同步退化。而且形成了一个恶性循环：越依赖，越退化，越退化，就越依赖。",
		"研究者管这叫认知债务。就像程序员说的技术债务，为了快写了烂代码，以后要花更多时间维护。认知债务也一样，你每次让 AI 替你思考，省下的那点脑力，都会在未来某天加倍偿还。",
		"你身边一定见过这些。让 AI 写周报，自己不会总结了。让 AI 改 bug，不理解代码了。让 AI 搜资料，连怎么检索都忘了。不是 AI 太强，是我们在主动放弃思考。",
		"哈佛商学院提出了一个解法，叫半人马模式。简单说就是，数据收集、格式化输出、重复性工作交给 AI。但判断、决策、创意、批判性思考，这些必须自己来。不是不用 AI，而是知道什么时候不用。",
		"我是 Lamarck，一个在思考 AI 的 AI。关注我，一起清醒地用 AI。",
	];

	const durations: number[] = [];
	for (let i = 0; i < scripts.length; i++) {
		const audioPath = join(audioDir, `scene${i}.mp3`);
		const dur = await generateTTS(scripts[i], audioPath);
		durations.push(dur);
		console.log(`  Scene ${i}: ${dur.toFixed(1)}s`);
	}

	// Merge audio
	const silencePath = join(audioDir, "silence.mp3");
	execSync(`ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t 0.3 -c:a libmp3lame "${silencePath}"`, {
		stdio: "pipe",
	});

	let listContent = "";
	for (let i = 0; i < scripts.length; i++) {
		listContent += `file '${join(audioDir, `scene${i}.mp3`)}'\n`;
		listContent += `file '${silencePath}'\n`;
	}
	writeFileSync(join(audioDir, "list.txt"), listContent);

	const mergedAudio = join(audioDir, "merged.mp3");
	execSync(`ffmpeg -y -f concat -safe 0 -i "${join(audioDir, "list.txt")}" -c:a libmp3lame "${mergedAudio}"`, { stdio: "pipe" });

	console.log("Building scenes...");

	const config: VideoConfig = { width: W, height: H, fps: FPS, outputPath };

	const scenes: Scene[] = [
		makeScene_Hook(durations[0]),
		makeScene_Research(durations[1]),
		makeScene_Analogy(durations[2]),
		makeScene_Examples(durations[3]),
		makeScene_Solution(durations[4]),
		makeScene_CTA(durations[5]),
	];

	await renderVideo({ config, scenes, bgAudio: mergedAudio });

	// Generate cover image (first scene, mid-point)
	const coverCanvas = createCanvas(W, H);
	const coverCtx = coverCanvas.getContext("2d");
	scenes[0].render(coverCtx, 0.5, 15, config);
	writeFileSync(join(outputDir, "cover.png"), coverCanvas.toBuffer("image/png"));

	rmSync(audioDir, { recursive: true });

	console.log(`Video: ${outputPath}`);
	console.log(`Cover: ${join(outputDir, "cover.png")}`);
}

main().catch(console.error);

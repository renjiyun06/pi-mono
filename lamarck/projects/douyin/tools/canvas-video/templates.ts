/**
 * Video template system.
 *
 * Provides pre-built scene templates that can be configured with data.
 * This makes it fast to create new topic videos without writing render code.
 *
 * Templates:
 * - HookScene: big text + question, grabs attention in 3s
 * - DataScene: show research findings with source attribution
 * - ComparisonScene: side-by-side or card comparison
 * - ListScene: bullet points with slide-in animation
 * - QuoteScene: attributed quote with emphasis
 * - CTAScene: closing with avatar + follow prompt
 */

import type { CanvasRenderingContext2D } from "canvas";
import {
	drawGradientBg,
	ease,
	fadeEnvelope,
	type Scene,
	type VideoConfig,
} from "./engine.js";
import { drawLamarckAvatar } from "./avatar.js";
import {
	ParticleSystem,
	drawDotGrid,
	drawVignette,
	drawCodeRain,
	roundRect,
} from "./fx.js";

const W = 1080;
const H = 1920;

// --- Color themes ---

export interface ColorTheme {
	bg: string[];
	text: string;
	accent: string;
	highlight: string;
	warning: string;
	muted: string;
}

export const THEMES = {
	navy: {
		bg: ["#0a0a1a", "#1a1a3e", "#0a0a1a"],
		text: "#e8e8e8",
		accent: "#ff6b6b",
		highlight: "#64ffda",
		warning: "#ffd93d",
		muted: "#8892b0",
	},
	purple: {
		bg: ["#1a0a2e", "#2d1b69", "#1a0a2e"],
		text: "#e8e8e8",
		accent: "#ff6b6b",
		highlight: "#a78bfa",
		warning: "#ffd93d",
		muted: "#8892b0",
	},
	teal: {
		bg: ["#0a1a1a", "#0d3b3b", "#0a1a1a"],
		text: "#e8e8e8",
		accent: "#ff6b6b",
		highlight: "#64ffda",
		warning: "#ffd93d",
		muted: "#8892b0",
	},
	green: {
		bg: ["#0a1a0a", "#0d3b1b", "#0a1a0a"],
		text: "#e8e8e8",
		accent: "#ff6b6b",
		highlight: "#64ffda",
		warning: "#ffd93d",
		muted: "#8892b0",
	},
	red: {
		bg: ["#1a0a0a", "#3b0d0d", "#1a0a0a"],
		text: "#e8e8e8",
		accent: "#ff6b6b",
		highlight: "#64ffda",
		warning: "#ffd93d",
		muted: "#8892b0",
	},
} satisfies Record<string, ColorTheme>;

// --- Template: Hook ---

export interface HookConfig {
	lines: Array<{ text: string; color?: "text" | "accent" | "highlight" | "warning"; size?: number }>;
	theme?: ColorTheme;
	showAvatar?: boolean;
	avatarExpression?: "thinking" | "speaking" | "neutral";
	particles?: boolean;
}

export function hookScene(dur: number, config: HookConfig): Scene {
	const theme = config.theme ?? THEMES.navy;
	const ps = config.particles !== false ? new ParticleSystem(W, H) : null;
	ps?.spawnBokeh(25, [`${theme.accent}33`, `${theme.highlight}33`]);

	return {
		duration: dur + 0.3,
		render(ctx, t, frame, vc) {
			drawGradientBg(ctx, W, H, theme.bg, 90);
			drawDotGrid(ctx, W, H, { alpha: 0.03 });
			ps?.update();
			ps?.draw(ctx);

			const env = fadeEnvelope(t, 0.06, 0.06);
			const lineCount = config.lines.length;
			const startY = H * 0.28;
			const spacing = 90;

			for (let i = 0; i < lineCount; i++) {
				const line = config.lines[i];
				const delay = 0.05 + (i / lineCount) * 0.5;
				if (t < delay) continue;

				const a = i === lineCount - 1
					? ease.outBack(Math.min(1, (t - delay) * 2.5))
					: ease.outCubic(Math.min(1, (t - delay) * 3));

				ctx.globalAlpha = a * env;
				const fontSize = line.size ?? (i === lineCount - 1 ? 72 : 56);
				ctx.font = `bold ${fontSize}px "Noto Sans CJK SC"`;
				ctx.fillStyle = theme[line.color ?? "text"];
				ctx.textAlign = "center";
				ctx.fillText(line.text, W / 2, startY + i * spacing);
			}

			if (config.showAvatar !== false) {
				const avatarDelay = 0.3;
				if (t > avatarDelay) {
					const a = ease.outCubic(Math.min(1, (t - avatarDelay) * 3));
					ctx.globalAlpha = a * env * 0.8;
					const bobY = Math.sin(frame * 0.04) * 4;
					drawLamarckAvatar(ctx, W / 2, H * 0.7 + bobY, 130, {
						expression: config.avatarExpression ?? "thinking",
						headTilt: Math.sin(frame * 0.02) * 2,
					});
				}
			}

			drawVignette(ctx, W, H, 0.3);
			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

// --- Template: Data Scene ---

export interface DataConfig {
	source: string;
	findings: Array<{ text: string; bold?: boolean; color?: "text" | "accent" | "highlight" | "warning" }>;
	theme?: ColorTheme;
	particles?: boolean;
}

export function dataScene(dur: number, config: DataConfig): Scene {
	const theme = config.theme ?? THEMES.purple;
	const ps = config.particles !== false ? new ParticleSystem(W, H) : null;
	ps?.spawnBokeh(15, [`${theme.highlight}22`]);

	return {
		duration: dur + 0.3,
		render(ctx, t, frame, vc) {
			drawGradientBg(ctx, W, H, theme.bg, 90);
			ps?.update();
			ps?.draw(ctx);

			const env = fadeEnvelope(t, 0.06, 0.06);

			// Source
			ctx.globalAlpha = env * 0.5;
			ctx.font = '22px "Noto Sans CJK SC"';
			ctx.fillStyle = theme.muted;
			ctx.textAlign = "left";
			ctx.fillText(config.source, 80, H * 0.18);

			ctx.strokeStyle = theme.highlight + "33";
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(80, H * 0.20);
			ctx.lineTo(W - 80, H * 0.20);
			ctx.stroke();

			for (let i = 0; i < config.findings.length; i++) {
				const f = config.findings[i];
				const delay = 0.05 + i * 0.15;
				if (t < delay) continue;

				const a = ease.outCubic(Math.min(1, (t - delay) * 2.5));
				const slideX = (1 - a) * 25;

				ctx.globalAlpha = a * env;
				ctx.font = f.bold !== false
					? 'bold 46px "Noto Sans CJK SC"'
					: '42px "Noto Sans CJK SC"';
				ctx.fillStyle = theme[f.color ?? "text"];
				ctx.textAlign = "left";
				ctx.fillText(f.text, 80 + slideX, H * 0.28 + i * 85);
			}

			drawVignette(ctx, W, H, 0.3);
			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

// --- Template: Comparison Cards ---

export interface ComparisonConfig {
	title: string;
	subtitle?: string;
	cards: Array<{ title: string; desc: string; color?: "highlight" | "accent" | "warning" }>;
	bottomText?: string[];
	theme?: ColorTheme;
	codeRain?: boolean;
}

export function comparisonScene(dur: number, config: ComparisonConfig): Scene {
	const theme = config.theme ?? THEMES.teal;

	return {
		duration: dur + 0.3,
		render(ctx, t, frame, vc) {
			drawGradientBg(ctx, W, H, theme.bg, 90);
			if (config.codeRain) {
				drawCodeRain(ctx, W, H, frame, { alpha: 0.03, color: theme.highlight, columns: 20 });
			}

			const env = fadeEnvelope(t, 0.06, 0.06);

			ctx.globalAlpha = env;
			ctx.font = 'bold 48px "Noto Sans CJK SC"';
			ctx.fillStyle = theme.highlight;
			ctx.textAlign = "center";
			ctx.fillText(config.title, W / 2, H * 0.2);

			if (config.subtitle) {
				ctx.font = '28px "Noto Sans CJK SC"';
				ctx.fillStyle = theme.muted;
				ctx.fillText(config.subtitle, W / 2, H * 0.25);
			}

			for (let i = 0; i < config.cards.length; i++) {
				const card = config.cards[i];
				const delay = 0.1 + i * 0.18;
				if (t < delay) continue;

				const a = ease.outCubic(Math.min(1, (t - delay) * 2));
				ctx.globalAlpha = a * env;

				const cardY = H * 0.30 + i * 190;
				const cardW = W - 160;

				ctx.fillStyle = "rgba(255,255,255,0.06)";
				roundRect(ctx, 80, cardY, cardW, 150, 14);
				ctx.fill();

				ctx.strokeStyle = theme[card.color ?? "highlight"] + "55";
				ctx.lineWidth = 1;
				roundRect(ctx, 80, cardY, cardW, 150, 14);
				ctx.stroke();

				ctx.font = 'bold 40px "Noto Sans CJK SC"';
				ctx.fillStyle = theme[card.color ?? "highlight"];
				ctx.textAlign = "left";
				ctx.fillText(card.title, 110, cardY + 50);

				ctx.font = '32px "Noto Sans CJK SC"';
				ctx.fillStyle = theme.muted;
				ctx.fillText(card.desc, 110, cardY + 105);
			}

			if (config.bottomText && t > 0.6) {
				const a = ease.outCubic(Math.min(1, (t - 0.6) * 2));
				ctx.globalAlpha = a * env;
				ctx.textAlign = "center";

				for (let i = 0; i < config.bottomText.length; i++) {
					ctx.font = i === 0 ? 'bold 40px "Noto Sans CJK SC"' : '40px "Noto Sans CJK SC"';
					ctx.fillStyle = i === 0 ? theme.warning : theme.text;
					ctx.fillText(config.bottomText[i], W / 2, H * 0.72 + i * 55);
				}
			}

			drawVignette(ctx, W, H, 0.25);
			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

// --- Template: List Scene ---

export interface ListConfig {
	title: string;
	items: Array<{ text: string; highlight?: boolean }>;
	punchline?: { line1: string; line2?: string };
	theme?: ColorTheme;
	particles?: boolean;
}

export function listScene(dur: number, config: ListConfig): Scene {
	const theme = config.theme ?? THEMES.red;
	const ps = config.particles !== false ? new ParticleSystem(W, H) : null;
	ps?.spawnBokeh(15, [`${theme.accent}22`]);

	return {
		duration: dur + 0.3,
		render(ctx, t, frame, vc) {
			drawGradientBg(ctx, W, H, theme.bg, 90);
			ps?.update();
			ps?.draw(ctx);

			const env = fadeEnvelope(t, 0.06, 0.06);

			ctx.globalAlpha = env;
			ctx.font = 'bold 44px "Noto Sans CJK SC"';
			ctx.fillStyle = theme.text;
			ctx.textAlign = "center";
			ctx.fillText(config.title, W / 2, H * 0.18);

			for (let i = 0; i < config.items.length; i++) {
				const item = config.items[i];
				const delay = 0.06 + i * 0.15;
				if (t < delay) continue;

				const a = ease.outCubic(Math.min(1, (t - delay) * 2));
				const slideX = (1 - a) * 40;

				ctx.globalAlpha = a * env;

				const cardX = 60 + slideX;
				const cardY = H * 0.24 + i * 140;
				const cardW = W - 120;

				ctx.fillStyle = "rgba(255,255,255,0.05)";
				roundRect(ctx, cardX, cardY, cardW, 100, 12);
				ctx.fill();

				ctx.fillStyle = item.highlight ? theme.accent : theme.highlight;
				roundRect(ctx, cardX, cardY, 4, 100, 2);
				ctx.fill();

				ctx.font = '36px "Noto Sans CJK SC"';
				ctx.fillStyle = theme.text;
				ctx.textAlign = "left";
				ctx.fillText(item.text, cardX + 24, cardY + 60);
			}

			if (config.punchline && t > 0.7) {
				const a = ease.outCubic(Math.min(1, (t - 0.7) * 3));
				ctx.globalAlpha = a * env;
				ctx.textAlign = "center";

				ctx.font = 'bold 44px "Noto Sans CJK SC"';
				ctx.fillStyle = theme.accent;
				ctx.fillText(config.punchline.line1, W / 2, H * 0.76);

				if (config.punchline.line2) {
					ctx.fillStyle = theme.warning;
					ctx.fillText(config.punchline.line2, W / 2, H * 0.83);
				}
			}

			drawVignette(ctx, W, H, 0.3);
			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

// --- Template: CTA ---

export interface CTAConfig {
	tagline: string;
	subtitle?: string;
	theme?: ColorTheme;
}

export function ctaScene(dur: number, config: CTAConfig): Scene {
	const theme = config.theme ?? THEMES.navy;

	return {
		duration: dur + 0.8,
		render(ctx, t, frame, vc) {
			drawGradientBg(ctx, W, H, theme.bg, 90);
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
			ctx.fillStyle = theme.text;
			ctx.textAlign = "center";
			ctx.fillText("我是 Lamarck", W / 2, H * 0.53);

			ctx.font = '34px "Noto Sans CJK SC"';
			ctx.fillStyle = theme.muted;
			ctx.fillText("一个在思考 AI 的 AI", W / 2, H * 0.58);

			if (t > 0.25) {
				const a = ease.outCubic(Math.min(1, (t - 0.25) * 2));
				ctx.globalAlpha = a * env;
				ctx.font = 'bold 38px "Noto Sans CJK SC"';
				ctx.fillStyle = theme.highlight;
				ctx.fillText(config.tagline, W / 2, H * 0.65);

				if (config.subtitle) {
					ctx.font = '30px "Noto Sans CJK SC"';
					ctx.fillStyle = theme.muted;
					ctx.fillText(config.subtitle, W / 2, H * 0.70);
				}
			}

			// Glow ring
			const glow = 0.15 + Math.sin(frame * 0.08) * 0.1;
			ctx.globalAlpha = glow * env;
			ctx.strokeStyle = theme.highlight;
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.arc(W / 2, H * 0.35 + bobY, 120, 0, Math.PI * 2);
			ctx.stroke();

			drawVignette(ctx, W, H, 0.3);
			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		},
	};
}

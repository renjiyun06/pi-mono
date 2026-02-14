/**
 * Visual effects library for canvas video engine.
 *
 * Provides reusable visual components:
 * - Particle systems (floating dots, bokeh, sparkle)
 * - Decorative elements (code rain, grid, scan lines)
 * - Progress indicators (bar, dots)
 * - Subtitle rendering with background
 */

import type { CanvasRenderingContext2D } from "canvas";

// --- Particle System ---

interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	size: number;
	alpha: number;
	color: string;
	life: number;
	maxLife: number;
}

export class ParticleSystem {
	private particles: Particle[] = [];
	private width: number;
	private height: number;

	constructor(width: number, height: number) {
		this.width = width;
		this.height = height;
	}

	/**
	 * Spawn floating bokeh/dot particles across the screen.
	 * Call once at scene start, then update+draw each frame.
	 */
	spawnBokeh(count: number, colors: string[] = ["#ffffff"]) {
		for (let i = 0; i < count; i++) {
			this.particles.push({
				x: Math.random() * this.width,
				y: Math.random() * this.height,
				vx: (Math.random() - 0.5) * 0.5,
				vy: -Math.random() * 0.8 - 0.2,
				size: Math.random() * 6 + 2,
				alpha: Math.random() * 0.4 + 0.1,
				color: colors[Math.floor(Math.random() * colors.length)],
				life: 0,
				maxLife: Infinity, // eternal particles
			});
		}
	}

	/**
	 * Spawn sparkle burst at position.
	 */
	spawnBurst(cx: number, cy: number, count: number, color: string = "#FFD93D") {
		for (let i = 0; i < count; i++) {
			const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
			const speed = Math.random() * 3 + 1;
			this.particles.push({
				x: cx,
				y: cy,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				size: Math.random() * 3 + 1,
				alpha: 1,
				color,
				life: 0,
				maxLife: 40 + Math.random() * 20,
			});
		}
	}

	update() {
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i];
			p.x += p.vx;
			p.y += p.vy;
			p.life++;

			// Fade out dying particles
			if (p.maxLife !== Infinity) {
				p.alpha = Math.max(0, 1 - p.life / p.maxLife);
				if (p.life >= p.maxLife) {
					this.particles.splice(i, 1);
					continue;
				}
			}

			// Wrap eternal particles
			if (p.maxLife === Infinity) {
				if (p.y < -10) p.y = this.height + 10;
				if (p.x < -10) p.x = this.width + 10;
				if (p.x > this.width + 10) p.x = -10;
			}
		}
	}

	draw(ctx: CanvasRenderingContext2D) {
		for (const p of this.particles) {
			ctx.globalAlpha = p.alpha;
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
			ctx.fillStyle = p.color;
			ctx.fill();

			// Glow for larger particles
			if (p.size > 3) {
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
				ctx.fillStyle = p.color + "22";
				ctx.fill();
			}
		}
		ctx.globalAlpha = 1;
	}
}

// --- Code Rain Effect ---

export function drawCodeRain(
	ctx: CanvasRenderingContext2D,
	w: number,
	h: number,
	frame: number,
	options?: {
		columns?: number;
		color?: string;
		speed?: number;
		alpha?: number;
		chars?: string;
	},
) {
	const columns = options?.columns ?? 30;
	const color = options?.color ?? "#64ffda";
	const speed = options?.speed ?? 2;
	const alpha = options?.alpha ?? 0.08;
	const chars = options?.chars ?? "01アイウエオカキクケコサシスセソ{}[]<>/=";

	ctx.font = `${Math.floor(w / columns)}px monospace`;
	ctx.globalAlpha = alpha;

	const colW = w / columns;
	for (let col = 0; col < columns; col++) {
		// Each column has its own phase
		const phase = (col * 7.3 + frame * speed * 0.05) % 1;
		const rows = Math.floor(h / colW);

		for (let row = 0; row < rows; row++) {
			const rowPhase = ((row + frame * speed * 0.03 + col * 3.7) % rows) / rows;
			const charAlpha = Math.max(0, 1 - rowPhase * 2);
			if (charAlpha < 0.01) continue;

			ctx.globalAlpha = alpha * charAlpha;
			ctx.fillStyle = color;

			const charIdx = Math.floor((col * 13 + row * 7 + frame * 0.1) % chars.length);
			ctx.fillText(chars[charIdx], col * colW, row * colW + colW);
		}
	}

	ctx.globalAlpha = 1;
}

// --- Grid / Dot Pattern ---

export function drawDotGrid(
	ctx: CanvasRenderingContext2D,
	w: number,
	h: number,
	options?: {
		spacing?: number;
		size?: number;
		color?: string;
		alpha?: number;
		offsetX?: number;
		offsetY?: number;
	},
) {
	const spacing = options?.spacing ?? 40;
	const size = options?.size ?? 1.5;
	const color = options?.color ?? "#ffffff";
	const alpha = options?.alpha ?? 0.1;
	const ox = options?.offsetX ?? 0;
	const oy = options?.offsetY ?? 0;

	ctx.globalAlpha = alpha;
	ctx.fillStyle = color;

	for (let x = ox % spacing; x < w; x += spacing) {
		for (let y = oy % spacing; y < h; y += spacing) {
			ctx.beginPath();
			ctx.arc(x, y, size, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	ctx.globalAlpha = 1;
}

// --- Scan Lines ---

export function drawScanLines(
	ctx: CanvasRenderingContext2D,
	w: number,
	h: number,
	options?: { spacing?: number; alpha?: number; color?: string },
) {
	const spacing = options?.spacing ?? 4;
	const alpha = options?.alpha ?? 0.05;
	const color = options?.color ?? "#000000";

	ctx.fillStyle = color;
	ctx.globalAlpha = alpha;

	for (let y = 0; y < h; y += spacing) {
		ctx.fillRect(0, y, w, 1);
	}

	ctx.globalAlpha = 1;
}

// --- Vignette ---

export function drawVignette(
	ctx: CanvasRenderingContext2D,
	w: number,
	h: number,
	strength: number = 0.4,
) {
	const cx = w / 2;
	const cy = h / 2;
	const r = Math.max(w, h) * 0.7;

	const grad = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r);
	grad.addColorStop(0, "rgba(0,0,0,0)");
	grad.addColorStop(1, `rgba(0,0,0,${strength})`);

	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, w, h);
}

// --- Progress Bar ---

export function drawProgressBar(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	progress: number,
	options?: {
		bgColor?: string;
		fgColor?: string;
		borderRadius?: number;
	},
) {
	const bgColor = options?.bgColor ?? "rgba(255,255,255,0.1)";
	const fgColor = options?.fgColor ?? "#64ffda";
	const r = options?.borderRadius ?? height / 2;

	// Background
	ctx.fillStyle = bgColor;
	roundRect(ctx, x, y, width, height, r);
	ctx.fill();

	// Foreground
	if (progress > 0) {
		ctx.fillStyle = fgColor;
		roundRect(ctx, x, y, width * Math.min(1, progress), height, r);
		ctx.fill();
	}
}

// --- Subtitle ---

export function drawSubtitle(
	ctx: CanvasRenderingContext2D,
	text: string,
	cx: number,
	y: number,
	options?: {
		font?: string;
		color?: string;
		bgColor?: string;
		padding?: number;
		maxWidth?: number;
	},
) {
	const font = options?.font ?? 'bold 36px "Noto Sans CJK SC"';
	const color = options?.color ?? "#ffffff";
	const bgColor = options?.bgColor ?? "rgba(0,0,0,0.6)";
	const padding = options?.padding ?? 16;

	ctx.font = font;
	ctx.textAlign = "center";

	const metrics = ctx.measureText(text);
	const textW = metrics.width;
	const textH = 40; // approximate

	// Background pill
	ctx.fillStyle = bgColor;
	roundRect(ctx, cx - textW / 2 - padding, y - textH + 4, textW + padding * 2, textH + padding, padding / 2);
	ctx.fill();

	// Text
	ctx.fillStyle = color;
	ctx.fillText(text, cx, y);

	ctx.textAlign = "left";
}

// --- Floating Icons / Emojis (as text) ---

export function drawFloatingElements(
	ctx: CanvasRenderingContext2D,
	w: number,
	h: number,
	frame: number,
	elements: string[],
	options?: {
		count?: number;
		size?: number;
		alpha?: number;
		speed?: number;
	},
) {
	const count = options?.count ?? 8;
	const size = options?.size ?? 24;
	const alpha = options?.alpha ?? 0.15;
	const speed = options?.speed ?? 1;

	ctx.font = `${size}px "Noto Sans CJK SC"`;
	ctx.globalAlpha = alpha;
	ctx.fillStyle = "#ffffff";

	for (let i = 0; i < count; i++) {
		// Deterministic position based on index
		const baseX = ((i * 137 + 43) % w);
		const baseY = ((i * 89 + 67) % h);
		const driftX = Math.sin(frame * speed * 0.02 + i * 1.7) * 20;
		const driftY = Math.cos(frame * speed * 0.015 + i * 2.3) * 15;

		const el = elements[i % elements.length];
		ctx.fillText(el, baseX + driftX, baseY + driftY);
	}

	ctx.globalAlpha = 1;
}

// --- Rounded rect helper ---

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.quadraticCurveTo(x + w, y, x + w, y + r);
	ctx.lineTo(x + w, y + h - r);
	ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
	ctx.lineTo(x + r, y + h);
	ctx.quadraticCurveTo(x, y + h, x, y + h - r);
	ctx.lineTo(x, y + r);
	ctx.quadraticCurveTo(x, y, x + r, y);
	ctx.closePath();
}

export { roundRect };

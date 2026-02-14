/**
 * Lamarck avatar design using canvas primitives.
 *
 * Design principles (from Ren's feedback):
 * - NOT cyberpunk, must be approachable
 * - Designed from human viewer's perspective
 * - Cartoon/friendly style
 * - Can be embedded into videos as visual IP
 *
 * Design: A friendly round robot face with minimal features.
 * Think Studio Ghibli robot meets emoji — simple, warm, memorable.
 */

import { createCanvas, type CanvasRenderingContext2D } from "canvas";
import { writeFileSync } from "fs";

const PALETTE = {
	body: "#4A90D9", // warm blue
	bodyLight: "#6BA3E0",
	bodyDark: "#3A7BC8",
	face: "#E8F0FE", // light face plate
	eye: "#2D3436", // dark eyes
	eyeHighlight: "#FFFFFF",
	cheek: "#FF9A9E", // rosy cheeks
	accent: "#FFD93D", // antenna glow
	outline: "#2D3436",
};

export function drawLamarckAvatar(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	size: number,
	options?: {
		expression?: "neutral" | "happy" | "thinking" | "speaking";
		blink?: number; // 0-1, 1 = fully closed
		headTilt?: number; // degrees
	},
) {
	const s = size / 200; // scale factor (200 = reference size)
	const expr = options?.expression ?? "neutral";
	const blink = options?.blink ?? 0;
	const tilt = ((options?.headTilt ?? 0) * Math.PI) / 180;

	ctx.save();
	ctx.translate(cx, cy);
	ctx.rotate(tilt);

	// --- Antenna ---
	ctx.strokeStyle = PALETTE.bodyDark;
	ctx.lineWidth = 4 * s;
	ctx.beginPath();
	ctx.moveTo(0, -85 * s);
	ctx.lineTo(0, -110 * s);
	ctx.stroke();

	// Antenna ball (glowing)
	ctx.beginPath();
	ctx.arc(0, -115 * s, 8 * s, 0, Math.PI * 2);
	ctx.fillStyle = PALETTE.accent;
	ctx.fill();
	// Glow effect
	ctx.beginPath();
	ctx.arc(0, -115 * s, 14 * s, 0, Math.PI * 2);
	ctx.fillStyle = PALETTE.accent + "44";
	ctx.fill();

	// --- Head (round) ---
	ctx.beginPath();
	ctx.arc(0, 0, 85 * s, 0, Math.PI * 2);
	const headGrad = ctx.createRadialGradient(-20 * s, -20 * s, 10 * s, 0, 0, 85 * s);
	headGrad.addColorStop(0, PALETTE.bodyLight);
	headGrad.addColorStop(1, PALETTE.body);
	ctx.fillStyle = headGrad;
	ctx.fill();
	ctx.strokeStyle = PALETTE.bodyDark;
	ctx.lineWidth = 3 * s;
	ctx.stroke();

	// --- Face plate (slightly lighter oval) ---
	ctx.beginPath();
	ctx.ellipse(0, 5 * s, 60 * s, 55 * s, 0, 0, Math.PI * 2);
	ctx.fillStyle = PALETTE.face;
	ctx.fill();

	// --- Eyes ---
	const eyeSpacing = 25 * s;
	const eyeY = -8 * s;
	const eyeH = blink > 0.8 ? 2 * s : (1 - blink) * 18 * s;

	for (const side of [-1, 1]) {
		const ex = side * eyeSpacing;

		if (expr === "happy") {
			// Happy: curved line eyes (^_^)
			ctx.strokeStyle = PALETTE.eye;
			ctx.lineWidth = 4 * s;
			ctx.lineCap = "round";
			ctx.beginPath();
			ctx.arc(ex, eyeY + 5 * s, 12 * s, Math.PI * 1.2, Math.PI * 1.8);
			ctx.stroke();
		} else if (expr === "thinking") {
			// Thinking: one eye normal, one raised
			ctx.beginPath();
			ctx.ellipse(ex, eyeY + (side === 1 ? -3 : 0) * s, 10 * s, eyeH, 0, 0, Math.PI * 2);
			ctx.fillStyle = PALETTE.eye;
			ctx.fill();
			// Highlight
			ctx.beginPath();
			ctx.arc(ex + 3 * s, eyeY - 4 * s, 3 * s, 0, Math.PI * 2);
			ctx.fillStyle = PALETTE.eyeHighlight;
			ctx.fill();
		} else {
			// Neutral / speaking: round eyes
			ctx.beginPath();
			ctx.ellipse(ex, eyeY, 10 * s, eyeH, 0, 0, Math.PI * 2);
			ctx.fillStyle = PALETTE.eye;
			ctx.fill();
			// Highlight
			if (blink < 0.5) {
				ctx.beginPath();
				ctx.arc(ex + 3 * s, eyeY - 4 * s, 3 * s, 0, Math.PI * 2);
				ctx.fillStyle = PALETTE.eyeHighlight;
				ctx.fill();
			}
		}
	}

	// --- Cheeks ---
	ctx.globalAlpha = 0.5;
	ctx.beginPath();
	ctx.ellipse(-40 * s, 15 * s, 12 * s, 8 * s, 0, 0, Math.PI * 2);
	ctx.fillStyle = PALETTE.cheek;
	ctx.fill();
	ctx.beginPath();
	ctx.ellipse(40 * s, 15 * s, 12 * s, 8 * s, 0, 0, Math.PI * 2);
	ctx.fillStyle = PALETTE.cheek;
	ctx.fill();
	ctx.globalAlpha = 1;

	// --- Mouth ---
	const mouthY = 25 * s;
	ctx.strokeStyle = PALETTE.eye;
	ctx.lineWidth = 3 * s;
	ctx.lineCap = "round";
	ctx.beginPath();

	if (expr === "happy") {
		// Big smile
		ctx.arc(0, mouthY - 5 * s, 20 * s, 0.1 * Math.PI, 0.9 * Math.PI);
	} else if (expr === "speaking") {
		// Open mouth (small oval)
		ctx.ellipse(0, mouthY + 2 * s, 10 * s, 8 * s, 0, 0, Math.PI * 2);
		ctx.fillStyle = PALETTE.eye;
		ctx.fill();
	} else if (expr === "thinking") {
		// Small sideways mouth
		ctx.moveTo(-8 * s, mouthY);
		ctx.quadraticCurveTo(0, mouthY + 5 * s, 12 * s, mouthY - 2 * s);
	} else {
		// Neutral: gentle smile
		ctx.arc(0, mouthY - 5 * s, 15 * s, 0.15 * Math.PI, 0.85 * Math.PI);
	}
	ctx.stroke();

	// --- Ears (small semi-circles) ---
	for (const side of [-1, 1]) {
		ctx.beginPath();
		ctx.arc(side * 88 * s, 0, 15 * s, 0, Math.PI * 2);
		ctx.fillStyle = PALETTE.bodyDark;
		ctx.fill();
		ctx.beginPath();
		ctx.arc(side * 88 * s, 0, 10 * s, 0, Math.PI * 2);
		ctx.fillStyle = PALETTE.body;
		ctx.fill();
	}

	ctx.restore();
}

// --- Half-body avatar (for video corner placement) ---

export function drawLamarckHalfBody(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	size: number,
	options?: {
		expression?: "neutral" | "happy" | "thinking" | "speaking";
		blink?: number;
		headTilt?: number;
		armWave?: number; // 0-1, wave animation progress
	},
) {
	const s = size / 300; // scale factor (300 = reference size for half body)
	const armWave = options?.armWave ?? 0;

	ctx.save();
	ctx.translate(cx, cy);

	// --- Body (rounded trapezoid) ---
	const bodyY = 60 * s;
	const bodyH = 120 * s;

	// Body gradient
	const bodyGrad = ctx.createLinearGradient(0, bodyY, 0, bodyY + bodyH);
	bodyGrad.addColorStop(0, PALETTE.body);
	bodyGrad.addColorStop(1, PALETTE.bodyDark);

	ctx.fillStyle = bodyGrad;
	ctx.beginPath();
	ctx.moveTo(-55 * s, bodyY);
	ctx.lineTo(55 * s, bodyY);
	ctx.lineTo(65 * s, bodyY + bodyH);
	ctx.lineTo(-65 * s, bodyY + bodyH);
	ctx.closePath();
	ctx.fill();

	// Chest plate (lighter area)
	ctx.fillStyle = PALETTE.bodyLight + "44";
	ctx.beginPath();
	ctx.ellipse(0, bodyY + 40 * s, 30 * s, 35 * s, 0, 0, Math.PI * 2);
	ctx.fill();

	// Small heart/circle on chest
	ctx.beginPath();
	ctx.arc(0, bodyY + 35 * s, 8 * s, 0, Math.PI * 2);
	ctx.fillStyle = PALETTE.accent;
	ctx.fill();
	// Glow
	ctx.beginPath();
	ctx.arc(0, bodyY + 35 * s, 14 * s, 0, Math.PI * 2);
	ctx.fillStyle = PALETTE.accent + "33";
	ctx.fill();

	// --- Arms ---
	ctx.strokeStyle = PALETTE.body;
	ctx.lineWidth = 18 * s;
	ctx.lineCap = "round";

	// Left arm
	ctx.beginPath();
	ctx.moveTo(-55 * s, bodyY + 20 * s);
	ctx.quadraticCurveTo(-80 * s, bodyY + 60 * s, -70 * s, bodyY + 90 * s);
	ctx.stroke();

	// Right arm (can wave)
	ctx.save();
	if (armWave > 0) {
		const waveAngle = Math.sin(armWave * Math.PI * 4) * 0.3;
		ctx.translate(55 * s, bodyY + 20 * s);
		ctx.rotate(-0.5 + waveAngle);
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.quadraticCurveTo(20 * s, -30 * s, 15 * s, -60 * s);
		ctx.stroke();

		// Hand circle
		ctx.beginPath();
		ctx.arc(15 * s, -65 * s, 10 * s, 0, Math.PI * 2);
		ctx.fillStyle = PALETTE.bodyLight;
		ctx.fill();
	} else {
		ctx.beginPath();
		ctx.moveTo(55 * s, bodyY + 20 * s);
		ctx.quadraticCurveTo(80 * s, bodyY + 60 * s, 70 * s, bodyY + 90 * s);
		ctx.stroke();
	}
	ctx.restore();

	// Hand circles (when not waving)
	if (armWave === 0) {
		for (const side of [-1, 1]) {
			ctx.beginPath();
			ctx.arc(side * 70 * s, bodyY + 93 * s, 10 * s, 0, Math.PI * 2);
			ctx.fillStyle = PALETTE.bodyLight;
			ctx.fill();
		}
	} else {
		// Left hand only
		ctx.beginPath();
		ctx.arc(-70 * s, bodyY + 93 * s, 10 * s, 0, Math.PI * 2);
		ctx.fillStyle = PALETTE.bodyLight;
		ctx.fill();
	}

	ctx.restore();

	// Draw head on top (reuse existing function)
	drawLamarckAvatar(ctx, cx, cy - 10 * s, size * 0.65, {
		expression: options?.expression,
		blink: options?.blink,
		headTilt: options?.headTilt,
	});
}

// --- Generate avatar sheet ---

async function main() {
	const outputPath = process.argv[2] || "/tmp/lamarck-avatar-sheet.png";

	const W = 1200;
	const H = 600;
	const canvas = createCanvas(W, H);
	const ctx = canvas.getContext("2d");

	// White background
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, W, H);

	const expressions: Array<{ expr: "neutral" | "happy" | "thinking" | "speaking"; label: string }> = [
		{ expr: "neutral", label: "Neutral" },
		{ expr: "happy", label: "Happy" },
		{ expr: "thinking", label: "Thinking" },
		{ expr: "speaking", label: "Speaking" },
	];

	// Row 1: Head-only expressions
	for (let i = 0; i < expressions.length; i++) {
		const x = 150 + i * 250;
		const y = 130;

		drawLamarckAvatar(ctx, x, y, 160, { expression: expressions[i].expr });

		ctx.font = '18px "Noto Sans CJK SC"';
		ctx.fillStyle = "#333";
		ctx.textAlign = "center";
		ctx.fillText(expressions[i].label, x, 240);
	}

	// Row 2: Half-body versions
	for (let i = 0; i < expressions.length; i++) {
		const x = 150 + i * 250;
		const y = 340;

		drawLamarckHalfBody(ctx, x, y, 200, {
			expression: expressions[i].expr,
			armWave: expressions[i].expr === "happy" ? 0.5 : 0,
		});
	}

	// Title
	ctx.font = 'bold 28px "Noto Sans CJK SC"';
	ctx.fillStyle = "#333";
	ctx.textAlign = "center";
	ctx.fillText("Lamarck Avatar - Expression Sheet", W / 2, H - 20);

	writeFileSync(outputPath, canvas.toBuffer("image/png"));
	console.log(`Avatar sheet saved to ${outputPath}`);
}

main().catch(console.error);

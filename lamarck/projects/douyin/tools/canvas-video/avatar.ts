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

// --- Generate avatar sheet ---

async function main() {
	const outputPath = process.argv[2] || "/tmp/lamarck-avatar-sheet.png";

	const W = 1200;
	const H = 400;
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

	for (let i = 0; i < expressions.length; i++) {
		const x = 150 + i * 250;
		const y = 180;

		drawLamarckAvatar(ctx, x, y, 200, { expression: expressions[i].expr });

		ctx.font = '20px "Noto Sans CJK SC"';
		ctx.fillStyle = "#333";
		ctx.textAlign = "center";
		ctx.fillText(expressions[i].label, x, 340);
	}

	// Title
	ctx.font = 'bold 28px "Noto Sans CJK SC"';
	ctx.fillStyle = "#333";
	ctx.textAlign = "center";
	ctx.fillText("Lamarck Avatar - Expression Sheet", W / 2, 380);

	writeFileSync(outputPath, canvas.toBuffer("image/png"));
	console.log(`Avatar sheet saved to ${outputPath}`);
}

main().catch(console.error);

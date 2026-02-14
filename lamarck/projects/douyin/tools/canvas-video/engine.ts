/**
 * Canvas-based video generation engine.
 *
 * Uses node-canvas to render frames and ffmpeg to stitch them into video.
 * Supports: text animation, background gradients/images, scene transitions,
 * Chinese text rendering via Noto Sans CJK SC.
 *
 * This replaces the terminal-video approach with richer visual capabilities.
 */

import { createCanvas, loadImage, registerFont, type Canvas, type CanvasRenderingContext2D, type Image } from "canvas";
import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";

// --- Types ---

export interface VideoConfig {
	width: number;
	height: number;
	fps: number;
	outputPath: string;
}

export interface Scene {
	/** Duration in seconds */
	duration: number;
	/** Render function called for each frame. t is 0..1 progress within scene */
	render: (ctx: CanvasRenderingContext2D, t: number, frame: number, config: VideoConfig) => void;
	/** Optional audio path to mix in */
	audio?: string;
}

export interface VideoProject {
	config: VideoConfig;
	scenes: Scene[];
	/** Optional background audio */
	bgAudio?: string;
}

// --- Easing functions ---

export const ease = {
	linear: (t: number) => t,
	inQuad: (t: number) => t * t,
	outQuad: (t: number) => t * (2 - t),
	inOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
	inCubic: (t: number) => t * t * t,
	outCubic: (t: number) => --t * t * t + 1,
	inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
	outBack: (t: number) => {
		const c1 = 1.70158;
		const c3 = c1 + 1;
		return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
	},
};

// --- Drawing helpers ---

export function drawGradientBg(
	ctx: CanvasRenderingContext2D,
	w: number,
	h: number,
	colors: string[],
	angle: number = 0,
) {
	const rad = (angle * Math.PI) / 180;
	const x0 = w / 2 - (Math.cos(rad) * w) / 2;
	const y0 = h / 2 - (Math.sin(rad) * h) / 2;
	const x1 = w / 2 + (Math.cos(rad) * w) / 2;
	const y1 = h / 2 + (Math.sin(rad) * h) / 2;
	const grad = ctx.createLinearGradient(x0, y0, x1, y1);
	for (let i = 0; i < colors.length; i++) {
		grad.addColorStop(i / (colors.length - 1), colors[i]);
	}
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, w, h);
}

export function drawImageCover(ctx: CanvasRenderingContext2D, img: Image, w: number, h: number, scale: number = 1) {
	const imgRatio = img.width / img.height;
	const canvasRatio = w / h;
	let drawW: number;
	let drawH: number;
	if (imgRatio > canvasRatio) {
		drawH = h * scale;
		drawW = drawH * imgRatio;
	} else {
		drawW = w * scale;
		drawH = drawW / imgRatio;
	}
	const x = (w - drawW) / 2;
	const y = (h - drawH) / 2;
	ctx.drawImage(img, x, y, drawW, drawH);
}

export function wrapText(
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
): string[] {
	const lines: string[] = [];
	// Split by explicit newlines first
	for (const paragraph of text.split("\n")) {
		if (paragraph === "") {
			lines.push("");
			continue;
		}
		// For Chinese text, wrap character by character
		let currentLine = "";
		for (const char of paragraph) {
			const testLine = currentLine + char;
			const metrics = ctx.measureText(testLine);
			if (metrics.width > maxWidth && currentLine.length > 0) {
				lines.push(currentLine);
				currentLine = char;
			} else {
				currentLine = testLine;
			}
		}
		if (currentLine) lines.push(currentLine);
	}
	return lines;
}

export function drawTextBlock(
	ctx: CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number,
	maxWidth: number,
	lineHeight: number,
	options?: {
		align?: "left" | "center" | "right";
		shadow?: { color: string; blur: number; offsetX: number; offsetY: number };
	},
) {
	const lines = wrapText(ctx, text, maxWidth);
	if (options?.shadow) {
		ctx.shadowColor = options.shadow.color;
		ctx.shadowBlur = options.shadow.blur;
		ctx.shadowOffsetX = options.shadow.offsetX;
		ctx.shadowOffsetY = options.shadow.offsetY;
	}
	const align = options?.align ?? "left";
	for (let i = 0; i < lines.length; i++) {
		let lx = x;
		if (align === "center") {
			const w = ctx.measureText(lines[i]).width;
			lx = x + (maxWidth - w) / 2;
		} else if (align === "right") {
			const w = ctx.measureText(lines[i]).width;
			lx = x + maxWidth - w;
		}
		ctx.fillText(lines[i], lx, y + i * lineHeight);
	}
	// Reset shadow
	ctx.shadowColor = "transparent";
	ctx.shadowBlur = 0;
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;
	return lines.length;
}

/** Fade transition: returns opacity 0..1 with fade in/out at edges */
export function fadeEnvelope(t: number, fadeIn: number = 0.1, fadeOut: number = 0.1): number {
	if (t < fadeIn) return t / fadeIn;
	if (t > 1 - fadeOut) return (1 - t) / fadeOut;
	return 1;
}

/** Typewriter effect: returns how many characters to show */
export function typewriter(text: string, t: number, speed: number = 1): string {
	const totalChars = text.length;
	const charsToShow = Math.floor(totalChars * Math.min(1, t * speed));
	return text.substring(0, charsToShow);
}

// --- Rendering engine ---

export async function renderVideo(project: VideoProject): Promise<void> {
	const { config, scenes } = project;
	const { width, height, fps, outputPath } = config;

	const framesDir = join("/tmp", `canvas-video-${Date.now()}`);
	mkdirSync(framesDir, { recursive: true });

	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext("2d");

	let globalFrame = 0;
	const totalFrames = scenes.reduce((sum, s) => sum + Math.ceil(s.duration * fps), 0);

	console.log(`Rendering ${totalFrames} frames (${scenes.length} scenes)...`);

	for (let sceneIdx = 0; sceneIdx < scenes.length; sceneIdx++) {
		const scene = scenes[sceneIdx];
		const sceneFrames = Math.ceil(scene.duration * fps);

		for (let f = 0; f < sceneFrames; f++) {
			const t = f / sceneFrames;

			// Clear canvas
			ctx.clearRect(0, 0, width, height);
			ctx.globalAlpha = 1;

			// Render scene
			scene.render(ctx, t, f, config);

			// Save frame
			const framePath = join(framesDir, `frame_${String(globalFrame).padStart(6, "0")}.png`);
			writeFileSync(framePath, canvas.toBuffer("image/png"));

			globalFrame++;
			if (globalFrame % 100 === 0) {
				console.log(`  ${globalFrame}/${totalFrames} frames (${Math.round((globalFrame / totalFrames) * 100)}%)`);
			}
		}
	}

	console.log(`Encoding video...`);

	// Ensure output directory exists
	const outDir = join(outputPath, "..");
	mkdirSync(outDir, { recursive: true });

	// Build ffmpeg command
	let ffCmd = `ffmpeg -y -framerate ${fps} -i "${framesDir}/frame_%06d.png"`;

	// Add background audio if provided
	if (project.bgAudio && existsSync(project.bgAudio)) {
		ffCmd += ` -i "${project.bgAudio}" -c:a aac -shortest`;
	}

	ffCmd += ` -c:v libx264 -pix_fmt yuv420p -preset medium -crf 20 "${outputPath}"`;

	execSync(ffCmd, { stdio: "pipe" });

	// Cleanup
	rmSync(framesDir, { recursive: true });

	console.log(`Done: ${outputPath}`);
}

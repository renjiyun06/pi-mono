#!/usr/bin/env npx tsx
/**
 * Render a carousel (图文笔记) as PNG images using Remotion Stills.
 * 
 * Usage:
 *   npx tsx render-carousel.ts --spec specs/carousel-example.json --output-dir ./output
 * 
 * Spec format:
 * {
 *   "slides": [
 *     {"headline": "Title", "style": "title"},
 *     {"headline": "Point 1", "body": "Details...", "style": "content"},
 *     {"headline": "72%", "body": "of students...", "style": "stat", "emoji": "📊"},
 *     {"headline": "Key quote", "style": "quote"},
 *     {"headline": "Remember this", "body": "...", "style": "takeaway"}
 *   ]
 * }
 */

import { readFileSync, mkdirSync } from "fs";
import { resolve, join } from "path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

interface SlideSpec {
	headline: string;
	body?: string;
	style?: "title" | "content" | "quote" | "stat" | "takeaway";
	emoji?: string;
}

interface CarouselSpec {
	slides: SlideSpec[];
	authorName?: string;
	backgroundColor?: string;
	accentColor?: string;
}

async function main() {
	const args = process.argv.slice(2);
	const specIdx = args.indexOf("--spec");
	const outputIdx = args.indexOf("--output-dir");

	if (specIdx === -1 || outputIdx === -1) {
		console.log("Usage: npx tsx render-carousel.ts --spec spec.json --output-dir ./output");
		process.exit(1);
	}

	const specPath = args[specIdx + 1];
	const outputDir = args[outputIdx + 1];
	const spec: CarouselSpec = JSON.parse(readFileSync(specPath, "utf-8"));

	mkdirSync(outputDir, { recursive: true });

	const totalPages = spec.slides.length;
	console.log(`=== Carousel Render ===`);
	console.log(`Slides: ${totalPages}`);
	console.log(`Output: ${outputDir}\n`);

	// Bundle once
	console.log("Bundling...");
	const entryPoint = resolve(__dirname, "src/index.ts");
	const bundled = await bundle({ entryPoint, webpackOverride: (config) => config });

	for (let i = 0; i < spec.slides.length; i++) {
		const slide = spec.slides[i];
		const outputPath = join(outputDir, `slide-${String(i + 1).padStart(2, "0")}.png`);

		const inputProps = {
			headline: slide.headline,
			body: slide.body,
			pageNumber: i + 1,
			totalPages,
			style: slide.style || "content",
			emoji: slide.emoji,
			authorName: spec.authorName || "Lamarck",
			backgroundColor: spec.backgroundColor || "#0a0a0a",
			accentColor: spec.accentColor || "#00d4ff",
		};

		const composition = await selectComposition({
			serveUrl: bundled,
			id: "CarouselSlide",
			inputProps,
		});

		await renderStill({
			composition,
			serveUrl: bundled,
			output: outputPath,
			inputProps,
			imageFormat: "png",
		});

		console.log(`  [${i + 1}/${totalPages}] ${slide.style || "content"}: "${slide.headline.substring(0, 30)}..." → ${outputPath}`);
	}

	console.log(`\n=== Done ===`);
	console.log(`${totalPages} slides rendered to ${outputDir}`);
}

main().catch(e => {
	console.error("Carousel render failed:", e.message);
	process.exit(1);
});

#!/usr/bin/env npx tsx
/**
 * Validates video spec JSON files.
 * Supports DeepDive (long-form with scene types) and short-form (Spotlight, GradientFlow, etc.).
 * Checks: JSON parsing, required fields, narration length estimates,
 * videoSrc existence, Chinese quote marks, section count, scene types.
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";

const VALID_SCENE_TYPES = ["chapter", "text", "data", "quote", "code", "comparison", "visual", "timeline", "image"];
const VALID_COMPOSITIONS = ["DeepDive", "Spotlight", "GradientFlow", "AIInsight", "NeuralViz", "KnowledgeCard"];
const CHARS_PER_SECOND_ZH = 4.5; // Chinese TTS at -5% rate

// Thresholds vary by composition type
const DEEPDIVE_LIMITS = { minSections: 8, maxSections: 25, minDuration: 90, maxDuration: 360 };
const SHORT_LIMITS = { minSections: 3, maxSections: 12, minDuration: 20, maxDuration: 120 };

interface Issue {
	level: "error" | "warn" | "info";
	message: string;
}

function validate(specPath: string): Issue[] {
	const issues: Issue[] = [];
	const absPath = resolve(specPath);

	// 1. File exists
	if (!existsSync(absPath)) {
		issues.push({ level: "error", message: `File not found: ${absPath}` });
		return issues;
	}

	// 2. JSON parsing
	const raw = readFileSync(absPath, "utf-8");

	// Check for Chinese quotation marks before parsing
	if (raw.includes("\u201c") || raw.includes("\u201d")) {
		issues.push({
			level: "error",
			message: 'Contains Chinese quotation marks \u201c\u201d — use \u300c\u300d instead to avoid JSON parsing errors',
		});
	}

	let spec: any;
	try {
		spec = JSON.parse(raw);
	} catch (e: any) {
		issues.push({ level: "error", message: `JSON parse error: ${e.message}` });
		return issues;
	}

	// 3. Required top-level fields
	const composition = spec.composition || "unknown";
	const isDeepDive = composition === "DeepDive";
	if (!VALID_COMPOSITIONS.includes(composition)) {
		issues.push({ level: "warn", message: `Unknown composition "${composition}" — not in ${VALID_COMPOSITIONS.join(", ")}` });
	}
	if (!spec.voice) issues.push({ level: "warn", message: "No voice specified" });
	if (isDeepDive && !spec.accentColor) issues.push({ level: "warn", message: "No accentColor specified" });
	if (!Array.isArray(spec.sections) || spec.sections.length === 0) {
		issues.push({ level: "error", message: "No sections array" });
		return issues;
	}

	const limits = isDeepDive ? DEEPDIVE_LIMITS : SHORT_LIMITS;

	// 4. Section count
	const count = spec.sections.length;
	if (count < limits.minSections) issues.push({ level: "warn", message: `Only ${count} sections (minimum recommended: ${limits.minSections})` });
	if (count > limits.maxSections) issues.push({ level: "warn", message: `${count} sections (maximum recommended: ${limits.maxSections})` });

	// 5. Per-section validation
	let totalNarrationChars = 0;
	let hasVisual = false;
	const specDir = dirname(absPath);
	const projectRoot = resolve(specDir, "..");

	for (let i = 0; i < spec.sections.length; i++) {
		const s = spec.sections[i];
		const prefix = `Section ${i + 1}`;

		// Scene type (only required for DeepDive)
		if (isDeepDive) {
			if (!s.sceneType) {
				issues.push({ level: "error", message: `${prefix}: missing sceneType` });
			} else if (!VALID_SCENE_TYPES.includes(s.sceneType)) {
				issues.push({ level: "error", message: `${prefix}: unknown sceneType "${s.sceneType}"` });
			}
		}

		// Narration
		if (!s.narration && s.sceneType !== "chapter") {
			issues.push({ level: "warn", message: `${prefix} (${s.sceneType}): no narration text` });
		}
		if (s.narration) {
			totalNarrationChars += s.narration.length;

			// Very long narration for a single section
			if (s.narration.length > 200) {
				issues.push({ level: "info", message: `${prefix}: long narration (${s.narration.length} chars) — consider splitting` });
			}
		}

		// Visual scene: check videoSrc
		if (s.sceneType === "visual") {
			hasVisual = true;
			if (!s.videoSrc) {
				issues.push({ level: "error", message: `${prefix}: visual scene missing videoSrc` });
			} else {
				const videoPath = resolve(projectRoot, "public", s.videoSrc);
				if (!existsSync(videoPath)) {
					issues.push({ level: "error", message: `${prefix}: videoSrc not found: ${videoPath}` });
				}
			}
		}

		// Image scene: check imageSrc
		if (s.sceneType === "image") {
			hasVisual = true;
			if (!s.imageSrc) {
				issues.push({ level: "error", message: `${prefix}: image scene missing imageSrc` });
			} else {
				const imagePath = resolve(projectRoot, "public", s.imageSrc);
				if (!existsSync(imagePath)) {
					issues.push({ level: "error", message: `${prefix}: imageSrc not found: ${imagePath}` });
				}
			}
		}

		// Comparison scene: check fields
		if (s.sceneType === "comparison") {
			if (!s.leftLabel || !s.rightLabel) {
				issues.push({ level: "warn", message: `${prefix}: comparison missing leftLabel/rightLabel` });
			}
		}

		// Data scene: check stat
		if (s.sceneType === "data" && !s.stat) {
			issues.push({ level: "warn", message: `${prefix}: data scene missing stat field` });
		}

		// Text — chapter scenes need text for the section indicator
		if (s.sceneType === "chapter" && !s.text && !s.chapterTitle) {
			issues.push({ level: "error", message: `${prefix}: chapter scene needs text or chapterTitle` });
		} else if (s.sceneType === "chapter" && !s.text) {
			issues.push({ level: "warn", message: `${prefix}: chapter missing text field (section indicator will use chapterTitle as fallback)` });
		} else if (!s.text && s.sceneType !== "visual") {
			issues.push({ level: "info", message: `${prefix} (${s.sceneType}): empty text field` });
		}
	}

	// 5b. Duplicate narration check (copy-paste errors in spec generation)
	const narrations = spec.sections
		.map((s: any, i: number) => ({ index: i, text: (s.narration || "").trim() }))
		.filter((n: any) => n.text.length > 20); // only check substantial text
	for (let i = 0; i < narrations.length; i++) {
		for (let j = i + 1; j < narrations.length; j++) {
			if (narrations[i].text === narrations[j].text) {
				issues.push({
					level: "warn",
					message: `Sections ${narrations[i].index + 1} and ${narrations[j].index + 1} have identical narration — likely copy-paste error`,
				});
			}
		}
	}

	// 6. Duration estimate
	const estimatedDuration = totalNarrationChars / CHARS_PER_SECOND_ZH;
	if (estimatedDuration < limits.minDuration) {
		issues.push({
			level: "warn",
			message: `Estimated duration: ${Math.round(estimatedDuration)}s (${Math.round(estimatedDuration / 60)}:${String(Math.round(estimatedDuration % 60)).padStart(2, "0")}) — under ${limits.minDuration}s minimum`,
		});
	}
	if (estimatedDuration > limits.maxDuration) {
		issues.push({
			level: "warn",
			message: `Estimated duration: ${Math.round(estimatedDuration)}s (${Math.floor(estimatedDuration / 60)}:${String(Math.round(estimatedDuration % 60)).padStart(2, "0")}) — over ${limits.maxDuration}s maximum`,
		});
	}

	// 7. Visual diversity check
	if (!hasVisual) {
		issues.push({ level: "info", message: "No visual (Manim) scenes — consider adding B-roll" });
	}

	// 8. Scene type distribution (DeepDive only)
	const typeCounts: Record<string, number> = {};
	for (const s of spec.sections) {
		const type = s.sceneType || composition;
		typeCounts[type] = (typeCounts[type] || 0) + 1;
	}
	if (isDeepDive) {
		const textHeavy = (typeCounts["text"] || 0) / count;
		if (textHeavy > 0.5) {
			issues.push({ level: "warn", message: `${Math.round(textHeavy * 100)}% text scenes — consider more visual variety` });
		}
	}

	// 9. BGM check
	if (spec.bgm) {
		const bgmPath = resolve(projectRoot, spec.bgm);
		if (!existsSync(bgmPath)) {
			// Also try relative to spec directory
			const bgmPath2 = resolve(specDir, spec.bgm);
			if (!existsSync(bgmPath2)) {
				issues.push({ level: "warn", message: `BGM file not found at ${bgmPath} or ${bgmPath2}` });
			}
		}
	} else {
		issues.push({ level: "info", message: "No BGM specified" });
	}

	// Summary
	issues.push({
		level: "info",
		message: `Summary: ${count} sections, ~${totalNarrationChars} narration chars, ~${Math.round(estimatedDuration)}s (${Math.floor(estimatedDuration / 60)}:${String(Math.round(estimatedDuration % 60)).padStart(2, "0")}), ${Object.entries(typeCounts).map(([k, v]) => `${k}:${v}`).join(" ")}`,
	});

	return issues;
}

// Main
const args = process.argv.slice(2);
if (args.length === 0) {
	// Validate all deep-*.json specs
	const { readdirSync } = require("fs");
	const specsDir = resolve(__dirname, "specs");
	const specs = readdirSync(specsDir).filter((f: string) => f.endsWith(".json") && !f.startsWith("test-") && !f.startsWith("carousel-"));

	let totalErrors = 0;
	for (const spec of specs) {
		const specPath = resolve(specsDir, spec);
		console.log(`\n=== ${spec} ===`);
		const issues = validate(specPath);
		for (const issue of issues) {
			const icon = issue.level === "error" ? "✗" : issue.level === "warn" ? "⚠" : "·";
			console.log(`  ${icon} ${issue.message}`);
			if (issue.level === "error") totalErrors++;
		}
	}
	console.log(`\n${totalErrors === 0 ? "All specs valid!" : `${totalErrors} error(s) found.`}`);
	process.exit(totalErrors > 0 ? 1 : 0);
} else {
	for (const specPath of args) {
		console.log(`\n=== ${specPath} ===`);
		const issues = validate(specPath);
		for (const issue of issues) {
			const icon = issue.level === "error" ? "✗" : issue.level === "warn" ? "⚠" : "·";
			console.log(`  ${icon} ${issue.message}`);
		}
	}
}

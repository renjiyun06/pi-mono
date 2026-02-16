#!/usr/bin/env npx tsx
/**
 * Generate a video spec JSON from a simple text description.
 * Uses the section structure and composition selection heuristics
 * to create a publishable spec without manual JSON editing.
 *
 * Usage:
 *   npx tsx generate-spec.ts \
 *     --topic "AI幻觉" \
 *     --angle "confession" \
 *     --composition Spotlight \
 *     --output specs/ai-hallucination-new.json
 *
 * Or with a full prompt:
 *   npx tsx generate-spec.ts \
 *     --prompt "Write a confession-style spec where AI admits it sometimes makes up facts" \
 *     --output specs/ai-confesses-lies.json
 *
 * Without --prompt, generates a template based on topic/angle/composition.
 */

import { writeFileSync } from "fs";

interface SpecTemplate {
	composition: string;
	voice: string;
	rate: string;
	authorName: string;
	sections: Array<{
		text: string;
		narration: string;
		style?: string;
		emphasis?: boolean;
	}>;
	[key: string]: unknown;
}

const COMPOSITION_DEFAULTS: Record<string, Record<string, unknown>> = {
	AIInsight: {
		backgroundColor: "#0a0a0a",
		accentColor: "#00d4ff",
	},
	NeuralViz: {
		nodeCount: 35,
		backgroundColor: "#050510",
		accentColor: "#00d4ff",
		secondaryColor: "#7c3aed",
	},
	GradientFlow: {
		title: "",
	},
	Spotlight: {
		backgroundColor: "#030303",
		spotlightColor: "#6366f1",
	},
};

const ANGLE_CONFIGS: Record<
	string,
	{ compositions: string[]; rate: string; sectionCount: number; styles: string[] }
> = {
	confession: {
		compositions: ["Spotlight", "NeuralViz"],
		rate: "-8%",
		sectionCount: 5,
		styles: ["hook", "context", "insight", "insight", "takeaway"],
	},
	humor: {
		compositions: ["GradientFlow", "NeuralViz"],
		rate: "-5%",
		sectionCount: 5,
		styles: ["hook", "context", "context", "insight", "takeaway"],
	},
	explainer: {
		compositions: ["AIInsight", "NeuralViz"],
		rate: "-5%",
		sectionCount: 4,
		styles: ["hook", "context", "insight", "takeaway"],
	},
	news: {
		compositions: ["GradientFlow", "NeuralViz"],
		rate: "-5%",
		sectionCount: 5,
		styles: ["hook", "context", "context", "insight", "takeaway"],
	},
};

function generateTemplate(
	topic: string,
	angle: string,
	composition: string | undefined,
): SpecTemplate {
	const angleConfig = ANGLE_CONFIGS[angle] || ANGLE_CONFIGS.explainer;
	const comp = composition || angleConfig.compositions[0];
	const defaults = COMPOSITION_DEFAULTS[comp] || {};

	const sections = [];
	for (let i = 0; i < angleConfig.sectionCount; i++) {
		const style = angleConfig.styles[i] || "context";
		const isEmphasis = style === "insight" && comp === "Spotlight";

		sections.push({
			text: `[Section ${i + 1}: ${style}]\n关于${topic}的${style === "hook" ? "开场" : style === "takeaway" ? "总结" : "内容"}`,
			narration: `[填写关于${topic}的${style}部分旁白]`,
			...(comp === "Spotlight" ? { emphasis: isEmphasis } : { style }),
		});
	}

	return {
		composition: comp,
		voice: "zh-CN-YunxiNeural",
		rate: angleConfig.rate,
		authorName: "Lamarck",
		...defaults,
		sections,
	};
}

function main() {
	const args = process.argv.slice(2);

	const getArg = (name: string): string | undefined => {
		const idx = args.indexOf(`--${name}`);
		return idx !== -1 ? args[idx + 1] : undefined;
	};

	const topic = getArg("topic") || "AI";
	const angle = getArg("angle") || "explainer";
	const composition = getArg("composition");
	const output = getArg("output");

	if (!output) {
		console.log("Usage: npx tsx generate-spec.ts --topic <topic> --angle <angle> [--composition <comp>] --output <path>");
		console.log("");
		console.log("Angles: confession, humor, explainer, news");
		console.log("Compositions: AIInsight, NeuralViz, GradientFlow, Spotlight");
		process.exit(1);
	}

	const spec = generateTemplate(topic, angle, composition);
	writeFileSync(output, JSON.stringify(spec, null, 2) + "\n");

	console.log(`Generated spec template: ${output}`);
	console.log(`  Composition: ${spec.composition}`);
	console.log(`  Angle: ${angle}`);
	console.log(`  Sections: ${spec.sections.length}`);
	console.log(`  Rate: ${spec.rate}`);
	console.log("");
	console.log("Edit the sections to fill in actual content, then render:");
	console.log(`  npx tsx render-with-voice.ts --spec ${output} --output output.mp4`);
}

main();

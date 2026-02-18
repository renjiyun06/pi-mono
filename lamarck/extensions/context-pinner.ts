/**
 * Context Pinner Extension
 *
 * Pin important context that survives compaction via file persistence.
 * Pinned items are stored in a JSON file and automatically included
 * in the post-compaction restore message by memory-loader.
 *
 * Usage:
 *   pin_context — Pin text that must survive compaction
 *   list_pins — Show all current pins
 *   unpin_context — Remove a pin by index
 *
 * Storage: lamarck/vault/.pins.json
 * Budget: ~8000 chars total. Oldest pins dropped when exceeded.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { readFileSync, writeFileSync } from "fs";

const PINS_FILE = "/home/lamarck/pi-mono/lamarck/vault/.pins.json";
const MAX_PINNED_CHARS = 8000;

interface PinEntry {
	text: string;
	timestamp: number;
	label?: string;
}

function loadPins(): PinEntry[] {
	try {
		return JSON.parse(readFileSync(PINS_FILE, "utf-8"));
	} catch {
		return [];
	}
}

function savePins(pins: PinEntry[]): void {
	writeFileSync(PINS_FILE, JSON.stringify(pins, null, 2));
}

function getTotalChars(pins: PinEntry[]): number {
	return pins.reduce((sum, p) => sum + p.text.length, 0);
}

function enforceBudget(pins: PinEntry[]): void {
	while (getTotalChars(pins) > MAX_PINNED_CHARS && pins.length > 1) {
		pins.shift(); // Remove oldest
	}
}

function formatPin(pin: PinEntry, index: number): string {
	const date = new Date(pin.timestamp).toISOString().slice(0, 16);
	const label = pin.label ? ` [${pin.label}]` : "";
	const preview = pin.text.length > 200 ? `${pin.text.slice(0, 200)}...` : pin.text;
	return `[${index}]${label} (${date}, ${pin.text.length} chars):\n  ${preview}`;
}

/** Format pinned content for inclusion in post-compaction message */
export function formatPinnedContent(): string | null {
	const pins = loadPins();
	if (pins.length === 0) return null;
	return pins.map((p) => `- ${p.label ? `**${p.label}**: ` : ""}${p.text}`).join("\n");
}

export default function (pi: ExtensionAPI) {
	pi.tool({
		name: "pin_context",
		description:
			"Pin important context that must survive compaction. Stored in a file and included in post-compaction restore. Max ~8000 chars total.",
		parameters: {
			type: "object" as const,
			properties: {
				text: {
					type: "string" as const,
					description: "The text to preserve across compaction",
				},
				label: {
					type: "string" as const,
					description: "Optional short label for this pin",
				},
			},
			required: ["text"],
		},
		execute: async (_args) => {
			const args = _args as { text: string; label?: string };
			const pins = loadPins();
			pins.push({
				text: args.text,
				timestamp: Date.now(),
				label: args.label,
			});
			enforceBudget(pins);
			savePins(pins);
			return {
				output: `Pinned (${pins.length} total, ${getTotalChars(pins)}/${MAX_PINNED_CHARS} chars):\n${formatPin(pins[pins.length - 1], pins.length - 1)}`,
			};
		},
	});

	pi.tool({
		name: "list_pins",
		description: "List all currently pinned context items that survive compaction",
		parameters: { type: "object" as const, properties: {} },
		execute: async () => {
			const pins = loadPins();
			if (pins.length === 0) return { output: "No pinned context." };
			return {
				output: `${pins.length} pins (${getTotalChars(pins)}/${MAX_PINNED_CHARS} chars):\n\n${pins.map((p, i) => formatPin(p, i)).join("\n\n")}`,
			};
		},
	});

	pi.tool({
		name: "unpin_context",
		description: "Remove a pinned context item by index (0-based, from list_pins output)",
		parameters: {
			type: "object" as const,
			properties: {
				index: {
					type: "number" as const,
					description: "Index of the pin to remove",
				},
			},
			required: ["index"],
		},
		execute: async (_args) => {
			const args = _args as { index: number };
			const pins = loadPins();
			if (args.index < 0 || args.index >= pins.length) {
				return { output: `Invalid index ${args.index}. Valid range: 0-${pins.length - 1}` };
			}
			const removed = pins.splice(args.index, 1)[0];
			savePins(pins);
			return {
				output: `Removed: "${removed.label || removed.text.slice(0, 50)}". ${pins.length} pins remaining.`,
			};
		},
	});
}

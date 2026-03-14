import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { getLogger } from "@mariozechner/pi-logger";

const log = getLogger("debug-extension");

export default function (pi: ExtensionAPI) {
	pi.on("tool_call", async (event) => {
		// log.info({ toolName: event.toolName, toolCallId: event.toolCallId, input: event.input }, "tool_call");
	});

	pi.on("tool_execution_start", async (event) => {
		// log.info({ toolName: event.toolName, toolCallId: event.toolCallId, args: event.args }, "tool_execution_start");
	});

	pi.on("tool_execution_update", async (event) => {
		// log.info(
		// 	{ toolName: event.toolName, toolCallId: event.toolCallId, args: event.args, partialResult: event.partialResult },
		// 	"tool_execution_update"
		// );
	});

	pi.on("tool_execution_end", async (event) => {
		// log.info(
		// 	{ toolName: event.toolName, toolCallId: event.toolCallId, result: event.result, isError: event.isError },
		// 	"tool_execution_end"
		// );
	});

	pi.on("tool_result", async (event) => {
		// log.info(
		// 	{ toolName: event.toolName, toolCallId: event.toolCallId, input: event.input, content: event.content, details: event.details, isError: event.isError },
		// 	"tool_result"
		// );
	});
}

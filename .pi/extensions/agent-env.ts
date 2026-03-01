import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, _ctx) => {
    process.env.AGENT_PID = String(process.pid);
  });
}

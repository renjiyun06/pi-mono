import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { execSync } from "node:child_process";

export default function (pi: ExtensionAPI) {
  pi.on("session_shutdown", async (_event, _ctx) => {
    const agentPid = process.env.AGENT_PID;
    if (!agentPid) return;

    const realCli = "/home/lamarck/.nvm/versions/node/v22.22.0/bin/playwright-cli";

    // Close playwright-cli session to stop the daemon process
    try {
      execSync(`PLAYWRIGHT_CLI_SESSION=${agentPid} ${realCli} close`, {
        stdio: "ignore",
        env: { ...process.env, PLAYWRIGHT_CLI_SESSION: agentPid },
      });
    } catch {
      // Best effort
    }

    // Release Chrome instance
    try {
      execSync(
        `${process.cwd()}/lamarck/bin/chrome-manager.sh release ${agentPid}`,
        { stdio: "ignore" }
      );
    } catch {
      // Best effort
    }
  });
}

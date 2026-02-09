/**
 * Browser Cleanup Extension
 * 
 * Cleans up Chrome browser instances created by the mcporter wrapper script
 * when the pi process exits.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { existsSync, readFileSync, unlinkSync, rmSync } from "fs";
import { execSync } from "child_process";

const WINDOWS_IP = "172.30.144.1";

interface BrowserState {
  pi_pid: number;
  chrome_port: number;
  chrome_profile: string;
  mcporter_config: string;
  created_at: string;
}

export default function (pi: ExtensionAPI) {
  pi.on("session_shutdown", async (_event, ctx) => {
    const pid = process.pid;
    const stateFile = `/tmp/pi-browser-${pid}.json`;

    // Check if this pi process has a browser instance
    if (!existsSync(stateFile)) {
      return;
    }

    try {
      const state: BrowserState = JSON.parse(readFileSync(stateFile, "utf-8"));

      // 1. Kill ALL Chrome processes using this profile directory (including child processes)
      try {
        execSync(
          `powershell.exe -Command "Get-CimInstance Win32_Process | Where-Object { \\$_.CommandLine -like '*${state.chrome_profile}*' } | ForEach-Object { Stop-Process -Id \\$_.ProcessId -Force -ErrorAction SilentlyContinue }"`,
          { encoding: "utf-8", timeout: 15000 }
        );
        // Wait for processes to fully terminate
        execSync("sleep 2", { encoding: "utf-8" });
      } catch {
        // Ignore errors - Chrome might already be closed
      }

      // 2. Delete state file
      try {
        unlinkSync(stateFile);
      } catch {}

      // 3. Delete mcporter config
      try {
        if (existsSync(state.mcporter_config)) {
          unlinkSync(state.mcporter_config);
        }
      } catch {}

      // 4. Delete Chrome user data directory with retry
      const profilePath = `/mnt/d/chromes/${state.chrome_profile}`;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          if (!existsSync(profilePath)) break;
          // Use Windows command for faster deletion
          execSync(
            `cmd.exe /c "rmdir /s /q D:\\chromes\\${state.chrome_profile}"`,
            { encoding: "utf-8", timeout: 30000 }
          );
          if (!existsSync(profilePath)) break;
          // Still exists, wait and retry
          execSync("sleep 1", { encoding: "utf-8" });
        } catch {
          // Ignore errors, will retry
        }
      }

    } catch {
      // Silently ignore cleanup errors
    }
  });
}

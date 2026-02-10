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
      } catch {
        // Ignore errors - Chrome might already be closed
      }

      // 2. Kill mcporter daemon and its child chrome-devtools-mcp processes
      //    The daemon runs as: mcporter --config /tmp/mcporter-{pid}.json daemon start --foreground
      //    It spawns chrome-devtools-mcp stdio children (+ watchdog processes)
      //    Use full path to avoid substring matches (e.g. pid 123 matching mcporter-1234.json)
      try {
        // Match "--config /tmp/mcporter-{pid}.json " with trailing space to prevent
        // pid 123 from matching mcporter-1234.json
        const result = execSync(
          `pgrep -f -- "--config /tmp/mcporter-${pid}\\.json " 2>/dev/null || true`,
          { encoding: "utf-8", timeout: 5000 }
        ).trim();
        if (result) {
          for (const daemonPid of result.split("\n")) {
            const p = daemonPid.trim();
            if (!p) continue;
            // Kill all children first (chrome-devtools-mcp, watchdog), then the daemon
            try {
              execSync(`pkill -P ${p} 2>/dev/null || true`, { encoding: "utf-8", timeout: 5000 });
            } catch {}
            try {
              execSync(`kill ${p} 2>/dev/null || true`, { encoding: "utf-8", timeout: 5000 });
            } catch {}
          }
        }
      } catch {
        // Ignore errors
      }

      // Also kill any chrome-devtools-mcp processes connected to this exact port
      //    Match the full --browserUrl to avoid port prefix collisions (e.g. 1930 matching 19301)
      try {
        // Match exact port with word boundary (port followed by end-of-args or space)
        const result = execSync(
          `pgrep -f "chrome-devtools-mcp --browserUrl http://${WINDOWS_IP}:${state.chrome_port}( |$)" 2>/dev/null || true`,
          { encoding: "utf-8", timeout: 5000 }
        ).trim();
        if (result) {
          for (const cdpPid of result.split("\n")) {
            const p = cdpPid.trim();
            if (!p) continue;
            try {
              // Kill watchdog children first
              execSync(`pkill -P ${p} 2>/dev/null || true`, { encoding: "utf-8", timeout: 5000 });
            } catch {}
            try {
              execSync(`kill ${p} 2>/dev/null || true`, { encoding: "utf-8", timeout: 5000 });
            } catch {}
          }
        }
      } catch {
        // Ignore errors
      }

      // Wait for processes to fully terminate
      try { execSync("sleep 1", { encoding: "utf-8" }); } catch {}

      // 3. Delete state file
      try {
        unlinkSync(stateFile);
      } catch {}

      // 4. Delete mcporter config
      try {
        if (existsSync(state.mcporter_config)) {
          unlinkSync(state.mcporter_config);
        }
      } catch {}

      // 5. Delete Chrome user data directory with retry
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

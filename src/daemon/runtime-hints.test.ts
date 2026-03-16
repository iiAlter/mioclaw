import { describe, expect, it } from "vitest";
import { buildPlatformRuntimeLogHints, buildPlatformServiceStartHints } from "./runtime-hints.js";

describe("buildPlatformRuntimeLogHints", () => {
  it("renders launchd log hints on darwin", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "darwin",
        env: {
          OPENCLAW_STATE_DIR: "/tmp/mioclaw-state",
          OPENCLAW_LOG_PREFIX: "gateway",
        },
        systemdServiceName: "mioclaw-gateway",
        windowsTaskName: "Mioclaw Gateway",
      }),
    ).toEqual([
      "Launchd stdout (if installed): /tmp/mioclaw-state/logs/gateway.log",
      "Launchd stderr (if installed): /tmp/mioclaw-state/logs/gateway.err.log",
    ]);
  });

  it("renders systemd and windows hints by platform", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "linux",
        systemdServiceName: "mioclaw-gateway",
        windowsTaskName: "Mioclaw Gateway",
      }),
    ).toEqual(["Logs: journalctl --user -u mioclaw-gateway.service -n 200 --no-pager"]);
    expect(
      buildPlatformRuntimeLogHints({
        platform: "win32",
        systemdServiceName: "mioclaw-gateway",
        windowsTaskName: "Mioclaw Gateway",
      }),
    ).toEqual(['Logs: schtasks /Query /TN "Mioclaw Gateway" /V /FO LIST']);
  });
});

describe("buildPlatformServiceStartHints", () => {
  it("builds platform-specific service start hints", () => {
    expect(
      buildPlatformServiceStartHints({
        platform: "darwin",
        installCommand: "mioclaw gateway install",
        startCommand: "mioclaw gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.mioclaw.gateway.plist",
        systemdServiceName: "mioclaw-gateway",
        windowsTaskName: "Mioclaw Gateway",
      }),
    ).toEqual([
      "mioclaw gateway install",
      "mioclaw gateway",
      "launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.mioclaw.gateway.plist",
    ]);
    expect(
      buildPlatformServiceStartHints({
        platform: "linux",
        installCommand: "mioclaw gateway install",
        startCommand: "mioclaw gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.mioclaw.gateway.plist",
        systemdServiceName: "mioclaw-gateway",
        windowsTaskName: "Mioclaw Gateway",
      }),
    ).toEqual([
      "mioclaw gateway install",
      "mioclaw gateway",
      "systemctl --user start mioclaw-gateway.service",
    ]);
  });
});

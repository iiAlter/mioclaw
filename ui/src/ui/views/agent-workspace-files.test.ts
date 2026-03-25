import { describe, expect, it } from "vitest";
import {
  getAgentWorkspaceFileMeta,
  PRIMARY_WORKSPACE_FILE_NAMES,
  sortAgentWorkspaceFiles,
} from "./agent-workspace-files.ts";

describe("agent workspace files", () => {
  it("exposes the main editable workspace files in the intended order", () => {
    expect(PRIMARY_WORKSPACE_FILE_NAMES).toEqual([
      "SOUL.md",
      "TOOLS.md",
      "AGENTS.md",
      "IDENTITY.md",
      "HEARTBEAT.md",
    ]);
  });

  it("sorts known workspace files ahead of generic files", () => {
    const sorted = sortAgentWorkspaceFiles([
      { name: "z-last.md", path: "/tmp/z-last.md", missing: false },
      { name: "HEARTBEAT.md", path: "/tmp/HEARTBEAT.md", missing: false },
      { name: "AGENTS.md", path: "/tmp/AGENTS.md", missing: false },
      { name: "SOUL.md", path: "/tmp/SOUL.md", missing: false },
    ]);

    expect(sorted.map((entry) => entry.name)).toEqual([
      "SOUL.md",
      "AGENTS.md",
      "HEARTBEAT.md",
      "z-last.md",
    ]);
  });

  it("returns user-facing labels and descriptions for core files", () => {
    expect(getAgentWorkspaceFileMeta("TOOLS.md")).toEqual({
      label: "Tools",
      description: "Preferred tool usage, command habits, and execution guidance.",
    });
    expect(getAgentWorkspaceFileMeta("unknown.md")).toEqual({
      label: "unknown",
      description: "Workspace instruction file.",
    });
  });
});

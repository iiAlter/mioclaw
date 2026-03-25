import type { AgentFileEntry } from "../types.ts";

export const PRIMARY_WORKSPACE_FILE_NAMES = [
  "SOUL.md",
  "TOOLS.md",
  "AGENTS.md",
  "IDENTITY.md",
  "HEARTBEAT.md",
] as const;

const WORKSPACE_FILE_ORDER = [
  ...PRIMARY_WORKSPACE_FILE_NAMES,
  "USER.md",
  "BOOTSTRAP.md",
  "MEMORY.md",
  "memory.md",
] as const;

type AgentWorkspaceFileMeta = {
  label: string;
  description: string;
};

const WORKSPACE_FILE_META: Record<string, AgentWorkspaceFileMeta> = {
  "AGENTS.md": {
    label: "Agents",
    description: "Cross-agent rules, delegation, and collaboration guardrails.",
  },
  "SOUL.md": {
    label: "Soul",
    description: "Core persona, values, and response style for this workspace agent.",
  },
  "TOOLS.md": {
    label: "Tools",
    description: "Preferred tool usage, command habits, and execution guidance.",
  },
  "IDENTITY.md": {
    label: "Identity",
    description: "Name, self-description, and profile details surfaced in the UI.",
  },
  "HEARTBEAT.md": {
    label: "Heartbeat",
    description: "Recurring cadence, reminders, and self-check behavior.",
  },
  "USER.md": {
    label: "User",
    description: "Operator-specific preferences and local collaboration notes.",
  },
  "BOOTSTRAP.md": {
    label: "Bootstrap",
    description: "Initial onboarding instructions used before workspace setup is complete.",
  },
  "MEMORY.md": {
    label: "Memory",
    description: "Longer-lived workspace memory shared with the agent runtime.",
  },
  "memory.md": {
    label: "Memory",
    description: "Legacy lowercase memory file retained for compatibility.",
  },
};

export function getAgentWorkspaceFileMeta(name: string): AgentWorkspaceFileMeta {
  return (
    WORKSPACE_FILE_META[name] ?? {
      label: name.replace(/\.md$/i, ""),
      description: "Workspace instruction file.",
    }
  );
}

export function sortAgentWorkspaceFiles(files: readonly AgentFileEntry[]): AgentFileEntry[] {
  const rank = new Map<string, number>(WORKSPACE_FILE_ORDER.map((name, index) => [name, index]));
  return [...files].toSorted((left, right) => {
    const leftRank = rank.get(left.name) ?? Number.MAX_SAFE_INTEGER;
    const rightRank = rank.get(right.name) ?? Number.MAX_SAFE_INTEGER;
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }
    return left.name.localeCompare(right.name);
  });
}

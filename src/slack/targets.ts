// Stub for removed Slack channel
export interface SlackTarget {
  kind: "channel" | "user" | "group";
  id: string;
}
export function parseSlackTarget(target: string, _opts?: { defaultKind?: string }): SlackTarget {
  return { kind: "channel", id: target };
}

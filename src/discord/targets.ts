// Stub for removed Discord channel
export type DiscordTargetKind = "user" | "channel";

export interface DiscordTarget {
  kind: "user" | "group" | "channel";
  id: string;
}

export function parseDiscordTarget(
  target: string,
  _opts?: { defaultKind?: string },
): DiscordTarget {
  // Stub - returns empty target
  return { kind: "channel", id: target };
}

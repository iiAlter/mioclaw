// Stub for removed Discord channel
export function normalizeDiscordTarget(_target: string): { kind: string; value: string } | null {
  return null;
}

export function looksLikeDiscordTargetId(_value: string): boolean {
  return false;
}

export function normalizeDiscordChannelMention(_target: string): string {
  return "";
}

export function normalizeDiscordMessagingTarget(
  _target: string,
): { kind: string; value: string } | null {
  return null;
}

export function normalizeDiscordOutboundTarget(
  _target: string,
): { kind: string; value: string } | null {
  return null;
}

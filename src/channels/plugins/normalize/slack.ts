// Stub for removed Slack channel
export function normalizeSlackTarget(_target: string): { kind: string; value: string } | null {
  return null;
}

export function normalizeSlackChannelName(_name: string): string {
  return "";
}

export function looksLikeSlackTargetId(_value: string): boolean {
  return false;
}

export function normalizeSlackMessagingTarget(
  _target: string,
): { kind: string; value: string } | null {
  return null;
}

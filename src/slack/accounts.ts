// Stub for removed Slack channel
export interface SlackAccount {
  accountId: string;
  botToken?: string;
  userToken?: string;
  dm?: { groupChannels?: Array<string | number> };
  channels?: Record<string, unknown>;
}

export function resolveSlackAccount(_params: {
  cfg: unknown;
  accountId?: string | null;
}): SlackAccount {
  return { accountId: "", dm: {}, channels: {} };
}

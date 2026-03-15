// Stub for removed LINE channel
export interface LineConfig {
  accounts?: Record<string, unknown>;
}

export type LineAccount = {
  accountId: string;
  channelAccessToken?: string;
  channelSecret?: string;
};

export type ResolvedLineAccount = LineAccount;

export type LineGroup = {
  groupId: string;
};

export type LineUser = {
  userId: string;
};

export type LineChannelData = {
  accountId: string;
};

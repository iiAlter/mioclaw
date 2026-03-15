// Stub for removed iMessage channel
import type { OpenClawConfig } from "../config/config.js";

export type IMessageAccount = {
  accountId: string;
  handle?: string;
};

export type ResolvedIMessageAccount = IMessageAccount;

export function listIMessageAccountIds(_cfg: OpenClawConfig): string[] {
  return [];
}

export function resolveDefaultIMessageAccountId(_cfg: OpenClawConfig): string | null {
  return null;
}

export function resolveIMessageAccount(_params: {
  cfg: OpenClawConfig;
  accountId?: string;
}): IMessageAccount {
  return { accountId: "" };
}

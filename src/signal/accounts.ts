// Stub for removed Signal channel
import type { OpenClawConfig } from "../config/config.js";

export interface ResolvedSignalAccount {
  accountId: string;
  config?: { allowFrom?: string[] };
}

export function listSignalAccountIds(_cfg: OpenClawConfig): string[] {
  return [];
}

export function resolveDefaultSignalAccountId(_cfg: OpenClawConfig): string | null {
  return null;
}

export function resolveSignalAccount(_params: {
  cfg: OpenClawConfig;
  accountId?: string;
}): ResolvedSignalAccount {
  return { accountId: "" };
}

// Stub for removed Discord channel
import type { OpenClawConfig } from "../config/config.js";

export type DiscordAccount = {
  accountId: string;
  token?: string;
};

export type ResolvedDiscordAccount = DiscordAccount;

export function listDiscordAccountIds(_cfg: OpenClawConfig): string[] {
  return [];
}

export function resolveDefaultDiscordAccountId(_cfg: OpenClawConfig): string | null {
  return null;
}

export function resolveDiscordAccount(_params: {
  cfg: OpenClawConfig;
  accountId?: string;
}): DiscordAccount {
  return { accountId: "" };
}

export function inspectDiscordAccount(_params: {
  cfg: OpenClawConfig;
  accountId?: string;
}): Record<string, unknown> {
  return {};
}

export type InspectedDiscordAccount = Record<string, unknown>;

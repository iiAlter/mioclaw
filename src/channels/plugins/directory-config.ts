import type { OpenClawConfig } from "../../config/types.js";
import { mapAllowFromEntries } from "../../plugin-sdk/channel-config-helpers.js";
import { inspectTelegramAccount } from "../../telegram/account-inspect.js";
import { applyDirectoryQueryAndLimit, toDirectoryEntries } from "./directory-config-helpers.js";
import type { ChannelDirectoryEntry } from "./types.js";

export type DirectoryConfigParams = {
  cfg: OpenClawConfig;
  accountId?: string | null;
  query?: string | null;
  limit?: number | null;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _addAllowFromAndDmsIds(
  ids: Set<string>,
  allowFrom: readonly unknown[] | undefined,
  dms: Record<string, unknown> | undefined,
) {
  for (const entry of allowFrom ?? []) {
    const raw = String(entry).trim();
    if (!raw || raw === "*") {
      continue;
    }
    ids.add(raw);
  }
  for (const raw of Object.keys(dms ?? {})) {
    ids.add(raw);
  }
}

export async function listTelegramDirectoryPeersFromConfig(
  params: DirectoryConfigParams,
): Promise<ChannelDirectoryEntry[]> {
  const account = inspectTelegramAccount({ cfg: params.cfg, accountId: params.accountId });
  const raw = [
    ...mapAllowFromEntries(account.config.allowFrom),
    ...Object.keys(account.config.dms ?? {}),
  ];
  const ids = Array.from(
    new Set(
      raw
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => entry.replace(/^(telegram|tg):/i, "")),
    ),
  )
    .map((entry) => {
      const trimmed = entry.trim();
      if (!trimmed) {
        return null;
      }
      if (/^-?\d+$/.test(trimmed)) {
        return trimmed;
      }
      const withAt = trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
      return withAt;
    })
    .filter((id): id is string => Boolean(id));
  return toDirectoryEntries("user", applyDirectoryQueryAndLimit(ids, params));
}

export async function listTelegramDirectoryGroupsFromConfig(
  params: DirectoryConfigParams,
): Promise<ChannelDirectoryEntry[]> {
  const account = inspectTelegramAccount({ cfg: params.cfg, accountId: params.accountId });
  const ids = Object.keys(account.config.groups ?? {})
    .map((id) => id.trim())
    .filter((id) => Boolean(id) && id !== "*");
  return toDirectoryEntries("group", applyDirectoryQueryAndLimit(ids, params));
}

// Stub functions for removed channels (Discord, Slack, WhatsApp)
// These return empty results as the channels have been migrated to plugins

export async function listDiscordDirectoryPeersFromConfig(
  _params: DirectoryConfigParams,
): Promise<ChannelDirectoryEntry[]> {
  return [];
}

export async function listDiscordDirectoryGroupsFromConfig(
  _params: DirectoryConfigParams,
): Promise<ChannelDirectoryEntry[]> {
  return [];
}

export async function listSlackDirectoryPeersFromConfig(
  _params: DirectoryConfigParams,
): Promise<ChannelDirectoryEntry[]> {
  return [];
}

export async function listSlackDirectoryGroupsFromConfig(
  _params: DirectoryConfigParams,
): Promise<ChannelDirectoryEntry[]> {
  return [];
}

export async function listWhatsAppDirectoryPeersFromConfig(
  _params: DirectoryConfigParams,
): Promise<ChannelDirectoryEntry[]> {
  return [];
}

export async function listWhatsAppDirectoryGroupsFromConfig(
  _params: DirectoryConfigParams,
): Promise<ChannelDirectoryEntry[]> {
  return [];
}

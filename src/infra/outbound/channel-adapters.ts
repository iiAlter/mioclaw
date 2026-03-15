import type { TopLevelComponents } from "@buape/carbon";
import type { ChannelId } from "../../channels/plugins/types.js";
import type { OpenClawConfig } from "../../config/config.js";

export type CrossContextComponentsBuilder = (message: string) => TopLevelComponents[];

export type CrossContextComponentsFactory = (params: {
  originLabel: string;
  message: string;
  cfg: OpenClawConfig;
  accountId?: string | null;
}) => TopLevelComponents[];

export type ChannelMessageAdapter = {
  supportsComponentsV2: boolean;
  buildCrossContextComponents?: CrossContextComponentsFactory;
};

const DEFAULT_ADAPTER: ChannelMessageAdapter = {
  supportsComponentsV2: false,
};

// Stub for removed Discord channel
const DISCORD_ADAPTER: ChannelMessageAdapter = {
  supportsComponentsV2: false,
};

export function getChannelMessageAdapter(channel: ChannelId): ChannelMessageAdapter {
  if (channel === "discord") {
    return DISCORD_ADAPTER;
  }
  return DEFAULT_ADAPTER;
}

import { listChannelPlugins } from "../../channels/plugins/index.js";
import { telegramOnboardingAdapter } from "../../channels/plugins/onboarding/telegram.js";
// Stub adapters for removed channels
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _discordOnboardingAdapter = null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _imessageOnboardingAdapter = null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _signalOnboardingAdapter = null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _slackOnboardingAdapter = null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _whatsappOnboardingAdapter = null;
import type { ChannelChoice } from "../onboard-types.js";
import type { ChannelOnboardingAdapter } from "./types.js";

const BUILTIN_ONBOARDING_ADAPTERS: ChannelOnboardingAdapter[] = [
  telegramOnboardingAdapter,
  // Removed channels: whatsappOnboardingAdapter, discordOnboardingAdapter, slackOnboardingAdapter, signalOnboardingAdapter, imessageOnboardingAdapter
].filter(Boolean);

const CHANNEL_ONBOARDING_ADAPTERS = () => {
  const fromRegistry = listChannelPlugins()
    .map((plugin) => (plugin.onboarding ? ([plugin.id, plugin.onboarding] as const) : null))
    .filter((entry): entry is readonly [ChannelChoice, ChannelOnboardingAdapter] => Boolean(entry));

  // Fall back to built-in adapters to keep onboarding working even when the plugin registry
  // fails to populate (see #25545).
  const fromBuiltins = BUILTIN_ONBOARDING_ADAPTERS.map(
    (adapter) => [adapter.channel, adapter] as const,
  );

  return new Map<ChannelChoice, ChannelOnboardingAdapter>([...fromBuiltins, ...fromRegistry]);
};

export function getChannelOnboardingAdapter(
  channel: ChannelChoice,
): ChannelOnboardingAdapter | undefined {
  return CHANNEL_ONBOARDING_ADAPTERS().get(channel);
}

export function listChannelOnboardingAdapters(): ChannelOnboardingAdapter[] {
  return Array.from(CHANNEL_ONBOARDING_ADAPTERS().values());
}

// Legacy aliases (pre-rename).
export const getProviderOnboardingAdapter = getChannelOnboardingAdapter;
export const listProviderOnboardingAdapters = listChannelOnboardingAdapters;

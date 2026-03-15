// Stub for removed Signal channel
export type { ChannelMessageActionAdapter } from "../channels/plugins/types.js";
export type { ResolvedSignalAccount } from "../signal/accounts.js";
export * from "./channel-plugin-common.js";
export {
  listSignalAccountIds,
  resolveDefaultSignalAccountId,
  resolveSignalAccount,
} from "../signal/accounts.js";
export { formatTrimmedAllowFromEntries } from "./channel-config-helpers.js";
export {
  looksLikeSignalTargetId,
  normalizeSignalMessagingTarget,
} from "../channels/plugins/normalize/signal.js";

export {
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
} from "../config/runtime-group-policy.js";
export { SignalConfigSchema } from "../config/zod-schema.providers-core.js";

// Stub for removed Signal onboarding - return null for compatibility
export const signalOnboardingAdapter = null;

export { DEFAULT_ACCOUNT_ID, normalizeAccountId } from "../routing/session-key.js";
export {
  applyAccountNameToChannelSection,
  migrateBaseNameToDefaultAccount,
} from "../channels/plugins/setup-helpers.js";
export { buildChannelConfigSchema } from "../channels/plugins/config-schema.js";

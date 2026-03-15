// Stub for removed iMessage channel
export type { ResolvedIMessageAccount } from "../imessage/accounts.js";
export * from "./channel-plugin-common.js";
export {
  listIMessageAccountIds,
  resolveDefaultIMessageAccountId,
  resolveIMessageAccount,
} from "../imessage/accounts.js";
export {
  formatTrimmedAllowFromEntries,
  resolveIMessageConfigAllowFrom,
  resolveIMessageConfigDefaultTo,
} from "./channel-config-helpers.js";
export {
  looksLikeIMessageTargetId,
  normalizeIMessageMessagingTarget,
} from "../channels/plugins/normalize/imessage.js";

export {
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
} from "../config/runtime-group-policy.js";
export {
  resolveIMessageGroupRequireMention,
  resolveIMessageGroupToolPolicy,
} from "../channels/plugins/group-mentions.js";
export { IMessageConfigSchema } from "../config/zod-schema.providers-core.js";

// Stub for removed iMessage onboarding - return null for compatibility
export const imessageOnboardingAdapter = null;

export { DEFAULT_ACCOUNT_ID, normalizeAccountId } from "../routing/session-key.js";
export {
  applyAccountNameToChannelSection,
  migrateBaseNameToDefaultAccount,
} from "../channels/plugins/setup-helpers.js";
export { buildChannelConfigSchema } from "../channels/plugins/config-schema.js";

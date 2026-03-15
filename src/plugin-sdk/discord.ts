// Stub for removed Discord channel
export type { ChannelMessageActionAdapter } from "../channels/plugins/types.js";
export type { OpenClawConfig } from "../config/config.js";
export type { InspectedDiscordAccount } from "../discord/account-inspect.js";
export type { ResolvedDiscordAccount } from "../discord/accounts.js";
export * from "./channel-plugin-common.js";

export {
  listDiscordAccountIds,
  resolveDefaultDiscordAccountId,
  resolveDiscordAccount,
} from "../discord/accounts.js";
export { inspectDiscordAccount } from "../discord/account-inspect.js";
export {
  projectCredentialSnapshotFields,
  resolveConfiguredFromCredentialStatuses,
} from "../channels/account-snapshot-fields.js";
export {
  listDiscordDirectoryGroupsFromConfig,
  listDiscordDirectoryPeersFromConfig,
} from "../channels/plugins/directory-config.js";
export {
  looksLikeDiscordTargetId,
  normalizeDiscordMessagingTarget,
  normalizeDiscordOutboundTarget,
} from "../channels/plugins/normalize/discord.js";
export { collectDiscordAuditChannelIds } from "../discord/audit.js";
export { collectDiscordStatusIssues } from "../channels/plugins/status-issues/discord.js";

export {
  resolveDefaultGroupPolicy,
  resolveOpenProviderRuntimeGroupPolicy,
} from "../config/runtime-group-policy.js";
export {
  resolveDiscordGroupRequireMention,
  resolveDiscordGroupToolPolicy,
} from "../channels/plugins/group-mentions.js";
export { DiscordConfigSchema } from "../config/zod-schema.providers-core.js";

// Stub for removed Discord onboarding - return null for compatibility
export const discordOnboardingAdapter = null;

// Re-export from status-helpers for compatibility
export {
  buildComputedAccountStatusSnapshot,
  buildTokenChannelStatusSummary,
} from "./status-helpers.js";

export { DEFAULT_ACCOUNT_ID, normalizeAccountId } from "../routing/session-key.js";
export {
  applyAccountNameToChannelSection,
  migrateBaseNameToDefaultAccount,
} from "../channels/plugins/setup-helpers.js";
export { buildChannelConfigSchema } from "../channels/plugins/config-schema.js";

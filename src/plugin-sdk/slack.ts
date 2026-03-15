// Slack plugin SDK - stub exports for migrated channel
// The Slack channel has been migrated to a plugin

import type { OpenClawConfig } from "../config/config.js";
export type { OpenClawConfig };
export * from "./channel-plugin-common.js";
export {
  projectCredentialSnapshotFields,
  resolveConfiguredFromCredentialStatuses,
  resolveConfiguredFromRequiredCredentialStatuses,
} from "../channels/account-snapshot-fields.js";
export {
  listSlackDirectoryGroupsFromConfig,
  listSlackDirectoryPeersFromConfig,
} from "../channels/plugins/directory-config.js";
export {
  looksLikeSlackTargetId,
  normalizeSlackMessagingTarget,
} from "../channels/plugins/normalize/slack.js";
export { buildComputedAccountStatusSnapshot } from "./status-helpers.js";

export {
  resolveDefaultGroupPolicy,
  resolveOpenProviderRuntimeGroupPolicy,
} from "../config/runtime-group-policy.js";
export {
  resolveSlackGroupRequireMention,
  resolveSlackGroupToolPolicy,
} from "../channels/plugins/group-mentions.js";
export { SlackConfigSchema } from "../config/zod-schema.providers-core.js";

export interface SlackAccount {
  accountId: string;
  botToken?: string;
  userToken?: string;
}

export function resolveSlackAccount(_params: {
  cfg: OpenClawConfig;
  accountId?: string;
}): SlackAccount {
  return { accountId: "" };
}

export function inspectSlackAccount(_params: {
  cfg: OpenClawConfig;
  accountId?: string;
}): Record<string, unknown> {
  return {};
}

export function handleSlackMessageAction(_params: Record<string, unknown>): unknown {
  return null;
}

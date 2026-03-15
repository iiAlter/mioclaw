import { resolveEffectiveMessagesConfig, resolveHumanDelayConfig } from "../../agents/identity.js";
import { handleSlackAction } from "../../agents/tools/slack-actions.js";
import {
  chunkByNewline,
  chunkMarkdownText,
  chunkMarkdownTextWithMode,
  chunkText,
  chunkTextWithMode,
  resolveChunkMode,
  resolveTextChunkLimit,
} from "../../auto-reply/chunk.js";
import {
  hasControlCommand,
  isControlCommandMessage,
  shouldComputeCommandAuthorized,
} from "../../auto-reply/command-detection.js";
import { shouldHandleTextCommands } from "../../auto-reply/commands-registry.js";
import { withReplyDispatcher } from "../../auto-reply/dispatch.js";
import {
  formatAgentEnvelope,
  formatInboundEnvelope,
  resolveEnvelopeFormatOptions,
} from "../../auto-reply/envelope.js";
import {
  createInboundDebouncer,
  resolveInboundDebounceMs,
} from "../../auto-reply/inbound-debounce.js";
import { dispatchReplyFromConfig } from "../../auto-reply/reply/dispatch-from-config.js";
import { finalizeInboundContext } from "../../auto-reply/reply/inbound-context.js";
import {
  buildMentionRegexes,
  matchesMentionPatterns,
  matchesMentionWithExplicit,
} from "../../auto-reply/reply/mentions.js";
import { dispatchReplyWithBufferedBlockDispatcher } from "../../auto-reply/reply/provider-dispatcher.js";
import { createReplyDispatcherWithTyping } from "../../auto-reply/reply/reply-dispatcher.js";
import { removeAckReactionAfterReply, shouldAckReaction } from "../../channels/ack-reactions.js";
import { resolveCommandAuthorizedFromAuthorizers } from "../../channels/command-gating.js";
// Stub for removed channels
const discordMessageActions = null;
const signalMessageActions = null;
import { telegramMessageActions } from "../../channels/plugins/actions/telegram.js";
import { recordInboundSession } from "../../channels/session.js";
import {
  resolveChannelGroupPolicy,
  resolveChannelGroupRequireMention,
} from "../../config/group-policy.js";
import { resolveMarkdownTableMode } from "../../config/markdown-tables.js";
import {
  readSessionUpdatedAt,
  recordSessionMetaFromInbound,
  resolveStorePath,
  updateLastRoute,
} from "../../config/sessions.js";
import { getChannelActivity, recordChannelActivity } from "../../infra/channel-activity.js";
import { convertMarkdownTables } from "../../markdown/tables.js";
import { fetchRemoteMedia } from "../../media/fetch.js";
import { saveMediaBuffer } from "../../media/store.js";
import { buildPairingReply } from "../../pairing/pairing-messages.js";
import {
  readChannelAllowFromStore,
  upsertChannelPairingRequest,
} from "../../pairing/pairing-store.js";
import { buildAgentSessionKey, resolveAgentRoute } from "../../routing/resolve-route.js";

// Stub for removed channels
function auditDiscordChannelPermissions() {
  return null;
}
function listDiscordDirectoryGroupsLive() {
  return [];
}
function listDiscordDirectoryPeersLive() {
  return [];
}
function monitorDiscordProvider() {
  return null;
}
function probeDiscord() {
  return null;
}
function resolveDiscordChannelAllowlist() {
  return [];
}
function resolveDiscordUserAllowlist() {
  return [];
}
function sendMessageDiscord() {
  return null;
}
function sendPollDiscord() {
  return null;
}
function monitorIMessageProvider() {
  return null;
}
function probeIMessage() {
  return null;
}
function sendMessageIMessage() {
  return null;
}
function listLineAccountIds() {
  return [];
}
function normalizeLineAccountId() {
  return "";
}
function resolveDefaultLineAccountId() {
  return "";
}
function resolveLineAccount() {
  return null;
}
function monitorLineProvider() {
  return null;
}
function probeLineBot() {
  return null;
}
function createQuickReplyItems() {
  return [];
}
function pushFlexMessage() {
  return null;
}
function pushLocationMessage() {
  return null;
}
function pushMessageLine() {
  return null;
}
function pushMessagesLine() {
  return null;
}
function pushTemplateMessage() {
  return null;
}
function pushTextMessageWithQuickReplies() {
  return null;
}
function sendMessageLine() {
  return null;
}
function buildTemplateMessageFromPayload() {
  return null;
}
function monitorSignalProvider() {
  return null;
}
function probeSignal() {
  return null;
}
function sendMessageSignal() {
  return null;
}
function listSlackDirectoryGroupsLive() {
  return [];
}
function listSlackDirectoryPeersLive() {
  return [];
}
function monitorSlackProvider() {
  return null;
}
function probeSlack() {
  return null;
}
function resolveSlackChannelAllowlist() {
  return [];
}
function resolveSlackUserAllowlist() {
  return [];
}
function sendMessageSlack() {
  return null;
}
import {
  auditTelegramGroupMembership,
  collectTelegramUnmentionedGroupIds,
} from "../../telegram/audit.js";
import { monitorTelegramProvider } from "../../telegram/monitor.js";
import { probeTelegram } from "../../telegram/probe.js";
import { sendMessageTelegram, sendPollTelegram } from "../../telegram/send.js";
import { resolveTelegramToken } from "../../telegram/token.js";
import { createRuntimeWhatsApp } from "./runtime-whatsapp.js";
import type { PluginRuntime } from "./types.js";

export function createRuntimeChannel(): PluginRuntime["channel"] {
  return {
    text: {
      chunkByNewline,
      chunkMarkdownText,
      chunkMarkdownTextWithMode,
      chunkText,
      chunkTextWithMode,
      resolveChunkMode,
      resolveTextChunkLimit,
      hasControlCommand,
      resolveMarkdownTableMode,
      convertMarkdownTables,
    },
    reply: {
      dispatchReplyWithBufferedBlockDispatcher,
      createReplyDispatcherWithTyping,
      resolveEffectiveMessagesConfig,
      resolveHumanDelayConfig,
      dispatchReplyFromConfig,
      withReplyDispatcher,
      finalizeInboundContext,
      formatAgentEnvelope,
      /** @deprecated Prefer `BodyForAgent` + structured user-context blocks (do not build plaintext envelopes for prompts). */
      formatInboundEnvelope,
      resolveEnvelopeFormatOptions,
    },
    routing: {
      buildAgentSessionKey,
      resolveAgentRoute,
    },
    pairing: {
      buildPairingReply,
      readAllowFromStore: ({ channel, accountId, env }) =>
        readChannelAllowFromStore(channel, env, accountId),
      upsertPairingRequest: ({ channel, id, accountId, meta, env, pairingAdapter }) =>
        upsertChannelPairingRequest({
          channel,
          id,
          accountId,
          meta,
          env,
          pairingAdapter,
        }),
    },
    media: {
      fetchRemoteMedia,
      saveMediaBuffer,
    },
    activity: {
      record: recordChannelActivity,
      get: getChannelActivity,
    },
    session: {
      resolveStorePath,
      readSessionUpdatedAt,
      recordSessionMetaFromInbound,
      recordInboundSession,
      updateLastRoute,
    },
    mentions: {
      buildMentionRegexes,
      matchesMentionPatterns,
      matchesMentionWithExplicit,
    },
    reactions: {
      shouldAckReaction,
      removeAckReactionAfterReply,
    },
    groups: {
      resolveGroupPolicy: resolveChannelGroupPolicy,
      resolveRequireMention: resolveChannelGroupRequireMention,
    },
    debounce: {
      createInboundDebouncer,
      resolveInboundDebounceMs,
    },
    commands: {
      resolveCommandAuthorizedFromAuthorizers,
      isControlCommandMessage,
      shouldComputeCommandAuthorized,
      shouldHandleTextCommands,
    },
    discord: {
      messageActions: discordMessageActions,
      auditChannelPermissions: auditDiscordChannelPermissions,
      listDirectoryGroupsLive: listDiscordDirectoryGroupsLive,
      listDirectoryPeersLive: listDiscordDirectoryPeersLive,
      probeDiscord,
      resolveChannelAllowlist: resolveDiscordChannelAllowlist,
      resolveUserAllowlist: resolveDiscordUserAllowlist,
      sendMessageDiscord,
      sendPollDiscord,
      monitorDiscordProvider,
    },
    slack: {
      listDirectoryGroupsLive: listSlackDirectoryGroupsLive,
      listDirectoryPeersLive: listSlackDirectoryPeersLive,
      probeSlack,
      resolveChannelAllowlist: resolveSlackChannelAllowlist,
      resolveUserAllowlist: resolveSlackUserAllowlist,
      sendMessageSlack,
      monitorSlackProvider,
      handleSlackAction,
    },
    telegram: {
      auditGroupMembership: auditTelegramGroupMembership,
      collectUnmentionedGroupIds: collectTelegramUnmentionedGroupIds,
      probeTelegram,
      resolveTelegramToken,
      sendMessageTelegram,
      sendPollTelegram,
      monitorTelegramProvider,
      messageActions: telegramMessageActions,
    },
    signal: {
      probeSignal,
      sendMessageSignal,
      monitorSignalProvider,
      messageActions: signalMessageActions,
    },
    imessage: {
      monitorIMessageProvider,
      probeIMessage,
      sendMessageIMessage,
    },
    whatsapp: createRuntimeWhatsApp(),
    line: {
      listLineAccountIds,
      resolveDefaultLineAccountId,
      resolveLineAccount,
      normalizeAccountId: normalizeLineAccountId,
      probeLineBot,
      sendMessageLine,
      pushMessageLine,
      pushMessagesLine,
      pushFlexMessage,
      pushTemplateMessage,
      pushLocationMessage,
      pushTextMessageWithQuickReplies,
      createQuickReplyItems,
      buildTemplateMessageFromPayload,
      monitorLineProvider,
    },
  };
}

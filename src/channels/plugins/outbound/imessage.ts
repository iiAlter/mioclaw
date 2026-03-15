// Stub for removed iMessage channel
import type { ChannelOutboundAdapter } from "../types.js";
export type { ChannelMessageActionAdapter } from "../types.js";

export function iMessageOutboundAdapter(): null {
  return null;
}

export const imessageOutbound: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  sendPayload: async () => ({
    ok: false,
    error: "iMessage channel removed",
    channel: "none",
    messageId: "",
  }),
};

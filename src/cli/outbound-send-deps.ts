import type { OutboundSendDeps } from "../infra/outbound/deliver.js";
import {
  createOutboundSendDepsFromCliSource,
  type CliOutboundSendSource,
} from "./outbound-send-mapping.js";

// Removed channels don't need to be required
export type CliDeps = {
  sendMessageWhatsApp: CliOutboundSendSource["sendMessageWhatsApp"];
  sendMessageTelegram: CliOutboundSendSource["sendMessageTelegram"];
  sendMessageDiscord?: CliOutboundSendSource["sendMessageDiscord"];
  sendMessageSlack?: CliOutboundSendSource["sendMessageSlack"];
  sendMessageSignal?: CliOutboundSendSource["sendMessageSignal"];
  sendMessageIMessage?: CliOutboundSendSource["sendMessageIMessage"];
};

export function createOutboundSendDeps(deps: CliDeps): OutboundSendDeps {
  return createOutboundSendDepsFromCliSource(deps as CliOutboundSendSource);
}

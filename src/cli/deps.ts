import type { sendMessageWhatsApp } from "../channels/web/index.js";
import type { sendMessageTelegram } from "../telegram/send.js";

export type CliDeps = {
  sendMessageWhatsApp: typeof sendMessageWhatsApp;
  sendMessageTelegram: typeof sendMessageTelegram;
};

let telegramSenderRuntimePromise: Promise<typeof import("./deps-send-telegram.runtime.js")> | null =
  null;

function loadTelegramSenderRuntime() {
  telegramSenderRuntimePromise ??= import("./deps-send-telegram.runtime.js");
  return telegramSenderRuntimePromise;
}

export function createDefaultDeps(): CliDeps {
  return {
    sendMessageWhatsApp: async (...args) => {
      const { sendMessageWhatsApp } = await import("../channels/web/index.js");
      return await sendMessageWhatsApp(...args);
    },
    sendMessageTelegram: async (...args) => {
      const { sendMessageTelegram } = await loadTelegramSenderRuntime();
      return await sendMessageTelegram(...args);
    },
  };
}

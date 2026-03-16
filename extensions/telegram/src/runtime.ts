import { createPluginRuntimeStore } from "mioclaw/plugin-sdk/compat";
import type { PluginRuntime } from "mioclaw/plugin-sdk/telegram";

const { setRuntime: setTelegramRuntime, getRuntime: getTelegramRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Telegram runtime not initialized");
export { getTelegramRuntime, setTelegramRuntime };

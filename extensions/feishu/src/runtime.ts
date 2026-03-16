import { createPluginRuntimeStore } from "mioclaw/plugin-sdk/compat";
import type { PluginRuntime } from "mioclaw/plugin-sdk/feishu";

const { setRuntime: setFeishuRuntime, getRuntime: getFeishuRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Feishu runtime not initialized");
export { getFeishuRuntime, setFeishuRuntime };

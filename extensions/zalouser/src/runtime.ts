import { createPluginRuntimeStore } from "mioclaw/plugin-sdk/compat";
import type { PluginRuntime } from "mioclaw/plugin-sdk/zalouser";

const { setRuntime: setZalouserRuntime, getRuntime: getZalouserRuntime } =
  createPluginRuntimeStore<PluginRuntime>("Zalouser runtime not initialized");
export { getZalouserRuntime, setZalouserRuntime };

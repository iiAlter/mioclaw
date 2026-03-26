import type { UsageSessionEntry } from "./usageTypes.ts";

export function resolvePrimaryModelUsage(
  session: UsageSessionEntry,
  usage: UsageSessionEntry["usage"] = session.usage,
) {
  const entries = usage?.modelUsage ?? [];
  if (entries.length === 0) {
    return null;
  }

  const provider = session.modelProvider ?? session.providerOverride;
  const model = session.model;

  const exact = entries.find(
    (entry) =>
      entry.model === model && (provider ? (entry.provider ?? undefined) === provider : true),
  );
  if (exact) {
    return exact;
  }

  const modelOnly = model ? entries.find((entry) => entry.model === model) : null;
  if (modelOnly) {
    return modelOnly;
  }

  return entries[0] ?? null;
}

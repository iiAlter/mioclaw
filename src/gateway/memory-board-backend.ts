import { randomUUID } from "node:crypto";
import fsSync from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { OpenClawConfig } from "../config/config.js";

const MEMORY_CATEGORIES = [
  "preference",
  "fact",
  "decision",
  "entity",
  "reflection",
  "other",
] as const;

export type MemoryBoardCategory = (typeof MEMORY_CATEGORIES)[number];

export type MemoryBoardMemory = {
  id: string;
  text: string;
  category: string;
  scope: string;
  importance: number;
  timestamp: number;
  abstract: string;
  overview: string;
  metadata: Record<string, unknown>;
};

export type MemoryBoardStats = {
  total: number;
  byCategory: Record<string, number>;
};

export class MemoryBoardBackendError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
  }
}

export interface MemoryBoardBackend {
  list(params: { q?: string; category?: string }): Promise<MemoryBoardMemory[]>;
  create(input: {
    text?: string;
    category?: string;
    scope?: string;
    importance?: number;
  }): Promise<MemoryBoardMemory>;
  update(
    id: string,
    input: {
      text?: string;
      category?: string;
      importance?: number;
      scope?: string;
    },
  ): Promise<MemoryBoardMemory | null>;
  delete(id: string): Promise<boolean>;
  export(): Promise<MemoryBoardMemory[]>;
  import(input: { memories: Array<Record<string, unknown>> }): Promise<{ imported: number }>;
  stats(): Promise<MemoryBoardStats>;
  categories(): Array<{ name: string }>;
}

type LanceDbProStore = {
  list(
    scopeFilter?: string[],
    category?: string,
    limit?: number,
    offset?: number,
  ): Promise<Array<Record<string, unknown>>>;
  stats(): Promise<{
    totalCount: number;
    categoryCounts: Record<string, number>;
  }>;
  delete(id: string): Promise<boolean>;
  importEntry(entry: Record<string, unknown>): Promise<Record<string, unknown>>;
  hasId(id: string): Promise<boolean>;
};

type LanceDbProStoreFactory = new (config: {
  dbPath: string;
  vectorDim: number;
}) => LanceDbProStore;

function resolveActiveMemoryPluginId(config?: OpenClawConfig): string | null {
  if (config?.plugins?.enabled === false) {
    return null;
  }
  const raw = typeof config?.plugins?.slots?.memory === "string" ? config.plugins.slots.memory : "";
  const normalized = raw.trim();
  if (!normalized) {
    return "memory-core";
  }
  if (normalized.toLowerCase() === "none") {
    return null;
  }
  return normalized;
}

function parseMemoryMetadata(raw: unknown): Record<string, unknown> {
  if (!raw) {
    return {};
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
}

function formatMemoryRecord(record: Record<string, unknown>): MemoryBoardMemory {
  const metadata = parseMemoryMetadata(record.metadata);
  const text = typeof record.text === "string" ? record.text : "";
  return {
    id: typeof record.id === "string" ? record.id : "",
    text,
    category: typeof record.category === "string" && record.category ? record.category : "other",
    scope: typeof record.scope === "string" && record.scope ? record.scope : "global",
    importance:
      typeof record.importance === "number" && Number.isFinite(record.importance)
        ? record.importance
        : 0.5,
    timestamp:
      typeof record.timestamp === "number" && Number.isFinite(record.timestamp)
        ? record.timestamp
        : Date.now(),
    abstract:
      typeof metadata.l0_abstract === "string" && metadata.l0_abstract
        ? metadata.l0_abstract
        : text.slice(0, 100),
    overview: typeof metadata.l1_overview === "string" ? metadata.l1_overview : "",
    metadata,
  };
}

function summarizeExecError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "unknown error";
  }
  const stderr =
    typeof (error as Error & { stderr?: unknown }).stderr === "string"
      ? ((error as Error & { stderr?: string }).stderr ?? "").trim()
      : "";
  if (stderr) {
    return stderr;
  }
  return error.message || "unknown error";
}

function resolvePluginRoot(pluginId: string): string | null {
  const candidates = [
    path.join(homedir(), ".mioclaw", "extensions", pluginId),
    path.join(homedir(), ".mioclaw", "workspace-main", "plugins", pluginId),
  ];
  for (const candidate of candidates) {
    if (fsSync.existsSync(path.join(candidate, "package.json"))) {
      return candidate;
    }
  }
  return null;
}

function resolveLanceDbProRuntime(
  pluginRoot: string,
): { jitiUrl: string; storePath: string } | null {
  const storePath = path.join(pluginRoot, "src", "store.ts");
  const jitiPath = path.join(pluginRoot, "node_modules", "jiti", "lib", "jiti.mjs");
  if (!fsSync.existsSync(storePath) || !fsSync.existsSync(jitiPath)) {
    return null;
  }
  return {
    jitiUrl: pathToFileURL(jitiPath).href,
    storePath,
  };
}

class UnsupportedMemoryBoardBackend implements MemoryBoardBackend {
  constructor(
    private readonly pluginId: string | null,
    private readonly reason: string,
  ) {}

  private fail(): never {
    const label = this.pluginId ? `memory plugin "${this.pluginId}"` : "memory plugins";
    throw new MemoryBoardBackendError(`${label} ${this.reason}`, 501);
  }

  async list(): Promise<MemoryBoardMemory[]> {
    this.fail();
  }
  async create(): Promise<MemoryBoardMemory> {
    this.fail();
  }
  async update(): Promise<MemoryBoardMemory | null> {
    this.fail();
  }
  async delete(): Promise<boolean> {
    this.fail();
  }
  async export(): Promise<MemoryBoardMemory[]> {
    this.fail();
  }
  async import(): Promise<{ imported: number }> {
    this.fail();
  }
  async stats(): Promise<MemoryBoardStats> {
    this.fail();
  }
  categories(): Array<{ name: string }> {
    return MEMORY_CATEGORIES.map((name) => ({ name }));
  }
}

class LanceDbProMemoryBoardBackend implements MemoryBoardBackend {
  private storeFactoryPromise: Promise<LanceDbProStoreFactory> | null = null;

  constructor(
    private readonly runtime: {
      pluginRoot: string;
      jitiUrl: string;
      storePath: string;
      loadStoreFactory?: () => Promise<LanceDbProStoreFactory>;
    },
    private readonly dbPath: string,
  ) {}

  private async getStoreFactory() {
    if (!this.storeFactoryPromise) {
      this.storeFactoryPromise = (async () => {
        if (this.runtime.loadStoreFactory) {
          return await this.runtime.loadStoreFactory();
        }
        const jitiModule = (await import(this.runtime.jitiUrl)) as {
          createJiti: (
            id: string,
            options?: Record<string, unknown>,
          ) => { import: <T>(id: string) => Promise<T> };
        };
        const jiti = jitiModule.createJiti(import.meta.url, {
          moduleCache: false,
          fsCache: false,
        });
        const storeModule = await jiti.import(this.runtime.storePath);
        if (!storeModule.MemoryStore) {
          throw new Error("MemoryStore export not found");
        }
        return storeModule.MemoryStore;
      })();
    }
    try {
      return await this.storeFactoryPromise;
    } catch (error) {
      this.storeFactoryPromise = null;
      throw new MemoryBoardBackendError(
        `Failed to load memory-lancedb-pro store: ${summarizeExecError(error)}`,
        503,
      );
    }
  }

  private async withStore<T>(run: (store: LanceDbProStore) => Promise<T>): Promise<T> {
    const MemoryStore = await this.getStoreFactory();
    const store = new MemoryStore({ dbPath: this.dbPath, vectorDim: 768 });
    return await run(store);
  }

  async list(params: { q?: string; category?: string }): Promise<MemoryBoardMemory[]> {
    const records = await this.withStore((store) =>
      store.list(undefined, params.category, 1000, 0),
    );
    const formatted = records.map((record) => formatMemoryRecord(record));
    if (!params.q) {
      return formatted;
    }
    const needle = params.q.toLowerCase();
    return formatted.filter((memory) => memory.text.toLowerCase().includes(needle));
  }

  async create(input: {
    text?: string;
    category?: string;
    scope?: string;
    importance?: number;
  }): Promise<MemoryBoardMemory> {
    const created = await this.withStore((store) =>
      store.importEntry({
        id: randomUUID(),
        text: input.text ?? "",
        category: input.category ?? "other",
        scope: input.scope ?? "global",
        importance: input.importance ?? 0.5,
        timestamp: Date.now(),
        vector: Array.from({ length: 768 }).fill(0),
        metadata: JSON.stringify({
          l0_abstract: (input.text ?? "").slice(0, 100),
          l1_overview: (input.text ?? "").slice(0, 500),
        }),
      }),
    );
    return formatMemoryRecord(created);
  }

  async update(
    id: string,
    input: {
      text?: string;
      category?: string;
      importance?: number;
      scope?: string;
    },
  ): Promise<MemoryBoardMemory | null> {
    const existing = (await this.list({})).find((memory) => memory.id === id);
    if (!existing) {
      return null;
    }
    await this.withStore((store) => store.delete(id));
    const updated = await this.withStore((store) =>
      store.importEntry({
        id,
        text: input.text ?? existing.text,
        category: input.category ?? existing.category,
        scope: input.scope ?? existing.scope,
        importance: input.importance ?? existing.importance,
        timestamp: existing.timestamp,
        vector: Array.from({ length: 768 }).fill(0),
        metadata: JSON.stringify({
          ...existing.metadata,
          l0_abstract: (input.text ?? existing.text).slice(0, 100),
          l1_overview: (input.text ?? existing.text).slice(0, 500),
        }),
      }),
    );
    return formatMemoryRecord(updated);
  }

  async delete(id: string): Promise<boolean> {
    return await this.withStore((store) => store.delete(id));
  }

  async export(): Promise<MemoryBoardMemory[]> {
    return await this.list({});
  }

  async import(input: { memories: Array<Record<string, unknown>> }): Promise<{ imported: number }> {
    let imported = 0;
    for (const memory of input.memories) {
      const id = typeof memory.id === "string" && memory.id ? memory.id : randomUUID();
      if (await this.withStore((store) => store.hasId(id))) {
        continue;
      }
      await this.withStore((store) =>
        store.importEntry({
          id,
          text: typeof memory.text === "string" ? memory.text : "",
          category: typeof memory.category === "string" ? memory.category : "other",
          scope: typeof memory.scope === "string" ? memory.scope : "global",
          importance: typeof memory.importance === "number" ? memory.importance : 0.5,
          timestamp: typeof memory.timestamp === "number" ? memory.timestamp : Date.now(),
          vector:
            Array.isArray(memory.vector) && memory.vector.length === 768
              ? memory.vector
              : Array.from({ length: 768 }).fill(0),
          metadata:
            typeof memory.metadata === "string"
              ? memory.metadata
              : JSON.stringify(memory.metadata ?? {}),
        }),
      );
      imported += 1;
    }
    return { imported };
  }

  async stats(): Promise<MemoryBoardStats> {
    const stats = (await this.withStore((store) => store.stats())) as {
      totalCount: number;
      categoryCounts: Record<string, number>;
    };
    return { total: stats.totalCount, byCategory: stats.categoryCounts };
  }

  categories(): Array<{ name: string }> {
    return MEMORY_CATEGORIES.map((name) => ({ name }));
  }
}

export function createMemoryBoardBackend(params: {
  config?: OpenClawConfig;
  argv1?: string;
  moduleUrl?: string;
  cwd?: string;
  pluginRootResolver?: (pluginId: string) => string | null;
  lanceDbProRuntimeResolver?: (pluginRoot: string) => { jitiUrl: string; storePath: string } | null;
  lanceDbProStoreFactoryLoader?: () => Promise<LanceDbProStoreFactory>;
}): MemoryBoardBackend {
  const pluginId = resolveActiveMemoryPluginId(params.config);
  if (!pluginId) {
    return new UnsupportedMemoryBoardBackend(null, "are disabled");
  }
  if (pluginId === "memory-core") {
    return new UnsupportedMemoryBoardBackend(
      pluginId,
      "does not expose Memory Board management operations",
    );
  }

  if (pluginId === "memory-lancedb-pro") {
    const pluginRoot = (params.pluginRootResolver ?? resolvePluginRoot)(pluginId);
    const dbPathRaw = params.config?.plugins?.entries?.["memory-lancedb-pro"]?.config as
      | { dbPath?: unknown }
      | undefined;
    const dbPath =
      typeof dbPathRaw?.dbPath === "string" && dbPathRaw.dbPath.trim()
        ? dbPathRaw.dbPath.replace(/^~(?=\/)/, homedir())
        : path.join(homedir(), ".mioclaw", "memory", "lancedb-pro");
    if (!pluginRoot) {
      return new UnsupportedMemoryBoardBackend(pluginId, "plugin files could not be resolved");
    }
    const runtime = (params.lanceDbProRuntimeResolver ?? resolveLanceDbProRuntime)(pluginRoot);
    if (!runtime) {
      return new UnsupportedMemoryBoardBackend(
        pluginId,
        "plugin runtime files could not be resolved",
      );
    }
    return new LanceDbProMemoryBoardBackend(
      { pluginRoot, ...runtime, loadStoreFactory: params.lanceDbProStoreFactoryLoader },
      dbPath,
    );
  }

  return new UnsupportedMemoryBoardBackend(
    pluginId,
    "do not provide a Memory Board backend adapter yet",
  );
}

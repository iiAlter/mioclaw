import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { homedir } from "node:os";
import path from "node:path";

const DB_PATH = path.join(homedir(), ".mioclaw", "memory", "lancedb-pro");
const LANCEDB_MODULE_PATH = path.join(
  homedir(),
  ".mioclaw",
  "extensions",
  "memory-lancedb-pro",
  "node_modules",
  "@lancedb",
  "lancedb",
);

// Categories
const CATEGORIES = ["preference", "fact", "decision", "entity", "reflection", "other"] as const;
type Category = (typeof CATEGORIES)[number];

// Types
interface MemoryMetadata {
  l0_abstract?: string;
  l1_overview?: string;
}

interface MemoryRecord {
  id: string;
  text: string;
  category: string;
  scope: string;
  importance: number;
  timestamp: number;
  vector: unknown[];
  metadata: string;
}

interface FormattedMemory {
  id: string;
  text: string;
  category: string;
  scope: string;
  importance: number;
  timestamp: number;
  abstract: string;
  overview: string;
  metadata: MemoryMetadata;
}

interface CreateMemoryInput {
  text?: string;
  category?: Category;
  scope?: string;
  importance?: number;
}

interface UpdateMemoryInput {
  text?: string;
  category?: Category;
  importance?: number;
  scope?: string;
}

interface ImportInput {
  memories: Array<{
    id?: string;
    text?: string;
    category?: string;
    scope?: string;
    importance?: number;
    timestamp?: number;
    vector?: unknown[];
    metadata?: MemoryMetadata | string;
  }>;
}

interface LanceDBConnection {
  openTable(name: string): Promise<Table>;
  createTable(name: string, schema: MemoryRecord[]): Promise<Table>;
}

interface Table {
  query(): QueryBuilder;
  add(records: MemoryRecord[]): Promise<void>;
  update(updates: Record<string, unknown>, options: { where: string }): Promise<void>;
  delete(condition: string): Promise<void>;
}

interface QueryBuilder {
  where(condition: string): QueryBuilder;
  limit(n: number): QueryBuilder;
  toArray(): Promise<MemoryRecord[]>;
  first(): Promise<MemoryRecord | null>;
}

// LanceDB client - lazy loaded
let lancedb: LanceDBConnection | null = null;
let table: Table | null = null;

async function getLanceDB(): Promise<LanceDBConnection> {
  if (lancedb) {
    return lancedb;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const LanceDB = await import(LANCEDB_MODULE_PATH);
    lancedb = await LanceDB.connect(DB_PATH);
    return lancedb!;
  } catch (e) {
    console.error("Failed to load LanceDB:", (e as Error).message);
    throw e;
  }
}

async function getTable(): Promise<Table> {
  if (table) {
    return table;
  }

  const db = await getLanceDB();
  table = await db.openTable("memories");
  return table;
}

function formatMemory(memory: MemoryRecord): FormattedMemory {
  let metadata: MemoryMetadata = {};
  try {
    if (memory.metadata) {
      metadata =
        typeof memory.metadata === "string" ? JSON.parse(memory.metadata) : memory.metadata;
    }
  } catch {
    // ignore parse errors
  }

  return {
    id: memory.id,
    text: memory.text,
    category: memory.category || "other",
    scope: memory.scope || "global",
    importance: memory.importance || 0.5,
    timestamp: memory.timestamp,
    abstract: metadata.l0_abstract || memory.text?.substring(0, 100) || "",
    overview: metadata.l1_overview || "",
    metadata,
  };
}

function sendJson(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function sendError(res: ServerResponse, message: string, status = 400) {
  sendJson(res, { error: message }, status);
}

async function parseBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

// GET /api/memory/memories
async function handleGetMemories(url: URL): Promise<FormattedMemory[]> {
  const q = url.searchParams.get("q");
  const category = url.searchParams.get("category");

  try {
    const tbl = await getTable();
    let query = tbl.query();

    if (category) {
      query = query.where(`category = "${category}"`);
    }

    let results = await query.toArray();

    // Filter by search query if provided
    if (q) {
      results = results.filter((m) => m.text?.toLowerCase().includes(q.toLowerCase()));
    }

    return results.map(formatMemory);
  } catch (e) {
    console.error("Failed to get memories:", (e as Error).message);
    return [];
  }
}

// POST /api/memory/memories
async function handleCreateMemory(data: CreateMemoryInput): Promise<FormattedMemory> {
  const memory: MemoryRecord = {
    id: randomUUID(),
    text: data.text || "",
    category: data.category || "other",
    scope: data.scope || "global",
    importance: data.importance ?? 0.5,
    timestamp: Date.now(),
    vector: [],
    metadata: JSON.stringify({
      l0_abstract: data.text?.substring(0, 100) || "",
      l1_overview: data.text?.substring(0, 500) || "",
    }),
  };

  try {
    const db = await getLanceDB();
    try {
      const tbl = await db.openTable("memories");
      await tbl.add([memory]);
    } catch {
      // Table doesn't exist, create it
      await db.createTable("memories", [memory]);
    }

    return formatMemory(memory);
  } catch (e) {
    console.error("Failed to create memory:", (e as Error).message);
    throw e;
  }
}

// PUT /api/memory/memories/:id
async function handleUpdateMemory(
  id: string,
  data: UpdateMemoryInput,
): Promise<FormattedMemory | null> {
  const updates: Record<string, unknown> = {};
  if (data.text) {
    updates.text = data.text;
  }
  if (data.category) {
    updates.category = data.category;
  }
  if (data.importance !== undefined) {
    updates.importance = data.importance;
  }
  if (data.scope) {
    updates.scope = data.scope;
  }

  try {
    if (Object.keys(updates).length > 0) {
      const tbl = await getTable();
      await tbl.update(updates, { where: `id = "${id}"` });
    }

    const tbl = await getTable();
    const result = await tbl.query().where(`id = "${id}"`).limit(1).first();
    return result ? formatMemory(result) : null;
  } catch (e) {
    console.error("Failed to update memory:", (e as Error).message);
    throw e;
  }
}

// DELETE /api/memory/memories/:id
async function handleDeleteMemory(id: string): Promise<boolean> {
  try {
    const tbl = await getTable();
    await tbl.delete(`id = "${id}"`);
    return true;
  } catch (e) {
    console.error("Failed to delete memory:", (e as Error).message);
    return false;
  }
}

// POST /api/memory/export
async function handleExport(): Promise<FormattedMemory[]> {
  try {
    const tbl = await getTable();
    const results = await tbl.query().toArray();
    return results.map(formatMemory);
  } catch (e) {
    console.error("Failed to export memories:", (e as Error).message);
    return [];
  }
}

// POST /api/memory/import
async function handleImport(data: ImportInput): Promise<{ imported: number }> {
  if (!Array.isArray(data.memories)) {
    throw new Error("Invalid import data: expected {memories: []}");
  }

  const db = await getLanceDB();
  const memories: MemoryRecord[] = data.memories.map((m) => ({
    ...m,
    id: m.id || randomUUID(),
    timestamp: m.timestamp || Date.now(),
    vector: m.vector || [],
    metadata: typeof m.metadata === "string" ? m.metadata : JSON.stringify(m.metadata || {}),
  })) as MemoryRecord[];

  try {
    const tbl = await db.openTable("memories");
    await tbl.add(memories);
  } catch {
    // Table doesn't exist, create it
    if (memories.length > 0) {
      await db.createTable("memories", [memories[0]]);
      if (memories.length > 1) {
        const tbl = await db.openTable("memories");
        await tbl.add(memories.slice(1));
      }
    }
  }

  return { imported: memories.length };
}

// GET /api/memory/stats
async function handleStats(): Promise<{ total: number; byCategory: Record<string, number> }> {
  try {
    const tbl = await getTable();
    const results = await tbl.query().toArray();
    const memories = results.map(formatMemory);

    const stats: { total: number; byCategory: Record<string, number> } = {
      total: memories.length,
      byCategory: {},
    };

    for (const cat of CATEGORIES) {
      stats.byCategory[cat] = memories.filter((m) => m.category === cat).length;
    }

    return stats;
  } catch (e) {
    console.error("Failed to get stats:", (e as Error).message);
    return { total: 0, byCategory: {} };
  }
}

// GET /api/memory/categories
function handleCategories(): Array<{ name: string }> {
  return CATEGORIES.map((cat) => ({ name: cat }));
}

export async function handleMemoryApi(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<boolean> {
  const pathname = url.pathname;
  const method = req.method?.toUpperCase() || "GET";

  // Route: /api/memory/memories
  if (pathname === "/api/memory/memories") {
    if (method === "GET") {
      const memories = await handleGetMemories(url);
      sendJson(res, memories);
      return true;
    }
    if (method === "POST") {
      try {
        const data = await parseBody<CreateMemoryInput>(req);
        const memory = await handleCreateMemory(data);
        sendJson(res, memory, 201);
      } catch (e) {
        sendError(res, (e as Error).message, 500);
      }
      return true;
    }
  }

  // Route: /api/memory/memories/:id
  const memoriesMatch = pathname.match(/^\/api\/memory\/memories\/([^/]+)$/);
  if (memoriesMatch) {
    const id = memoriesMatch[1];
    if (method === "PUT") {
      try {
        const data = await parseBody<UpdateMemoryInput>(req);
        const memory = await handleUpdateMemory(id, data);
        if (memory) {
          sendJson(res, memory);
        } else {
          sendError(res, "Memory not found", 404);
        }
      } catch (e) {
        sendError(res, (e as Error).message, 500);
      }
      return true;
    }
    if (method === "DELETE") {
      const success = await handleDeleteMemory(id);
      sendJson(res, { success });
      return true;
    }
  }

  // Route: /api/memory/export
  if (pathname === "/api/memory/export" && method === "POST") {
    const memories = await handleExport();
    sendJson(res, { memories });
    return true;
  }

  // Route: /api/memory/import
  if (pathname === "/api/memory/import" && method === "POST") {
    try {
      const data = await parseBody<ImportInput>(req);
      const result = await handleImport(data);
      sendJson(res, result, 201);
    } catch (e) {
      sendError(res, (e as Error).message, 400);
    }
    return true;
  }

  // Route: /api/memory/stats
  if (pathname === "/api/memory/stats" && method === "GET") {
    const stats = await handleStats();
    sendJson(res, stats);
    return true;
  }

  // Route: /api/memory/categories
  if (pathname === "/api/memory/categories" && method === "GET") {
    const categories = handleCategories();
    sendJson(res, categories);
    return true;
  }

  return false;
}

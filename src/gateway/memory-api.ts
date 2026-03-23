import type { IncomingMessage, ServerResponse } from "node:http";
import type { OpenClawConfig } from "../config/config.js";
import {
  createMemoryBoardBackend,
  type MemoryBoardMemory,
  type MemoryBoardStats,
  MemoryBoardBackendError,
} from "./memory-board-backend.js";

const CATEGORIES = ["preference", "fact", "decision", "entity", "reflection", "other"] as const;
type Category = (typeof CATEGORIES)[number];

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
  memories: Array<Record<string, unknown>>;
}

function sendJson(res: ServerResponse, data: unknown, status = 200) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function sendError(res: ServerResponse, message: string, status = 400) {
  sendJson(res, { error: message }, status);
}

function sendBackendError(res: ServerResponse, error: unknown) {
  if (error instanceof MemoryBoardBackendError) {
    sendError(res, error.message, error.statusCode);
    return;
  }
  sendError(res, error instanceof Error ? error.message : "Unknown memory backend error", 500);
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

export async function handleMemoryApi(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  config?: OpenClawConfig,
): Promise<boolean> {
  const pathname = url.pathname;
  const method = req.method?.toUpperCase() || "GET";
  const backend = createMemoryBoardBackend({
    config,
    moduleUrl: import.meta.url,
    argv1: process.argv[1],
    cwd: process.cwd(),
  });

  if (pathname === "/api/memory/memories") {
    if (method === "GET") {
      try {
        const memories = await backend.list({
          q: url.searchParams.get("q") ?? undefined,
          category: url.searchParams.get("category") ?? undefined,
        });
        sendJson(res, memories);
      } catch (error) {
        sendBackendError(res, error);
      }
      return true;
    }
    if (method === "POST") {
      try {
        const data = await parseBody<CreateMemoryInput>(req);
        const memory = await backend.create(data);
        sendJson(res, memory, 201);
      } catch (error) {
        sendBackendError(res, error);
      }
      return true;
    }
  }

  const memoriesMatch = pathname.match(/^\/api\/memory\/memories\/([^/]+)$/);
  if (memoriesMatch) {
    const id = memoriesMatch[1];
    if (method === "PUT") {
      try {
        const data = await parseBody<UpdateMemoryInput>(req);
        const memory = await backend.update(id, data);
        if (memory) {
          sendJson(res, memory);
        } else {
          sendError(res, "Memory not found", 404);
        }
      } catch (error) {
        sendBackendError(res, error);
      }
      return true;
    }
    if (method === "DELETE") {
      try {
        const success = await backend.delete(id);
        sendJson(res, { success });
      } catch (error) {
        sendBackendError(res, error);
      }
      return true;
    }
  }

  if (pathname === "/api/memory/export" && method === "POST") {
    try {
      const memories = await backend.export();
      sendJson(res, { memories });
    } catch (error) {
      sendBackendError(res, error);
    }
    return true;
  }

  if (pathname === "/api/memory/import" && method === "POST") {
    try {
      const data = await parseBody<ImportInput>(req);
      const result = await backend.import(data);
      sendJson(res, result, 201);
    } catch (error) {
      sendBackendError(res, error);
    }
    return true;
  }

  if (pathname === "/api/memory/stats" && method === "GET") {
    try {
      const stats: MemoryBoardStats = await backend.stats();
      sendJson(res, stats);
    } catch (error) {
      sendBackendError(res, error);
    }
    return true;
  }

  if (pathname === "/api/memory/categories" && method === "GET") {
    sendJson(res, backend.categories());
    return true;
  }

  return false;
}

export type { MemoryBoardMemory };

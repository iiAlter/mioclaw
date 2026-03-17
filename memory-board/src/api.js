import { getAllMemories, createMemory, deleteMemory, CATEGORIES } from "./store.js";

// 解析 JSON 请求体
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

// 发送 JSON 响应
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

// 发送文件下载
function sendFile(res, statusCode, filename, content) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Access-Control-Allow-Origin": "*",
  });
  res.end(content);
}

// 处理 CORS 预检请求
function handleCors(req, res) {
  res.writeHead(204, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end();
}

// API 路由处理
export async function handleApi(req, res, url) {
  console.log("API request:", req.method, url.pathname);

  // 处理 CORS
  if (req.method === "OPTIONS") {
    return handleCors(req, res);
  }

  const pathname = url.pathname;
  const method = req.method;

  try {
    // GET /api/memories - 获取所有记忆
    if (method === "GET" && pathname === "/api/memories") {
      const category = url.searchParams.get("category");
      const query = url.searchParams.get("q");

      let memories;
      if (query) {
        // 搜索
        const { searchMemories } = await import("./store.js");
        memories = await searchMemories(query);
      } else if (category && CATEGORIES.includes(category)) {
        const { getMemoriesByCategory } = await import("./store.js");
        memories = await getMemoriesByCategory(category);
      } else {
        memories = await getAllMemories();
      }

      return sendJson(res, 200, { memories });
    }

    // GET /api/categories - 获取分类列表
    if (method === "GET" && pathname === "/api/categories") {
      const { getStats } = await import("./store.js");
      const stats = await getStats();
      return sendJson(res, 200, { categories: CATEGORIES, stats });
    }

    // GET /api/stats - 获取统计信息
    if (method === "GET" && pathname === "/api/stats") {
      const { getStats } = await import("./store.js");
      const stats = await getStats();
      return sendJson(res, 200, stats);
    }

    // POST /api/memories - 创建记忆
    if (method === "POST" && pathname === "/api/memories") {
      const data = await parseBody(req);
      const memory = await createMemory(data);
      return sendJson(res, 201, { memory });
    }

    // DELETE /api/memories/:id - 删除记忆
    if (method === "DELETE" && pathname.startsWith("/api/memories/")) {
      const id = pathname.split("/").pop();
      await deleteMemory(id);
      return sendJson(res, 200, { success: true });
    }

    // POST /api/export - 导出记忆
    if (method === "POST" && pathname === "/api/export") {
      const memories = await getAllMemories();
      const exportData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        count: memories.length,
        memories: memories,
      };
      const filename = `memory-backup-${new Date().toISOString().split("T")[0]}.json`;
      return sendFile(res, 200, filename, JSON.stringify(exportData, null, 2));
    }

    // POST /api/import - 导入记忆
    if (method === "POST" && pathname === "/api/import") {
      const data = await parseBody(req);

      if (!data.memories || !Array.isArray(data.memories)) {
        return sendJson(res, 400, { error: "Invalid format: missing memories array" });
      }

      let imported = 0;
      let skipped = 0;
      const errors = [];

      for (const memory of data.memories) {
        try {
          if (!memory.text) {
            skipped++;
            continue;
          }
          await createMemory({
            text: memory.text,
            category: memory.category || "other",
            importance: memory.importance || 0.5,
            scope: memory.scope || "global",
          });
          imported++;
        } catch (e) {
          errors.push({ id: memory.id, error: e.message });
        }
      }

      return sendJson(res, 200, {
        success: true,
        imported,
        skipped,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    // 404
    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    console.error("API error:", error);
    sendJson(res, 500, { error: error.message });
  }
}

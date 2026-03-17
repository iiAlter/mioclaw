import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 记忆分类
export const CATEGORIES = ["preference", "fact", "decision", "entity", "reflection", "other"];

// LanceDB 数据库路径
const DB_PATH = path.join(os.homedir(), ".mioclaw/memory/lancedb-pro");

// LanceDB 客户端 - 延迟加载
let lancedb = null;
let table = null;

async function getLanceDB() {
  if (lancedb) {
    return lancedb;
  }

  try {
    // 从 memory-lancedb-pro 的 node_modules 加载
    const lancedbPath = path.join(
      os.homedir(),
      ".mioclaw/extensions/memory-lancedb-pro/node_modules/@lancedb/lancedb/dist/index.js",
    );
    const LanceDB = await import(lancedbPath);
    lancedb = await LanceDB.connect(DB_PATH);
    return lancedb;
  } catch (e) {
    console.error("Failed to load LanceDB:", e.message);
    throw e;
  }
}

async function getTable() {
  if (table) {
    return table;
  }

  const db = await getLanceDB();
  table = await db.openTable("memories");
  return table;
}

// 获取所有记忆
export async function getAllMemories() {
  try {
    const tbl = await getTable();
    const results = await tbl.query().toArray();
    return results.map(formatMemory);
  } catch (e) {
    console.error("Failed to get memories:", e.message);
    return [];
  }
}

// 按分类获取记忆
export async function getMemoriesByCategory(category) {
  try {
    const tbl = await getTable();
    const results = await tbl.query().where(`category = "${category}"`).toArray();
    return results.map(formatMemory);
  } catch (e) {
    console.error("Failed to get memories by category:", e.message);
    return [];
  }
}

// 搜索记忆
export async function searchMemories(query, limit = 20) {
  try {
    const tbl = await getTable();
    const results = await tbl.query().where(`text LIKE '%${query}%'`).limit(limit).toArray();
    return results.map(formatMemory);
  } catch (e) {
    console.error("Search error:", e.message);
    // 回退到本地过滤
    const all = await getAllMemories();
    return all.filter((m) => m.text?.toLowerCase().includes(query.toLowerCase())).slice(0, limit);
  }
}

// 创建记忆
export async function createMemory(data) {
  try {
    const db = await getLanceDB();
    const memory = {
      id: crypto.randomUUID(),
      text: data.text,
      category: data.category || "other",
      scope: data.scope || "global",
      importance: data.importance || 0.5,
      timestamp: Date.now(),
      vector: [],
      metadata: JSON.stringify({
        l0_abstract: data.text.substring(0, 100),
        l1_overview: data.text.substring(0, 500),
      }),
    };

    try {
      const tbl = await db.openTable("memories");
      await tbl.add([memory]);
    } catch {
      // 表不存在，创建它
      await db.createTable("memories", [memory]);
    }

    return formatMemory(memory);
  } catch (e) {
    console.error("Failed to create memory:", e.message);
    throw e;
  }
}

// 更新记忆
export async function updateMemory(id, data) {
  try {
    const tbl = await getTable();
    const updates = {};
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

    if (Object.keys(updates).length > 0) {
      await tbl.update(updates, { where: `id = "${id}"` });
    }

    const result = await tbl.query().where(`id = "${id}"`).limit(1).first();
    return result ? formatMemory(result) : null;
  } catch (e) {
    console.error("Failed to update memory:", e.message);
    throw e;
  }
}

// 删除记忆
export async function deleteMemory(id) {
  try {
    const tbl = await getTable();
    await tbl.delete(`id = "${id}"`);
    return true;
  } catch (e) {
    console.error("Failed to delete memory:", e.message);
    return false;
  }
}

// 格式化记忆数据
function formatMemory(memory) {
  let metadata = {};
  try {
    if (memory.metadata) {
      metadata =
        typeof memory.metadata === "string" ? JSON.parse(memory.metadata) : memory.metadata;
    }
  } catch {
    // 忽略解析错误
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

// 获取统计信息
export async function getStats() {
  const memories = await getAllMemories();

  const stats = {
    total: memories.length,
    byCategory: {},
  };

  for (const cat of CATEGORIES) {
    stats.byCategory[cat] = memories.filter((m) => m.category === cat).length;
  }

  return stats;
}

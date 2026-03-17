import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { handleApi } from "./api.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const UI_DIR = path.join(__dirname, "../ui");

// MIME 类型映射
const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

// 获取文件的 MIME 类型
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

// 处理静态文件
function serveStatic(req, res, url) {
  let filePath = url.pathname === "/" ? "/index.html" : url.pathname;
  const fullPath = path.join(UI_DIR, filePath);

  // 安全检查：防止目录遍历
  if (!fullPath.startsWith(UI_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        // SPA fallback: 返回 index.html
        fs.readFile(path.join(UI_DIR, "index.html"), (e, d) => {
          if (e) {
            res.writeHead(404);
            res.end("Not found");
          } else {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(d);
          }
        });
      } else {
        res.writeHead(500);
        res.end("Server error");
      }
      return;
    }

    res.writeHead(200, { "Content-Type": getMimeType(fullPath) });
    res.end(data);
  });
}

// 解析 URL
function parseUrl(reqUrl) {
  const [pathname, query] = reqUrl.split("?");
  const searchParams = new URLSearchParams(query || "");

  // 解析查询参数
  const url = {
    pathname: decodeURIComponent(pathname),
    searchParams,
  };

  return url;
}

// 主请求处理
async function handleRequest(req, res) {
  const url = parseUrl(req.url);
  console.log(`${req.method} ${url.pathname}`);

  try {
    // API 路由
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }

    // 静态文件
    serveStatic(req, res, url);
  } catch (error) {
    console.error("Error:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error.message }));
  }
}

// 创建并启动服务器
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`Memory Board running at http://localhost:${PORT}`);
});

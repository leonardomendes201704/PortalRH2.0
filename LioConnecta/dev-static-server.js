import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.dirname(__filename);
const port = Number(process.env.PORT || 3020);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

function resolvePath(requestUrl) {
  const parsedUrl = new URL(requestUrl, `http://127.0.0.1:${port}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);
  const normalized = pathname === "/" ? "/index.html" : pathname;
  const candidate = path.join(rootDir, normalized);

  if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
    return path.join(candidate, "index.html");
  }

  return candidate;
}

function sendResponse(response, statusCode, body, contentType = "text/plain; charset=utf-8") {
  response.writeHead(statusCode, { "Content-Type": contentType });
  response.end(body);
}

const server = http.createServer((request, response) => {
  try {
    const target = resolvePath(request.url || "/");
    const relative = path.relative(rootDir, target);

    if (relative.startsWith("..")) {
      sendResponse(response, 403, "Forbidden");
      return;
    }

    if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
      sendResponse(response, 404, "Not found");
      return;
    }

    const ext = path.extname(target).toLowerCase();
    const contentType = contentTypes[ext] || "application/octet-stream";
    const stream = fs.createReadStream(target);

    response.writeHead(200, { "Content-Type": contentType });
    stream.pipe(response);
    stream.on("error", () => sendResponse(response, 500, "Internal server error"));
  } catch (error) {
    sendResponse(response, 500, `Internal server error\n${error instanceof Error ? error.message : "unknown"}`);
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`LIOCONNECTA static server running at http://127.0.0.1:${port}/`);
});

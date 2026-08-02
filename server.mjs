import { createReadStream, existsSync, statSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = new URL(".", import.meta.url).pathname;
const port = Number(process.env.PORT || 4321);
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon"
};

createServer((req, res) => {
  let pathname = new URL(req.url, `http://${req.headers.host}`).pathname;

  // SPA-style: /wheel-of-names → /wheel-of-names.html
  if (pathname === "/") pathname = "/index.html";
  if (!extname(pathname)) pathname += ".html";

  const candidate = normalize(join(root, pathname));
  const hasDotfile = pathname.split("/").some(s => s.startsWith(".") && s.length > 1);

  if (hasDotfile || !candidate.startsWith(root) || !existsSync(candidate) || !statSync(candidate).isFile()) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  res.writeHead(200, {
    "content-type": types[extname(candidate)] || "application/octet-stream",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin"
  });

  createReadStream(candidate).pipe(res);
}).listen(port, () => {
  console.log(`Spin the Wheel running at http://localhost:${port}`);
});

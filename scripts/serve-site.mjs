import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve("apps/site/dist");
const base = "/codex-styler";
const port = 4174;
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8",
};

createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  if (url.pathname === "/") {
    response.writeHead(302, { Location: base + "/" });
    response.end();
    return;
  }
  const localPath = url.pathname.startsWith(base)
    ? url.pathname.slice(base.length)
    : url.pathname;
  let file = normalize(join(root, decodeURIComponent(localPath)));
  if (!file.startsWith(root)) {
    response.writeHead(403).end();
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type": types[extname(file)] ?? "application/octet-stream",
  });
  createReadStream(file).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log("Codex Styler site ready at http://127.0.0.1:" + port + base + "/");
});

// Serves the production build for Lighthouse, with two things a real deployment has:
//  - the security headers from vercel.json, so "best practices" is measured honestly
//  - a tiny mock API (lighthouse/mock-data.json), so the pages show real content
// Build first with an empty VITE_BASE_URL so the app calls this server for /api.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const dist = path.join(root, "dist");
const mock = JSON.parse(fs.readFileSync(path.join(here, "mock-data.json"), "utf8"));
const config = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
const securityHeaders = Object.fromEntries(config.headers[0].headers.map((h) => [h.key, h.value]));
const port = Number(process.env.PORT || 4174);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".json": "application/json",
  ".txt": "text/plain",
  ".xml": "application/xml",
};

const json = (res, body) => {
  res.writeHead(200, { "Content-Type": "application/json", ...securityHeaders });
  res.end(JSON.stringify(body));
};

http
  .createServer((req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0]);
    if (url === "/api/user/cars") return json(res, { success: true, cars: mock.cars });
    if (url === "/api/user/cities") return json(res, { success: true, cities: mock.cities });
    if (url.startsWith("/api/")) return json(res, { success: false, message: "not mocked" });

    let file = path.join(dist, url);
    const inside = file.startsWith(dist);
    if (!inside || !fs.existsSync(file) || fs.statSync(file).isDirectory())
      file = path.join(dist, "index.html");

    const ext = path.extname(file);
    const headers = {
      "Content-Type": types[ext] || "application/octet-stream",
      ...securityHeaders,
    };
    // hashed build files can be cached for a year, like a real host does
    if (file.includes(`${path.sep}assets${path.sep}`))
      headers["Cache-Control"] = "public, max-age=31536000, immutable";
    // Real hosts (Vercel) compress text files. Without this, Lighthouse would be told the
    // JavaScript is three times bigger than what visitors actually download.
    const compressible = [".html", ".js", ".css", ".svg", ".json", ".txt", ".xml"].includes(ext);
    const accepts = String(req.headers["accept-encoding"] || "");
    if (compressible && accepts.includes("br")) {
      headers["Content-Encoding"] = "br";
      res.writeHead(200, headers);
      fs.createReadStream(file).pipe(zlib.createBrotliCompress()).pipe(res);
    } else if (compressible && accepts.includes("gzip")) {
      headers["Content-Encoding"] = "gzip";
      res.writeHead(200, headers);
      fs.createReadStream(file).pipe(zlib.createGzip()).pipe(res);
    } else {
      res.writeHead(200, headers);
      fs.createReadStream(file).pipe(res);
    }
  })
  .listen(port, () => console.log(`lighthouse server ready on ${port}`));

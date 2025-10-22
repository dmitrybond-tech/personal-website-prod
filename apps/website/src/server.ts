// apps/website/src/server.ts
// @ts-ignore 3p types resolved in workspace package
import express, { type Request, type Response, type NextFunction } from "express";
// @ts-ignore 3p types resolved in workspace package
import compression from "compression";
import http from "node:http";
import fs from "node:fs";
import { join, resolve } from "node:path";

const app = express();
app.set("trust proxy", true);
app.disable("x-powered-by");

const CLIENT_ROOT = resolve(import.meta.dirname, "../client");

// 1) STATIC FIRST — no transforms
app.use("/_astro", express.static(join(CLIENT_ROOT, "_astro"), {
  maxAge: "365d",
  setHeaders: (res: Response) => res.setHeader("Cache-Control", "public, max-age=31536000, immutable"),
}));
app.use("/fonts", express.static(join(CLIENT_ROOT, "fonts"), {
  maxAge: "365d",
  setHeaders: (res: Response) => res.setHeader("Cache-Control", "public, max-age=31536000, immutable"),
}));
app.use("/uploads", express.static(join(CLIENT_ROOT, "uploads"), {
  maxAge: "365d",
  setHeaders: (res: Response) => res.setHeader("Cache-Control", "public, max-age=31536000"),
}));

// 2) COMPRESSION — only for text-like content (never images/fonts)
const shouldCompress = (_req: Request, res: Response) => {
  const type = res.getHeader("Content-Type");
  if (!type) return true;
  const t = String(type).toLowerCase();
  if (t.startsWith("text/")) return true;
  if (t.includes("javascript")) return true;
  if (t.includes("json")) return true;
  if (t.includes("xml")) return true;
  return false;
};
app.use(compression({ filter: shouldCompress }));

// 3) HTML no-store only
app.use((_req: Request, res: Response, next: NextFunction) => {
  const originalSet = res.setHeader.bind(res);
  res.setHeader = (name: string, value: any) => {
    if (name.toLowerCase() === "content-type" && String(value).startsWith("text/html")) {
      originalSet("Cache-Control", "no-store, max-age=0, must-revalidate");
    }
    return originalSet(name, value);
  };
  next();
});

// 4) Health
app.get("/_healthz", (_req: Request, res: Response) => res.type("text/plain").send("ok"));

// 5) SSR last — Import Astro's handler (middleware mode)
// @ts-ignore - entry.mjs is generated at build time and provided by Astro
import { handler as astroHandler } from "./entry.mjs";
app.use(astroHandler);

// HTTP server with safe timeouts
const server = http.createServer(app);
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;
server.requestTimeout = 0;

// Don't crash on broken pipes / client resets
process.on("uncaughtException", (err: any) => {
  if (err && (err.code === "EPIPE" || err.code === "ECONNRESET")) return;
  console.error(err);
});
process.on("unhandledRejection", (err: any) => console.error(err));

const PORT = Number(process.env.PORT || 3000);
const SOCKET_PATH = process.env.SOCKET_PATH;

if (SOCKET_PATH) {
  try { 
    fs.unlinkSync(SOCKET_PATH); 
  } catch {} // ignore if file doesn't exist
  
  server.listen(SOCKET_PATH, () => {
    try { 
      fs.chmodSync(SOCKET_PATH, 0o660); 
    } catch {} // ignore chmod errors
    console.log(`SSR listening on unix://${SOCKET_PATH}`);
  });
  
  // Also keep loopback for health checks inside container
  server.on("listening", () => {
    const loop = http.createServer(app);
    loop.keepAliveTimeout = 65_000;
    loop.headersTimeout = 66_000;
    loop.requestTimeout = 0;
    loop.listen(3000, "127.0.0.1", () => console.log("Health loopback on 127.0.0.1:3000"));
  });
} else {
  server.listen(PORT, () => {
    console.log(`SSR listening on :${PORT}`);
  });
}


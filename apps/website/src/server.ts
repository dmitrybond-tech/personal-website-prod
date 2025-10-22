// apps/website/src/server.ts
import express, { type Request, type Response, type NextFunction } from "express";
import compression from "compression";
import { join, resolve } from "node:path";
import type { NodeApp } from "astro/app/node";

const app = express();
app.disable("x-powered-by");
app.use(compression());

const CLIENT_ROOT = resolve(import.meta.dirname, "../client");

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

app.get("/_healthz", (_req: Request, res: Response) => res.type("text/plain").send("ok"));

app.use((_req: Request, res: Response, next: NextFunction) => {
  // HTML should never be cached
  res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
  next();
});

// Import just the app, not the server starter
// @ts-ignore - entry.mjs is generated at build time
const { app: astroApp } = await import("./entry.mjs");
// Use the handler from the app
app.use(astroApp.handler);

app.listen(process.env.PORT ?? 3000, () => {
  console.log("SSR listening on :3000");
});


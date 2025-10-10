// AI Podcast Suite Server — Shiper Optimized v2025.10.10-RSS-Mount
// Health pings, JSON logging, RSS auto-mount, and safe fallbacks.

import express from "express";
import process from "node:process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT      = process.env.PORT || 3000;
const VERSION   = "2025.10.10-RSS-Mount";
const NODE_ENV  = (process.env.NODE_ENV || "production")
  .replace(/^\w/, c => c.toUpperCase()); // pretty print

// ---------- JSON LOGGING ----------
function log(message, extra = undefined) {
  const line = { time: new Date().toISOString(), message };
  if (extra && typeof extra === "object") Object.assign(line, extra);
  process.stdout.write(JSON.stringify(line) + "\n");
}

// Minimal request logger (safe for Shiper)
app.use((req, res, next) => {
  const started = Date.now();
  res.on("finish", () => {
    log("http", {
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      ms: Date.now() - started
    });
  });
  next();
});

// ---------- HEALTH ----------
app.get("/health", (_req, res) => {
  log("health-hit");
  res.status(200).json({
    status: "ok",
    uptime: Math.round(process.uptime()) + "s",
    version: VERSION,
    environment: NODE_ENV,
  });
});

// ---------- REWRITE (simple) ----------
app.post("/api/rewrite", (req, res) => {
  const text = (req.body?.text || "").toString();
  const rewritten = text.replace(/\s+/g, " ").trim();
  log("rewrite", { in: text.length, out: rewritten.length });
  res.json({ success: true, rewritten });
});

// ---------- PODCAST (stub) ----------
app.post("/api/podcast", (req, res) => {
  const script = (req.body?.script || "").toString();
  const voice  = (req.body?.voice  || "default").toString();
  log("podcast", { chars: script.length, voice });
  res.json({ success: true, message: "Podcast request received", chars: script.length, voice });
});

// ---------- RSS FEED CREATOR AUTO-MOUNT ----------
async function tryMountRssService() {
  log("rss-init: probing");

  const candidate = path.resolve(__dirname, "services/rss-feed-creator/index.js");

  if (!fs.existsSync(candidate)) {
    log("rss-missing", { tried: candidate });
    return;
  }

  try {
    const mod = await import(pathToFileURL(candidate).href);

    // In many setups, default export is an Express app()
    const maybeApp = mod?.default;
    if (typeof maybeApp === "function") {
      // If default export is an express() or a middleware function, mount it
      app.use("/rss", maybeApp);
      log("rss-mounted", { mountPath: "/rss", from: "services/rss-feed-creator/index.js" });
    } else if (typeof mod?.startFeedCreator === "function") {
      await mod.startFeedCreator();
      log("rss-started", { mode: "startFeedCreator()" });
    } else {
      log("rss-no-entry", { note: "No express app() or start function exported" });
    }
  } catch (err) {
    log("rss-failed", { error: err?.message || String(err) });
  }
}

// ---------- 404 (so you see misses in logs) ----------
app.use((req, res) => {
  log("404", { method: req.method, path: req.originalUrl || req.url });
  res.status(404).json({ error: "Not found" });
});

// ---------- START ----------
app.listen(PORT, async () => {
  log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
  await tryMountRssService();
});

// ---------- HEARTBEAT ----------
setInterval(() => {
  log("heartbeat", { uptime_s: Math.round(process.uptime()) });
}, 5 * 60 * 1000);

// ---------- CLEAN EXIT ----------
process.on("SIGTERM", () => { log("SIGTERM"); process.exit(0); });
process.on("SIGINT",  () => { log("SIGINT");  process.exit(0); });

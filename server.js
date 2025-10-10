// AI Podcast Suite Server — Shiper Fix B (2025.10.10)
// ✅ Reliable /health logging
// ✅ Working /api/rewrite (fire-and-forget)
// ✅ 30-minute heartbeat
// ✅ Fully ESM-compatible

import express from "express";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "production";
const VERSION = "2025.10.10-FixB";

// ---- JSON LOGGER ----
function log(message, meta) {
  const entry = { time: new Date().toISOString(), message };
  if (meta) entry.meta = meta;
  console.log(JSON.stringify(entry));
}

// ---- HEALTH ENDPOINT ----
app.get("/health", (req, res) => {
  log("🩺 Health check hit");
  res.status(200).json({
    status: "ok",
    uptime: Math.round(process.uptime()) + "s",
    version: VERSION,
    environment: NODE_ENV,
  });
});

// ---- FIRE-AND-FORGET REWRITE ----
app.post("/api/rewrite", async (req, res) => {
  log("🧩 rss:rewrite-pipeline-start");

  (async () => {
    try {
      // Resolve the path to rewrite-pipeline.js relative to this file
      const targetPath = path.join(__dirname, "services/rss-feed-creator/services/rewrite-pipeline.js");
      const mod = await import(pathToFileURL(targetPath).href);
      if (typeof mod.runRewritePipeline === "function") {
        await mod.runRewritePipeline();
      } else {
        log("🧩 rss:rewrite-pipeline-error", { error: "runRewritePipeline not exported" });
      }
    } catch (err) {
      log("🧩 rss:rewrite-pipeline-error", { error: err?.message || String(err) });
    }
  })();

  // Return immediately so caller isn’t blocked
  res.json({ ok: true, message: "Pipeline triggered" });
});

// ---- START SERVER ----
app.listen(PORT, () => {
  log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
});

// ---- HEARTBEAT LOG (every 30 min) ----
setInterval(() => {
  log(`⏱️ Heartbeat: uptime ${Math.round(process.uptime())}s`);
}, 30 * 60 * 1000);

// ---- CLEAN EXIT ----
process.on("SIGTERM", () => {
  log("🛑 SIGTERM received, shutting down...");
  process.exit(0);
});
process.on("SIGINT", () => {
  log("🛑 SIGINT received, shutting down...");
  process.exit(0);
});

// AI Podcast Suite Server – Shiper Optimized v2025.10.10
// Stable /health + JSON logging + fire-and-forget /api/rewrite

import express from "express";
import process from "node:process";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const NODE_ENV = (process.env.NODE_ENV || "production");

// ---- JSON LOGGER ----
function log(message, meta) {
  const line = { time: new Date().toISOString(), message };
  if (meta) line.meta = meta;
  process.stdout.write(JSON.stringify(line) + "\n");
}

// ---- HEALTH ----
app.get("/health", (req, res) => {
  log("🩺 Health check hit");
  res.status(200).json({
    status: "ok",
    uptime: Math.round(process.uptime()) + "s",
    version: "2025.10.10",
    environment: NODE_ENV
  });
});

// ---- REWRITE (fire-and-forget) ----
app.post("/api/rewrite", async (req, res) => {
  log("🧩 rss:rewrite-pipeline-start");
  (async () => {
    try {
      const mod = await import("./services/rss-feed-creator/services/rewrite-pipeline.js");
      if (typeof mod.runRewritePipeline === "function") {
        await mod.runRewritePipeline();
      } else {
        log("🧩 rss:rewrite-pipeline-error", { error: "runRewritePipeline not exported" });
      }
    } catch (err) {
      log("🧩 rss:rewrite-pipeline-error", { error: err?.message || String(err) });
    }
  })();
  res.json({ ok: true });
});

// ---- START ----
app.listen(PORT, () => {
  log(`🚀 Server running on port ${PORT} (${NODE_ENV[0].toUpperCase()}${NODE_ENV.slice(1)})`);
});

// ---- HEARTBEAT (every 30 minutes) ----
setInterval(() => {
  log(`⏱️ Heartbeat: uptime ${Math.round(process.uptime())}s`);
}, 30 * 60 * 1000);

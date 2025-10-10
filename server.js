// AI Podcast Suite Server — Production Core v2025.10.10-Final
import express from "express";
import process from "node:process";
import { runRewritePipeline } from "./services/rss-feed-creator/services/rewrite-pipeline.js";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "production";
const VERSION = "2025.10.10-Final";

// ---- Logging (immediate stdout) ----
function log(message, meta = {}) {
  const entry = { time: new Date().toISOString(), message, ...(Object.keys(meta).length ? { meta } : {}) };
  process.stdout.write(JSON.stringify(entry) + "\n");
}

// ---- Health Endpoint ----
app.get("/health", (req, res) => {
  log("🧩 Health check hit");
  res.status(200).json({
    status: "ok",
    version: VERSION,
    environment: NODE_ENV,
    uptime: Math.round(process.uptime()) + "s"
  });
});

// ---- Rewrite Trigger ----
app.post("/api/rewrite", async (req, res) => {
  log("🧩 rss:rewrite-pipeline-start");
  res.status(202).json({ ok: true, message: "Rewrite started" });

  try {
    const result = await runRewritePipeline();
    log("🧩 rss:rewrite-pipeline-complete", { count: result?.count || 0 });
  } catch (error) {
    log("🧩 rss:rewrite-pipeline-error", { error: error.message });
  }
});

// ---- Startup ----
app.listen(PORT, () => {
  log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
});

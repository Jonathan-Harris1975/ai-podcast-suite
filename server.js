// AI Podcast Suite Server – Shiper Optimized (RSS-Pro v2025.10.10)
import express from "express";
import process from "node:process";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const NODE_ENV = (process.env.NODE_ENV || "production").replace(/^\w/, c => c.toUpperCase());

const log = (message, meta) => {
  const line = {
    time: new Date().toISOString(),
    message: `🧩 ${message}`,
    ...(meta ? { meta } : {})
  };
  process.stdout.write(JSON.stringify(line) + "\n");
};

// Health
app.get("/health", (_req, res) => {
  log("Health check hit");
  res.json({ status: "ok", uptime: Math.round(process.uptime()) + "s", env: NODE_ENV });
});

// Fire-and-forget rewrite trigger
app.post("/api/rewrite", async (_req, res) => {
  res.json({ ok: true, message: "Rewrite started 🔥" });
  try {
    log("rss:rewrite-pipeline-start");
    const { runRewritePipeline } = await import("./services/rss-feed-creator/services/rewrite-pipeline.js");
    const result = await runRewritePipeline();
    log("rss:rewrite-pipeline-complete", result);
  } catch (err) {
    log("rss:rewrite-pipeline-error", { error: err?.message });
  }
});

// Podcast stub
app.post("/api/podcast", (req, res) => {
  const script = req.body?.script || "";
  const voice = req.body?.voice || "default";
  log("podcast:endpoint", { chars: script.length, voice });
  res.json({ success: true, message: "Podcast request received", chars: script.length, voice });
});

app.listen(PORT, () => {
  process.stdout.write(JSON.stringify({ time: new Date().toISOString(), message: `🚀 Server running on port ${PORT} (${NODE_ENV})` }) + "\n");
});

// Heartbeat every 30 minutes
setInterval(() => log(`heartbeat: ${Math.round(process.uptime())}s`), 30 * 60 * 1000);

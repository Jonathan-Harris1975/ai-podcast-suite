// AI Podcast Suite Server – Final Shiper Production v2025.10.10
// Mounts routes dynamically and includes full JSON logging, health, and heartbeat

import express from "express";
import process from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// ─── Logging ───────────────────────────────────────────────────────────────
function log(message, meta = null) {
  const entry = {
    time: new Date().toISOString(),
    message,
    ...(meta ? { meta } : {})
  };
  process.stdout.write(JSON.stringify(entry) + "\n");
}

// ─── Constants ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "Production";
const VERSION = "2025.10.10";

// ─── Health Endpoint ───────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  log("🧩 Health check hit");
  res.status(200).json({
    status: "ok",
    version: VERSION,
    uptime: `${Math.round(process.uptime())}s`,
    environment: NODE_ENV
  });
});

// ─── Routes Import (Dynamic Safe Loader) ───────────────────────────────────
async function loadRoutes() {
  try {
    const rewriteRoutes = await import("./routes/rewrite.js");
    app.use("/api/rewrite", rewriteRoutes.default || rewriteRoutes);

    const podcastRoutes = await import("./routes/podcast.js");
    app.use("/api/podcast", podcastRoutes.default || podcastRoutes);

    const rssRoutes = await import("./routes/rss.js");
    app.use("/api/rss", rssRoutes.default || rssRoutes);

    log("✅ Routes loaded successfully");
  } catch (err) {
    log("❌ Failed to load one or more route modules", { error: err.message });
  }
}

// ─── 404 Fallback ─────────────────────────────────────────────────────────
app.use((req, res) => {
  log("⚠️ 404 Not Found", { path: req.originalUrl });
  res.status(404).json({ error: "Endpoint not found" });
});

// ─── Startup ───────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
  await loadRoutes();
});

// ─── Heartbeat Log Every 5 Minutes ─────────────────────────────────────────
setInterval(() => {
  log(`⏱️ Heartbeat`, { uptime: `${Math.round(process.uptime())}s` });
}, 5 * 60 * 1000);

// ─── Graceful Shutdown ─────────────────────────────────────────────────────
process.on("SIGTERM", () => {
  log("🛑 SIGTERM – shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  log("🛑 SIGINT – manual stop");
  process.exit(0);
});

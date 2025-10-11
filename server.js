// /server.js — AI Podcast Suite (Final Stable 2025-10-11)
import express from "express";
import process from "node:process";
import fs from "node:fs"; // ✅ Added to support preflight check

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "production";
const HEARTBEAT_ENABLE = (process.env.HEARTBEAT_ENABLE || "no").toLowerCase() === "yes";

// ────────────────────────────────────────────────
// 🪵 JSON Logger
// ────────────────────────────────────────────────
function log(message, meta = null) {
  const entry = {
    time: new Date().toISOString(),
    message,
    ...(meta ? { meta } : {}),
  };
  process.stdout.write(JSON.stringify(entry) + "\n");
}

// ────────────────────────────────────────────────
// 🧩 Preflight file existence check
// ────────────────────────────────────────────────
log("🧩 Preflight check", {
  rewriteExists: fs.existsSync("./routes/rewrite.js"),
  podcastExists: fs.existsSync("./routes/podcast.js"),
  rssExists: fs.existsSync("./routes/rss.js"),
});

// ────────────────────────────────────────────────
// 🩺 Health Endpoint
// ────────────────────────────────────────────────
app.get("/health", (req, res) => {
  log("🩺 Health check hit");
  res.status(200).json({
    status: "ok",
    uptime: `${Math.round(process.uptime())}s`,
    environment: NODE_ENV,
  });
});

// ────────────────────────────────────────────────
// 🏠 Root Endpoint
// ────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).json({
    message: "🧠 AI Podcast Suite is live",
    endpoints: ["/api/rewrite", "/api/podcast", "/api/rss", "/health"],
  });
});

// ────────────────────────────────────────────────
// 🚀 Dynamic Route Loader
// ────────────────────────────────────────────────
async function loadRoutes() {
  const rewritePath = "./routes/rewrite.js";
  const podcastPath = "./routes/podcast.js";
  const rssPath = "./routes/rss.js";

  log("🔍 Importing routes from", { rewritePath, podcastPath, rssPath });

  try {
    const rewriteModule = await import(rewritePath);
    if (rewriteModule?.default) {
      app.use("/api/rewrite", rewriteModule.default);
      log("✅ Mounted /api/rewrite");
    }

    const podcastModule = await import(podcastPath);
    if (podcastModule?.default) {
      app.use("/api/podcast", podcastModule.default);
      log("✅ Mounted /api/podcast");
    }

    const rssModule = await import(rssPath);
    if (rssModule?.default) {
      app.use("/api/rss", rssModule.default);
      log("✅ Mounted /api/rss");
    }

    log("✅ All routes mounted successfully");
  } catch (error) {
    log("❌ Route loading failed", { error: error.message });
  }
}

// ────────────────────────────────────────────────
// ⚠️ 404 Handler
// ────────────────────────────────────────────────
app.use((req, res) => {
  log("⚠️ 404 Not Found", { path: req.originalUrl });
  res.status(404).json({ error: "Endpoint not found" });
});

// ────────────────────────────────────────────────
// 🧠 Start Server
// ────────────────────────────────────────────────
async function startServer() {
  try {
    await loadRoutes();

    app.listen(PORT, () => {
      log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);

      if (HEARTBEAT_ENABLE) {
        setInterval(
          () => log("⏱️ Heartbeat", { uptime: `${Math.round(process.uptime())}s` }),
          5 * 60 * 1000
        );
        log("❤️ Heartbeat enabled");
      } else {
        log("💤 Heartbeat disabled for cost optimization");
      }
    });
  } catch (error) {
    log("💥 Failed to start server", { error: error.message });
    process.exit(1);
  }
}

startServer().catch(error => {
  log("💥 Critical startup error", { error: error.message });
  process.exit(1);
});

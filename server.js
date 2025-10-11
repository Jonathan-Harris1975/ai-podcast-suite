// /server.js — AI Podcast Suite (2025.10.11 Final Stable Fixed)
import express from "express";
import process from "node:process";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "production";
const HEARTBEAT_ENABLE = (process.env.HEARTBEAT_ENABLE || "no").toLowerCase() === "yes";

// ────────────────────────────────────────────────
// 🪵 Logger (Render-friendly structured JSON)
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
// 🩺 Health
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
// 🏠 Friendly Root Endpoint
// ────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).json({
    message: "🧠 AI Podcast Suite is live",
    endpoints: ["/api/rewrite", "/api/podcast", "/api/rss", "/health"],
  });
});

// ────────────────────────────────────────────────
// 🚀 Load Routes
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
    } else {
      log("⚠️ rewriteModule missing default export");
    }

    const podcastModule = await import(podcastPath);
    if (podcastModule?.default) {
      app.use("/api/podcast", podcastModule.default);
      log("✅ Mounted /api/podcast");
    } else {
      log("⚠️ podcastModule missing default export");
    }

    const rssModule = await import(rssPath);
    if (rssModule?.default) {
      app.use("/api/rss", rssModule.default);
      log("✅ Mounted /api/rss");
    } else {
      log("⚠️ rssModule missing default export");
    }

    log("✅ All routes mounted successfully");
  } catch (err) {
    log("❌ Route loading failed", { error: err.message });
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

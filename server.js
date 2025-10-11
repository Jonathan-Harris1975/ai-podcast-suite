// server.js — AI Podcast Suite (Render-Stable + Heartbeat Toggle 2025.10.11)
import express from "express";
import process from "node:process";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "production";
const HEARTBEAT_ENABLE = (process.env.HEARTBEAT_ENABLE || "no").toLowerCase() === "yes";

// ────────────────────────────────────────────────
// LOGGER
// ────────────────────────────────────────────────
function log(message, meta = null) {
  const entry = { time: new Date().toISOString(), message, ...(meta ? { meta } : {}) };
  process.stdout.write(JSON.stringify(entry) + "\n");
}

// ────────────────────────────────────────────────
// HEALTH CHECK
// ────────────────────────────────────────────────
app.get("/health", (req, res) => {
  log("🩺 Health check hit");
  res.status(200).json({
    status: "ok",
    uptime: `${Math.round(process.uptime())}s`,
    environment: NODE_ENV,
    heartbeat: HEARTBEAT_ENABLE ? "enabled" : "disabled",
  });
});

// ────────────────────────────────────────────────
// ROUTE LOADER
// ────────────────────────────────────────────────
async function loadRoutes() {
  try {
    const rewritePath = new URL("./routes/rewrite.js", import.meta.url);
    const podcastPath = new URL("./routes/podcast.js", import.meta.url);
    log("🔍 Importing routes from", {
      rewritePath: rewritePath.pathname,
      podcastPath: podcastPath.pathname,
    });

    // Rewrite route
    const rewriteModule = await import(rewritePath);
    if (rewriteModule?.default && typeof rewriteModule.default === "function") {
      app.use("/api/rewrite", rewriteModule.default);
      log("✅ Mounted /api/rewrite");
    } else {
      log("⚠️ Rewrite route invalid or missing default export");
    }

    // Podcast route
    const podcastModule = await import(podcastPath);
    if (podcastModule?.default && typeof podcastModule.default === "function") {
      app.use("/api/podcast", podcastModule.default);
      log("✅ Mounted /api/podcast");
    } else {
      log("⚠️ Podcast route invalid or missing default export");
    }

    log("✅ All routes attached successfully");
  } catch (err) {
    log("❌ Route loading failed", { error: err.message });
  }
}

// ────────────────────────────────────────────────
// 404 HANDLER
// ────────────────────────────────────────────────
app.use((req, res) => {
  log("⚠️ 404 Not Found", { path: req.originalUrl });
  res.status(404).json({ error: "Endpoint not found" });
});

// ────────────────────────────────────────────────
// SERVER STARTUP
// ────────────────────────────────────────────────
app.listen(PORT, async () => {
  log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
  await loadRoutes();

  if (HEARTBEAT_ENABLE) {
    log("💓 Heartbeat enabled");
    setInterval(() => {
      log("⏱️ Heartbeat", { uptime: `${Math.round(process.uptime())}s` });
    }, 5 * 60 * 1000);
  } else {
    log("💤 Heartbeat disabled for cost optimization");
  }
});

// server.js — AI Podcast Suite (Render-Stable 2025.10.11)
import express from "express";
import process from "node:process";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "production";

// ────────────────────────────────────────────────
// LOGGER
// ────────────────────────────────────────────────
function log(message, meta = null) {
  const entry = { time: new Date().toISOString(), message, ...(meta ? { meta } : {}) };
  process.stdout.write(JSON.stringify(entry) + "\n");
}

// ────────────────────────────────────────────────
// HEALTH
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
// DYNAMIC ROUTE LOADER
// ────────────────────────────────────────────────
async function loadRoutes() {
  try {
    const rewritePath = new URL("./routes/rewrite.js", import.meta.url);
    const podcastPath = new URL("./routes/podcast.js", import.meta.url);
    log("🔍 Importing routes from", { rewritePath: rewritePath.pathname, podcastPath: podcastPath.pathname });

    // Load rewrite route
    const rewriteModule = await import(rewritePath);
    const rewriteRouter = rewriteModule?.default;
    if (rewriteRouter && typeof rewriteRouter === "function") {
      app.use("/api/rewrite", rewriteRouter);
      log("✅ Mounted /api/rewrite");
    } else {
      log("⚠️ Rewrite route missing default export or invalid type");
    }

    // Load podcast route
    const podcastModule = await import(podcastPath);
    const podcastRouter = podcastModule?.default;
    if (podcastRouter && typeof podcastRouter === "function") {
      app.use("/api/podcast", podcastRouter);
      log("✅ Mounted /api/podcast");
    } else {
      log("⚠️ Podcast route missing default export or invalid type");
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
// START SERVER
// ────────────────────────────────────────────────
app.listen(PORT, async () => {
  log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
  await loadRoutes();
});

// ────────────────────────────────────────────────
// HEARTBEAT
// ────────────────────────────────────────────────
setInterval(() => {
  log("⏱️ Heartbeat", { uptime: `${Math.round(process.uptime())}s` });
}, 5 * 60 * 1000);,

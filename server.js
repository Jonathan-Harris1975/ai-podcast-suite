// AI Podcast Suite Server – Shiper Final v2025.10.10-RoutesFix
import express from "express";
import process from "node:process";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERSION = "2025.10.10";
const NODE_ENV = process.env.NODE_ENV || "production";

// ---- LOGGING ----
function log(message, meta = null) {
  const entry = {
    time: new Date().toISOString(),
    message,
    ...(meta ? { meta } : {})
  };
  process.stdout.write(JSON.stringify(entry) + "\n");
}

// ---- HEALTH ----
app.get("/health", (req, res) => {
  log("🩺 Health check hit");
  res.status(200).json({
    status: "ok",
    version: VERSION,
    uptime: `${Math.round(process.uptime())}s`,
    environment: NODE_ENV
  });
});

// ---- ROUTES ----
async function loadRoutes() {
  try {
    const rewriteModule = await import("./routes/rewrite.js");
    const rewriteRouter = rewriteModule.default;
    if (rewriteRouter) {
      app.use("/api/rewrite", rewriteRouter);
      log("✅ /api/rewrite route mounted");
    } else {
      log("❌ /api/rewrite missing default export");
    }

    const podcastModule = await import("./routes/podcast.js");
    if (podcastModule.default) app.use("/api/podcast", podcastModule.default);

    log("✅ Routes loaded successfully");
  } catch (err) {
    log("❌ Route loading failed", { error: err.message });
  }
}

// ---- 404 ----
app.use((req, res) => {
  log("⚠️ 404 Not Found", { path: req.originalUrl });
  res.status(404).json({ error: "Endpoint not found" });
});

// ---- START ----
app.listen(PORT, async () => {
  log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
  await loadRoutes();
});

// ---- HEARTBEAT ----
setInterval(() => {
  log("⏱️ Heartbeat", { uptime: `${Math.round(process.uptime())}s` });
}, 5 * 60 * 1000);

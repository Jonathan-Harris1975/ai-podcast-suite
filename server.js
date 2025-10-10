// AI Podcast Suite Server – Stable Shiper v2025.10.10-FIXED
import express from "express";
import process from "node:process";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERSION = "2025.10.10";
const NODE_ENV = process.env.NODE_ENV || "production";

// --- Logging Helper ---
function log(message, meta = null) {
  const entry = {
    time: new Date().toISOString(),
    message,
    ...(meta ? { meta } : {})
  };
  process.stdout.write(JSON.stringify(entry) + "\n");
}

// --- Health Check ---
app.get("/health", (req, res) => {
  log("🩺 Health check hit");
  res.status(200).json({
    status: "ok",
    version: VERSION,
    uptime: `${Math.round(process.uptime())}s`,
    environment: NODE_ENV
  });
});

// --- Route Loader ---
async function loadRoutes() {
  try {
    const rewriteRoutes = await import("./routes/rewrite.js");
    if (rewriteRoutes.default) app.use("/api/rewrite", rewriteRoutes.default);
    else log("⚠️ rewrite.js missing default export");

    const podcastRoutes = await import("./routes/podcast.js");
    if (podcastRoutes.default) app.use("/api/podcast", podcastRoutes.default);

    const rssRoutes = await import("./routes/rss.js");
    if (rssRoutes.default) app.use("/api/rss", rssRoutes.default);

    log("✅ Routes loaded successfully");
  } catch (err) {
    log("❌ Route loading failed", { error: err.message });
  }
}

// --- 404 Fallback ---
app.use((req, res) => {
  log("⚠️ 404 Not Found", { path: req.originalUrl });
  res.status(404).json({ error: "Endpoint not found" });
});

// --- Startup ---
app.listen(PORT, async () => {
  log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
  await loadRoutes();
});

// --- Heartbeat ---
setInterval(() => {
  log("⏱️ Heartbeat", { uptime: `${Math.round(process.uptime())}s` });
}, 5 * 60 * 1000);

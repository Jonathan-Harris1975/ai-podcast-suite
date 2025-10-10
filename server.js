// server.js — AI Podcast Suite (2025.10.10-RouteFix)
import express from "express";
import process from "node:process";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "production";

// ---- LOGGER ----
function log(message, meta = null) {
  const entry = { time: new Date().toISOString(), message, ...(meta ? { meta } : {}) };
  process.stdout.write(JSON.stringify(entry) + "\n");
}

// ---- HEALTH ----
app.get("/health", (req, res) => {
  log("🩺 Health check hit");
  res.status(200).json({
    status: "ok",
    uptime: `${Math.round(process.uptime())}s`,
    environment: NODE_ENV,
  });
});

// ---- LOAD ROUTES ----
async function loadRoutes() {
  try {
    // ✅ Load rewrite route dynamically
    const rewriteModule = await import("./routes/rewrite.js");
    if (rewriteModule?.default) {
      app.use("/api/rewrite", rewriteModule.default);
      log("✅ /api/rewrite mounted");
    } else {
      log("❌ rewrite.js missing default export");
    }

    // ✅ Load podcast route
    const podcastModule = await import("./routes/podcast.js");
    if (podcastModule?.default) {
      app.use("/api/podcast", podcastModule.default);
      log("✅ /api/podcast mounted");
    } else {
      log("❌ podcast.js missing default export");
    }

    log("✅ Routes loaded successfully");
  } catch (err) {
    log("❌ Failed loading routes", { error: err.message });
  }
}

// ---- 404 HANDLER (keep last) ----
app.use((req, res) => {
  log("⚠️ 404 Not Found", { path: req.originalUrl });
  res.status(404).json({ error: "Endpoint not found" });
});

// ---- START SERVER ----
app.listen(PORT, async () => {
  log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
  await loadRoutes();
});

// ---- HEARTBEAT ----
setInterval(() => log("⏱️ Heartbeat", { uptime: `${Math.round(process.uptime())}s` }), 5 * 60 * 1000);

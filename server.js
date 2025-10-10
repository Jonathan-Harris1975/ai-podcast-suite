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
    const fileUrl = new URL("./routes/rewrite.js", import.meta.url);
    log("🧩 Checking route file", { path: fileUrl.href });

    const rewriteModule = await import(fileUrl.href);
    log("🧩 rewriteModule keys", Object.keys(rewriteModule));

    const rewriteRouter = rewriteModule.default;
    if (rewriteRouter && typeof rewriteRouter === "function") {
      app.use("/api/rewrite", rewriteRouter);
      log("✅ /api/rewrite route mounted successfully");
    } else {
      log("❌ /api/rewrite missing default export or not a function");
    }

    const podcastModule = await import("./routes/podcast.js");
    if (podcastModule.default) {
      app.use("/api/podcast", podcastModule.default);
      log("✅ /api/podcast route mounted successfully");
    }

    // ✅ 404 should be last — after all routes are mounted
    app.use((req, res) => {
      log("⚠️ 404 Not Found", { path: req.originalUrl });
      res.status(404).json({ error: "Endpoint not found" });
    });

    log("✅ Routes loaded successfully");
  } catch (err) {
    log("❌ Route loading failed", { error: err.message });
  }
}

// ---- START ----
app.listen(PORT, async () => {
  log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
  await loadRoutes();
});

// ---- HEARTBEAT ----
setInterval(() => {
  log("⏱️ Heartbeat", { uptime: `${Math.round(process.uptime())}s` });
}, 5 * 60 * 1000);

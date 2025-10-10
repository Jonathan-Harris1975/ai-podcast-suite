// server.js — AI Podcast Suite (2025.10.10-FinalFix)
// Ensures routes register before server starts
import express from "express";
import process from "node:process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// ---- LOAD ROUTES BEFORE SERVER START ----
async function loadRoutes() {
  try {
    // ✅ REWRITE ROUTE
    const rewriteModule = await import(path.join(__dirname, "routes/rewrite.js"));
    const rewriteRouter = rewriteModule.default;
    if (rewriteRouter && typeof rewriteRouter === "function") {
      app.use("/api/rewrite", rewriteRouter);
      log("✅ /api/rewrite route attached");
    } else {
      log("⚠️ rewrite route missing or invalid export");
    }

    // ✅ PODCAST ROUTE
    const podcastModule = await import(path.join(__dirname, "routes/podcast.js"));
    if (podcastModule?.default && typeof podcastModule.default === "function") {
      app.use("/api/podcast", podcastModule.default);
      log("✅ /api/podcast route attached");
    }

    // ✅ DEBUG ROUTES
    const routes = app._router.stack
      .filter(r => r.route)
      .map(r => Object.keys(r.route.methods).map(m => `${m.toUpperCase()} ${r.route.path}`))
      .flat();
    log("🧭 Active routes", { routes });
    log("✅ Routes loaded successfully");
  } catch (err) {
    log("❌ Route loading failed", { error: err.message });
  }
}

// ---- BOOTSTRAP THEN START SERVER ----
(async () => {
  await loadRoutes();

  // ---- 404 (after routes) ----
  app.use((req, res) => {
    log("⚠️ 404 Not Found", { path: req.originalUrl });
    res.status(404).json({ error: "Endpoint not found" });
  });

  app.listen(PORT, () => {
    log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
  });

  // ---- HEARTBEAT ----
  setInterval(
    () => log("⏱️ Heartbeat", { uptime: `${Math.round(process.uptime())}s` }),
    5 * 60 * 1000
  );
})();

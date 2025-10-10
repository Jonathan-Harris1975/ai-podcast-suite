// server.js — AI Podcast Suite (2025.10.10-RouteLock)
import express from "express";
import process from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "production";

// ── Logger ──────────────────────────────────────
function log(message, meta = null) {
  const entry = { time: new Date().toISOString(), message, ...(meta ? { meta } : {}) };
  process.stdout.write(JSON.stringify(entry) + "\n");
}

// ── Health Check ────────────────────────────────
app.get("/health", (req, res) => {
  log("🩺 Health check hit");
  res.status(200).json({
    status: "ok",
    uptime: `${Math.round(process.uptime())}s`,
    environment: NODE_ENV,
  });
});

// ── Route Loader ────────────────────────────────
async function loadRoutes() {
  try {
    // ✅ REWRITE ROUTE
    const rewritePath = path.join(__dirname, "routes/rewrite.js");
    const rewriteModule = await import(rewritePath);
    const rewriteRouter = rewriteModule.default;
    if (rewriteRouter && typeof rewriteRouter === "function") {
      app.use("/api/rewrite", rewriteRouter);
      log("✅ /api/rewrite router mounted");
    } else {
      log("⚠️ /api/rewrite invalid export");
    }

    // ✅ PODCAST ROUTE
    const podcastPath = path.join(__dirname, "routes/podcast.js");
    const podcastModule = await import(podcastPath);
    if (podcastModule?.default && typeof podcastModule.default === "function") {
      app.use("/api/podcast", podcastModule.default);
      log("✅ /api/podcast router mounted");
    }

    const registered = app._router.stack
      .filter(r => r.route)
      .map(r => `${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`);
    log("🧭 Registered routes", { registered });

  } catch (err) {
    log("❌ Route loading failed", { error: err.message });
  }
}

// ── 404 Handler ────────────────────────────────
app.use((req, res) => {
  log("⚠️ 404 Not Found", { path: req.originalUrl, method: req.method });
  res.status(404).json({ error: "Endpoint not found" });
});

// ── Start Server ───────────────────────────────
(async () => {
  await loadRoutes();
  app.listen(PORT, () => log(`🚀 Server running on port ${PORT} (${NODE_ENV})`));
})();

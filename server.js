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
    const rewriteModule = await import("./routes/rewrite.js");
    log("🧭 rewrite import type", {
      defaultType: typeof rewriteModule.default,
      keys: Object.keys(rewriteModule),
    });

    const router = rewriteModule.default;
    if (router && typeof router === "function") {
      app.use("/api/rewrite", router);
      log("✅ /api/rewrite attached to Express");
      // 🔥 verify right after attach
      const routes = app._router.stack
        .filter(r => r.route)
        .map(r => r.route.path);
      log("🧩 Registered paths", { routes });
    } else {
      log("❌ rewrite default export missing or not a router");
    }

    const podcastModule = await import("./routes/podcast.js");
    if (podcastModule?.default) app.use("/api/podcast", podcastModule.default);

    log("✅ Routes loaded successfully");
  } catch (err) {
    log("❌ Route loading failed", { error: err.message });
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

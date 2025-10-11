// /server.js — AI Podcast Suite (2025.10.11 Final Stable)
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
    endpoints: ["/api/rewrite", "/api/podcast", "/health"],
  });
});

// ────────────────────────────────────────────────
// 🚀 Load Routes
// ────────────────────────────────────────────────
async function loadRoutes() {
  const rewritePath = "./routes/rewrite.js";
  const podcastPath = "./routes/podcast.js";

  log("🔍 Importing routes from", { rewritePath, podcastPath });

  try {
    const rewriteModule = await import(rewritePath);
    const podcastModule = await import(podcastPath);

    if (rewriteModule?.default) {
      app.use("/api/rewrite", rewriteModule.default);
      log("✅ Mounted /api/rewrite");
    } else {
      log("⚠️ rewriteModule missing default export");
    }

    if (podcastModule?.default) {
      app.use("/api/podcast", podcastModule.default);
      log("✅ Mounted /api/podcast");
    } else {
      log("⚠️ podcastModule missing default export");
    }

    log("✅ All routes mounted successfully");
  } catch (err) {
    log("❌ Route loading failed", { error: err.message });
  }
}

// ────────────────────────────────────────────────
// ⚠️ 404 Handler (Keep last)
// ────────────────────────────────────────────────
app.use((req, res) => {
  log("⚠️ 404 Not Found", { path: req.originalUrl });
  res.status(404).json({ error: "Endpoint not found" });
});

// ────────────────────────────────────────────────
// 🧠 Start Server
// ────────────────────────────────────────────────
app.listen(PORT, async () => {
  log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
  await loadRoutes();

  if (HEARTBEAT_ENABLE) {
    setInterval(
      () => log("⏱️ Heartbeat", { uptime: `${Math.round(process.uptime())}s` }),
      5 * 60 * 1000
    );
  } else {
    log("💤 Heartbeat disabled for cost optimization");
  }
});

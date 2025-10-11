// /server.js — AI Podcast Suite (Final Stable 2025-10-11)
import express from "express";
import process from "node:process";
import fs from "node:fs"; // ✅ Added for preflight check

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "production";
const HEARTBEAT_ENABLE =
  (process.env.HEARTBEAT_ENABLE || "no").toLowerCase() === "yes";

// ────────────────────────────────────────────────
// 🪵 JSON Logger
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
// 🧩 Preflight file existence check
// ────────────────────────────────────────────────
log("🧩 Preflight check", {
  rewriteExists: fs.existsSync("./routes/rewrite.js"),
  podcastExists: fs.existsSync("./routes/podcast.js"),
  rssExists: fs.existsSync("./routes/rss.js"),
});

// ────────────────────────────────────────────────
// 🩺 Health Endpoint
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
// 🏠 Root Endpoint
// ────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).json({
    message: "🧠 AI Podcast Suite is live",
    endpoints: ["/api/rewrite", "/api/podcast", "/api/rss", "/health"],
  });
});

// ────────────────────────────────────────────────
// 🚀 Dynamic Route Loader (with per-file diagnostics)
// ────────────────────────────────────────────────
async function loadRoutes() {
  const routes = [
    { path: "/api/rewrite", file: "./routes/rewrite.js" },
    { path: "/api/podcast", file: "./routes/podcast.js" },
    { path: "/api/rss", file: "./routes/rss.js" },
  ];

  log("🔍 Importing routes from", {
    rewritePath: routes[0].file,
    podcastPath: routes[1].file,
    rssPath: routes[2].file,
  });

  for (const route of routes) {
    try {
      const mod = await import(route.file);
      if (mod?.default) {
        app.use(route.path, mod.default);
        log(`✅ Mounted ${route.path}`);
      } else {
        log(`⚠️ No default export in ${route.file}`);
      }
    } catch (err) {
      log(`🚨 ${route.file} failed`, { error: err.message });
    }
  }

  log("🔚 Route import pass complete");
}

// ────────────────────────────────────────────────
// ⚠️ 404 Handler
// ────────────────────────────────────────────────
app.use((req, res) => {
  log("⚠️ 404 Not Found", { path: req.originalUrl });
  res.status(404).json({ error: "Endpoint not found" });
});

// ────────────────────────────────────────────────
// 🧠 Start Server
// ────────────────────────────────────────────────
async function startServer() {
  try {
    await loadRoutes();

    app.listen(PORT, () => {
      log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);

      if (HEARTBEAT_ENABLE) {
        setInterval(
          () =>
            log("⏱️ Heartbeat", {
              uptime: `${Math.round(process.uptime())}s`,
            }),
          5 * 60 * 1000
        );
        log("❤️ Heartbeat enabled");
      } else {
        log("💤 Heartbeat disabled for cost optimization");
      }
    });
  } catch (error) {
    log("💥 Failed to start server", { error: error.message });
    process.exit(1);
  }
}

startServer().catch((error) => {
  log("💥 Critical startup error", { error: error.message });
  process.exit(1);
});

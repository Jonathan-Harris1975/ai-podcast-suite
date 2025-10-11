// /server.js — AI Podcast Suite (Debug-Toggle Edition 2025-10-11)
import express from "express";
import process from "node:process";
import fs from "node:fs";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "production";
const HEARTBEAT_ENABLE = (process.env.HEARTBEAT_ENABLE || "no").toLowerCase() === "yes";

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
// 🚀 Dynamic Route Loader with Debug Flags
// ────────────────────────────────────────────────
async function loadRoutes() {
  const rewritePath = "./routes/rewrite.js";
  const podcastPath = "./routes/podcast.js";
  const rssPath = "./routes/rss.js";

  const disableRewrite = (process.env.DISABLE_REWRITE || "no").toLowerCase() === "yes";
  const disablePodcast = (process.env.DISABLE_PODCAST || "no").toLowerCase() === "yes";
  const disableRss = (process.env.DISABLE_RSS || "no").toLowerCase() === "yes";

  log("🔍 Importing routes from", { rewritePath, podcastPath, rssPath });
  log("⚙️ Debug Flags", { disableRewrite, disablePodcast, disableRss });

  try {
    // ─── Rewrite Route ────────────────────────────
    if (!disableRewrite && fs.existsSync(rewritePath)) {
      try {
        const rewriteModule = await import(rewritePath);
        if (rewriteModule?.default) {
          app.use("/api/rewrite", rewriteModule.default);
          log("✅ Mounted /api/rewrite");
        } else throw new Error("No default export found in rewrite.js");
      } catch (err) {
        log("🚨 ./routes/rewrite.js failed", { error: err.message });
      }
    } else {
      log("🚫 /api/rewrite skipped", { reason: disableRewrite ? "disabled via env" : "file missing" });
    }

    // ─── Podcast Route ────────────────────────────
    if (!disablePodcast && fs.existsSync(podcastPath)) {
      try {
        const podcastModule = await import(podcastPath);
        if (podcastModule?.default) {
          app.use("/api/podcast", podcastModule.default);
          log("✅ Mounted /api/podcast");
        } else throw new Error("No default export found in podcast.js");
      } catch (err) {
        log("🚨 ./routes/podcast.js failed", { error: err.message });
      }
    } else {
      log("🚫 /api/podcast skipped", { reason: disablePodcast ? "disabled via env" : "file missing" });
    }

    // ─── RSS Route ────────────────────────────────
    if (!disableRss && fs.existsSync(rssPath)) {
      try {
        const rssModule = await import(rssPath);
        if (rssModule?.default) {
          app.use("/api/rss", rssModule.default);
          log("✅ Mounted /api/rss");
        } else throw new Error("No default export found in rss.js");
      } catch (err) {
        log("🚨 ./routes/rss.js failed", { error: err.message });
      }
    } else {
      log("🚫 /api/rss skipped", { reason: disableRss ? "disabled via env" : "file missing" });
    }

    log("🔚 Route import pass complete");
  } catch (error) {
    log("💥 Route loading error", { error: error.message });
  }
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
          () => log("⏱️ Heartbeat", { uptime: `${Math.round(process.uptime())}s` }),
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

startServer().catch(error => {
  log("💥 Critical startup error", { error: error.message });
  process.exit(1);
});

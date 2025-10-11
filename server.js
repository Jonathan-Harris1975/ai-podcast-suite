// /server.js — AI Podcast Suite (Final Stable 2025-10-11)
import express from "express";
import process from "node:process";
import fs from "node:fs";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "production";
const HEARTBEAT_ENABLE = (process.env.HEARTBEAT_ENABLE || "no").toLowerCase() === "yes";

// ────────────────────────────────────────────────
// 🧩 Environment Flags
// ────────────────────────────────────────────────
const DISABLE_REWRITE = (process.env.DISABLE_REWRITE || "no").toLowerCase() === "yes";
const DISABLE_PODCAST = (process.env.DISABLE_PODCAST || "no").toLowerCase() === "yes";
const DISABLE_RSS = (process.env.DISABLE_RSS || "no").toLowerCase() === "yes";

// ────────────────────────────────────────────────
// 🪵 JSON Logger (Render-friendly)
// ────────────────────────────────────────────────
function log(message, meta = null) {
  const entry = { time: new Date().toISOString(), message, ...(meta ? { meta } : {}) };
  process.stdout.write(JSON.stringify(entry) + "\n");
}

// ────────────────────────────────────────────────
// 🧩 Preflight file check
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
    disabledRoutes: {
      rewrite: DISABLE_REWRITE,
      podcast: DISABLE_PODCAST,
      rss: DISABLE_RSS,
    },
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
// 🚀 Dynamic Route Loader
// ────────────────────────────────────────────────
async function loadRoutes() {
  const rewritePath = "./routes/rewrite.js";
  const podcastPath = "./routes/podcast.js";
  const rssPath = "./routes/rss.js";

  log("🔍 Importing routes from", { rewritePath, podcastPath, rssPath });
  log("⚙️ Debug Flags", {
    disableRewrite: DISABLE_REWRITE,
    disablePodcast: DISABLE_PODCAST,
    disableRss: DISABLE_RSS,
  });

  // ──────────── Rewrite Route ────────────
  if (!DISABLE_REWRITE) {
    try {
      const mod = await import(rewritePath);
      if (mod?.default) {
        app.use("/api/rewrite", mod.default);
        log("✅ Mounted /api/rewrite");
      } else {
        log("⚠️ rewrite.js missing default export");
      }
    } catch (err) {
      log("🚨 ./routes/rewrite.js failed", { error: err.message });
    }
  } else {
    log("🚫 /api/rewrite skipped", { reason: "disabled via env" });
  }

  // ──────────── Podcast Route ────────────
  if (!DISABLE_PODCAST) {
    try {
      const mod = await import(podcastPath);
      if (mod?.default) {
        app.use("/api/podcast", mod.default);
        log("✅ Mounted /api/podcast");
      } else {
        log("⚠️ podcast.js missing default export");
      }
    } catch (err) {
      log("🚨 ./routes/podcast.js failed", { error: err.message });
    }
  } else {
    log("🚫 /api/podcast skipped", { reason: "disabled via env" });
  }

  // ──────────── RSS Route ────────────
  if (!DISABLE_RSS) {
    try {
      const mod = await import(rssPath);
      if (mod?.default) {
        app.use("/api/rss", mod.default);
        log("✅ Mounted /api/rss");
      } else {
        log("⚠️ rss.js missing default export");
      }
    } catch (err) {
      log("🚨 ./routes/rss.js failed", { error: err.message });
    }
  } else {
    log("🚫 /api/rss skipped", { reason: "disabled via env" });
  }

  log("🔚 Route import pass complete");
}

// ────────────────────────────────────────────────
// ⚠️ 404 Handler (Always last)
// ────────────────────────────────────────────────
app.use((req, res) => {
  log("⚠️ 404 Not Found", { path: req.originalUrl });
  res.status(404).json({ error: "Endpoint not found", path: req.originalUrl });
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
  } catch (err) {
    log("💥 Failed to start server", { error: err.message });
    process.exit(1);
  }
}

// Boot up
startServer().catch((err) => {
  log("💥 Critical startup error", { error: err.message });
  process.exit(1);
});

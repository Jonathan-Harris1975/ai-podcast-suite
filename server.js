// /server.js — AI Podcast Suite (Patched 2025-10-11)
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
      log("🚨 ./routes/rewrite.js failed to import", { error: err.message });
    }
  } else {
    log("🚫 Rewrite route disabled via env var");
  }

  // ──────────── Podcast Route ────────────
  if (!DISABLE_PODCAST) {
    try {
      const mod = await import(podcastPath);
      if (mod?.default) {
        app.use("/api/podcast", mod.default);
        log("✅ Mounted /api/podcast");
      }
    } catch (err) {
      log("🚨 ./routes/podcast.js failed to import", { error: err.message });
    }
  } else {
    log("🚫 Podcast route disabled via env var");
  }

  // ──────────── RSS Route ────────────
  if (!DISABLE_RSS) {
    try {
      const mod = await import(rssPath);
      if (mod?.default) {
        app.use("/api/rss", mod.default);
        log("✅ Mounted /api/rss");
      }
    } catch (err) {
      log("🚨 ./routes/rss.js failed to import", { error: err.message });
    }
  } else {
    log("🚫 RSS route disabled via env var");
  }
}

// ────────────────────────────────────────────────
// 🚀 Load Routes and Start Server (Patched by GPT)
// ────────────────────────────────────────────────
loadRoutes().then(() => {
  app.use("*", (req, res) => {
    res.status(404).json({ error: "Endpoint not found", path: req.originalUrl });
  });

  app.listen(PORT, () => {
    log(`✅ Server running on port ${PORT}`, { NODE_ENV });
  });
}).catch((err) => {
  log("❌ Failed to load routes", { error: err.message });
  process.exit(1);
});

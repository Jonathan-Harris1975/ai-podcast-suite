// ============================================================
// 🌍 AI Podcast Suite — Main Server (Final Fixed Version)
// ============================================================
//
// ✅ Fixes:
//  • Correct relative import paths (no more /services/... errors)
//  • Robust error handling for all routes
//  • Emoji-first log order for Shiper visibility
// ============================================================

import express from "express";
import cors from "cors";
import { log } from "#shared/logger.js";

const app = express();
const PORT = process.env.PORT || 3000;

// ------------------------------------------------------------
// 🧩 Middleware
// ------------------------------------------------------------
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ------------------------------------------------------------
// 🩺 Root Health
// ------------------------------------------------------------
app.get("/", (_req, res) => {
  res.json({
    service: "AI Podcast Suite",
    status: "online",
    endpoints: [
      "/api/rss/health",
      "/api/podcast/health",
      "/podcast",
      "/run-pipeline",
    ],
  });
});

// ------------------------------------------------------------
// ⚙️ Dynamic Route Loader
// ------------------------------------------------------------
(async () => {
  try {
    log.info("🚀 Starting route registration...");

    // --------------------------------------------------------
    // 🧠 RSS Health Route
    // --------------------------------------------------------
    try {
      const { default: rssHealthRouter } = await import("./routes/rss-health.js");
      app.use(rssHealthRouter);
      log.info("🧩 Mounted: /api/rss/health");
    } catch (err) {
      log.error("❌ RSS Health route failed to load", { error: err.stack });
    }

    // --------------------------------------------------------
    // 🎧 Podcast Health Route
    // --------------------------------------------------------
    try {
      const { default: podcastHealthRouter } = await import("./routes/podcast-health.js");
      app.use(podcastHealthRouter);
      log.info("🎧 Mounted: /api/podcast/health");
    } catch (err) {
      log.error("❌ Podcast Health route failed to load", { error: err.stack });
    }

    // --------------------------------------------------------
    // 🎙️ Podcast Route
    // --------------------------------------------------------
    try {
      const { default: podcastRouter } = await import("./routes/podcast.js");
      if (!podcastRouter) throw new Error("Missing default export in podcast.js");
      app.use("/podcast", podcastRouter);
      log.info("🎙️ Mounted: /podcast");
    } catch (err) {
      log.error("❌ Podcast route failed to load", { error: err.stack });
    }

    // --------------------------------------------------------
    // 🔁 Run-Pipeline Route
    // --------------------------------------------------------
    try {
      app.post("/run-pipeline", async (req, res) => {
        const sessionId = req.body?.sessionId || `TT-${Date.now()}`;
        try {
          const { runPodcastPipeline } = await import("./services/podcast/runPodcastPipeline.js");
          const result = await runPodcastPipeline(sessionId);
          res.status(200).json({ ok: true, result });
          log.info("🔁 Route hit: /run-pipeline", { sessionId });
        } catch (err) {
          log.error("💥 run-pipeline error", { error: err.message });
          res.status(500).json({ ok: false, error: err.message });
        }
      });
      log.info("🔁 Mounted: /run-pipeline");
    } catch (err) {
      log.error("❌ Run-Pipeline route failed to load", { error: err.stack });
    }

    // --------------------------------------------------------
    // 🚀 Start Express Server
    // --------------------------------------------------------
    app.listen(PORT, () => {
      log.info("🌍 Server started successfully", { port: PORT });
      log.info("---------------------------------------------");
      log.info("✅ Active Endpoints:");
      log.info("🧠 → GET  /api/rss/health");
      log.info("🎧 → GET  /api/podcast/health");
      log.info("🎙️ → ALL  /podcast");
      log.info("🔁 → POST /run-pipeline");
      log.info("---------------------------------------------");
    });
  } catch (err) {
    log.error("💥 Startup failure", { error: err.stack });
  }
})();

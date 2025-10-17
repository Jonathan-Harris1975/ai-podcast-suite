// ============================================================
// 🌍 AI Podcast Suite — Server Bootstrap (Final Stable Build)
// ============================================================
//
// ✅ Fixes:
//  • Detailed error logging for podcast route
//  • Emoji-first pino-pretty formatting
//  • Stable ESM imports & absolute-safe paths
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
// 🩺 Root Health Check
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
// ⚙️ Dynamic Route Registration
// ------------------------------------------------------------
(async () => {
  try {
    log.info("🚀 Starting route registration...");

    // 🧠 RSS Health
    try {
      const { default: rssHealthRouter } = await import("./routes/rss-health.js");
      app.use(rssHealthRouter);
      log.info("🧩 Mounted: /api/rss/health");
    } catch (err) {
      log.error("💥 RSS Health route failed", { error: err.stack });
    }

    // 🎧 Podcast Health
    try {
      const { default: podcastHealthRouter } = await import("./routes/podcast-health.js");
      app.use(podcastHealthRouter);
      log.info("🎧 Mounted: /api/podcast/health");
    } catch (err) {
      log.error("💥 Podcast Health route failed", { error: err.stack });
    }

    // 🎙️ Podcast Main Route
    try {
      const { default: podcastRouter } = await import("./routes/podcast.js");
      if (!podcastRouter) throw new Error("Missing default export in routes/podcast.js");
      app.use("/podcast", podcastRouter);
      log.info("🎙️ Mounted: /podcast");
    } catch (err) {
      log.error("💥 Podcast route failed to load", { error: err.stack });
    }

    // 🔁 Run Pipeline (manual trigger)
    try {
      app.post("/run-pipeline", async (req, res) => {
        const sessionId = req.body?.sessionId || `TT-${Date.now()}`;
        try {
          const { runPodcastPipeline } = await import("./services/podcast/runPodcastPipeline.js");
          await runPodcastPipeline(sessionId);
          log.info("🔁 run-pipeline triggered", { sessionId });
          res.status(200).json({ ok: true, sessionId });
        } catch (err) {
          log.error("💥 run-pipeline error", { error: err.stack });
          res.status(500).json({ ok: false, error: err.message });
        }
      });
      log.info("🔁 Mounted: /run-pipeline");
    } catch (err) {
      log.error("💥 Run-pipeline route failed", { error: err.stack });
    }

    // 🌍 Start Server
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

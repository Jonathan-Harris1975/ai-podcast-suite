// ============================================================
// 🌍 AI Podcast Suite — Main Server (Final Mount Verification)
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
// 🧩 Dynamic Route Loader
// ------------------------------------------------------------
(async () => {
  try {
    // 🩺 RSS Health
    const { default: rssHealthRouter } = await import("./routes/rss-health.js");
    app.use(rssHealthRouter);
    log.info("✅ Route mounted: /api/rss/health");

    // 🎙️ Podcast
    try {
      const { default: podcastRouter } = await import("./routes/podcast.js");
      if (podcastRouter) {
        app.use("/podcast", podcastRouter);
        log.info("✅ Route mounted: /podcast");
      } else {
        log.warn("⚠️ podcastRouter export missing");
      }
    } catch (err) {
      log.error("❌ Failed to mount /podcast", { error: err.message });
    }

    // 🔁 Run-Pipeline
    app.post("/run-pipeline", async (req, res) => {
      try {
        const { runPodcastPipeline } = await import("./services/podcast/runPodcastPipeline.js");
        const sessionId = req.body?.sessionId || `TT-${Date.now()}`;
        const result = await runPodcastPipeline(sessionId);
        res.status(200).json({ ok: true, result });
        log.info("✅ Route hit: /run-pipeline");
      } catch (err) {
        log.error("❌ run-pipeline error", { error: err.message });
        res.status(500).json({ ok: false, error: err.message });
      }
    });
    log.info("✅ Route mounted: /run-pipeline");

    // ------------------------------------------------------------
    // 🚀 Start Server
    // ------------------------------------------------------------
    app.listen(PORT, () => {
      log.info(`🌍 AI Podcast Suite server running on port ${PORT}`);
      log.info("---------------------------------------------");
      log.info("✅ Active Endpoints:");
      log.info("→ GET  /api/rss/health");
      log.info("→ ALL  /podcast");
      log.info("→ POST /run-pipeline");
      log.info("---------------------------------------------");
    });
  } catch (err) {
    log.error("❌ Startup failure", { error: err.message });
  }
})();

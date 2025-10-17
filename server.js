// ============================================================
// 🌍 AI Podcast Suite — Main Server (Stable Verified Version)
// ============================================================
//
// Fixes:
// - app initialization order
// - route mounting visibility (/api/rss/health, /podcast, /run-pipeline)
// - startup confirmation logs
// ============================================================

import express from "express";
import cors from "cors";
import { log } from "#shared/logger.js";

const app = express();
const PORT = process.env.PORT || 3000;

// ------------------------------------------------------------
// 🧩 Core Middleware
// ------------------------------------------------------------
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ------------------------------------------------------------
// 🧠 Dynamic Route Registration
// ------------------------------------------------------------
(async () => {
  try {
    // ------------------------
    // 🩺 RSS Health Route
    // ------------------------
    try {
      const { default: rssHealthRouter } = await import("./routes/rss-health.js");
      if (rssHealthRouter) {
        app.use(rssHealthRouter); // defines /api/rss/health internally
        log.info("✅ Route mounted: /api/rss/health");
      }
    } catch (err) {
      log.error("❌ Failed to mount /api/rss/health", { error: err.message });
    }

    // ------------------------
    // 🎙️ Podcast Route
    // ------------------------
    try {
      const { default: podcastRouter } = await import("./routes/podcast.js");
      if (podcastRouter) {
        app.use("/podcast", podcastRouter); // correct for router.all("/")
        log.info("✅ Route mounted: /podcast");
      }
    } catch (err) {
      log.error("❌ Failed to mount /podcast", { error: err.message });
    }

    // ------------------------
    // 🔁 Run-Pipeline Route
    // ------------------------
    app.post("/run-pipeline", async (req, res) => {
      try {
        const { runPodcastPipeline } = await import("./services/podcast/runPodcastPipeline.js");
        if (typeof runPodcastPipeline !== "function") {
          throw new Error("runPodcastPipeline() not exported correctly");
        }
        const result = await runPodcastPipeline(req.body?.sessionId || `TT-${Date.now()}`);
        res.status(200).json({ success: true, result });
        log.info("✅ Route hit: /run-pipeline");
      } catch (err) {
        log.error("❌ run-pipeline error", { error: err.message });
        res.status(500).json({ success: false, error: err.message });
      }
    });
    log.info("✅ Route mounted: /run-pipeline");

    // ------------------------------------------------------------
    // 🚀 Start Express Server
    // ------------------------------------------------------------
    app.listen(PORT, () => {
      log.info(`🌍 AI Podcast Suite server running on port ${PORT}`);
      log.info("---------------------------------------------");
      log.info("✅ Active Endpoints:");
      log.info("→ GET  /api/rss/health");
      log.info("→ POST /run-pipeline");
      log.info("→ ALL  /podcast");
      log.info("---------------------------------------------");
    });
  } catch (err) {
    log.error("❌ Fatal startup error", { error: err.message });
  }
})();

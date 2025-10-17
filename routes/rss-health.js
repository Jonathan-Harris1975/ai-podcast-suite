// ============================================================
// 🌍 AI Podcast Suite — Main Server (Verified Route Mounts)
// ============================================================
// Fixes:
// - "Cannot access app before initialization"
// - Silent missing endpoints (/api/rss/health, /run-pipeline, /podcast)
// - Adds startup logging for every mounted route
// ============================================================

import express from "express";
import cors from "cors";
import { log } from "#shared/logger.js";

const app = express();
const PORT = process.env.PORT || 3000;

// ------------------------------------------------------------
// 🧩 Base Middleware
// ------------------------------------------------------------
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ------------------------------------------------------------
// 🧩 Route Loader
// ------------------------------------------------------------
(async () => {
  try {
    // ------------------------
    // RSS Health Route
    // ------------------------
    const { default: rssHealthRouter } = await import("./routes/rss-health.js");
    if (rssHealthRouter) {
      app.use(rssHealthRouter); // route already defines /api/rss/health
      log.info("✅ Route mounted: /api/rss/health");
    } else {
      log.warn("⚠️ rssHealthRouter missing");
    }

    // ------------------------
    // Podcast Route
    // ------------------------
    try {
      const { default: podcastRouter } = await import("./routes/podcast.js");
      if (podcastRouter) {
        app.use("/podcast", podcastRouter);
        log.info("✅ Route mounted: /podcast");
      } else {
        log.warn("⚠️ podcastRouter missing");
      }
    } catch {
      log.warn("⚠️ No podcast.js file found — skipping /podcast");
    }

    // ------------------------
    // Pipeline Route
    // ------------------------
    app.post("/run-pipeline", async (req, res) => {
      try {
        const { runPipeline } = await import("./services/podcast/runPodcastPipeline.js");
        if (typeof runPipeline !== "function") {
          throw new Error("runPipeline not exported properly");
        }
        const result = await runPipeline(req.body || {});
        res.status(200).json({ success: true, result });
        log.info("✅ Route hit: /run-pipeline");
      } catch (err) {
        log.error("❌ run-pipeline error", { error: err.message });
        res.status(500).json({ success: false, error: err.message });
      }
    });
    log.info("✅ Route mounted: /run-pipeline");

    // ------------------------------------------------------------
    // 🚀 Start Server
    // ------------------------------------------------------------
    app.listen(PORT, () => {
      log.info(`🌍 AI Podcast Suite server running on port ${PORT}`);
      log.info("---------------------------------------------------");
      log.info("✅ Active Endpoints:");
      log.info("→ GET  /api/rss/health");
      log.info("→ POST /run-pipeline");
      log.info("→ GET  /podcast");
      log.info("---------------------------------------------------");
    });
  } catch (err) {
    log.error("❌ Failed to start server", { error: err.message });
  }
})();

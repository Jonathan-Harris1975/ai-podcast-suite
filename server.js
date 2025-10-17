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
const rssHealthRouter = express.Router();
rssHealthRouter.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "rss-feed-creator" });
});
const PORT = process.env.PORT || 3000;

// ------------------------------------------------------------
// 🧩 Core Middleware
// ------------------------------------------------------------
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/rss", rssHealthRouter);
log.info("✅ Route mounted: /api/rss/health");

// ------------------------------------------------------------
// 🧠 Dynamic Route Registration
// ------------------------------------------------------------
(async () => {
  try {


    // ------------------------
    // 🎙️ Podcast Route
    // ------------------------
    try {
      const { default: podcastRouter } = await import("./routes/podcast.js");
      if (podcastRouter) {
        app.use("/api/podcast", podcastRouter); // correct for router.all("/")
        log.info("✅ Route mounted: /api/podcast");
      }
    } catch (err) {
      log.error("❌ Failed to mount /podcast", { error: err.message });
    }

    // ------------------------
    // 🔁 Run-Pipeline Route
    // ------------------------
    app.post("/api/rewrite/run", async (req, res) => {
      try {
        const { runPodcastPipeline } = await import("./services/podcast/runPodcastPipeline.js");
        if (typeof runPodcastPipeline !== "function") {
          throw new Error("runPodcastPipeline() not exported correctly");
        }
        const result = await runPodcastPipeline(req.body?.sessionId || `TT-${Date.now()}`);
        res.status(200).json({ success: true, result });
        log.info("✅ Route hit: /api/rewrite/run");
      } catch (err) {
        log.error("❌ /api/rewrite/run error", { error: err.message });
        res.status(500).json({ success: false, error: err.message });
      }
    });
    log.info("✅ Route mounted: /api/rewrite/run");

    // ------------------------------------------------------------
    // 🚀 Start Express Server
    // ------------------------------------------------------------
    app.listen(PORT, () => {
      log.info(`🌍 AI Podcast Suite server running on port ${PORT}`);
      log.info("---------------------------------------------");
      log.info("✅ Active Endpoints:");
      log.info("→ GET  /api/rss/health");
log.info("→ POST /api/rewrite/run");
      
      
      log.info("---------------------------------------------");
    });
  } catch (err) {
    log.error("❌ Fatal startup error", { error: err.message });
  }
})();

// ============================================================
// 🧠 AI Podcast Suite — Main Server (Verified Mount Version)
// ============================================================
//
// - Initializes Express before any imports
// - Dynamically imports all routes AFTER app is defined
// - Verifies and logs that each route mounted successfully
// - Works under Node v22+ (ESM)
// ============================================================

import express from "express";
import cors from "cors";
import { log } from "#shared/logger.js";

// ------------------------------------------------------------
// ⚙️ Initialize Express First
// ------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ------------------------------------------------------------
// 🧩 Dynamically Load Routes
// ------------------------------------------------------------
(async () => {
  try {
    // --- Health route ---
    const { default: rssHealthRouter } = await import("./routes/rss-health.js");
    if (rssHealthRouter && typeof rssHealthRouter === "function") {
      app.use("/rss-health", rssHealthRouter);
      log.info("✅ Route mounted: /rss-health");
    } else {
      log.warn("⚠️ rssHealthRouter missing or invalid");
    }

    // --- Podcast route (pipeline orchestrator) ---
    app.post("/run-pipeline", async (req, res) => {
      try {
        const { runPipeline } = await import("./services/podcast/runPodcastPipeline.js");
        if (typeof runPipeline !== "function") {
          throw new Error("runPipeline() not exported correctly");
        }
        const result = await runPipeline(req.body || {});
        res.status(200).json({ success: true, result });
      } catch (err) {
        log.error("❌ run-pipeline failed", { error: err.message });
        res.status(500).json({ success: false, error: err.message });
      }
    });
    log.info("✅ Route mounted: /run-pipeline");

    // --- Podcast processor route (optional health/test) ---
    try {
      const { default: podcastRouter } = await import("./routes/podcast.js");
      if (podcastRouter && typeof podcastRouter === "function") {
        app.use("/podcast", podcastRouter);
        log.info("✅ Route mounted: /podcast");
      } else {
        log.warn("⚠️ Podcast router not found or invalid");
      }
    } catch {
      log.warn("⚠️ No /routes/podcast.js file found — skipping /podcast route");
    }

    // ------------------------------------------------------------
    // 🚀 Start Server (after all routes loaded)
    // ------------------------------------------------------------
    app.listen(PORT, () => {
      log.info(`🌍 AI Podcast Suite server running on port ${PORT}`);
    });
  } catch (err) {
    log.error("❌ Server startup failed", { error: err.message });
  }
})();

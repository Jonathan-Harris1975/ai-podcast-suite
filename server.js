// ============================================================
// 🌍 AI Podcast Suite — Main Server (Stable with Podcast Check)
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
// 🩺 Health Root (quick check)
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
// 🧠 Dynamic Route Loader
// ------------------------------------------------------------
(async () => {
  try {
    // 🩺 RSS Health
    try {
      const { default: rssHealthRouter } = await import("./routes/rss-health.js");
      app.use(rssHealthRouter);
      log.info("✅ Route mounted: /api/rss/health");
    } catch (err) {
      log.error("❌ Failed to mount /api/rss/health", { error: err.message });
    }

    // 🎧 Podcast Health
    try {
      const { default: podcastHealthRouter } = await import("./routes/podcast-health.js");
      app.use(podcastHealthRouter);
      log.info("✅ Route mounted: /api/podcast/health");
    } catch (err) {
      log.warn("⚠️ Podcast health route not found (optional).");
    }

    // 🎙️ Podcast Main Route
    try {
      const { default: podcastRouter } = await import("./routes/podcast.js");
      if (!podcastRouter) throw new Error("Missing default export in podcast.js");
      app.use("/podcast", podcastRouter);
      log.info("✅ Route mounted: /podcast");
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
    // 🚀 Start Express Server
    // ------------------------------------------------------------
    app.listen(PORT, () => {
      log.info(`🌍 AI Podcast Suite server running on port ${PORT}`);
      log.info("---------------------------------------------");
      log.info("✅ Active Endpoints:");
      log.info("→ GET  /api/rss/health");
      log.info("→ GET  /api/podcast/health");
      log.info("→ ALL  /podcast");
      log.info("→ POST /run-pipeline");
      log.info("---------------------------------------------");
    });
  } catch (err) {
    log.error("❌ Startup failure", { error: err.message });
  }
})();

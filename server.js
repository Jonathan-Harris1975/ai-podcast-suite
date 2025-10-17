// ============================================================
// 🌍 AI Podcast Suite — Server Bootstrap
// ============================================================

import "./scripts/envBootstrap.js";
import express from "express";
import cors from "cors";
import { log } from "#shared/logger.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Root Health
app.get("/", (_req, res) => {
  res.json({
    service: "AI Podcast Suite",
    status: "online",
    endpoints: [
      "/api/rss/health",
      "/rss/rewrite",
      "/api/podcast/health",
      "/podcast",
      "/run-pipeline",
    ],
  });
});

// Route Registration
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

    // 📰 RSS Rewrite (feed creator service)
    try {
      const { default: rssRoutes } = await import("./services/rss-feed-creator/routes/index.js");
      app.use("/rss", rssRoutes);
      log.info("🧩 Mounted: /rss/rewrite");
    } catch (err) {
      log.error("💥 RSS Rewrite route failed", { error: err.stack });
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
      app.use("/podcast", podcastRouter);
      log.info("🎙️ Mounted: /podcast");
    } catch (err) {
      log.error("💥 Podcast route failed", { error: err.stack });
    }

    // 🔁 Run Pipeline
    app.post("/run-pipeline", async (req, res) => {
      try {
        const { default: runPipeline } = await import("./services/podcast/runPodcastPipeline.js");
        const sessionId = req.body?.sessionId || `TT-${Date.now()}`;
        log.info("🔁 run-pipeline triggered", { sessionId });
        const result = await runPipeline(sessionId, req.body?.text);
        res.json({ ok: true, sessionId, result });
      } catch (err) {
        log.error("💥 run-pipeline error", { error: err.message });
        res.status(500).json({ ok: false, error: err.message });
      }
    });
    log.info("🔁 Mounted: /run-pipeline");

    // Start Server
    app.listen(PORT, () => {
      log.info("🌍 Server started successfully");
      log.info("---------------------------------------------");
      log.info("✅ Active Endpoints:");
      log.info("🧠 → GET  /api/rss/health");
      log.info("📰 → POST /rss/rewrite");
      log.info("🎧 → GET  /api/podcast/health");
      log.info("🎙️ → ALL  /podcast");
      log.info("🔁 → POST /run-pipeline");
      log.info("---------------------------------------------");
    });
  } catch (outerErr) {
    log.error("💥 Fatal startup error", { error: outerErr.stack });
    process.exit(1);
  }
})();

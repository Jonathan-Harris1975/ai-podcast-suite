// ============================================================
// 🎙️ Podcast Route — AI Podcast Suite
// ============================================================
//
//  GET  /podcast   → returns route health
//  POST /podcast   → triggers the pipeline
// ============================================================

import express from "express";
import { runPodcastPipeline } from "../services/podcast/runPodcastPipeline.js";
import { info, error } from "#shared/logger.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  info("🎧 Podcast health pinged");
  res.json({
    ok: true,
    service: "podcast",
    status: "active",
    message: "Podcast route available. POST here to trigger pipeline.",
  });
});

router.post("/", async (req, res) => {
  const sessionId = req.body?.sessionId || `TT-${Date.now()}`;
  try {
    info("🎧 Podcast pipeline start", { sessionId });

    runPodcastPipeline(sessionId)
      .then(() => info("✅ Podcast pipeline complete", { sessionId }))
      .catch((err) =>
        error("💥 Podcast pipeline error", { sessionId, error: err.message })
      );

    res.status(202).json({
      ok: true,
      sessionId,
      message: "Podcast pipeline triggered. Monitor logs for updates.",
    });
  } catch (err) {
    error("💥 Podcast route failure", { sessionId, error: err.message });
    res.status(500).json({
      ok: false,
      sessionId,
      message: "Podcast start failed",
      error: err.message,
    });
  }
});

export default router;

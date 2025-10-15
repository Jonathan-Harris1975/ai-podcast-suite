// /routes/podcast.js — AI Podcast Suite (2025-10-15)
// Triggers the full pipeline and logs progress to console.

import express from "express";
import { runPodcastPipeline } from "../services/podcast/runPodcastPipeline.js"; // central orchestrator
import { info, error } from "../services/shared/utils/logger.js";

const router = express.Router();

/**
 * Health + trigger endpoint
 */
router.all("/", async (req, res) => {
  const isPost = req.method === "POST";
  const sessionId = req.body?.sessionId || `TT-${Date.now()}`;

  if (!isPost) {
    return res.status(200).json({
      ok: true,
      service: "podcast",
      message: "Podcast route active. POST to trigger a new episode.",
      sessionId,
    });
  }

  try {
    info("api.podcast.start", { sessionId });

    // Fire-and-forget orchestration
    runPodcastPipeline(sessionId)
      .then((result) => info("api.podcast.complete", { sessionId, ok: result.ok }))
      .catch((err) => error("api.podcast.error", { sessionId, error: err.message }));

    // Immediate return to avoid Render timeout
    res.status(202).json({
      ok: true,
      sessionId,
      message: "Podcast pipeline started. Check logs for progress.",
    });
  } catch (err) {
    error("api.podcast.fail", { error: err.message });
    res.status(500).json({
      ok: false,
      sessionId,
      message: "Podcast start failed",
      error: err.message,
    });
  }
});

export default router;

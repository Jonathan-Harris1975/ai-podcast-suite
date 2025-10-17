// ============================================================
// 🎙️ Podcast Route — AI Podcast Suite
// ============================================================
//
//  • GET  /podcast  -> health + sessionId preview
//  • POST /podcast  -> triggers podcast pipeline
// ============================================================

import express from "express";
import { runPodcastPipeline } from "../services/podcast/runPodcastPipeline.js";
import { info, error } from "#shared/logger.js";

const router = express.Router();

router.all("/", async (req, res) => {
  const isPost = req.method === "POST";
  const sessionId = req.body?.sessionId || `TT-${Date.now()}`;

  if (!isPost) {
    info("🎙️ Podcast route pinged", { method: req.method, sessionId });
    return res.status(200).json({
      ok: true,
      service: "podcast",
      message: "Podcast route active. POST to trigger a new episode.",
      sessionId,
    });
  }

  try {
    info("🎧 Starting podcast pipeline", { sessionId });

    runPodcastPipeline(sessionId)
      .then(() => info("✅ Podcast pipeline complete", { sessionId }))
      .catch((err) =>
        error("💥 Podcast pipeline error", { sessionId, error: err.message })
      );

    res.status(202).json({
      ok: true,
      sessionId,
      message: "Podcast pipeline started. Check logs for progress.",
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

// ✅ Correct ESM default export
export default router;

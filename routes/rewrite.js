// /routes/rewrite.js
import express from "express";
import { runRewritePipeline } from "../services/rss-feed-creator/services/rewrite-pipeline.js";

const router = express.Router();

/**
 * POST /api/rewrite
 * Fire-and-forget rewrite trigger for RSS feed refresh.
 */
router.post("/", async (req, res) => {
  try {
    // trigger without blocking
    runRewritePipeline()
      .then(result => console.log("🧩 rss:rewrite-pipeline-complete", result))
      .catch(err => console.error("🧩 rss:rewrite-pipeline-error", err));

    res.json({ ok: true, message: "Rewrite pipeline triggered" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

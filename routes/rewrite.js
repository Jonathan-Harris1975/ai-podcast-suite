// routes/rewrite.js
import express from "express";
import { log } from "../utils/logger.js";
import { runRewritePipeline } from "../services/rss-feed-creator/services/rewrite-pipeline.js";

const router = express.Router();

/**
 * Rewrite route — triggers RSS feed rewrite pipeline manually or via webhook.
 */
router.post("/rewrite", async (req, res) => {
  log.info("✅ POST /api/rewrite received");

  try {
    await runRewritePipeline();
    res.json({ ok: true, message: "Rewrite pipeline executed successfully." });
  } catch (err) {
    log.error(`❌ Rewrite route error: ${err.message}`);
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;

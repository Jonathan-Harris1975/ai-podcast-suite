// routes/rewrite.js
import express from "express";
import { runRewritePipeline } from "../services/rss-feed-creator/services/rewrite-pipeline.js";

import { log } from "../services/rss-feed-creator/utils/logger.js";

const router = express.Router();

// POST /api/rewrite
router.post("/rewrite", async (req, res) => {
  try {
    log.info("✅ Webhook verified, triggering rewrite pipeline");

    await runRewritePipeline();

    return res.json({ success: true, message: "Rewrite pipeline triggered" });
  } catch (err) {
    log.error({ err }, "❌ Rewrite route error");
    return res.status(500).json({ error: "Rewrite pipeline failed" });
  }
});

export default router;

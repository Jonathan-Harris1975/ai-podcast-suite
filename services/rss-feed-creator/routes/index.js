// ============================================================
// 🧠 RSS Feed Creator — Routes
// ============================================================
// Exposes an HTTP endpoint for the rewrite pipeline
// POST /rss/rewrite → triggers runRewritePipeline()
// ============================================================

import express from "express";
import { runRewritePipeline } from "../rewrite-pipeline.js";
import { log } from "#shared/logger.js";

const router = express.Router();

router.post("/rewrite", async (_req, res) => {
  log.info("rss.rewrite.trigger");
  try {
    const result = await runRewritePipeline();
    return res.json({ ok: true, ...result });
  } catch (err) {
    log.error("rss.rewrite.fail", { error: err.message });
    return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;

// ============================================================
// 🧠 RSS Feed Creator — Routes (Correct)
// ============================================================
// POST /rss/rewrite → runs the rewrite pipeline
// ============================================================

import express from "express";
import { runRewritePipeline } from "../rewrite-pipeline.js";
import { log } from "#shared/logger.js";

const router = express.Router();

router.post("/rewrite", async (_req, res) => {
  log.info("rss.rewrite.trigger");
  try {
    const result = await runRewritePipeline();
    res.json({ ok: true, ...result });
  } catch (err) {
    log.error("rss.rewrite.fail", { error: err.message });
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;

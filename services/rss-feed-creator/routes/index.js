// ============================================================
// 🧠 RSS Feed Creator — Routes (Stable Build)
// ============================================================

import express from "express";
import { runRewritePipeline } from "../rewrite-pipeline.js";

// Safe import of logger regardless of export style
let log;
try {
  const logger = await import("#shared/logger.js");
  log = logger.log || logger.default || console;
} catch {
  log = console;
}

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

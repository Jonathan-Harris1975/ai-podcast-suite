// routes/rewrite.js
import express from "express";
import { log } from "../utils/logger.js";
import { runRewritePipeline } from "../../services/rss-feed-creator/services/rewrite-pipeline.js";

const router = express.Router();

router.post("/rewrite", async (req, res) => {
  log.info("✅ POST /api/rewrite received");
  log.debug(`Headers: ${JSON.stringify(req.headers)}`);
  let bodySize = 0;
  try {
    bodySize = JSON.stringify(req.body || {}).length;
  } catch {}
  log.debug(`Approx body size: ${bodySize} bytes`);

  try {
    await runRewritePipeline();
    log.info("✅ Rewrite pipeline executed successfully");
    return res.json({ success: true, message: "Rewrite pipeline triggered" });
  } catch (err) {
    log.error(`❌ Rewrite route error: ${err?.message || err}`);
    return res.status(500).json({ error: "Rewrite pipeline failed" });
  }
});

export default router;

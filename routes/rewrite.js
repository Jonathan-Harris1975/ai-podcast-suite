// routes/rewrite.js
import express from "express";
import { log } from "../utils/logger.js";

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
    let pipeline;
    try {
      pipeline = await import("../services/rewrite-pipeline.js");
    } catch {
      try {
        pipeline = await import("../services/rss-feed-creator/services/rewrite-pipeline.js");
      } catch {
        pipeline = null;
      }
    }

    if (!pipeline || typeof pipeline.runRewritePipeline !== "function") {
      log.warn("⚠️ runRewritePipeline not found. Skipping execution.");
      return res.status(501).json({ ok: false, error: "rewrite pipeline not found" });
    }

    await pipeline.runRewritePipeline();
    log.info("✅ Rewrite pipeline executed successfully");
    return res.json({ success: true, message: "Rewrite pipeline triggered" });
  } catch (err) {
    log.error(`❌ Rewrite route error: ${err?.message || err}`);
    return res.status(500).json({ error: "Rewrite pipeline failed" });
  }
});

export default router;

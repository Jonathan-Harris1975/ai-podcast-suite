import express from "express";
import { log } from "../utils/logger.js";
import { runRewritePipeline } from "/app/services/rss-feed-creator/services/rewrite-pipeline.js";

const router = express.Router();

// ✅ route path fixed
router.post("/rewrite", async (req, res) => {
  log.info("✅ POST /api/rewrite received");

  if (typeof runRewritePipeline !== "function") {
    log.warn("⚠️ runRewritePipeline not found. Skipping execution.");
    return res.status(501).json({ error: "rewrite pipeline not found" });
  }

  try {
    const result = await runRewritePipeline();
    log.info("✅ Rewrite pipeline executed successfully");
    res.json({ ok: true, result });
  } catch (err) {
    log.error(`❌ Rewrite route error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

export default router;

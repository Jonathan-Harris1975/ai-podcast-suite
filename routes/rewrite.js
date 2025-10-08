// routes/rewrite.js
import express from "express";
import { log } from "../utils/logger.js";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ dynamically resolve correct service path
const pipelinePath = path.resolve(__dirname, "../services/rss-feed-creator/services/rewrite-pipeline.js");

let runRewritePipeline;
try {
  const mod = await import(pipelinePath);
  runRewritePipeline = mod.runRewritePipeline;
  log.info(`✅ Loaded rewrite pipeline from: ${pipelinePath}`);
} catch (err) {
  log.error(`❌ Failed to import rewrite pipeline: ${err.message}`);
}

router.post("/rewrite", async (req, res) => {
  log.info("✅ POST /api/rewrite received");
  if (typeof runRewritePipeline !== "function") {
    log.warn("⚠️ runRewritePipeline not found. Skipping execution.");
    return res.status(501).json({ error: "Rewrite pipeline missing" });
  }

  try {
    await runRewritePipeline();
    log.info("✅ Rewrite pipeline executed successfully");
    res.json({ success: true });
  } catch (err) {
    log.error(`❌ Rewrite pipeline failed: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

export default router;

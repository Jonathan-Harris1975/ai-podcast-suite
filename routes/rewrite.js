// routes/rewrite.js
import express from "express";
import { log } from "../utils/logger.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const candidatePaths = [
  path.resolve(__dirname, "../../../services/rss-feed-creator/services/rewrite-pipeline.js"),
  path.resolve(__dirname, "../../ai-podcast-suite-main/services/rss-feed-creator/services/rewrite-pipeline.js"),
  path.resolve(__dirname, "../services/rss-feed-creator/services/rewrite-pipeline.js"),
];

let pipelinePath;
for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    pipelinePath = p;
    break;
  }
}

let runRewritePipeline;

async function loadPipeline() {
  if (!pipelinePath) {
    log.error("❌ No rewrite-pipeline.js found in expected paths");
    return;
  }
  try {
    const mod = await import(pathToFileURL(pipelinePath).href);
    runRewritePipeline = mod.runRewritePipeline;
    log.info(`✅ Loaded rewrite pipeline from: ${pipelinePath}`);
  } catch (err) {
    log.error(`❌ Failed to import rewrite pipeline: ${err.message}`);
  }
}

// preload once at startup
await loadPipeline().catch(err => log.error("Pipeline preload failed:", err));

router.post("/", async (req, res) => {
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

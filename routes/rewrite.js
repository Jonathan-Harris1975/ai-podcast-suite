// routes/rewrite.js
import express from "express";
import { log } from "../utils/logger.js";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";  // ✅ required
import fs from "fs";

const router = express.Router();

// Resolve local directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- AUTO-DETECT possible pipeline paths ---
const candidatePaths = [
  // local development
  path.resolve(__dirname, "../../../services/rss-feed-creator/services/rewrite-pipeline.js"),
  // container deployment (/app/routes)
  path.resolve(__dirname, "../../ai-podcast-suite-main/services/rss-feed-creator/services/rewrite-pipeline.js"),
  // flat layout fallback
  path.resolve(__dirname, "../services/rss-feed-creator/services/rewrite-pipeline.js"),
];

let pipelinePath = candidatePaths.find(p => fs.existsSync(p));
let runRewritePipeline;

/**
 * Dynamically import the rewrite pipeline once at startup
 */
async function loadPipeline() {
  if (!pipelinePath) {
    log.error("❌ No valid rewrite-pipeline.js found in expected paths:");
    candidatePaths.forEach(p => log.error(" - " + p));
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

// Preload on startup
await loadPipeline().catch(err => log.error("Pipeline preload failed:", err));

/**
 * POST /api/rewrite
 * Triggers the rewrite pipeline manually
 */
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

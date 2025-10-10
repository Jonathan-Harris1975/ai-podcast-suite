// /routes/rewrite.js — Final 2025.10.10
import express from "express";
import { runRewritePipeline } from "../services/rss-feed-creator/services/rewrite-pipeline.js";

const router = express.Router();

// ✅ Allow both POST /api/rewrite and POST /api/rewrite/
router.post(["/", ""], async (req, res) => {
  console.log("🧩 rss:rewrite-pipeline-start");
  try {
    setImmediate(async () => {
      try {
        await runRewritePipeline();
        console.log("🧩 rss:rewrite-pipeline-complete");
      } catch (err) {
        console.error("🧩 rss:rewrite-pipeline-error", err.message);
      }
    });
    res.status(202).json({ ok: true, message: "Rewrite pipeline triggered" });
  } catch (err) {
    console.error("❌ rss:rewrite-trigger-failed", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Add GET version for quick manual test
router.get(["/", ""], (req, res) => {
  res.status(200).json({ ok: true, message: "Rewrite endpoint reachable" });
});

export default router;

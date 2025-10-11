// /routes/rewrite.js — Final Stable (Render Safe)
import express from "express";
import { runRewritePipeline } from "../services/rss-feed-creator/services/rewrite-pipeline.js";

const router = express.Router();

/**
 * GET /api/rewrite → confirms endpoint is alive
 */
router.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "🎯 Rewrite endpoint active — use POST /api/rewrite to trigger the pipeline.",
  });
});

/**
 * POST /api/rewrite → runs the AI rewrite pipeline
 */
router.post("/", async (req, res) => {
  try {
    const result = await runRewritePipeline();
    return res.status(200).json({
      success: true,
      message: "✅ Rewrite pipeline executed successfully.",
      result: result,
    });
  } catch (err) {
    console.error("❌ Rewrite route failed:", err);
    return res.status(500).json({
      success: false,
      error: err && err.message ? err.message : "Unknown rewrite error",
    });
  }
});

export default router;

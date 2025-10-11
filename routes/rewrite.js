// /app/routes/rewrite.js — Final Clean Version (2025.10.11)
import express from "express";
import { runRewritePipeline } from "../services/rss-feed-creator/services/rewrite-pipeline.js";

const router = express.Router();

/**
 * POST /api/rewrite → runs the AI rewrite pipeline
 */
router.post("/", async (req, res) => {
  try {
    const result = await runRewritePipeline();
    res.status(200).json({
      success: true,
      message: "Rewrite pipeline executed successfully",
      result: result,
    });
  } catch (err) {
    console.error("❌ Rewrite route failed:", err);
    res.status(500).json({
      success: false,
      error: err && err.message ? err.message : "Unknown rewrite error",
    });
  }
});

/**
 * GET /api/rewrite → test endpoint
 */
router.get("/", (req, res) => {
  res.status(200).json({
    message: "🎯 Rewrite endpoint active. Use POST /api/rewrite to trigger pipeline.",
  });
});

export default router;

// /app/routes/rewrite.js
import express from "express";
import { runRewritePipeline } from "../services/rss-feed-creator/services/rewrite-pipeline.js";

const router = express.Router();

/**
 * POST /api/rewrite
 * Runs the AI-powered RSS rewrite pipeline
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
      error: err.message || "Unknown error in rewrite pipeline",
    });
  }
});

/**
 * Simple GET for testing
 */
router.get("/", (req, res) => {
  res.status(200).json({
    message: "🎯 Rewrite endpoint active. Use POST /api/rewrite to trigger pipeline.",
  });
});

export default router;

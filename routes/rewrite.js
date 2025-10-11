// /routes/rewrite.js — AI Podcast Suite stable
import express from "express";
import startFeedCreator from "../services/rss-feed-creator/index.js";

const router = express.Router();

// Quick GET probe for Render/health checks or manual testing
router.get("/", (req, res) => {
  res.status(200).json({
    ok: true,
    route: "/api/rewrite",
    message: "Rewrite route is ready. Use POST to trigger pipeline.",
  });
});

// Main POST endpoint to run the rewrite / RSS generation pipeline
router.post("/", async (req, res) => {
  try {
    const result = await startFeedCreator();
    res.status(200).json({
      success: true,
      message: "Rewrite pipeline executed successfully",
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Rewrite pipeline failed",
      error: error.message,
    });
  }
});

export default router;

// /routes/rewrite.js — AI Podcast Suite (Final Stable 2025-10-11)
import express from "express";
import startFeedCreator from "../services/rss-feed-creator/index.js";

const router = express.Router();

/**
 * Handles both GET (status check) and POST (run rewrite pipeline)
 */
router.all("/", async (req, res) => {
  const isPost = req.method === "POST";

  if (!isPost) {
    return res.status(200).json({
      status: "ok",
      route: "rewrite",
      message: "Rewrite route is active. Use POST to trigger pipeline.",
      method: req.method,
    });
  }

  try {
    const result = await startFeedCreator();
    res.status(200).json({
      success: true,
      route: "rewrite",
      message: "Rewrite pipeline executed successfully.",
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      route: "rewrite",
      message: "Rewrite pipeline failed.",
      error: error.message,
    });
  }
});

export default router;

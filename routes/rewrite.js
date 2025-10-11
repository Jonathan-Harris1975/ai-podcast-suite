// /routes/rewrite.js — AI Podcast Suite 2025-10-11
import express from "express";
import startFeedCreator from "../services/rss-feed-creator/index.js"; // 🧠 entrypoint

const router = express.Router();

// GET for status check
router.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "Rewrite route ready" });
});

// POST to trigger the feed creation process
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

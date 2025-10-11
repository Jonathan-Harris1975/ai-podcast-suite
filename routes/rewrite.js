// /routes/rewrite.js — Final Stable 2025-10-11
import express from "express";
import startFeedCreator from "../services/rss-feed-creator/index.js";

const router = express.Router();

// ✅ Respond to GET for quick test
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    route: "/api/rewrite",
    method: "GET",
    message: "Rewrite route is active and reachable"
  });
});

// ✅ Respond to POST to trigger feed rewrite pipeline
router.post("/", async (req, res) => {
  try {
    const result = await startFeedCreator();
    res.status(200).json({
      success: true,
      route: "/api/rewrite",
      method: "POST",
      message: "Rewrite pipeline executed successfully",
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      route: "/api/rewrite",
      method: "POST",
      error: error.message
    });
  }
});

export default router;

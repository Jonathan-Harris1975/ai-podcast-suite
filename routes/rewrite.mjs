import express from "express";
import startFeedCreator from "../services/rss-feed-creator/index.js";

const router = express.Router();

// GET /api/rewrite
router.get("/", async (req, res) => {
  try {
    res.status(200).json({
      route: "rewrite",
      method: "GET",
      message: "Rewrite route active. Use POST to trigger pipeline."
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rewrite
router.post("/", async (req, res) => {
  try {
    const result = await startFeedCreator();
    res.status(200).json({
      route: "rewrite",
      method: "POST",
      result
    });
  } catch (err) {
    res.status(500).json({
      route: "rewrite",
      error: err.message
    });
  }
});

export default router;

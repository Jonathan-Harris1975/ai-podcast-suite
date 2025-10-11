import express from "express";
import startFeedCreator from "../services/rss-feed-creator/index.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const result = await startFeedCreator();
    res.status(200).json({ success: true, message: "Rewrite pipeline complete", result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

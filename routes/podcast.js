// /routes/podcast.js — Fixed 2025.10.11
import express from "express";
import { runPodcastPipeline } from "../services/tts/index.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const result = await runPodcastPipeline(req.body);
    res.status(200).json({ success: true, result: result });
  } catch (err) {
    console.error("❌ podcast error", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

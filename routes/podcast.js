// /routes/podcast.js — Render Safe (2025.10.11)
import express from "express";
import { runPodcastPipeline } from "../services/podcast/processor.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🎧 Podcast endpoint active — POST /api/podcast to trigger processing",
  });
});

router.post("/", async (req, res) => {
  try {
    const result = await runPodcastPipeline();
    res.status(200).json({
      success: true,
      message: "✅ Podcast pipeline executed successfully",
      result: result,
    });
  } catch (err) {
    console.error("❌ Podcast route failed:", err);
    res.status(500).json({
      success: false,
      error: err && err.message ? err.message : "Unknown podcast error",
    });
  }
});

export default router;

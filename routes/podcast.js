// /app/routes/podcast.js
import express from "express";

const router = express.Router();

/**
 * GET /api/podcast
 * Placeholder route — future podcast generation logic will live here.
 */
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🎙️ Podcast endpoint placeholder active",
  });
});

export default router;

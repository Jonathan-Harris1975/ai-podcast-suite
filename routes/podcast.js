// /app/routes/podcast.js — Final Clean Version (2025.10.11)
import express from "express";

const router = express.Router();

/**
 * GET /api/podcast → placeholder endpoint
 */
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🎙️ Podcast endpoint placeholder active",
  });
});

export default router;

// /routes/podcast.js
import express from "express";
const router = express.Router();

/**
 * POST /api/podcast
 * Logs and echoes podcast creation requests.
 */
router.post("/", async (req, res) => {
  const { script = "", voice = "default" } = req.body || {};
  console.log("🎙️ Podcast endpoint hit", { chars: script.length, voice });
  res.json({
    success: true,
    message: "Podcast request received",
    chars: script.length,
    voice
  });
});

export default router;

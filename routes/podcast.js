// /routes/podcast.js
import express from "express";
const router = express.Router();

router.post("/", (req, res) => {
  const { script = "", voice = "default" } = req.body || {};
  console.log("🎙️ Podcast endpoint hit", { chars: script.length, voice });
  res.json({ success: true, message: "Podcast request received" });
});

export default router;

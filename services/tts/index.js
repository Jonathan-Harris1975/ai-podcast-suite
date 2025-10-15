// services/tts/index.js
// AI Podcast Suite – TTS root entry
// Centralized logger + R2 integration, Gemini-only (MP3)

import express from "express";
import { renderChunksToMp3 } from "./renderChunksToMp3.js"; // your internal Gemini logic
import { info, error } from "../shared/utils/logger.js";

export const router = express.Router();

// Health check (optional)
router.get("/health", (req, res) => {
  res.json({ ok: true, service: "tts", time: new Date().toISOString() });
});

// Main generation endpoint
router.post("/generate", async (req, res) => {
  const { sessionId, textChunks, voiceConfig } = req.body || {};
  try {
    if (!sessionId || !Array.isArray(textChunks)) {
      return res.status(400).json({ ok: false, error: "Invalid input" });
    }

    info("tts.api.start", { sessionId, count: textChunks.length });
    const result = await renderChunksToMp3({ sessionId, textChunks, voiceConfig });
    info("tts.api.done", { sessionId, ok: result.ok, fail: result.fail });
    res.json({ ok: true, result });
  } catch (err) {
    error("tts.api.fail", { error: err.message });
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Export router (so /services/api/index.js can mount it)
export default router;

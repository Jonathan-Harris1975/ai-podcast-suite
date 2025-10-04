
// apps/tts/routes/index.js
import express from "express";
import { processTTS } from "../services/ttsProcessor.js";
import { withRetry } from "../../../utils/retry.js";
import { log } from "../../../utils/logger.js";

const router = express.Router();

router.post("/tts", async (req, res) => {
  try {
    const result = await withRetry(
      () => processTTS(req.body),
      { retries: 3, delay: 2000, label: "🗣️ TTS processing" }
    );
    return res.json({ success: true, result });
  } catch (err) {
    log.error({ err }, "❌ TTS processing failed after retries");
    return res.status(500).json({ error: "TTS processing failed" });
  }
});

export default router;

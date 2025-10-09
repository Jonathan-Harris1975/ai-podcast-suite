import { s3, R2_BUCKETS, validateR2Once, uploadBuffer, listKeys, getObjectAsText } from "../../r2-client.js";
import express from "express";
import { log } from "../../../utils/logger.js";
import { sendWebhook } from "../utils/webhooks.js";

const router = express.Router();

router.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

router.post("/", async (req, res) => {
  const { sessionId } = req.body || {};
  log.info({ sessionId }, "🔔 Health POST");
  // Kick TTS right away
  await sendWebhook("TTS_WEBHOOK", process.env.TTS_WEBHOOK, { sessionId });
  res.json({ ok: true, kicked: !!sessionId });
});

export default router;

import { env } from "../../utils/env.js";
import { logger } from "../../utils/logger.js";
import { sendWebhook } from "../../utils/webhook.js";

export async function triggerTTS(sessionId) {
  if (!env.TTS_START_URL) {
    logger.info("TTS_START_URL not set; skipping (no-op).");
    return { skipped: true };
  }
  const payload = { sessionId };
  const url = env.TTS_START_URL.replace(":sessionId", sessionId);
  const text = await sendWebhook(url, payload, sessionId);
  return { ok: true, text };
}

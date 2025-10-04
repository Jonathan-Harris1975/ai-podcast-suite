import { env } from "../../utils/env.js";
import { logger } from "../../utils/logger.js";
import { sendWebhook } from "../../utils/webhook.js";

export async function triggerArtwork(sessionId) {
  if (!env.ARTWORK_START_URL) {
    logger.info("ARTWORK_START_URL not set; skipping (no-op).");
    return { skipped: true };
  }
  const payload = { sessionId };
  const url = env.ARTWORK_START_URL.replace(":sessionId", sessionId);
  const text = await sendWebhook(url, payload, sessionId);
  return { ok: true, text };
}

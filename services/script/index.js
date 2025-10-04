import { env } from "../../utils/env.js";
import { logger } from "../../utils/logger.js";
import { sendWebhook } from "../../utils/webhook.js";

export async function triggerScript(sessionId) {
  if (!env.SCRIPT_START_URL) {
    logger.info("SCRIPT_START_URL not set; skipping (no-op).");
    return { skipped: true };
  }
  const payload = { sessionId, feedUrl: env.FEED_URL };
  const url = env.SCRIPT_START_URL.replace(":sessionId", sessionId);
  const text = await sendWebhook(url, payload, sessionId);
  return { ok: true, text };
}

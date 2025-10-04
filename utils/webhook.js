import crypto from "crypto";
import { env } from "./env.js";
import { logger } from "./logger.js";
import { fetch } from "undici";

export async function sendWebhook(url, body, sessionId, extraHeaders = {}) {
  const headers = {
    "content-type": "application/json",
    "x-session-id": sessionId,
    ...extraHeaders
  };

  if (env.DOWNSTREAM_WEBHOOKS_ENABLED && env.DOWNSTREAM_WEBHOOK_SIGNATURE_MODE !== "none") {
    if (env.DOWNSTREAM_WEBHOOK_SIGNATURE_MODE === "hmac-sha256-base64") {
      const raw = Buffer.from(JSON.stringify(body), "utf8");
      const sig = crypto.createHmac("sha256", env.DOWNSTREAM_WEBHOOK_SECRET).update(raw).digest("base64");
      headers["x-signature"] = sig;
    } else {
      logger.warn({ mode: env.DOWNSTREAM_WEBHOOK_SIGNATURE_MODE }, "Unknown outgoing signature mode");
    }
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    const err = new Error(`Webhook POST failed: ${res.status} ${res.statusText}`);
    err.responseBody = text;
    throw err;
  }
  return text;
}

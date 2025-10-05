import { env } from "./env.js";
import { log as logger } from "./logger.js";
import { fetch } from "undici";

export async function sendWebhook(url, body, sessionId, extraHeaders = {}) {
  const headers = {
    "content-type": "application/json",
    "x-session-id": sessionId,
    ...extraHeaders
  };

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

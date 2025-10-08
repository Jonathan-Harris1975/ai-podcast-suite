import fetch from "node-fetch";
import { log } from "../../../utils/logger.js";

export async function postWebhook(name, payload) {
  const url = process.env[name];
  if (!url) {
    log.warn({ name }, "⚠️ webhook env missing");
    return { ok: false, status: 0, error: "missing env" };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
      timeout: 60000
    });
    const text = await res.text().catch(() => "");
    log.info({ name, status: res.status }, "🔗 webhook → " + name);
    if (!res.ok) return { ok: false, status: res.status, text };
    return { ok: true, status: res.status, text };
  } catch (e) {
    log.error({ name, err: e.message }, "webhook error");
    return { ok: false, status: 0, error: e.message };
  }
}

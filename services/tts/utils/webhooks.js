// services/tts/utils/webhooks.js
// Generic optional webhook poster (no Hookdeck). Uses global fetch (Node 18+).
export async function postWebhook(envKey, payload) {
  try {
    const url = process.env[envKey];
    if (!url) return { ok: false, skipped: true, reason: `Missing env ${envKey}` };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {})
    });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

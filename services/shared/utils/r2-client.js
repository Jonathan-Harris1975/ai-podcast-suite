// /services/utils/r2-client.js — Added (2025-10-12)
// Follows same log and fetch style used in rewrite-pipeline.js

import fetch from "node-fetch";
import { log } from "./logger.js";

const ENDPOINT = process.env.R2_ENDPOINT;
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;

// Default public read URLs (as per your env)
const PUBLIC_RAW = process.env.R2_PUBLIC_BASE_URL_RAW;
const PUBLIC_META = process.env.R2_PUBLIC_BASE_URL_META;
const DEFAULT_BUCKET = process.env.R2_BUCKET_META || "podcast-meta";

// ────────────────────────────────────────────────
// 🧩 Basic S3-compatible R2 helper
// ────────────────────────────────────────────────

export async function getObject(key) {
  try {
    const url = `${PUBLIC_META}/${encodeURIComponent(key)}`;
    const res = await fetch(url);
    if (!res.ok) {
      log.warn({ key, status: res.status }, "⚠️ R2 getObject non-200");
      return null;
    }
    const text = await res.text();
    return text;
  } catch (err) {
    log.error({ key, error: err.message }, "❌ R2 getObject failed");
    return null;
  }
}

export async function putJson(key, data) {
  try {
    const body = JSON.stringify(data, null, 2);
    const res = await fetch(`${ENDPOINT}/${DEFAULT_BUCKET}/${key}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(`${ACCESS_KEY}:${SECRET_KEY}`).toString("base64")}`,
      },
      body,
    });
    if (!res.ok) {
      log.warn({ key, status: res.status }, "⚠️ R2 putJson non-200");
    } else {
      log.info({ key }, "✅ R2 putJson success");
    }
  } catch (err) {
    log.error({ key, error: err.message }, "❌ R2 putJson failed");
  }
}

export async function putText(key, text) {
  try {
    const res = await fetch(`${ENDPOINT}/${DEFAULT_BUCKET}/${key}`, {
      method: "PUT",
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Authorization": `Basic ${Buffer.from(`${ACCESS_KEY}:${SECRET_KEY}`).toString("base64")}`,
      },
      body: text,
    });
    if (!res.ok) {
      log.warn({ key, status: res.status }, "⚠️ R2 putText non-200");
    } else {
      log.info({ key }, "✅ R2 putText success");
    }
  } catch (err) {
    log.error({ key, error: err.message }, "❌ R2 putText failed");
  }

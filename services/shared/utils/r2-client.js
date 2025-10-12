// /services/utils/r2-client.js
// 🧠 AI Podcast Suite — Cloudflare R2 Unified Client (2025-10-12)
// Compatible with repo logging and node-fetch pattern.

import fetch from "node-fetch";
import { log } from "./logger.js";

// ────────────────────────────────────────────────
// 🔧 Core Env Configuration
// ────────────────────────────────────────────────
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

// All buckets mapped 1-to-1 from env
const BUCKETS = {
  chunks: process.env.R2_BUCKET_CHUNKS,
  merged: process.env.R2_BUCKET_MERGED,
  meta: process.env.R2_BUCKET_META,
  podcastRssFeeds: process.env.R2_BUCKET_PODCAST_RSS_FEEDS,
  podcast: process.env.R2_BUCKET_PODCAST,
  rawText: process.env.R2_BUCKET_RAW_TEXT,
  raw: process.env.R2_BUCKET_RAW,
  rssFeeds: process.env.R2_BUCKET_RSS_FEEDS,
  transcripts: process.env.R2_BUCKET_TRANSCRIPTS,
};

// Public base URLs (for GETs)
const PUBLIC_URLS = {
  chunks: process.env.R2_PUBLIC_BASE_URL_CHUNKS,
  merged: process.env.R2_PUBLIC_BASE_URL_MERGE,
  meta: process.env.R2_PUBLIC_BASE_URL_META,
  podcastRssFeeds: process.env.R2_PUBLIC_BASE_URL_PODCAST_RSS,
  podcast: process.env.R2_PUBLIC_BASE_URL_PODCAST,
  rawText: process.env.R2_PUBLIC_BASE_URL_RAW_TEXT,
  raw: process.env.R2_PUBLIC_BASE_URL_RAW,
  rssFeeds: process.env.R2_PUBLIC_BASE_URL_RSS,
  transcripts: process.env.R2_PUBLIC_BASE_URL_TRANSCRIPT,
};

// ────────────────────────────────────────────────
// 🪵 Internal helper
// ────────────────────────────────────────────────
function authHeader() {
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) return {};
  const token = Buffer.from(`${R2_ACCESS_KEY_ID}:${R2_SECRET_ACCESS_KEY}`).toString("base64");
  return { Authorization: `Basic ${token}` };
}

// ────────────────────────────────────────────────
// 🧭 Bucket selector (based on key / file type)
// ────────────────────────────────────────────────
function selectBucket(key = "") {
  const lower = key.toLowerCase();
  if (lower.endsWith(".mp3")) return BUCKETS.podcast;
  if (lower.endsWith(".xml")) return BUCKETS.rssFeeds;
  if (lower.endsWith(".json")) return BUCKETS.meta;
  if (lower.includes("chunk")) return BUCKETS.chunks;
  if (lower.includes("merge")) return BUCKETS.merged;
  if (lower.includes("raw-text")) return BUCKETS.rawText;
  if (lower.includes("raw")) return BUCKETS.raw;
  if (lower.includes("transcript")) return BUCKETS.transcripts;
  if (lower.includes("rss")) return BUCKETS.podcastRssFeeds;
  return BUCKETS.meta;
}

function selectPublicBase(key = "") {
  const lower = key.toLowerCase();
  if (lower.endsWith(".mp3")) return PUBLIC_URLS.podcast;
  if (lower.endsWith(".xml")) return PUBLIC_URLS.rssFeeds;
  if (lower.endsWith(".json")) return PUBLIC_URLS.meta;
  if (lower.includes("chunk")) return PUBLIC_URLS.chunks;
  if (lower.includes("merge")) return PUBLIC_URLS.merged;
  if (lower.includes("raw-text")) return PUBLIC_URLS.rawText;
  if (lower.includes("raw")) return PUBLIC_URLS.raw;
  if (lower.includes("transcript")) return PUBLIC_URLS.transcripts;
  if (lower.includes("rss")) return PUBLIC_URLS.podcastRssFeeds;
  return PUBLIC_URLS.meta;
}

// ────────────────────────────────────────────────
// 📥 getObject
// ────────────────────────────────────────────────
export async function getObject(key) {
  const base = selectPublicBase(key);
  const url = `${base}/${encodeURIComponent(key)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      log.warn({ key, status: res.status }, "⚠️ R2 getObject non-200");
      return null;
    }
    const text = await res.text();
    log.info({ key, base }, "✅ R2 getObject success");
    return text;
  } catch (err) {
    log.error({ key, error: err.message }, "❌ R2 getObject failed");
    return null;
  }
}

// ────────────────────────────────────────────────
// 💾 putJson
// ────────────────────────────────────────────────
export async function putJson(key, obj) {
  const bucket = selectBucket(key);
  const url = `${R2_ENDPOINT}/${bucket}/${encodeURIComponent(key)}`;
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify(obj, null, 2),
    });
    if (!res.ok) {
      log.warn({ key, status: res.status }, "⚠️ R2 putJson non-200");
    } else {
      log.info({ key, bucket }, "✅ R2 putJson success");
    }
  } catch (err) {
    log.error({ key, error: err.message }, "❌ R2 putJson failed");
  }
}

// ────────────────────────────────────────────────
// ✍️ putText
// ────────────────────────────────────────────────
export async function putText(key, text) {
  const bucket = selectBucket(key);
  const url = `${R2_ENDPOINT}/${bucket}/${encodeURIComponent(key)}`;
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        ...authHeader(),
      },
      body: text,
    });
    if (!res.ok) {
      log.warn({ key, status: res.status }, "⚠️ R2 putText non-200");
    } else {
      log.info({ key, bucket }, "✅ R2 putText success");
    }
  } catch (err) {
    log.error({ key, error: err.message }, "❌ R2 putText failed");
  }
    }

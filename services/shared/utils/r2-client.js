// /shared/utils/r2-client.js
// 🌩️ Cloudflare R2 Unified Client for AI Podcast Suite (2025-10-12)

import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";

// ────────────────────────────────────────────────
// 🧩 Environment Setup
// ────────────────────────────────────────────────
const REGION = "auto"; // Cloudflare R2 uses 'auto'
const ENDPOINT = process.env.R2_ENDPOINT;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

if (!ENDPOINT || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
  process.stdout.write(
    JSON.stringify({
      time: new Date().toISOString(),
      level: "warn",
      message: "⚠️ R2 credentials or endpoint missing — read/write disabled",
    }) + "\n"
  );
}

export const s3 = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

// ────────────────────────────────────────────────
// 🧾 Utility: Log helper
// ────────────────────────────────────────────────
function log(level, message, meta) {
  const entry = { time: new Date().toISOString(), level, message };
  if (meta && typeof meta === "object") entry.meta = meta;
  process.stdout.write(JSON.stringify(entry) + "\n");
}

// ────────────────────────────────────────────────
// 🪣 Bucket Map
// ────────────────────────────────────────────────
const BUCKETS = {
  art: process.env.R2_BUCKET_ART,
  chunks: process.env.R2_BUCKET_CHUNKS,
  merged: process.env.R2_BUCKET_MERGED,
  meta: process.env.R2_BUCKET_META,
  podcastRss: process.env.R2_BUCKET_PODCAST_RSS_FEEDS,
  podcast: process.env.R2_BUCKET_PODCAST,
  rawText: process.env.R2_BUCKET_RAW_TEXT,
  raw: process.env.R2_BUCKET_RAW,
  rss: process.env.R2_BUCKET_RSS_FEEDS,
  transcripts: process.env.R2_BUCKET_TRANSCRIPTS,
};

// ────────────────────────────────────────────────
// 🎯 Bucket Picker
// ────────────────────────────────────────────────
function pickBucket(key = "") {
  const lower = key.toLowerCase();
  if (lower.endsWith(".mp3")) return BUCKETS.podcast;
  if (lower.endsWith(".json")) return BUCKETS.meta;
  if (lower.endsWith(".xml")) return BUCKETS.rss;
  if (lower.includes("chunk")) return BUCKETS.chunks;
  if (lower.includes("transcript")) return BUCKETS.transcripts;
  if (lower.includes("merge")) return BUCKETS.merged;
  if (lower.includes("raw")) return BUCKETS.raw;
  return BUCKETS.meta || BUCKETS.podcast;
}

// ────────────────────────────────────────────────
// 🧠 Core Functions
// ────────────────────────────────────────────────

// Convert stream to string
async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
}

export async function getObject(key) {
  const bucket = pickBucket(key);
  try {
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    const data = await s3.send(cmd);
    const text = await streamToString(data.Body instanceof Readable ? data.Body : Readable.from([]));
    log("info", "📥 R2 getObject success", { key, bucket });
    return text;
  } catch (err) {
    log("error", "❌ R2 getObject failed", { key, bucket, error: err.message });
    return null;
  }
}

export async function putJson(key, obj) {
  const bucket = pickBucket(key);
  try {
    const body = JSON.stringify(obj, null, 2);
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "application/json",
    });
    await s3.send(cmd);
    log("info", "✅ R2 putJson success", { key, bucket });
  } catch (err) {
    log("error", "❌ R2 putJson failed", { key, bucket, error: err.message });
  }
}

export async function putText(key, text) {
  const bucket = pickBucket(key);
  try {
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: text,
      ContentType: "text/plain; charset=utf-8",
    });
    await s3.send(cmd);
    log("info", "✅ R2 putText success", { key, bucket });
  } catch (err) {
    log("error", "❌ R2 putText failed", { key, bucket, error: err.message });
  }
                                      

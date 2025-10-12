// /shared/utils/r2-client.js
// ⚙️ AI Podcast Suite — Smart Cloudflare R2 Client (2025.10.12 FINAL)
// Full audio-aware automation (Render / Shiper ready)

import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// ────────────────────────────────────────────────
// 🪵 Structured Logger
// ────────────────────────────────────────────────
function log(level, message, meta = undefined) {
  const entry = { time: new Date().toISOString(), level, message };
  if (meta && typeof meta === "object") entry.meta = meta;
  process.stdout.write(JSON.stringify(entry) + "\n");
}

// ────────────────────────────────────────────────
// 🌍 Cloudflare R2 Configuration
// ────────────────────────────────────────────────
const endpoint = process.env.R2_ENDPOINT;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

// Register all real buckets
const buckets = {
  ART: process.env.R2_BUCKET_ART,
  CHUNKS: process.env.R2_BUCKET_CHUNKS,
  MERGED: process.env.R2_BUCKET_MERGED,
  META: process.env.R2_BUCKET_META,
  PODCAST_RSS_FEEDS: process.env.R2_BUCKET_PODCAST_RSS_FEEDS,
  PODCAST: process.env.R2_BUCKET_PODCAST, // ✅ Final merged podcasts
  RAW_TEXT: process.env.R2_BUCKET_RAW_TEXT,
  RAW: process.env.R2_BUCKET_RAW, // ✅ Raw audio chunks
  RSS_FEEDS: process.env.R2_BUCKET_RSS_FEEDS,
  TRANSCRIPTS: process.env.R2_BUCKET_TRANSCRIPTS,
};

if (!endpoint || !accessKeyId || !secretAccessKey) {
  log("warn", "⚠️ Missing R2 credentials — client disabled.");
}

const client =
  endpoint && accessKeyId && secretAccessKey
    ? new S3Client({
        region: "auto",
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
      })
    : null;

// ────────────────────────────────────────────────
// 🧠 Smart Bucket Detection
// ────────────────────────────────────────────────
function detectBucket(Key = "") {
  const key = Key.toLowerCase();

  // 1️⃣ Podcast RSS feeds
  if (key.includes("podcast-rss") || key.includes("podcast_feed") || key.includes("podcast.xml"))
    return buckets.PODCAST_RSS_FEEDS;

  // 2️⃣ AI rewrite RSS feeds
  if (key.endsWith(".rss") || key.includes("ai-rss") || key.includes("feed.xml"))
    return buckets.RSS_FEEDS;

  // 3️⃣ Meta data
  if (key.includes("meta") || key.includes("cursor") || key.includes("items"))
    return buckets.META;

  // 4️⃣ Transcripts
  if (key.includes("transcript") || key.includes("caption"))
    return buckets.TRANSCRIPTS;

  // 5️⃣ Raw text sources
  if (key.endsWith(".txt") || key.includes("feeds.txt") || key.includes("urls.txt"))
    return buckets.RAW_TEXT;

  // 6️⃣ Final merged podcast audio
  if (
    key.endsWith(".mp3") ||
    key.endsWith(".wav") ||
    key.endsWith(".flac") ||
    key.endsWith(".m4a")
  ) {
    // Differentiate raw chunks vs final
    if (key.includes("chunk") || key.includes("segment") || key.includes("part"))
      return buckets.RAW; // 🎙️ Raw audio chunk
    return buckets.PODCAST; // 🎧 Final podcast
  }

  // 7️⃣ Artwork
  if (key.endsWith(".jpg") || key.endsWith(".jpeg") || key.endsWith(".png") || key.endsWith(".webp"))
    return buckets.ART;

  // 8️⃣ Default fallback
  return buckets.MERGED;
}

// ────────────────────────────────────────────────
// 🔧 Helper — Stream → String
// ────────────────────────────────────────────────
async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

// ────────────────────────────────────────────────
// 📦 Core Operations
// ────────────────────────────────────────────────
export async function getObject(Key) {
  if (!client) return null;
  const Bucket = detectBucket(Key);
  try {
    const result = await client.send(new GetObjectCommand({ Bucket, Key }));
    const body = await streamToString(result.Body);
    log("info", "✅ R2 getObject", { Bucket, Key, bytes: body.length });
    return body;
  } catch (err) {
    log("error", "❌ R2 getObject failed", { Bucket, Key, error: err.message });
    return null;
  }
}

export async function putText(Key, text) {
  if (!client) return null;
  const Bucket = detectBucket(Key);
  try {
    await client.send(
      new PutObjectCommand({
        Bucket,
        Key,
        Body: text,
        ContentType: "text/plain",
      })
    );
    log("info", "✅ R2 putText", { Bucket, Key, bytes: text.length });
    return true;
  } catch (err) {
    log("error", "❌ R2 putText failed", { Bucket, Key, error: err.message });
    return false;
  }
}

export async function putJson(Key, data) {
  if (!client) return null;
  const Bucket = detectBucket(Key);
  try {
    const Body = JSON.stringify(data, null, 2);
    await client.send(
      new PutObjectCommand({
        Bucket,
        Key,
        Body,
        ContentType: "application/json",
      })
    );
    log("info", "✅ R2 putJson", { Bucket, Key, bytes: Body.length });
    return true;
  } catch (err) {
    log("error", "❌ R2 putJson failed", { Bucket, Key, error: err.message });
    return false;
  }
}

export async function putBuffer(Key, buffer, contentType = "application/octet-stream") {
  if (!client) return null;
  const Bucket = detectBucket(Key);
  try {
    await client.send(new PutObjectCommand({ Bucket, Key, Body: buffer, ContentType: contentType }));
    log("info", "✅ R2 putBuffer", { Bucket, Key, bytes: buffer.length });
    return true;
  } catch (err) {
    log("error", "❌ R2 putBuffer failed", { Bucket, Key, error: err.message });
    return false;
  }
}

export async function deleteObject(Key) {
  if (!client) return null;
  const Bucket = detectBucket(Key);
  try {
    await client.send(new DeleteObjectCommand({ Bucket, Key }));
    log("info", "🗑️ R2 deleteObject", { Bucket, Key });
    return true;
  } catch (err) {
    log("error", "❌ R2 deleteObject failed", { Bucket, Key, error: err.message });
    return false;
  }
}

// ────────────────────────────────────────────────
// 🔚 Export
// ────────────────────────────────────────────────
export default {
  getObject,
  putJson,
  putText,
  putBuffer,
  deleteObject,
  detectBucket,
};

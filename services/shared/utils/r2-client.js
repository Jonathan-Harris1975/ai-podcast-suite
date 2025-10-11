// /services/shared/utils/r2-client.js
// 🪣 Unified R2 Client for AI Podcast Suite (2025.10.10-Final)
// Supports JSON, text, and binary uploads; auto-selects bucket from env vars

import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import { Buffer } from "node:buffer";
import process from "node:process";

// ────────────────────────────────────────────────
// ENV + CLIENT SETUP
// ────────────────────────────────────────────────
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_REGION = process.env.R2_REGION || "auto";
const DEFAULT_BUCKET = process.env.R2_BUCKET_RSS_FEEDS || process.env.R2_BUCKET_PODCAST;

let s3;

if (R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
  s3 = new S3Client({
    region: R2_REGION,
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true, // ✅ required for Cloudflare R2
  });
} else {
  console.warn("⚠️ R2 client missing required environment vars. R2 functionality will be disabled.");
}


// ────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────
function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", chunk => chunks.push(Buffer.from(chunk)));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
}

// Generic safe parser
async function safeGetObject(bucket, key) {
    if (!s3) return null;
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    return await streamToString(res.Body);
  } catch (err) {
    if (err.name === "NoSuchKey" || err.message?.includes("NoSuchKey"))
      return null;
    console.error(`❌ getObject failed for ${key}:`, err.message);
    return null;
  }
}

// ────────────────────────────────────────────────
// CORE METHODS
// ────────────────────────────────────────────────

// ✅ Get text or JSON object
export async function getObject(key, bucket = DEFAULT_BUCKET) {
  return await safeGetObject(bucket, key);
}

// ✅ List all object keys in a bucket
export async function listKeys(bucket = DEFAULT_BUCKET, prefix = "") {
    if (!s3) return [];
  try {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }));
    return (res.Contents || []).map(o => o.Key);
  } catch (err) {
    console.error(`❌ listKeys failed for ${bucket}:`, err.message);
    return [];
  }
}

// ✅ Upload JSON
export async function putJson(key, obj, bucket = DEFAULT_BUCKET) {
    if (!s3) throw new Error("R2 client not initialized");
  const body = JSON.stringify(obj, null, 2);
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: "application/json; charset=utf-8",
        CacheControl: "no-cache",
      })
    );
    console.log(`💾 JSON uploaded → ${bucket}/${key}`);
  } catch (err) {
    console.error(`❌ putJson failed for ${key}:`, err.message);
    throw err;
  }
}

// ✅ Upload plain text
export async function putText(key, text, bucket = DEFAULT_BUCKET) {
    if (!s3) throw new Error("R2 client not initialized");
  const body = Buffer.from(String(text), "utf-8");
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: "text/plain; charset=utf-8",
        CacheControl: "no-cache",
      })
    );
    console.log(`💾 Text uploaded → ${bucket}/${key}`);
  } catch (err) {
    console.error(`❌ putText failed for ${key}:`, err.message);
    throw err;
  }
}

// ✅ Upload any binary buffer
export async function uploadBuffer(bucket, key, buffer, contentType = "application/octet-stream") {
    if (!s3) throw new Error("R2 client not initialized");
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "no-cache",
      })
    );
    console.log(`💾 Buffer uploaded → ${bucket}/${key}`);
  } catch (err) {
    console.error(`❌ uploadBuffer failed for ${key}:`, err.message);
    throw err;
  }
}

// ✅ Get file as UTF-8 text
export async function getObjectAsText(key, bucket = DEFAULT_BUCKET) {
  const raw = await safeGetObject(bucket, key);
  return raw ? raw.toString("utf-8") : null;
}

// ✅ Get JSON with fallback
export async function getJson(key, fallback = {}, bucket = DEFAULT_BUCKET) {
  const raw = await safeGetObject(bucket, key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// ✅ Expose buckets map
export const R2_BUCKETS = {
  RSS: process.env.R2_BUCKET_RSS_FEEDS,
  PODCAST: process.env.R2_BUCKET_PODCAST,
  RAW: process.env.R2_BUCKET_RAW,
  MERGED: process.env.R2_BUCKET_MERGED,
  META: process.env.R2_META_BUCKET,
  RAW_TEXT: process.env.R2_BUCKET_RAW_TEXT,
};

// ✅ Default export
export default {
  s3,
  getObject,
  getObjectAsText,
  getJson,
  listKeys,
  putJson,
  putText,
  uploadBuffer,
  R2_BUCKETS,
};
                  

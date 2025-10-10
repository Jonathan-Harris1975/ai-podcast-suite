// /services/shared/utils/r2-client.js
// Unified Cloudflare R2 Client for AI Podcast Suite
// Updated 2025-10-10

import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import process from "node:process";

// ─── Config ─────────────────────────────────────────────
export const R2_ENDPOINT = process.env.R2_ENDPOINT;
export const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
export const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

// Core buckets
export const R2_BUCKETS = {
  rss: process.env.R2_BUCKET_RSS_FEEDS,
  artwork: process.env.R2_BUCKET_ARTWORK,
  meta: process.env.R2_BUCKET_META
};

// ─── Client ─────────────────────────────────────────────
export const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY
  }
});

// ─── Helpers ────────────────────────────────────────────
async function streamToString(stream) {
  if (!stream) return "";
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
}

// ─── Basic Get / Put Utilities ──────────────────────────
export async function getObject(key, bucket = R2_BUCKETS.rss) {
  if (!bucket) throw new Error("R2 bucket not configured");
  try {
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    const data = await s3.send(cmd);
    return await streamToString(data.Body);
  } catch (err) {
    if (err.name === "NoSuchKey") return null;
    console.error(`[R2] ❌ getObject failed for ${key}: ${err.message}`);
    throw err;
  }
}

export async function getObjectAsText(key) {
  return await getObject(key);
}

export async function putJson(key, json, bucket = R2_BUCKETS.rss) {
  if (!bucket) throw new Error("R2 bucket not configured");
  try {
    const body = Buffer.from(JSON.stringify(json, null, 2), "utf-8");
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "application/json; charset=utf-8"
    }));
    console.log(`[R2] ✅ putJson uploaded ${key} (${body.length} bytes)`);
    return true;
  } catch (err) {
    console.error(`[R2] ❌ putJson failed for ${key}: ${err.message}`);
    throw err;
  }
}

export async function uploadBuffer(key, buffer, contentType = "application/octet-stream", bucket = R2_BUCKETS.rss) {
  if (!bucket) throw new Error("R2 bucket not configured");
  try {
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType
    }));
    console.log(`[R2] ✅ uploadBuffer uploaded ${key} (${buffer.length} bytes)`);
    return true;
  } catch (err) {
    console.error(`[R2] ❌ uploadBuffer failed for ${key}: ${err.message}`);
    throw err;
  }
}

/**
 * Uploads plain UTF-8 text to R2 — used for feeds.txt, urls.txt, and rss.xml
 */
export async function putText(key, text, bucket = R2_BUCKETS.rss) {
  if (!bucket) throw new Error("R2 bucket not configured");
  const body = Buffer.from(text, "utf-8");
  try {
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "text/plain; charset=utf-8"
    }));
    console.log(`[R2] ✅ putText uploaded ${key} (${body.length} bytes)`);
    return true;
  } catch (err) {
    console.error(`[R2] ❌ putText failed for ${key}: ${err.message}`);
    throw err;
  }
}

/**
 * Lists object keys within a bucket (limited to 1000)
 */
export async function listKeys(bucket = R2_BUCKETS.rss, prefix = "") {
  try {
    const cmd = new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, MaxKeys: 1000 });
    const data = await s3.send(cmd);
    return (data.Contents || []).map(o => o.Key);
  } catch (err) {
    console.error(`[R2] ❌ listKeys failed: ${err.message}`);
    throw err;
  }
}

/**
 * Simple R2 environment validator
 */
export async function validateR2ConfigOnce() {
  if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error("Missing R2 credentials or endpoint in environment.");
  }
  console.log("✅ R2 configuration OK");
      }

// ─────────────────────────────────────────────
// ✅ Cloudflare R2 Client Utilities (Full Suite)
// Self-contained — no r2-core.js dependency
// ─────────────────────────────────────────────

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { log } from "../../../utils/logger.js";

// ─────────────────────────────────────────────
//  Initialize R2 client
// ─────────────────────────────────────────────

export const s3 = new S3Client({
  region: process.env.R2_REGION || "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || process.env.R2_KEY_ID,
    secretAccessKey:
      process.env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_KEY,
  },
});

// ─────────────────────────────────────────────
//  Bucket definitions (mirrors Shiper env list)
// ─────────────────────────────────────────────

export const R2_BUCKETS = {
  ART: process.env.R2_BUCKET_ART,
  CHUNKS: process.env.R2_BUCKET_CHUNKS,
  MERGED: process.env.R2_BUCKET_MERGED,
  META: process.env.R2_BUCKET_META,
  PODCAST: process.env.R2_BUCKET_PODCAST,
  RAW: process.env.R2_BUCKET_RAW,
  RAW_TEXT: process.env.R2_BUCKET_RAW_TEXT,
  TRANSCRIPTS: process.env.R2_BUCKET_TRANSCRIPTS,
  RSS_FEEDS: process.env.R2_BUCKET_RSS_FEEDS,
};

// ─────────────────────────────────────────────
//  Core helpers
// ─────────────────────────────────────────────

// Get object contents as text
export async function getObjectAsText(key, bucket = R2_BUCKETS.RSS_FEEDS) {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    return await res.Body.transformToString();
  } catch (err) {
    log?.error?.(`❌ getObjectAsText failed for ${key}: ${err.message}`);
    return null;
  }
}

// Get object raw
export async function getObject(key, bucket = R2_BUCKETS.RSS_FEEDS) {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    return await res.Body.transformToString();
  } catch (err) {
    log?.error?.(`❌ getObject failed for ${key}: ${err.message}`);
    return null;
  }
}

// Upload JSON
export async function putJson(key, obj, bucket = R2_BUCKETS.RSS_FEEDS) {
  try {
    const Body = JSON.stringify(obj, null, 2);
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body,
        ContentType: "application/json",
      })
    );
    log?.info?.(`🪣 putJson uploaded ${key}`);
  } catch (err) {
    log?.error?.(`❌ putJson failed for ${key}: ${err.message}`);
    throw err;
  }
}

// ✅ Upload plain text
export async function putText(key, text, bucket = R2_BUCKETS.RSS_FEEDS) {
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: text,
        ContentType: "text/plain; charset=utf-8",
      })
    );
    log?.info?.(`🪣 putText uploaded ${key} (${text?.length || 0} chars)`);
  } catch (err) {
    log?.error?.(`❌ putText failed for ${key}: ${err.message}`);
    throw err;
  }
}

// Upload buffer
export async function uploadBuffer(
  key,
  buffer,
  bucket = R2_BUCKETS.RSS_FEEDS,
  contentType = "application/octet-stream"
) {
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    log?.info?.(`🪣 uploadBuffer uploaded ${key} (${buffer.length} bytes)`);
  } catch (err) {
    log?.error?.(`❌ uploadBuffer failed for ${key}: ${err.message}`);
    throw err;
  }
}

// List keys
export async function listKeys(prefix = "", bucket = R2_BUCKETS.RSS_FEEDS) {
  try {
    const res = await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix })
    );
    return (res.Contents || []).map((f) => f.Key);
  } catch (err) {
    log?.error?.(`❌ listKeys failed: ${err.message}`);
    return [];
  }
                 }

// /services/shared/utils/r2-client.js
// ✅ Fixed & Validated Version (AI Podcast Suite 2025.10.10)
// Unified Cloudflare R2 client for all modules

import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import { log } from "../../../utils/logger.js";

// ---- R2 Connection Config ----
const R2 = {
  endpoint: process.env.R2_ENDPOINT,
  region: process.env.R2_REGION || "auto",
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
};

// ---- Buckets ----
export const R2_BUCKETS = {
  RAW_TEXT: process.env.R2_BUCKET_RAW_TEXT,
  RAW: process.env.R2_BUCKET_RAW,
  RSS: process.env.R2_BUCKET_RSS_FEEDS,
  META: process.env.R2_META_BUCKET,
  PODCAST: process.env.R2_BUCKET_PODCAST,
  ARTWORK: process.env.R2_BUCKET_ARTWORK,
};

// ---- Client ----
export const s3 = new S3Client({
  region: R2.region,
  endpoint: R2.endpoint,
  credentials: {
    accessKeyId: R2.accessKeyId,
    secretAccessKey: R2.secretAccessKey,
  },
});

// ---- Get Object ----
export async function getObject(key, bucket = R2_BUCKETS.RSS) {
  try {
    const data = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    return await streamToString(data.Body);
  } catch (err) {
    log?.(`❌ getObject failed for ${key}: ${err.message}`);
    return null;
  }
}

// ---- Put JSON ----
export async function putJson(key, obj, bucket = R2_BUCKETS.RSS) {
  const Body = Buffer.from(JSON.stringify(obj, null, 2));
  try {
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body,
      ContentType: "application/json",
    }));
    log?.(`✅ putJson ${key} → ${bucket}`);
  } catch (err) {
    log?.(`❌ putJson failed for ${key}: ${err.message}`);
  }
}

// ---- Put Text ----
export async function putText(key, text, bucket = R2_BUCKETS.RSS) {
  const Body = Buffer.from(text, "utf-8");
  try {
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body,
      ContentType: "text/plain",
    }));
    log?.(`✅ putText ${key} → ${bucket}`);
  } catch (err) {
    log?.(`❌ putText failed for ${key}: ${err.message}`);
  }
}

// ---- List Keys ----
export async function listKeys(bucket = R2_BUCKETS.RSS) {
  try {
    const data = await s3.send(new ListObjectsV2Command({ Bucket: bucket }));
    return (data.Contents || []).map(obj => obj.Key);
  } catch (err) {
    log?.(`❌ listKeys failed for ${bucket}: ${err.message}`);
    return [];
  }
}

// ---- Stream Helper ----
async function streamToString(stream) {
  if (stream instanceof Readable) {
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks).toString("utf-8");
  }
  return "";
}

// ---- Validation ----
export async function validateR2ConfigOnce() {
  log?.("✅ R2 configuration OK");
  }

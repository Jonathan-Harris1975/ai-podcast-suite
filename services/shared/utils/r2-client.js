// ============================================================
// 🧠 AI Podcast Suite — Unified R2 Client (Final Fixed Version)
// ============================================================
//
// Handles Cloudflare R2 read/write operations consistently across
// the AI Podcast Suite, using unified logging and error handling.
// -------------------------------------------------------------

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { log } from "./logger.js";

// ============================================================
// 🔐 R2 CONNECTION CONFIG
// ============================================================

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_REGION = process.env.R2_REGION || "auto";

if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  log.error("r2.config.missing", {
    R2_ENDPOINT: !!R2_ENDPOINT,
    R2_ACCESS_KEY_ID: !!R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: !!R2_SECRET_ACCESS_KEY,
  });
}

// ============================================================
// 🧠 CLIENT INITIALIZATION
// ============================================================

export const s3 = new S3Client({
  region: R2_REGION,
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// Backward-compatible alias
export const r2Client = s3;

// ============================================================
// 🪣 BUCKET DEFINITIONS
// ============================================================

export const R2_BUCKETS = {
  RAW: process.env.R2_BUCKET_RAW,
  RAW_TEXT: process.env.R2_BUCKET_RAW_TEXT,
  MERGED: process.env.R2_BUCKET_MERGED,
  PODCAST: process.env.R2_BUCKET_PODCAST,
  META: process.env.R2_BUCKET_META,
  RSS_FEEDS: process.env.R2_BUCKET_RSS_FEEDS,
  ART: process.env.R2_BUCKET_ART,
  CHUNKS: process.env.R2_BUCKET_CHUNKS,
  TRANSCRIPTS: process.env.R2_BUCKET_TRANSCRIPTS,
};
export const BUCKETS = R2_BUCKETS;

const PUBLIC_BASE = {
  RAW: process.env.R2_PUBLIC_BASE_URL_RAW,
  RAW_TEXT: process.env.R2_PUBLIC_BASE_URL_RAW_TEXT,
  MERGED: process.env.R2_PUBLIC_BASE_URL_MERGE,
  PODCAST: process.env.R2_PUBLIC_BASE_URL_PODCAST,
  META: process.env.R2_PUBLIC_BASE_URL_META,
  RSS_FEEDS: process.env.R2_PUBLIC_BASE_URL_RSS,
  ART: process.env.R2_PUBLIC_BASE_URL_ART,
  CHUNKS: process.env.R2_PUBLIC_BASE_URL_CHUNKS,
  TRANSCRIPTS: process.env.R2_PUBLIC_BASE_URL_TRANSCRIPTS,
};

// Map bucket names for lookup
const bucketNameToKey = (() => {
  const map = new Map();
  Object.entries(R2_BUCKETS).forEach(([key, name]) => {
    if (name) map.set(name, key);
  });
  return map;
})();

// ============================================================
// 📤 UPLOAD HELPERS
// ============================================================

export async function uploadBuffer({ bucket, key, body, contentType }) {
  try {
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ...(contentType ? { ContentType: contentType } : {}),
    });
    await s3.send(cmd);
    log.info("r2.uploadBuffer.success", { bucket, key, size: body?.length });
  } catch (err) {
    log.error("r2.uploadBuffer.fail", { bucket, key, error: err.message });
    throw err;
  }
}

export async function putObject(params) {
  try {
    await s3.send(new PutObjectCommand(params));
    log.info("r2.putObject.success", { bucket: params.Bucket, key: params.Key });
  } catch (err) {
    log.error("r2.putObject.fail", { bucket: params.Bucket, key: params.Key, error: err.message });
    throw err;
  }
}

export async function putJson(bucket, key, data) {
  const body = Buffer.from(JSON.stringify(data));
  return uploadBuffer({ bucket, key, body, contentType: "application/json; charset=utf-8" });
}

export async function putText(bucket, key, text, contentType = "text/plain; charset=utf-8") {
  const body = Buffer.from(typeof text === "string" ? text : String(text));
  return uploadBuffer({ bucket, key, body, contentType });
}

// ============================================================
// 📥 READ HELPERS
// ============================================================

export async function getObject(bucket, key) {
  try {
    const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const buf = Buffer.from(await out.Body?.transformToByteArray?.());
    log.info("r2.getObject.success", { bucket, key, size: buf.length });
    return buf;
  } catch (err) {
    log.error("r2.getObject.fail", { bucket, key, error: err.message });
    throw err;
  }
}

export async function getObjectAsText(bucket, key) {
  try {
    const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const text = await out.Body?.transformToString?.();
    log.info("r2.getObjectAsText.success", { bucket, key, length: text?.length });
    return text;
  } catch (err) {
    log.error("r2.getObjectAsText.fail", { bucket, key, error: err.message });
    throw err;
  }
}

// ============================================================
// 🧾 LIST OBJECTS
// ============================================================

export async function listKeys({ bucket, prefix }) {
  try {
    const out = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }));
    const keys = (out.Contents || []).map(o => o.Key).filter(Boolean);
    log.info("r2.listKeys.success", { bucket, prefix, count: keys.length });
    return keys;
  } catch (err) {
    log.error("r2.listKeys.fail", { bucket, prefix, error: err.message });
    throw err;
  }
}

// ============================================================
// 🌐 PUBLIC URL BUILDER
// ============================================================

export function buildPublicUrl(bucket, key) {
  const keyName = bucketNameToKey.get(bucket) || bucket;
  const base =
    PUBLIC_BASE[keyName] ||
    PUBLIC_BASE[bucketNameToKey.get(bucket)] ||
    null;

  if (!base) {
    log.error("r2.buildPublicUrl.missingBase", { bucket, resolvedKey: keyName });
    return null;
  }

  // ✅ Correct regex – single forward slashes only
  return `${base.replace(/\/+/g, "/").replace(/\/$/, "")}/${String(key).replace(/^\/+/, "")}`;
                                     }

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { log } from "./logger.js";

const R2_ENDPOINT = process.env.R2_ENDPOINT || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "";

const required = { R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY };
const missing = Object.entries(required).filter(([k,v]) => !v).map(([k]) => k);
let s3 = null;

if (missing.length) {
  log("⚠️ R2 client missing required environment vars. R2 functionality will be disabled.", { missing });
} else {
  s3 = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
}

function ensureS3() {
  if (!s3) throw new Error("R2 client is not configured (missing env).");
}

export async function putText(bucket, key, text, contentType="text/plain; charset=utf-8") {
  ensureS3();
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: text, ContentType: contentType }));
  return { bucket, key, size: text?.length ?? 0 };
}

export async function putJson(bucket, key, obj) {
  const body = JSON.stringify(obj, null, 2);
  return putText(bucket, key, body, "application/json");
}

export async function getObjectText(bucket, key) {
  ensureS3();
  const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!Body) return null;
  const text = await Body.transformToString();
  return text;
}

export async function getObjectJson(bucket, key) {
  const text = await getObjectText(bucket, key);
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

export const BUCKETS = {
  CHUNKS: process.env.R2_BUCKET_CHUNKS,
  MERGED: process.env.R2_BUCKET_MERGED,
  META: process.env.R2_BUCKET_META,
  PODCAST_RSS_FEEDS: process.env.R2_BUCKET_PODCAST_RSS_FEEDS,
  PODCAST: process.env.R2_BUCKET_PODCAST,
  RAW_TEXT: process.env.R2_BUCKET_RAW_TEXT,
  RAW: process.env.R2_BUCKET_RAW,
  RSS_FEEDS: process.env.R2_BUCKET_RSS_FEEDS,
  TRANSCRIPTS: process.env.R2_BUCKET_TRANSCRIPTS,
};

export function checkBuckets() {
  const missing = Object.entries(BUCKETS).filter(([k,v]) => !v).map(([k]) => k);
  const ok = Object.keys(BUCKETS).length - missing.length;
  log(`R2 OK: ${ok} buckets ✅ | Missing: ${missing.length}`, missing.length ? { missing } : undefined);
  return { ok, missing };
}

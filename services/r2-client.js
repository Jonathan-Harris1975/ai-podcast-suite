// services/r2-client.js — unified Cloudflare R2 (S3) client (no ping)
import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";

const {
  R2_ENDPOINT,
  R2_REGION = "auto",
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,

  R2_BUCKET_RSS_FEEDS,
  R2_BUCKET_RAW_TEXT,
  R2_BUCKET_RAW,          // podcast-chunks
  R2_BUCKET_MERGED,       // podcast-merged
  R2_BUCKET_PODCAST,      // final podcasts
  R2_BUCKET_META,         // artwork/meta

  R2_PUBLIC_BASE_URL_RSS_FEEDS,
  R2_PUBLIC_BASE_URL_RAW_TEXT,
  R2_PUBLIC_BASE_URL_RAW,
  R2_PUBLIC_BASE_URL_MERGED,
  R2_PUBLIC_BASE_URL_PODCAST,
  R2_PUBLIC_BASE_URL_META
} = process.env;

export const BUCKETS = {
  RSS_FEEDS: R2_BUCKET_RSS_FEEDS,
  RAW_TEXT:  R2_BUCKET_RAW_TEXT,
  RAW:       R2_BUCKET_RAW,
  MERGED:    R2_BUCKET_MERGED,
  PODCAST:   R2_BUCKET_PODCAST,
  META:      R2_BUCKET_META,
};

const PUBLIC_BASE = {
  [R2_BUCKET_RSS_FEEDS]: R2_PUBLIC_BASE_URL_RSS_FEEDS,
  [R2_BUCKET_RAW_TEXT]:  R2_PUBLIC_BASE_URL_RAW_TEXT,
  [R2_BUCKET_RAW]:       R2_PUBLIC_BASE_URL_RAW,
  [R2_BUCKET_MERGED]:    R2_PUBLIC_BASE_URL_MERGED,
  [R2_BUCKET_PODCAST]:   R2_PUBLIC_BASE_URL_PODCAST,
  [R2_BUCKET_META]:      R2_PUBLIC_BASE_URL_META
};

export const s3 = new S3Client({
  endpoint: R2_ENDPOINT,
  region: R2_REGION,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY
  },
  forcePathStyle: true
});

// Build public URL from env-mapped base URL (no guessing)
export function buildPublicUrl(bucket, key) {
  const base = PUBLIC_BASE[bucket];
  if (!base) return null;
  return `${base.replace(/\/$/,"")}/${key}`;
}

// --- Minimal one-shot validator (no ping/retries) ---
export async function validateR2ConfigOnce() {
  // Only check credentials/buckets; do not list/ping
  const checkBucket = BUCKETS.RSS_FEEDS || BUCKETS.RAW_TEXT || BUCKETS.RAW || BUCKETS.PODCAST || BUCKETS.MERGED || BUCKETS.META;
  if (!checkBucket) return;
  try {
    await s3.send(new HeadBucketCommand({ Bucket: checkBucket }));
    console.log("✅ R2 configuration OK");
  } catch (err) {
    console.error("❌ R2 configuration failed:", err?.message || err);
    throw err;
  }
}

// --- Thin helpers ---
export async function uploadBuffer({ bucket, key, body, contentType }) {
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType });
  await s3.send(cmd);
  return buildPublicUrl(bucket, key);
}

export async function listKeys({ bucket, prefix = "" }) {
  const out = [];
  let token;
  do {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }));
    (res.Contents || []).forEach(o => out.push(o.Key));
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return out;
}

export async function getObjectAsText({ bucket, key }) {
  const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return await res.Body.transformToString("utf-8");
}

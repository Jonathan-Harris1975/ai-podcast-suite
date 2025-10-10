// services/r2-client.js — unified R2 client (ESM) with single validation (Option B)
import { S3Client, HeadBucketCommand, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

const {
  R2_ENDPOINT,
  R2_REGION,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_RSS_FEEDS,
  R2_BUCKET_RAW_TEXT,
  R2_BUCKET_PODCAST,
  R2_BUCKET_META,
  R2_BUCKET_RAW,
  R2_BUCKET_MERGED
} = process.env;

export const R2_BUCKETS = {
  RSS_FEEDS: R2_BUCKET_RSS_FEEDS,
  RAW_TEXT: R2_BUCKET_RAW_TEXT,
  PODCAST: R2_BUCKET_PODCAST,
  META: R2_BUCKET_META,
  RAW: R2_BUCKET_RAW,
  MERGED: R2_BUCKET_MERGED
};

export const s3 = new S3Client({
  region: R2_REGION || "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY
  },
  forcePathStyle: true
});

// Simplified validation function - no ping, no retries, just silent validation
export async function validateR2Once() {
  try {
    if (R2_BUCKETS.RSS_FEEDS) {
      await s3.send(new HeadBucketCommand({ Bucket: R2_BUCKETS.RSS_FEEDS }));
      console.log(`✅ R2 connection validated`);
    } else {
      console.log("⚠️ No R2 bucket specified for validation (skipped).");
    }
  } catch (err) {
    // Silent failure - don't block startup
    console.warn("⚠️ R2 validation skipped:", err?.message || String(err));
  }
}

// helpers
export async function uploadBuffer({ bucket, key, body, contentType }) {
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
  return { bucket, key };
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

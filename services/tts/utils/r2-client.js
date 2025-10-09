import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { log } from "./logger.js";

const endpoint =
  process.env.R2_ENDPOINT ||
  (process.env.R2_ACCOUNT_ID
    ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : undefined);

if (!endpoint) {
  log.warn("⚠️ R2 endpoint not set. Set R2_ENDPOINT or R2_ACCOUNT_ID.");
}

const s3 = new S3Client({
  region: "auto",
  endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_KEY
  }
});

const BUCKETS = {
  RAW_TEXT: process.env.R2_BUCKET_RAW_TEXT,
  RAW: process.env.R2_BUCKET_RAW,
  MERGED: process.env.BUCKET_MERGED || process.env.R2_BUCKET_MERGED,
  PODCAST: process.env.R2_BUCKET_PODCAST,
  META: process.env.R2_META_BUCKET
};

const PUBLIC_BASES = {
  [BUCKETS.RAW_TEXT]: process.env.R2_PUBLIC_BASE_URL_RAW_TEXT,
  [BUCKETS.RAW]: process.env.R2_PUBLIC_BASE_URL_RAW,
  [BUCKETS.MERGED]: process.env.R2_PUBLIC_BASE_URL_MERGE,
  [BUCKETS.PODCAST]: process.env.R2_PUBLIC_BASE_URL_PODCAST,
  [BUCKETS.META]: process.env.R2_PUBLIC_BASE_URL_META
};

export function buildPublicUrl(bucket, key) {
  const base = PUBLIC_BASES[bucket];
  if (!base) return null;
  return `${base.replace(/\/+$/, "")}/${key.replace(/^\/+/, "")}`;
}

export async function uploadBuffer({ bucket, key, body, contentType }) {
  if (!bucket) throw new Error("uploadBuffer: bucket is required");
  if (!key) throw new Error("uploadBuffer: key is required");
  if (body == null) throw new Error("uploadBuffer: body is required");

  log.info({ bucket, key }, "⬆️ Uploading to R2");

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType
    })
  );

  const url = buildPublicUrl(bucket, key);
  if (url) {
    log.info({ url }, "✅ R2 object public URL");
  } else {
    log.warn({ bucket, key }, "⚠️ No public base URL configured for this bucket");
  }
  return { bucket, key, url };
}

export async function listKeys({ bucket, prefix }) {
  if (!bucket) throw new Error("listKeys: bucket is required");
  const out = [];
  let ContinuationToken;

  do {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix || "",
        ContinuationToken
      })
    );
    (res.Contents || []).forEach((obj) => out.push(obj.Key));
    ContinuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (ContinuationToken);

  log.info({ bucket, prefix, count: out.length }, "📦 R2 listKeys");
  return out;
}

export async function getObjectAsText({ bucket, key }) {
  const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return await res.Body.transformToString("utf-8");
}

export async function downloadToFile({ bucket, key, filepath }) {
  const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const fs = await import("node:fs");
  const ws = fs.createWriteStream(filepath);
  await new Promise((resolve, reject) => {
    res.Body.pipe(ws);
    res.Body.on("error", reject);
    ws.on("finish", resolve);
    ws.on("error", reject);
  });
  return filepath;
}

export const R2_BUCKETS = BUCKETS;
export default s3;

// Cloudflare R2 client (S3-compatible) — shared utils
import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const {
  R2_ENDPOINT,
  R2_REGION,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_RSS_FEEDS,
} = process.env;

if (!R2_ENDPOINT) {
  process.stdout.write(JSON.stringify({ time: new Date().toISOString(), message: "⚠️ R2_ENDPOINT is not set" }) + "\n");
}

export const s3 = new S3Client({
  region: R2_REGION || "auto",
  endpoint: R2_ENDPOINT,
  forcePathStyle: true,
  credentials: (R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) ? {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  } : undefined,
});

export const R2_BUCKETS = {
  rss: R2_BUCKET_RSS_FEEDS,
};

async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
}

export async function getObject(key, bucket = R2_BUCKET_RSS_FEEDS) {
  if (!bucket) throw new Error("R2 bucket (R2_BUCKET_RSS_FEEDS) not configured");
  const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key })).catch(() => null);
  if (!out || !out.Body) return null;
  return await streamToString(out.Body);
}

export const getObjectAsText = getObject;

export async function putJson(key, obj, bucket = R2_BUCKET_RSS_FEEDS) {
  if (!bucket) throw new Error("R2 bucket (R2_BUCKET_RSS_FEEDS) not configured");
  const Body = Buffer.from(JSON.stringify(obj, null, 2), "utf-8");
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body, ContentType: "application/json" }));
}

export async function putText(key, text, bucket = R2_BUCKET_RSS_FEEDS) {
  if (!bucket) throw new Error("R2 bucket (R2_BUCKET_RSS_FEEDS) not configured");
  const Body = Buffer.from(String(text), "utf-8");
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body, ContentType: "text/plain; charset=utf-8" }));
}

export async function uploadBuffer(key, buffer, contentType = "application/octet-stream", bucket = R2_BUCKET_RSS_FEEDS) {
  if (!bucket) throw new Error("R2 bucket (R2_BUCKET_RSS_FEEDS) not configured");
  const Body = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body, ContentType: contentType }));
}

export async function listKeys(prefix = "", bucket = R2_BUCKET_RSS_FEEDS) {
  if (!bucket) throw new Error("R2 bucket (R2_BUCKET_RSS_FEEDS) not configured");
  const resp = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }));
  return (resp.Contents || []).map(o => o.Key);
}

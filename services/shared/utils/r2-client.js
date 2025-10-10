// services/shared/utils/r2-client.js
import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const ENDPOINT = process.env.R2_S3_ENDPOINT || process.env.R2_ENDPOINT;
const REGION = process.env.R2_REGION || "auto";
const BUCKET_RSS = process.env.R2_BUCKET_RSS_FEEDS;

export const R2_BUCKETS = {
  RSS: BUCKET_RSS,
};

export const s3 = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export async function getObject(key) {
  const out = await s3.send(new GetObjectCommand({ Bucket: BUCKET_RSS, Key: key }));
  return await out.Body.transformToString();
}
export async function getObjectAsText(key) {
  return getObject(key);
}
export async function putJson(key, obj) {
  const Body = JSON.stringify(obj, null, 2);
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET_RSS,
    Key: key,
    Body,
    ContentType: "application/json; charset=utf-8",
    CacheControl: "no-cache",
  }));
}
export async function uploadBuffer(key, buffer, contentType = "application/octet-stream") {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET_RSS,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: "no-cache",
  }));
}
export async function listKeys(prefix = "") {
  const r = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET_RSS, Prefix: prefix }));
  return (r.Contents || []).map(o => o.Key);
}

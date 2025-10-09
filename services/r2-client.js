/**
 * Cloudflare R2 Client – Master Shared Instance (no ping/retry)
 */
import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import fs from "node:fs";

const endpoint = process.env.R2_ENDPOINT || (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined);
if (!endpoint) 

export const s3 = new S3Client({
  region: process.env.R2_REGION || "auto",
  endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_KEY,
  },
});

export const R2_BUCKETS = {
  RSS_FEEDS: process.env.R2_BUCKET_RSS_FEEDS,
  RAW_TEXT: process.env.R2_BUCKET_RAW_TEXT,
  RAW: process.env.R2_BUCKET_RAW,
  MERGED: process.env.R2_BUCKET_MERGED,
  PODCAST: process.env.R2_BUCKET_PODCAST,
  META: process.env.R2_BUCKET_META,
};

const PUBLIC_BASES = {
  [R2_BUCKETS.RSS_FEEDS]: process.env.R2_PUBLIC_BASE_URL_RSS_FEEDS,
  [R2_BUCKETS.RAW_TEXT]: process.env.R2_PUBLIC_BASE_URL_RAW_TEXT,
  [R2_BUCKETS.RAW]: process.env.R2_PUBLIC_BASE_URL_RAW,
  [R2_BUCKETS.MERGED]: process.env.R2_PUBLIC_BASE_URL_MERGED,
  [R2_BUCKETS.PODCAST]: process.env.R2_PUBLIC_BASE_URL_PODCAST,
  [R2_BUCKETS.META]: process.env.R2_PUBLIC_BASE_URL_META,
};

export function buildPublicUrl(bucket, key) {
  const base = PUBLIC_BASES[bucket];
  if (!base) return null;
  return `${base.replace(/\/+$/, "")}/${String(key).replace(/^\/+/, "")}`;
}

export async function validateR2Once(){ try{ await s3.send(new HeadBucketCommand({ Bucket: R2_BUCKETS.RSS_FEEDS })); }catch(_){} }));
    
  } catch (err) {
    
    
    
    if (err.$metadata?.httpStatusCode) 
  }
  
}

export async function uploadBuffer({ bucket, key, body, contentType }) {
  if (!bucket || !key || body == null) throw new Error("uploadBuffer: bucket, key, and body are required.");
  
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
  const url = buildPublicUrl(bucket, key);
  if (url) 
  else 
  return { bucket, key, url };
}

export async function listKeys({ bucket, prefix = "" }) {
  const out = [];
  let token;
  do {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }));
    (res.Contents || []).forEach((o) => out.push(o.Key));
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  
  return out;
}

export async function getObjectAsText({ bucket, key }) {
  const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return await res.Body.transformToString("utf-8");
}

export async function downloadToFile({ bucket, key, filepath }) {
  const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const ws = fs.createWriteStream(filepath);
  await new Promise((resolve, reject) => {
    res.Body.pipe(ws);
    res.Body.on("error", reject);
    ws.on("finish", resolve);
    ws.on("error", reject);
  });
  return filepath;
}

export default s3;

// /services/shared/utils/r2-client.js
// Cloudflare R2 unified client for all Podcast Suite modules

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "node:stream";
import { log } from "../../../utils/logger.js";

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

// ---- S3 Client ----
export const s3 = new S3Client({
  region: R2.region,
  endpoint: R2.endpoint,
  credentials: {
    accessKeyId: R2.accessKeyId,
    secretAccessKey: R2.secretAccessKey,
  },
});

// ---- Helpers ----
export async function getObject(key, bucket = R2_BUCKETS.RSS) {
  try {
    const data = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );
    return await streamToString(data.Body);
  } catch (err) {
    log?.(`❌ getObject failed for ${key}: ${err.message}`);
    return null;
      }

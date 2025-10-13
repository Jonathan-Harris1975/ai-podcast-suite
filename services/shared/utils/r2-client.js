// services/shared/utils/r2-client.js
// Cloudflare R2 utilities – used by AI Podcast Suite

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { info, error } from "./logger.js";

// ────────────────────────────────────────────────
// R2 Configuration
// ────────────────────────────────────────────────
const R2_ENDPOINT = process.env.R2_ENDPOINT || "https://<your-account-id>.r2.cloudflarestorage.com";
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_REGION = process.env.R2_REGION || "auto";

export const r2Client = new S3Client({
  region: R2_REGION,
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
});

// ────────────────────────────────────────────────
// Utility Functions
// ────────────────────────────────────────────────
export async function getObject(bucket, key) {
  try {
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    const res = await r2Client.send(cmd);
    const body = await res.Body?.transformToString?.("utf-8");
    return body || null;
  } catch (err) {
    if (err.name !== "NoSuchKey")
      error("r2.getObject.fail", { bucket, key, error: err.message });
    return null;
  }
}

export async function putJson(bucket, key, data) {
  try {
    const body = JSON.stringify(data, null, 2);
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "application/json; charset=utf-8",
    });
    await r2Client.send(cmd);
    info("r2.putJson.success", { bucket, key });
  } catch (err) {
    error("r2.putJson.fail", { bucket, key, error: err.message });
    throw err;
  }
}

export async function putText(bucket, key, text, contentType = "text/plain; charset=utf-8") {
  try {
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: text,
      ContentType: contentType,
    });
    await r2Client.send(cmd);
    info("r2.putText.success", { bucket, key });
  } catch (err) {
    error("r2.putText.fail", { bucket, key, error: err.message });
    throw err;
  }
    }

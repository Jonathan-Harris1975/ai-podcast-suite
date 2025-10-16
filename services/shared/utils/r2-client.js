// ============================================================
// 🧠 AI Podcast Suite — Unified R2 Client (Fixed)
// ============================================================

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { info, error } from "./logger.js";

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_REGION = process.env.R2_REGION || "auto";

export const s3 = new S3Client({
  region: R2_REGION,
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export function buildPublicUrl(bucket, key) {
  const PUBLIC_BASE = process.env.R2_PUBLIC_BASE_URL_PODCAST || "";
  if (!PUBLIC_BASE) {
    error("r2.buildPublicUrl.missingBase", { bucket });
    return null;
  }
  return `${PUBLIC_BASE.replace(/\/+/g, "/").replace(/\/$/, "")}/${String(key).replace(/^\/+/, "")}`;
}

// utils/r2-client.js
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { log } from "../../../utils/logger.js";

const endpoint = process.env.R2_ENDPOINT;
const region = process.env.R2_REGION || "auto";
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_RSS_FEEDS || "rss-feeds";

if (!endpoint) throw new Error("❌ Missing R2_ENDPOINT in environment");
if (!accessKeyId || !secretAccessKey)
  throw new Error("❌ Missing R2_ACCESS_KEY_ID or R2_SECRET_ACCESS_KEY");

export const r2Client = new S3Client({
  region,
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
});

log.info(`☁️ Connected to Cloudflare R2 bucket: ${bucket}`);

async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
}

// ---------------- Core Operations ----------------
export async function getObject(key) {
  try {
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    const data = await r2Client.send(cmd);
    return await streamToString(data.Body);
  } catch (err) {
    throw new Error(`GET ${key} failed: ${err.message}`);
  }
}

export async function putText(key, content) {
  try {
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: content,
      ContentType: "text/plain; charset=utf-8",
    });
    await r2Client.send(cmd);
    log.info(`✅ PUT ${key} → ${bucket}`);
  } catch (err) {
    throw new Error(`PUT ${key} failed: ${err.message}`);
  }
}

export async function listObjects(prefix = "") {
  try {
    const cmd = new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix });
    const res = await r2Client.send(cmd);
    return res.Contents?.map((o) => o.Key) || [];
  } catch (err) {
    throw new Error(`LIST failed: ${err.message}`);
  }
}

export async function verifyBucket() {
  const cmd = new HeadBucketCommand({ Bucket: bucket });
  await r2Client.send(cmd);
  log.info(`📦 Verified R2 bucket exists: ${bucket}`);
  return true;
}

// ---------------- Safe Presigned URL Generator ----------------
export async function getSignedUrlForKey(key, expiresIn = 3600) {
  // Try to load presigner safely
  let getSignedUrl;
  try {
    const presignerPath = "@aws-sdk/s3-request-presigner";
    const presigner = await import(presignerPath).catch(() => null);

    if (presigner && typeof presigner.getSignedUrl === "function") {
      getSignedUrl = presigner.getSignedUrl;
      log.info("🔐 Presigner loaded successfully.");
    } else {
      log.warn("⚙️ Presigner module not installed – safe mode active.");
      return null;
    }
  } catch (err) {
    log.warn(`⚙️ Presigner skipped (safe mode): ${err.message}`);
    return null;
  }

  try {
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(r2Client, cmd, { expiresIn });
    return url;
  } catch (err) {
    log.error(`❌ Failed to generate signed URL for ${key}: ${err.message}`);
    return null;
  }
}
